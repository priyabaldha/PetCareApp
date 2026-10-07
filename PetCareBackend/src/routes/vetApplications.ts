import { Router } from 'express';
import { ObjectId } from 'mongodb';

import { database } from '../database.ts';
import type { User } from '../models/user.ts';
import { recordAuditLog } from '../models/auditLog.ts';
import { requireSession } from '../middleware/requireSession.ts';
import { requireRole } from '../middleware/requireRole.ts';

interface ApplicationFields {
  qualifications: string;
  registrationNumber: string;
  registrationCouncil: string;
  clinicName: string;
  clinicAddress: string;
}

interface VetApplication extends ApplicationFields {
  revision: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  reviewedAt: Date | null;
  reviewedBy: ObjectId | null;
  reviewReason: string;
}

interface ApplicantUser extends User {
  vetApplication?: VetApplication;
}

const users = database.collection<ApplicantUser>('users');
const router = Router();

router.use(requireSession);

function publicApplication(application: VetApplication) {
  return {
    qualifications: application.qualifications,
    registrationNumber: application.registrationNumber,
    registrationCouncil: application.registrationCouncil,
    clinicName: application.clinicName,
    clinicAddress: application.clinicAddress,
    revision: application.revision,
    status: application.status,
    submittedAt: application.submittedAt.toISOString(),
    reviewedAt: application.reviewedAt?.toISOString() ?? null,
    reviewReason: application.reviewReason,
  };
}

function validateFields(body: unknown): ApplicationFields {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new Error('Provide application details.');
  }

  const input = body as Record<string, unknown>;

  const allowed = [
    'qualifications',
    'registrationNumber',
    'registrationCouncil',
    'clinicName',
    'clinicAddress',
  ];

  if (Object.keys(input).some((key) => !allowed.includes(key))) {
    throw new Error('Unknown application field.');
  }

  function field(key: string, label: string, max: number) {
    const value = input[key];

    if (
      typeof value !== 'string' ||
      value.trim().length < 2 ||
      value.trim().length > max
    ) {
      throw new Error(`${label} must contain 2 to ${max} characters.`);
    }

    return value.trim();
  }

  return {
    qualifications: field('qualifications', 'Qualifications', 300),
    registrationNumber: field(
      'registrationNumber',
      'Registration number',
      100,
    ),
    registrationCouncil: field(
      'registrationCouncil',
      'Registration council / authority',
      200,
    ),
    clinicName: field('clinicName', 'Clinic name', 150),
    clinicAddress: field('clinicAddress', 'Clinic address', 500),
  };
}

// Owner can see their own application.
// Approved vets can also retrieve their application.
router.get(
  '/me',
  requireRole('pet_owner', 'vet'),
  async (_request, response) => {
    const user = await users.findOne(
      { _id: response.locals.userId },
      { projection: { vetApplication: 1 } },
    );

    if (!user) {
      response.status(401).json({
        success: false,
        message: 'Account unavailable. Sign in again.',
      });
      return;
    }

    response.json({
      success: true,
      application: user.vetApplication
        ? publicApplication(user.vetApplication)
        : null,
    });
  },
);

// New applications and rejected applications can be submitted.
// Pending applications cannot be overwritten.
router.post(
  '/me',
  requireRole('pet_owner'),
  async (request, response) => {
    let fields: ApplicationFields;

    try {
      fields = validateFields(request.body);
    } catch (error: unknown) {
      response.status(400).json({
        success: false,
        message:
          error instanceof Error ? error.message : 'Invalid application.',
      });
      return;
    }

    const now = new Date();

    const application: VetApplication = {
      ...fields,
      revision: new ObjectId().toHexString(),
      status: 'pending',
      submittedAt: now,
      reviewedAt: null,
      reviewedBy: null,
      reviewReason: '',
    };

    const user = await users.findOneAndUpdate(
      {
        _id: response.locals.userId,
        role: 'pet_owner',
        $or: [
          { vetApplication: { $exists: false } },
          { 'vetApplication.status': 'rejected' },
        ],
      },
      {
        $set: {
          vetApplication: application,
          updatedAt: now,
        },
      },
      {
        returnDocument: 'after',
        includeResultMetadata: false,
        projection: { _id: 1 },
      },
    );

    if (!user) {
      response.status(409).json({
        success: false,
        message:
          'Your application or account status changed. Refresh before continuing.',
      });
      return;
    }

    response.status(201).json({
      success: true,
      application: publicApplication(application),
    });
  },
);

