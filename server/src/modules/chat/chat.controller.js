import { chatService } from './chat.service.js';
import { ApiResponse } from '../../shared/responseHelper.js';
import { asyncHandler } from '../../shared/asyncHandler.js';

/**
 * GET /api/v1/chat/conversations
 * Returns all active mentorship conversations for the logged-in user.
 */
export const getMyConversations = asyncHandler(async (req, res) => {
  const conversations = await chatService.getMyConversations(req.user);
  return res.status(200).json(
    new ApiResponse(200, conversations, 'Conversations fetched successfully')
  );
});

/**
 * GET /api/v1/chat/conversations/:mentorshipId/messages
 * Returns paginated messages for a specific mentorship conversation.
 * Privacy: Only the student and mentor of this mentorship can access it.
 */
export const getMessages = asyncHandler(async (req, res) => {
  const { mentorshipId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const messages = await chatService.getMessages(req.user, mentorshipId, page, limit);
  return res.status(200).json(
    new ApiResponse(200, messages, 'Messages fetched successfully')
  );
});

/**
 * POST /api/v1/chat/conversations/:mentorshipId/messages
 * Send a message in a mentorship conversation.
 * Privacy: Only the student and mentor of this mentorship can send.
 */
export const sendMessage = asyncHandler(async (req, res) => {
  const { mentorshipId } = req.params;
  const { content } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ success: false, message: 'Message content cannot be empty' });
  }
  const message = await chatService.sendMessage(req.user, mentorshipId, content.trim());
  return res.status(201).json(
    new ApiResponse(201, message, 'Message sent successfully')
  );
});

/**
 * PATCH /api/v1/chat/conversations/:mentorshipId/read
 * Mark all messages in a conversation as read for the current user.
 */
export const markConversationRead = asyncHandler(async (req, res) => {
  const { mentorshipId } = req.params;
  await chatService.markConversationRead(req.user, mentorshipId);
  return res.status(200).json(
    new ApiResponse(200, null, 'Conversation marked as read')
  );
});
