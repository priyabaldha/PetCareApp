import type { Pet } from '../types/pet';

export const demoPets: Pet[] = [
  {
    id: 'demo-buddy',
    name: 'Buddy',
    species: 'dog',
    sex: 'male',
    breed: 'Golden Retriever',
    dateOfBirth: '2023-04-12',
    weightKg: 28,
    notes: 'Loves long walks, tennis balls, and being around people.',
    createdAt: '2026-09-28T00:00:00.000Z',
    updatedAt: '2026-09-28T00:00:00.000Z',
  },
  {
    id: 'demo-luna',
    name: 'Luna',
    species: 'cat',
    sex: 'female',
    breed: 'Domestic Shorthair',
    dateOfBirth: '2024-08-05',
    weightKg: 4.2,
    notes: 'Enjoys sunny windows, quiet spaces, and gentle playtime.',
    createdAt: '2026-09-28T00:00:00.000Z',
    updatedAt: '2026-09-28T00:00:00.000Z',
  },
];