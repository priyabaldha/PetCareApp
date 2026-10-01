import 'dotenv/config';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const databaseName = process.env.MONGODB_DATABASE;

if (!uri || !databaseName) {
  throw new Error(
    'Set MONGODB_URI and MONGODB_DATABASE in your .env file.',
  );
}

const client = new MongoClient(uri, {
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 5000,
  socketTimeoutMS: 10000,
});

export const database = client.db(databaseName);

export async function checkDatabase(): Promise<void> {
  await database.command({ ping: 1 }, { timeoutMS: 5000 });
}

export async function connectDatabase(): Promise<void> {
  await client.connect();
  await checkDatabase();

  console.log(`MongoDB connected: ${database.databaseName}`);
}

export async function disconnectDatabase(): Promise<void> {
  await client.close();
}