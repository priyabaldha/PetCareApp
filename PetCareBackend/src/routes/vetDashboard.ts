import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { database } from '../database.ts';
import { usersCollection } from '../models/user.ts';
import { petsCollection, publicPet } from '../models/pet.ts';
import {
  vetProfilesCollection,
  defaultAvailability,
  publicVetProfile,
  type VetProfileDocument,
} from '../models/vetProfile.ts';
import {
  vetBookingsCollection,
  publicVetBooking,
  type VetBookingDocument,
} from '../models/vetBooking.ts';
import {
  petAccessGrantsCollection,
} from '../models/petAccessGrant.ts';
import {
  consultationsCollection,
  publicConsultation,
  type ConsultationDocument,
} from '../models/consultation.ts';
import {
  prescriptionsCollection,
  publicPrescription,
  type PrescriptionDocument,
} from '../models/prescription.ts';
import { createNotification } from '../models/notification.ts';
import { requireSession } from '../middleware/requireSession.ts';
import { requireRole } from '../middleware/requireRole.ts';
import { recordAuditLog } from '../models/auditLog.ts';

const vetDashboardRouter = Router();

vetDashboardRouter.use(requireSession);
vetDashboardRouter.use(requireRole('vet'));

/* ==========================================================================
   1. VET PROFILE & AVAILABILITY
   ========================================================================== */

// Get authenticated Vet's profile + verified application details
vetDashboardRouter.get('/profile', async (_request, response) => {
  const vetId = response.locals.userId as ObjectId;

  const vetUser = await usersCollection.findOne({ _id: vetId });
  if (!vetUser) {
    response.status(404).json({ success: false, message: 'Vet account not found.' });
    return;
  }

  let profile = await vetProfilesCollection.findOne({ vetId });
  if (!profile) {
    const clinicAddress = vetUser.vetApplication?.clinicAddress || '';
    profile = {
      _id: new ObjectId(),
      vetId,
      displayName: vetUser.name,
      bio: 'Dedicated veterinary practitioner caring for your beloved pets.',
      clinicPhone: '',
      clinicEmail: '',
      clinicAddress,
      services: [
        { id: '1', name: 'General Consultation', description: 'Routine wellness check-up and health evaluation', fee: 500 },
        { id: '2', name: 'Vaccination', description: 'Core and non-core vaccinations with health screening', fee: 350 },
        { id: '3', name: 'Follow-up Check', description: 'Progress review and medication evaluation', fee: 300 },
      ],
      consultationFee: 500,
      timeZone: 'Asia/Kolkata',
      availability: defaultAvailability,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await vetProfilesCollection.insertOne(profile);
  }

  const verifiedCredentials = vetUser.vetApplication
    ? {
        qualifications: vetUser.vetApplication.qualifications,
        registrationNumber: vetUser.vetApplication.registrationNumber,
        registrationCouncil: vetUser.vetApplication.registrationCouncil,
        clinicName: vetUser.vetApplication.clinicName,
      }
    : undefined;

  response.json({
    success: true,
    profile: publicVetProfile(profile, verifiedCredentials),
  });
});

// Update editable operational details (displayName, bio, clinicPhone, clinicEmail, clinicAddress, services, consultationFee, timeZone)
vetDashboardRouter.patch('/profile', async (request, response) => {
  const vetId = response.locals.userId as ObjectId;
  const body: unknown = request.body;

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    response.status(400).json({ success: false, message: 'Provide profile details.' });
    return;
  }

  const input = body as Record<string, unknown>;

  const updateFields: Partial<VetProfileDocument> = {
    updatedAt: new Date(),
  };

  if (typeof input.displayName === 'string' && input.displayName.trim().length >= 2) {
    updateFields.displayName = input.displayName.trim().slice(0, 100);
  }
  if (typeof input.bio === 'string') {
    updateFields.bio = input.bio.trim().slice(0, 1000);
  }
  if (typeof input.clinicPhone === 'string') {
    updateFields.clinicPhone = input.clinicPhone.trim().slice(0, 30);
  }
  if (typeof input.clinicEmail === 'string') {
    updateFields.clinicEmail = input.clinicEmail.trim().slice(0, 100);
  }
  if (typeof input.clinicAddress === 'string') {
    updateFields.clinicAddress = input.clinicAddress.trim().slice(0, 500);
  }
  if (typeof input.timeZone === 'string' && input.timeZone.trim()) {
    updateFields.timeZone = input.timeZone.trim().slice(0, 50);
  }
  if (typeof input.consultationFee === 'number' && input.consultationFee >= 0) {
    updateFields.consultationFee = input.consultationFee;
  }
  if (Array.isArray(input.services)) {
    updateFields.services = input.services
      .filter((s) => s && typeof s === 'object' && typeof s.name === 'string' && s.name.trim())
      .map((s, idx) => ({
        id: String(s.id || idx + 1),
        name: String(s.name).trim().slice(0, 100),
        description: typeof s.description === 'string' ? s.description.trim().slice(0, 300) : '',
        fee: typeof s.fee === 'number' && s.fee >= 0 ? s.fee : 0,
      }));
  }

  const updated = await vetProfilesCollection.findOneAndUpdate(
    { vetId },
    {
      $set: updateFields,
      $setOnInsert: {
        createdAt: new Date(),
        availability: defaultAvailability,
      },
    },
    { upsert: true, returnDocument: 'after' },
  );

  const vetUser = await usersCollection.findOne({ _id: vetId });
  const verifiedCredentials = vetUser?.vetApplication
    ? {
        qualifications: vetUser.vetApplication.qualifications,
        registrationNumber: vetUser.vetApplication.registrationNumber,
        registrationCouncil: vetUser.vetApplication.registrationCouncil,
        clinicName: vetUser.vetApplication.clinicName,
      }
    : undefined;

  response.json({
    success: true,
    profile: publicVetProfile(updated!, verifiedCredentials),
  });
});

