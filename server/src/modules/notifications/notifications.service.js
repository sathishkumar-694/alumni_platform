import { notificationsRepository } from './notifications.repository.js';

export class NotificationsService {
  async getUserNotifications(userId) {
    return await notificationsRepository.findByUserId(userId);
  }

  async markAsRead(id, userId) {
    return await notificationsRepository.markAsRead(id, userId);
  }

  async markAllAsRead(userId) {
    return await notificationsRepository.markAllAsRead(userId);
  }

  async createNotification({ user_id, type, title, desc, target_tab }) {
    return await notificationsRepository.createNotification({
      user_id,
      type,
      title,
      desc,
      target_tab
    });
  }
}

export const notificationsService = new NotificationsService();
