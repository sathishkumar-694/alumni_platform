import { db } from '../../config/db.js';

export class AnnouncementsRepository {
  async findAllAnnouncements() {
    return await db.announcements.find();
  }

  async findUserById(id) {
    return await db.users.findById(id);
  }

  async findDomainById(id) {
    return await db.domains.findById(id);
  }

  async createAnnouncement(announcementData) {
    return await db.announcements.create(announcementData);
  }

  async logAuditAction(adminId, action, targetUserId, details) {
    return await db.auditLogs.log(adminId, action, targetUserId, details);
  }
}

export const announcementsRepository = new AnnouncementsRepository();
