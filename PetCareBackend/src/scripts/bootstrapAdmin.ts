import { MongoClient } from 'mongodb';

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();

  if (
    !email ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    throw new Error(
      'Provide the email of the existing account to make Admin.',
    );
  }

  const uri = process.env.MONGODB_URI;
  const databaseName = process.env.MONGODB_DATABASE;

  if (!uri || !databaseName) {
    throw new Error(
      'MONGODB_URI and MONGODB_DATABASE must be set in .env.',
    );
  }

  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 10_000,
  });

  try {
    await client.connect();

    const database = client.db(databaseName);
    const users = database.collection('users');

    const existingAdmin = await users.findOne(
      { role: 'admin' },
      { projection: { _id: 1 } },
    );

    if (existingAdmin) {
      throw new Error(
        'An Admin already exists. This command is only for the first Admin.',
      );
    }

    const user = await users.findOne(
      { email },
      { projection: { _id: 1, role: 1 } },
    );

    if (!user) {
      throw new Error(
        'Account not found. Register this account in the app first.',
      );
    }

    if (user.role !== 'pet_owner') {
      throw new Error('The selected account must currently be a Pet Owner.');
    }

    const result = await users.updateOne(
      { _id: user._id, role: 'pet_owner' },
      {
        $set: {
          role: 'admin',
          updatedAt: new Date(),
        },
      },
    );

    if (result.modifiedCount !== 1) {
      throw new Error('Account changed during setup. No promotion confirmed.');
    }

    // End old sessions so the account signs in again as Admin.
    await database.collection('sessions').deleteMany({
      userId: user._id,
    });

    console.log(`Admin access enabled for ${email}.`);
    console.log('Sign in again through the normal Login screen.');
  } finally {
    await client.close();
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : 'Admin setup failed.',
  );
  process.exitCode = 1;
});