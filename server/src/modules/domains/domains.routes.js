import { Router } from 'express';
import {
  getDomains,
  createDomain,
  updateDomain,
  toggleStudentInterest,
  toggleAlumniExpertise,
  getDomainMentors
} from './domains.controller.js';
import { verifyJWT } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/role.middleware.js';

const router = Router();

router.get('/', getDomains);
router.get('/:domainId/mentors', getDomainMentors);

router.use(verifyJWT);
router.post('/:domainId/interest', authorize('STUDENT'), toggleStudentInterest);
router.post('/:domainId/expertise', authorize('ALUMNI'), toggleAlumniExpertise);
router.post('/', authorize('ADMIN'), createDomain);
router.patch('/:domainId', authorize('ADMIN'), updateDomain);

export default router;
