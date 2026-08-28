import { sessionsService } from './sessions.service.js';
import { ApiResponse } from '../../shared/responseHelper.js';
import { asyncHandler } from '../../shared/asyncHandler.js';

export const createSession = asyncHandler(async (req, res) => {
  const result = await sessionsService.createSession(req.user, req.body);
  return res.status(201).json(
    new ApiResponse(201, result, 'Mentorship session scheduled successfully')
  );
});

export const getSessionsByMentorship = asyncHandler(async (req, res) => {
  const { mentorshipId } = req.params;
  const result = await sessionsService.getSessionsByMentorship(mentorshipId);
  return res.status(200).json(
    new ApiResponse(200, result, 'Sessions fetched successfully')
  );
});

export const updateSessionNotes = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const result = await sessionsService.updateSessionNotes(sessionId, req.body);
  return res.status(200).json(
    new ApiResponse(200, result, 'Session notes updated successfully')
  );
});

export const createMilestone = asyncHandler(async (req, res) => {
  const { mentorshipId, title, description, dueDate } = req.body;
  const result = await sessionsService.createMilestone(mentorshipId, { title, description, dueDate });
  return res.status(201).json(
    new ApiResponse(201, result, 'Milestone added to roadmap')
  );
});

export const getMilestonesByMentorship = asyncHandler(async (req, res) => {
  const { mentorshipId } = req.params;
  const result = await sessionsService.getMilestonesByMentorship(mentorshipId);
  return res.status(200).json(
    new ApiResponse(200, result, 'Milestones fetched')
  );
});

export const updateMilestoneStatus = asyncHandler(async (req, res) => {
  const { milestoneId } = req.params;
  const { status } = req.body;
  const result = await sessionsService.updateMilestoneStatus(milestoneId, status);
  return res.status(200).json(
    new ApiResponse(200, result, `Milestone marked as ${status}`)
  );
});
