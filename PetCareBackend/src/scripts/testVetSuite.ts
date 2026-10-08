import { createHash, randomBytes } from 'node:crypto';
import type { AddressInfo } from 'node:net';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import app from '../app.ts';
import { createUserIndexes } from '../models/user.ts';
import { initializeSessions } from '../routes/sessions.ts';
import { createPetIndexes } from '../models/pet.ts';
import { createAuditLogIndexes } from '../models/auditLog.ts';
import { createVetProfileIndexes } from '../models/vetProfile.ts';
import { createVetBookingIndexes } from '../models/vetBooking.ts';
import { createPetAccessGrantIndexes } from '../models/petAccessGrant.ts';
import { createConsultationIndexes } from '../models/consultation.ts';
import { createPrescriptionIndexes } from '../models/prescription.ts';
import { createNotificationIndexes } from '../models/notification.ts';
import { database, connectDatabase, disconnectDatabase } from '../database.ts';

const digest = (token: string): string =>
  createHash('sha256').update(token).digest('hex');

async function main() {
  console.log('====================================================');
  console.log('    JEEVA VET & CLINICAL FULL VERIFICATION SUITE    ');
  console.log('====================================================\n');

  await connectDatabase();
  await createUserIndexes();
  await initializeSessions();
  await createPetIndexes();
  await createAuditLogIndexes();
  await createVetProfileIndexes();
  await createVetBookingIndexes();
  await createPetAccessGrantIndexes();
  await createConsultationIndexes();
  await createPrescriptionIndexes();
  await createNotificationIndexes();

  const server = await new Promise<import('node:http').Server>((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const port = (server.address() as AddressInfo).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName}${detail ? ` (${detail})` : ''}`);
      failed++;
    }
  }

  const usersColl = database.collection('users');
  const sessionsColl = database.collection('sessions');
  const petsColl = database.collection('pets');
  const vetProfilesColl = database.collection('vetProfiles');
  const vetBookingsColl = database.collection('vetBookings');
  const petAccessGrantsColl = database.collection('petAccessGrants');
  const consultationsColl = database.collection('consultations');
  const prescriptionsColl = database.collection('prescriptions');
  const notificationsColl = database.collection('notifications');

  const testSuffix = randomBytes(4).toString('hex');

  // 1. Create Test Owner 1, Owner 2, and Vet 1, Vet 2
  const passwordHash = await bcrypt.hash('SecurePass123!', 10);
  const now = new Date();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const owner1User = {
    _id: new ObjectId(),
    name: `Owner One ${testSuffix}`,
    email: `owner1_${testSuffix}@example.com`,
    passwordHash,
    role: 'pet_owner' as const,
    createdAt: now,
    updatedAt: now,
  };
  const owner1Token = randomBytes(32).toString('hex');

  const owner2User = {
    _id: new ObjectId(),
    name: `Owner Two ${testSuffix}`,
    email: `owner2_${testSuffix}@example.com`,
    passwordHash,
    role: 'pet_owner' as const,
    createdAt: now,
    updatedAt: now,
  };
  const owner2Token = randomBytes(32).toString('hex');

  const vet1User = {
    _id: new ObjectId(),
    name: `Dr. Sarah Connor ${testSuffix}`,
    email: `vet1_${testSuffix}@example.com`,
    passwordHash,
    role: 'vet' as const,
    vetApplication: {
      qualifications: 'BVSc & AH, MVSc (Surgery)',
      registrationNumber: `VET-REG-${testSuffix}`,
      registrationCouncil: 'State Veterinary Council',
      clinicName: 'Paws & Care Specialty Hospital',
      clinicAddress: '123 Animal Welfare Ave, Sector 4',
      revision: 'rev-approved-1',
      status: 'approved' as const,
      submittedAt: now,
      reviewedAt: now,
      reviewedBy: new ObjectId(),
      reviewReason: 'Verified credentials',
    },
    createdAt: now,
    updatedAt: now,
  };
  const vet1Token = randomBytes(32).toString('hex');

  const vet2User = {
    _id: new ObjectId(),
    name: `Dr. John Doe ${testSuffix}`,
    email: `vet2_${testSuffix}@example.com`,
    passwordHash,
    role: 'vet' as const,
    vetApplication: {
      qualifications: 'BVSc',
      registrationNumber: `VET-REG-2-${testSuffix}`,
      registrationCouncil: 'State Veterinary Council',
      clinicName: 'City Pet Clinic',
      clinicAddress: '456 Main Rd',
      revision: 'rev-approved-2',
      status: 'approved' as const,
      submittedAt: now,
      reviewedAt: now,
      reviewedBy: new ObjectId(),
      reviewReason: 'Verified',
    },
    createdAt: now,
    updatedAt: now,
  };
  const vet2Token = randomBytes(32).toString('hex');

  await usersColl.insertMany([owner1User, owner2User, vet1User, vet2User]);
  await sessionsColl.insertMany([
    { tokenHash: digest(owner1Token), userId: owner1User._id, expiresAt },
    { tokenHash: digest(owner2Token), userId: owner2User._id, expiresAt },
    { tokenHash: digest(vet1Token), userId: vet1User._id, expiresAt },
    { tokenHash: digest(vet2Token), userId: vet2User._id, expiresAt },
  ]);

  // Create pet for Owner 1
  const pet1 = {
    _id: new ObjectId(),
    name: `Max ${testSuffix}`,
    species: 'dog' as const,
    sex: 'male' as const,
    breed: 'Golden Retriever',
    notes: 'Friendly, allergic to pollen',
    ownerId: owner1User._id,
    createdAt: now,
    updatedAt: now,
  };
  const pet2 = {
    _id: new ObjectId(),
    name: `Bella ${testSuffix}`,
    species: 'cat' as const,
    sex: 'female' as const,
    breed: 'Persian',
    notes: 'Indoor cat',
    ownerId: owner2User._id,
    createdAt: now,
    updatedAt: now,
  };
  await petsColl.insertMany([pet1, pet2]);

  try {
    console.log('[1. SECURITY & ACCESS CONTROL]');
    // Test 1: Unauthenticated request to /api/vet/profile
    const res1 = await fetch(`${baseUrl}/api/vet/profile`);
    assert(res1.status === 401, 'Unauthenticated request to /api/vet/profile returns 401');

    // Test 2: Pet Owner token to /api/vet/profile returns 403
    const res2 = await fetch(`${baseUrl}/api/vet/profile`, {
      headers: { Authorization: `Bearer ${owner1Token}` },
    });
    assert(res2.status === 403, 'Pet Owner token on /api/vet/profile returns 403 Forbidden');

    // Test 3: Vet token to /api/vet/profile returns 200
    const res3 = await fetch(`${baseUrl}/api/vet/profile`, {
      headers: { Authorization: `Bearer ${vet1Token}` },
    });
    const data3 = await res3.json();
    assert(
      res3.status === 200 && data3.success === true && data3.profile.displayName === vet1User.name,
      'Vet gets profile with verified application details',
    );

    console.log('\n[2. VET PROFILE & AVAILABILITY CONFIGURATION]');
    // Test 4: Vet updates profile (bio, services, consultationFee)
    const res4 = await fetch(`${baseUrl}/api/vet/profile`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${vet1Token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        displayName: 'Dr. Sarah Connor, Chief Surgeon',
        bio: 'Over 10 years of experience in small animal soft tissue surgery.',
        clinicPhone: '+91 9876543210',
        clinicEmail: 'info@pawsandcare.com',
        consultationFee: 750,
        services: [
          { id: '1', name: 'General Consultation', fee: 750 },
          { id: '2', name: 'Dental Cleaning', fee: 1500 },
        ],
      }),
    });
    const data4 = await res4.json();
    assert(
      res4.status === 200 &&
        data4.profile.consultationFee === 750 &&
        data4.profile.services.length === 2 &&
        data4.profile.clinicPhone === '+91 9876543210',
      'Vet updates operational clinic profile and services',
    );

    // Test 5: Vet updates availability schedule
    const res5 = await fetch(`${baseUrl}/api/vet/availability`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${vet1Token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        isOpen: true,
        slotDurationMinutes: 30,
        workingDays: [1, 2, 3, 4, 5], // Mon-Fri
        workingHours: { start: '10:00', end: '16:00' },
        breaks: [{ start: '13:00', end: '14:00', label: 'Lunch' }],
        unavailableDates: ['2026-12-25'],
      }),
    });
    const data5 = await res5.json();
    assert(
      res5.status === 200 &&
        data5.availability.workingHours.start === '10:00' &&
        data5.availability.breaks.length === 1,
      'Vet updates working hours, slot duration, breaks and unavailable dates',
    );

    console.log('\n[3. TIME SLOTS & AVAILABILITY GENERATION]');
    // Next Monday in future
    const futureMonday = new Date();
    futureMonday.setDate(futureMonday.getDate() + ((1 + 7 - futureMonday.getDay()) % 7 || 7) + 7);
    const mondayStr = futureMonday.toISOString().slice(0, 10);

    const res6 = await fetch(
      `${baseUrl}/api/vets/${vet1User._id.toHexString()}/slots?date=${mondayStr}`,
      { headers: { Authorization: `Bearer ${owner1Token}` } },
    );
    const data6 = await res6.json();
    const hasLunchSlot = data6.slots.some((s: any) => s.time === '13:00' || s.time === '13:30');
    const has10amSlot = data6.slots.some((s: any) => s.time === '10:00' && s.available === true);
    assert(
      res6.status === 200 && has10amSlot && !hasLunchSlot,
      'Slot generator provides available slots and correctly excludes clinic breaks',
    );

    // Test 7: Booking on an unavailable date returns unavailable
    const res7 = await fetch(
      `${baseUrl}/api/vets/${vet1User._id.toHexString()}/slots?date=2026-12-25`,
      { headers: { Authorization: `Bearer ${owner1Token}` } },
    );
    const data7 = await res7.json();
    assert(
      res7.status === 200 && data7.slots.length === 0 && data7.message.includes('unavailable'),
      'Unavailable date correctly yields zero slots',
    );

    console.log('\n[4. OWNER-TO-VET BOOKING & CONFLICT PREVENTION]');
    // Test 8: Owner 1 books slot for Max with Dr. Sarah Connor on mondayStr at 10:00
    const res8 = await fetch(`${baseUrl}/api/vet-bookings`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${owner1Token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vetId: vet1User._id.toHexString(),
        petId: pet1._id.toHexString(),
        date: mondayStr,
        time: '10:00',
        reason: 'Annual health check and limping evaluation',
        notes: 'Max had a mild limp after running yesterday.',
        shareMedicalHistory: true,
      }),
    });
    const data8 = await res8.json();
    const booking1Id = data8.booking?.id;
    assert(
      res8.status === 201 && data8.booking.status === 'pending' && data8.booking.shareMedicalHistory === true,
      'Owner creates vet booking request with medical history sharing',
    );

    // Test 9: Concurrent/Duplicate booking on the EXACT same slot is rejected with 409
    const res9 = await fetch(`${baseUrl}/api/vet-bookings`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${owner2Token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vetId: vet1User._id.toHexString(),
        petId: pet2._id.toHexString(),
        date: mondayStr,
        time: '10:00',
        reason: 'Vaccination visit',
      }),
    });
    assert(res9.status === 409, 'Double-booking prevention: Conflicting slot request rejected with 409 Conflict');

    // Test 10: Slot generator now marks 10:00 as already booked
    const res10 = await fetch(
      `${baseUrl}/api/vets/${vet1User._id.toHexString()}/slots?date=${mondayStr}`,
      { headers: { Authorization: `Bearer ${owner1Token}` } },
    );
    const data10 = await res10.json();
    const slot10am = data10.slots.find((s: any) => s.time === '10:00');
    assert(
      slot10am && slot10am.available === false && slot10am.reason === 'Already booked',
      'Slot endpoint dynamically updates to reflect booked time slot',
    );

    console.log('\n[5. VET APPOINTMENT MANAGEMENT]');
    // Test 11: Vet lists pending bookings
    const res11 = await fetch(`${baseUrl}/api/vet/bookings?status=pending`, {
      headers: { Authorization: `Bearer ${vet1Token}` },
    });
    const data11 = await res11.json();
    assert(
      res11.status === 200 && data11.bookings.some((b: any) => b.id === booking1Id),
      'Vet retrieves pending appointment requests',
    );

    // Test 12: Vet confirms booking
    const res12 = await fetch(`${baseUrl}/api/vet/bookings/${booking1Id}/accept`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${vet1Token}` },
    });
    const data12 = await res12.json();
    assert(res12.status === 200 && data12.success === true, 'Vet accepts and confirms appointment request');

    // Test 13: Owner receives confirmation notification
    const res13 = await fetch(`${baseUrl}/api/notifications`, {
      headers: { Authorization: `Bearer ${owner1Token}` },
    });
    const data13 = await res13.json();
    assert(
      res13.status === 200 && data13.notifications.some((n: any) => n.type === 'booking_confirmed'),
      'Owner receives persisted in-app notification upon booking confirmation',
    );

    // Test 14: Vet proposes reschedule
    const nextSlot = '11:00';
    const res14 = await fetch(`${baseUrl}/api/vet/bookings/${booking1Id}/propose-reschedule`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${vet1Token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        proposedDate: mondayStr,
        proposedTime: nextSlot,
        reason: 'Surgery schedule adjustment',
      }),
    });
    assert(res14.status === 200, 'Vet proposes rescheduling with reason');

    // Test 15: Owner accepts reschedule proposal
    const res15 = await fetch(`${baseUrl}/api/vet-bookings/${booking1Id}/respond-reschedule`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${owner1Token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ decision: 'accept' }),
    });
    const bookingAfterReschedule = await vetBookingsColl.findOne({ _id: new ObjectId(booking1Id) });
    assert(
      res15.status === 200 && bookingAfterReschedule?.time === nextSlot,
      'Owner accepts reschedule proposal and booking slot atomically updates',
    );

    console.log('\n[6. PERMISSION-BASED PATIENT RECORD SHARING & ACCESS]');
    // Test 16: Vet 1 views patient list and patient detail
    const res16 = await fetch(`${baseUrl}/api/vet/patients`, {
      headers: { Authorization: `Bearer ${vet1Token}` },
    });
    const data16 = await res16.json();
    assert(
      res16.status === 200 && data16.patients.some((p: any) => p.petId === pet1._id.toHexString()),
      'Vet retrieves patient list from active bookings and grants',
    );

    // Test 17: Vet 1 accesses patient history because sharing was granted
    const res17 = await fetch(`${baseUrl}/api/vet/patients/${pet1._id.toHexString()}/history`, {
      headers: { Authorization: `Bearer ${vet1Token}` },
    });
    const data17 = await res17.json();
    assert(
      res17.status === 200 && data17.history !== undefined,
      'Vet accesses patient history when active medical sharing permission exists',
    );

    // Test 18: Vet 2 (unrelated vet without sharing or booking) accessing history returns 403 Forbidden
    const res18 = await fetch(`${baseUrl}/api/vet/patients/${pet1._id.toHexString()}/history`, {
      headers: { Authorization: `Bearer ${vet2Token}` },
    });
    assert(res18.status === 403, 'Unauthorized Vet is rejected with 403 Forbidden when accessing unshared pet');

    // Test 19: Owner explicitly revokes sharing access for Vet 1
    const res19 = await fetch(
      `${baseUrl}/api/pets/${pet1._id.toHexString()}/sharing/${vet1User._id.toHexString()}/revoke`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${owner1Token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: 'Visit completed' }),
      },
    );
    assert(res19.status === 200, 'Owner revokes medical record access for Vet');

    // Update booking sharing flag to false to test strict revoked state
    await vetBookingsColl.updateOne({ _id: new ObjectId(booking1Id) }, { $set: { shareMedicalHistory: false } });

    // Test 20: Vet 1 accessing history after revocation is now blocked with 403
    const res20 = await fetch(`${baseUrl}/api/vet/patients/${pet1._id.toHexString()}/history`, {
      headers: { Authorization: `Bearer ${vet1Token}` },
    });
    assert(res20.status === 403, 'Access to historical records is immediately blocked after permission is revoked');

    console.log('\n[7. VET-AUTHORED CONSULTATIONS, PRESCRIPTIONS & VACCINATIONS]');
    // Test 21: Vet records finalized consultation with diagnosis and treatment plan
    const res21 = await fetch(`${baseUrl}/api/vet/consultations`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${vet1Token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bookingId: booking1Id,
        petId: pet1._id.toHexString(),
        visitDate: mondayStr,
        symptoms: 'Mild left foreleg limping',
        examinationNotes: 'Slight joint swelling observed, no fractures detected on palpation.',
        diagnosis: 'Mild soft tissue sprain',
        treatmentPlan: 'Rest for 5 days, NSAID anti-inflammatory medication, cold compress.',
        followUpDate: '2026-11-01',
        followUpInstructions: 'Return if limping persists past 7 days.',
        status: 'finalized',
      }),
    });
    const data21 = await res21.json();
    const consultationId = data21.consultation?.id;
    assert(
      res21.status === 201 && data21.consultation.diagnosis === 'Mild soft tissue sprain',
      'Vet authors and finalizes consultation record',
    );

    // Test 22: Finalized consultation preserves audit integrity: Requires amendment note
    const res22 = await fetch(`${baseUrl}/api/vet/consultations/${consultationId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${vet1Token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amendmentNote: 'Owner reported Max is resting comfortably on day 2.',
      }),
    });
    const data22 = await res22.json();
    assert(
      res22.status === 200 && data22.consultation.amendments.length === 1,
      'Finalized consultation enforces amendment audit trail rather than silent overwrite',
    );

    // Test 23: Vet writes prescription record
    const res23 = await fetch(`${baseUrl}/api/vet/prescriptions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${vet1Token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        consultationId,
        petId: pet1._id.toHexString(),
        medicineName: 'Meloxicam Oral Suspension',
        dosage: '0.1 mg/kg once daily with food',
        route: 'Oral',
        frequency: 'Once daily',
        startDate: mondayStr,
        endDate: '2026-11-05',
        instructions: 'Give with or right after food. Do not exceed prescribed dose.',
      }),
    });
    const data23 = await res23.json();
    assert(
      res23.status === 201 && data23.prescription.medicineName === 'Meloxicam Oral Suspension',
      'Vet writes prescription with explicit dosage, route and instructions',
    );

    // Test 24: Vet records administered vaccination
    const res24 = await fetch(`${baseUrl}/api/vet/vaccinations`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${vet1Token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        petId: pet1._id.toHexString(),
        vaccineName: 'DHPP (Distemper / Parvo) Booster',
        dateAdministered: mondayStr,
        nextDueDate: '2027-10-15',
        batchNumber: `DHPP-BATCH-${testSuffix}`,
        notes: 'Subcutaneous injection, tolerated well with no immediate reaction.',
      }),
    });
    assert(res24.status === 201, 'Vet records vaccination with batch number and next due date');

    // Test 25: Owner views Vet consultations & prescriptions on their pet profile
    const res25 = await fetch(`${baseUrl}/api/pets/${pet1._id.toHexString()}/consultations`, {
      headers: { Authorization: `Bearer ${owner1Token}` },
    });
    const data25 = await res25.json();
    assert(
      res25.status === 200 && data25.consultations.length >= 1,
      'Owner can view Vet-authored clinical consultations on their pet profile',
    );

  } finally {
    // Cleanup test records
    await usersColl.deleteMany({ _id: { $in: [owner1User._id, owner2User._id, vet1User._id, vet2User._id] } });
    await sessionsColl.deleteMany({
      tokenHash: {
        $in: [digest(owner1Token), digest(owner2Token), digest(vet1Token), digest(vet2Token)],
      },
    });
    await petsColl.deleteMany({ _id: { $in: [pet1._id, pet2._id] } });
    await vetProfilesColl.deleteMany({ vetId: { $in: [vet1User._id, vet2User._id] } });
    await vetBookingsColl.deleteMany({ vetId: { $in: [vet1User._id, vet2User._id] } });
    await petAccessGrantsColl.deleteMany({ petId: pet1._id });
    await consultationsColl.deleteMany({ vetId: { $in: [vet1User._id, vet2User._id] } });
    await prescriptionsColl.deleteMany({ vetId: { $in: [vet1User._id, vet2User._id] } });
    await notificationsColl.deleteMany({
      userId: { $in: [owner1User._id, owner2User._id, vet1User._id, vet2User._id] },
    });

    server.close();
    await disconnectDatabase();
  }

  console.log('\n====================================================');
  console.log(`  TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

void main();
