import { notificationsService } from './notifications.service.js';

export class NotificationsController {
  async getUserNotifications(req, res, next) {
    try {
      const notifications = await notificationsService.getUserNotifications(req.user.id);
      res.status(200).json({
        status: 'success',
        data: notifications
      });
    } catch (err) {
      next(err);
    }
  }

  async markAsRead(req, res, next) {
    try {
      const { id } = req.params;
      const notification = await notificationsService.markAsRead(id, req.user.id);
      res.status(200).json({
        status: 'success',
        data: notification
      });
    } catch (err) {
      next(err);
    }
  }

  async markAllAsRead(req, res, next) {
    try {
      await notificationsService.markAllAsRead(req.user.id);
      res.status(200).json({
        status: 'success',
        message: 'All notifications marked as read'
      });
    } catch (err) {
      next(err);
    }
  }
}

export const notificationsController = new NotificationsController();
