import { Router } from 'express';
import { getAuditLogs } from './audit.controller.js';
import { verifyJWT } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/role.middleware.js';

const router = Router();

router.use(verifyJWT);
router.use(authorize('ADMIN'));

router.get('/', getAuditLogs);

export default router;
