import { db } from '../../config/db.js';

export class VerificationRepository {
  async findPendingAndRejectedUsers() {
    const allUsers = await db.users.find();
    // Filter ONLY users with PENDING verification status
    const pendingUsers = allUsers.filter(u => u.verification_status === 'PENDING');
    
    // Deduplicate by user ID
    const uniqueMap = new Map();
    pendingUsers.forEach(u => {
      if (u.id && !uniqueMap.has(u.id)) {
        uniqueMap.set(u.id, u);
      }
    });
    return Array.from(uniqueMap.values());
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
