# Hall of Mirrors Tattoo — Phase 1 Development Roadmap

**Phase:** 1 (MVP - Core Booking System)  
**Duration:** ~2 weeks  
**Status:** Ready to Build

---

## Phase 1 Goals

✅ Public-facing website with all main pages  
✅ Guest booking system (no accounts required)  
✅ Digital consent form integration  
✅ Payment processing (Stripe deposit only)  
✅ Automated booking confirmation email  
✅ Basic database structure  

---

## Frontend Tasks (Next.js + React)

### Pages (All pages created - **need API integration**)
- [x] Home (`/`)
- [x] Portfolio (`/portfolio`)
- [x] Services (`/services`)
- [x] About (`/about`)
- [x] Booking (`/booking`) — **Step 1/2: Personal Info, Date/Time**
- [x] Consultation Request (`/consultation`)
- [x] Aftercare (`/aftercare`)
- [x] Testimonials (`/testimonials`)
- [x] Contact (`/contact`)
- [x] Terms (`/terms`)
- [x] Privacy (`/privacy`)
- [x] Cookies (`/cookies`)

### Components (To Create)
- [ ] Booking Form (multi-step)
  - Step 1: Personal info (name, email, phone)
  - Step 2: Date/time selection (calendar)
  - Step 3: Tattoo details (description, placement, size)
  - Step 4: Consent form review + agree
  - Step 5: Payment (Stripe form)
- [ ] Consent Form Display
- [ ] Calendar/Date Picker Integration
- [ ] Stripe Payment Modal
- [ ] Form Validation (Zod)
- [ ] Success/Confirmation Screen
- [ ] Navigation & Routing

### API Integration (Phase 1)
- [ ] POST `/api/bookings` — Submit booking request
- [ ] GET `/api/bookings/:id` — Check booking status
- [ ] POST `/api/payments/deposit` — Process Stripe deposit
- [ ] POST `/api/consultations` — Submit consultation request
- [ ] POST `/api/contact` — Submit contact form
- [ ] GET `/api/testimonials` — Fetch reviews (for display)

---

## Backend Tasks (Express + Node.js)

### Database Setup
- [ ] Prisma migration setup (`prisma migrate dev`)
- [ ] Create all tables (User, Booking, ConsentForm, Payment, etc.)
- [ ] Add sample studio data (Studio model)

### API Routes (Phase 1)

#### Bookings
- [ ] `POST /api/bookings` — Create new booking
  - Validate input (name, email, phone, date, time, tattoo details)
  - Check availability (calendar logic)
  - Create pending booking record
  - **→ Return booking reference + deposit amount**
  
- [ ] `GET /api/bookings/available-slots` — Get available time slots
  - Query studio hours + artist schedule
  - Subtract booked appointments
  - **→ Return array of available 15-min slots**
  
- [ ] `GET /api/bookings/:id` — Get booking details
  - Return booking status, details, deposit amount

#### Payments (Phase 1 - Deposit Only)
- [ ] `POST /api/payments/deposit` — Process Stripe deposit
  - Validate Stripe token
  - Create payment record
  - Update booking (deposit_paid = true)
  - **→ Send confirmation email**
  - **→ Return success + booking reference**

#### Consultations
- [ ] `POST /api/consultations` — Submit consultation request
  - Validate input
  - Save to database
  - **→ Send auto-reply email to client**
  - **→ Send notification email to Robyn**

#### Contact Form
- [ ] `POST /api/contact` — Submit contact form
  - Validate input
  - Save to database
  - **→ Send auto-reply to client**
  - **→ Send to Robyn**

#### Testimonials (Read-Only for Phase 1)
- [ ] `GET /api/testimonials` — Fetch approved reviews
  - Return published reviews only
  - Include rating, text, client name, date

### Email Integration (SendGrid)
- [ ] Set up SendGrid service
- [ ] Create email templates:
  - Booking confirmation (pending approval)
  - Deposit payment received
  - Consultation request confirmation
  - Contact form received
  - Auto-response templates

