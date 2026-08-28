import { domainsService } from './domains.service.js';
import { ApiResponse } from '../../shared/responseHelper.js';
import { asyncHandler } from '../../shared/asyncHandler.js';

export const getDomains = asyncHandler(async (req, res) => {
  const includeArchived = req.query.includeArchived === 'true';
  const result = await domainsService.getDomains(includeArchived);
  return res.status(200).json(
    new ApiResponse(200, result, 'Technical domains fetched successfully')
  );
});

export const toggleStudentInterest = asyncHandler(async (req, res) => {
  const { domainId } = req.params;
  const result = await domainsService.toggleStudentInterest(req.user.id, domainId);
  const msg = result.isInterested ? 'Added to your domain interests' : 'Removed from domain interests';
  return res.status(200).json(new ApiResponse(200, result, msg));
});

export const toggleAlumniExpertise = asyncHandler(async (req, res) => {
  const { domainId } = req.params;
  const result = await domainsService.toggleAlumniExpertise(req.user.id, domainId);
  const msg = result.isExpert ? 'Expertise domain added to profile' : 'Expertise domain removed from profile';
  return res.status(200).json(new ApiResponse(200, result, msg));
});

export const getDomainMentors = asyncHandler(async (req, res) => {
  const { domainId } = req.params;
  const result = await domainsService.getDomainMentors(domainId);
  return res.status(200).json(new ApiResponse(200, result, 'Domain mentors fetched successfully'));
});

export const createDomain = asyncHandler(async (req, res) => {
  const result = await domainsService.createDomain(req.user.id, req.body);
  return res.status(201).json(
    new ApiResponse(201, result, 'Domain created successfully')
  );
});

export const updateDomain = asyncHandler(async (req, res) => {
  const { domainId } = req.params;
  const result = await domainsService.updateDomain(req.user.id, domainId, req.body);
  return res.status(200).json(
    new ApiResponse(200, result, 'Domain updated successfully')
  );
});
