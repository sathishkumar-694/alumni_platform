import { Router } from 'express';
import { getAllJobs, createJob, applyForReferral, getMyApplications, getMentorIncomingApplications, reviewReferralApplication } from './referrals.controller.js';
import { verifyJWT } from '../../middleware/auth.middleware.js';
import { authorize, requireVerified } from '../../middleware/role.middleware.js';
import { validateBody } from '../../middleware/validation.middleware.js';
import { uploadDocument } from '../../middleware/upload.middleware.js';

const router = Router();

router.use(verifyJWT);

router.get('/', getAllJobs);
router.get('/referrals', getAllJobs);

router.post('/referrals', authorize('ALUMNI', 'ADMIN'), requireVerified, uploadDocument.single('jdFile'), validateBody(['title', 'company', 'location']), createJob);
router.post('/', authorize('ALUMNI', 'ADMIN'), requireVerified, uploadDocument.single('jdFile'), validateBody(['title', 'company', 'location']), createJob);

router.post('/:jobId/apply', authorize('STUDENT'), requireVerified, uploadDocument.single('resume'), applyForReferral);
router.post('/referrals/:jobId/apply', authorize('STUDENT'), requireVerified, uploadDocument.single('resume'), applyForReferral);

router.get('/my-applications', authorize('STUDENT'), getMyApplications);
router.get('/mentor/incoming', authorize('ALUMNI'), getMentorIncomingApplications);
router.patch('/mentor/applications/:applicationId', authorize('ALUMNI'), reviewReferralApplication);

export default router;
