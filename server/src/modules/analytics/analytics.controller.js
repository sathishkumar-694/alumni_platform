import { analyticsService } from './analytics.service.js';
import { ApiResponse } from '../../shared/responseHelper.js';
import { asyncHandler } from '../../shared/asyncHandler.js';

export const getOperationsCenterAnalytics = asyncHandler(async (req, res) => {
  const result = await analyticsService.getOperationsCenterAnalytics();
  return res.status(200).json(
    new ApiResponse(200, result, 'Mentorship Operations Center analytics fetched successfully')
  );
});
