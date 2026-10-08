import type { ObjectId, WithId } from 'mongodb';
import { database } from '../database.ts';

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

export interface NotificationDocument {
  _id?: ObjectId;
  userId: ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: Date;
}

export const notificationsCollection =
  database.collection<NotificationDocument>('notifications');

export async function createNotificationIndexes(): Promise<void> {
  await notificationsCollection.createIndex(
    { userId: 1, createdAt: -1 },
    { name: 'user_notifications_date' },
  );
  await notificationsCollection.createIndex(
    { userId: 1, isRead: 1 },
    { name: 'user_notifications_unread' },
  );
}

export async function createNotification(params: {
  userId: ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}): Promise<void> {
  await notificationsCollection.insertOne({
    userId: params.userId,
    type: params.type,
    title: params.title,
    message: params.message,
    data: params.data || {},
    isRead: false,
    createdAt: new Date(),
  });
}

export function publicNotification(record: WithId<NotificationDocument>) {
  return {
    id: record._id.toHexString(),
    userId: record.userId.toHexString(),
    type: record.type,
    title: record.title,
    message: record.message,
    data: record.data || {},
    isRead: record.isRead,
    createdAt: record.createdAt.toISOString(),
  };
}
