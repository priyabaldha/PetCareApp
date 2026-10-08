import type { ObjectId, WithId } from 'mongodb';
import { database } from '../database.ts';

export type AccessScope = 'full_history' | 'consultation_only';
export type AccessStatus = 'active' | 'revoked';

export interface PetAccessGrantDocument {
  _id?: ObjectId;
  petId: ObjectId;
  ownerId: ObjectId;
  vetId: ObjectId;
  scope: AccessScope;
  status: AccessStatus;
  grantedAt: Date;
  revokedAt?: Date | null;
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const petAccessGrantsCollection =
  database.collection<PetAccessGrantDocument>('petAccessGrants');

export async function createPetAccessGrantIndexes(): Promise<void> {
  await petAccessGrantsCollection.createIndex(
    { petId: 1, vetId: 1 },
    { name: 'pet_vet_grant' },
  );
  await petAccessGrantsCollection.createIndex(
    { vetId: 1, status: 1 },
    { name: 'vet_grants_status' },
  );
  await petAccessGrantsCollection.createIndex(
    { ownerId: 1, status: 1 },
    { name: 'owner_grants_status' },
  );
}

export function publicPetAccessGrant(grant: WithId<PetAccessGrantDocument>) {
  return {
    id: grant._id.toHexString(),
    petId: grant.petId.toHexString(),
    ownerId: grant.ownerId.toHexString(),
    vetId: grant.vetId.toHexString(),
    scope: grant.scope,
    status: grant.status,
    grantedAt: grant.grantedAt.toISOString(),
    revokedAt: grant.revokedAt ? grant.revokedAt.toISOString() : null,
    reason: grant.reason || '',
  };
}
