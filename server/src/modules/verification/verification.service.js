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
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        verification_status: user.verification_status,
        created_at: user.created_at,
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
      `USER_VERIFICATION_${status}`,
      userId,
      `Admin updated status for ${user.name} (${user.role}) to ${status}.${reason ? ` Reason: ${reason}` : ''}`
    );

    return updatedUser;
  }
}

export const verificationService = new VerificationService();
