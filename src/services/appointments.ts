import { authenticatedRequest } from './auth';

export type AppointmentStatus =
  | 'scheduled'
  | 'completed'
  | 'cancelled';

export interface AppointmentInput {
  clinicName: string;
  vetName: string;
  date: string;
  time: string;
  reason: string;
  notes: string;
  status: AppointmentStatus;
}

export interface Appointment extends AppointmentInput {
  id: string;
  petId: string;
  createdAt: string;
  updatedAt: string;
}

function parseAppointment(value: unknown): Appointment {
  if (!value || typeof value !== 'object') {
    throw new Error('Invalid appointment response.');
  }

  const item = value as Record<string, unknown>;

  const textFields = [
    'id', 'petId', 'clinicName', 'vetName', 'date',
    'time', 'reason', 'notes', 'createdAt', 'updatedAt',
  ];

  if (
    textFields.some((key) => typeof item[key] !== 'string') ||
    !['scheduled', 'completed', 'cancelled'].includes(
      String(item.status),
    )
  ) {
    throw new Error('Invalid appointment details.');
  }

  return value as Appointment;
}

function appointmentPath(petId: string) {
  return `/api/pets/${encodeURIComponent(petId)}/appointments`;
}

export async function listAppointments(
  petId: string,
): Promise<Appointment[]> {
  const data = await authenticatedRequest(appointmentPath(petId));

  if (!Array.isArray(data.appointments)) {
    throw new Error('Invalid appointment list.');
  }

  return data.appointments.map(parseAppointment);
}

export async function saveAppointment(
  petId: string,
  input: AppointmentInput,
  appointmentId?: string,
): Promise<Appointment> {
  const path = appointmentId
    ? `${appointmentPath(petId)}/${encodeURIComponent(appointmentId)}`
    : appointmentPath(petId);

  const data = await authenticatedRequest(
    path,
    appointmentId ? 'PATCH' : 'POST',
    input,
  );

  return parseAppointment(data.appointment);
}

export async function deleteAppointment(
  petId: string,
  appointmentId: string,
): Promise<void> {
  await authenticatedRequest(
    `${appointmentPath(petId)}/${encodeURIComponent(appointmentId)}`,
    'DELETE',
  );
}