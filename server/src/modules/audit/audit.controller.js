import { auditService } from './audit.service.js';
import { ApiResponse } from '../../shared/responseHelper.js';
import { asyncHandler } from '../../shared/asyncHandler.js';

export const getAuditLogs = asyncHandler(async (req, res) => {
  const result = await auditService.getAuditLogs();
  return res.status(200).json(
    new ApiResponse(200, result, 'Audit logs retrieved successfully')
  );
});
