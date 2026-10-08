import { authenticatedRequest } from './auth';

export interface VetServiceItem {
  id: string;
  name: string;
  description?: string;
  fee?: number;
}

export interface VetBreakInterval {
  start: string;
  end: string;
  label?: string;
}

export interface VetAvailability {
  isOpen: boolean;
  slotDurationMinutes: number;
  workingDays: number[];
  workingHours: {
    start: string;
    end: string;
  };
  breaks: VetBreakInterval[];
  unavailableDates: string[];
}

export interface VerifiedCredentials {
  qualifications: string;
  registrationNumber: string;
  registrationCouncil: string;
  clinicName: string;
}

export interface VetSummary {
  vetId: string;
  name: string;
  displayName: string;
  bio: string;
  clinicName: string;
  clinicAddress: string;
  clinicPhone: string;
  clinicEmail: string;
  services: VetServiceItem[];
  consultationFee: number;
  timeZone: string;
  isOpen: boolean;
  verifiedCredentials: VerifiedCredentials;
}

export interface VetProfile {
  id: string;
  vetId: string;
  displayName: string;
  bio: string;
  clinicPhone: string;
  clinicEmail: string;
  clinicAddress: string;
  services: VetServiceItem[];
  consultationFee: number;
  timeZone: string;
  availability: VetAvailability;
  verifiedCredentials: VerifiedCredentials | null;
  createdAt: string;
  updatedAt: string;
}

export interface VetSlot {
  time: string;
  available: boolean;
  reason?: string;
}

export interface VetSlotsResponse {
  isOpen: boolean;
  date: string;
  slotDurationMinutes: number;
  timeZone: string;
  message?: string;
  slots: VetSlot[];
}

export type VetBookingStatus =
  | 'pending'
  | 'confirmed'
  | 'rejected'
  | 'cancelled'
  | 'completed';

export interface RescheduleProposal {
  proposedDate: string;
  proposedTime: string;
  proposedBy: 'vet' | 'owner';
  reason?: string;
  status: 'pending' | 'accepted' | 'declined';
  proposedAt: string;
  respondedAt?: string | null;
}

