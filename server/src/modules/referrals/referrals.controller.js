import { referralsService } from './referrals.service.js';
import { ApiResponse } from '../../shared/responseHelper.js';
import { asyncHandler } from '../../shared/asyncHandler.js';

export const getAllJobs = asyncHandler(async (req, res) => {
  const result = await referralsService.getAllJobs();
  return res.status(200).json(
    new ApiResponse(200, result, 'Real-time job referral drives fetched successfully from database')
  );
});

export const createJob = asyncHandler(async (req, res) => {
  const result = await referralsService.createJob(req.user, req.body);
  return res.status(201).json(
    new ApiResponse(201, result, 'Internal job referral drive created in database successfully')
  );
});

export const applyForReferral = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const result = await referralsService.applyForReferral(req.user, jobId);
  return res.status(200).json(
    new ApiResponse(200, result, 'Referral application recorded in database successfully')
  );
});

export const getMyApplications = asyncHandler(async (req, res) => {
  const result = await referralsService.getMyApplications(req.user);
  return res.status(200).json(
    new ApiResponse(200, result, 'My referral applications fetched successfully')
  );
});

export const getMentorIncomingApplications = asyncHandler(async (req, res) => {
  const result = await referralsService.getMentorIncomingApplications(req.user);
  return res.status(200).json(
    new ApiResponse(200, result, 'Incoming mentor referral applications fetched successfully')
  );
});
