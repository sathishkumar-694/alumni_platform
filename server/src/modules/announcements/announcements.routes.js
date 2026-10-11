import { Router } from 'express';
import { getAnnouncements, createAnnouncement, deleteAnnouncement } from './announcements.controller.js';
import { verifyJWT } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/role.middleware.js';
import { uploadDocument } from '../../middleware/upload.middleware.js';
import { validateBody } from '../../middleware/validation.middleware.js';

const router = Router();

router.get('/', getAnnouncements);

router.use(verifyJWT);
router.post(
  '/',
  authorize('ADMIN', 'ALUMNI'),
  uploadDocument.single('attachment'),
  validateBody(['title', 'content']),
  createAnnouncement
);

router.delete(
  '/:id',
  authorize('ADMIN'),
  deleteAnnouncement
);

export default router;
