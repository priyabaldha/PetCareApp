import { Router } from 'express';
import { ObjectId } from 'mongodb';
import type { WithId } from 'mongodb';

import { database } from '../database.ts';
import { requireSession } from '../middleware/requireSession.ts';
import { petsCollection } from '../models/pet.ts';

interface VaccinationFields {
  vaccineName: string;
  dateGiven: string;
  nextDueDate: string | null;
  notes: string;
}

interface VaccinationRecord extends VaccinationFields {
  petId: ObjectId;
  ownerId: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const vaccinations =
  database.collection<VaccinationRecord>('vaccinations');

const vaccinationRouter = Router();

vaccinationRouter.use(requireSession);

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

function validateVaccination(body: unknown): VaccinationFields {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new Error('Provide vaccination details.');
  }

  const input = body as Record<string, unknown>;

  const allowedFields = [
    'vaccineName',
    'dateGiven',
    'nextDueDate',
    'notes',
  ];

  if (Object.keys(input).some((key) => !allowedFields.includes(key))) {
    throw new Error('Unknown vaccination field.');
  }

  if (
    typeof input.vaccineName !== 'string' ||
    input.vaccineName.trim().length < 2 ||
    input.vaccineName.trim().length > 100
  ) {
    throw new Error('Vaccine name must contain 2 to 100 characters.');
  }

  if (!isValidDate(input.dateGiven)) {
    throw new Error('Date given must be a valid date in YYYY-MM-DD format.');
  }

  // Allow today's date across time zones.
  const latestToday = new Date(
    Date.now() + 14 * 60 * 60 * 1000,
  ).toISOString().slice(0, 10);

  if (input.dateGiven > latestToday) {
    throw new Error('Date given cannot be in the future.');
  }

  const nextDueDate =
    input.nextDueDate === '' ||
    input.nextDueDate === undefined ||
    input.nextDueDate === null
      ? null
      : input.nextDueDate;

  if (nextDueDate !== null) {
    if (!isValidDate(nextDueDate)) {
      throw new Error('Next due date must use YYYY-MM-DD format.');
    }

    if (nextDueDate <= input.dateGiven) {
      throw new Error('Next due date must be after the date given.');
    }
  }

  if (
    input.notes !== undefined &&
    (typeof input.notes !== 'string' || input.notes.trim().length > 1000)
  ) {
    throw new Error('Notes must contain no more than 1,000 characters.');
  }

  return {
    vaccineName: input.vaccineName.trim(),
    dateGiven: input.dateGiven,
    nextDueDate,
    notes: typeof input.notes === 'string' ? input.notes.trim() : '',
  };
}

function publicVaccination(record: WithId<VaccinationRecord>) {
  return {
    id: record._id.toHexString(),
    petId: record.petId.toHexString(),
    vaccineName: record.vaccineName,
    dateGiven: record.dateGiven,
    nextDueDate: record.nextDueDate,
    notes: record.notes,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

// Every route below checks that the pet belongs to this user.
vaccinationRouter.use('/:petId/vaccinations', async (
  request,
  response,
  next,
) => {
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

  response.locals.vaccinationPetId = petId;
  next();
});

vaccinationRouter.param(
  'vaccinationId',
  (_request, response, next, value: string) => {
    if (!/^[a-f0-9]{24}$/i.test(value)) {
      response.status(400).json({
        success: false,
        message: 'Invalid vaccination ID.',
      });
      return;
    }

    next();
  },
);

// List this pet's vaccination records.
vaccinationRouter.get('/:petId/vaccinations', async (
  _request,
  response,
) => {
  const records = await vaccinations.find({
    petId: response.locals.vaccinationPetId,
    ownerId: response.locals.userId,
  })
    .sort({ dateGiven: -1, _id: -1 })
    .toArray();

  response.json({
    success: true,
    vaccinations: records.map(publicVaccination),
  });
});

// Add a vaccination.
vaccinationRouter.post('/:petId/vaccinations', async (
  request,
  response,
) => {
  let fields: VaccinationFields;

  try {
    fields = validateVaccination(request.body);
  } catch (error) {
    response.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Invalid details.',
    });
    return;
  }

  const now = new Date();

  const record: VaccinationRecord = {
    ...fields,
    petId: response.locals.vaccinationPetId as ObjectId,
    ownerId: response.locals.userId as ObjectId,
    createdAt: now,
    updatedAt: now,
  };

  const result = await vaccinations.insertOne(record);

  response.status(201).json({
    success: true,
    vaccination: publicVaccination({
      ...record,
      _id: result.insertedId,
    }),
  });
});

// Edit a vaccination. Send all four form fields.
vaccinationRouter.patch(
  '/:petId/vaccinations/:vaccinationId',
  async (request, response) => {
    let fields: VaccinationFields;

    try {
      fields = validateVaccination(request.body);
    } catch (error) {
      response.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Invalid details.',
      });
      return;
    }

    const record = await vaccinations.findOneAndUpdate(
      {
        _id: new ObjectId(String(request.params.vaccinationId)),
        petId: response.locals.vaccinationPetId,
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
        message: 'Vaccination record not found.',
      });
      return;
    }

    response.json({
      success: true,
      vaccination: publicVaccination(record),
    });
  },
);

// Delete a vaccination.
vaccinationRouter.delete(
  '/:petId/vaccinations/:vaccinationId',
  async (request, response) => {
    const result = await vaccinations.deleteOne({
      _id: new ObjectId(String(request.params.vaccinationId)),
      petId: response.locals.vaccinationPetId,
      ownerId: response.locals.userId,
    });

    if (!result.deletedCount) {
      response.status(404).json({
        success: false,
        message: 'Vaccination record not found.',
      });
      return;
    }

    response.json({ success: true });
  },
);

export default vaccinationRouter;