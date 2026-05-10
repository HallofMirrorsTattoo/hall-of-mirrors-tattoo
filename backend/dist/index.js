import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import bookingsRouter from './routes/bookings.js';
import consultationsRouter from './routes/consultations.js';
import contactRouter from './routes/contact.js';
import { initializeDatabase } from './init.js';
const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;
// Middleware
app.use(helmet());
// Configure CORS to accept requests from frontend
const corsOrigins = [
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
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Routes
app.use('/api/bookings', bookingsRouter);
app.use('/api/consultations', consultationsRouter);
app.use('/api/contact', contactRouter);
// Error handler middleware
app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        status: err.status || 500,
    });
});
// Start server
app.listen(PORT, async () => {
    try {
        await initializeDatabase();
        console.log(`🎨 Hall of Mirrors API running on port ${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`📊 Database: ${process.env.DATABASE_URL?.split('@')[1]}`);
    }
    catch (error) {
        console.error('Failed to initialize database:', error);
        process.exit(1);
    }
});
// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    await prisma.$disconnect();
    process.exit(0);
});
//# sourceMappingURL=index.js.map