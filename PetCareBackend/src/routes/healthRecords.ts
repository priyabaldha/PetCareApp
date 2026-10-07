import { Router } from 'express';
import { ObjectId } from 'mongodb';
import type { WithId } from 'mongodb';

import { database } from '../database.ts';
import { requireSession } from '../middleware/requireSession.ts';
import { petsCollection } from '../models/pet.ts';

interface HealthRecordFields {
  visitDate: string;
  clinicName: string;
  vetName: string;
  symptoms: string;
  diagnosis: string;
  treatment: string;
  notes: string;
}

interface HealthRecordDocument extends HealthRecordFields {
  petId: ObjectId;
  ownerId: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const healthRecords =
  database.collection<HealthRecordDocument>('healthRecords');

const healthRecordRouter = Router();

healthRecordRouter.use(requireSession);

function isValidDate(value: unknown): value is string {
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

function validateHealthRecord(body: unknown): HealthRecordFields {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new Error('Provide health record details.');
  }

  const input = body as Record<string, unknown>;

  const allowedFields = [
    'visitDate',
    'clinicName',
    'vetName',
    'symptoms',
    'diagnosis',
    'treatment',
    'notes',
  ];

  if (
    Object.keys(input).some((key) => !allowedFields.includes(key))
  ) {
    throw new Error('Unknown health record field.');
  }

  if (!isValidDate(input.visitDate)) {
    throw new Error('Visit date must be a valid date in YYYY-MM-DD format.');
  }

  // Same worldwide date allowance as your vaccination route.
  const latestToday = new Date(
    Date.now() + 14 * 60 * 60 * 1000,
  ).toISOString().slice(0, 10);

  if (input.visitDate > latestToday) {
    throw new Error('Use appointments to record a future visit.');
  }

  function textField(
    key: string,
    label: string,
    maximum: number,
    required = false,
  ): string {
    const value = input[key];

    if (value === undefined && !required) {
      return '';
    }

    if (typeof value !== 'string') {
      throw new Error(`${label} must be text.`);
    }

    const trimmed = value.trim();

    if (required && trimmed.length < 2) {
      throw new Error(`${label} must contain at least 2 characters.`);
    }

    if (trimmed.length > maximum) {
      throw new Error(
        `${label} must contain no more than ${maximum} characters.`,
      );
    }

    return trimmed;
  }

  return {
    visitDate: input.visitDate,
    clinicName: textField('clinicName', 'Clinic name', 150, true),
    vetName: textField('vetName', 'Vet name', 100),
    symptoms: textField('symptoms', 'Reason for visit', 1000, true),
    diagnosis: textField('diagnosis', 'Diagnosis', 2000),
    treatment: textField('treatment', 'Treatment notes', 2000),
    notes: textField('notes', 'Additional notes', 2000),
  };
}

function publicHealthRecord(
  record: WithId<HealthRecordDocument>,
) {
  return {
    id: record._id.toHexString(),
    petId: record.petId.toHexString(),
    visitDate: record.visitDate,
    clinicName: record.clinicName,
    vetName: record.vetName,
    symptoms: record.symptoms,
    diagnosis: record.diagnosis,
    treatment: record.treatment,
    notes: record.notes,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

// Check ownership for every health-record operation.
healthRecordRouter.use(
  '/:petId/health-records',
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

    response.locals.healthRecordPetId = petId;
    next();
  },
);

healthRecordRouter.param(
  'recordId',
  (_request, response, next, value: string) => {
    if (!/^[a-f0-9]{24}$/i.test(value)) {
      response.status(400).json({
        success: false,
        message: 'Invalid health record ID.',
      });
      return;
    }

    next();
  },
);

// List records, newest visit first.
healthRecordRouter.get(
  '/:petId/health-records',
  async (_request, response) => {
    response.setHeader('Cache-Control', 'no-store');

    const records = await healthRecords
      .find({
        petId: response.locals.healthRecordPetId,
        ownerId: response.locals.userId,
      })
      .sort({ visitDate: -1, createdAt: -1, _id: -1 })
      .toArray();

    response.json({
      success: true,
      healthRecords: records.map(publicHealthRecord),
    });
  },
);

// Create a record.
healthRecordRouter.post(
  '/:petId/health-records',
  async (request, response) => {
    let fields: HealthRecordFields;

    try {
      fields = validateHealthRecord(request.body);
    } catch (error: unknown) {
      response.status(400).json({
        success: false,
        message:
          error instanceof Error ? error.message : 'Invalid details.',
      });
      return;
    }

    const now = new Date();

    const record: HealthRecordDocument = {
      ...fields,
      petId: response.locals.healthRecordPetId as ObjectId,
      ownerId: response.locals.userId as ObjectId,
      createdAt: now,
      updatedAt: now,
    };

    const result = await healthRecords.insertOne(record);

    response.status(201).json({
      success: true,
      healthRecord: publicHealthRecord({
        ...record,
        _id: result.insertedId,
      }),
    });
  },
);

// Update a record. The frontend sends the complete form.
healthRecordRouter.patch(
  '/:petId/health-records/:recordId',
  async (request, response) => {
    let fields: HealthRecordFields;

    try {
      fields = validateHealthRecord(request.body);
    } catch (error: unknown) {
      response.status(400).json({
        success: false,
        message:
          error instanceof Error ? error.message : 'Invalid details.',
      });
      return;
    }

    const record = await healthRecords.findOneAndUpdate(
      {
        _id: new ObjectId(String(request.params.recordId)),
        petId: response.locals.healthRecordPetId,
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
        message: 'Health record not found.',
      });
      return;
    }

    response.json({
      success: true,
      healthRecord: publicHealthRecord(record),
    });
  },
);

// Delete a record.
healthRecordRouter.delete(
  '/:petId/health-records/:recordId',
  async (request, response) => {
    const result = await healthRecords.deleteOne({
      _id: new ObjectId(String(request.params.recordId)),
      petId: response.locals.healthRecordPetId,
      ownerId: response.locals.userId,
    });

    if (!result.deletedCount) {
      response.status(404).json({
        success: false,
        message: 'Health record not found.',
      });
      return;
    }

    response.json({ success: true });
  },
);

export default healthRecordRouter;