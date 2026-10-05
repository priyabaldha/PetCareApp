import { authenticatedRequest } from './auth';

export interface VaccinationInput {
  vaccineName: string;
  dateGiven: string;
  nextDueDate: string | null;
  notes: string;
}

export interface Vaccination extends VaccinationInput {
  id: string;
  petId: string;
  createdAt: string;
  updatedAt: string;
}

function parseVaccination(value: unknown): Vaccination {
  if (!value || typeof value !== 'object') {
    throw new Error('Invalid vaccination response.');
  }

  const record = value as Record<string, unknown>;

  if (
    typeof record.id !== 'string' ||
    typeof record.petId !== 'string' ||
    typeof record.vaccineName !== 'string' ||
    typeof record.dateGiven !== 'string' ||
    (record.nextDueDate !== null &&
      typeof record.nextDueDate !== 'string') ||
    typeof record.notes !== 'string' ||
    typeof record.createdAt !== 'string' ||
    typeof record.updatedAt !== 'string'
  ) {
    throw new Error('Invalid vaccination response.');
  }

  return value as Vaccination;
}

function petPath(petId: string) {
  return `/api/pets/${encodeURIComponent(petId)}/vaccinations`;
}

export async function listVaccinations(
  petId: string,
): Promise<Vaccination[]> {
  const data = await authenticatedRequest(petPath(petId));

  if (!Array.isArray(data.vaccinations)) {
    throw new Error('Invalid vaccination list.');
  }

  return data.vaccinations.map(parseVaccination);
}

export async function saveVaccination(
  petId: string,
  input: VaccinationInput,
  vaccinationId?: string,
): Promise<Vaccination> {
  const path = vaccinationId
    ? `${petPath(petId)}/${encodeURIComponent(vaccinationId)}`
    : petPath(petId);

  const data = await authenticatedRequest(
    path,
    vaccinationId ? 'PATCH' : 'POST',
    input,
  );

  return parseVaccination(data.vaccination);
}

export async function deleteVaccination(
  petId: string,
  vaccinationId: string,
): Promise<void> {
  await authenticatedRequest(
    `${petPath(petId)}/${encodeURIComponent(vaccinationId)}`,
    'DELETE',
  );
}