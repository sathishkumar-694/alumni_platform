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

export const requestDomain = asyncHandler(async (req, res) => {
  const result = await domainsService.requestNewDomain(req.user, req.body);
  return res.status(201).json(
    new ApiResponse(201, result, 'Technical domain addition request submitted for Admin approval.')
  );
});

export const getPendingDomainRequests = asyncHandler(async (req, res) => {
  const result = await domainsService.getPendingDomainRequests();
  return res.status(200).json(
    new ApiResponse(200, result, 'Pending domain requests fetched successfully')
  );
});

export const approveDomainRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await domainsService.approveDomainRequest(req.user, id);
  return res.status(200).json(
    new ApiResponse(200, result, 'Domain request approved and created as an active domain.')
  );
});

export const rejectDomainRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await domainsService.rejectDomainRequest(req.user, id);
  return res.status(200).json(
    new ApiResponse(200, null, 'Domain request rejected.')
  );
});

export const createDomain = asyncHandler(async (req, res) => {
  const result = await domainsService.createDomain(req.user.id, req.body);
  return res.status(201).json(
    new ApiResponse(201, result, 'Domain created successfully')
  );
});
