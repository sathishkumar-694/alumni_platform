import { Router } from 'express';
import {
  createSession,
  getSessionsByMentorship,
  updateSessionNotes,
  createMilestone,
  getMilestonesByMentorship,
  updateMilestoneStatus
} from './sessions.controller.js';
import { verifyJWT } from '../../middleware/auth.middleware.js';
import { validateBody } from '../../middleware/validation.middleware.js';

const router = Router();

router.use(verifyJWT);

// Sessions Endpoints (with full alias support)
router.post('/sessions', validateBody(['mentorshipId', 'topic']), createSession);
router.post('/', validateBody(['mentorshipId', 'topic']), createSession);

router.get('/sessions/mentorship/:mentorshipId', getSessionsByMentorship);
router.get('/mentorship/:mentorshipId', getSessionsByMentorship);

// Session Update & Slot Finalization Routes
router.patch('/sessions/:sessionId/notes', updateSessionNotes);
router.patch('/sessions/:sessionId', updateSessionNotes);
router.patch('/:sessionId/notes', updateSessionNotes);
router.patch('/:sessionId', updateSessionNotes);

router.post('/sessions/:sessionId/notes', updateSessionNotes);
router.post('/sessions/:sessionId', updateSessionNotes);
router.post('/:sessionId/notes', updateSessionNotes);
router.post('/:sessionId', updateSessionNotes);

// Milestones Endpoints (with full alias support)
router.post('/milestones', validateBody(['mentorshipId', 'title']), createMilestone);
router.get('/milestones/mentorship/:mentorshipId', getMilestonesByMentorship);
router.get('/milestones/:mentorshipId', getMilestonesByMentorship);

router.patch('/milestones/:milestoneId', validateBody(['status']), updateMilestoneStatus);
router.post('/milestones/:milestoneId', validateBody(['status']), updateMilestoneStatus);

export default router;