### Authentication (Placeholder for Phase 1)
- [ ] JWT token setup (for future admin)
- [ ] Password hashing (bcrypt)
- [ ] Basic middleware structure

### Utilities
- [ ] Email service (SendGrid)
- [ ] Payment service (Stripe)
- [ ] Validation schemas (Zod)
- [ ] Error handling middleware
- [ ] Logging setup

---

## Database Schema (Prisma)

### Created Tables
- [x] User (client accounts - optional Phase 1)
- [x] Booking
- [x] ConsentForm
- [x] Payment
- [x] DesignIdea
- [x] ContactFormSubmission
- [x] ConsultationRequest
- [x] Review (read-only Phase 1)
- [x] Studio
- [x] Artist (for future multi-artist)

### Relations
- Booking → User (optional, for accounts)
- Booking → ConsentForm
- Booking → Payment
- Booking → DesignIdea
- ConsentForm → User (optional)

---

## Environment Setup

### Frontend
```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
# Runs on http://localhost:3000
```

### Backend
```bash
cd backend
cp .env.example .env.local
npm install
npx prisma migrate dev
npx prisma db seed # (optional - adds demo data)
npm run dev
# Runs on http://localhost:5000
```

---

## Deployment Readiness

### Before Phase 2
- [ ] Test all Phase 1 features locally
- [ ] Verify email sending works
- [ ] Test Stripe payment flow (test keys)
- [ ] Validate consent form logic
- [ ] Check responsive design (mobile/desktop)
- [ ] Security review (HTTPS, CORS, rate limiting)

---

## Placeholder Data to Customize

Once you provide these, we'll update the site:

### Studio Information
- [ ] Robyn's bio (100-150 words)
- [ ] Pricing (small/medium/large/cover-up)
- [ ] Deposit amount (£50 or 25%)
- [ ] Hours confirmation (9am-8pm, 7 days)
- [ ] Contact phone number
- [ ] Email address

### Assets
- [ ] Portfolio images (5-10 samples)
- [ ] Studio logo (PNG, 500x500px+)
- [ ] Favicon
- [ ] Social media links

### Email Details
- [ ] Email provider (SendGrid vs Mailgun)
- [ ] From address
- [ ] Branding assets (logo for emails)

---

## Next Steps

1. **Install dependencies:**
   ```bash
   cd frontend && npm install
   cd ../backend && npm install
   ```

2. **Set up environment variables:**
   ```bash
   # Backend
   cp backend/.env.example backend/.env.local
   
   # Frontend
   cp frontend/.env.local.example frontend/.env.local
   ```

3. **Initialize database:**
   ```bash
   cd backend
   npx prisma migrate dev
   npx prisma generate
   ```

4. **Start development servers:**
   ```bash
   # Terminal 1 - Frontend
   cd frontend && npm run dev
   
   # Terminal 2 - Backend
   cd backend && npm run dev
   ```

5. **Verify setup:**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000/api/health

---

## File Structure

```
hall-of-mirrors-tattoo/
├── frontend/
│   ├── app/
│   │   ├── components/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── booking/page.tsx
│   │   ├── portfolio/page.tsx
│   │   └── ... (other pages)
│   ├── lib/
│   ├── types/
│   ├── package.json
│   ├── tailwind.config.js
│   └── next.config.js
├── backend/
│   ├── src/
│   │   ├── index.ts
│   │   ├── routes/
│   │   ├── services/
│   │   └── middleware/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── package.json
│   └── tsconfig.json
├── docs/
│   ├── DESIGN_REFERENCE.md
│   └── PHASE_1_ROADMAP.md (this file)
└── README.md
```

---

## Success Criteria (Phase 1 Complete)

- [x] All pages render and are navigable
- [ ] Booking form validates and submits
- [ ] Calendar shows available slots
- [ ] Stripe deposit payment works (test mode)
- [ ] Consent form displays and accepts
- [ ] Confirmation emails send
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Fast load times

---

**Ready to build! 🎨**
