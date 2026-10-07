import { createHash } from 'node:crypto';
import { Router } from 'express';
import type { Request } from 'express';
import type { ObjectId } from 'mongodb';

import { database } from '../database.ts';
import { usersCollection } from '../models/user.ts';
import {
  announcementsCollection,
  type AnnouncementAudience,
} from '../models/announcement.ts';

interface SessionRecord {
  tokenHash: string;
  userId: ObjectId;
  expiresAt: Date;
}

const sessions = database.collection<SessionRecord>('sessions');
const announcementsRouter = Router();

async function getOptionalUserRole(
  request: Request,
): Promise<'pet_owner' | 'vet' | 'admin' | null> {
  const match = /^Bearer ([a-f0-9]{64})$/i.exec(
    request.headers.authorization ?? '',
  );
  const token = match?.[1];
  if (!token) return null;

  const session = await sessions.findOne({
    tokenHash: createHash('sha256').update(token).digest('hex'),
    expiresAt: { $gt: new Date() },
  });
  if (!session) return null;

  const user = await usersCollection.findOne(
    { _id: session.userId, isSuspended: { $ne: true } },
    { projection: { role: 1 } },
  );

  return user?.role ?? null;
}

announcementsRouter.get('/', async (request, response) => {
  response.setHeader('Cache-Control', 'no-store');
  const role = await getOptionalUserRole(request);

  const allowedAudiences: AnnouncementAudience[] = ['all'];
  if (role === 'pet_owner') allowedAudiences.push('pet_owners');
  if (role === 'vet') allowedAudiences.push('vets');
  if (role === 'admin') allowedAudiences.push('pet_owners', 'vets');

  const items = await announcementsCollection
    .find({
      status: 'published',
      audience: { $in: allowedAudiences },
    })
    .sort({ priority: -1, publishedAt: -1, createdAt: -1 })
    .toArray();

  response.json({
    success: true,
    announcements: items.map((item) => ({
      id: item._id?.toHexString(),
      title: item.title,
      content: item.content,
      audience: item.audience,
      priority: item.priority,
      publishedAt: item.publishedAt ? item.publishedAt.toISOString() : null,
      createdAt: item.createdAt.toISOString(),
    })),
  });
});

export default announcementsRouter;
