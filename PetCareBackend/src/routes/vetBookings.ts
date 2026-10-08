import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { database } from '../database.ts';
import { usersCollection } from '../models/user.ts';
import { petsCollection } from '../models/pet.ts';
import {
  vetProfilesCollection,
  defaultAvailability,
} from '../models/vetProfile.ts';
import {
  vetBookingsCollection,
  publicVetBooking,
  type VetBookingDocument,
} from '../models/vetBooking.ts';
import {
  petAccessGrantsCollection,
} from '../models/petAccessGrant.ts';
import { createNotification } from '../models/notification.ts';
import { requireSession } from '../middleware/requireSession.ts';
import { recordAuditLog } from '../models/auditLog.ts';

const vetBookingsRouter = Router();

vetBookingsRouter.use(requireSession);

// Create a Vet booking request by Pet Owner
vetBookingsRouter.post('/', async (request, response) => {
  const body: unknown = request.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    response.status(400).json({ success: false, message: 'Provide booking details.' });
    return;
  }

  const input = body as Record<string, unknown>;

  const vetIdStr = String(input.vetId || '').trim();
  const petIdStr = String(input.petId || '').trim();
  const dateStr = String(input.date || '').trim();
  const timeStr = String(input.time || '').trim();
  const reasonStr = String(input.reason || '').trim();
  const notesStr = String(input.notes || '').trim();
  const shareHistory = Boolean(input.shareMedicalHistory);

  if (!/^[a-f0-9]{24}$/i.test(vetIdStr)) {
    response.status(400).json({ success: false, message: 'Invalid vet ID.' });
    return;
  }
  if (!/^[a-f0-9]{24}$/i.test(petIdStr)) {
    response.status(400).json({ success: false, message: 'Invalid pet ID.' });
    return;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    response.status(400).json({ success: false, message: 'Enter a valid date (YYYY-MM-DD).' });
    return;
  }
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(timeStr)) {
    response.status(400).json({ success: false, message: 'Enter a valid time in HH:mm format.' });
    return;
  }
  if (reasonStr.length < 2 || reasonStr.length > 300) {
    response.status(400).json({ success: false, message: 'Reason must contain 2 to 300 characters.' });
    return;
  }
  if (notesStr.length > 1000) {
    response.status(400).json({ success: false, message: 'Notes must not exceed 1000 characters.' });
    return;
  }

  // Validate Owner's Pet
  const pet = await petsCollection.findOne({
    _id: new ObjectId(petIdStr),
    ownerId: response.locals.userId as ObjectId,
  });

  if (!pet) {
    response.status(404).json({ success: false, message: 'Pet not found or not owned by you.' });
    return;
  }

  // Validate Vet
  const vetUser = await usersCollection.findOne({
    _id: new ObjectId(vetIdStr),
    role: 'vet',
    isSuspended: { $ne: true },
  });

  if (!vetUser) {
    response.status(404).json({ success: false, message: 'Vet not found or inactive.' });
    return;
  }

  // Check Availability
  const vetProfile = await vetProfilesCollection.findOne({ vetId: vetUser._id! });
  const availability = vetProfile?.availability || defaultAvailability;

  if (!availability.isOpen) {
    response.status(400).json({ success: false, message: 'The vet is currently not accepting new bookings.' });
    return;
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  if (dateStr < todayStr) {
    response.status(400).json({ success: false, message: 'Cannot book appointments in the past.' });
    return;
  }

  if (availability.unavailableDates?.includes(dateStr)) {
    response.status(400).json({ success: false, message: 'The vet is unavailable on this date.' });
    return;
  }

  const targetDate = new Date(`${dateStr}T00:00:00.000Z`);
  const dayOfWeek = targetDate.getUTCDay();
  if (!availability.workingDays.includes(dayOfWeek)) {
    response.status(400).json({ success: false, message: 'The clinic is closed on this day of the week.' });
    return;
  }

  // Atomic conflict check: prevent double booking the same vet, date, time
  const existingConflict = await vetBookingsCollection.findOne({
    vetId: vetUser._id!,
    date: dateStr,
    time: timeStr,
    status: { $in: ['pending', 'confirmed'] },
  });

  if (existingConflict) {
    response.status(409).json({
      success: false,
      message: 'This time slot was just booked by another user. Please choose another time slot.',
    });
    return;
  }

  const now = new Date();
  const bookingNumber = `VB-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`;

  const clinicName = vetUser.vetApplication?.clinicName || 'Veterinary Clinic';
  const duration = availability.slotDurationMinutes || 30;

  const newBooking: VetBookingDocument = {
    bookingNumber,
    ownerId: response.locals.userId as ObjectId,
    ownerName: String(response.locals.userName || 'Pet Owner'),
    ownerEmail: String(response.locals.userEmail || ''),
    vetId: vetUser._id!,
    vetName: vetUser.name,
    clinicName,
    petId: pet._id!,
    petName: pet.name,
    petSpecies: pet.species,
    petBreed: pet.breed || '',
    date: dateStr,
    time: timeStr,
    durationMinutes: duration,
    reason: reasonStr,
    notes: notesStr,
    status: 'pending',
    shareMedicalHistory: shareHistory,
    createdAt: now,
    updatedAt: now,
  };

  const insertResult = await vetBookingsCollection.insertOne(newBooking);

  // If owner opted to share medical history, create/update petAccessGrant
  if (shareHistory) {
    await petAccessGrantsCollection.updateOne(
      {
        petId: pet._id!,
        vetId: vetUser._id!,
      },
      {
        $set: {
          ownerId: response.locals.userId as ObjectId,
          scope: 'full_history',
          status: 'active',
          grantedAt: now,
          updatedAt: now,
        },
      },
      { upsert: true },
    );
  }

  // Create notification for Vet
  await createNotification({
    userId: vetUser._id!,
    type: 'booking_request',
    title: 'New Appointment Request',
    message: `${response.locals.userName} requested an appointment for ${pet.name} on ${dateStr} at ${timeStr}.`,
    data: {
      bookingId: insertResult.insertedId.toHexString(),
      bookingNumber,
      petId: pet._id!.toHexString(),
      petName: pet.name,
    },
  });

  response.status(201).json({
    success: true,
    booking: publicVetBooking({ ...newBooking, _id: insertResult.insertedId }),
  });
});

