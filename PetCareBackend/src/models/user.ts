import { database } from '../database.ts';

export type UserRole = 'pet_owner' | 'vet' | 'admin';

export interface User {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
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
}