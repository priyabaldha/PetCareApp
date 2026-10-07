import { Router } from 'express';
import { ObjectId } from 'mongodb';

import { database } from '../database.ts';
import { usersCollection, type UserRole } from '../models/user.ts';
import { petsCollection } from '../models/pet.ts';
import {
  guidesCollection,
  type Guide,
  type GuideSection,
} from '../models/guide.ts';
import {
  announcementsCollection,
  type Announcement,
  type AnnouncementAudience,
  type AnnouncementPriority,
  type AnnouncementStatus,
} from '../models/announcement.ts';
import {
  auditLogsCollection,
  recordAuditLog,
} from '../models/auditLog.ts';
import { requireSession } from '../middleware/requireSession.ts';
import { requireRole } from '../middleware/requireRole.ts';

const adminRouter = Router();

adminRouter.use(requireSession);
adminRouter.use(requireRole('admin'));

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parsePagination(query: Record<string, unknown>) {
  const page = Math.max(1, parseInt(String(query.page || '1'), 10) || 1);
  const limit = Math.min(
    50,
    Math.max(1, parseInt(String(query.limit || '15'), 10) || 15),
  );
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

/* ==========================================================================
   1. OVERVIEW & RECENT ACTIVITY
   ========================================================================== */

adminRouter.get('/overview', async (_request, response) => {
  const [
    petOwners,
    vets,
    admins,
    pets,
    suspendedUsers,
    pendingVetApplications,
    appointments,
    announcements,
    guides,
    recentAuditLogs,
  ] = await Promise.all([
    usersCollection.countDocuments({ role: 'pet_owner', isSuspended: { $ne: true } }),
    usersCollection.countDocuments({ role: 'vet', isSuspended: { $ne: true } }),
    usersCollection.countDocuments({ role: 'admin', isSuspended: { $ne: true } }),
    petsCollection.countDocuments(),
    usersCollection.countDocuments({ isSuspended: true }),
    usersCollection.countDocuments({
      role: 'pet_owner',
      'vetApplication.status': 'pending',
    }),
    database.collection('appointments').countDocuments(),
    announcementsCollection.countDocuments(),
    guidesCollection.countDocuments(),
    auditLogsCollection
      .find({})
      .sort({ createdAt: -1 })
      .limit(8)
      .toArray(),
  ]);

  response.json({
    success: true,
    overview: {
      petOwners,
      vets,
      admins,
      pets,
      suspendedUsers,
      pendingVetApplications,
      appointments,
      announcements,
      guides,
    },
    recentActivity: recentAuditLogs.map((log) => ({
      id: log._id?.toHexString(),
      action: log.action,
      actorName: log.actorName,
      actorEmail: log.actorEmail,
      targetType: log.targetType,
      targetId: log.targetId,
      targetName: log.targetName,
      reason: log.reason,
      createdAt: log.createdAt.toISOString(),
    })),
  });
});

/* ==========================================================================
   2. USER MANAGEMENT
   ========================================================================== */

adminRouter.get('/users', async (request, response) => {
  const { page, limit, skip } = parsePagination(
    request.query as Record<string, unknown>,
  );
  const search = String(request.query.search || '').trim();
  const role = String(request.query.role || 'all').trim();
  const status = String(request.query.status || 'all').trim();

  const filter: Record<string, unknown> = {};

  if (role && role !== 'all') {
    filter.role = role;
  }

  if (status === 'suspended') {
    filter.isSuspended = true;
  } else if (status === 'active') {
    filter.isSuspended = { $ne: true };
  }

  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: regex }, { email: regex }];
  }

  const [total, usersList] = await Promise.all([
    usersCollection.countDocuments(filter),
    usersCollection
      .find(filter, {
        projection: {
          passwordHash: 0,
        },
      })
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
  ]);

  // Fetch pet counts for these users in one batch
  const userIds = usersList.map((u) => u._id!);
  const petCounts = await petsCollection
    .aggregate<{ _id: ObjectId; count: number }>([
      { $match: { ownerId: { $in: userIds } } },
      { $group: { _id: '$ownerId', count: { $sum: 1 } } },
    ])
    .toArray();

  const petCountMap = new Map<string, number>();
  petCounts.forEach((pc) => petCountMap.set(pc._id.toHexString(), pc.count));

  response.json({
    success: true,
    users: usersList.map((user) => ({
      id: user._id?.toHexString(),
      name: user.name,
      email: user.email,
      role: user.role,
      isSuspended: Boolean(user.isSuspended),
      suspendedAt: user.suspendedAt ? user.suspendedAt.toISOString() : null,
      suspendedReason: user.suspendedReason || '',
      petCount: petCountMap.get(user._id!.toHexString()) || 0,
      hasVetApplication: Boolean(user.vetApplication),
      vetApplicationStatus: user.vetApplication?.status || null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  });
});

adminRouter.get('/users/:userId', async (request, response) => {
  const userIdStr = String(request.params.userId);
  if (!/^[a-f0-9]{24}$/i.test(userIdStr)) {
    response.status(400).json({ success: false, message: 'Invalid user ID.' });
    return;
  }

  const userId = new ObjectId(userIdStr);
  const user = await usersCollection.findOne(
    { _id: userId },
    { projection: { passwordHash: 0 } },
  );

  if (!user) {
    response.status(404).json({ success: false, message: 'User not found.' });
    return;
  }

  // Fetch safe basic pet info (name, species, breed, gender, DOB, weight - NO health notes)
  const pets = await petsCollection
    .find(
      { ownerId: userId },
      {
        projection: {
          name: 1,
          species: 1,
          breed: 1,
          sex: 1,
          dateOfBirth: 1,
          weightKg: 1,
          createdAt: 1,
        },
      },
    )
    .sort({ createdAt: -1 })
    .toArray();

  response.json({
    success: true,
    user: {
      id: user._id?.toHexString(),
      name: user.name,
      email: user.email,
      role: user.role,
      isSuspended: Boolean(user.isSuspended),
      suspendedAt: user.suspendedAt ? user.suspendedAt.toISOString() : null,
      suspendedReason: user.suspendedReason || '',
      vetApplication: user.vetApplication
        ? {
            qualifications: user.vetApplication.qualifications,
            registrationNumber: user.vetApplication.registrationNumber,
            registrationCouncil: user.vetApplication.registrationCouncil,
            clinicName: user.vetApplication.clinicName,
            clinicAddress: user.vetApplication.clinicAddress,
            status: user.vetApplication.status,
            revision: user.vetApplication.revision,
            submittedAt: user.vetApplication.submittedAt.toISOString(),
            reviewedAt: user.vetApplication.reviewedAt
              ? user.vetApplication.reviewedAt.toISOString()
              : null,
            reviewReason: user.vetApplication.reviewReason,
          }
        : null,
      vetApplicationHistory: (user.vetApplicationHistory || []).map((h) => ({
        qualifications: h.qualifications,
        registrationNumber: h.registrationNumber,
        registrationCouncil: h.registrationCouncil,
        clinicName: h.clinicName,
        clinicAddress: h.clinicAddress,
        status: h.status,
        revision: h.revision,
        submittedAt: h.submittedAt.toISOString(),
        reviewedAt: h.reviewedAt.toISOString(),
        reviewReason: h.reviewReason,
      })),
      pets: pets.map((p) => ({
        id: p._id?.toHexString(),
        name: p.name,
        species: p.species,
        breed: p.breed,
        sex: p.sex,
        dateOfBirth: p.dateOfBirth ?? null,
        weightKg: p.weightKg ?? null,
        createdAt: p.createdAt.toISOString(),
      })),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    },
  });
});

adminRouter.post('/users/:userId/suspend', async (request, response) => {
  const userIdStr = String(request.params.userId);
  if (!/^[a-f0-9]{24}$/i.test(userIdStr)) {
    response.status(400).json({ success: false, message: 'Invalid user ID.' });
    return;
  }

  const currentAdminId = response.locals.userId as ObjectId;
  const targetId = new ObjectId(userIdStr);

  if (targetId.equals(currentAdminId)) {
    response.status(400).json({
      success: false,
      message: 'Self-lockout protection: You cannot suspend your own admin account.',
    });
    return;
  }

  const body = request.body as Record<string, unknown>;
  const reason = typeof body?.reason === 'string' ? body.reason.trim() : '';

  if (reason.length < 5 || reason.length > 500) {
    response.status(400).json({
      success: false,
      message: 'Suspension reason is required (5 to 500 characters).',
    });
    return;
  }

  const targetUser = await usersCollection.findOne({ _id: targetId });
  if (!targetUser) {
    response.status(404).json({ success: false, message: 'User not found.' });
    return;
  }

  if (targetUser.role === 'admin') {
    const activeAdminCount = await usersCollection.countDocuments({
      role: 'admin',
      isSuspended: { $ne: true },
      _id: { $ne: targetId },
    });

    if (activeAdminCount === 0) {
      response.status(400).json({
        success: false,
        message: 'Cannot suspend the last active administrator on the platform.',
      });
      return;
    }
  }

  const now = new Date();
  const updateResult = await usersCollection.updateOne(
    { _id: targetId },
    {
      $set: {
        isSuspended: true,
        suspendedAt: now,
        suspendedBy: currentAdminId,
        suspendedReason: reason,
        updatedAt: now,
      },
    },
  );

  if (updateResult.modifiedCount !== 1) {
    response.status(409).json({
      success: false,
      message: 'Account could not be suspended. Please refresh and retry.',
    });
    return;
  }

  // Immediately terminate all active sessions for suspended user
  await database.collection('sessions').deleteMany({ userId: targetId });

  await recordAuditLog({
    actorId: currentAdminId,
    actorName: (response.locals.userName as string) || 'Admin',
    actorEmail: (response.locals.userEmail as string) || '',
    actorRole: 'admin',
    action: 'user_suspended',
    targetType: 'user',
    targetId: userIdStr,
    targetName: targetUser.name,
    reason,
    details: {
      email: targetUser.email,
      role: targetUser.role,
    },
  });

  response.json({
    success: true,
    message: `Account for ${targetUser.name} has been suspended.`,
  });
});

adminRouter.post('/users/:userId/reactivate', async (request, response) => {
  const userIdStr = String(request.params.userId);
  if (!/^[a-f0-9]{24}$/i.test(userIdStr)) {
    response.status(400).json({ success: false, message: 'Invalid user ID.' });
    return;
  }

  const targetId = new ObjectId(userIdStr);
  const targetUser = await usersCollection.findOne({ _id: targetId });

  if (!targetUser) {
    response.status(404).json({ success: false, message: 'User not found.' });
    return;
  }

  const now = new Date();
  const updateResult = await usersCollection.updateOne(
    { _id: targetId },
    {
      $set: {
        isSuspended: false,
        suspendedAt: null,
        suspendedBy: null,
        suspendedReason: '',
        updatedAt: now,
      },
    },
  );

  if (updateResult.modifiedCount !== 1) {
    response.status(409).json({
      success: false,
      message: 'Account could not be reactivated. Please refresh and retry.',
    });
    return;
  }

  await recordAuditLog({
    actorId: response.locals.userId as ObjectId,
    actorName: (response.locals.userName as string) || 'Admin',
    actorEmail: (response.locals.userEmail as string) || '',
    actorRole: 'admin',
    action: 'user_reactivated',
    targetType: 'user',
    targetId: userIdStr,
    targetName: targetUser.name,
    reason: 'Account reinstated by administrator.',
    details: {
      email: targetUser.email,
      role: targetUser.role,
    },
  });

  response.json({
    success: true,
    message: `Account for ${targetUser.name} has been reactivated.`,
  });
});

/* ==========================================================================
   3. VET APPLICATIONS & HISTORY
   ========================================================================== */

adminRouter.get('/vet-applications', async (request, response) => {
  const { page, limit, skip } = parsePagination(
    request.query as Record<string, unknown>,
  );
  const status = String(request.query.status || 'all').trim();
  const search = String(request.query.search || '').trim();

  const filter: Record<string, unknown> = {
    vetApplication: { $exists: true },
  };

  if (status && status !== 'all') {
    filter['vetApplication.status'] = status;
  }

  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i');
    filter.$or = [
      { name: regex },
      { email: regex },
      { 'vetApplication.clinicName': regex },
      { 'vetApplication.registrationNumber': regex },
    ];
  }

  const [total, applicants] = await Promise.all([
    usersCollection.countDocuments(filter),
    usersCollection
      .find(filter, {
        projection: {
          name: 1,
          email: 1,
          role: 1,
          isSuspended: 1,
          vetApplication: 1,
          vetApplicationHistory: 1,
        },
      })
      .sort({ 'vetApplication.submittedAt': -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
  ]);

  response.json({
    success: true,
    applications: applicants.map((user) => ({
      userId: user._id!.toHexString(),
      name: user.name,
      email: user.email,
      role: user.role,
      isSuspended: Boolean(user.isSuspended),
      application: {
        qualifications: user.vetApplication!.qualifications,
        registrationNumber: user.vetApplication!.registrationNumber,
        registrationCouncil: user.vetApplication!.registrationCouncil,
        clinicName: user.vetApplication!.clinicName,
        clinicAddress: user.vetApplication!.clinicAddress,
        revision: user.vetApplication!.revision,
        status: user.vetApplication!.status,
        submittedAt: user.vetApplication!.submittedAt.toISOString(),
        reviewedAt: user.vetApplication!.reviewedAt
          ? user.vetApplication!.reviewedAt.toISOString()
          : null,
        reviewReason: user.vetApplication!.reviewReason || '',
      },
      historyCount: user.vetApplicationHistory?.length || 0,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  });
});

adminRouter.get('/vet-applications/:userId', async (request, response) => {
  const userIdStr = String(request.params.userId);
  if (!/^[a-f0-9]{24}$/i.test(userIdStr)) {
    response.status(400).json({ success: false, message: 'Invalid user ID.' });
    return;
  }

  const user = await usersCollection.findOne(
    { _id: new ObjectId(userIdStr) },
    {
      projection: {
        name: 1,
        email: 1,
        role: 1,
        isSuspended: 1,
        vetApplication: 1,
        vetApplicationHistory: 1,
      },
    },
  );

  if (!user || !user.vetApplication) {
    response.status(404).json({
      success: false,
      message: 'Vet application not found for this account.',
    });
    return;
  }

  response.json({
    success: true,
    application: {
      userId: user._id!.toHexString(),
      name: user.name,
      email: user.email,
      role: user.role,
      isSuspended: Boolean(user.isSuspended),
      current: {
        qualifications: user.vetApplication.qualifications,
        registrationNumber: user.vetApplication.registrationNumber,
        registrationCouncil: user.vetApplication.registrationCouncil,
        clinicName: user.vetApplication.clinicName,
        clinicAddress: user.vetApplication.clinicAddress,
        revision: user.vetApplication.revision,
        status: user.vetApplication.status,
        submittedAt: user.vetApplication.submittedAt.toISOString(),
        reviewedAt: user.vetApplication.reviewedAt
          ? user.vetApplication.reviewedAt.toISOString()
          : null,
        reviewReason: user.vetApplication.reviewReason || '',
      },
      history: (user.vetApplicationHistory || []).map((h) => ({
        qualifications: h.qualifications,
        registrationNumber: h.registrationNumber,
        registrationCouncil: h.registrationCouncil,
        clinicName: h.clinicName,
        clinicAddress: h.clinicAddress,
        revision: h.revision,
        status: h.status,
        submittedAt: h.submittedAt.toISOString(),
        reviewedAt: h.reviewedAt.toISOString(),
        reviewReason: h.reviewReason,
      })),
    },
  });
});

/* ==========================================================================
   4. PET & CARE OVERSIGHT (Strict Owner-level Privacy)
   ========================================================================== */

adminRouter.get('/pets/overview', async (_request, response) => {
  const [
    totalPets,
    vaccinationsCount,
    medicationsCount,
    appointmentsCount,
    speciesAgg,
  ] = await Promise.all([
    petsCollection.countDocuments(),
    database.collection('vaccinations').countDocuments(),
    database.collection('medications').countDocuments(),
    database.collection('appointments').countDocuments(),
    petsCollection
      .aggregate<{ _id: string; count: number }>([
        { $group: { _id: '$species', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ])
      .toArray(),
  ]);

  response.json({
    success: true,
    overview: {
      totalPets,
      vaccinationsCount,
      medicationsCount,
      appointmentsCount,
      speciesBreakdown: speciesAgg.map((s) => ({
        species: s._id || 'Other',
        count: s.count,
      })),
    },
  });
});

adminRouter.get('/pets', async (request, response) => {
  const { page, limit, skip } = parsePagination(
    request.query as Record<string, unknown>,
  );
  const search = String(request.query.search || '').trim();
  const species = String(request.query.species || 'all').trim();

  const match: Record<string, unknown> = {};

  if (species && species !== 'all') {
    match.species = species;
  }

  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i');
    match.$or = [
      { name: regex },
      { breed: regex },
      { species: regex },
    ];
  }

  const [total, petsList] = await Promise.all([
    petsCollection.countDocuments(match),
    petsCollection
      .aggregate([
        { $match: match },
        { $sort: { createdAt: -1, _id: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: 'users',
            localField: 'ownerId',
            foreignField: '_id',
            as: 'owner',
          },
        },
        {
          $project: {
            name: 1,
            species: 1,
            breed: 1,
            sex: 1,
            dateOfBirth: 1,
            weightKg: 1,
            createdAt: 1,
            ownerId: 1,
            ownerName: { $arrayElemAt: ['$owner.name', 0] },
            ownerEmail: { $arrayElemAt: ['$owner.email', 0] },
          },
        },
      ])
      .toArray(),
  ]);

  response.json({
    success: true,
    pets: petsList.map((pet) => ({
      id: pet._id.toHexString(),
      name: pet.name,
      species: pet.species,
      breed: pet.breed,
      sex: pet.sex,
      dateOfBirth: pet.dateOfBirth ?? null,
      weightKg: pet.weightKg ?? null,
      createdAt: new Date(pet.createdAt).toISOString(),
      ownerId: pet.ownerId?.toHexString() || '',
      ownerName: pet.ownerName || 'Unknown Owner',
      ownerEmail: pet.ownerEmail || '—',
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  });
});

/* ==========================================================================
   5. APPOINTMENT OVERSIGHT (Owner-entered Clinic Records)
   ========================================================================== */

adminRouter.get('/appointments', async (request, response) => {
  const { page, limit, skip } = parsePagination(
    request.query as Record<string, unknown>,
  );
  const search = String(request.query.search || '').trim();
  const timeframe = String(request.query.timeframe || 'all').trim();

  const match: Record<string, unknown> = {};

  const now = new Date();
  if (timeframe === 'upcoming') {
    match.date = { $gte: now };
  } else if (timeframe === 'past') {
    match.date = { $lt: now };
  }

  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i');
    match.$or = [
      { clinicName: regex },
      { reason: regex },
    ];
  }

  const appointmentsColl = database.collection('appointments');

  const [total, items] = await Promise.all([
    appointmentsColl.countDocuments(match),
    appointmentsColl
      .aggregate([
        { $match: match },
        { $sort: { date: -1, _id: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: 'pets',
            localField: 'petId',
            foreignField: '_id',
            as: 'pet',
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'ownerId',
            foreignField: '_id',
            as: 'owner',
          },
        },
        {
          $project: {
            clinicName: 1,
            date: 1,
            time: 1,
            reason: 1,
            notes: 1,
            petId: 1,
            ownerId: 1,
            createdAt: 1,
            petName: { $arrayElemAt: ['$pet.name', 0] },
            petSpecies: { $arrayElemAt: ['$pet.species', 0] },
            ownerName: { $arrayElemAt: ['$owner.name', 0] },
            ownerEmail: { $arrayElemAt: ['$owner.email', 0] },
          },
        },
      ])
      .toArray(),
  ]);

  response.json({
    success: true,
    appointments: items.map((apt) => ({
      id: apt._id.toHexString(),
      clinicName: apt.clinicName,
      date: apt.date instanceof Date ? apt.date.toISOString() : String(apt.date),
      time: apt.time,
      reason: apt.reason,
      petId: apt.petId?.toHexString() || '',
      petName: apt.petName || 'Pet',
      petSpecies: apt.petSpecies || 'Pet',
      ownerId: apt.ownerId?.toHexString() || '',
      ownerName: apt.ownerName || 'Owner',
      ownerEmail: apt.ownerEmail || '—',
      createdAt: apt.createdAt ? new Date(apt.createdAt).toISOString() : null,
      source: 'owner_recorded',
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  });
});

/* ==========================================================================
   6. GUIDES & CONTENT MANAGEMENT
   ========================================================================== */

adminRouter.get('/guides', async (request, response) => {
  const category = String(request.query.category || 'all').trim();
  const status = String(request.query.status || 'all').trim();
  const search = String(request.query.search || '').trim();

  const filter: Record<string, unknown> = {};
  if (category && category !== 'all') filter.category = category;
  if (status && status !== 'all') filter.status = status;
  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i');
    filter.$or = [
      { title: regex },
      { slug: regex },
      { category: regex },
    ];
  }

  const list = await guidesCollection
    .find(filter)
    .sort({ createdAt: -1 })
    .toArray();

  response.json({
    success: true,
    guides: list.map((g) => ({
      id: g._id?.toHexString(),
      slug: g.slug,
      title: g.title,
      category: g.category,
      status: g.status,
      sections: g.sections,
      authorName: g.authorName || '',
      reviewedBy: g.reviewedBy || '',
      createdAt: g.createdAt.toISOString(),
      updatedAt: g.updatedAt.toISOString(),
    })),
  });
});

adminRouter.post('/guides', async (request, response) => {
  const body = request.body as Record<string, unknown>;
  const title = typeof body?.title === 'string' ? body.title.trim() : '';
  const category = typeof body?.category === 'string' ? body.category.trim() : '';
  const slugInput = typeof body?.slug === 'string' ? body.slug.trim().toLowerCase() : '';
  const authorName = typeof body?.authorName === 'string' ? body.authorName.trim() : '';
  const reviewedBy = typeof body?.reviewedBy === 'string' ? body.reviewedBy.trim() : '';
  const sectionsInput = Array.isArray(body?.sections) ? body.sections : [];

  if (title.length < 3 || title.length > 150) {
    response.status(400).json({
      success: false,
      message: 'Title must contain between 3 and 150 characters.',
    });
    return;
  }

  if (category.length < 2 || category.length > 50) {
    response.status(400).json({
      success: false,
      message: 'Category must contain between 2 and 50 characters.',
    });
    return;
  }

  const slug =
    slugInput ||
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') ||
    new ObjectId().toHexString();

  const existing = await guidesCollection.findOne({ slug });
  if (existing) {
    response.status(409).json({
      success: false,
      message: 'A guide with this slug already exists.',
    });
    return;
  }

  const sections: GuideSection[] = [];
  for (const s of sectionsInput) {
    if (typeof s === 'object' && s !== null) {
      const heading = typeof s.heading === 'string' ? s.heading.trim() : '';
      const text = typeof s.text === 'string' ? s.text.trim() : '';
      if (heading && text) {
        sections.push({ heading, text });
      }
    }
  }

  if (sections.length === 0) {
    response.status(400).json({
      success: false,
      message: 'Provide at least one section with heading and text.',
    });
    return;
  }

  const now = new Date();
  const guide: Guide = {
    slug,
    title,
    category,
    status: 'draft',
    sections,
    authorName: authorName || 'JEEVA Editorial',
    reviewedBy: reviewedBy || 'Admin Reviewed',
    createdAt: now,
    updatedAt: now,
  };

  const insertResult = await guidesCollection.insertOne(guide);

  await recordAuditLog({
    actorId: response.locals.userId as ObjectId,
    actorName: (response.locals.userName as string) || 'Admin',
    actorEmail: (response.locals.userEmail as string) || '',
    actorRole: 'admin',
    action: 'guide_created',
    targetType: 'guide',
    targetId: insertResult.insertedId.toHexString(),
    targetName: title,
    details: { slug, category },
  });

  response.status(201).json({
    success: true,
    guide: {
      id: insertResult.insertedId.toHexString(),
      slug: guide.slug,
      title: guide.title,
      category: guide.category,
      status: guide.status,
      sections: guide.sections,
      authorName: guide.authorName,
      reviewedBy: guide.reviewedBy,
      createdAt: guide.createdAt.toISOString(),
      updatedAt: guide.updatedAt.toISOString(),
    },
  });
});

adminRouter.patch('/guides/:id', async (request, response) => {
  const guideIdStr = String(request.params.id);
  const filter = /^[a-f0-9]{24}$/i.test(guideIdStr)
    ? { _id: new ObjectId(guideIdStr) }
    : { slug: guideIdStr };

  const existing = await guidesCollection.findOne(filter);
  if (!existing) {
    response.status(404).json({ success: false, message: 'Guide not found.' });
    return;
  }

  const body = request.body as Record<string, unknown>;
  const updateFields: Partial<Guide> = { updatedAt: new Date() };

  if (typeof body.title === 'string') {
    const t = body.title.trim();
    if (t.length < 3 || t.length > 150) {
      response.status(400).json({ success: false, message: 'Invalid title length.' });
      return;
    }
    updateFields.title = t;
  }

  if (typeof body.category === 'string') {
    const c = body.category.trim();
    if (c.length < 2 || c.length > 50) {
      response.status(400).json({ success: false, message: 'Invalid category.' });
      return;
    }
    updateFields.category = c;
  }

  if (typeof body.authorName === 'string') {
    updateFields.authorName = body.authorName.trim();
  }

  if (typeof body.reviewedBy === 'string') {
    updateFields.reviewedBy = body.reviewedBy.trim();
  }

  if (Array.isArray(body.sections)) {
    const validSections: GuideSection[] = [];
    for (const s of body.sections) {
      if (typeof s === 'object' && s !== null) {
        const heading = typeof s.heading === 'string' ? s.heading.trim() : '';
        const text = typeof s.text === 'string' ? s.text.trim() : '';
        if (heading && text) validSections.push({ heading, text });
      }
    }
    if (validSections.length > 0) updateFields.sections = validSections;
  }

  const updated = await guidesCollection.findOneAndUpdate(
    filter,
    { $set: updateFields },
    { returnDocument: 'after', includeResultMetadata: false },
  );

  if (!updated) {
    response.status(404).json({ success: false, message: 'Guide not found.' });
    return;
  }

  await recordAuditLog({
    actorId: response.locals.userId as ObjectId,
    actorName: (response.locals.userName as string) || 'Admin',
    actorEmail: (response.locals.userEmail as string) || '',
    actorRole: 'admin',
    action: 'guide_updated',
    targetType: 'guide',
    targetId: updated._id?.toHexString() || guideIdStr,
    targetName: updated.title,
    details: { changes: Object.keys(updateFields) },
  });

  response.json({
    success: true,
    guide: {
      id: updated._id?.toHexString(),
      slug: updated.slug,
      title: updated.title,
      category: updated.category,
      status: updated.status,
      sections: updated.sections,
      authorName: updated.authorName,
      reviewedBy: updated.reviewedBy,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    },
  });
});

adminRouter.post('/guides/:id/publish', async (request, response) => {
  const guideIdStr = String(request.params.id);
  const filter = /^[a-f0-9]{24}$/i.test(guideIdStr)
    ? { _id: new ObjectId(guideIdStr) }
    : { slug: guideIdStr };

  const updated = await guidesCollection.findOneAndUpdate(
    filter,
    { $set: { status: 'published', updatedAt: new Date() } },
    { returnDocument: 'after', includeResultMetadata: false },
  );

  if (!updated) {
    response.status(404).json({ success: false, message: 'Guide not found.' });
    return;
  }

  await recordAuditLog({
    actorId: response.locals.userId as ObjectId,
    actorName: (response.locals.userName as string) || 'Admin',
    actorEmail: (response.locals.userEmail as string) || '',
    actorRole: 'admin',
    action: 'guide_published',
    targetType: 'guide',
    targetId: updated._id?.toHexString() || guideIdStr,
    targetName: updated.title,
  });

  response.json({ success: true, message: `Guide "${updated.title}" published.` });
});

adminRouter.post('/guides/:id/unpublish', async (request, response) => {
  const guideIdStr = String(request.params.id);
  const filter = /^[a-f0-9]{24}$/i.test(guideIdStr)
    ? { _id: new ObjectId(guideIdStr) }
    : { slug: guideIdStr };

  const updated = await guidesCollection.findOneAndUpdate(
    filter,
    { $set: { status: 'unpublished', updatedAt: new Date() } },
    { returnDocument: 'after', includeResultMetadata: false },
  );

  if (!updated) {
    response.status(404).json({ success: false, message: 'Guide not found.' });
    return;
  }

  await recordAuditLog({
    actorId: response.locals.userId as ObjectId,
    actorName: (response.locals.userName as string) || 'Admin',
    actorEmail: (response.locals.userEmail as string) || '',
    actorRole: 'admin',
    action: 'guide_unpublished',
    targetType: 'guide',
    targetId: updated._id?.toHexString() || guideIdStr,
    targetName: updated.title,
  });

  response.json({ success: true, message: `Guide "${updated.title}" unpublished.` });
});

adminRouter.delete('/guides/:id', async (request, response) => {
  const guideIdStr = String(request.params.id);
  const filter = /^[a-f0-9]{24}$/i.test(guideIdStr)
    ? { _id: new ObjectId(guideIdStr) }
    : { slug: guideIdStr };

  const target = await guidesCollection.findOne(filter);
  if (!target) {
    response.status(404).json({ success: false, message: 'Guide not found.' });
    return;
  }

  await guidesCollection.deleteOne(filter);

  await recordAuditLog({
    actorId: response.locals.userId as ObjectId,
    actorName: (response.locals.userName as string) || 'Admin',
    actorEmail: (response.locals.userEmail as string) || '',
    actorRole: 'admin',
    action: 'guide_deleted',
    targetType: 'guide',
    targetId: target._id?.toHexString() || guideIdStr,
    targetName: target.title,
  });

  response.json({ success: true, message: `Guide "${target.title}" deleted.` });
});

/* ==========================================================================
   7. IN-APP ANNOUNCEMENTS
   ========================================================================== */

adminRouter.get('/announcements', async (_request, response) => {
  const list = await announcementsCollection
    .find({})
    .sort({ createdAt: -1 })
    .toArray();

  response.json({
    success: true,
    announcements: list.map((a) => ({
      id: a._id?.toHexString(),
      title: a.title,
      content: a.content,
      audience: a.audience,
      status: a.status,
      priority: a.priority,
      publishedAt: a.publishedAt ? a.publishedAt.toISOString() : null,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    })),
  });
});

adminRouter.post('/announcements', async (request, response) => {
  const body = request.body as Record<string, unknown>;
  const title = typeof body?.title === 'string' ? body.title.trim() : '';
  const content = typeof body?.content === 'string' ? body.content.trim() : '';
  const audience = (
    ['all', 'pet_owners', 'vets'].includes(String(body?.audience))
      ? String(body.audience)
      : 'all'
  ) as AnnouncementAudience;
  const priority = (
    ['normal', 'important', 'urgent'].includes(String(body?.priority))
      ? String(body.priority)
      : 'normal'
  ) as AnnouncementPriority;

  if (title.length < 3 || title.length > 150) {
    response.status(400).json({
      success: false,
      message: 'Announcement title must contain between 3 and 150 characters.',
    });
    return;
  }

  if (content.length < 5 || content.length > 2000) {
    response.status(400).json({
      success: false,
      message: 'Announcement content must contain between 5 and 2000 characters.',
    });
    return;
  }

  const now = new Date();
  const announcement: Announcement = {
    title,
    content,
    audience,
    status: 'draft',
    priority,
    publishedAt: null,
    createdBy: response.locals.userId as ObjectId,
    createdAt: now,
    updatedAt: now,
  };

  const insertResult = await announcementsCollection.insertOne(announcement);

  await recordAuditLog({
    actorId: response.locals.userId as ObjectId,
    actorName: (response.locals.userName as string) || 'Admin',
    actorEmail: (response.locals.userEmail as string) || '',
    actorRole: 'admin',
    action: 'announcement_created',
    targetType: 'announcement',
    targetId: insertResult.insertedId.toHexString(),
    targetName: title,
    details: { audience, priority },
  });

  response.status(201).json({
    success: true,
    announcement: {
      id: insertResult.insertedId.toHexString(),
      title: announcement.title,
      content: announcement.content,
      audience: announcement.audience,
      status: announcement.status,
      priority: announcement.priority,
      publishedAt: null,
      createdAt: announcement.createdAt.toISOString(),
      updatedAt: announcement.updatedAt.toISOString(),
    },
  });
});

adminRouter.patch('/announcements/:id', async (request, response) => {
  const idStr = String(request.params.id);
  if (!/^[a-f0-9]{24}$/i.test(idStr)) {
    response.status(400).json({ success: false, message: 'Invalid announcement ID.' });
    return;
  }

  const targetId = new ObjectId(idStr);
  const existing = await announcementsCollection.findOne({ _id: targetId });
  if (!existing) {
    response.status(404).json({ success: false, message: 'Announcement not found.' });
    return;
  }

  const body = request.body as Record<string, unknown>;
  const updateFields: Partial<Announcement> = { updatedAt: new Date() };

  if (typeof body.title === 'string') {
    const t = body.title.trim();
    if (t.length < 3 || t.length > 150) {
      response.status(400).json({ success: false, message: 'Invalid title length.' });
      return;
    }
    updateFields.title = t;
  }

  if (typeof body.content === 'string') {
    const c = body.content.trim();
    if (c.length < 5 || c.length > 2000) {
      response.status(400).json({ success: false, message: 'Invalid content length.' });
      return;
    }
    updateFields.content = c;
  }

  if (['all', 'pet_owners', 'vets'].includes(String(body.audience))) {
    updateFields.audience = body.audience as AnnouncementAudience;
  }

  if (['normal', 'important', 'urgent'].includes(String(body.priority))) {
    updateFields.priority = body.priority as AnnouncementPriority;
  }

  const updated = await announcementsCollection.findOneAndUpdate(
    { _id: targetId },
    { $set: updateFields },
    { returnDocument: 'after', includeResultMetadata: false },
  );

  if (!updated) {
    response.status(404).json({ success: false, message: 'Announcement not found.' });
    return;
  }

  await recordAuditLog({
    actorId: response.locals.userId as ObjectId,
    actorName: (response.locals.userName as string) || 'Admin',
    actorEmail: (response.locals.userEmail as string) || '',
    actorRole: 'admin',
    action: 'announcement_updated',
    targetType: 'announcement',
    targetId: idStr,
    targetName: updated.title,
  });

  response.json({
    success: true,
    announcement: {
      id: updated._id?.toHexString(),
      title: updated.title,
      content: updated.content,
      audience: updated.audience,
      status: updated.status,
      priority: updated.priority,
      publishedAt: updated.publishedAt ? updated.publishedAt.toISOString() : null,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    },
  });
});

adminRouter.post('/announcements/:id/publish', async (request, response) => {
  const idStr = String(request.params.id);
  if (!/^[a-f0-9]{24}$/i.test(idStr)) {
    response.status(400).json({ success: false, message: 'Invalid announcement ID.' });
    return;
  }

  const targetId = new ObjectId(idStr);
  const now = new Date();
  const updated = await announcementsCollection.findOneAndUpdate(
    { _id: targetId },
    { $set: { status: 'published', publishedAt: now, updatedAt: now } },
    { returnDocument: 'after', includeResultMetadata: false },
  );

  if (!updated) {
    response.status(404).json({ success: false, message: 'Announcement not found.' });
    return;
  }

  await recordAuditLog({
    actorId: response.locals.userId as ObjectId,
    actorName: (response.locals.userName as string) || 'Admin',
    actorEmail: (response.locals.userEmail as string) || '',
    actorRole: 'admin',
    action: 'announcement_published',
    targetType: 'announcement',
    targetId: idStr,
    targetName: updated.title,
  });

  response.json({
    success: true,
    message: `Announcement "${updated.title}" published.`,
  });
});

adminRouter.post('/announcements/:id/unpublish', async (request, response) => {
  const idStr = String(request.params.id);
  if (!/^[a-f0-9]{24}$/i.test(idStr)) {
    response.status(400).json({ success: false, message: 'Invalid announcement ID.' });
    return;
  }

  const targetId = new ObjectId(idStr);
  const updated = await announcementsCollection.findOneAndUpdate(
    { _id: targetId },
    { $set: { status: 'unpublished', updatedAt: new Date() } },
    { returnDocument: 'after', includeResultMetadata: false },
  );

  if (!updated) {
    response.status(404).json({ success: false, message: 'Announcement not found.' });
    return;
  }

  await recordAuditLog({
    actorId: response.locals.userId as ObjectId,
    actorName: (response.locals.userName as string) || 'Admin',
    actorEmail: (response.locals.userEmail as string) || '',
    actorRole: 'admin',
    action: 'announcement_unpublished',
    targetType: 'announcement',
    targetId: idStr,
    targetName: updated.title,
  });

  response.json({
    success: true,
    message: `Announcement "${updated.title}" unpublished.`,
  });
});

adminRouter.delete('/announcements/:id', async (request, response) => {
  const idStr = String(request.params.id);
  if (!/^[a-f0-9]{24}$/i.test(idStr)) {
    response.status(400).json({ success: false, message: 'Invalid announcement ID.' });
    return;
  }

  const targetId = new ObjectId(idStr);
  const target = await announcementsCollection.findOne({ _id: targetId });
  if (!target) {
    response.status(404).json({ success: false, message: 'Announcement not found.' });
    return;
  }

  await announcementsCollection.deleteOne({ _id: targetId });

  await recordAuditLog({
    actorId: response.locals.userId as ObjectId,
    actorName: (response.locals.userName as string) || 'Admin',
    actorEmail: (response.locals.userEmail as string) || '',
    actorRole: 'admin',
    action: 'announcement_deleted',
    targetType: 'announcement',
    targetId: idStr,
    targetName: target.title,
  });

  response.json({
    success: true,
    message: `Announcement "${target.title}" deleted.`,
  });
});

/* ==========================================================================
   8. AUDIT LOGS (Read-only System & Decision History)
   ========================================================================== */

adminRouter.get('/audit-logs', async (request, response) => {
  const { page, limit, skip } = parsePagination(
    request.query as Record<string, unknown>,
  );
  const action = String(request.query.action || 'all').trim();
  const targetType = String(request.query.targetType || 'all').trim();
  const search = String(request.query.search || '').trim();

  const filter: Record<string, unknown> = {};

  if (action && action !== 'all') {
    filter.action = action;
  }

  if (targetType && targetType !== 'all') {
    filter.targetType = targetType;
  }

  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i');
    filter.$or = [
      { actorName: regex },
      { actorEmail: regex },
      { targetName: regex },
      { reason: regex },
    ];
  }

  const [total, logs] = await Promise.all([
    auditLogsCollection.countDocuments(filter),
    auditLogsCollection
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
  ]);

  response.json({
    success: true,
    logs: logs.map((log) => ({
      id: log._id?.toHexString(),
      action: log.action,
      actorId: log.actorId.toHexString(),
      actorName: log.actorName,
      actorEmail: log.actorEmail,
      actorRole: log.actorRole,
      targetType: log.targetType,
      targetId: log.targetId,
      targetName: log.targetName || '',
      reason: log.reason || '',
      details: log.details || null,
      createdAt: log.createdAt.toISOString(),
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  });
});

/* ==========================================================================
   9. COMMUNITY STATUS / MODERATION DEPENDENCY
   ========================================================================== */

adminRouter.get('/community/status', async (_request, response) => {
  response.json({
    success: true,
    status: 'demo_mode',
    message:
      'Community feed currently uses client-side static demonstration stories. Moderation queues and report action endpoints will be activated when user posts and reports collections are deployed.',
    hasLivePosts: false,
    hasLiveReports: false,
  });
});

export default adminRouter;