// Update availability & working schedule
vetDashboardRouter.put('/availability', async (request, response) => {
  const vetId = response.locals.userId as ObjectId;
  const body: unknown = request.body;

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    response.status(400).json({ success: false, message: 'Provide availability settings.' });
    return;
  }

  const input = body as Record<string, unknown>;

  const isOpen = Boolean(input.isOpen);
  const slotDurationMinutes = [15, 20, 30, 45, 60].includes(Number(input.slotDurationMinutes))
    ? Number(input.slotDurationMinutes)
    : 30;

  const workingDays = Array.isArray(input.workingDays)
    ? input.workingDays.map(Number).filter((d) => d >= 0 && d <= 6)
    : [1, 2, 3, 4, 5];

  const whInput = input.workingHours as Record<string, unknown> | undefined;
  const workingHours = {
    start: typeof whInput?.start === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(whInput.start)
      ? whInput.start
      : '09:00',
    end: typeof whInput?.end === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(whInput.end)
      ? whInput.end
      : '17:00',
  };

  if (workingHours.start >= workingHours.end) {
    response.status(400).json({ success: false, message: 'Start time must be before end time.' });
    return;
  }

  const breaks = Array.isArray(input.breaks)
    ? input.breaks
        .filter((b) => b && typeof b === 'object')
        .map((b) => ({
          start: String(b.start || '13:00'),
          end: String(b.end || '14:00'),
          label: typeof b.label === 'string' ? b.label.slice(0, 50) : '',
        }))
        .filter((b) => /^([01]\d|2[0-3]):[0-5]\d$/.test(b.start) && /^([01]\d|2[0-3]):[0-5]\d$/.test(b.end) && b.start < b.end)
    : [];

  const unavailableDates = Array.isArray(input.unavailableDates)
    ? input.unavailableDates.filter((d) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d))
    : [];

  const updatedAvailability = {
    isOpen,
    slotDurationMinutes,
    workingDays,
    workingHours,
    breaks,
    unavailableDates,
  };

  const updated = await vetProfilesCollection.findOneAndUpdate(
    { vetId },
    {
      $set: {
        availability: updatedAvailability,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        displayName: response.locals.userName as string,
        bio: '',
        clinicPhone: '',
        clinicEmail: '',
        clinicAddress: '',
        services: [],
        consultationFee: 500,
        timeZone: 'Asia/Kolkata',
        createdAt: new Date(),
      },
    },
    { upsert: true, returnDocument: 'after' },
  );

  response.json({
    success: true,
    availability: updated!.availability,
  });
});

/* ==========================================================================
   2. VET DASHBOARD STATS
   ========================================================================== */

vetDashboardRouter.get('/dashboard-stats', async (_request, response) => {
  const vetId = response.locals.userId as ObjectId;
  const todayStr = new Date().toISOString().slice(0, 10);

  const [
    pendingRequests,
    todayConfirmed,
    upcomingVisits,
    completedConsultations,
    distinctPatients,
  ] = await Promise.all([
    vetBookingsCollection.countDocuments({ vetId, status: 'pending' }),
    vetBookingsCollection.countDocuments({ vetId, status: 'confirmed', date: todayStr }),
    vetBookingsCollection.countDocuments({
      vetId,
      status: 'confirmed',
      date: { $gte: todayStr },
    }),
    consultationsCollection.countDocuments({ vetId, status: 'finalized' }),
    vetBookingsCollection.distinct('petId', { vetId }),
  ]);

  response.json({
    success: true,
    stats: {
      pendingRequests,
      todayConfirmed,
      upcomingVisits,
      completedConsultations,
      totalPatients: distinctPatients.length,
    },
  });
});

/* ==========================================================================
   3. VET APPOINTMENTS / BOOKINGS MANAGEMENT
   ========================================================================== */

// List appointments for this Vet with optional status & date filter
vetDashboardRouter.get('/bookings', async (request, response) => {
  const vetId = response.locals.userId as ObjectId;
  const status = String(request.query.status || 'all').trim();
  const date = String(request.query.date || '').trim();

  const filter: Record<string, unknown> = { vetId };

  if (status !== 'all' && ['pending', 'confirmed', 'completed', 'rejected', 'cancelled'].includes(status)) {
    filter.status = status;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    filter.date = date;
  }

  const records = await vetBookingsCollection
    .find(filter)
    .sort({ date: 1, time: 1, _id: 1 })
    .toArray();

  response.json({
    success: true,
    bookings: records.map(publicVetBooking),
  });
});

// Get a single booking
vetDashboardRouter.get('/bookings/:bookingId', async (request, response) => {
  const vetId = response.locals.userId as ObjectId;
  const bookingIdStr = String(request.params.bookingId);

  if (!/^[a-f0-9]{24}$/i.test(bookingIdStr)) {
    response.status(400).json({ success: false, message: 'Invalid booking ID.' });
    return;
  }

  const booking = await vetBookingsCollection.findOne({
    _id: new ObjectId(bookingIdStr),
    vetId,
  });

  if (!booking) {
    response.status(404).json({ success: false, message: 'Booking not found.' });
    return;
  }

  response.json({
    success: true,
    booking: publicVetBooking(booking),
  });
});

