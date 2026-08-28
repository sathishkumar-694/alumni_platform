import { db } from '../../config/db.js';

export class VerificationRepository {
  async findPendingAndRejectedUsers() {
    const allUsers = await db.users.find();
    return allUsers.filter(u => u.verification_status === 'PENDING' || u.verification_status === 'REJECTED');
  }

  async findUserById(userId) {
    return await db.users.findById(userId);
  }

  async updateUserVerificationStatus(userId, status) {
    return await db.users.update(userId, { verification_status: status });
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

export const verificationRepository = new VerificationRepository();