// List bookings for current Pet Owner
vetBookingsRouter.get('/', async (_request, response) => {
  const records = await vetBookingsCollection
    .find({ ownerId: response.locals.userId as ObjectId })
    .sort({ date: -1, time: -1, _id: -1 })
    .toArray();

  response.json({
    success: true,
    bookings: records.map(publicVetBooking),
  });
});

// Get a single booking detail
vetBookingsRouter.get('/:bookingId', async (request, response) => {
  const bookingIdStr = String(request.params.bookingId);
  if (!/^[a-f0-9]{24}$/i.test(bookingIdStr)) {
    response.status(400).json({ success: false, message: 'Invalid booking ID.' });
    return;
  }

  const booking = await vetBookingsCollection.findOne({
    _id: new ObjectId(bookingIdStr),
    $or: [
      { ownerId: response.locals.userId as ObjectId },
      { vetId: response.locals.userId as ObjectId },
    ],
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

// Owner cancels booking
vetBookingsRouter.post('/:bookingId/cancel', async (request, response) => {
  const bookingIdStr = String(request.params.bookingId);
  if (!/^[a-f0-9]{24}$/i.test(bookingIdStr)) {
    response.status(400).json({ success: false, message: 'Invalid booking ID.' });
    return;
  }

  const reason = String(request.body?.reason || 'Cancelled by owner').trim();

  const booking = await vetBookingsCollection.findOne({
    _id: new ObjectId(bookingIdStr),
    ownerId: response.locals.userId as ObjectId,
  });

  if (!booking) {
    response.status(404).json({ success: false, message: 'Booking not found.' });
    return;
  }

  if (booking.status === 'completed' || booking.status === 'cancelled') {
    response.status(400).json({
      success: false,
      message: `Cannot cancel a booking that is already ${booking.status}.`,
    });
    return;
  }

  const now = new Date();
  const result = await vetBookingsCollection.updateOne(
    {
      _id: new ObjectId(bookingIdStr),
      ownerId: response.locals.userId as ObjectId,
      status: { $in: ['pending', 'confirmed'] },
    },
    {
      $set: {
        status: 'cancelled',
        cancelledBy: 'owner',
        cancellationReason: reason,
        updatedAt: now,
      },
    },
  );

  if (result.modifiedCount !== 1) {
    response.status(409).json({ success: false, message: 'Booking status has already changed.' });
    return;
  }

  // Notify the Vet
  await createNotification({
    userId: booking.vetId,
    type: 'booking_cancelled',
    title: 'Appointment Cancelled',
    message: `${booking.ownerName} cancelled the appointment for ${booking.petName} scheduled on ${booking.date} at ${booking.time}.`,
    data: {
      bookingId: booking._id!.toHexString(),
      bookingNumber: booking.bookingNumber,
    },
  });

  response.json({ success: true, message: 'Appointment cancelled.' });
});

// Owner responds to reschedule proposal (accept or decline)
vetBookingsRouter.post('/:bookingId/respond-reschedule', async (request, response) => {
  const bookingIdStr = String(request.params.bookingId);
  if (!/^[a-f0-9]{24}$/i.test(bookingIdStr)) {
    response.status(400).json({ success: false, message: 'Invalid booking ID.' });
    return;
  }

  const decision = String(request.body?.decision || '').trim(); // 'accept' or 'decline'
  if (decision !== 'accept' && decision !== 'decline') {
    response.status(400).json({ success: false, message: 'Decision must be "accept" or "decline".' });
    return;
  }

  const booking = await vetBookingsCollection.findOne({
    _id: new ObjectId(bookingIdStr),
    ownerId: response.locals.userId as ObjectId,
  });

  if (!booking || !booking.rescheduleProposal || booking.rescheduleProposal.status !== 'pending') {
    response.status(400).json({
      success: false,
      message: 'No pending reschedule proposal found for this booking.',
    });
    return;
  }

  const proposal = booking.rescheduleProposal;
  const now = new Date();

  if (decision === 'accept') {
    // Check if the proposed slot is still free
    const conflict = await vetBookingsCollection.findOne({
      vetId: booking.vetId,
      date: proposal.proposedDate,
      time: proposal.proposedTime,
      _id: { $ne: booking._id },
      status: { $in: ['pending', 'confirmed'] },
    });

    if (conflict) {
      response.status(409).json({
        success: false,
        message: 'The proposed slot is no longer available. Please cancel or request another time.',
      });
      return;
    }

    await vetBookingsCollection.updateOne(
      { _id: booking._id },
      {
        $set: {
          date: proposal.proposedDate,
          time: proposal.proposedTime,
          status: 'confirmed',
          'rescheduleProposal.status': 'accepted',
          'rescheduleProposal.respondedAt': now,
          updatedAt: now,
        },
      },
    );

    // Notify the Vet
    await createNotification({
      userId: booking.vetId,
      type: 'reschedule_accepted',
      title: 'Reschedule Accepted',
      message: `${booking.ownerName} accepted the rescheduled time for ${booking.petName} on ${proposal.proposedDate} at ${proposal.proposedTime}.`,
      data: {
        bookingId: booking._id!.toHexString(),
        bookingNumber: booking.bookingNumber,
      },
    });

    response.json({ success: true, message: 'Reschedule accepted and booking updated.' });
  } else {
    // Decline
    await vetBookingsCollection.updateOne(
      { _id: booking._id },
      {
        $set: {
          'rescheduleProposal.status': 'declined',
          'rescheduleProposal.respondedAt': now,
          updatedAt: now,
        },
      },
    );

    // Notify the Vet
    await createNotification({
      userId: booking.vetId,
      type: 'reschedule_declined',
      title: 'Reschedule Declined',
      message: `${booking.ownerName} declined the reschedule proposal for ${booking.petName}.`,
      data: {
        bookingId: booking._id!.toHexString(),
        bookingNumber: booking.bookingNumber,
      },
    });

    response.json({ success: true, message: 'Reschedule declined.' });
  }
});

export default vetBookingsRouter;
