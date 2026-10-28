import { sessionsRepository } from './sessions.repository.js';
import { ApiError } from '../../shared/ApiError.js';
import { uploadToCloud } from '../../config/cloudinary.js';
import { notificationsService } from '../notifications/notifications.service.js';

export class SessionsService {
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
