import { authenticatedRequest } from './auth';

export interface HealthRecordInput {
  visitDate: string;
  clinicName: string;
  vetName: string;
  symptoms: string;
  diagnosis: string;
  treatment: string;
  notes: string;
}

export interface HealthRecord extends HealthRecordInput {
  id: string;
  petId: string;
  createdAt: string;
  updatedAt: string;
}

function parseHealthRecord(value: unknown): HealthRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Invalid health record response.');
  }

  const record = value as Record<string, unknown>;

  if (
    typeof record.id !== 'string' ||
    typeof record.petId !== 'string' ||
    typeof record.visitDate !== 'string' ||
    typeof record.clinicName !== 'string' ||
    typeof record.vetName !== 'string' ||
    typeof record.symptoms !== 'string' ||
    typeof record.diagnosis !== 'string' ||
    typeof record.treatment !== 'string' ||
    typeof record.notes !== 'string' ||
    typeof record.createdAt !== 'string' ||
    typeof record.updatedAt !== 'string'
  ) {
    throw new Error('Invalid health record response.');
  }

  return {
    id: record.id,
    petId: record.petId,
    visitDate: record.visitDate,
    clinicName: record.clinicName,
    vetName: record.vetName,
    symptoms: record.symptoms,
    diagnosis: record.diagnosis,
    treatment: record.treatment,
    notes: record.notes,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function petPath(petId: string) {
  return `/api/pets/${encodeURIComponent(petId)}/health-records`;
}

export async function listHealthRecords(
  petId: string,
): Promise<HealthRecord[]> {
  const data = await authenticatedRequest(petPath(petId));

  if (!Array.isArray(data.healthRecords)) {
    throw new Error('Invalid health record list.');
  }

  return data.healthRecords.map(parseHealthRecord);
}

export async function saveHealthRecord(
  petId: string,
  input: HealthRecordInput,
  recordId?: string,
): Promise<HealthRecord> {
  const path = recordId
    ? `${petPath(petId)}/${encodeURIComponent(recordId)}`
    : petPath(petId);

  const data = await authenticatedRequest(
    path,
    recordId ? 'PATCH' : 'POST',
    input,
  );

  return parseHealthRecord(data.healthRecord);
}

export async function deleteHealthRecord(
  petId: string,
  recordId: string,
): Promise<void> {
  await authenticatedRequest(
    `${petPath(petId)}/${encodeURIComponent(recordId)}`,
    'DELETE',
  );
}