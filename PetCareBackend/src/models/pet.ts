import type { ObjectId, WithId } from 'mongodb';
import { database } from '../database.ts';

export interface PetFields {
  name: string;
  species: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other';
  sex: 'male' | 'female' | 'unknown';
  breed: string;
  notes: string;
  dateOfBirth?: string;
  weightKg?: number;
}
export interface PetRecord extends PetFields {
  ownerId: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
export const petsCollection = database.collection<PetRecord>('pets');
export async function createPetIndexes(): Promise<void> {
  await petsCollection.createIndex({ ownerId: 1, createdAt: -1 });
}
export function publicPet(pet: WithId<PetRecord>) {
  return {
    id: pet._id.toHexString(), name: pet.name, species: pet.species, sex: pet.sex,
    breed: pet.breed, notes: pet.notes,
    ...(pet.dateOfBirth ? { dateOfBirth: pet.dateOfBirth } : {}),
    ...(pet.weightKg !== undefined ? { weightKg: pet.weightKg } : {}),
    createdAt: pet.createdAt.toISOString(), updatedAt: pet.updatedAt.toISOString(),
  };
}

export function validatePet(body: unknown): { fields: PetFields; clearWeight: boolean; clearDob: boolean } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Provide pet details.');
  const input = body as Record<string, unknown>;
  const allowed = ['name', 'species', 'sex', 'breed', 'notes', 'weightKg', 'dateOfBirth'];
  if (Object.keys(input).some((key) => !allowed.includes(key))) throw new Error('Unsupported pet field.');
  if (typeof input.name !== 'string' || !input.name.trim() || input.name.trim().length > 60) throw new Error('Pet name must contain 1–60 characters.');
  if (typeof input.species !== 'string' || !['dog','cat','bird','rabbit','other'].includes(input.species)) throw new Error('Choose a valid pet type.');
  if (typeof input.sex !== 'string' || !['male','female','unknown'].includes(input.sex)) throw new Error('Choose a valid sex.');
  for (const [field, limit] of [['breed',100],['notes',500]] as const) {
    if (input[field] !== undefined && (typeof input[field] !== 'string' || input[field].length > limit)) throw new Error(`${field} must be text of at most ${limit} characters.`);
  }
  const fields: PetFields = {
    name: input.name.trim(), species: input.species as PetFields['species'], sex: input.sex as PetFields['sex'],
    breed: (input.breed as string | undefined)?.trim() ?? '', notes: (input.notes as string | undefined)?.trim() ?? '',
  };
  if (input.weightKg !== undefined && input.weightKg !== null) {
    if (typeof input.weightKg !== 'number' || !Number.isFinite(input.weightKg) || input.weightKg <= 0 || input.weightKg > 10000) throw new Error('Weight must be a positive number no greater than 10,000 kg.');
    fields.weightKg = input.weightKg;
  }
  if (input.dateOfBirth !== undefined && input.dateOfBirth !== null && input.dateOfBirth !== '') {
    const value = input.dateOfBirth;
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Use YYYY-MM-DD for date of birth.');
    const date = new Date(`${value}T00:00:00.000Z`);
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0,10) !== value || value > new Date().toISOString().slice(0,10)) throw new Error('Enter a valid date of birth that is not in the future.');
    fields.dateOfBirth = value;
  }
  return { fields, clearWeight: input.weightKg === null, clearDob: input.dateOfBirth === null || input.dateOfBirth === '' };
}