// Show the oldest 50 pending applications.
// Refreshing after decisions brings the next applications into the queue.
router.get(
  '/pending',
  requireRole('admin'),
  async (_request, response) => {
    const results = await users
      .find(
        {
          role: 'pet_owner',
          'vetApplication.status': 'pending',
        },
        {
          projection: {
            name: 1,
            email: 1,
            vetApplication: 1,
          },
        },
      )
      .sort({ 'vetApplication.submittedAt': 1, _id: 1 })
      .limit(51)
      .toArray();

    response.json({
      success: true,
      hasMore: results.length > 50,
      applications: results.slice(0, 50).map((user) => ({
        userId: user._id.toHexString(),
        name: user.name,
        email: user.email,
        application: publicApplication(user.vetApplication!),
      })),
    });
  },
);

router.post(
  '/:userId/review',
  requireRole('admin'),
  async (request, response) => {
    const userId = String(request.params.userId);

    if (!/^[a-f0-9]{24}$/i.test(userId)) {
      response.status(400).json({
        success: false,
        message: 'Invalid applicant ID.',
      });
      return;
    }

    const body: unknown = request.body;

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      response.status(400).json({
        success: false,
        message: 'Provide a review decision.',
      });
      return;
    }

    const input = body as Record<string, unknown>;

    if (
      Object.keys(input).some(
        (key) => !['revision', 'decision', 'reason'].includes(key),
      ) ||
      typeof input.revision !== 'string' ||
      !/^[a-f0-9]{24}$/i.test(input.revision) ||
      (input.decision !== 'approved' && input.decision !== 'rejected') ||
      typeof input.reason !== 'string' ||
      input.reason.trim().length > 1000
    ) {
      response.status(400).json({
        success: false,
        message: 'Invalid review details.',
      });
      return;
    }

    const reason = input.reason.trim();

    if (input.decision === 'rejected' && reason.length < 5) {
      response.status(400).json({
        success: false,
        message: 'Provide a rejection reason with at least 5 characters.',
      });
      return;
    }

    const targetUser = await users.findOne({
      _id: new ObjectId(userId),
      role: 'pet_owner',
      'vetApplication.status': 'pending',
      'vetApplication.revision': input.revision,
    });

    if (!targetUser || !targetUser.vetApplication) {
      response.status(409).json({
        success: false,
        message:
          'This application has changed or was already reviewed. Refresh the queue.',
      });
      return;
    }

    const now = new Date();

    const historyEntry = {
      qualifications: targetUser.vetApplication.qualifications,
      registrationNumber: targetUser.vetApplication.registrationNumber,
      registrationCouncil: targetUser.vetApplication.registrationCouncil,
      clinicName: targetUser.vetApplication.clinicName,
      clinicAddress: targetUser.vetApplication.clinicAddress,
      revision: input.revision,
      status: input.decision as 'approved' | 'rejected',
      submittedAt: targetUser.vetApplication.submittedAt,
      reviewedAt: now,
      reviewedBy: response.locals.userId as ObjectId,
      reviewReason: reason,
    };

    const result = await users.updateOne(
      {
        _id: new ObjectId(userId),
        role: 'pet_owner',
        'vetApplication.status': 'pending',
        'vetApplication.revision': input.revision,
      },
      {
        $set: {
          role: input.decision === 'approved' ? 'vet' : 'pet_owner',
          'vetApplication.status': input.decision,
          'vetApplication.reviewedAt': now,
          'vetApplication.reviewedBy': response.locals.userId as ObjectId,
          'vetApplication.reviewReason': reason,
          updatedAt: now,
        },
        $push: {
          vetApplicationHistory: historyEntry,
        },
      },
    );

    if (result.modifiedCount !== 1) {
      response.status(409).json({
        success: false,
        message:
          'This application has changed or was already reviewed. Refresh the queue.',
      });
      return;
    }

    await recordAuditLog({
      actorId: response.locals.userId as ObjectId,
      actorName: (response.locals.userName as string) || 'Admin',
      actorEmail: (response.locals.userEmail as string) || '',
      actorRole: 'admin',
      action: input.decision === 'approved' ? 'vet_approved' : 'vet_rejected',
      targetType: 'vet_application',
      targetId: userId,
      targetName: targetUser.name,
      reason,
      details: {
        revision: input.revision,
        decision: input.decision,
        clinicName: targetUser.vetApplication.clinicName,
      },
    });

    response.json({ success: true });
  },
);

export default router;