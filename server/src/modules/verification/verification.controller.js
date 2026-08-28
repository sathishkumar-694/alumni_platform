import { verificationService } from './verification.service.js';
import { ApiResponse } from '../../shared/responseHelper.js';
import { asyncHandler } from '../../shared/asyncHandler.js';

export const getPendingVerifications = asyncHandler(async (req, res) => {
  const result = await verificationService.getPendingVerifications();
  return res.status(200).json(
    new ApiResponse(200, result, 'Pending verification queue fetched successfully')
  );
});

export const updateVerificationStatus = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { status, action, reason } = req.body;
  const targetStatus = status || (action === 'APPROVE' ? 'VERIFIED' : action === 'REJECT' ? 'REJECTED' : 'VERIFIED');
  const result = await verificationService.updateVerificationStatus(req.user.id, userId, targetStatus, reason);
  return res.status(200).json(
    new ApiResponse(200, result, `User verification status updated to ${targetStatus}`)
  );
});
