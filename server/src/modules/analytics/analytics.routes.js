import { Router } from 'express';
import { getOperationsCenterAnalytics } from './analytics.controller.js';
import { verifyJWT } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/role.middleware.js';

const router = Router();

router.use(verifyJWT);
router.use(authorize('ADMIN'));

router.get('/overview', getOperationsCenterAnalytics);

export default router;
