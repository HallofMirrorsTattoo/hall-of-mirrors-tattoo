# Hall of Mirrors Tattoo - Liverpool

Premium tattoo studio website with online booking system and artist management.

**Status:** Core booking system with artist (Robyn) fully functional ✅

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL (via Supabase)
- Environment files configured

### Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
PORT=49999 npm run dev
# Backend running at http://localhost:49999
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Frontend running at http://localhost:3006-3009 (dynamic)
```

### Check It's Working
1. Backend health: `curl http://localhost:49999/api/health`
2. Artists API: `curl http://localhost:49999/api/artists` → Should return Robyn
3. Frontend: Open `http://localhost:3006/booking` → Robyn should appear in dropdown

---

## 📋 Project Structure

```
hall-of-mirrors-tattoo/
├── backend/                    # Express.js API
│   ├── src/
│   │   ├── index.ts           # Main app, routes, middleware
│   │   ├── setupDb.ts         # Database initialization
│   │   ├── controllers/       # Route handlers
│   │   ├── routes/            # Route definitions
│   │   ├── middleware/        # Auth, CORS, etc
│   │   └── services/          # Business logic (email, etc)
│   ├── prisma/
│   │   ├── schema.prisma      # Data model (12 models)
│   │   └── migrations/        # Database schema history
│   ├── .env                   # DATABASE_URL, NODE_ENV
│   └── package.json
│
├── frontend/                   # Next.js 14 website
│   ├── app/
│   │   ├── page.tsx           # Home
│   │   ├── booking/page.tsx   # ✅ Booking form with artist selector
│   │   ├── portfolio/page.tsx
│   │   ├── services/page.tsx
│   │   ├── about/page.tsx
│   │   ├── contact/page.tsx
│   │   └── components/        # Reusable components
│   ├── lib/                   # Utils, hooks, auth
│   ├── public/assets/         # Logos, images
│   ├── tailwind.config.ts
│   ├── .env.local             # NEXT_PUBLIC_API_URL
│   └── package.json
│
├── CHECKPOINT.md              # Full development checkpoint
└── README.md                  # This file
```

---

## ✅ What's Built

### Artist Management
- ✅ Artist database model with auth fields
- ✅ **Robyn** added (artist-robyn-001)
  - Email: robyn@hallofmirrorstattoo.com
  - Specialties: Fine line, geometric, custom designs
  - 8 years experience
- ✅ `/api/artists` endpoint (public, returns active artists)

### Booking System
- ✅ Full booking form with:
  - Client details (name, email, phone)
  - Appointment date/time
  - Tattoo design, placement, size, color
  - **Artist selection dropdown** (optional)
  - Referral source, notes
- ✅ Form validation (Zod)
- ✅ Artist selector displays Robyn
- ✅ Booking submission to API

