import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bookingsRouter from './routes/bookings.js';
import consultationsRouter from './routes/consultations.js';
import authRouter from './routes/auth.js';
import clientAuthRouter from './routes/clientAuth.js';
import artistsRouter from './routes/artists.js';
import clientBookingsRouter from './routes/clientBookings.js';
import clientDesignRouter from './routes/clientDesign.js';
import clientConsultationRouter from './routes/clientConsultation.js';
import consentRouter from './routes/consent.js';
import walkInConsentRouter from './routes/walkInConsent.js';
import availabilityRouter from './routes/availability.js';
import { clientMessagesRouter, artistMessagesRouter, clientConsultationMessagesRouter, artistConsultationMessagesRouter } from './routes/messages.js';
import { publicFlashRouter, artistFlashRouter } from './routes/flash.js';
import { studioSettingsRouter, publicStudioSettingsRouter } from './routes/studioSettings.js';
import googleCalendarRouter from './routes/googleCalendar.js';
import googleDriveRouter from './routes/googleDrive.js';
import paymentsRouter from './routes/payments.js';
import { setupDatabase } from './setupDb.js';
import { startReminderJob } from './jobs/reminderJob.js';

const app: Express = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());

// Configure CORS to accept requests from frontend
const corsOrigins: string[] = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003',
  'http://localhost:3004',
  'http://localhost:3005',
  'http://localhost:3006',
  'http://localhost:3007',
  'http://localhost:3008',
  'http://localhost:3009',
  'https://hall-of-mirrors-tattoo.vercel.app',
  'https://hallofmirrorstattoo.com',
  'https://www.hallofmirrorstattoo.com',
  'https://hallofmirrorstattoo.co.uk',
  'https://www.hallofmirrorstattoo.co.uk',
];
if (process.env.CORS_ORIGIN) {
  corsOrigins.push(process.env.CORS_ORIGIN);
}

app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting — global default, then stricter buckets on auth endpoints below.
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // dashboards poll messages every 30s — generous global cap
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Stricter limit for credential endpoints — defends against brute-force and
// password-reset enumeration without locking users out of normal browsing.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many attempts. Please try again in a few minutes.' },
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes — auth bucket gets the stricter limiter applied at the mount point
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/auth/client', authLimiter, clientAuthRouter);
app.use('/api/artist', artistsRouter);
app.use('/api/artists', artistsRouter); // alias — plural form used by some clients
app.use('/api/client/bookings', clientBookingsRouter);
app.use('/api/client/design-ideas', clientDesignRouter);
app.use('/api/client/consultations', clientConsultationRouter);
app.use('/api/client/consent', consentRouter);
app.use('/api/consent', walkInConsentRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/consultations', consultationsRouter);
app.use('/api/availability', availabilityRouter);
app.use('/api/client/messages', clientMessagesRouter);
app.use('/api/artist/messages', artistMessagesRouter);
app.use('/api/client/consultation-messages', clientConsultationMessagesRouter);
app.use('/api/artist/consultation-messages', artistConsultationMessagesRouter);
app.use('/api/flash', publicFlashRouter);
app.use('/api/artist/flash', artistFlashRouter);
app.use('/api/artist/studio-settings', studioSettingsRouter);
app.use('/api/studio-settings', publicStudioSettingsRouter);
app.use('/api/artist/google-calendar', googleCalendarRouter);
app.use('/api/studio/drive', googleDriveRouter);
app.use('/api/payments', paymentsRouter);

// Error handler middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    status: err.status || 500,
  });
});

// Start server immediately
app.listen(PORT, () => {
  console.log(`🎨 Hall of Mirrors API running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Setup database then start background jobs
(async () => {
  try {
    console.log('🔄 Setting up database...');
    await setupDatabase();
    console.log('✅ Database ready');
    startReminderJob();
  } catch (error) {
    console.error('⚠️ Database setup error:', error);
  }
})();

// Process-level error guards — log but stay alive. We've had calendar push
// callbacks throw uncaught into the void, which historically crashed the process.
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  process.exit(0);
});
