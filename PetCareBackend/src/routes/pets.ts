import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { requireSession } from '../middleware/requireSession.ts';
import { petsCollection, publicPet, validatePet } from '../models/pet.ts';

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
  const result = await petsCollection.deleteOne({ _id: new ObjectId(String(request.params.petId)), ownerId: response.locals.userId });
  if (!result.deletedCount) { response.status(404).json({ success: false, message: 'Pet not found.' }); return; }
  response.json({ success: true });
});
export default petRouter;
