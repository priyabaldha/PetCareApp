import { authenticatedRequest } from './auth';

export type MedicationStatus = 'active' | 'completed' | 'stopped';

export interface MedicationInput {
  medicineName: string;
  dosage: string;
  frequency: string;
  instructions: string;
  startDate: string;
  endDate: string | null;
  status: MedicationStatus;
}

export interface Medication extends MedicationInput {
  id: string;
  petId: string;
  createdAt: string;
  updatedAt: string;
}

function parseMedication(value: unknown): Medication {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Invalid medication response.');
  }

  const record = value as Record<string, unknown>;

  if (
    typeof record.id !== 'string' ||
    typeof record.petId !== 'string' ||
    typeof record.medicineName !== 'string' ||
    typeof record.dosage !== 'string' ||
    typeof record.frequency !== 'string' ||
    typeof record.instructions !== 'string' ||
    typeof record.startDate !== 'string' ||
    (record.endDate !== null && typeof record.endDate !== 'string') ||
    (record.status !== 'active' &&
      record.status !== 'completed' &&
      record.status !== 'stopped') ||
    typeof record.createdAt !== 'string' ||
    typeof record.updatedAt !== 'string'
  ) {
    throw new Error('Invalid medication response.');
  }

  return {
    id: record.id,
    petId: record.petId,
    medicineName: record.medicineName,
    dosage: record.dosage,
    frequency: record.frequency,
    instructions: record.instructions,
    startDate: record.startDate,
    endDate: record.endDate,
    status: record.status,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function petPath(petId: string) {
  return `/api/pets/${encodeURIComponent(petId)}/medications`;
}

export async function listMedications(
  petId: string,
): Promise<Medication[]> {
  const data = await authenticatedRequest(petPath(petId));

  if (!Array.isArray(data.medications)) {
    throw new Error('Invalid medication list.');
  }

  return data.medications.map(parseMedication);
}

export async function saveMedication(
  petId: string,
  input: MedicationInput,
  medicationId?: string,
): Promise<Medication> {
  const path = medicationId
    ? `${petPath(petId)}/${encodeURIComponent(medicationId)}`
    : petPath(petId);

  const data = await authenticatedRequest(
    path,
    medicationId ? 'PATCH' : 'POST',
    input,
  );

  return parseMedication(data.medication);
}

export async function deleteMedication(
  petId: string,
  medicationId: string,
): Promise<void> {
  await authenticatedRequest(
    `${petPath(petId)}/${encodeURIComponent(medicationId)}`,
    'DELETE',
  );
}