import type { ObjectId, WithId } from 'mongodb';
import { database } from '../database.ts';

export interface ConsultationAmendment {
  amendedAt: Date;
  amendedBy: ObjectId;
  note: string;
}

export interface ConsultationDocument {
  _id?: ObjectId;
  bookingId?: ObjectId | null;
  petId: ObjectId;
  ownerId: ObjectId;
  vetId: ObjectId;
  vetName: string;
  clinicName: string;
  visitDate: string; // YYYY-MM-DD
  symptoms: string;
  examinationNotes: string;
  diagnosis: string;
  treatmentPlan: string;
  followUpDate?: string | null;
  followUpInstructions?: string;
  status: 'draft' | 'finalized';
  amendments?: ConsultationAmendment[];
  createdAt: Date;
  updatedAt: Date;
}

export const consultationsCollection =
  database.collection<ConsultationDocument>('consultations');

export async function createConsultationIndexes(): Promise<void> {
  await consultationsCollection.createIndex(
    { petId: 1, visitDate: -1 },
    { name: 'pet_consultations' },
  );
  await consultationsCollection.createIndex(
    { vetId: 1, visitDate: -1 },
    { name: 'vet_consultations' },
  );
  await consultationsCollection.createIndex(
    { ownerId: 1, visitDate: -1 },
    { name: 'owner_consultations' },
  );
  await consultationsCollection.createIndex(
    { bookingId: 1 },
    { name: 'booking_consultation' },
  );
}

export function publicConsultation(record: WithId<ConsultationDocument>) {
  return {
    id: record._id.toHexString(),
    bookingId: record.bookingId ? record.bookingId.toHexString() : null,
    petId: record.petId.toHexString(),
    ownerId: record.ownerId.toHexString(),
    vetId: record.vetId.toHexString(),
    vetName: record.vetName,
    clinicName: record.clinicName,
    visitDate: record.visitDate,
    symptoms: record.symptoms,
    examinationNotes: record.examinationNotes || '',
    diagnosis: record.diagnosis,
    treatmentPlan: record.treatmentPlan,
    followUpDate: record.followUpDate || null,
    followUpInstructions: record.followUpInstructions || '',
    status: record.status,
    amendments: record.amendments
      ? record.amendments.map((a) => ({
          amendedAt: a.amendedAt.toISOString(),
          note: a.note,
        }))
      : [],
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}
