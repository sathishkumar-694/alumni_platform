import { Router } from 'express';
import { queryMySQL } from '../../config/mysql.js';
import { verifyJWT } from '../../middleware/auth.middleware.js';
import { ApiResponse } from '../../shared/responseHelper.js';
import { asyncHandler } from '../../shared/asyncHandler.js';

const router = Router();

/** Ensure reassign_requests table exists */
export const ensureReassignRequestsSchema = async () => {
  await queryMySQL(`
    CREATE TABLE IF NOT EXISTS \`reassign_requests\` (
      \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      \`mentorship_id\` BIGINT UNSIGNED NOT NULL,
      \`student_id\` VARCHAR(50) NOT NULL,
      \`old_mentor_id\` VARCHAR(50) NOT NULL,
      \`reason\` TEXT NOT NULL,
      \`status\` ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
      \`admin_note\` TEXT,
      \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_rr_status (\`status\`),
      INDEX idx_rr_student (\`student_id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
};

/**
 * POST /api/v1/mentorship/reassign-request
 * Student creates a request to change mentor.
 */
router.post('/reassign-request', verifyJWT, asyncHandler(async (req, res) => {
  const { mentorshipId, reason } = req.body;
  const userId = req.user.id;
  if (!mentorshipId || !reason) {
    return res.status(400).json(new ApiResponse(400, null, 'Missing mentorshipId or reason'));
  }
  // Find current mentorship to get old mentor
  const rows = await queryMySQL('SELECT mentor_id FROM mentorships WHERE id = ? AND student_id = ?', [mentorshipId, userId]);
  if (!rows[0]) {
    return res.status(404).json(new ApiResponse(404, null, 'Mentorship not found'));
  }
  const oldMentorId = rows[0].mentor_id;
  await queryMySQL(
    `INSERT INTO \`reassign_requests\` (\`mentorship_id\`, \`student_id\`, \`old_mentor_id\`, \`reason\`)
     VALUES (?, ?, ?, ?)`,
    [mentorshipId, userId, oldMentorId, reason]
  );
  return res.status(201).json(new ApiResponse(201, null, 'Mentor change request submitted'));
}));

/**
 * GET /api/v1/mentorship/reassign-requests
 * Admin fetches all reassign requests.
 */
router.get('/reassign-requests', verifyJWT, asyncHandler(async (req, res) => {
  // Only allow admin role (simplified check)
  if (req.user.role !== 'ADMIN') return res.status(403).json(new ApiResponse(403, null, 'Forbidden'));
  const rows = await queryMySQL(`
    SELECT rr.id, rr.mentorship_id, rr.student_id, rr.old_mentor_id, rr.reason, rr.status, rr.admin_note,
           s.name AS student_name, s.email AS student_email,
           m.id AS mentorship_id,
           al.name AS mentor_name, al.email AS mentor_email
    FROM \`reassign_requests\` rr
    JOIN users s ON s.id = rr.student_id
    JOIN mentorships m ON m.id = rr.mentorship_id
    JOIN users al ON al.id = rr.old_mentor_id
    ORDER BY rr.created_at DESC`);
  return res.status(200).json(new ApiResponse(200, rows, 'Fetched reassign requests'));
}));

/**
 * POST /api/v1/mentorship/reassign/:requestId
 * Admin approves or rejects a reassign request.
 * Body: { action: 'APPROVE'|'REJECT', newMentorId?, adminNote? }
 */
router.post('/reassign/:requestId', verifyJWT, asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const { action, newMentorId, adminNote } = req.body;
  if (!action || (action === 'APPROVE' && !newMentorId)) {
    return res.status(400).json(new ApiResponse(400, null, 'Invalid payload'));
  }
  // Verify admin
  if (req.user.role !== 'ADMIN') return res.status(403).json(new ApiResponse(403, null, 'Forbidden'));

  // Fetch request
  const [reqRow] = await queryMySQL('SELECT * FROM \`reassign_requests\` WHERE id = ?', [requestId]);
  if (!reqRow) return res.status(404).json(new ApiResponse(404, null, 'Request not found'));

  if (action === 'APPROVE') {
    // Update mentorship record
    await queryMySQL('UPDATE mentorships SET mentor_id = ?, status = ? WHERE id = ?', [newMentorId, 'ACTIVE', reqRow.mentorship_id]);
    // Update request status
    await queryMySQL('UPDATE \`reassign_requests\` SET status = ?, admin_note = ?, updated_at = NOW() WHERE id = ?', ['APPROVED', adminNote || null, requestId]);
    return res.status(200).json(new ApiResponse(200, null, 'Mentor reassigned'));
  } else {
    // REJECT
    await queryMySQL('UPDATE \`reassign_requests\` SET status = ?, admin_note = ?, updated_at = NOW() WHERE id = ?', ['REJECTED', adminNote || null, requestId]);
    return res.status(200).json(new ApiResponse(200, null, 'Request rejected'));
  }
}));

export default router;
