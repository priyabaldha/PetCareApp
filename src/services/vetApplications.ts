import { authenticatedRequest } from './auth';

export interface VetApplicationInput {
  qualifications: string;
  registrationNumber: string;
  registrationCouncil: string;
  clinicName: string;
  clinicAddress: string;
}

export interface VetApplication extends VetApplicationInput {
  revision: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt: string | null;
  reviewReason: string;
}

export interface PendingVetApplication {
  userId: string;
  name: string;
  email: string;
  application: VetApplication;
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Invalid application response.');
  }

  return value as Record<string, unknown>;
}

function string(value: unknown): string {
  if (typeof value !== 'string') {
    throw new Error('Invalid application response.');
  }

  return value;
}

function parseApplication(value: unknown): VetApplication {
  const data = object(value);

  if (
    data.status !== 'pending' &&
    data.status !== 'approved' &&
    data.status !== 'rejected'
  ) {
    throw new Error('Invalid application status.');
  }

  return {
    qualifications: string(data.qualifications),
    registrationNumber: string(data.registrationNumber),
    registrationCouncil: string(data.registrationCouncil),
    clinicName: string(data.clinicName),
    clinicAddress: string(data.clinicAddress),
    revision: string(data.revision),
    status: data.status,
    submittedAt: string(data.submittedAt),
    reviewedAt:
      data.reviewedAt === null ? null : string(data.reviewedAt),
    reviewReason: string(data.reviewReason),
  };
}

export async function getMyVetApplication(): Promise<VetApplication | null> {
  const data = await authenticatedRequest('/api/vet-applications/me');

  return data.application === null
    ? null
    : parseApplication(data.application);
}

export async function submitVetApplication(
  input: VetApplicationInput,
): Promise<VetApplication> {
  const data = await authenticatedRequest(
    '/api/vet-applications/me',
    'POST',
    input,
  );

  return parseApplication(data.application);
}

export async function getPendingVetApplications(): Promise<{
  applications: PendingVetApplication[];
  hasMore: boolean;
}> {
  const data = await authenticatedRequest('/api/vet-applications/pending');

  if (
    !Array.isArray(data.applications) ||
    typeof data.hasMore !== 'boolean'
  ) {
    throw new Error('Invalid application queue.');
  }

  return {
    hasMore: data.hasMore,
    applications: data.applications.map((value) => {
      const item = object(value);

      return {
        userId: string(item.userId),
        name: string(item.name),
        email: string(item.email),
        application: parseApplication(item.application),
      };
    }),
  };
}

export async function reviewVetApplication(
  userId: string,
  revision: string,
  decision: 'approved' | 'rejected',
  reason: string,
): Promise<void> {
  await authenticatedRequest(
    `/api/vet-applications/${encodeURIComponent(userId)}/review`,
    'POST',
    { revision, decision, reason },
  );
}