// Accept a pending booking
vetDashboardRouter.post('/bookings/:bookingId/accept', async (request, response) => {
  const vetId = response.locals.userId as ObjectId;
  const bookingIdStr = String(request.params.bookingId);

  if (!/^[a-f0-9]{24}$/i.test(bookingIdStr)) {
    response.status(400).json({ success: false, message: 'Invalid booking ID.' });
    return;
  }

  const booking = await vetBookingsCollection.findOne({
    _id: new ObjectId(bookingIdStr),
    vetId,
  });

  if (!booking) {
    response.status(404).json({ success: false, message: 'Booking not found.' });
    return;
  }

  if (booking.status !== 'pending') {
    response.status(400).json({
      success: false,
      message: `Booking is currently "${booking.status}" and cannot be accepted.`,
    });
    return;
  }

  const now = new Date();
  const result = await vetBookingsCollection.updateOne(
    {
      _id: new ObjectId(bookingIdStr),
      vetId,
      status: 'pending',
    },
    {
      $set: {
        status: 'confirmed',
        updatedAt: now,
      },
    },
  );

  if (result.modifiedCount !== 1) {
    response.status(409).json({ success: false, message: 'Booking status has already changed.' });
    return;
  }

  // Notify the Owner
  await createNotification({
    userId: booking.ownerId,
    type: 'booking_confirmed',
    title: 'Appointment Confirmed! 🐾',
    message: `Dr. ${response.locals.userName} confirmed your appointment for ${booking.petName} on ${booking.date} at ${booking.time}.`,
    data: {
      bookingId: booking._id!.toHexString(),
      bookingNumber: booking.bookingNumber,
    },
  });

  response.json({ success: true, message: 'Booking confirmed.' });
});

// Reject a pending booking with required reason
vetDashboardRouter.post('/bookings/:bookingId/reject', async (request, response) => {
  const vetId = response.locals.userId as ObjectId;
  const bookingIdStr = String(request.params.bookingId);

  if (!/^[a-f0-9]{24}$/i.test(bookingIdStr)) {
    response.status(400).json({ success: false, message: 'Invalid booking ID.' });
    return;
  }

  const reason = String(request.body?.reason || '').trim();
  if (reason.length < 3 || reason.length > 500) {
    response.status(400).json({ success: false, message: 'Provide a rejection reason between 3 and 500 characters.' });
    return;
  }

  const booking = await vetBookingsCollection.findOne({
    _id: new ObjectId(bookingIdStr),
    vetId,
  });

  if (!booking) {
    response.status(404).json({ success: false, message: 'Booking not found.' });
    return;
  }

  if (booking.status !== 'pending') {
    response.status(400).json({
      success: false,
      message: `Booking is currently "${booking.status}" and cannot be rejected.`,
    });
    return;
  }

  const now = new Date();
  const result = await vetBookingsCollection.updateOne(
    {
      _id: new ObjectId(bookingIdStr),
      vetId,
      status: 'pending',
    },
    {
      $set: {
        status: 'rejected',
        rejectionReason: reason,
        updatedAt: now,
      },
    },
  );

  if (result.modifiedCount !== 1) {
    response.status(409).json({ success: false, message: 'Booking status has already changed.' });
    return;
  }

  // Notify the Owner
  await createNotification({
    userId: booking.ownerId,
    type: 'booking_rejected',
    title: 'Appointment Request Declined',
    message: `Your booking request for ${booking.petName} on ${booking.date} was declined: ${reason}`,
    data: {
      bookingId: booking._id!.toHexString(),
      bookingNumber: booking.bookingNumber,
    },
  });

  response.json({ success: true, message: 'Booking rejected.' });
});

// Cancel a confirmed booking with required reason
vetDashboardRouter.post('/bookings/:bookingId/cancel', async (request, response) => {
  const vetId = response.locals.userId as ObjectId;
  const bookingIdStr = String(request.params.bookingId);

  if (!/^[a-f0-9]{24}$/i.test(bookingIdStr)) {
    response.status(400).json({ success: false, message: 'Invalid booking ID.' });
    return;
  }

  const reason = String(request.body?.reason || '').trim();
  if (reason.length < 3 || reason.length > 500) {
    response.status(400).json({ success: false, message: 'Provide a cancellation reason between 3 and 500 characters.' });
    return;
  }

  const booking = await vetBookingsCollection.findOne({
    _id: new ObjectId(bookingIdStr),
    vetId,
  });

  if (!booking) {
    response.status(404).json({ success: false, message: 'Booking not found.' });
    return;
  }

  if (booking.status !== 'confirmed' && booking.status !== 'pending') {
    response.status(400).json({
      success: false,
      message: `Cannot cancel a booking that is ${booking.status}.`,
    });
    return;
  }

  const now = new Date();
  const result = await vetBookingsCollection.updateOne(
    {
      _id: new ObjectId(bookingIdStr),
      vetId,
      status: { $in: ['pending', 'confirmed'] },
    },
    {
      $set: {
        status: 'cancelled',
        cancelledBy: 'vet',
        cancellationReason: reason,
        updatedAt: now,
      },
    },
  );

  if (result.modifiedCount !== 1) {
    response.status(409).json({ success: false, message: 'Booking status has already changed.' });
    return;
  }

  // Notify Owner
  await createNotification({
    userId: booking.ownerId,
    type: 'booking_cancelled',
    title: 'Appointment Cancelled by Clinic',
    message: `Your appointment for ${booking.petName} on ${booking.date} at ${booking.time} was cancelled: ${reason}`,
    data: {
      bookingId: booking._id!.toHexString(),
      bookingNumber: booking.bookingNumber,
    },
  });

  response.json({ success: true, message: 'Booking cancelled.' });
});