### Frontend
- ✅ 6 main pages (Home, Portfolio, Services, About, Contact, Booking)
- ✅ Consultation & contact forms
- ✅ Responsive design
- ✅ Premium dark academia styling
  - Navy (#1a1a2e), Charcoal, Gold (#d4af37), Cream (#fdfbf7)
  - Glass morphism, smooth animations
  - Garamond headers, Inter body text

### Backend Infrastructure
- ✅ Express server with security middleware
- ✅ Routes: `/api/auth`, `/api/artists`, `/api/bookings`, `/api/consultations`, `/api/contact`
- ✅ CORS configured for local + production
- ✅ Error handling
- ✅ Health check endpoint

### Database
- ✅ 12 Prisma models
- ✅ Migrations applied
- ✅ Supabase PostgreSQL connected
- ✅ All tables created

---

## ⚠️ Known Issues & Fixes

### Supabase Connection Pooling
**Issue:** "prepared statement already exists" errors with Prisma
**Status:** ✅ Fixed for `/api/artists` (uses raw pg Client)
**Remaining:** Booking controller still uses Prisma
**Fix:** Update booking controller to use raw SQL like artistController

### CORS
**Issue:** Frontend couldn't reach backend on dynamic ports
**Status:** ✅ Fixed - added localhost:3000-3009 to CORS list
**For Production:** Add your domain to CORS in `backend/src/index.ts`

---

## 🔧 Environment Setup

### Backend `.env`
```
DATABASE_URL=postgresql://[user]:[pass]@aws-1-eu-west-3.pooler.supabase.com:6543/postgres
NODE_ENV=development
```

### Frontend `.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:49999
NEXT_PUBLIC_STRIPE_KEY=pk_test_xxx
NEXT_PUBLIC_SITE_URL=http://localhost:3006
```

---

## 📦 Tech Stack

**Frontend:**
- Next.js 14, React 18, TypeScript
- Tailwind CSS (premium dark academia design)
- React Hook Form + Zod (validation)
- Lucide icons

**Backend:**
- Express.js, TypeScript, ts-node/ESM
- Prisma (ORM)
- PostgreSQL (via Supabase)
- Raw pg Client (for pooling workarounds)
- SendGrid (email - skeleton only)
- JWT & bcrypt (auth - skeleton only)

**Database:**
- Supabase PostgreSQL
- Prisma migrations

---

## 🎯 Current Status

### Completed This Session ✅
- Added Robyn to database
- Fixed `/api/artists` endpoint
- Fixed CORS configuration
- Booking form artist selector fully working
- Robyn appears in dropdown

### Partially Done ⚠️
- Authentication (structure exists, needs JWT)
- Email service (skeleton, needs SendGrid implementation)
- Artist dashboard (backend routes exist, frontend pages needed)
- Booking status management (database supports it, needs implementation)

### Not Started 🔲
- Artist login page
- Artist dashboard UI
- Image uploads
- Direct messaging
- Payment processing (Stripe)
- Admin dashboard
- Booking reminders
- Consultation handling
- Contact form responses

---

## 🚀 Deployment

### Current Setup
- **Backend:** localhost:49999 (Express)
- **Frontend:** localhost:3006+ (Next.js)
- **Database:** Supabase (shared dev instance)

### Prepare for Production
1. Fix remaining Prisma pooling issues
2. Complete email service (SendGrid)
3. Test booking flow end-to-end
4. Set up production Supabase project
5. Configure Railway (backend)
6. Configure Vercel (frontend)
7. Update CORS with production domain
8. Set environment variables
9. Test on staging
10. Deploy!

### Deployment Commands
```bash
# Backend to Railway
cd backend
railway login
railway link
railway up

# Frontend to Vercel
cd frontend
vercel --prod
```

---

## 📖 Documentation

- **CHECKPOINT.md** - Detailed development checkpoint (full project state)
- **Backend src/setupDb.ts** - Database initialization logic
- **Frontend app/booking/page.tsx** - Booking form with artist selector
- **Backend src/controllers/artistController.ts** - Artist API implementation

---

## 🔐 Important Notes

- **Supabase Pooling:** Always use raw pg Client for direct queries (see artistController.ts)
- **CORS:** Update for production domain before deploying
- **Robyn's Password:** Current hash is placeholder - set real password
- **Email Templates:** Not yet created - needed for notifications
- **Stripe Keys:** Using test keys - need production keys for live payments

---

## 💡 Next Steps (Recommended Order)

1. **Fix Prisma pooling** - Update booking controller (use raw SQL)
2. **Email notifications** - Complete SendGrid integration
3. **Artist authentication** - Implement JWT login for Robyn
4. **Artist dashboard** - Create frontend pages for bookings
5. **Deploy** - Push to Vercel + Railway

---

## 📞 Quick Reference

| Task | Command | Port |
|------|---------|------|
| Backend dev | `PORT=49999 npm run dev` | 49999 |
| Frontend dev | `npm run dev` | 3006-3009 |
| Backend build | `npm run build` | - |
| Frontend build | `npm run build` | - |
| Database status | `curl localhost:49999/api/health` | - |
| Artists API | `curl localhost:49999/api/artists` | - |

---

**Last Updated:** May 10, 2026
**Version:** 0.1.0-alpha
