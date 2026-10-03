import { Router } from 'express';
import { notificationsController } from './notifications.controller.js';
import { verifyJWT } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(verifyJWT);

router.get('/', (req, res, next) => notificationsController.getUserNotifications(req, res, next));
router.patch('/read-all', (req, res, next) => notificationsController.markAllAsRead(req, res, next));
router.patch('/:id/read', (req, res, next) => notificationsController.markAsRead(req, res, next));

export default router;