// Propose a reschedule to the Owner
vetDashboardRouter.post('/bookings/:bookingId/propose-reschedule', async (request, response) => {
  const vetId = response.locals.userId as ObjectId;
  const bookingIdStr = String(request.params.bookingId);

  if (!/^[a-f0-9]{24}$/i.test(bookingIdStr)) {
    response.status(400).json({ success: false, message: 'Invalid booking ID.' });
    return;
  }

  const proposedDate = String(request.body?.proposedDate || '').trim();
  const proposedTime = String(request.body?.proposedTime || '').trim();
  const reason = String(request.body?.reason || '').trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(proposedDate)) {
    response.status(400).json({ success: false, message: 'Enter a valid proposed date (YYYY-MM-DD).' });
    return;
  }
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(proposedTime)) {
    response.status(400).json({ success: false, message: 'Enter a valid proposed time (HH:mm).' });
    return;
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  if (proposedDate < todayStr) {
    response.status(400).json({ success: false, message: 'Proposed date cannot be in the past.' });
    return;
  }

  const booking = await vetBookingsCollection.findOne({
    _id: new ObjectId(bookingIdStr),
    vetId,
  });

  if (!booking) {
    response.status(404).json({ success: false, message: 'Booking not found.' });
    return;
  }

  if (booking.status === 'completed' || booking.status === 'cancelled' || booking.status === 'rejected') {
    response.status(400).json({
      success: false,
      message: `Cannot reschedule a booking that is ${booking.status}.`,
    });
    return;
  }

  // Check if the proposed slot is already booked
  const conflict = await vetBookingsCollection.findOne({
    vetId,
    date: proposedDate,
    time: proposedTime,
    _id: { $ne: booking._id },
    status: { $in: ['pending', 'confirmed'] },
  });

  if (conflict) {
    response.status(409).json({
      success: false,
      message: 'The proposed time slot is already booked. Choose another time.',
    });
    return;
  }

  const now = new Date();
  await vetBookingsCollection.updateOne(
    { _id: booking._id },
    {
      $set: {
        rescheduleProposal: {
          proposedDate,
          proposedTime,
          proposedBy: 'vet',
          reason,
          status: 'pending',
          proposedAt: now,
        },
        updatedAt: now,
      },
    },
  );

  // Notify Owner
  await createNotification({
    userId: booking.ownerId,
    type: 'reschedule_proposed',
    title: 'Appointment Reschedule Proposed 📅',
    message: `Dr. ${response.locals.userName} proposed to reschedule the visit for ${booking.petName} to ${proposedDate} at ${proposedTime}.${reason ? ` Reason: ${reason}` : ''}`,
    data: {
      bookingId: booking._id!.toHexString(),
      bookingNumber: booking.bookingNumber,
      proposedDate,
      proposedTime,
    },
  });

  response.json({ success: true, message: 'Reschedule proposal sent to owner.' });
});

// Mark a booking as completed
vetDashboardRouter.post('/bookings/:bookingId/complete', async (request, response) => {
  const vetId = response.locals.userId as ObjectId;
  const bookingIdStr = String(request.params.bookingId);

  if (!/^[a-f0-9]{24}$/i.test(bookingIdStr)) {
    response.status(400).json({ success: false, message: 'Invalid booking ID.' });
    return;
  }

  const booking = await vetBookingsCollection.findOne({
    _id: new ObjectId(bookingIdStr),
    vetId,
  });

  if (!booking) {
    response.status(404).json({ success: false, message: 'Booking not found.' });
    return;
  }

  if (booking.status !== 'confirmed') {
    response.status(400).json({
      success: false,
      message: `Only confirmed appointments can be marked completed. Current status: ${booking.status}`,
    });
    return;
  }

  const now = new Date();
  await vetBookingsCollection.updateOne(
    { _id: booking._id },
    {
      $set: {
        status: 'completed',
        updatedAt: now,
      },
    },
  );

  response.json({ success: true, message: 'Appointment marked completed.' });
});

/* ==========================================================================
   4. PATIENTS & RECORD ACCESS
   ========================================================================== */

// Helper to verify if Vet is permitted to access a pet
async function checkVetPetPermission(vetId: ObjectId, petId: ObjectId) {
  // Check 1: Active sharing grant
  const activeGrant = await petAccessGrantsCollection.findOne({
    vetId,
    petId,
    status: 'active',
  });

  if (activeGrant) {
    return { permitted: true, scope: activeGrant.scope };
  }

  // Check 2: Booking with shareMedicalHistory = true
  const bookingWithHistory = await vetBookingsCollection.findOne({
    vetId,
    petId,
    shareMedicalHistory: true,
  });

  if (bookingWithHistory) {
    return { permitted: true, scope: 'full_history' as const };
  }

  // Check 3: Minimum booking existence (basic access only, not full clinical history)
  const basicBooking = await vetBookingsCollection.findOne({
    vetId,
    petId,
  });

  if (basicBooking) {
    return { permitted: true, scope: 'consultation_only' as const };
  }

  return { permitted: false, scope: null };
}

