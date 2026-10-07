import { createHash } from 'node:crypto';
import type { RequestHandler } from 'express';
import type { ObjectId } from 'mongodb';

import { database } from '../database.ts';
import { usersCollection } from '../models/user.ts';

interface SessionRecord {
  tokenHash: string;
  userId: ObjectId;
  expiresAt: Date;
}

const sessions = database.collection<SessionRecord>('sessions');

export const requireSession: RequestHandler = async (
  request,
  response,
  next,
) => {
  const match = /^Bearer ([a-f0-9]{64})$/i.exec(
    request.headers.authorization ?? '',
  );

  const token = match?.[1];

  const session = token
    ? await sessions.findOne({
        tokenHash: createHash('sha256').update(token).digest('hex'),
        expiresAt: { $gt: new Date() },
      })
    : null;

  const user = session
    ? await usersCollection.findOne(
        { _id: session.userId },
        {
          projection: {
            _id: 1,
            name: 1,
            email: 1,
            role: 1,
            isSuspended: 1,
            suspendedReason: 1,
          },
        },
      )
    : null;

  if (!session || !user) {
    response.status(401).json({
      success: false,
      message: 'Your session has expired. Please sign in again.',
    });
    return;
  }

  if (user.isSuspended) {
    response.status(403).json({
      success: false,
      message: user.suspendedReason
        ? `Your account has been suspended: ${user.suspendedReason}`
        : 'Your account has been suspended. Please contact support.',
    });
    return;
  }

  if (
    user.role !== 'pet_owner' &&
    user.role !== 'vet' &&
    user.role !== 'admin'
  ) {
    response.status(403).json({
      success: false,
      message: 'This account does not have a valid role.',
    });
    return;
  }

  response.locals.userId = user._id;
  response.locals.userName = user.name;
  response.locals.userEmail = user.email;
  response.locals.userRole = user.role;

  response.setHeader('Cache-Control', 'no-store');
  next();
};