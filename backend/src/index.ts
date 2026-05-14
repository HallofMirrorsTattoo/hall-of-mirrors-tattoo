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
import availabilityRouter from './routes/availability.js';
import { clientMessagesRouter, artistMessagesRouter, clientConsultationMessagesRouter, artistConsultationMessagesRouter } from './routes/messages.js';
import { publicFlashRouter, artistFlashRouter } from './routes/flash.js';
import { studioSettingsRouter, publicStudioSettingsRouter } from './routes/studioSettings.js';
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

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/auth/client', clientAuthRouter);
app.use('/api/artist', artistsRouter);
app.use('/api/artists', artistsRouter); // alias — plural form used by some clients
app.use('/api/client/bookings', clientBookingsRouter);
app.use('/api/client/design-ideas', clientDesignRouter);
app.use('/api/client/consultations', clientConsultationRouter);
app.use('/api/client/consent', consentRouter);
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

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  process.exit(0);
});
