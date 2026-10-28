import { queryMySQL } from '../../config/mysql.js';
import { ApiError } from '../../shared/ApiError.js';
import { ApiResponse } from '../../shared/responseHelper.js';
import { asyncHandler } from '../../shared/asyncHandler.js';
import { notificationsService } from '../notifications/notifications.service.js';
import { mentorshipRepository } from './mentorship.repository.js';

/**
 * Ensure the reassign_requests table exists.
 */
export const ensureReassignSchema = async () => {
  await queryMySQL(`
    CREATE TABLE IF NOT EXISTS \`reassign_requests\` (
      \`id\`              VARCHAR(60)  NOT NULL PRIMARY KEY,
      \`mentorship_id\`   VARCHAR(50)  NOT NULL,
      \`student_id\`      VARCHAR(50)  NOT NULL,
      \`old_mentor_id\`   VARCHAR(50)  NOT NULL,
      \`reason\`          TEXT         NOT NULL,
      \`status\`          ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
      \`admin_note\`      TEXT,
      \`created_at\`      DATETIME     DEFAULT CURRENT_TIMESTAMP,
      \`reviewed_at\`     DATETIME,
      INDEX idx_rr_student    (\`student_id\`),
      INDEX idx_rr_status     (\`status\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // Earlier versions created this table with numeric IDs and a numeric
  // mentorship_id. The current application uses string IDs (for example,
  // "am-...") from active_mentorships, so migrate those columns in place.
  const columns = await queryMySQL('SHOW COLUMNS FROM `reassign_requests`');
  const columnMap = new Map(columns.map(column => [column.Field, String(column.Type).toLowerCase()]));
  if (columnMap.get('id')?.includes('bigint')) {
    await queryMySQL('ALTER TABLE `reassign_requests` MODIFY COLUMN `id` VARCHAR(60) NOT NULL');
  }
  if (columnMap.get('mentorship_id')?.includes('bigint')) {
    await queryMySQL('ALTER TABLE `reassign_requests` MODIFY COLUMN `mentorship_id` VARCHAR(50) NOT NULL');
  }
  if (!columnMap.has('reviewed_at')) {
    await queryMySQL('ALTER TABLE `reassign_requests` ADD COLUMN `reviewed_at` DATETIME NULL');
  }
};

/**
 * POST /api/v1/mentorship/reassign-request
 * Student submits a request to change their assigned mentor.
 */
export const submitReassignRequest = asyncHandler(async (req, res) => {
  const { mentorshipId, reason } = req.body;
  const student = req.user;

  if (!mentorshipId || !reason?.trim()) {
    throw new ApiError(400, 'mentorshipId and reason are required');
  }
  if (reason.trim().length < 20) {
    throw new ApiError(400, 'Please provide a more detailed reason (at least 20 characters)');
  }

  // Verify student is part of this mentorship
  const rows = await queryMySQL('SELECT * FROM `active_mentorships` WHERE `id` = ?', [mentorshipId]);
  const mentorship = rows[0];
  if (!mentorship || String(mentorship.student_id) !== String(student.id)) {
    throw new ApiError(403, 'You are not part of this mentorship');
  }
  if (mentorship.status !== 'ACTIVE') {
    throw new ApiError(400, 'Can only request reassignment for active mentorships');
  }

  // Prevent duplicate pending requests
  const existing = await queryMySQL(
    'SELECT * FROM `reassign_requests` WHERE `mentorship_id` = ? AND `student_id` = ? AND `status` = ?',
    [mentorshipId, student.id, 'PENDING']
  );
  if (existing.length > 0) {
    throw new ApiError(400, 'You already have a pending mentor-change request for this mentorship');
  }

  const id = `rr-${Date.now()}`;
  await queryMySQL(
    'INSERT INTO `reassign_requests` (`id`, `mentorship_id`, `student_id`, `old_mentor_id`, `reason`) VALUES (?, ?, ?, ?, ?)',
    [id, mentorshipId, student.id, mentorship.mentor_id, reason.trim()]
  );

  // Notify all admins
  const admins = await queryMySQL("SELECT id FROM `users` WHERE `role` = 'ADMIN'");
  for (const admin of admins) {
    await notificationsService.createNotification({
      user_id: admin.id,
      type: 'REASSIGN_REQUEST',
      title: '⚠️ Mentor Change Request',
      desc: `${student.name} has requested a mentor change. Review in Admin panel.`,
      target_tab: 'admin_requests'
    }).catch(() => {});
  }

  return res.status(201).json(
    new ApiResponse(201, { id }, 'Mentor change request submitted. Admin will review it shortly.')
  );
});

/**
 * GET /api/v1/mentorship/reassign-requests
 * Admin gets all reassign requests.
 */
export const getReassignRequests = asyncHandler(async (req, res) => {
  const requests = await queryMySQL(
    `SELECT rr.*,
            u_s.name  AS student_name,  u_s.email  AS student_email,
            u_m.name  AS mentor_name,   u_m.email  AS mentor_email,
            am.domain_id
     FROM \`reassign_requests\` rr
     JOIN \`users\` u_s ON u_s.id = rr.student_id
     JOIN \`users\` u_m ON u_m.id = rr.old_mentor_id
     JOIN \`active_mentorships\` am ON am.id = rr.mentorship_id
     ORDER BY rr.created_at DESC`
  );

  return res.status(200).json(new ApiResponse(200, requests, 'Reassign requests fetched'));
});

