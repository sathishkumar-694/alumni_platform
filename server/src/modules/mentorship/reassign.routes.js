import { Router } from 'express';
import {
  submitReassignRequest,
  getReassignRequests,
  adminReviewReassignRequest
} from './reassign.controller.js';
import { verifyJWT } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/role.middleware.js';

const router = Router();
router.use(verifyJWT);

// Student submits a mentor-change request
router.post('/mentorship/reassign-request', authorize('STUDENT'), submitReassignRequest);

// Admin views all pending reassign requests
router.get('/mentorship/reassign-requests', authorize('ADMIN'), getReassignRequests);

// Admin approves or rejects a reassign request
router.post('/mentorship/reassign-requests/:requestId/review', authorize('ADMIN'), adminReviewReassignRequest);

export default router;
