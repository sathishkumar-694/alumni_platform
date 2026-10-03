import { Router } from 'express';
import {
  getDomains,
  toggleStudentInterest,
  toggleAlumniExpertise,
  requestDomain,
  getPendingDomainRequests,
  approveDomainRequest,
  rejectDomainRequest,
  createDomain
} from './domains.controller.js';
import { verifyJWT } from '../../middleware/auth.middleware.js';

const router = Router();

router.get('/', getDomains);

router.use(verifyJWT);

router.post('/:domainId/interests', toggleStudentInterest);
router.post('/:domainId/expertise', toggleAlumniExpertise);

router.post('/request', requestDomain);
router.get('/requests/pending', getPendingDomainRequests);
router.patch('/requests/:id/approve', approveDomainRequest);
router.patch('/requests/:id/reject', rejectDomainRequest);
router.post('/', createDomain);

export default router;
