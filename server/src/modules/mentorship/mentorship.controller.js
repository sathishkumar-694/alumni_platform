import { mentorshipService } from './mentorship.service.js';
import { ApiResponse } from '../../shared/responseHelper.js';
import { asyncHandler } from '../../shared/asyncHandler.js';

export const createRequest = asyncHandler(async (req, res) => {
  const result = await mentorshipService.createRequest(req.user, req.body);
  return res.status(201).json(
    new ApiResponse(201, result, 'Mentorship request submitted successfully')
  );
});

export const respondToRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const { action } = req.body;
  const result = await mentorshipService.respondToRequest(req.user, requestId, action);
  return res.status(200).json(
    new ApiResponse(200, result, `Mentorship request ${action === 'ACCEPT' ? 'accepted' : 'rejected'}`)
  );
});

export const completeMentorship = asyncHandler(async (req, res) => {
  const { mentorshipId } = req.params;
  const result = await mentorshipService.completeMentorship(req.user, mentorshipId);
  return res.status(200).json(
    new ApiResponse(200, result, 'Mentorship completed successfully')
  );
});

export const getMyRequests = asyncHandler(async (req, res) => {
  const result = await mentorshipService.getMyRequests(req.user);
  return res.status(200).json(
    new ApiResponse(200, result, 'Mentorship requests fetched successfully')
  );
});

export const getMyActiveMentorships = asyncHandler(async (req, res) => {
  const result = await mentorshipService.getMyActiveMentorships(req.user);
  return res.status(200).json(
    new ApiResponse(200, result, 'Active mentorships fetched successfully')
  );
});

export const reassignMentorAdmin = asyncHandler(async (req, res) => {
  const { mentorshipId } = req.params;
  const { newMentorId, reason } = req.body;
  const result = await mentorshipService.reassignMentorAdmin(req.user.id, mentorshipId, newMentorId, reason);
  return res.status(200).json(
    new ApiResponse(200, result, 'Mentor reassigned successfully by Admin')
  );
});

export const getAllMentorshipsMatrixAdmin = asyncHandler(async (req, res) => {
  const result = await mentorshipService.getAllMentorshipsMatrixAdmin();
  return res.status(200).json(
    new ApiResponse(200, result, 'Admin mentorship matrix fetched successfully')
  );
});

export const getAllMentorshipRequestsAdmin = asyncHandler(async (req, res) => {
  const result = await mentorshipService.getAllMentorshipRequestsAdmin();
  return res.status(200).json(
    new ApiResponse(200, result, 'All mentorship requests fetched successfully for Admin')
  );
});
