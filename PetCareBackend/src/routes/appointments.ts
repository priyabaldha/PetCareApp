import { Router } from 'express';
import { ObjectId } from 'mongodb';
import type { WithId } from 'mongodb';

import { database } from '../database.ts';
import { requireSession } from '../middleware/requireSession.ts';
import { petsCollection } from '../models/pet.ts';

type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled';

interface AppointmentFields {
  clinicName: string;
  vetName: string;
  date: string;
  time: string;
  reason: string;
  notes: string;
  status: AppointmentStatus;
}

interface AppointmentRecord extends AppointmentFields {
  petId: ObjectId;
  ownerId: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const appointments =
  database.collection<AppointmentRecord>('appointments');

const appointmentRouter = Router();

appointmentRouter.use(requireSession);

function readText(
  input: Record<string, unknown>,
  key: string,
  label: string,
  maxLength: number,
  required = false,
): string {
  const value = input[key];

  if (value === undefined && !required) return '';

  if (typeof value !== 'string') {
    throw new Error(`${label} must be text.`);
  }

  const text = value.trim();

  if (required && text.length === 0) {
    throw new Error(`${label} is required.`);
  }

  if (text.length > maxLength) {
    throw new Error(`${label} must not exceed ${maxLength} characters.`);
  }

  return text;
}

function validateAppointment(body: unknown): AppointmentFields {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new Error('Provide appointment details.');
  }

  const input = body as Record<string, unknown>;

  const allowed = [
    'clinicName',
    'vetName',
    'date',
    'time',
    'reason',
    'notes',
    'status',
  ];

  if (Object.keys(input).some((key) => !allowed.includes(key))) {
    throw new Error('Unknown appointment field.');
  }

  const clinicName = readText(input, 'clinicName', 'Clinic name', 150, true);
  const vetName = readText(input, 'vetName', 'Vet name', 100);
  const reason = readText(input, 'reason', 'Reason', 200, true);
  const notes = readText(input, 'notes', 'Notes', 1000);

  const date = readText(input, 'date', 'Date', 10, true);
  const time = readText(input, 'time', 'Time', 5, true);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error('Use YYYY-MM-DD for the appointment date.');
  }

  const parsedDate = new Date(`${date}T00:00:00.000Z`);

  if (
    !Number.isFinite(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== date ||
    date < '1900-01-01'
  ) {
    throw new Error('Enter a valid appointment date.');
  }

  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    throw new Error('Use 24-hour HH:mm time, for example 14:30.');
  }

  const status = input.status ?? 'scheduled';

  if (
    status !== 'scheduled' &&
    status !== 'completed' &&
    status !== 'cancelled'
  ) {
    throw new Error('Invalid appointment status.');
  }

  return {
    clinicName,
    vetName,
    date,
    time,
    reason,
    notes,
    status,
  };
}

function publicAppointment(record: WithId<AppointmentRecord>) {
  return {
    id: record._id.toHexString(),
    petId: record.petId.toHexString(),
    clinicName: record.clinicName,
    vetName: record.vetName,
    date: record.date,
    time: record.time,
    reason: record.reason,
    notes: record.notes,
    status: record.status,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

// Check pet ownership before accessing any appointments.
appointmentRouter.use(
  '/:petId/appointments',
  async (request, response, next) => {
    const value = String(request.params.petId);

    if (!/^[a-f0-9]{24}$/i.test(value)) {
      response.status(400).json({
        success: false,
        message: 'Invalid pet ID.',
      });
      return;
    }

    const petId = new ObjectId(value);

    const pet = await petsCollection.findOne({
      _id: petId,
      ownerId: response.locals.userId,
    });

    if (!pet) {
      response.status(404).json({
        success: false,
        message: 'Pet not found.',
      });
      return;
    }

    response.locals.appointmentPetId = petId;
    next();
  },
);

appointmentRouter.param(
  'appointmentId',
  (_request, response, next, value: string) => {
    if (!/^[a-f0-9]{24}$/i.test(value)) {
      response.status(400).json({
        success: false,
        message: 'Invalid appointment ID.',
      });
      return;
    }

    next();
  },
);

// List appointments for one pet.
appointmentRouter.get(
  '/:petId/appointments',
  async (_request, response) => {
    const records = await appointments.find({
      petId: response.locals.appointmentPetId,
      ownerId: response.locals.userId,
    })
      .sort({ date: 1, time: 1, _id: 1 })
      .toArray();

    response.json({
      success: true,
      appointments: records.map(publicAppointment),
    });
  },
);

// Create an appointment.
appointmentRouter.post(
  '/:petId/appointments',
  async (request, response) => {
    let fields: AppointmentFields;

    try {
      fields = validateAppointment(request.body);
    } catch (error) {
      response.status(400).json({
        success: false,
        message:
          error instanceof Error ? error.message : 'Invalid details.',
      });
      return;
    }

    const now = new Date();

    const record: AppointmentRecord = {
      ...fields,
      petId: response.locals.appointmentPetId as ObjectId,
      ownerId: response.locals.userId as ObjectId,
      createdAt: now,
      updatedAt: now,
    };

    const result = await appointments.insertOne(record);

    response.status(201).json({
      success: true,
      appointment: publicAppointment({
        ...record,
        _id: result.insertedId,
      }),
    });
  },
);

// Update an appointment. Send the complete form, including status.
appointmentRouter.patch(
  '/:petId/appointments/:appointmentId',
  async (request, response) => {
    let fields: AppointmentFields;

    try {
      fields = validateAppointment(request.body);
    } catch (error) {
      response.status(400).json({
        success: false,
        message:
          error instanceof Error ? error.message : 'Invalid details.',
      });
      return;
    }

    const record = await appointments.findOneAndUpdate(
      {
        _id: new ObjectId(String(request.params.appointmentId)),
        petId: response.locals.appointmentPetId,
        ownerId: response.locals.userId,
      },
      {
        $set: {
          ...fields,
          updatedAt: new Date(),
        },
      },
      {
        returnDocument: 'after',
        includeResultMetadata: false,
      },
    );

    if (!record) {
      response.status(404).json({
        success: false,
        message: 'Appointment not found.',
      });
      return;
    }

    response.json({
      success: true,
      appointment: publicAppointment(record),
    });
  },
);

// Permanently delete an appointment.
appointmentRouter.delete(
  '/:petId/appointments/:appointmentId',
  async (request, response) => {
    const result = await appointments.deleteOne({
      _id: new ObjectId(String(request.params.appointmentId)),
      petId: response.locals.appointmentPetId,
      ownerId: response.locals.userId,
    });

    if (!result.deletedCount) {
      response.status(404).json({
        success: false,
        message: 'Appointment not found.',
      });
      return;
    }

    response.json({ success: true });
  },
);

export default appointmentRouter;