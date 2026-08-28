import { announcementsService } from './announcements.service.js';
import { ApiResponse } from '../../shared/responseHelper.js';
import { asyncHandler } from '../../shared/asyncHandler.js';

export const getAnnouncements = asyncHandler(async (req, res) => {
  const { category, targetDomainId } = req.query;
  const result = await announcementsService.getAnnouncements(category, targetDomainId);
  return res.status(200).json(
    new ApiResponse(200, result, 'Announcements fetched successfully')
  );
});

export const createAnnouncement = asyncHandler(async (req, res) => {
  const result = await announcementsService.createAnnouncement(req.user, req.body);
  return res.status(201).json(
    new ApiResponse(201, result, 'Announcement published successfully')
  );
});
