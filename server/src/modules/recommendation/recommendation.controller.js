import { recommendationService } from './recommendation.service.js';
import { ApiResponse } from '../../shared/responseHelper.js';
import { asyncHandler } from '../../shared/asyncHandler.js';

export const getRecommendedMentors = asyncHandler(async (req, res) => {
  const result = await recommendationService.getRecommendedMentors(req.user);
  return res.status(200).json(
    new ApiResponse(200, result, 'Recommended mentors generated successfully')
  );
});

export const analyzeResume = asyncHandler(async (req, res) => {
  const { resumeText, targetRole, jobDescription, portfolioUrl, apiKey, aiProvider } = req.body || {};
  const result = await recommendationService.analyzeResume(req.user, { resumeText, targetRole, jobDescription, portfolioUrl, apiKey, aiProvider });
  return res.status(200).json(
    new ApiResponse(200, result, 'AI Resume & Industry Fit Analysis completed successfully')
  );
});
