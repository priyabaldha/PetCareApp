import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { MongoServerError } from 'mongodb';

import { usersCollection } from '../models/user.ts';
import type { User } from '../models/user.ts';

const authRouter = Router();

authRouter.post('/signup', async (request, response, next) => {
  const body: unknown = request.body;

  if (
    typeof body !== 'object' ||
    body === null ||
    Array.isArray(body)
  ) {
    response.status(400).json({
      success: false,
      message: 'Provide name, email, and password.',
    });
    return;
  }

  const input = body as Record<string, unknown>;

  if (
    typeof input.name !== 'string' ||
    typeof input.email !== 'string' ||
    typeof input.password !== 'string'
  ) {
    response.status(400).json({
      success: false,
      message: 'Name, email, and password must be text.',
    });
    return;
  }

  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (name.length < 2 || name.length > 100) {
    response.status(400).json({
      success: false,
      message: 'Name must contain between 2 and 100 characters.',
    });
    return;
  }

  if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    response.status(400).json({
      success: false,
      message: 'Enter a valid email address.',
    });
    return;
  }

  if (
    password.length < 8 ||
    Buffer.byteLength(password, 'utf8') > 72
  ) {
    response.status(400).json({
      success: false,
      message:
        'Password must contain at least 8 characters and no more than 72 UTF-8 bytes.',
    });
    return;
  }

  // Public signup cannot assign privileged roles.
  if (input.role !== undefined && input.role !== 'pet_owner') {
    response.status(400).json({
      success: false,
      message: 'Public signup only supports Pet Owner accounts.',
    });
    return;
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const now = new Date();

    const user: User = {
      name,
      email,
      passwordHash,
      role: 'pet_owner',
      createdAt: now,
      updatedAt: now,
    };

    const result = await usersCollection.insertOne(user);

    response.status(201).json({
      success: true,
      message: 'Account created successfully.',
      user: {
        id: result.insertedId.toHexString(),
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) {
      response.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
      return;
    }

    next(error);
  }
});

export default authRouter;