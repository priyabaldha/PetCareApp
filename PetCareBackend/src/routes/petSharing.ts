import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { database } from '../database.ts';
import { petsCollection } from '../models/pet.ts';
import { usersCollection } from '../models/user.ts';
import {
  petAccessGrantsCollection,
  publicPetAccessGrant,
  type AccessScope,
} from '../models/petAccessGrant.ts';
import { createNotification } from '../models/notification.ts';
import { requireSession } from '../middleware/requireSession.ts';

const petSharingRouter = Router();

petSharingRouter.use(requireSession);

// Middleware to verify pet ownership
petSharingRouter.use('/:petId/sharing', async (request, response, next) => {
  const petIdStr = String(request.params.petId);
  if (!/^[a-f0-9]{24}$/i.test(petIdStr)) {
    response.status(400).json({ success: false, message: 'Invalid pet ID.' });
    return;
  }

  const pet = await petsCollection.findOne({
    _id: new ObjectId(petIdStr),
    ownerId: response.locals.userId as ObjectId,
  });

  if (!pet) {
    response.status(404).json({ success: false, message: 'Pet not found or not owned by you.' });
    return;
  }

  response.locals.sharingPet = pet;
  next();
});

// List vets with access to this pet (active & historical)
petSharingRouter.get('/:petId/sharing', async (_request, response) => {
  const pet = response.locals.sharingPet;

  const grants = await petAccessGrantsCollection
    .find({ petId: pet._id })
    .sort({ grantedAt: -1 })
    .toArray();

  const vetIds = grants.map((g) => g.vetId);
  const vets = await usersCollection
    .find({ _id: { $in: vetIds } })
    .project({ _id: 1, name: 1, email: 1, 'vetApplication.clinicName': 1 })
    .toArray();

  const vetMap = new Map<string, { name: string; email: string; clinicName: string }>();
  for (const v of vets) {
    vetMap.set(v._id!.toHexString(), {
      name: v.name,
      email: v.email,
      clinicName: v.vetApplication?.clinicName || 'Veterinary Clinic',
    });
  }

  const result = grants.map((g) => {
    const vetInfo = vetMap.get(g.vetId.toHexString());
    return {
      ...publicPetAccessGrant(g),
      vetName: vetInfo?.name || 'Veterinarian',
      clinicName: vetInfo?.clinicName || 'Veterinary Clinic',
    };
  });

  response.json({
    success: true,
    grants: result,
  });
});

// Grant sharing access to a Vet
petSharingRouter.post('/:petId/sharing', async (request, response) => {
  const pet = response.locals.sharingPet;
  const body = (request.body || {}) as Record<string, unknown>;

  const vetIdStr = String(body.vetId || '').trim();
  const scope: AccessScope = body.scope === 'consultation_only' ? 'consultation_only' : 'full_history';

  if (!/^[a-f0-9]{24}$/i.test(vetIdStr)) {
    response.status(400).json({ success: false, message: 'Invalid vet ID.' });
    return;
  }

  const vetUser = await usersCollection.findOne({
    _id: new ObjectId(vetIdStr),
    role: 'vet',
    isSuspended: { $ne: true },
  });

  if (!vetUser) {
    response.status(404).json({ success: false, message: 'Vet not found or inactive.' });
    return;
  }

  const now = new Date();
  const grant = await petAccessGrantsCollection.findOneAndUpdate(
    {
      petId: pet._id,
      vetId: vetUser._id!,
    },
    {
      $set: {
        ownerId: pet.ownerId,
        scope,
        status: 'active',
        grantedAt: now,
        revokedAt: null,
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
      },
    },
    { upsert: true, returnDocument: 'after' },
  );

  // Notify the Vet
  await createNotification({
    userId: vetUser._id!,
    type: 'record_sharing_granted',
    title: 'Medical Records Shared 📂',
    message: `${response.locals.userName} shared medical records for ${pet.name} with you.`,
    data: {
      petId: pet._id!.toHexString(),
      petName: pet.name,
      scope,
    },
  });

  response.status(200).json({
    success: true,
    grant: publicPetAccessGrant(grant!),
    message: 'Medical records access granted.',
  });
});

// Revoke sharing access for a Vet
petSharingRouter.post('/:petId/sharing/:vetId/revoke', async (request, response) => {
  const pet = response.locals.sharingPet;
  const vetIdStr = String(request.params.vetId);
  const reason = String(request.body?.reason || 'Revoked by owner').trim();

  if (!/^[a-f0-9]{24}$/i.test(vetIdStr)) {
    response.status(400).json({ success: false, message: 'Invalid vet ID.' });
    return;
  }

  const now = new Date();
  const result = await petAccessGrantsCollection.updateOne(
    {
      petId: pet._id,
      vetId: new ObjectId(vetIdStr),
      status: 'active',
    },
    {
      $set: {
        status: 'revoked',
        revokedAt: now,
        reason,
        updatedAt: now,
      },
    },
  );

  if (result.matchedCount === 0) {
    response.status(404).json({
      success: false,
      message: 'No active sharing permission found for this vet.',
    });
    return;
  }

  // Notify Vet
  await createNotification({
    userId: new ObjectId(vetIdStr),
    type: 'record_sharing_revoked',
    title: 'Medical Record Access Revoked',
    message: `Record sharing access for ${pet.name} was revoked by the owner.`,
    data: {
      petId: pet._id!.toHexString(),
      petName: pet.name,
    },
  });

  response.json({
    success: true,
    message: 'Record access revoked successfully.',
  });
});

export default petSharingRouter;
