import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { requireSession } from '../middleware/requireSession.ts';
import { petsCollection, publicPet, validatePet } from '../models/pet.ts';
import { database } from '../database.ts';

const petRouter = Router();
petRouter.use(requireSession);

petRouter.get('/', async (_request, response) => {
  const pets = await petsCollection.find({ ownerId: response.locals.userId }).sort({ createdAt: -1, _id: -1 }).toArray();
  response.json({ success: true, pets: pets.map(publicPet) });
});

petRouter.get('/count', async (_request, response) => {
  const count = await petsCollection.countDocuments({ ownerId: response.locals.userId });
  response.json({ success: true, count });
});

petRouter.post('/', async (request, response) => {
  let parsed: ReturnType<typeof validatePet>;
  try { parsed = validatePet(request.body); }
  catch (error) {
    response.status(400).json({ success: false, message: error instanceof Error ? error.message : 'Invalid pet details.' });
    return;
  }
  const now = new Date();
  const pet = { ...parsed.fields, ownerId: response.locals.userId as ObjectId, createdAt: now, updatedAt: now };
  const result = await petsCollection.insertOne(pet);
  response.status(201).json({ success: true, pet: publicPet({ ...pet, _id: result.insertedId }) });
});

petRouter.param('petId', (request, response, next, value: string) => {
  if (!/^[a-f0-9]{24}$/i.test(value)) {
    response.status(400).json({ success: false, message: 'Invalid pet ID.' });
    return;
  }
  next();
});

petRouter.get('/:petId', async (request, response) => {
  const pet = await petsCollection.findOne({ _id: new ObjectId(String(request.params.petId)), ownerId: response.locals.userId });
  if (!pet) { response.status(404).json({ success: false, message: 'Pet not found.' }); return; }
  response.json({ success: true, pet: publicPet(pet) });
});

petRouter.patch('/:petId', async (request, response) => {
  let parsed: ReturnType<typeof validatePet>;
  try { parsed = validatePet(request.body); }
  catch (error) {
    response.status(400).json({ success: false, message: error instanceof Error ? error.message : 'Invalid pet details.' });
    return;
  }
  const unset: { weightKg?: ''; dateOfBirth?: '' } = {};
  if (parsed.clearWeight) unset.weightKg = '';
  if (parsed.clearDob) unset.dateOfBirth = '';
  const pet = await petsCollection.findOneAndUpdate(
    { _id: new ObjectId(String(request.params.petId)), ownerId: response.locals.userId },
    { $set: { ...parsed.fields, updatedAt: new Date() }, ...(Object.keys(unset).length ? { $unset: unset } : {}) },
    { returnDocument: 'after', includeResultMetadata: false },
  );
  if (!pet) { response.status(404).json({ success: false, message: 'Pet not found.' }); return; }
  response.json({ success: true, pet: publicPet(pet) });
});

petRouter.delete('/:petId', async (request, response) => {
  const petId = new ObjectId(String(request.params.petId));
  const ownerId = response.locals.userId as ObjectId;

  const pet = await petsCollection.findOne({
    _id: petId,
    ownerId,
  });

  if (!pet) {
    response.status(404).json({
      success: false,
      message: 'Pet not found.',
    });
    return;
  }

  await database.collection('vaccinations').deleteMany({
    petId,
    ownerId,
  });

  await database.collection('appointments').deleteMany({
    petId,
    ownerId,
  });
  
  await database.collection('healthRecords').deleteMany({
    petId,
    ownerId,
  });

  await petsCollection.deleteOne({
    _id: petId,
    ownerId,
  });

  await database.collection('medications').deleteMany({
  petId,
  ownerId,
});

  response.json({ success: true });
});

// Owner endpoint: View finalized Vet-authored consultations for this pet
petRouter.get('/:petId/consultations', async (request, response) => {
  const petId = new ObjectId(String(request.params.petId));
  const ownerId = response.locals.userId as ObjectId;

  const pet = await petsCollection.findOne({ _id: petId, ownerId });
  if (!pet) {
    response.status(404).json({ success: false, message: 'Pet not found.' });
    return;
  }

  const records = await database
    .collection('consultations')
    .find({ petId, ownerId, status: 'finalized' })
    .sort({ visitDate: -1, createdAt: -1 })
    .toArray();

  response.json({
    success: true,
    consultations: records.map((r) => ({
      id: r._id.toHexString(),
      bookingId: r.bookingId ? r.bookingId.toHexString() : null,
      petId: r.petId.toHexString(),
      vetId: r.vetId.toHexString(),
      vetName: r.vetName,
      clinicName: r.clinicName,
      visitDate: r.visitDate,
      symptoms: r.symptoms,
      examinationNotes: r.examinationNotes || '',
      diagnosis: r.diagnosis,
      treatmentPlan: r.treatmentPlan,
      followUpDate: r.followUpDate || null,
      followUpInstructions: r.followUpInstructions || '',
      status: r.status,
      amendments: r.amendments
        ? r.amendments.map((a: any) => ({
            amendedAt: a.amendedAt instanceof Date ? a.amendedAt.toISOString() : a.amendedAt,
            note: a.note,
          }))
        : [],
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
    })),
  });
});

// Owner endpoint: View Vet-authored prescriptions for this pet
petRouter.get('/:petId/prescriptions', async (request, response) => {
  const petId = new ObjectId(String(request.params.petId));
  const ownerId = response.locals.userId as ObjectId;

  const pet = await petsCollection.findOne({ _id: petId, ownerId });
  if (!pet) {
    response.status(404).json({ success: false, message: 'Pet not found.' });
    return;
  }

  const records = await database
    .collection('prescriptions')
    .find({ petId, ownerId })
    .sort({ createdAt: -1 })
    .toArray();

  response.json({
    success: true,
    prescriptions: records.map((r) => ({
      id: r._id.toHexString(),
      consultationId: r.consultationId ? r.consultationId.toHexString() : null,
      petId: r.petId.toHexString(),
      vetId: r.vetId.toHexString(),
      vetName: r.vetName,
      clinicName: r.clinicName,
      medicineName: r.medicineName,
      dosage: r.dosage,
      route: r.route,
      frequency: r.frequency,
      startDate: r.startDate,
      endDate: r.endDate || null,
      instructions: r.instructions,
      status: r.status,
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
    })),
  });
});

export default petRouter;
