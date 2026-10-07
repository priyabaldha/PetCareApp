import express from 'express';
import type { ErrorRequestHandler } from 'express';
import { checkDatabase } from './database.ts';
import authRouter from './routes/auth.ts';
import sessionRouter from './routes/sessions.ts';
import petRouter from './routes/pets.ts';
import vaccinationRouter from './routes/vaccinations.ts';
import appointmentRouter from './routes/appointments.ts';
import healthRecordRouter from './routes/healthRecords.ts';
import medicationRouter from './routes/medications.ts';
import adminRouter from './routes/admin.ts';
import vetApplicationRouter from './routes/vetApplications.ts';
import guidesRouter from './routes/guides.ts';
import announcementsRouter from './routes/announcements.ts';

const app = express();

app.disable('x-powered-by');

app.use(express.json({ limit: '1mb' }));
app.use('/api/auth', authRouter);
app.use('/api/auth', sessionRouter);
app.use('/api/pets', petRouter);
app.use('/api/pets', vaccinationRouter);
app.use('/api/pets', appointmentRouter);
app.use('/api/pets', healthRecordRouter);
app.use('/api/pets', medicationRouter);
app.use('/api/admin', adminRouter);
app.use('/api/vet-applications', vetApplicationRouter);
app.use('/api/guides', guidesRouter);
app.use('/api/announcements', announcementsRouter);

app.get('/api/health', async (_request, response) => {
  response.setHeader('Cache-Control', 'no-store');

  try {
    await checkDatabase();

    response.status(200).json({
      success: true,
      message: 'JEEVA backend is running',
      database: 'connected',
    });
  } catch {
    response.status(503).json({
      success: false,
      message: 'JEEVA backend is running, but MongoDB is unavailable',
      database: 'disconnected',
    });
  }
});

app.use((_request, response) => {
  response.status(404).json({
    success: false,
    message: 'Endpoint not found',
  });
});

const errorHandler: ErrorRequestHandler = (
  error,
  _request,
  response,
  _next,
) => {
  if (
    error instanceof SyntaxError &&
    'status' in error &&
    error.status === 400
  ) {
    response.status(400).json({
      success: false,
      message: 'Invalid JSON request body',
    });
    return;
  }

  console.error('Unhandled server error:', error);

  response.status(500).json({
    success: false,
    message: 'An unexpected server error occurred',
  });
};

app.use(errorHandler);

export default app;