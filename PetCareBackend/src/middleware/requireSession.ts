import { createHash } from 'node:crypto';
import type { RequestHandler } from 'express';
import type { ObjectId } from 'mongodb';
import { database } from '../database.ts';
import { usersCollection } from '../models/user.ts';

interface SessionRecord { tokenHash: string; userId: ObjectId; expiresAt: Date }
const sessions = database.collection<SessionRecord>('sessions');

export const requireSession: RequestHandler = async (request, response, next) => {
  const match = /^Bearer ([a-f0-9]{64})$/i.exec(request.headers.authorization ?? '');
  const token = match?.[1];
  const session = token ? await sessions.findOne({
    tokenHash: createHash('sha256').update(token).digest('hex'),
    expiresAt: { $gt: new Date() },
  }) : null;
  const user = session ? await usersCollection.findOne({ _id: session.userId }, { projection: { _id: 1 } }) : null;
  if (!session || !user) {
    response.status(401).json({ success: false, message: 'Your session has expired. Please sign in again.' });
    return;
  }
  response.locals.userId = user._id;
  response.setHeader('Cache-Control', 'no-store');
  next();
};
