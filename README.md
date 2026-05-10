# Hall of Mirrors Tattoo Studio Website

A professional tattoo studio website with client booking system, admin dashboard, and automated email notifications.

## Project Structure

```
hall-of-mirrors-tattoo/
├── frontend/          # Next.js + React + Tailwind CSS
├── backend/           # Express.js + Node.js
├── docs/              # Documentation
└── README.md
```

## Tech Stack

**Frontend:**
- Next.js 14+
- React 18+
- Tailwind CSS
- React Hook Form + Zod

**Backend:**
- Node.js 18+
- Express.js
- PostgreSQL
- Prisma ORM

**Services:**
- Stripe (payments)
- PayPal (payments)
- SendGrid (email)
- AWS S3 (file storage)

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+
- Git

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`

### Backend Setup

```bash
cd backend
npm install
npm run dev
```

Backend runs on `http://localhost:5000`

### Database Setup

```bash
cd backend
npx prisma migrate dev
npx prisma db seed
```

## Environment Variables

Copy `.env.example` files to `.env.local` in both frontend and backend directories.

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_STRIPE_KEY=pk_test_xxx
```

### Backend (.env.local)
```
DATABASE_URL=postgresql://user:password@localhost:5432/hallofmirrors
JWT_SECRET=your_secret_key
STRIPE_SECRET_KEY=sk_test_xxx
```

## Development Phases

- **Phase 1:** Core booking system (public pages + guest booking + consent form)
- **Phase 2:** Admin dashboard + client accounts
- **Phase 3:** Reviews system + analytics + refinements

## Documentation

See `/docs/DESIGN_REFERENCE.md` for full feature specifications.
