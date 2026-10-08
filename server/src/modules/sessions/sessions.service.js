import { sessionsRepository } from './sessions.repository.js';
import { ApiError } from '../../shared/ApiError.js';

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

    if (user.id !== mentorship.student_id && user.id !== mentorship.mentor_id) {
      throw new ApiError(403, 'You are not a participant in this mentorship');
    }

    const isStudent = user.id === mentorship.student_id;
    const validProposedSlots = Array.isArray(proposedSlots) ? proposedSlots.filter(Boolean) : [];

    return await sessionsRepository.createSession({
      mentorship_id: mentorshipId,
      scheduled_at: validProposedSlots[0] || scheduledAt || new Date(Date.now() + 86400000).toISOString(),
      proposed_slots: validProposedSlots.length > 0 ? validProposedSlots : [scheduledAt || new Date(Date.now() + 86400000).toISOString()],
      duration_mins: Number(durationMins) || 45,
      topic: topic || 'Mentorship Guidance Session',
      meeting_link: meetingLink || 'https://meet.google.com/campusbridge-session',
      status: isStudent && validProposedSlots.length > 1 ? 'PENDING_SLOT_SELECTION' : 'SCHEDULED'
    });
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

  async createMilestone(mentorshipId, { title, description, dueDate }) {
    const mentorship = await sessionsRepository.findActiveMentorshipById(mentorshipId);
    if (!mentorship) {
      throw new ApiError(404, 'Active mentorship relationship not found');
    }

    return await sessionsRepository.createMilestone({
      mentorship_id: mentorshipId,
      title,
      description: description || '',
      due_date: dueDate || new Date(Date.now() + 7 * 86400000).toISOString(),
      status: 'PENDING'
    });
  }

  async getMilestonesByMentorship(mentorshipId) {
    return await sessionsRepository.findMilestonesByMentorshipId(mentorshipId);
  }

  async updateMilestoneStatus(milestoneId, status) {
    const milestone = await sessionsRepository.findMilestoneById(milestoneId);
    if (!milestone) {
      throw new ApiError(404, 'Milestone not found');
    }

    return await sessionsRepository.updateMilestone(milestoneId, { status });
  }
}

export const sessionsService = new SessionsService();