export interface VetBooking {
  id: string;
  bookingNumber: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  vetId: string;
  vetName: string;
  clinicName: string;
  petId: string;
  petName: string;
  petSpecies: string;
  petBreed: string;
  date: string;
  time: string;
  durationMinutes: number;
  reason: string;
  notes: string;
  status: VetBookingStatus;
  rejectionReason: string | null;
  cancellationReason: string | null;
  cancelledBy: 'owner' | 'vet' | null;
  rescheduleProposal: RescheduleProposal | null;
  shareMedicalHistory: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VetBookingInput {
  vetId: string;
  petId: string;
  date: string;
  time: string;
  reason: string;
  notes?: string;
  shareMedicalHistory?: boolean;
}

export interface VetPatient {
  petId: string;
  name: string;
  species: string;
  breed: string;
  sex: string;
  dateOfBirth: string | null;
  weightKg: number | null;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  lastVisitDate: string | null;
  lastBookingStatus: VetBookingStatus | null;
  accessScope: 'full_history' | 'consultation_only' | null;
}

export interface ConsultationAmendment {
  amendedAt: string;
  note: string;
}

export interface VetConsultation {
  id: string;
  bookingId: string | null;
  petId: string;
  ownerId: string;
  vetId: string;
  vetName: string;
  clinicName: string;
  visitDate: string;
  symptoms: string;
  examinationNotes: string;
  diagnosis: string;
  treatmentPlan: string;
  followUpDate: string | null;
  followUpInstructions: string;
  status: 'draft' | 'finalized';
  amendments: ConsultationAmendment[];
  createdAt: string;
  updatedAt: string;
}

export interface VetConsultationInput {
  petId: string;
  bookingId?: string | null;
  visitDate: string;
  symptoms: string;
  examinationNotes?: string;
  diagnosis: string;
  treatmentPlan: string;
  followUpDate?: string | null;
  followUpInstructions?: string;
  status: 'draft' | 'finalized';
}

export interface VetPrescription {
  id: string;
  consultationId: string | null;
  petId: string;
  ownerId: string;
  vetId: string;
  vetName: string;
  clinicName: string;
  medicineName: string;
  dosage: string;
  route: string;
  frequency: string;
  startDate: string;
  endDate: string | null;
  instructions: string;
  status: 'active' | 'completed' | 'discontinued';
  createdAt: string;
}

export interface VetPrescriptionInput {
  petId: string;
  consultationId?: string | null;
  medicineName: string;
  dosage: string;
  route?: string;
  frequency: string;
  startDate: string;
  endDate?: string | null;
  instructions?: string;
}

export interface VetVaccinationInput {
  petId: string;
  vaccineName: string;
  dateAdministered: string;
  nextDueDate?: string | null;
  batchNumber?: string;
  notes?: string;
}

export interface PetAccessGrant {
  id: string;
  petId: string;
  ownerId: string;
  vetId: string;
  vetName?: string;
  clinicName?: string;
  scope: 'full_history' | 'consultation_only';
  status: 'active' | 'revoked';
  grantedAt: string;
  revokedAt: string | null;
  reason?: string;
}

export interface VetDashboardStats {
  pendingRequests: number;
  todayConfirmed: number;
  upcomingVisits: number;
  completedConsultations: number;
  totalPatients: number;
}

/* ==========================================================================
   PUBLIC / PET OWNER SERVICES
   ========================================================================== */

export async function listApprovedVets(query = ''): Promise<VetSummary[]> {
  const q = query.trim();
  const url = q ? `/api/vets?q=${encodeURIComponent(q)}` : '/api/vets';
  const data = await authenticatedRequest(url);
  return Array.isArray(data.vets) ? (data.vets as VetSummary[]) : [];
}

export async function getVetPublicProfile(vetId: string): Promise<VetProfile> {
  const data = await authenticatedRequest(`/api/vets/${encodeURIComponent(vetId)}`);
  return data.vet as VetProfile;
}

export async function getVetSlots(vetId: string, date: string): Promise<VetSlotsResponse> {
  const data = await authenticatedRequest(
    `/api/vets/${encodeURIComponent(vetId)}/slots?date=${encodeURIComponent(date)}`,
  );
  return {
    isOpen: Boolean(data.isOpen),
    date: String(data.date || date),
    slotDurationMinutes: Number(data.slotDurationMinutes || 30),
    timeZone: String(data.timeZone || 'Asia/Kolkata'),
    message: typeof data.message === 'string' ? data.message : undefined,
    slots: Array.isArray(data.slots) ? (data.slots as VetSlot[]) : [],
  };
}

export async function createVetBooking(input: VetBookingInput): Promise<VetBooking> {
  const data = await authenticatedRequest('/api/vet-bookings', 'POST', input);
  return data.booking as VetBooking;
}

export async function listMyVetBookings(): Promise<VetBooking[]> {
  const data = await authenticatedRequest('/api/vet-bookings');
  return Array.isArray(data.bookings) ? (data.bookings as VetBooking[]) : [];
}

export async function getVetBooking(bookingId: string): Promise<VetBooking> {
  const data = await authenticatedRequest(`/api/vet-bookings/${encodeURIComponent(bookingId)}`);
  return data.booking as VetBooking;
}

export async function cancelMyVetBooking(bookingId: string, reason?: string): Promise<void> {
  await authenticatedRequest(`/api/vet-bookings/${encodeURIComponent(bookingId)}/cancel`, 'POST', {
    reason,
  });
}

export async function respondToReschedule(
  bookingId: string,
  decision: 'accept' | 'decline',
): Promise<void> {
  await authenticatedRequest(
    `/api/vet-bookings/${encodeURIComponent(bookingId)}/respond-reschedule`,
    'POST',
    { decision },
  );
}

export async function listPetSharingGrants(petId: string): Promise<PetAccessGrant[]> {
  const data = await authenticatedRequest(`/api/pets/${encodeURIComponent(petId)}/sharing`);
  return Array.isArray(data.grants) ? (data.grants as PetAccessGrant[]) : [];
}

export async function grantPetSharing(
  petId: string,
  vetId: string,
  scope: 'full_history' | 'consultation_only' = 'full_history',
): Promise<PetAccessGrant> {
  const data = await authenticatedRequest(
    `/api/pets/${encodeURIComponent(petId)}/sharing`,
    'POST',
    { vetId, scope },
  );
  return data.grant as PetAccessGrant;
}

export async function revokePetSharing(
  petId: string,
  vetId: string,
  reason?: string,
): Promise<void> {
  await authenticatedRequest(
    `/api/pets/${encodeURIComponent(petId)}/sharing/${encodeURIComponent(vetId)}/revoke`,
    'POST',
    { reason },
  );
}

export async function listPetConsultations(petId: string): Promise<VetConsultation[]> {
  const data = await authenticatedRequest(`/api/pets/${encodeURIComponent(petId)}/consultations`);
  return Array.isArray(data.consultations) ? (data.consultations as VetConsultation[]) : [];
}

export async function listPetPrescriptions(petId: string): Promise<VetPrescription[]> {
  const data = await authenticatedRequest(`/api/pets/${encodeURIComponent(petId)}/prescriptions`);
  return Array.isArray(data.prescriptions) ? (data.prescriptions as VetPrescription[]) : [];
}

/* ==========================================================================
   VET PRACTITIONER SERVICES
   ========================================================================== */

export async function getMyVetProfile(): Promise<VetProfile> {
  const data = await authenticatedRequest('/api/vet/profile');
  return data.profile as VetProfile;
}

export async function updateMyVetProfile(input: Partial<VetProfile>): Promise<VetProfile> {
  const data = await authenticatedRequest('/api/vet/profile', 'PATCH', input);
  return data.profile as VetProfile;
}

export async function updateMyVetAvailability(
  input: Partial<VetAvailability>,
): Promise<VetAvailability> {
  const data = await authenticatedRequest('/api/vet/availability', 'PUT', input);
  return data.availability as VetAvailability;
}

export async function getVetDashboardStats(): Promise<VetDashboardStats> {
  const data = await authenticatedRequest('/api/vet/dashboard-stats');
  return data.stats as VetDashboardStats;
}

export async function listVetBookings(status?: string, date?: string): Promise<VetBooking[]> {
  const params: string[] = [];
  if (status && status !== 'all') params.push(`status=${encodeURIComponent(status)}`);
  if (date) params.push(`date=${encodeURIComponent(date)}`);
  const query = params.length > 0 ? `?${params.join('&')}` : '';

  const data = await authenticatedRequest(`/api/vet/bookings${query}`);
  return Array.isArray(data.bookings) ? (data.bookings as VetBooking[]) : [];
}

export async function getVetBookingDetail(bookingId: string): Promise<VetBooking> {
  const data = await authenticatedRequest(`/api/vet/bookings/${encodeURIComponent(bookingId)}`);
  return data.booking as VetBooking;
}

export async function acceptVetBooking(bookingId: string): Promise<void> {
  await authenticatedRequest(`/api/vet/bookings/${encodeURIComponent(bookingId)}/accept`, 'POST');
}

export async function rejectVetBooking(bookingId: string, reason: string): Promise<void> {
  await authenticatedRequest(`/api/vet/bookings/${encodeURIComponent(bookingId)}/reject`, 'POST', {
    reason,
  });
}

export async function cancelVetBooking(bookingId: string, reason: string): Promise<void> {
  await authenticatedRequest(`/api/vet/bookings/${encodeURIComponent(bookingId)}/cancel`, 'POST', {
    reason,
  });
}

export async function proposeReschedule(
  bookingId: string,
  proposedDate: string,
  proposedTime: string,
  reason?: string,
): Promise<void> {
  await authenticatedRequest(
    `/api/vet/bookings/${encodeURIComponent(bookingId)}/propose-reschedule`,
    'POST',
    { proposedDate, proposedTime, reason },
  );
}

export async function completeVetBooking(bookingId: string): Promise<void> {
  await authenticatedRequest(
    `/api/vet/bookings/${encodeURIComponent(bookingId)}/complete`,
    'POST',
  );
}

export async function listVetPatients(query = ''): Promise<VetPatient[]> {
  const q = query.trim();
  const url = q ? `/api/vet/patients?q=${encodeURIComponent(q)}` : '/api/vet/patients';
  const data = await authenticatedRequest(url);
  return Array.isArray(data.patients) ? (data.patients as VetPatient[]) : [];
}

export async function getVetPatient(petId: string): Promise<{
  patient: VetPatient;
  consultations: VetConsultation[];
  bookings: VetBooking[];
}> {
  const data = await authenticatedRequest(`/api/vet/patients/${encodeURIComponent(petId)}`);
  return {
    patient: data.patient as VetPatient,
    consultations: Array.isArray(data.consultations) ? (data.consultations as VetConsultation[]) : [],
    bookings: Array.isArray(data.bookings) ? (data.bookings as VetBooking[]) : [],
  };
}

export interface PatientSharedHistory {
  vaccinations: Array<{
    id: string;
    vaccineName: string;
    dateAdministered: string;
    nextDueDate: string | null;
    batchNumber: string;
    clinicName: string;
    notes: string;
    isVetAuthored: boolean;
  }>;
  medications: Array<{
    id: string;
    medicineName: string;
    dosage: string;
    frequency: string;
    instructions: string;
    startDate: string;
    endDate: string | null;
    status: string;
  }>;
  healthNotes: Array<{
    id: string;
    visitDate: string;
    clinicName: string;
    symptoms: string;
    diagnosis: string;
    treatment: string;
    notes: string;
  }>;
  prescriptions: VetPrescription[];
  consultations: VetConsultation[];
}

export async function getVetPatientHistory(petId: string): Promise<PatientSharedHistory> {
  const data = await authenticatedRequest(`/api/vet/patients/${encodeURIComponent(petId)}/history`);
  return data.history as PatientSharedHistory;
}

export async function createConsultation(
  input: VetConsultationInput,
): Promise<VetConsultation> {
  const data = await authenticatedRequest('/api/vet/consultations', 'POST', input);
  return data.consultation as VetConsultation;
}

export async function listVetConsultations(): Promise<VetConsultation[]> {
  const data = await authenticatedRequest('/api/vet/consultations');
  return Array.isArray(data.consultations) ? (data.consultations as VetConsultation[]) : [];
}

export async function updateConsultation(
  consultationId: string,
  input: Record<string, unknown>,
): Promise<VetConsultation> {
  const data = await authenticatedRequest(
    `/api/vet/consultations/${encodeURIComponent(consultationId)}`,
    'PATCH',
    input,
  );
  return data.consultation as VetConsultation;
}

export async function createPrescription(
  input: VetPrescriptionInput,
): Promise<VetPrescription> {
  const data = await authenticatedRequest('/api/vet/prescriptions', 'POST', input);
  return data.prescription as VetPrescription;
}

export async function recordVetVaccination(
  input: VetVaccinationInput,
): Promise<void> {
  await authenticatedRequest('/api/vet/vaccinations', 'POST', input);
}
