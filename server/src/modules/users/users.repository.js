import { db } from '../../config/db.js';

export class UsersRepository {
  async updateStudentProfile(userId, profileData) {
    return await db.studentProfiles.createOrUpdate(userId, profileData);
  }

  async updateAlumniProfile(userId, profileData) {
    return await db.alumniProfiles.createOrUpdate(userId, profileData);
  }

  async findAllUsers() {
    return await db.users.find();
  }

  async findUserById(id) {
    return await db.users.findById(id);
  }

  async updateUser(id, updates) {
    return await db.users.update(id, updates);
  }

  async getStudentProfile(userId) {
    return await db.studentProfiles.findByUserId(userId);
  }

  async getAlumniProfile(userId) {
    return await db.alumniProfiles.findByUserId(userId);
  }

  async logAuditAction(adminId, action, targetUserId, details) {
    return await db.auditLogs.log(adminId, action, targetUserId, details);
  }
}

export const usersRepository = new UsersRepository();
