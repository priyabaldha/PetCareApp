export type PetSpecies = 'dog' | 'cat' | 'bird' | 'rabbit' | 'other';

export type PetSex = 'male' | 'female' | 'unknown';

export interface Pet {
  id: string;
  name: string;
  species: PetSpecies;
  sex: PetSex;
  breed?: string;
  dateOfBirth?: string;
  weightKg?: number;
  photoUri?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}