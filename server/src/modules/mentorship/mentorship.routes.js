import { Router } from 'express';
import {
  createRequest,
  respondToRequest,
  completeMentorship,
  getMyRequests,
  getMyActiveMentorships,
  reassignMentorAdmin,
  getAllMentorshipsMatrixAdmin
} from './mentorship.controller.js';
import { verifyJWT } from '../../middleware/auth.middleware.js';
import { authorize, requireVerified } from '../../middleware/role.middleware.js';
import { validateBody } from '../../middleware/validation.middleware.js';

const router = Router();

router.use(verifyJWT);

router.post('/requests', authorize('STUDENT'), requireVerified, validateBody(['mentorId']), createRequest);

// Respond to mentorship request (supports both PATCH and POST)
router.patch('/requests/:requestId/respond', authorize('ALUMNI'), validateBody(['action']), respondToRequest);
router.post('/requests/:requestId/respond', authorize('ALUMNI'), validateBody(['action']), respondToRequest);

// Complete active mentorship (supports both PATCH and POST)
router.patch('/active/:mentorshipId/complete', completeMentorship);
router.post('/active/:mentorshipId/complete', completeMentorship);
router.patch('/:mentorshipId/complete', completeMentorship);
router.post('/:mentorshipId/complete', completeMentorship);

// Request and Mentorship query endpoints (supports all alias routes)
router.get('/requests/my', getMyRequests);
router.get('/my-requests', getMyRequests);
router.get('/pending-requests', getMyRequests);

router.get('/active/my', getMyActiveMentorships);
router.get('/my-mentorships', getMyActiveMentorships);

// Admin Routes
router.post('/admin/:mentorshipId/reassign', authorize('ADMIN'), validateBody(['newMentorId']), reassignMentorAdmin);
router.patch('/admin/:mentorshipId/reassign', authorize('ADMIN'), validateBody(['newMentorId']), reassignMentorAdmin);
router.post('/admin/reassign/:mentorshipId', authorize('ADMIN'), validateBody(['newMentorId']), reassignMentorAdmin);
router.patch('/admin/reassign/:mentorshipId', authorize('ADMIN'), validateBody(['newMentorId']), reassignMentorAdmin);

router.get('/admin/matrix', authorize('ADMIN'), getAllMentorshipsMatrixAdmin);

export default router;
