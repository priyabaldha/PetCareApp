import { Router } from 'express';
import { ObjectId } from 'mongodb';
import type { WithId } from 'mongodb';

import { database } from '../database.ts';
import { requireSession } from '../middleware/requireSession.ts';
import { petsCollection } from '../models/pet.ts';

type MedicationStatus = 'active' | 'completed' | 'stopped';

interface MedicationFields {
  medicineName: string;
  dosage: string;
  frequency: string;
  instructions: string;
  startDate: string;
  endDate: string | null;
  status: MedicationStatus;
}

interface MedicationDocument extends MedicationFields {
  petId: ObjectId;
  ownerId: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const medications =
  database.collection<MedicationDocument>('medications');

const medicationRouter = Router();

medicationRouter.use(requireSession);

function validDate(value: unknown): value is string {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return (
    Number.isFinite(date.getTime()) &&
    date.toISOString().slice(0, 10) === value &&
    value >= '1900-01-01'
  );
}

function validateMedication(body: unknown): MedicationFields {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new Error('Provide medication details.');
  }

  const input = body as Record<string, unknown>;

  const allowed = [
    'medicineName',
    'dosage',
    'frequency',
    'instructions',
    'startDate',
    'endDate',
    'status',
  ];

  if (Object.keys(input).some((key) => !allowed.includes(key))) {
    throw new Error('Unknown medication field.');
  }

  function text(
    key: string,
    label: string,
    max: number,
    required = true,
  ): string {
    const value = input[key];

    if (value === undefined && !required) return '';

    if (typeof value !== 'string') {
      throw new Error(`${label} must be text.`);
    }

    const trimmed = value.trim();

    if (required && trimmed.length === 0) {
      throw new Error(`${label} is required.`);
    }

    if (trimmed.length > max) {
      throw new Error(`${label} cannot exceed ${max} characters.`);
    }

    return trimmed;
  }

  if (!validDate(input.startDate)) {
    throw new Error('Enter a valid start date in YYYY-MM-DD format.');
  }

  const endDate =
    input.endDate === undefined ||
    input.endDate === null ||
    input.endDate === ''
      ? null
      : input.endDate;

  if (endDate !== null) {
    if (!validDate(endDate)) {
      throw new Error('Enter a valid end date in YYYY-MM-DD format.');
    }

    if (endDate < input.startDate) {
      throw new Error('End date cannot be before start date.');
    }
  }

  if (
    input.status !== 'active' &&
    input.status !== 'completed' &&
    input.status !== 'stopped'
  ) {
    throw new Error('Choose Active, Completed or Stopped.');
  }

  return {
    medicineName: text('medicineName', 'Medicine name', 150),
    dosage: text('dosage', 'Prescribed dosage', 200),
    frequency: text('frequency', 'Frequency', 200),
    instructions: text('instructions', 'Instructions', 2000, false),
    startDate: input.startDate,
    endDate,
    status: input.status,
  };
}

function publicMedication(record: WithId<MedicationDocument>) {
  return {
    id: record._id.toHexString(),
    petId: record.petId.toHexString(),
    medicineName: record.medicineName,
    dosage: record.dosage,
    frequency: record.frequency,
    instructions: record.instructions,
    startDate: record.startDate,
    endDate: record.endDate,
    status: record.status,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

medicationRouter.use(
  '/:petId/medications',
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

    response.locals.medicationPetId = petId;
    next();
  },
);

medicationRouter.param(
  'medicationId',
  (_request, response, next, value: string) => {
    if (!/^[a-f0-9]{24}$/i.test(value)) {
      response.status(400).json({
        success: false,
        message: 'Invalid medication ID.',
      });
      return;
    }

    next();
  },
);

medicationRouter.get(
  '/:petId/medications',
  async (_request, response) => {
    response.setHeader('Cache-Control', 'no-store');

    const records = await medications
      .find({
        petId: response.locals.medicationPetId,
        ownerId: response.locals.userId,
      })
      .sort({ startDate: -1, createdAt: -1, _id: -1 })
      .toArray();

    response.json({
      success: true,
      medications: records.map(publicMedication),
    });
  },
);

medicationRouter.post(
  '/:petId/medications',
  async (request, response) => {
    let fields: MedicationFields;

    try {
      fields = validateMedication(request.body);
    } catch (error: unknown) {
      response.status(400).json({
        success: false,
        message:
          error instanceof Error ? error.message : 'Invalid details.',
      });
      return;
    }

    const now = new Date();

    const record: MedicationDocument = {
      ...fields,
      petId: response.locals.medicationPetId as ObjectId,
      ownerId: response.locals.userId as ObjectId,
      createdAt: now,
      updatedAt: now,
    };

    const result = await medications.insertOne(record);

    response.status(201).json({
      success: true,
      medication: publicMedication({
        ...record,
        _id: result.insertedId,
      }),
    });
  },
);

medicationRouter.patch(
  '/:petId/medications/:medicationId',
  async (request, response) => {
    let fields: MedicationFields;

    try {
      fields = validateMedication(request.body);
    } catch (error: unknown) {
      response.status(400).json({
        success: false,
        message:
          error instanceof Error ? error.message : 'Invalid details.',
      });
      return;
    }

    const record = await medications.findOneAndUpdate(
      {
        _id: new ObjectId(String(request.params.medicationId)),
        petId: response.locals.medicationPetId,
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
        message: 'Medication not found.',
      });
      return;
    }

    response.json({
      success: true,
      medication: publicMedication(record),
    });
  },
);

medicationRouter.delete(
  '/:petId/medications/:medicationId',
  async (request, response) => {
    const result = await medications.deleteOne({
      _id: new ObjectId(String(request.params.medicationId)),
      petId: response.locals.medicationPetId,
      ownerId: response.locals.userId,
    });

    if (!result.deletedCount) {
      response.status(404).json({
        success: false,
        message: 'Medication not found.',
      });
      return;
    }

    response.json({ success: true });
  },
);

export default medicationRouter;