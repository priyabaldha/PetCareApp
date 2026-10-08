import app from './app.ts';
import { createUserIndexes } from './models/user.ts';
import {
  connectDatabase,
  disconnectDatabase,
} from './database.ts';
import { initializeSessions } from './routes/sessions.ts';
import { createPetIndexes } from './models/pet.ts';
import { createAuditLogIndexes } from './models/auditLog.ts';
import { createGuideIndexes, initializeGuides } from './models/guide.ts';
import { createAnnouncementIndexes } from './models/announcement.ts';
import { createVetProfileIndexes } from './models/vetProfile.ts';
import { createVetBookingIndexes } from './models/vetBooking.ts';
import { createPetAccessGrantIndexes } from './models/petAccessGrant.ts';
import { createConsultationIndexes } from './models/consultation.ts';
import { createPrescriptionIndexes } from './models/prescription.ts';
import { createNotificationIndexes } from './models/notification.ts';

const PORT = 4000;
const HOST = '0.0.0.0';

async function startServer(): Promise<void> {
  try {
    await connectDatabase();
    await createUserIndexes();
    await initializeSessions();
    await createPetIndexes();
    await createAuditLogIndexes();
    await createGuideIndexes();
    await initializeGuides();
    await createAnnouncementIndexes();
    await createVetProfileIndexes();
    await createVetBookingIndexes();
    await createPetAccessGrantIndexes();
    await createConsultationIndexes();
    await createPrescriptionIndexes();
    await createNotificationIndexes();

    const server = app.listen(PORT, HOST, () => {
      console.log(`JEEVA backend is listening on port ${PORT}`);
      console.log(`Computer test: http://localhost:${PORT}/api/health`);
    });

    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use.`);
      } else {
        console.error('Unable to start the backend:', error.message);
      }

      void disconnectDatabase().finally(() => process.exit(1));
    });

    let shuttingDown = false;

    const shutdown = (): void => {
      if (shuttingDown) return;
      shuttingDown = true;

      console.log('\nStopping JEEVA backend...');

      const timeout = setTimeout(() => {
        process.exit(1);
      }, 10000);

      timeout.unref();

      server.close(() => {
        void disconnectDatabase()
          .then(() => process.exit(0))
          .catch(() => process.exit(1));
      });
    };

    process.once('SIGINT', shutdown);
    process.once('SIGTERM', shutdown);
  } catch (error) {
    console.error(
      'Backend startup failed:',
      error instanceof Error ? error.message : 'Unknown error',
    );

    await disconnectDatabase().catch(() => undefined);
    process.exit(1);
  }
}

void startServer();