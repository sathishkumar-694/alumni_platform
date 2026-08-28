import { db } from '../../config/db.js';

export class SessionsRepository {
  async findActiveMentorshipById(id) {
    return await db.activeMentorships.findById(id);
  }

  async createSession(sessionData) {
    return await db.sessions.create(sessionData);
  }

  async findSessionsByMentorshipId(mentorshipId) {
    const all = await db.sessions.find();
    return all.filter(s => s.mentorship_id === mentorshipId);
  }

  async findSessionById(id) {
    return await db.sessions.findById(id);
  }

  async updateSession(id, updates) {
    return await db.sessions.update(id, updates);
  }

  async createMilestone(data) {
    return await db.milestones.create(data);
  }

  async findMilestonesByMentorshipId(mentorshipId) {
    const all = await db.milestones.find();
    return all.filter(m => m.mentorship_id === mentorshipId);
  }

  async findMilestoneById(id) {
    return await db.milestones.findById(id);
  }

  async updateMilestone(id, updates) {
    return await db.milestones.update(id, updates);
  }
}

export const sessionsRepository = new SessionsRepository();
