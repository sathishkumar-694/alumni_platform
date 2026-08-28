import { Router } from 'express';
import { getPendingVerifications, updateVerificationStatus } from './verification.controller.js';
import { verifyJWT } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/role.middleware.js';

const router = Router();

router.use(verifyJWT);
router.use(authorize('ADMIN'));

router.get('/pending', getPendingVerifications);
router.patch('/users/:userId/status', updateVerificationStatus);
router.patch('/:userId/verify', updateVerificationStatus);
router.patch('/pending/:userId/verify', updateVerificationStatus);

export default router;
