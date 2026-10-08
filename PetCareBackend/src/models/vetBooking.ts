import type { ObjectId, WithId } from 'mongodb';
import { database } from '../database.ts';

export type VetBookingStatus =
  | 'pending'
  | 'confirmed'
  | 'rejected'
  | 'cancelled'
  | 'completed';

export interface RescheduleProposal {
  proposedDate: string; // YYYY-MM-DD
  proposedTime: string; // HH:mm
  proposedBy: 'vet' | 'owner';
  reason?: string;
  status: 'pending' | 'accepted' | 'declined';
  proposedAt: Date;
  respondedAt?: Date;
}

export interface VetBookingDocument {
  _id?: ObjectId;
  bookingNumber: string;
  ownerId: ObjectId;
  ownerName: string;
  ownerEmail: string;
  ownerPhone?: string;
  vetId: ObjectId;
  vetName: string;
  clinicName: string;
  petId: ObjectId;
  petName: string;
  petSpecies: string;
  petBreed?: string;
  date: string; // YYYY-MM-DD in clinic timezone
  time: string; // HH:mm in clinic timezone
  durationMinutes: number;
  reason: string;
  notes?: string;
  status: VetBookingStatus;
  rejectionReason?: string;
  cancellationReason?: string;
  cancelledBy?: 'owner' | 'vet';
  rescheduleProposal?: RescheduleProposal;
  shareMedicalHistory: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const vetBookingsCollection =
  database.collection<VetBookingDocument>('vetBookings');

export async function createVetBookingIndexes(): Promise<void> {
  // Fast lookup for vet's schedule & active bookings
  await vetBookingsCollection.createIndex(
    { vetId: 1, date: 1, time: 1 },
    { name: 'vet_booking_slot' },
  );
  await vetBookingsCollection.createIndex(
    { vetId: 1, status: 1, date: 1 },
    { name: 'vet_booking_status_date' },
  );
  await vetBookingsCollection.createIndex(
    { ownerId: 1, status: 1, date: 1 },
    { name: 'owner_booking_status_date' },
  );
  await vetBookingsCollection.createIndex(
    { petId: 1, status: 1 },
    { name: 'pet_booking_status' },
  );
  await vetBookingsCollection.createIndex(
    { bookingNumber: 1 },
    { unique: true, name: 'unique_booking_number' },
  );
}

export function publicVetBooking(record: WithId<VetBookingDocument>) {
  return {
    id: record._id.toHexString(),
    bookingNumber: record.bookingNumber,
    ownerId: record.ownerId.toHexString(),
    ownerName: record.ownerName,
    ownerEmail: record.ownerEmail,
    ownerPhone: record.ownerPhone || '',
    vetId: record.vetId.toHexString(),
    vetName: record.vetName,
    clinicName: record.clinicName,
    petId: record.petId.toHexString(),
    petName: record.petName,
    petSpecies: record.petSpecies,
    petBreed: record.petBreed || '',
    date: record.date,
    time: record.time,
    durationMinutes: record.durationMinutes,
    reason: record.reason,
    notes: record.notes || '',
    status: record.status,
    rejectionReason: record.rejectionReason || null,
    cancellationReason: record.cancellationReason || null,
    cancelledBy: record.cancelledBy || null,
    rescheduleProposal: record.rescheduleProposal
      ? {
          proposedDate: record.rescheduleProposal.proposedDate,
          proposedTime: record.rescheduleProposal.proposedTime,
          proposedBy: record.rescheduleProposal.proposedBy,
          reason: record.rescheduleProposal.reason || '',
          status: record.rescheduleProposal.status,
          proposedAt: record.rescheduleProposal.proposedAt.toISOString(),
          respondedAt: record.rescheduleProposal.respondedAt?.toISOString() || null,
        }
      : null,
    shareMedicalHistory: record.shareMedicalHistory,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}
