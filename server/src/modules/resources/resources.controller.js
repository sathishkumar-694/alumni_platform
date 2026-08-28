import { resourcesService } from './resources.service.js';
import { ApiResponse } from '../../shared/responseHelper.js';
import { asyncHandler } from '../../shared/asyncHandler.js';

export const getResources = asyncHandler(async (req, res) => {
  const { domainId } = req.query;
  const result = await resourcesService.getResources(domainId);
  return res.status(200).json(
    new ApiResponse(200, result, 'Resources fetched successfully')
  );
});

export const createResource = asyncHandler(async (req, res) => {
  const result = await resourcesService.createResource(req.user, req.file, req.body);
  return res.status(201).json(
    new ApiResponse(201, result, 'Study resource shared successfully')
  );
});
