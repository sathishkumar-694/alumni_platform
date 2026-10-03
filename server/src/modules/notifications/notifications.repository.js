import { db } from '../../config/db.js';

export class NotificationsRepository {
  async findByUserId(userId) {
    return await db.notifications.findByUserId(userId);
  }

  async createNotification(data) {
    return await db.notifications.create(data);
  }

  async markAsRead(id, userId) {
    return await db.notifications.markAsRead(id, userId);
  }

  async markAllAsRead(userId) {
    return await db.notifications.markAllAsRead(userId);
  }
}

export const notificationsRepository = new NotificationsRepository();