// List all distinct patients for this Vet
vetDashboardRouter.get('/patients', async (request, response) => {
  const vetId = response.locals.userId as ObjectId;
  const search = String(request.query.q || '').trim().toLowerCase();

  // Find all pet IDs from bookings and active grants
  const [bookingPetIds, grantPetIds] = await Promise.all([
    vetBookingsCollection.distinct('petId', { vetId }),
    petAccessGrantsCollection.distinct('petId', { vetId, status: 'active' }),
  ]);

  const allPetIdStrings = Array.from(
    new Set([
      ...bookingPetIds.map((id: ObjectId) => id.toHexString()),
      ...grantPetIds.map((id: ObjectId) => id.toHexString()),
    ]),
  );

  if (allPetIdStrings.length === 0) {
    response.json({ success: true, patients: [] });
    return;
  }

  const petObjectIds = allPetIdStrings.map((id) => new ObjectId(id));
  const pets = await petsCollection.find({ _id: { $in: petObjectIds } }).toArray();

  // Fetch owner details
  const ownerIds = pets.map((p) => p.ownerId);
  const owners = await usersCollection
    .find({ _id: { $in: ownerIds } })
    .project({ _id: 1, name: 1, email: 1 })
    .toArray();

  const ownerMap = new Map<string, { name: string; email: string }>();
  for (const o of owners) {
    ownerMap.set(o._id!.toHexString(), { name: o.name, email: o.email });
  }

  // Fetch last visit / booking date and sharing status for each pet
  const patientCards = await Promise.all(
    pets.map(async (pet) => {
      const owner = ownerMap.get(pet.ownerId.toHexString());
      const lastBooking = await vetBookingsCollection
        .find({ vetId, petId: pet._id! })
        .sort({ date: -1, time: -1 })
        .limit(1)
        .toArray();

      const { scope } = await checkVetPetPermission(vetId, pet._id!);

      return {
        petId: pet._id!.toHexString(),
        name: pet.name,
        species: pet.species,
        breed: pet.breed || '',
        sex: pet.sex,
        dateOfBirth: pet.dateOfBirth || null,
        weightKg: pet.weightKg || null,
        ownerId: pet.ownerId.toHexString(),
        ownerName: owner?.name || 'Pet Owner',
        ownerEmail: owner?.email || '',
        lastVisitDate: lastBooking[0]?.date || null,
        lastBookingStatus: lastBooking[0]?.status || null,
        accessScope: scope, // 'full_history' or 'consultation_only'
      };
    }),
  );

  const filtered = patientCards.filter((p) => {
    if (!search) return true;
    return (
      p.name.toLowerCase().includes(search) ||
      p.species.toLowerCase().includes(search) ||
      p.ownerName.toLowerCase().includes(search)
    );
  });

  response.json({
    success: true,
    patients: filtered,
  });
});

// Get patient details overview
vetDashboardRouter.get('/patients/:petId', async (request, response) => {
  const vetId = response.locals.userId as ObjectId;
  const petIdStr = String(request.params.petId);

  if (!/^[a-f0-9]{24}$/i.test(petIdStr)) {
    response.status(400).json({ success: false, message: 'Invalid pet ID.' });
    return;
  }

  const petId = new ObjectId(petIdStr);
  const { permitted, scope } = await checkVetPetPermission(vetId, petId);

  if (!permitted) {
    response.status(403).json({
      success: false,
      message: 'You do not have permission to view this patient.',
    });
    return;
  }

  const pet = await petsCollection.findOne({ _id: petId });
  if (!pet) {
    response.status(404).json({ success: false, message: 'Pet not found.' });
    return;
  }

  const owner = await usersCollection.findOne(
    { _id: pet.ownerId },
    { projection: { name: 1, email: 1 } },
  );

  const consultations = await consultationsCollection
    .find({ petId, vetId })
    .sort({ visitDate: -1 })
    .toArray();

  const bookings = await vetBookingsCollection
    .find({ petId, vetId })
    .sort({ date: -1, time: -1 })
    .toArray();

  response.json({
    success: true,
    patient: {
      ...publicPet(pet),
      ownerName: owner?.name || 'Pet Owner',
      ownerEmail: owner?.email || '',
      accessScope: scope,
    },
    consultations: consultations.map(publicConsultation),
    bookings: bookings.map(publicVetBooking),
  });
});

