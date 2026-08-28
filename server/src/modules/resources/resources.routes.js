import { Router } from 'express';
import { getResources, createResource } from './resources.controller.js';
import { verifyJWT } from '../../middleware/auth.middleware.js';
import { authorize, requireVerified } from '../../middleware/role.middleware.js';
import { upload } from '../../middleware/upload.middleware.js';
import { validateBody } from '../../middleware/validation.middleware.js';

const router = Router();

router.get('/', getResources);

router.use(verifyJWT);
router.post(
  '/',
  authorize('ALUMNI', 'ADMIN'),
  requireVerified,
  upload.single('resourceFile'),
  validateBody(['title']),
  createResource
);

export default router;
