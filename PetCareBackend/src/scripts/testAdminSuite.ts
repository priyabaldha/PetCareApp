import { createHash, randomBytes } from 'node:crypto';
import type { AddressInfo } from 'node:net';
import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import app from '../app.ts';
import { createUserIndexes } from '../models/user.ts';
import { initializeSessions } from '../routes/sessions.ts';
import { createPetIndexes } from '../models/pet.ts';
import { createAuditLogIndexes } from '../models/auditLog.ts';
import { createGuideIndexes, initializeGuides } from '../models/guide.ts';
import { createAnnouncementIndexes } from '../models/announcement.ts';
import { database, connectDatabase, disconnectDatabase } from '../database.ts';

const digest = (token: string): string =>
  createHash('sha256').update(token).digest('hex');

async function main() {
  console.log('====================================================');
  console.log('  JEEVA ADMIN & GOVERNANCE FULL VERIFICATION SUITE  ');
  console.log('====================================================\n');

  await connectDatabase();
  await createUserIndexes();
  await initializeSessions();
  await createPetIndexes();
  await createAuditLogIndexes();
  await createGuideIndexes();
  await initializeGuides();
  await createAnnouncementIndexes();

  // Start temporary test server
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
  const auditLogsColl = database.collection('auditLogs');
  const guidesColl = database.collection('guides');
  const announcementsColl = database.collection('announcements');

  const testSuffix = randomBytes(4).toString('hex');

  // Create Test Admin, Vet and Pet Owner
  const passwordHash = await bcrypt.hash('TestPassword123!', 10);
  const now = new Date();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const adminUser = {
    name: `Test Admin ${testSuffix}`,
    email: `admin_${testSuffix}@jeeva.test`,
    passwordHash,
    role: 'admin' as const,
    createdAt: now,
    updatedAt: now,
  };
  const adminInsert = await usersColl.insertOne(adminUser);
  const adminToken = randomBytes(32).toString('hex');
  await sessionsColl.insertOne({
    tokenHash: digest(adminToken),
    userId: adminInsert.insertedId,
    createdAt: now,
    expiresAt,
  });

  const secondAdmin = {
    name: `Second Admin ${testSuffix}`,
    email: `second_admin_${testSuffix}@jeeva.test`,
    passwordHash,
    role: 'admin' as const,
    createdAt: now,
    updatedAt: now,
  };
  const secondAdminInsert = await usersColl.insertOne(secondAdmin);
  const secondAdminToken = randomBytes(32).toString('hex');
  await sessionsColl.insertOne({
    tokenHash: digest(secondAdminToken),
    userId: secondAdminInsert.insertedId,
    createdAt: now,
    expiresAt,
  });

  const ownerUser = {
    name: `Test Owner ${testSuffix}`,
    email: `owner_${testSuffix}@jeeva.test`,
    passwordHash,
    role: 'pet_owner' as const,
    createdAt: now,
    updatedAt: now,
  };
  const ownerInsert = await usersColl.insertOne(ownerUser);
  const ownerToken = randomBytes(32).toString('hex');
  await sessionsColl.insertOne({
    tokenHash: digest(ownerToken),
    userId: ownerInsert.insertedId,
    createdAt: now,
    expiresAt,
  });

  const vetUser = {
    name: `Test Vet ${testSuffix}`,
    email: `vet_${testSuffix}@jeeva.test`,
    passwordHash,
    role: 'vet' as const,
    createdAt: now,
    updatedAt: now,
  };
  const vetInsert = await usersColl.insertOne(vetUser);
  const vetToken = randomBytes(32).toString('hex');
  await sessionsColl.insertOne({
    tokenHash: digest(vetToken),
    userId: vetInsert.insertedId,
    createdAt: now,
    expiresAt,
  });

  console.log('\n[1. SECURITY & ACCESS CONTROL TESTS]');

  // 1.1 Unauthenticated access to admin overview
  const resUnauth = await fetch(`${baseUrl}/api/admin/overview`);
  assert(
    resUnauth.status === 401,
    'Unauthenticated request to /api/admin/overview returns 401 Unauthorized',
    `got ${resUnauth.status}`,
  );

  // 1.2 Pet Owner token on admin endpoint
  const resOwnerAdmin = await fetch(`${baseUrl}/api/admin/overview`, {
    headers: { Authorization: `Bearer ${ownerToken}` },
  });
  assert(
    resOwnerAdmin.status === 403,
    'Pet Owner token on /api/admin/overview returns 403 Forbidden',
    `got ${resOwnerAdmin.status}`,
  );

  // 1.3 Vet token on admin endpoint
  const resVetAdmin = await fetch(`${baseUrl}/api/admin/overview`, {
    headers: { Authorization: `Bearer ${vetToken}` },
  });
  assert(
    resVetAdmin.status === 403,
    'Vet token on /api/admin/overview returns 403 Forbidden',
    `got ${resVetAdmin.status}`,
  );

  // 1.4 Admin token succeeds
  const resAdminOverview = await fetch(`${baseUrl}/api/admin/overview`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const overviewData = await resAdminOverview.json();
  assert(
    resAdminOverview.status === 200 &&
      overviewData.success === true &&
      typeof overviewData.overview?.pets === 'number',
    'Admin token on /api/admin/overview returns 200 and real counts',
  );

  console.log('\n[2. USER SUSPENSION & LOCKOUT SAFEGUARDS]');

  // 2.1 Self-lockout prevention
  const resSelfSuspend = await fetch(
    `${baseUrl}/api/admin/users/${adminInsert.insertedId.toHexString()}/suspend`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason: 'Self suspend test' }),
    },
  );
  assert(
    resSelfSuspend.status === 400,
    'Admin self-lockout prevention: Cannot suspend own account (400)',
    `got ${resSelfSuspend.status}`,
  );

  // 2.2 Suspend owner account with valid reason
  const resSuspendOwner = await fetch(
    `${baseUrl}/api/admin/users/${ownerInsert.insertedId.toHexString()}/suspend`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason: 'Violated terms of service repeatedly.' }),
    },
  );
  assert(
    resSuspendOwner.status === 200,
    'Admin can suspend pet owner account with reason',
  );

  // 2.3 Verify suspended user is blocked at /login
  const resSuspendedLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: ownerUser.email,
      password: 'TestPassword123!',
    }),
  });
  assert(
    resSuspendedLogin.status === 403,
    'Suspended user is blocked from logging in with 403 Forbidden',
    `got ${resSuspendedLogin.status}`,
  );

  // 2.4 Verify existing session token was invalidated
  const resSuspendedSession = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { Authorization: `Bearer ${ownerToken}` },
  });
  assert(
    resSuspendedSession.status === 401 || resSuspendedSession.status === 403,
    'Suspended user session is rejected immediately on subsequent requests',
  );

  // 2.5 Reactivate owner account
  const resReactivateOwner = await fetch(
    `${baseUrl}/api/admin/users/${ownerInsert.insertedId.toHexString()}/reactivate`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    },
  );
  assert(
    resReactivateOwner.status === 200,
    'Admin can reactivate suspended account',
  );

  // 2.6 Reactivated user can login again
  const resReactivatedLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: ownerUser.email,
      password: 'TestPassword123!',
    }),
  });
  assert(
    resReactivatedLogin.status === 200,
    'Reactivated user can sign in successfully',
  );

  console.log('\n[3. VET APPLICATION REVIEW & REVISION HISTORY]');

  // 3.1 Owner submits vet application
  const newOwnerLogin = await resReactivatedLogin.json();
  const currentOwnerToken = newOwnerLogin.token;

  const resSubmitVetApp = await fetch(`${baseUrl}/api/vet-applications/me`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${currentOwnerToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      qualifications: 'BVSc & AH, Veterinary College',
      registrationNumber: `REG-${testSuffix}`,
      registrationCouncil: 'State Veterinary Council',
      clinicName: 'JEEVA Health Clinic',
      clinicAddress: '123 Care Street, City, State 123456',
    }),
  });
  const submittedApp = await resSubmitVetApp.json();
  assert(
    resSubmitVetApp.status === 201 && submittedApp.application.status === 'pending',
    'Pet Owner submits valid vet application (status: pending)',
  );

  // 3.2 Concurrent review with outdated revision check
  const resMismatchReview = await fetch(
    `${baseUrl}/api/vet-applications/${ownerInsert.insertedId.toHexString()}/review`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        revision: new ObjectId().toHexString(), // mismatched revision
        decision: 'approved',
        reason: 'Reviewing',
      }),
    },
  );
  assert(
    resMismatchReview.status === 409,
    'Review with mismatched revision returns 409 Conflict',
  );

  // 3.3 Reject with feedback reason
  const resRejectApp = await fetch(
    `${baseUrl}/api/vet-applications/${ownerInsert.insertedId.toHexString()}/review`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        revision: submittedApp.application.revision,
        decision: 'rejected',
        reason: 'Please provide clinic registration certificate number.',
      }),
    },
  );
  assert(
    resRejectApp.status === 200,
    'Admin rejects vet application with actionable feedback',
  );

  // 3.4 Pet Owner resubmits corrected application
  const resResubmitApp = await fetch(`${baseUrl}/api/vet-applications/me`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${currentOwnerToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      qualifications: 'BVSc & AH, MVSc Veterinary Surgery',
      registrationNumber: `REG-CORRECTED-${testSuffix}`,
      registrationCouncil: 'State Veterinary Council',
      clinicName: 'JEEVA Multi-Specialty Clinic',
      clinicAddress: '123 Care Street, City, State 123456',
    }),
  });
  const resubmittedApp = await resResubmitApp.json();
  assert(
    resResubmitApp.status === 201,
    'Pet Owner corrects details and resubmits application',
  );

  // 3.5 Check Admin application history view contains previous rejection review
  const resAppHistory = await fetch(
    `${baseUrl}/api/admin/vet-applications/${ownerInsert.insertedId.toHexString()}`,
    {
      headers: { Authorization: `Bearer ${adminToken}` },
    },
  );
  const appHistoryData = await resAppHistory.json();
  assert(
    resAppHistory.status === 200 &&
      appHistoryData.application?.history?.length >= 1 &&
      appHistoryData.application.history[0].reviewReason.includes(
        'clinic registration certificate',
      ),
    'Admin vet application detail preserves historical reviews across resubmissions',
  );

  // 3.6 Approve corrected application
  const resApproveApp = await fetch(
    `${baseUrl}/api/vet-applications/${ownerInsert.insertedId.toHexString()}/review`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        revision: resubmittedApp.application.revision,
        decision: 'approved',
        reason: 'Credentials verified against registry.',
      }),
    },
  );
  assert(
    resApproveApp.status === 200,
    'Admin approves corrected vet application',
  );

  // Verify role upgraded to vet
  const upgradedUser = await usersColl.findOne({ _id: ownerInsert.insertedId });
  assert(
    upgradedUser?.role === 'vet' && upgradedUser.vetApplication?.status === 'approved',
    'Applicant user role atomically upgraded from pet_owner to vet',
  );

  console.log('\n[4. PET OVERSIGHT & OWNER PRIVACY]');

  // 4.1 Create test pet for owner
  const petInsert = await petsColl.insertOne({
    name: `Bella_${testSuffix}`,
    species: 'dog',
    sex: 'female',
    breed: 'Golden Retriever',
    notes: 'CONFIDENTIAL: Sensitive behavioral and clinical notes.',
    dateOfBirth: '2022-03-15',
    weightKg: 28,
    ownerId: ownerInsert.insertedId,
    createdAt: now,
    updatedAt: now,
  });

  // 4.2 Query /api/admin/pets
  const resAdminPets = await fetch(`${baseUrl}/api/admin/pets?search=Bella_${testSuffix}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const adminPetsData = await resAdminPets.json();
  const returnedPet = adminPetsData.pets?.[0];
  assert(
    resAdminPets.status === 200 &&
      returnedPet &&
      returnedPet.name === `Bella_${testSuffix}` &&
      returnedPet.notes === undefined,
    'Admin pets list excludes confidential clinical/health notes (privacy enforced)',
  );

  // 4.3 Query /api/admin/users/:userId
  const resUserDetail = await fetch(
    `${baseUrl}/api/admin/users/${ownerInsert.insertedId.toHexString()}`,
    {
      headers: { Authorization: `Bearer ${adminToken}` },
    },
  );
  const userDetailData = await resUserDetail.json();
  const userPet = userDetailData.user?.pets?.[0];
  assert(
    resUserDetail.status === 200 &&
      userPet &&
      userPet.notes === undefined &&
      userDetailData.user.passwordHash === undefined,
    'Admin user detail excludes password hashes and confidential medical notes',
  );

  console.log('\n[5. CARE GUIDES & ANNOUNCEMENTS MANAGEMENT]');

  // 5.1 Create guide
  const resCreateGuide = await fetch(`${baseUrl}/api/admin/guides`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: `Emergency First Aid Guide ${testSuffix}`,
      category: 'Health & Safety',
      slug: `emergency-aid-${testSuffix}`,
      sections: [
        {
          heading: 'Assess the Situation',
          text: 'Stay calm and move the pet to a safe, quiet space.',
        },
      ],
    }),
  });
  const createdGuide = await resCreateGuide.json();
  assert(
    resCreateGuide.status === 201 && createdGuide.guide?.status === 'draft',
    'Admin creates new care guide in draft status',
  );

  // 5.2 Publish guide
  const resPublishGuide = await fetch(
    `${baseUrl}/api/admin/guides/${createdGuide.guide.id}/publish`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    },
  );
  assert(resPublishGuide.status === 200, 'Admin publishes care guide');

  // 5.3 Verify guide appears in public /api/guides
  const resPublicGuides = await fetch(`${baseUrl}/api/guides`);
  const publicGuidesData = await resPublicGuides.json();
  assert(
    resPublicGuides.status === 200 &&
      publicGuidesData.guides.some((g: any) => g.slug === `emergency-aid-${testSuffix}`),
    'Published guide is accessible via public /api/guides endpoint',
  );

  // 5.4 Create and publish announcement
  const resCreateAnn = await fetch(`${baseUrl}/api/admin/announcements`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: `Rabies Vaccination Clinic ${testSuffix}`,
      content: 'Free rabies vaccinations available this weekend at local shelters.',
      audience: 'pet_owners',
      priority: 'important',
    }),
  });
  const createdAnn = await resCreateAnn.json();
  assert(
    resCreateAnn.status === 201 && createdAnn.announcement?.status === 'draft',
    'Admin creates new announcement draft',
  );

  const resPublishAnn = await fetch(
    `${baseUrl}/api/admin/announcements/${createdAnn.announcement.id}/publish`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    },
  );
  assert(resPublishAnn.status === 200, 'Admin publishes announcement');

  console.log('\n[6. AUDIT LOGS INTEGRITY]');

  // 6.1 Query audit logs
  const resAuditLogs = await fetch(`${baseUrl}/api/admin/audit-logs`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const auditData = await resAuditLogs.json();
  assert(
    resAuditLogs.status === 200 &&
      auditData.logs?.length >= 5 &&
      auditData.logs.some((l: any) => l.action === 'vet_approved') &&
      auditData.logs.some((l: any) => l.action === 'guide_created') &&
      auditData.logs.some((l: any) => l.action === 'announcement_published'),
    'Audit trail records all governance, content and decision events',
  );

  // Clean up test records
  await usersColl.deleteMany({ email: { $regex: testSuffix } });
  await sessionsColl.deleteMany({
    userId: {
      $in: [
        adminInsert.insertedId,
        secondAdminInsert.insertedId,
        ownerInsert.insertedId,
        vetInsert.insertedId,
      ],
    },
  });
  await petsColl.deleteOne({ _id: petInsert.insertedId });
  await guidesColl.deleteOne({ slug: `emergency-aid-${testSuffix}` });
  await announcementsColl.deleteOne({ _id: new ObjectId(createdAnn.announcement.id) });

  server.close();
  await disconnectDatabase();

  console.log('\n====================================================');
  console.log(`  TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error('Test suite runtime error:', err);
  process.exitCode = 1;
});
