import { Router } from 'express';
import {
  getMyConversations,
  getMessages,
  sendMessage,
  markConversationRead
} from './chat.controller.js';
import { verifyJWT } from '../../middleware/auth.middleware.js';

const router = Router();

// All chat routes require authentication
router.use(verifyJWT);

// GET  /api/v1/chat/conversations          — list all my conversations
router.get('/conversations', getMyConversations);

// GET  /api/v1/chat/conversations/:mentorshipId/messages  — paginated messages
router.get('/conversations/:mentorshipId/messages', getMessages);

// POST /api/v1/chat/conversations/:mentorshipId/messages  — send a message
router.post('/conversations/:mentorshipId/messages', sendMessage);

// PATCH /api/v1/chat/conversations/:mentorshipId/read     — mark all as read
router.patch('/conversations/:mentorshipId/read', markConversationRead);

export default router;
