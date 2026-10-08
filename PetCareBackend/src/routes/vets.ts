import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { database } from '../database.ts';
import { usersCollection } from '../models/user.ts';
import {
  vetProfilesCollection,
  defaultAvailability,
  publicVetProfile,
  type VetProfileDocument,
} from '../models/vetProfile.ts';
import { vetBookingsCollection } from '../models/vetBooking.ts';
import { requireSession } from '../middleware/requireSession.ts';

const vetsRouter = Router();

vetsRouter.use(requireSession);

// List all approved, non-suspended Vets for Pet Owners
vetsRouter.get('/', async (request, response) => {
  const query = String(request.query.q || '').trim().toLowerCase();

  const approvedVets = await usersCollection
    .find({
      role: 'vet',
      isSuspended: { $ne: true },
      'vetApplication.status': 'approved',
    })
    .project({
      _id: 1,
      name: 1,
      email: 1,
      vetApplication: 1,
    })
    .toArray();

  const vetIds = approvedVets.map((v) => v._id!);
  const profiles = await vetProfilesCollection
    .find({ vetId: { $in: vetIds } })
    .toArray();

  const profileMap = new Map<string, VetProfileDocument>();
  for (const p of profiles) {
    profileMap.set(p.vetId.toHexString(), p);
  }

  const results = approvedVets
    .map((vet) => {
      const vid = vet._id!.toHexString();
      const existingProfile = profileMap.get(vid);

      const clinicName = vet.vetApplication?.clinicName || 'Veterinary Clinic';
      const clinicAddress = vet.vetApplication?.clinicAddress || '';
      const qualifications = vet.vetApplication?.qualifications || '';
      const registrationNumber = vet.vetApplication?.registrationNumber || '';
      const registrationCouncil = vet.vetApplication?.registrationCouncil || '';

      const effectiveProfile: VetProfileDocument = existingProfile || {
        vetId: vet._id!,
        displayName: vet.name,
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

      return {
        vetId: vid,
        name: vet.name,
        displayName: effectiveProfile.displayName || vet.name,
        bio: effectiveProfile.bio,
        clinicName,
        clinicAddress: effectiveProfile.clinicAddress || clinicAddress,
        clinicPhone: effectiveProfile.clinicPhone,
        clinicEmail: effectiveProfile.clinicEmail,
        services: effectiveProfile.services || [],
        consultationFee: effectiveProfile.consultationFee,
        timeZone: effectiveProfile.timeZone || 'Asia/Kolkata',
        isOpen: effectiveProfile.availability?.isOpen ?? true,
        verifiedCredentials: {
          qualifications,
          registrationNumber,
          registrationCouncil,
          clinicName,
        },
      };
    })
    .filter((vet) => {
      if (!query) return true;
      const haystack = `${vet.name} ${vet.displayName} ${vet.clinicName} ${vet.clinicAddress} ${vet.services.map((s) => s.name).join(' ')}`.toLowerCase();
      return haystack.includes(query);
    });

  response.json({
    success: true,
    vets: results,
  });
});

// Get a specific Vet's public profile
vetsRouter.get('/:vetId', async (request, response) => {
  const vetIdStr = String(request.params.vetId);
  if (!/^[a-f0-9]{24}$/i.test(vetIdStr)) {
    response.status(400).json({ success: false, message: 'Invalid vet ID.' });
    return;
  }

  const vetUser = await usersCollection.findOne({
    _id: new ObjectId(vetIdStr),
    role: 'vet',
    isSuspended: { $ne: true },
  });

  if (!vetUser) {
    response.status(404).json({ success: false, message: 'Vet not found or inactive.' });
    return;
  }

  let profile = await vetProfilesCollection.findOne({ vetId: vetUser._id! });
  if (!profile) {
    const clinicAddress = vetUser.vetApplication?.clinicAddress || '';
    profile = {
      _id: new ObjectId(),
      vetId: vetUser._id!,
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
    vet: publicVetProfile(profile, verifiedCredentials),
  });
});

// Calculate available time slots for a given date
vetsRouter.get('/:vetId/slots', async (request, response) => {
  const vetIdStr = String(request.params.vetId);
  const dateStr = String(request.query.date || '').trim();

  if (!/^[a-f0-9]{24}$/i.test(vetIdStr)) {
    response.status(400).json({ success: false, message: 'Invalid vet ID.' });
    return;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    response.status(400).json({ success: false, message: 'Provide date in YYYY-MM-DD format.' });
    return;
  }

  const vetUser = await usersCollection.findOne({
    _id: new ObjectId(vetIdStr),
    role: 'vet',
    isSuspended: { $ne: true },
  });

  if (!vetUser) {
    response.status(404).json({ success: false, message: 'Vet not found or inactive.' });
    return;
  }

  const profile = await vetProfilesCollection.findOne({ vetId: vetUser._id! });
  const availability = profile?.availability || defaultAvailability;

  if (!availability.isOpen) {
    response.json({
      success: true,
      isOpen: false,
      message: 'This clinic is currently not accepting new bookings.',
      slots: [],
    });
    return;
  }

  // Check if date is in the past (using date comparison in UTC / clinic local date)
  const targetDate = new Date(`${dateStr}T00:00:00.000Z`);
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  if (dateStr < todayStr) {
    response.json({
      success: true,
      isOpen: true,
      message: 'Cannot book appointments in the past.',
      slots: [],
    });
    return;
  }

  // Check unavailable dates
  if (availability.unavailableDates && availability.unavailableDates.includes(dateStr)) {
    response.json({
      success: true,
      isOpen: true,
      message: 'The vet is unavailable on this date.',
      slots: [],
    });
    return;
  }

  // Check day of week (0=Sunday, 1=Monday, ..., 6=Saturday)
  const dayOfWeek = targetDate.getUTCDay();
  const workingDays = availability.workingDays || [1, 2, 3, 4, 5];

  if (!workingDays.includes(dayOfWeek)) {
    response.json({
      success: true,
      isOpen: true,
      message: 'The clinic is closed on this day of the week.',
      slots: [],
    });
    return;
  }

  // Generate slots from workingHours
  const startHourMin = availability.workingHours?.start || '09:00';
  const endHourMin = availability.workingHours?.end || '17:00';
  const duration = Math.max(15, Math.min(120, availability.slotDurationMinutes || 30));

  const [startH, startM] = startHourMin.split(':').map(Number);
  const [endH, endM] = endHourMin.split(':').map(Number);

  const startMinutes = (startH || 9) * 60 + (startM || 0);
  const endMinutes = (endH || 17) * 60 + (endM || 0);

  const breaks = availability.breaks || [];

  function isTimeInBreak(timeMin: number): boolean {
    for (const b of breaks) {
      const [bStartH, bStartM] = b.start.split(':').map(Number);
      const [bEndH, bEndM] = b.end.split(':').map(Number);
      const bStart = (bStartH || 0) * 60 + (bStartM || 0);
      const bEnd = (bEndH || 0) * 60 + (bEndM || 0);
      if (timeMin >= bStart && timeMin < bEnd) {
        return true;
      }
    }
    return false;
  }

  // Fetch all existing booked slots for this vet on this date (status: pending or confirmed)
  const existingBookings = await vetBookingsCollection
    .find({
      vetId: vetUser._id!,
      date: dateStr,
      status: { $in: ['pending', 'confirmed'] },
    })
    .project({ time: 1, durationMinutes: 1 })
    .toArray();

  const bookedTimes = new Set(existingBookings.map((b) => b.time));

  // Determine current time cutoff if date is today
  let currentMinutesToday = -1;
  if (dateStr === todayStr) {
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    currentMinutesToday = currentHour * 60 + currentMin;
  }

  const slots: Array<{
    time: string;
    available: boolean;
    reason?: string;
  }> = [];

  for (let m = startMinutes; m + duration <= endMinutes; m += duration) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    const timeFormatted = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;

    if (isTimeInBreak(m)) {
      // Slot falls during clinic break
      continue;
    }

    if (currentMinutesToday >= 0 && m <= currentMinutesToday) {
      slots.push({
        time: timeFormatted,
        available: false,
        reason: 'Time passed',
      });
    } else if (bookedTimes.has(timeFormatted)) {
      slots.push({
        time: timeFormatted,
        available: false,
        reason: 'Already booked',
      });
    } else {
      slots.push({
        time: timeFormatted,
        available: true,
      });
    }
  }

  response.json({
    success: true,
    isOpen: true,
    date: dateStr,
    slotDurationMinutes: duration,
    timeZone: profile?.timeZone || 'Asia/Kolkata',
    slots,
  });
});

export default vetsRouter;
