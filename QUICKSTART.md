# Hall of Mirrors - Quick Start Guide

## What's Ready Now ✅

### Frontend
- Home page with logo-first hero and staggered animations
- Booking page with full form and validation
- Consultation page with form and validation  
- Trust indicators, portfolio grid, and CTA sections
- Responsive design with cream background and gold accents
- All styling complete with glassmorphism effects

### Backend
- Express.js API server with rate limiting and CORS
- Three complete API endpoints:
  - `/api/bookings` (create, read, update, cancel bookings)
  - `/api/consultations` (create, read, update consultation requests)
  - `/api/contact` (submit and manage contact forms)
- Full validation schemas with Zod
- Error handling middleware
- Database models defined in Prisma schema

## What You Need to Do (In Order)

### 1. Set Up PostgreSQL (CRITICAL - Required First)

**Option A: Local (macOS)**
```bash
# Install PostgreSQL
brew install postgresql@15
brew services start postgresql@15

# Create database and user
psql postgres
CREATE DATABASE hallofmirrors;
CREATE USER tattoo_admin WITH PASSWORD 'secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE hallofmirrors TO tattoo_admin;
\q
```

**Option B: Cloud (Supabase - Easiest)**
1. Go to https://supabase.com
2. Create new project
3. Copy connection string
4. Paste into `backend/.env` as `DATABASE_URL`

### 2. Configure Backend Environment

```bash
cd backend
# Update .env with your database credentials
nano .env  # or use your editor

# Key variables:
# DATABASE_URL="postgresql://tattoo_admin:password@localhost:5432/hallofmirrors"
# PORT=5000
# CORS_ORIGIN="http://localhost:3000"
```

### 3. Run Database Migrations

```bash
cd backend
npx prisma migrate dev --name init
# This creates all tables in your database
```

### 4. Start the Servers

**Terminal 1 - Frontend:**
```bash
cd frontend
npm run dev
# Runs on http://localhost:3000
```

**Terminal 2 - Backend:**
```bash
cd backend
npm run dev
# Runs on http://localhost:5000
```

### 5. Test the Forms

- Go to http://localhost:3000/booking
- Fill out and submit the booking form
- Check backend logs to see the data coming in
- Go to http://localhost:3000/consultation
- Fill out and submit - should also work

## Next Priority Tasks

1. **Payment Integration** (NEXT)
   - Stripe test keys setup
   - PayPal test credentials
   - Deposit/payment endpoints

2. **Email Service** (HIGH)
   - SendGrid setup
   - Booking confirmation emails
   - Consultation request emails

3. **Admin Dashboard** (HIGH)
   - View all bookings
   - Update booking status
   - View contact submissions
   - Basic analytics

4. **Portfolio & Reviews** (MEDIUM)
   - Build portfolio pages
   - Upload/manage images
   - Display client reviews

## Troubleshooting

**"connection refused" error in backend:**
- PostgreSQL not running
- Wrong password in DATABASE_URL
- Database doesn't exist

**CORS errors in browser:**
- Check CORS_ORIGIN in backend/.env matches frontend URL
- Make sure backend is actually running on :5000

**Forms submitting but nothing happens:**
- Check browser console for errors
- Check backend terminal for logs
- Make sure database is connected

**"prisma client not found":**
```bash
cd backend
npx prisma generate
```

## Architecture Overview

The application follows a clean three-layer architecture:

- **Frontend** (Next.js): Handles UI, form submission, API calls
- **Backend** (Express): Validates data, business logic, database
- **Database** (PostgreSQL): Persistent storage

Forms on frontend → API calls to backend → Backend validates with Zod → Prisma writes to database → Responses sent back

## Key Files to Know

- `frontend/app/page.tsx` - Home page
- `frontend/app/booking/page.tsx` - Booking form
- `frontend/app/consultation/page.tsx` - Consultation form
- `backend/src/index.ts` - Main server file
- `backend/src/controllers/` - Business logic
- `backend/src/routes/` - API endpoints
- `backend/prisma/schema.prisma` - Database schema

## Commands Reference

```bash
# Frontend
npm run dev          # Start dev server
npm run build        # Build for production
npm run lint         # Check code quality

# Backend
npm run dev          # Start dev server
npm run prisma:migrate  # Run database migrations
npm run prisma:generate # Generate Prisma client
npm run lint         # Check code quality
```

