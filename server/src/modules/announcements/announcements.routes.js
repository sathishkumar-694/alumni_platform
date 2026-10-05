import { Router } from 'express';
import { getAnnouncements, createAnnouncement, deleteAnnouncement } from './announcements.controller.js';
import { verifyJWT } from '../../middleware/auth.middleware.js';
import { authorize, requireVerified } from '../../middleware/role.middleware.js';
import { validateBody } from '../../middleware/validation.middleware.js';

const router = Router();

router.get('/', getAnnouncements);

router.use(verifyJWT);
router.post(
  '/',
  authorize('ADMIN', 'ALUMNI'),
  requireVerified,
  validateBody(['title', 'content']),
  createAnnouncement
);

router.delete(
  '/:id',
  authorize('ADMIN'),
  deleteAnnouncement
);

export default router;