// Get patient shared medical history (vaccinations, medications, owner health notes) - REQUIRES ACTIVE FULL_HISTORY SHARING
vetDashboardRouter.get('/patients/:petId/history', async (request, response) => {
  const vetId = response.locals.userId as ObjectId;
  const petIdStr = String(request.params.petId);

  if (!/^[a-f0-9]{24}$/i.test(petIdStr)) {
    response.status(400).json({ success: false, message: 'Invalid pet ID.' });
    return;
  }

  const petId = new ObjectId(petIdStr);
  const { permitted, scope } = await checkVetPetPermission(vetId, petId);

  if (!permitted) {
    response.status(403).json({
      success: false,
      message: 'You do not have access to this patient.',
    });
    return;
  }

  if (scope !== 'full_history') {
    response.status(403).json({
      success: false,
      message: 'The owner has not shared clinical history for this pet, or access was revoked.',
      scopeRestricted: true,
    });
    return;
  }

  const [vaccinations, medications, healthNotes, prescriptions, allConsultations] =
    await Promise.all([
      database.collection('vaccinations').find({ petId }).sort({ dateAdministered: -1 }).toArray(),
      database.collection('medications').find({ petId }).sort({ startDate: -1 }).toArray(),
      database.collection('healthRecords').find({ petId }).sort({ visitDate: -1 }).toArray(),
      prescriptionsCollection.find({ petId }).sort({ createdAt: -1 }).toArray(),
      consultationsCollection.find({ petId }).sort({ visitDate: -1 }).toArray(),
    ]);

  response.json({
    success: true,
    history: {
      vaccinations: vaccinations.map((v) => ({
        id: v._id.toHexString(),
        vaccineName: v.vaccineName,
        dateAdministered: v.dateAdministered,
        nextDueDate: v.nextDueDate || null,
        batchNumber: v.batchNumber || '',
        clinicName: v.clinicName || '',
        notes: v.notes || '',
        isVetAuthored: Boolean(v.isVetAuthored),
      })),
      medications: medications.map((m) => ({
        id: m._id.toHexString(),
        medicineName: m.medicineName,
        dosage: m.dosage,
        frequency: m.frequency,
        instructions: m.instructions || '',
        startDate: m.startDate,
        endDate: m.endDate || null,
        status: m.status,
      })),
      healthNotes: healthNotes.map((h) => ({
        id: h._id.toHexString(),
        visitDate: h.visitDate,
        clinicName: h.clinicName,
        symptoms: h.symptoms,
        diagnosis: h.diagnosis || '',
        treatment: h.treatment || '',
        notes: h.notes || '',
      })),
      prescriptions: prescriptions.map(publicPrescription),
      consultations: allConsultations.map(publicConsultation),
    },
  });
});

/* ==========================================================================
   5. CONSULTATIONS & CLINICAL RECORDS
   ========================================================================== */

// Create consultation record (Draft or Finalized)
vetDashboardRouter.post('/consultations', async (request, response) => {
  const vetId = response.locals.userId as ObjectId;
  const body: unknown = request.body;

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    response.status(400).json({ success: false, message: 'Provide consultation details.' });
    return;
  }

  const input = body as Record<string, unknown>;

  const petIdStr = String(input.petId || '').trim();
  const bookingIdStr = typeof input.bookingId === 'string' && /^[a-f0-9]{24}$/i.test(input.bookingId)
    ? input.bookingId
    : null;

  const visitDate = String(input.visitDate || '').trim();
  const symptoms = String(input.symptoms || '').trim();
  const examinationNotes = String(input.examinationNotes || '').trim();
  const diagnosis = String(input.diagnosis || '').trim();
  const treatmentPlan = String(input.treatmentPlan || '').trim();
  const followUpDate = typeof input.followUpDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input.followUpDate)
    ? input.followUpDate
    : null;
  const followUpInstructions = String(input.followUpInstructions || '').trim();
  const status = input.status === 'draft' ? 'draft' : 'finalized';

  if (!/^[a-f0-9]{24}$/i.test(petIdStr)) {
    response.status(400).json({ success: false, message: 'Invalid pet ID.' });
    return;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(visitDate)) {
    response.status(400).json({ success: false, message: 'Enter a valid visit date (YYYY-MM-DD).' });
    return;
  }
  if (symptoms.length < 2 || symptoms.length > 1000) {
    response.status(400).json({ success: false, message: 'Symptoms/reason must contain 2 to 1000 characters.' });
    return;
  }
  if (status === 'finalized' && (!diagnosis || diagnosis.length < 2)) {
    response.status(400).json({ success: false, message: 'Finalized consultations require a diagnosis.' });
    return;
  }

  const petId = new ObjectId(petIdStr);
  const { permitted } = await checkVetPetPermission(vetId, petId);

  if (!permitted) {
    response.status(403).json({ success: false, message: 'You do not have access to record consultations for this pet.' });
    return;
  }

  const pet = await petsCollection.findOne({ _id: petId });
  if (!pet) {
    response.status(404).json({ success: false, message: 'Pet not found.' });
    return;
  }

  const vetUser = await usersCollection.findOne({ _id: vetId });
  const clinicName = vetUser?.vetApplication?.clinicName || 'Veterinary Clinic';

  const now = new Date();
  const newConsultation: ConsultationDocument = {
    bookingId: bookingIdStr ? new ObjectId(bookingIdStr) : null,
    petId,
    ownerId: pet.ownerId,
    vetId,
    vetName: String(response.locals.userName || 'Veterinarian'),
    clinicName,
    visitDate,
    symptoms,
    examinationNotes,
    diagnosis,
    treatmentPlan,
    followUpDate,
    followUpInstructions,
    status,
    amendments: [],
    createdAt: now,
    updatedAt: now,
  };

  const insertResult = await consultationsCollection.insertOne(newConsultation);

  // If finalized and attached to a booking, mark the booking as completed
  if (status === 'finalized' && bookingIdStr) {
    await vetBookingsCollection.updateOne(
      { _id: new ObjectId(bookingIdStr), vetId },
      { $set: { status: 'completed', updatedAt: now } },
    );
  }

  // Notify owner if finalized
  if (status === 'finalized') {
    await createNotification({
      userId: pet.ownerId,
      type: 'consultation_published',
      title: 'New Consultation Notes Available 📋',
      message: `Dr. ${response.locals.userName} published consultation notes for ${pet.name}.`,
      data: {
        petId: pet._id!.toHexString(),
        consultationId: insertResult.insertedId.toHexString(),
      },
    });
  }

  response.status(201).json({
    success: true,
    consultation: publicConsultation({ ...newConsultation, _id: insertResult.insertedId }),
  });
});

