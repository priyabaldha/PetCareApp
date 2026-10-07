import type { ObjectId } from 'mongodb';
import { database } from '../database.ts';
import type { UserRole } from './user.ts';

export interface AuditLog {
  _id?: ObjectId;
  actorId: ObjectId;
  actorName: string;
  actorEmail: string;
  actorRole: UserRole;
  action: string;
  targetType: 'user' | 'vet_application' | 'guide' | 'announcement' | 'system';
  targetId: string;
  targetName?: string;
  reason?: string;
  details?: Record<string, unknown>;
  createdAt: Date;
}

export const auditLogsCollection = database.collection<AuditLog>('auditLogs');

export async function createAuditLogIndexes(): Promise<void> {
  await auditLogsCollection.createIndex(
    { createdAt: -1 },
    { name: 'audit_createdAt_desc' },
  );
  await auditLogsCollection.createIndex(
    { targetType: 1, targetId: 1 },
    { name: 'audit_target' },
  );
  await auditLogsCollection.createIndex(
    { actorId: 1 },
    { name: 'audit_actor' },
  );
}

export async function recordAuditLog(entry: {
  actorId: ObjectId;
  actorName: string;
  actorEmail: string;
  actorRole: UserRole;
  action: string;
  targetType: 'user' | 'vet_application' | 'guide' | 'announcement' | 'system';
  targetId: string;
  targetName?: string;
  reason?: string;
  details?: Record<string, unknown>;
}): Promise<void> {
  try {
    await auditLogsCollection.insertOne({
      ...entry,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}
