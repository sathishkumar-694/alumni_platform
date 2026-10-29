import { sessionsRepository } from './sessions.repository.js';
import { ApiError } from '../../shared/ApiError.js';
import { queryMySQL } from '../../config/mysql.js';
import { uploadToCloud } from '../../config/cloudinary.js';
import { notificationsService } from '../notifications/notifications.service.js';

export const ensureMeetingWorkspaceSchema = async () => {
  await queryMySQL(`
    CREATE TABLE IF NOT EXISTS \`meeting_workspaces\` (
      \`session_id\` VARCHAR(100) NOT NULL,
      \`mentorship_id\` VARCHAR(100) NOT NULL,
      \`code_content\` MEDIUMTEXT NULL,
      \`strokes_json\` MEDIUMTEXT NULL,
      \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`mentorship_id\`, \`session_id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
};

export class SessionsService {
  async _assertMeetingParticipant(user, mentorshipId, sessionId) {
    if (!sessionId || sessionId.length > 100) {
      throw new ApiError(400, 'A valid meeting session ID is required');
    }

    const mentorship = await sessionsRepository.findActiveMentorshipById(mentorshipId);
    if (!mentorship) {
      throw new ApiError(404, 'Mentorship relationship not found');
    }
    if (user.role !== 'ADMIN' && String(user.id) !== String(mentorship.student_id) && String(user.id) !== String(mentorship.mentor_id)) {
      throw new ApiError(403, 'You are not a participant in this meeting');
    }
  }

  async getMeetingWorkspace(user, mentorshipId, sessionId) {
    await this._assertMeetingParticipant(user, mentorshipId, sessionId);
    const rows = await queryMySQL(
      'SELECT code_content, strokes_json, updated_at FROM `meeting_workspaces` WHERE `session_id` = ? AND `mentorship_id` = ? LIMIT 1',
      [sessionId, mentorshipId]
    );
    const workspace = rows[0];
    return {
      code: workspace?.code_content || '',
      strokes: workspace?.strokes_json ? JSON.parse(workspace.strokes_json) : [],
      updatedAt: workspace?.updated_at || null
    };
  }

  async updateMeetingWorkspace(user, mentorshipId, sessionId, payload) {
    await this._assertMeetingParticipant(user, mentorshipId, sessionId);
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new ApiError(400, 'Meeting workspace update must be an object');
    }

    const hasCode = Object.prototype.hasOwnProperty.call(payload, 'code');
    const hasStrokes = Object.prototype.hasOwnProperty.call(payload, 'strokes');
    if (!hasCode && !hasStrokes) {
      throw new ApiError(400, 'Provide code or whiteboard strokes to update');
    }

    if (hasCode && (typeof payload.code !== 'string' || payload.code.length > 50000)) {
      throw new ApiError(400, 'Code must be text no longer than 50,000 characters');
    }

    let strokesJson = null;
    if (hasStrokes) {
      if (!Array.isArray(payload.strokes) || payload.strokes.length > 300) {
        throw new ApiError(400, 'Whiteboard must contain no more than 300 strokes');
      }
      const validStrokes = payload.strokes.map((stroke) => {
        if (!stroke || typeof stroke.color !== 'string' || !/^#[0-9a-f]{6}$/i.test(stroke.color) || !Array.isArray(stroke.points) || stroke.points.length > 500) {
          throw new ApiError(400, 'Whiteboard stroke is invalid');
        }
        const points = stroke.points.map((point) => {
          if (!Number.isFinite(point?.x) || !Number.isFinite(point?.y) || point.x < 0 || point.x > 1 || point.y < 0 || point.y > 1) {
            throw new ApiError(400, 'Whiteboard point is invalid');
          }
          return { x: point.x, y: point.y };
        });
        return { color: stroke.color, points };
      });
      strokesJson = JSON.stringify(validStrokes);
      if (validStrokes.reduce((total, stroke) => total + stroke.points.length, 0) > 10000 || strokesJson.length > 1000000) {
        throw new ApiError(413, 'Whiteboard update exceeds the allowed size');
      }
    }

    await queryMySQL(
      `INSERT INTO \`meeting_workspaces\` (\`session_id\`, \`mentorship_id\`, \`code_content\`, \`strokes_json\`)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         \`code_content\` = IF(\`mentorship_id\` = VALUES(\`mentorship_id\`), COALESCE(VALUES(\`code_content\`), \`code_content\`), \`code_content\`),
         \`strokes_json\` = IF(\`mentorship_id\` = VALUES(\`mentorship_id\`), COALESCE(VALUES(\`strokes_json\`), \`strokes_json\`), \`strokes_json\`),
         \`updated_at\` = IF(\`mentorship_id\` = VALUES(\`mentorship_id\`), CURRENT_TIMESTAMP, \`updated_at\`)`,
      [sessionId, mentorshipId, hasCode ? payload.code : null, strokesJson]
    );
    const savedWorkspace = await queryMySQL(
      'SELECT session_id FROM `meeting_workspaces` WHERE `session_id` = ? AND `mentorship_id` = ? LIMIT 1',
      [sessionId, mentorshipId]
    );
    if (savedWorkspace.length === 0) {
      throw new ApiError(409, 'Meeting session ID is already associated with another mentorship');
    }
    return await this.getMeetingWorkspace(user, mentorshipId, sessionId);
  }

  async createSession(user, payload) {
    const mentorshipId = payload.mentorshipId || payload.mentorship_id;
    const scheduledAt = payload.scheduledAt || payload.scheduled_at;
    const proposedSlots = payload.proposedSlots || payload.proposed_slots;
    const durationMins = payload.durationMins || payload.duration_mins;
    const topic = payload.topic || '1-on-1 Mentorship Session';
    const meetingLink = payload.meetingLink || payload.meeting_link;

    if (!mentorshipId) {
      throw new ApiError(400, 'Mentorship ID (mentorshipId or mentorship_id) is required');
    }

    const mentorship = await sessionsRepository.findActiveMentorshipById(mentorshipId);
    if (!mentorship) {
      throw new ApiError(404, 'Active mentorship relationship not found');
    }

    if (user.role !== 'ADMIN' && user.id !== mentorship.student_id && user.id !== mentorship.mentor_id) {
      throw new ApiError(403, 'You are not a participant in this mentorship');
    }

    const isStudent = user.id === mentorship.student_id;
    const validProposedSlots = Array.isArray(proposedSlots) ? proposedSlots.filter(Boolean) : [];

    const newSession = await sessionsRepository.createSession({
      mentorship_id: mentorshipId,
      scheduled_at: validProposedSlots[0] || scheduledAt || new Date(Date.now() + 86400000).toISOString(),
      proposed_slots: validProposedSlots.length > 0 ? validProposedSlots : [scheduledAt || new Date(Date.now() + 86400000).toISOString()],
      duration_mins: Number(durationMins) || 45,
      topic: topic || 'Mentorship Guidance Session',
      meeting_link: meetingLink || 'https://meet.google.com/campusbridge-session',
      status: isStudent && validProposedSlots.length > 1 ? 'PENDING_SLOT_SELECTION' : 'SCHEDULED'
    });

    // Notify participants
    if (isStudent) {
      await notificationsService.createNotification({
        user_id: mentorship.mentor_id,
        type: 'SESSION_SCHEDULED',
        title: '📅 Mentorship Session Proposed',
        desc: `${user.name || 'Your mentee'} proposed a session on "${topic}".`,
        target_tab: 'requests'
      }).catch(() => {});
      await notificationsService.createNotification({
        user_id: user.id,
        type: 'SESSION_SCHEDULED',
        title: '📅 Mentorship Session Requested',
        desc: `Your 1-on-1 session on "${topic}" has been booked.`,
        target_tab: 'requests'
      }).catch(() => {});
    } else {
      await notificationsService.createNotification({
        user_id: mentorship.student_id,
        type: 'SESSION_SCHEDULED',
        title: '📅 New Mentorship Session Scheduled',
        desc: `${user.name || 'Your mentor'} scheduled a session: "${topic}". Meeting link is available.`,
        target_tab: 'requests'
      }).catch(() => {});
      await notificationsService.createNotification({
        user_id: user.id,
        type: 'SESSION_SCHEDULED',
        title: '📅 Session Scheduled',
        desc: `Session "${topic}" has been added to your mentorship agenda.`,
        target_tab: 'requests'
      }).catch(() => {});
    }

    return newSession;
  }

  async getSessionsByMentorship(mentorshipId) {
    return await sessionsRepository.findSessionsByMentorshipId(mentorshipId);
  }

  async updateSessionNotes(sessionId, { notes, feedback, status, selectedSlot }) {
    const session = await sessionsRepository.findSessionById(sessionId);
    if (!session) {
      throw new ApiError(404, 'Session not found');
    }

    const updates = {
      ...(notes !== undefined && { notes }),
      ...(feedback !== undefined && { feedback }),
      ...(status !== undefined && { status })
    };

    if (selectedSlot) {
      updates.scheduled_at = selectedSlot;
      updates.status = 'CONFIRMED';
    }

    return await sessionsRepository.updateSession(sessionId, updates);
  }

  async completeSessionByStudent(user, sessionId) {
    const session = await sessionsRepository.findSessionById(sessionId);
    if (!session) {
      throw new ApiError(404, 'Session not found');
    }

    const mentorship = await sessionsRepository.findActiveMentorshipById(session.mentorship_id);
    if (!mentorship || String(mentorship.student_id) !== String(user.id)) {
      throw new ApiError(403, 'Only the student in this mentorship can mark the session completed');
    }
    if (!['CONFIRMED', 'SCHEDULED'].includes(session.status)) {
      throw new ApiError(400, 'Only a scheduled or confirmed session can be marked completed');
    }

    const updated = await sessionsRepository.updateSession(sessionId, { status: 'COMPLETED' });
    await notificationsService.createNotification({
      user_id: mentorship.mentor_id,
      type: 'SESSION_COMPLETED',
      title: '✅ Mentorship Session Completed',
      desc: `${user.name || 'Your student'} marked "${session.topic || '1-on-1 session'}" as completed.`,
      target_tab: 'sessions'
    }).catch(() => {});

    return updated;
  }

  async createMilestone(mentorshipId, { title, description, dueDate, resourceUrl }, file) {
    const mentorship = await sessionsRepository.findActiveMentorshipById(mentorshipId);
    if (!mentorship) {
      throw new ApiError(404, 'Active mentorship relationship not found');
    }

    let finalResourceUrl = resourceUrl || '';
    if (file) {
      finalResourceUrl = await uploadToCloud(file.path, 'milestone_materials');
    }

    const milestone = await sessionsRepository.createMilestone({
      mentorship_id: mentorshipId,
      title,
      description: description || '',
      due_date: dueDate || new Date(Date.now() + 7 * 86400000).toISOString(),
      status: 'PENDING',
      resource_url: finalResourceUrl
    });

    // Notify student
    await notificationsService.createNotification({
      user_id: mentorship.student_id,
      type: 'MILESTONE_ASSIGNED',
      title: '🎯 New Milestone Assigned',
      desc: `Milestone "${title}" has been assigned for your mentorship roadmap.`,
      target_tab: 'milestones'
    }).catch(() => {});

    // Notify mentor
    await notificationsService.createNotification({
      user_id: mentorship.mentor_id,
      type: 'MILESTONE_CREATED',
      title: '🎯 Milestone Added',
      desc: `Milestone "${title}" has been recorded for your mentee.`,
      target_tab: 'milestones'
    }).catch(() => {});

    return milestone;
  }

  async getMilestonesByMentorship(mentorshipId) {
    return await sessionsRepository.findMilestonesByMentorshipId(mentorshipId);
  }

  async updateMilestoneStatus(milestoneId, status) {
    const milestone = await sessionsRepository.findMilestoneById(milestoneId);
    if (!milestone) {
      throw new ApiError(404, 'Milestone not found');
    }

    const validStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED'];
    if (!validStatuses.includes(status)) {
      throw new ApiError(400, `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const updated = await sessionsRepository.updateMilestone(milestoneId, { status });

    const mentorship = await sessionsRepository.findActiveMentorshipById(milestone.mentorship_id);
    if (mentorship) {
      if (status === 'COMPLETED') {
        // Student marked as studied — notify mentor to review
        await notificationsService.createNotification({
          user_id: mentorship.mentor_id,
          type: 'MILESTONE_COMPLETED',
          title: '🏆 Mentee Studied a Milestone!',
          desc: `"${milestone.title}" was marked as studied. Please review and verify the milestone.`,
          target_tab: 'milestones'
        }).catch(() => {});

        await notificationsService.createNotification({
          user_id: mentorship.student_id,
          type: 'MILESTONE_COMPLETED',
          title: '✅ Milestone Marked as Studied',
          desc: `You marked "${milestone.title}" as studied. Your mentor has been notified.`,
          target_tab: 'milestones'
        }).catch(() => {});
      }

      if (status === 'VERIFIED') {
        // Mentor verified — notify student
        await notificationsService.createNotification({
          user_id: mentorship.student_id,
          type: 'MILESTONE_VERIFIED',
          title: '🏅 Milestone Verified by Mentor!',
          desc: `Your mentor verified "${milestone.title}". Keep up the great work!`,
          target_tab: 'milestones'
        }).catch(() => {});
      }
    }

    return updated;
  }
}

export const sessionsService = new SessionsService();
