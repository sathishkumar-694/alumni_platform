import { verificationRepository } from './verification.repository.js';
import { ApiError } from '../../shared/ApiError.js';

export class VerificationService {
  async getPendingVerifications() {
    const pendingUsers = await verificationRepository.findPendingAndRejectedUsers();

    return await Promise.all(pendingUsers.map(async (user) => {
      let profile = null;
      if (user.role === 'STUDENT') {
        profile = await verificationRepository.getStudentProfile(user.id);
      } else if (user.role === 'ALUMNI') {
        profile = await verificationRepository.getAlumniProfile(user.id);
      }
      const submittedAt = user.created_at || new Date().toISOString();
      return {
        id: `v-${user.id}`,
        user_id: user.id,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          verification_status: user.verification_status
        },
        submitted_at: submittedAt,
        status: user.verification_status,
        profile
      };
    }));
  }

  async updateVerificationStatus(adminId, userId, status, reason) {
    if (!['VERIFIED', 'REJECTED', 'SUSPENDED', 'PENDING'].includes(status)) {
      throw new ApiError(400, 'Invalid verification status value');
    }

    const user = await verificationRepository.findUserById(userId);
    if (!user) {
      throw new ApiError(404, 'Target user not found');
    }

    const updatedUser = await verificationRepository.updateUserVerificationStatus(userId, status);

    await verificationRepository.logAuditAction(
      adminId,
      'VERIFICATION_STATUS_UPDATED',
      userId,
      `Admin updated user ${user.email} status to ${status}.${reason ? ` Reason: ${reason}` : ''}`
    );

    return updatedUser;
  }
}

export const verificationService = new VerificationService();
