import { usersService } from './users.service.js';
import { ApiResponse } from '../../shared/responseHelper.js';
import { asyncHandler } from '../../shared/asyncHandler.js';

export const updateStudentProfile = asyncHandler(async (req, res) => {
  const result = await usersService.updateStudentProfile(req.user, req.body);
  return res.status(200).json(
    new ApiResponse(200, result, 'Student profile updated successfully')
  );
});

export const updateAlumniProfile = asyncHandler(async (req, res) => {
  const result = await usersService.updateAlumniProfile(req.user, req.body);
  return res.status(200).json(
    new ApiResponse(200, result, 'Alumni profile updated successfully')
  );
});

export const getAllUsersAdmin = asyncHandler(async (req, res) => {
  const result = await usersService.getAllUsersAdmin();
  return res.status(200).json(
    new ApiResponse(200, result, 'All users fetched for administration')
  );
});

export const updateUserByAdmin = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const result = await usersService.updateUserByAdmin(req.user.id, userId, req.body);
  return res.status(200).json(
    new ApiResponse(200, result, 'User details updated by administrator successfully')
  );
});
