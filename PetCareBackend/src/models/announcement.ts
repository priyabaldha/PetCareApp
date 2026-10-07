import type { ObjectId } from 'mongodb';
import { database } from '../database.ts';

export type AnnouncementAudience = 'all' | 'pet_owners' | 'vets';
export type AnnouncementStatus = 'published' | 'draft' | 'unpublished';
export type AnnouncementPriority = 'normal' | 'important' | 'urgent';

export interface Announcement {
  _id?: ObjectId;
  title: string;
  content: string;
  audience: AnnouncementAudience;
  status: AnnouncementStatus;
  priority: AnnouncementPriority;
  publishedAt: Date | null;
  createdBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const announcementsCollection =
  database.collection<Announcement>('announcements');

export async function createAnnouncementIndexes(): Promise<void> {
  await announcementsCollection.createIndex(
    { status: 1, audience: 1, createdAt: -1 },
    { name: 'announcement_feed' },
  );
  await announcementsCollection.createIndex(
    { createdAt: -1 },
    { name: 'announcement_created_desc' },
  );
}
