import { Router } from 'express';
import {
  getRecommendedMentors,
  analyzeResume,
  getAnalysisHistory,
  getAnalysisById,
  deleteAnalysis
} from './recommendation.controller.js';
import { verifyJWT } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/role.middleware.js';

const router = Router();

router.use(verifyJWT);
router.get('/', authorize('STUDENT', 'ALUMNI', 'ADMIN'), getRecommendedMentors);
router.post('/analyze-resume', authorize('STUDENT', 'ALUMNI', 'ADMIN'), analyzeResume);
router.get('/history', authorize('STUDENT', 'ALUMNI', 'ADMIN'), getAnalysisHistory);
router.get('/history/:id', authorize('STUDENT', 'ALUMNI', 'ADMIN'), getAnalysisById);
router.delete('/history/:id', authorize('STUDENT', 'ALUMNI', 'ADMIN'), deleteAnalysis);

export default router;