/**
 * POST /api/v1/mentorship/reassign-requests/:requestId/review
 * Admin approves the request by ending the existing connection, or rejects it.
 */
export const adminReviewReassignRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const { action, adminNote } = req.body; // action: 'APPROVE' | 'REJECT'

  const rows = await queryMySQL('SELECT * FROM `reassign_requests` WHERE `id` = ?', [requestId]);
  const rr = rows[0];
  if (!rr) throw new ApiError(404, 'Reassign request not found');
  if (rr.status !== 'PENDING') throw new ApiError(400, 'Request already reviewed');

  if (action === 'APPROVE') {
    // Approving a change request ends the current connection. It does not
    // create a replacement mentorship; the student can request a new mentor later.
    const ended = await queryMySQL(
      'UPDATE `active_mentorships` SET `status` = ? WHERE `id` = ? AND `student_id` = ? AND `mentor_id` = ? AND `status` = ?',
      ['REASSIGNED', rr.mentorship_id, rr.student_id, rr.old_mentor_id, 'ACTIVE']
    );
    if (!ended.affectedRows) throw new ApiError(409, 'The active mentorship has already changed or ended');

    // Reduce old mentor capacity
    const oldProfile = await mentorshipRepository.getAlumniProfile(rr.old_mentor_id);
    if (oldProfile) {
      await mentorshipRepository.updateAlumniProfile(rr.old_mentor_id, {
        current_capacity: Math.max(0, (oldProfile.current_capacity || 1) - 1)
      });
    }

    // Notify student
    await notificationsService.createNotification({
      user_id: rr.student_id,
      type: 'REASSIGN_APPROVED',
      title: '✅ Mentor Change Approved',
      desc: 'Your mentor change request was approved. Your connection with your current mentor has ended. You can request a new mentor when you are ready.',
      target_tab: 'active_mentorships'
    }).catch(() => {});

    await notificationsService.createNotification({
      user_id: rr.old_mentor_id,
      type: 'MENTORSHIP_ENDED',
      title: 'Mentorship Connection Ended',
      desc: 'The student’s request to end this mentorship connection was approved.',
      target_tab: 'active_mentorships'
    }).catch(() => {});

    await queryMySQL(
      'UPDATE `reassign_requests` SET `status` = ?, `admin_note` = ?, `reviewed_at` = NOW() WHERE `id` = ?',
      ['APPROVED', adminNote || '', requestId]
    );

    return res.status(200).json(new ApiResponse(200, null, 'Mentor change request approved; current connection ended'));

  } else if (action === 'REJECT') {
    await queryMySQL(
      'UPDATE `reassign_requests` SET `status` = ?, `admin_note` = ?, `reviewed_at` = NOW() WHERE `id` = ?',
      ['REJECTED', adminNote || '', requestId]
    );

    await notificationsService.createNotification({
      user_id: rr.student_id,
      type: 'REASSIGN_REJECTED',
      title: '❌ Mentor Change Request Rejected',
      desc: adminNote ? `Your mentor change request was not approved. Admin note: ${adminNote}` : 'Your mentor change request was reviewed and not approved at this time.',
      target_tab: 'active_mentorships'
    }).catch(() => {});

    return res.status(200).json(new ApiResponse(200, null, 'Reassign request rejected'));
  } else {
    throw new ApiError(400, "action must be 'APPROVE' or 'REJECT'");
  }
});
