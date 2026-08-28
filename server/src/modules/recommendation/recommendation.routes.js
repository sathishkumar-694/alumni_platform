import { Router } from 'express';
import { getRecommendedMentors, analyzeResume } from './recommendation.controller.js';
import { verifyJWT } from '../../middleware/auth.middleware.js';
import { authorize, requireVerified } from '../../middleware/role.middleware.js';

const router = Router();

router.use(verifyJWT);
router.get('/', authorize('STUDENT'), requireVerified, getRecommendedMentors);
router.post('/analyze-resume', authorize('STUDENT'), requireVerified, analyzeResume);

export default router;
