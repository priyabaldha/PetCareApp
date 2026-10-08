import type { ObjectId, WithId } from 'mongodb';
import { database } from '../database.ts';

export interface VetServiceItem {
  id: string;
  name: string;
  description?: string;
  fee?: number;
}

export interface VetBreakInterval {
  start: string; // HH:mm
  end: string;   // HH:mm
  label?: string;
}

export interface VetAvailabilitySettings {
  isOpen: boolean;
  slotDurationMinutes: number; // 15, 30, 45, 60
  workingDays: number[]; // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  workingHours: {
    start: string; // HH:mm
    end: string;   // HH:mm
  };
  breaks: VetBreakInterval[];
  unavailableDates: string[]; // YYYY-MM-DD
}

export interface VetProfileDocument {
  _id?: ObjectId;
  vetId: ObjectId;
  displayName: string;
  bio: string;
  clinicPhone: string;
  clinicEmail: string;
  clinicAddress: string;
  services: VetServiceItem[];
  consultationFee: number;
  timeZone: string;
  availability: VetAvailabilitySettings;
  createdAt: Date;
  updatedAt: Date;
}

export const defaultAvailability: VetAvailabilitySettings = {
  isOpen: true,
  slotDurationMinutes: 30,
  workingDays: [1, 2, 3, 4, 5], // Monday - Friday
  workingHours: {
    start: '09:00',
    end: '17:00',
  },
  breaks: [
    { start: '13:00', end: '14:00', label: 'Lunch Break' },
  ],
  unavailableDates: [],
};

export const vetProfilesCollection = database.collection<VetProfileDocument>('vetProfiles');

export async function createVetProfileIndexes(): Promise<void> {
  await vetProfilesCollection.createIndex(
    { vetId: 1 },
    { unique: true, name: 'unique_vet_profile_vetId' },
  );
  await vetProfilesCollection.createIndex(
    { 'availability.isOpen': 1 },
    { name: 'vet_profile_isOpen' },
  );
}

export function publicVetProfile(
  profile: WithId<VetProfileDocument>,
  verifiedCredentials?: {
    qualifications: string;
    registrationNumber: string;
    registrationCouncil: string;
    clinicName: string;
  },
) {
  return {
    id: profile._id.toHexString(),
    vetId: profile.vetId.toHexString(),
    displayName: profile.displayName,
    bio: profile.bio,
    clinicPhone: profile.clinicPhone,
    clinicEmail: profile.clinicEmail,
    clinicAddress: profile.clinicAddress,
    services: profile.services || [],
    consultationFee: profile.consultationFee,
    timeZone: profile.timeZone || 'Asia/Kolkata',
    availability: profile.availability || defaultAvailability,
    verifiedCredentials: verifiedCredentials || null,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  };
}
