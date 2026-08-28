import { authService } from './auth.service.js';
import { ApiResponse } from '../../shared/responseHelper.js';
import { asyncHandler } from '../../shared/asyncHandler.js';

export const registerStudent = asyncHandler(async (req, res) => {
  const result = await authService.registerStudent(req.body, req.file);
  return res.status(201).json(
    new ApiResponse(201, result, 'Student registered successfully. Verification pending administrative approval.')
  );
});

export const registerAlumni = asyncHandler(async (req, res) => {
  const result = await authService.registerAlumni(req.body, req.file);
  return res.status(201).json(
    new ApiResponse(201, result, 'Alumni registered successfully. Verification pending administrative review.')
  );
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  return res.status(200).json(
    new ApiResponse(200, result, 'Logged in successfully')
  );
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  const result = await authService.getCurrentUser(req.user);
  return res.status(200).json(
    new ApiResponse(200, result, 'Current user fetched successfully')
  );
});
