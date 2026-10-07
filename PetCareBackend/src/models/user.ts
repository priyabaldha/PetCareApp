import type { ObjectId } from 'mongodb';
import { database } from '../database.ts';

export type UserRole = 'pet_owner' | 'vet' | 'admin';

export interface VetApplicationRecord {
  qualifications: string;
  registrationNumber: string;
  registrationCouncil: string;
  clinicName: string;
  clinicAddress: string;
  revision: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  reviewedAt: Date | null;
  reviewedBy: ObjectId | null;
  reviewReason: string;
}

export interface VetApplicationHistoryEntry {
  qualifications: string;
  registrationNumber: string;
  registrationCouncil: string;
  clinicName: string;
  clinicAddress: string;
  revision: string;
  status: 'approved' | 'rejected';
  submittedAt: Date;
  reviewedAt: Date;
  reviewedBy: ObjectId;
  reviewReason: string;
}

export interface User {
  _id?: ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  isSuspended?: boolean;
  suspendedAt?: Date | null;
  suspendedBy?: ObjectId | null;
  suspendedReason?: string;
  vetApplication?: VetApplicationRecord;
  vetApplicationHistory?: VetApplicationHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
}

export const usersCollection = database.collection<User>('users');

export async function createUserIndexes(): Promise<void> {
  await usersCollection.createIndex(
    { email: 1 },
    {
      unique: true,
      name: 'unique_user_email',
    },
  );
  await usersCollection.createIndex(
    { role: 1, 'vetApplication.status': 1 },
    { name: 'user_role_vetApp' },
  );
  await usersCollection.createIndex(
    { isSuspended: 1 },
    { name: 'user_isSuspended' },
  );
  await usersCollection.createIndex(
    { createdAt: -1 },
    { name: 'user_createdAt_desc' },
  );
}