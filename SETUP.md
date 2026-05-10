# Hall of Mirrors Tattoo Studio - Development Setup Guide

## Project Structure

```
hall-of-mirrors-tattoo/
├── frontend/                 # Next.js 14+ React application
│   ├── app/
│   │   ├── page.tsx         # Home page (logo-first hero)
│   │   ├── booking/         # Booking page
│   │   ├── consultation/    # Free consultation page
│   │   ├── layout.tsx       # Root layout
│   │   ├── globals.css      # Global styles
│   │   └── components/      # Reusable components
│   ├── public/              # Static assets
│   │   └── assets/logos/    # HOMLOGO.png, HOMTEXT.png
│   └── package.json
│
├── backend/                  # Express.js API
│   ├── src/
│   │   ├── index.ts         # Main server
│   │   ├── routes/          # API routes
│   │   └── controllers/     # Business logic
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   ├── .env                 # Environment variables
│   └── package.json
│
└── docs/                    # Documentation

```

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+ (local or cloud)
- Git

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`

## Backend Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Database Setup

You need a PostgreSQL database. Two options:

**Option A: Local PostgreSQL (macOS)**
```bash
# Install PostgreSQL via Homebrew
brew install postgresql@15
brew services start postgresql@15

# Create database and user
psql postgres
CREATE DATABASE hallofmirrors;
CREATE USER tattoo_admin WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE hallofmirrors TO tattoo_admin;
\q
```

**Option B: Cloud PostgreSQL**
- Use Supabase (https://supabase.com) or Railway
- Copy the connection string into `.env`

### 3. Configure Environment

Copy `.env.example` to `.env` and update:

```env
DATABASE_URL="postgresql://tattoo_admin:password@localhost:5432/hallofmirrors"
JWT_SECRET="dev_secret_key_change_in_production_min_32_characters_required"
JWT_REFRESH_SECRET="dev_refresh_secret_key_change_in_production_min_32_chars"
PORT=5000
CORS_ORIGIN="http://localhost:3000"
```

### 4. Run Migrations

```bash
npm run prisma:migrate
# or
npx prisma migrate dev --name init
```

### 5. Start Backend

```bash
npm run dev
```

Backend runs on `http://localhost:5000`

## Available API Endpoints

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings` - Get all bookings
- `GET /api/bookings/:id` - Get booking by ID
- `PATCH /api/bookings/:id` - Update booking status
- `DELETE /api/bookings/:id` - Cancel booking

### Consultations
- `POST /api/consultations` - Create consultation request
- `GET /api/consultations` - Get all consultation requests
- `GET /api/consultations/:id` - Get consultation by ID
- `PATCH /api/consultations/:id` - Update consultation

### Contact
- `POST /api/contact` - Submit contact form
- `GET /api/contact` - Get all submissions
- `PATCH /api/contact/:id/read` - Mark as read

## Frontend Environment

Add to `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## Development Workflow

1. **Start Frontend**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Start Backend** (in another terminal)
   ```bash
   cd backend
   npm run dev
   ```

3. **Access Application**
   - Home: http://localhost:3000
   - Book: http://localhost:3000/booking
   - Consultation: http://localhost:3000/consultation

## Database Schema Overview

**Key Tables:**
- `User` - Client information
- `Booking` - Appointment bookings
- `ConsultationRequest` - Free consultation requests
- `ContactFormSubmission` - Contact form submissions
- `Payment` - Payment records (Stripe/PayPal)
- `TattooPortfolio` - Portfolio images
- `Review` - Client reviews/testimonials

## Next Steps

- [ ] Set up PostgreSQL database
- [ ] Configure environment variables
- [ ] Run Prisma migrations
- [ ] Test API endpoints with Postman/Insomnia
- [ ] Set up SendGrid for email notifications
- [ ] Integrate Stripe/PayPal test credentials
- [ ] Build admin dashboard
- [ ] Set up image storage (AWS S3 or local)

## Troubleshooting

### CORS Errors
Ensure `CORS_ORIGIN` in backend `.env` matches your frontend URL.

### Database Connection Failed
1. Check PostgreSQL is running: `psql postgres`
2. Verify connection string in `.env`
3. Check database exists: `psql hallofmirrors`

### Port Already in Use
- Frontend: Change in `next.config.js`
- Backend: Change `PORT` in `.env`

### Prisma Client Not Found
```bash
npx prisma generate
```

