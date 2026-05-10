import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import bookingsRouter from './routes/bookings.js';
import consultationsRouter from './routes/consultations.js';
import contactRouter from './routes/contact.js';
import authRouter from './routes/auth.js';
import artistsRouter from './routes/artists.js';
import { setupDatabase } from './setupDb.js';

const app: Express = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());

// Configure CORS to accept requests from frontend
const corsOrigins: string[] = [
  'http://localhost:3000',
  'http://localhost:3001',
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
app.use('/api/artist', artistsRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/consultations', consultationsRouter);
app.use('/api/contact', contactRouter);
app.use('/api/artists', artistsRouter);

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

// Setup database in background (non-blocking)
(async () => {
  try {
    console.log('🔄 Setting up database...');
    await setupDatabase();
    console.log('✅ Database ready');
  } catch (error) {
    console.error('⚠️ Database setup error:', error);
  }
})();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});
