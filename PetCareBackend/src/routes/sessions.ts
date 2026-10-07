import { createHash, randomBytes } from 'node:crypto';
import { Router } from 'express';
import type { Request } from 'express';
import type { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { rateLimit } from 'express-rate-limit';
import { database } from '../database.ts';
import { usersCollection } from '../models/user.ts';
import { requireSession } from '../middleware/requireSession.ts';

interface Session {
  tokenHash: string;
  userId: ObjectId;
  createdAt: Date;
  expiresAt: Date;
}
const sessions = database.collection<Session>('sessions');
const sessionRouter = Router();
const digest = (token: string): string => createHash('sha256').update(token).digest('hex');
let dummyHash: string;

export async function initializeSessions(): Promise<void> {
  await sessions.createIndex({ tokenHash: 1 }, { unique: true });
  await sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  dummyHash = await bcrypt.hash(randomBytes(32).toString('hex'), 12);
}

function readToken(request: Request): string | null {
  const match = /^Bearer ([a-f0-9]{64})$/i.exec(request.headers.authorization ?? '');
  return match?.[1] ?? null;
}

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Try again in 15 minutes.' },
});

sessionRouter.use((_request, response, next) => {
  response.setHeader('Cache-Control', 'no-store');
  next();
});

sessionRouter.post('/login', loginLimiter, async (request, response) => {
  const body: unknown = request.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    response.status(400).json({ success: false, message: 'Provide email and password.' });
    return;
  }
  const input = body as Record<string, unknown>;
  if (typeof input.email !== 'string' || typeof input.password !== 'string') {
    response.status(400).json({ success: false, message: 'Provide email and password.' });
    return;
  }
  const email = input.email.trim().toLowerCase();
  const password = input.password;
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
    response.status(401).json({ success: false, message: 'Incorrect email or password.' });
    return;
  }
  const user = await usersCollection.findOne({ email });
  const validPassword = await bcrypt.compare(password, user?.passwordHash ?? dummyHash);
  if (!user || !validPassword) {
    response.status(401).json({ success: false, message: 'Incorrect email or password.' });
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
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await sessions.insertOne({ tokenHash: digest(token), userId: user._id, createdAt: new Date(), expiresAt });
  response.json({
    success: true,
    token,
    expiresAt,
    user: { id: user._id.toHexString(), name: user.name, email: user.email, role: user.role },
  });
});

sessionRouter.get('/me', async (request, response) => {
  const token = readToken(request);
  const session = token ? await sessions.findOne({
    tokenHash: digest(token), expiresAt: { $gt: new Date() },
  }) : null;
  // Check expiry directly: MongoDB TTL cleanup is asynchronous.
  const user = session ? await usersCollection.findOne({ _id: session.userId }) : null;
  if (!session || !user) {
    response.status(401).json({ success: false, message: 'Your session has expired. Sign in again.' });
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
  response.json({ success: true, user: {
    id: user._id.toHexString(), name: user.name, email: user.email, role: user.role,
  } });
});

sessionRouter.post('/logout', async (request, response) => {
  const token = readToken(request);
  if (token) await sessions.deleteOne({ tokenHash: digest(token) });
  response.json({ success: true });
});

sessionRouter.patch('/me', requireSession, async (request, response) => {
  const body: unknown = request.body;

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    response.status(400).json({
      success: false,
      message: 'Provide your name.',
    });
    return;
  }

  const input = body as Record<string, unknown>;

  if (Object.keys(input).some((key) => key !== 'name')) {
    response.status(400).json({
      success: false,
      message: 'Only your name can be changed here.',
    });
    return;
  }

  if (
    typeof input.name !== 'string' ||
    input.name.trim().length < 2 ||
    input.name.trim().length > 100
  ) {
    response.status(400).json({
      success: false,
      message: 'Name must contain between 2 and 100 characters.',
    });
    return;
  }

  const user = await usersCollection.findOneAndUpdate(
    { _id: response.locals.userId },
    {
      $set: {
        name: input.name.trim(),
        updatedAt: new Date(),
      },
    },
    {
      returnDocument: 'after',
      includeResultMetadata: false,
    },
  );

  if (!user) {
    response.status(401).json({
      success: false,
      message: 'Your account is unavailable. Please sign in again.',
    });
    return;
  }

  response.json({
    success: true,
    user: {
      id: user._id.toHexString(),
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

export default sessionRouter;
