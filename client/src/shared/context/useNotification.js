import { useContext } from 'react';
import { NotificationContext } from './notification-context.js';

export const useNotification = () => useContext(NotificationContext);
