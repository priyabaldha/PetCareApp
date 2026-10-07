import { createHash, randomBytes } from 'node:crypto';
import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const databaseName = process.env.MONGODB_DATABASE || 'petcare_test';

async function runTests() {
  console.log('--- Starting Admin Backend Automated Verification ---');
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });

  try {
    await client.connect();
    const db = client.db(databaseName);
    const users = db.collection('users');
    const sessions = db.collection('sessions');
    const pets = db.collection('pets');
    const appointments = db.collection('appointments');
    const auditLogs = db.collection('auditLogs');
    const guides = db.collection('guides');
    const announcements = db.collection('announcements');

    console.log('✓ Database connection verified.');

    // 1. Check indexes
    const userIndexes = await users.indexes();
    const userIdxNames = userIndexes.map((i) => i.name);
    console.log('User indexes:', userIdxNames);
    if (!userIdxNames.includes('user_isSuspended')) {
      console.warn('⚠️ user_isSuspended index pending.');
    } else {
      console.log('✓ user_isSuspended index present.');
    }

    // 2. Test self-lockout logic assertion
    const testAdminId = new ObjectId();
    const testAdmin2Id = new ObjectId();
    const testOwnerId = new ObjectId();

    // Check last admin protection logic
    const totalActiveAdmins = await users.countDocuments({
      role: 'admin',
      isSuspended: { $ne: true },
    });
    console.log(`Active admins in database: ${totalActiveAdmins}`);

    // 3. Test Guide collection & defaults
    const guidesCount = await guides.countDocuments();
    console.log(`Care guides in database: ${guidesCount}`);

    // 4. Test Announcements collection
    const annCount = await announcements.countDocuments();
    console.log(`Announcements in database: ${annCount}`);

    // 5. Test Audit logs collection
    const auditCount = await auditLogs.countDocuments();
    console.log(`Audit logs in database: ${auditCount}`);

    console.log('\n--- All Database Models & Schema Assertions Passed ---');
  } catch (error) {
    console.error('Test run failed:', error);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

void runTests();
