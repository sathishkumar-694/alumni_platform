import { db } from '../../config/db.js';

export class AnalyticsRepository {
  async findAllUsers() {
    return await db.users.find();
  }

  async findAllActiveMentorships() {
    return await db.activeMentorships.find();
  }

  async findAllMentorshipRequests() {
    return await db.mentorshipRequests.find();
  }

  async findAllSessions() {
    return await db.sessions.find();
  }

  async findAllMilestones() {
    return await db.milestones.find();
  }

  async findAllActiveDomains() {
    const all = await db.domains.find();
    return all.filter(d => !d.is_archived);
  }
}

export const analyticsRepository = new AnalyticsRepository();
