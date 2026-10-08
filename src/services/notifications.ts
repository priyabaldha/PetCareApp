import { authenticatedRequest } from './auth';

export type NotificationType =
  | 'booking_request'
  | 'booking_confirmed'
  | 'booking_rejected'
  | 'booking_cancelled'
  | 'reschedule_proposed'
  | 'reschedule_accepted'
  | 'reschedule_declined'
  | 'consultation_published'
  | 'prescription_added'
  | 'vaccination_recorded'
  | 'record_sharing_granted'
  | 'record_sharing_revoked';

export interface InAppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export async function fetchInAppNotifications(): Promise<{
  unreadCount: number;
  notifications: InAppNotification[];
}> {
  const data = await authenticatedRequest('/api/notifications');
  return {
    unreadCount: typeof data.unreadCount === 'number' ? data.unreadCount : 0,
    notifications: Array.isArray(data.notifications) ? (data.notifications as InAppNotification[]) : [],
  };
}

export async function fetchUnreadNotificationCount(): Promise<number> {
  const data = await authenticatedRequest('/api/notifications/unread-count');
  return typeof data.unreadCount === 'number' ? data.unreadCount : 0;
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  await authenticatedRequest(`/api/notifications/${encodeURIComponent(notificationId)}/read`, 'PATCH');
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await authenticatedRequest('/api/notifications/read-all', 'POST');
}
