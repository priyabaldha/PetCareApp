import { authenticatedRequest } from './auth';
import type { Pet, PetSex, PetSpecies } from '../types/pet';
export interface PetInput {
  name: string;
  species: PetSpecies;
  sex: PetSex;
  breed: string;
  notes: string;
  weightKg: number | null;
  dateOfBirth: string | null;
}
function parsePet(value: unknown): Pet {
  if (!value || typeof value !== 'object') throw new Error('Invalid pet response.');
  const pet = value as Record<string, unknown>;
  if (typeof pet.id !== 'string' || typeof pet.name !== 'string' ||
      !['dog','cat','bird','rabbit','other'].includes(String(pet.species)) ||
      !['male','female','unknown'].includes(String(pet.sex)) ||
      typeof pet.createdAt !== 'string' || typeof pet.updatedAt !== 'string') throw new Error('Invalid pet response.');
  return value as Pet;
}
export async function listPets(): Promise<Pet[]> {
  const data = await authenticatedRequest('/api/pets');
  if (!Array.isArray(data.pets)) throw new Error('Invalid pet list response.');
  return data.pets.map(parsePet);
}

export async function getPetCount(): Promise<number> {
  const data = await authenticatedRequest('/api/pets/count');
  if (typeof data.count !== 'number' || !Number.isInteger(data.count) || data.count < 0) throw new Error('Invalid pet count.');
  return data.count;
}
export async function getPet(id: string): Promise<Pet> {
  const data = await authenticatedRequest(`/api/pets/${encodeURIComponent(id)}`);
  return parsePet(data.pet);
}
export async function createPet(input: PetInput): Promise<Pet> {
  const data = await authenticatedRequest('/api/pets', 'POST', input);
  return parsePet(data.pet);
}
export async function updatePet(id: string, input: PetInput): Promise<Pet> {
  const data = await authenticatedRequest(`/api/pets/${encodeURIComponent(id)}`, 'PATCH', input);
  return parsePet(data.pet);
}
export async function deletePet(id: string): Promise<void> {
  await authenticatedRequest(`/api/pets/${encodeURIComponent(id)}`, 'DELETE');
}