// Update draft or add amendment to finalized consultation
vetDashboardRouter.patch('/consultations/:consultationId', async (request, response) => {
  const vetId = response.locals.userId as ObjectId;
  const consultationIdStr = String(request.params.consultationId);

  if (!/^[a-f0-9]{24}$/i.test(consultationIdStr)) {
    response.status(400).json({ success: false, message: 'Invalid consultation ID.' });
    return;
  }

  const consultation = await consultationsCollection.findOne({
    _id: new ObjectId(consultationIdStr),
    vetId,
  });

  if (!consultation) {
    response.status(404).json({ success: false, message: 'Consultation not found.' });
    return;
  }

  const body = (request.body || {}) as Record<string, unknown>;
  const now = new Date();

  if (consultation.status === 'draft') {
    // Drafts can be edited freely
    const updateSet: Partial<ConsultationDocument> = {
      updatedAt: now,
    };

    if (typeof body.symptoms === 'string') updateSet.symptoms = body.symptoms.trim();
    if (typeof body.examinationNotes === 'string') updateSet.examinationNotes = body.examinationNotes.trim();
    if (typeof body.diagnosis === 'string') updateSet.diagnosis = body.diagnosis.trim();
    if (typeof body.treatmentPlan === 'string') updateSet.treatmentPlan = body.treatmentPlan.trim();
    if (typeof body.visitDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.visitDate)) updateSet.visitDate = body.visitDate;
    if (typeof body.followUpDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.followUpDate)) updateSet.followUpDate = body.followUpDate;
    if (typeof body.followUpInstructions === 'string') updateSet.followUpInstructions = body.followUpInstructions.trim();
    if (body.status === 'finalized') updateSet.status = 'finalized';

    const updated = await consultationsCollection.findOneAndUpdate(
      { _id: consultation._id },
      { $set: updateSet },
      { returnDocument: 'after' },
    );

    if (updateSet.status === 'finalized') {
      // Notify owner
      await createNotification({
        userId: consultation.ownerId,
        type: 'consultation_published',
        title: 'Consultation Notes Published 📋',
        message: `Dr. ${response.locals.userName} finalized consultation notes for your pet.`,
        data: {
          petId: consultation.petId.toHexString(),
          consultationId: consultation._id!.toHexString(),
        },
      });
    }

    response.json({
      success: true,
      consultation: publicConsultation(updated!),
    });
  } else {
    // Finalized records use amendments to preserve clinical audit integrity
    const amendmentNote = String(body.amendmentNote || '').trim();
    if (amendmentNote.length < 3 || amendmentNote.length > 1000) {
      response.status(400).json({
        success: false,
        message: 'Provide an amendment note (3 to 1000 characters) for finalized clinical records.',
      });
      return;
    }

    const updated = await consultationsCollection.findOneAndUpdate(
      { _id: consultation._id },
      {
        $push: {
          amendments: {
            amendedAt: now,
            amendedBy: vetId,
            note: amendmentNote,
          },
        },
        $set: { updatedAt: now },
      },
      { returnDocument: 'after' },
    );

    response.json({
      success: true,
      consultation: publicConsultation(updated!),
      message: 'Amendment added to finalized record.',
    });
  }
});

// List consultations authored by this Vet
vetDashboardRouter.get('/consultations', async (_request, response) => {
  const vetId = response.locals.userId as ObjectId;
  const records = await consultationsCollection
    .find({ vetId })
    .sort({ visitDate: -1, createdAt: -1 })
    .toArray();

  response.json({
    success: true,
    consultations: records.map(publicConsultation),
  });
});

/* ==========================================================================
   6. PRESCRIPTIONS / MEDICATION INSTRUCTIONS
   ========================================================================== */

