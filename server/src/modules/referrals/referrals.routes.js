import { Router } from 'express';
import { getAllJobs, createJob, applyForReferral, getMyApplications, getMentorIncomingApplications } from './referrals.controller.js';
import { verifyJWT } from '../../middleware/auth.middleware.js';
import { authorize, requireVerified } from '../../middleware/role.middleware.js';
import { validateBody } from '../../middleware/validation.middleware.js';

const router = Router();

router.use(verifyJWT);

router.get('/', getAllJobs);
router.get('/referrals', getAllJobs);

router.post('/referrals', authorize('ALUMNI', 'ADMIN'), requireVerified, validateBody(['title', 'company', 'location']), createJob);
router.post('/', authorize('ALUMNI', 'ADMIN'), requireVerified, validateBody(['title', 'company', 'location']), createJob);

router.post('/:jobId/apply', authorize('STUDENT'), requireVerified, applyForReferral);
router.post('/referrals/:jobId/apply', authorize('STUDENT'), requireVerified, applyForReferral);

router.get('/my-applications', authorize('STUDENT'), getMyApplications);
router.get('/mentor/incoming', authorize('ALUMNI'), getMentorIncomingApplications);

export default router;
