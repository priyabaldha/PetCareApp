import type { ObjectId, WithId } from 'mongodb';
import { database } from '../database.ts';

export interface PrescriptionDocument {
  _id?: ObjectId;
  consultationId?: ObjectId | null;
  petId: ObjectId;
  ownerId: ObjectId;
  vetId: ObjectId;
  vetName: string;
  clinicName: string;
  medicineName: string;
  dosage: string;
  route: string; // Oral, Topical, Injection, Ophthalmic, Otic, Other
  frequency: string;
  startDate: string; // YYYY-MM-DD
  endDate: string | null; // YYYY-MM-DD or null
  instructions: string;
  status: 'active' | 'completed' | 'discontinued';
  createdAt: Date;
  updatedAt: Date;
}

export const prescriptionsCollection =
  database.collection<PrescriptionDocument>('prescriptions');

export async function createPrescriptionIndexes(): Promise<void> {
  await prescriptionsCollection.createIndex(
    { petId: 1, status: 1 },
    { name: 'pet_prescriptions' },
  );
  await prescriptionsCollection.createIndex(
    { vetId: 1, createdAt: -1 },
    { name: 'vet_prescriptions' },
  );
  await prescriptionsCollection.createIndex(
    { ownerId: 1, createdAt: -1 },
    { name: 'owner_prescriptions' },
  );
  await prescriptionsCollection.createIndex(
    { consultationId: 1 },
    { name: 'consultation_prescriptions' },
  );
}

export function publicPrescription(record: WithId<PrescriptionDocument>) {
  return {
    id: record._id.toHexString(),
    consultationId: record.consultationId
      ? record.consultationId.toHexString()
      : null,
    petId: record.petId.toHexString(),
    ownerId: record.ownerId.toHexString(),
    vetId: record.vetId.toHexString(),
    vetName: record.vetName,
    clinicName: record.clinicName,
    medicineName: record.medicineName,
    dosage: record.dosage,
    route: record.route,
    frequency: record.frequency,
    startDate: record.startDate,
    endDate: record.endDate,
    instructions: record.instructions,
    status: record.status,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}