// Create vet-authored prescription
vetDashboardRouter.post('/prescriptions', async (request, response) => {
  const vetId = response.locals.userId as ObjectId;
  const body: unknown = request.body;

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    response.status(400).json({ success: false, message: 'Provide prescription details.' });
    return;
  }

  const input = body as Record<string, unknown>;

  const petIdStr = String(input.petId || '').trim();
  const medicineName = String(input.medicineName || '').trim();
  const dosage = String(input.dosage || '').trim();
  const route = String(input.route || 'Oral').trim();
  const frequency = String(input.frequency || '').trim();
  const startDate = String(input.startDate || '').trim();
  const endDate = typeof input.endDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input.endDate)
    ? input.endDate
    : null;
  const instructions = String(input.instructions || '').trim();
  const consultationIdStr = typeof input.consultationId === 'string' && /^[a-f0-9]{24}$/i.test(input.consultationId)
    ? input.consultationId
    : null;

  if (!/^[a-f0-9]{24}$/i.test(petIdStr)) {
    response.status(400).json({ success: false, message: 'Invalid pet ID.' });
    return;
  }
  if (medicineName.length < 2 || medicineName.length > 150) {
    response.status(400).json({ success: false, message: 'Medicine name must contain 2 to 150 characters.' });
    return;
  }
  if (dosage.length < 1 || dosage.length > 200) {
    response.status(400).json({ success: false, message: 'Prescribed dosage is required.' });
    return;
  }
  if (frequency.length < 1 || frequency.length > 200) {
    response.status(400).json({ success: false, message: 'Frequency is required.' });
    return;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    response.status(400).json({ success: false, message: 'Enter a valid start date (YYYY-MM-DD).' });
    return;
  }

  const petId = new ObjectId(petIdStr);
  const { permitted } = await checkVetPetPermission(vetId, petId);

  if (!permitted) {
    response.status(403).json({ success: false, message: 'You do not have access to prescribe for this pet.' });
    return;
  }

  const pet = await petsCollection.findOne({ _id: petId });
  if (!pet) {
    response.status(404).json({ success: false, message: 'Pet not found.' });
    return;
  }

  const vetUser = await usersCollection.findOne({ _id: vetId });
  const clinicName = vetUser?.vetApplication?.clinicName || 'Veterinary Clinic';

  const now = new Date();
  const newPrescription: PrescriptionDocument = {
    consultationId: consultationIdStr ? new ObjectId(consultationIdStr) : null,
    petId,
    ownerId: pet.ownerId,
    vetId,
    vetName: String(response.locals.userName || 'Veterinarian'),
    clinicName,
    medicineName,
    dosage,
    route,
    frequency,
    startDate,
    endDate,
    instructions,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };

  const insertResult = await prescriptionsCollection.insertOne(newPrescription);

  // Also add to pet medications collection with isVetAuthored flag so existing screens integrate cleanly
  await database.collection('medications').insertOne({
    petId,
    ownerId: pet.ownerId,
    medicineName,
    dosage,
    frequency,
    instructions: `${instructions ? `${instructions} • ` : ''}Prescribed by Dr. ${response.locals.userName} (${clinicName})`,
    startDate,
    endDate,
    status: 'active',
    isVetAuthored: true,
    vetId,
    vetName: response.locals.userName,
    createdAt: now,
    updatedAt: now,
  });

  // Notify owner
  await createNotification({
    userId: pet.ownerId,
    type: 'prescription_added',
    title: 'New Prescription Added 💊',
    message: `Dr. ${response.locals.userName} prescribed ${medicineName} for ${pet.name}.`,
    data: {
      petId: pet._id!.toHexString(),
      prescriptionId: insertResult.insertedId.toHexString(),
      medicineName,
    },
  });

  response.status(201).json({
    success: true,
    prescription: publicPrescription({ ...newPrescription, _id: insertResult.insertedId }),
  });
});

/* ==========================================================================
   7. VACCINATIONS AUTHORED BY VET
   ========================================================================== */

vetDashboardRouter.post('/vaccinations', async (request, response) => {
  const vetId = response.locals.userId as ObjectId;
  const body: unknown = request.body;

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    response.status(400).json({ success: false, message: 'Provide vaccination details.' });
    return;
  }

  const input = body as Record<string, unknown>;

  const petIdStr = String(input.petId || '').trim();
  const vaccineName = String(input.vaccineName || '').trim();
  const dateAdministered = String(input.dateAdministered || '').trim();
  const nextDueDate = typeof input.nextDueDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input.nextDueDate)
    ? input.nextDueDate
    : null;
  const batchNumber = String(input.batchNumber || '').trim();
  const notes = String(input.notes || '').trim();

  if (!/^[a-f0-9]{24}$/i.test(petIdStr)) {
    response.status(400).json({ success: false, message: 'Invalid pet ID.' });
    return;
  }
  if (vaccineName.length < 2 || vaccineName.length > 150) {
    response.status(400).json({ success: false, message: 'Vaccine name must contain 2 to 150 characters.' });
    return;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateAdministered)) {
    response.status(400).json({ success: false, message: 'Enter a valid administered date (YYYY-MM-DD).' });
    return;
  }

  const petId = new ObjectId(petIdStr);
  const { permitted } = await checkVetPetPermission(vetId, petId);

  if (!permitted) {
    response.status(403).json({ success: false, message: 'You do not have access to record vaccinations for this pet.' });
    return;
  }

  const pet = await petsCollection.findOne({ _id: petId });
  if (!pet) {
    response.status(404).json({ success: false, message: 'Pet not found.' });
    return;
  }

  const vetUser = await usersCollection.findOne({ _id: vetId });
  const clinicName = vetUser?.vetApplication?.clinicName || 'Veterinary Clinic';

  const now = new Date();
  const vaccineRecord = {
    petId,
    ownerId: pet.ownerId,
    vaccineName,
    dateAdministered,
    nextDueDate,
    batchNumber,
    clinicName,
    vetName: String(response.locals.userName || 'Veterinarian'),
    notes,
    isVetAuthored: true,
    vetId,
    createdAt: now,
    updatedAt: now,
  };

  const insertResult = await database.collection('vaccinations').insertOne(vaccineRecord);

  // Notify owner
  await createNotification({
    userId: pet.ownerId,
    type: 'vaccination_recorded',
    title: 'Vaccination Recorded 💉',
    message: `Dr. ${response.locals.userName} recorded ${vaccineName} for ${pet.name}.${nextDueDate ? ` Next due: ${nextDueDate}` : ''}`,
    data: {
      petId: pet._id!.toHexString(),
      vaccineName,
    },
  });

  response.status(201).json({
    success: true,
    vaccination: {
      id: insertResult.insertedId.toHexString(),
      petId: pet._id!.toHexString(),
      vaccineName,
      dateAdministered,
      nextDueDate,
      batchNumber,
      clinicName,
      vetName: String(response.locals.userName || 'Veterinarian'),
      notes,
      isVetAuthored: true,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
  });
});

export default vetDashboardRouter;
