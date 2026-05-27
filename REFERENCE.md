# Hall of Mirrors — System Reference

> Single source of truth for the Hall of Mirrors Tattoo Studio website. Covers every feature, every file, and every decision. Read this before making any changes.

---

## What This Site Is

**Hall of Mirrors Tattoo Studio** — a private, female-owned tattoo studio at Suite 3, 34 Castle Street, Liverpool, L2 0NR. Owner: **Robyn** (studio admin + resident artist). Second resident artist: **Cristina** (Superstea).

The website serves two audiences:
- **Public** — brand presence, artist portfolio, and the booking entry point
- **Clients** — a logged-in portal to manage their bookings, view messages, sign consent forms, and track appointments
- **Artist (Robyn)** — a private dashboard to manage all bookings, consultations, availability, portfolio, and studio settings

---

## Live URLs

| Service | URL |
|---|---|
| Frontend (Vercel) | https://hall-of-mirrors-tattoo.vercel.app |
| Backend (Railway) | https://hall-of-mirrors-tattoo-production.up.railway.app |
| Custom domain | hallofmirrorstattoo.com *(currently 503 — under construction)* |

### Test Credentials
- **Artists:** `robyn@hallofmirrorstattoo.com` and `cristina@hallofmirrorstattoo.com`. Passwords are never stored in source — initial seed passwords are read from `INITIAL_ROBYN_PASSWORD` / `INITIAL_CRISTINA_PASSWORD` env vars in Railway, or generated randomly at first deploy and printed to the deploy log. Each artist should change their password after first login.
- **Client:** Create via `/client/signup` — any email works

### ⚠️ Site Status — Under Construction
`frontend/middleware.ts` returns HTTP 503 for all requests from `hallofmirrorstattoo.com` and `hallofmirrorstattoo.co.uk`. The Vercel subdomain is unblocked for development access. `app/robots.ts` disallows all crawlers with `Disallow: /`.

**To go live:** delete `middleware.ts`, restore `robots.ts` to allow `/` (disallow `/client/` and `/artist/`), re-add the custom domain in Vercel → Settings → Domains.

---

## Local Development

```bash
# Terminal 1 — Backend
cd /Users/willbangura/hall-of-mirrors-tattoo/backend
PORT=49999 npm run dev

# Terminal 2 — Frontend
cd /Users/willbangura/hall-of-mirrors-tattoo/frontend
npm run dev
```

Backend runs on **port 49999** locally (avoids conflicts). Frontend runs on **port 3000**. The frontend `.env.local` should point `NEXT_PUBLIC_API_URL` to `http://localhost:49999`.

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | Next.js 14 App Router | SSR, metadata, image optimisation |
| Styling | Tailwind CSS v3 + inline styles | Utility classes + design token precision |
| Backend | Express.js + TypeScript | Lightweight, full control over SQL |
| Database | PostgreSQL via Supabase | Managed hosting, storage built in |
| DB client | Raw `pg.Client` (no ORM) | Supabase's pooler has known issues with Prisma/pooled connections; direct client sidesteps all of them |
| Auth | JWT (jsonwebtoken) | Stateless, separate tokens for artist and client |
| File storage | Supabase Storage | Portfolio photos, design ideas, message images |
| Email | SendGrid | Booking notifications to studio and client |
| Frontend hosting | Vercel | CI/CD from GitHub main branch |
| Backend hosting | Railway | Dockerfile-based deploy, auto-scales |
| Repository | GitHub | Private repo, main branch auto-deploys |

**Platform costs (recommended):** Supabase Pro $25/month + Railway Hobby $5/month + Vercel Pro $20/month = **$50/month total**. The Supabase Pro is urgent — free tier pauses after 7 days inactivity.

---

## Frontend Structure

All routes live in `frontend/app/`. The root layout (`app/layout.tsx`) provides the persistent `<Header>` and `<Footer>` — but both are suppressed on dashboard routes.

### Public Pages

| Route | File | Purpose |
|---|---|---|
| `/` | `app/page.tsx` | Homepage — hero carousel, Robyn's founding statement, meet the artists CTA, credentials strip |
| `/about` | `app/about/page.tsx` | Studio info — address, LGBTQ+ inclusive space, LCC licensed, + 3 accordions: How to find us, Aftercare advice, FAQ |
| `/portfolio` | `app/portfolio/page.tsx` | Two-artist portrait grid — Robyn (live) + Christina (placeholder) |
| `/artists/[slug]` | `app/artists/[slug]/page.tsx` | Individual artist profile — bio, specialties, portfolio photo grid, Instagram/booking CTAs |
| `/services` | `app/services/page.tsx` | Service descriptions — custom tattoos, cover-ups, consultations, touch-ups |
| `/booking` | `app/booking/page.tsx` | Multi-step booking form — style, placement, date, time, contact details |
| `/privacy` | `app/privacy/page.tsx` | Privacy policy |
| `/terms` | `app/terms/page.tsx` | Terms and conditions |
| `/cookies` | `app/cookies/page.tsx` | Cookie policy |

### Client Auth Routes

| Route | File | Purpose |
|---|---|---|
| `/client/login` | `app/client/login/page.tsx` | JWT login form |
| `/client/signup` | `app/client/signup/page.tsx` | Registration form |
| `/client/forgot-password` | `app/client/forgot-password/page.tsx` | Request password reset email |
| `/client/reset-password` | `app/client/reset-password/page.tsx` | Reset via token from email |

### Client Dashboard

**Main page:** `app/client/dashboard/page.tsx`

The dashboard uses a fixed floating pill sidebar (desktop) / hamburger overlay (mobile). The root `<Header>` and `<Footer>` are suppressed on this route via `FooterSlot` and a `usePathname` check in `Header.tsx`. A mini-footer is rendered inside `<main>`.

**Tabs** (defined as `ALL_TABS` in `page.tsx`):

| Tab ID | Component | Visible when | Badge |
|---|---|---|---|
| `bookings` | `./bookings.tsx` | Client has ≥1 booking | Count of counter-offered bookings waiting on client |
| `consultations` | `./consultations.tsx` | Client has ≥1 consultation | Sum of unread artist messages |
| `consent-forms` | `./consent-forms.tsx` | Always | Count of unsigned forms |
| `profile` | `./profile.tsx` | Always | — |

If both bookings and consultations are empty (new client), the dashboard opens on consent-forms or profile.

**Separate pages (not tabs):**
- `/client/bookings/[id]` — standalone booking detail page (accessible from email links; also reachable via the inline panel in the bookings tab)
- `/client/consent/[bookingId]` — consent form for a specific booking

### Artist Dashboard

**Main page:** `app/artist/dashboard/page.tsx`

Same floating pill sidebar pattern. Header/footer suppressed.

**Tabs:**

| Tab ID | What it shows |
|---|---|
| `bookings` | All bookings with compact 7-day week strip + detail panel |
| `consultations` | Consultation threads with archive/complete controls |
| `availability` | Month calendar + time slot picker for blocking days/times |
| `stats` | Booking stats, revenue overview |
| `profile` | Artist profile fields (bio, specialties, portrait) + portfolio photo upload grid |

### Artist Auth

| Route | File |
|---|---|
| `/artist/login` | `app/artist/login/page.tsx` |

### Components

| File | Purpose |
|---|---|
| `app/components/Header.tsx` | Site nav — hidden on dashboard routes via `usePathname` |
| `app/components/Footer.tsx` | Async server component — address, links, copyright |
| `app/components/FooterSlot.tsx` | Client wrapper — hides `<Footer>` on dashboard routes |
| `app/components/ShopCarousel.tsx` | Hero carousel with 11 real photos, Ken Burns animations, CSS filter for uniform tone |
| `app/components/AnimatedSection.tsx` | Scroll-triggered fade-in wrapper (IntersectionObserver) |
| `app/components/CursorGlow.tsx` | Ambient gold glow that follows the cursor (desktop only) |
| `app/components/AccordionItem.tsx` | Client component accordion with smooth max-height transition |
| `app/components/AvailabilityCalendar.tsx` | Month calendar for artist availability management |
| `app/components/TimeSlotPicker.tsx` | Time slot selection for artist availability |
| `app/components/BookingActivityLog.tsx` | Timeline component showing booking history (reschedules, counter-offers, cancellations) |

### Lib

| File | Purpose |
|---|---|
| `lib/authContext.tsx` | Artist auth context — JWT storage, login/logout, token refresh |
| `lib/clientAuthContext.tsx` | Client auth context — same pattern, separate tokens |
| `lib/clientProtectedRoute.tsx` | Client route guard — redirects to `/client/login` via `useRouter` if no session |
| `lib/studioSettings.ts` | Typed studio settings helper |

**Important:** Both `authContext.tsx` and `clientProtectedRoute.tsx` use `useRouter().push()` (not `redirect()` from next/navigation) for client-side redirects. This is intentional — calling `redirect()` in a client component causes a NEXT_REDIRECT throw that renders a blank screen.

---

## Backend Structure

Entry point: `src/index.ts`. All routes registered there. Express with Helmet, CORS (list of allowed origins in `index.ts`), rate limiting (100 req/15min), and a global error handler.

### Route Map

| Prefix | File | Who uses it |
|---|---|---|
| `POST /api/auth/login` | `routes/auth.ts` | Artist login |
| `POST /api/auth/logout` | `routes/auth.ts` | Artist logout |
| `GET/PATCH /api/auth/me` | `routes/auth.ts` | Artist profile |
| `POST /api/auth/client/signup` | `routes/clientAuth.ts` | Client registration |
| `POST /api/auth/client/login` | `routes/clientAuth.ts` | Client login |
| `POST /api/auth/client/refresh` | `routes/clientAuth.ts` | Token refresh |
| `GET/PATCH /api/auth/client/me` | `routes/clientAuth.ts` | Client profile (name, phone, address, emergency contact) |
| `POST /api/auth/client/forgot-password` | `routes/clientAuth.ts` | Send reset email |
| `POST /api/auth/client/reset-password` | `routes/clientAuth.ts` | Validate token, update password |
| `GET /api/artist` | `routes/artists.ts` | Public — list all active artists |
| `GET /api/artists/:slug` | `routes/artists.ts` | Public — single artist by slug |
| `GET/PATCH /api/artist/profile` | `routes/artists.ts` | Artist — own profile |
| `GET/POST/DELETE /api/artist/portfolio` | `routes/artists.ts` | Artist — portfolio photos |
| `GET /api/artist/bookings` | `routes/artists.ts` | Artist — all their bookings |
| `GET /api/artist/bookings/:id` | `routes/artists.ts` | Artist — single booking detail |
| `GET /api/artist/bookings/:id/activity` | `routes/artists.ts` | Artist — booking activity log |
| `PATCH /api/bookings/:id` | `routes/bookings.ts` | Artist — update booking status |
| `POST /api/bookings/:id/counter-offer` | `routes/bookings.ts` | Artist — propose new date/time |
| `POST /api/bookings/:id/accept-offer` | `routes/bookings.ts` | Artist — accept client's counter-offer |
| `POST /api/bookings` | `routes/bookings.ts` | Public — create a new booking |
| `GET /api/client/bookings` | `routes/clientBookings.ts` | Client — list their bookings |
| `GET /api/client/bookings/:id` | `routes/clientBookings.ts` | Client — single booking detail |
| `GET /api/client/bookings/:id/activity` | `routes/clientBookings.ts` | Client — booking activity log |
| `PATCH /api/client/bookings/:id` | `routes/clientBookings.ts` | Client — reschedule or cancel |
| `POST /api/client/bookings/:id/counter-offer` | `routes/clientBookings.ts` | Client — propose new date/time |
| `POST /api/client/bookings/:id/accept-offer` | `routes/clientBookings.ts` | Client — accept artist's counter-offer |
| `GET /api/client/design-ideas` | `routes/clientDesign.ts` | Client — list design reference uploads |
| `POST /api/client/design-ideas` | `routes/clientDesign.ts` | Client — upload design reference image |
| `DELETE /api/client/design-ideas/:id` | `routes/clientDesign.ts` | Client — remove upload |
| `GET /api/client/consultations` | `routes/clientConsultation.ts` | Client — list consultations |
| `POST /api/client/consultations` | `routes/clientConsultation.ts` | Client — start a consultation |
| `GET /api/consultations` | `routes/consultations.ts` | Artist — list all consultations |
| `PATCH /api/consultations/:id` | `routes/consultations.ts` | Artist — update status |
| `GET /api/client/consent` | `routes/consent.ts` | Client — consent form status per booking |
| `POST /api/client/consent/:bookingId` | `routes/consent.ts` | Client — submit signed consent form |
| `GET /api/availability` | `routes/availability.ts` | Public — available dates/slots for booking |
| `POST /api/availability/block` | `routes/availability.ts` | Artist — block a date or slot |
| `DELETE /api/availability/block/:id` | `routes/availability.ts` | Artist — unblock |
| `GET /api/client/messages/:bookingId` | `routes/messages.ts` | Client — messages for a booking thread |
| `POST /api/client/messages/:bookingId` | `routes/messages.ts` | Client — send message (JSON or FormData with image) |
| `GET /api/artist/messages/:bookingId` | `routes/messages.ts` | Artist — messages for a booking thread |
| `POST /api/artist/messages/:bookingId` | `routes/messages.ts` | Artist — send message |
| `GET/POST /api/client/consultation-messages/:id` | `routes/messages.ts` | Client — consultation thread messages |
| `GET/POST /api/artist/consultation-messages/:id` | `routes/messages.ts` | Artist — consultation thread messages |
| `GET/POST /api/flash` | `routes/flash.ts` | Public — flash day listings and slot claiming |
| `GET/POST/PATCH /api/artist/flash` | `routes/flash.ts` | Artist — manage flash day events |
| `GET /api/studio-settings` | `routes/studioSettings.ts` | Public — studio info (hours, address, etc.) |
| `PATCH /api/artist/studio-settings` | `routes/studioSettings.ts` | Artist — update studio settings |

### Auth Middleware

- `src/middleware/auth.ts` — verifies artist JWT, attaches `req.artist` to request
- `src/middleware/clientAuth.ts` — verifies client JWT, attaches `req.client` to request

All artist-only routes use `auth` middleware. All client-only routes use `clientAuth` middleware. Public routes (booking creation, artist listing, availability) require no auth.

### Utilities

- `src/utils/logBookingActivity.ts` — `logBookingActivity(client, payload)` — inserts a row into `BookingActivity`. Called after every reschedule, counter-offer, accept, or cancellation. Never throws — failure is logged and silently swallowed so it never breaks the parent operation.
- `src/utils/storage.ts` — `uploadToSupabase(buffer, path, mimeType)` — uploads files to Supabase Storage, returns public URL.

### Services

- `src/services/emailService.ts` — SendGrid integration. Sends booking confirmation to client and notification to studio (`studio@hallofmirrorstattoo.com`).
- `src/services/pdfService.ts` — PDF generation for consent forms.

### Background Jobs

- `src/jobs/reminderJob.ts` — Runs on a schedule. Sends 24-hour appointment reminder emails to clients with upcoming bookings where `reminder_sent_at IS NULL`.

---

## Database

Hosted on Supabase PostgreSQL. Schema managed via `src/setupDb.ts` (runs on server start — idempotent `CREATE TABLE IF NOT EXISTS`). The `BookingActivity` table is created separately via `src/migrations/create_booking_activity.sql` — must be run once manually in the Supabase SQL editor.

**Important:** The backend uses raw `pg.Client` (not pooled, not Prisma). A new `Client` is created and connected per-request in most routes. This is intentional — Supabase's PgBouncer pooler in transaction mode is incompatible with prepared statements and session-level operations that some ORMs rely on.

### Tables

| Table | Purpose |
|---|---|
| `User` | Client accounts — email, password hash, name, phone, address, postcode, emergency contact, password reset token |
| `Artist` | Artist accounts — email, password hash, name, bio, specialties, Instagram, portrait_url, studio_id |
| `Studio` | Studio record (single row: id `hom-studio`) — address, hours, deposit config, social handles |
| `Booking` | Core booking record — status, dates, tattoo details, deposit, counter-offer fields, payment info |
| `BookingActivity` | Immutable log of every scheduling event per booking — actor_type, action, original/proposed date+time, note |
| `Message` | Booking thread messages — booking_id, consultation_id (nullable), sender_type, sender_id, body, image_url, read_at |
| `Consultation` | Consultation threads — user_id, artist_id, initial message, status, preferred dates |
| `ConsentForm` | Signed consent forms — linked 1:1 with a booking, all consent checkboxes, signature name, timestamp |
| `MedicalHistory` | Medical questionnaire — linked 1:1 with a User, all health flags and medications |
| `DesignIdea` | Client reference image uploads — user_id, booking_id (optional), image_url |
| `PortfolioPhoto` | Artist portfolio images — artist_id, public_url, storage_path, display_order |
| `AvailabilityBlock` | Blocked dates/slots set by artist — artist_id, blocked_date, blocked_slot (nullable = full day) |
| `FlashDay` | Flash event records — artist_id, event_date, title, is_active |
| `FlashSlot` | Individual flash designs — flash_day_id, title, price_pence, image_url, claimed_by fields |
| `ConsultationRequest` | Legacy contact form submissions (pre-account system) |
| `ContactFormSubmission` | Legacy general contact form submissions |

### Booking Status Flow

```
pending_review     ← initial state after client submits booking
    ↓
confirmed          ← artist confirms
    ↓
pending_consent    ← system state awaiting client consent form
    ↓
consent_signed     ← client has signed the consent form
    ↓
completed          ← appointment done

Parallel states:
counter_offered    ← either party has proposed a new date/time
cancelled          ← cancelled by either party
```

`counter_offered_by` field (`'artist'` | `'client'`) tracks whose turn it is to respond.

---

## Feature Reference

### Booking Flow

1. Client visits `/booking`, fills in multi-step form (tattoo type, placement, date/time, contact details, deposit acknowledgment)
2. `POST /api/bookings` creates booking with status `pending_review`, sends email to studio
3. Client receives confirmation email with booking reference
4. Artist sees booking in dashboard → accepts, declines, or counter-offers
5. If accepted → status becomes `confirmed` → triggers consent form step
6. Client must sign consent form at `/client/consent/[bookingId]` → status becomes `consent_signed`

### Scheduling Counter-Offers

Either party can propose a new date/time. This uses:
- `Booking.counter_offer_date`, `counter_offer_time`, `counter_offer_note`, `counter_offered_by`
- Status set to `counter_offered`
- Receiving party sees the proposal in their dashboard

**Client view when counter-offered by artist:** Only "Accept this time" and "Cancel booking" — no "Suggest another time" button. If the client wants a different time, they use the booking message thread and the artist updates the date from their side.

**48-hour rule:** When the appointment is within 48 hours, a red "Deposit at risk" warning appears on the reschedule/cancel interface. The deposit is forfeit if rescheduling within this window (policy enforced visually; actual enforcement requires Stripe integration — pending).

### Booking Activity Log

Every scheduling action (reschedule, counter-offer, accept, cancel) is logged to `BookingActivity`. The `BookingActivityLog` component (`app/components/BookingActivityLog.tsx`) renders these as a vertical timeline with:
- Color-coded dots (gold = scheduling change, green = confirmation, red = cancellation)
- Original date shown in strikethrough/muted → proposed date in gold
- Actor label (Artist / You / System)

Shown in both the client booking detail (inline panel in bookings tab) and the artist booking detail panel.

### Messaging (Booking Threads)

Each booking has a message thread between the client and artist. Messages support text and image attachments.

- Client sends: `POST /api/client/messages/:bookingId` — JSON for text-only, FormData when image is attached
- Images uploaded to Supabase Storage via `uploadToSupabase()`, stored as `image_url` on the Message row
- Thread is polled every 8 seconds while the panel is open (interval cleared on unmount)
- Both parties see sender-aligned bubbles (client right, artist left)

### Consultation Threads

Separate from bookings. A client can start a consultation thread from the dashboard without having a booking. These use the `Consultation` table and `Message` rows with `consultation_id` populated (instead of `booking_id`).

- Client: `POST /api/client/consultations`, `GET /api/client/consultations`
- Artist: `GET /api/consultations`, `PATCH /api/consultations/:id` (archive, complete, update status)
- Messages: `/api/client/consultation-messages/:id` and `/api/artist/consultation-messages/:id`

### Consent Forms

When a booking reaches `confirmed` status, the client is prompted to complete a consent form. The form collects:
- Personal details (pre-filled from `User` profile)
- Medical history (MedicalHistory table)
- 10 consent checkboxes
- Digital signature (typed name)
- Photography permission

Route: `/client/consent/[bookingId]`. On submission, `ConsentForm` row is created and booking status advances to `consent_signed`.

### Availability

Artist blocks dates or specific time slots via the Availability tab in their dashboard. The public booking form calls `GET /api/availability` to filter out blocked dates/slots before showing the calendar to the client.

### Portfolio Photos

Artist uploads photos via the Profile tab in their dashboard (merged Settings + Portfolio section). Photos stored in Supabase Storage, referenced in `PortfolioPhoto` table with a `display_order` field. Displayed on the public `/artists/[slug]` page.

### Studio Settings

Single Studio record (`id: 'hom-studio'`) holds address, opening hours, deposit configuration, social links. Editable via artist dashboard. Exposed publicly via `GET /api/studio-settings`.

### Email Notifications (SendGrid)

Configured via `SENDGRID_API_KEY` environment variable on Railway.

Emails sent:
- Booking confirmation → client (with booking reference, date, deposit info)
- Booking notification → `studio@hallofmirrorstattoo.com` (new booking alert)
- 24-hour reminder → client (via `reminderJob.ts` background job)

### Flash Days (Backend Complete, Frontend Removed)

Full flash day system exists in the backend (`FlashDay`, `FlashSlot` tables + `routes/flash.ts`). The public frontend flash page was removed from navigation as a UX decision. The API remains active and can be re-enabled by adding back the frontend page at `app/flash/page.tsx`. The artist can still manage flash days via the API (needs frontend tab restoration if desired).

---

## Design System

### Colour Tokens (defined in `globals.css`)

| Token | Value | Use |
|---|---|---|
| `--bg` | `#0E0C09` | Page background |
| `--gold` | `#C9A84C` | Primary accent, active states, highlights |
| `--cream` | `#F5EFD8` | Primary text colour |
| `--text-mid` | `rgba(245,239,216,0.65)` | Secondary text |
| `--text-low` | `rgba(245,239,216,0.35)` | Muted/disabled text |
| `--border` | `rgba(201,168,76,0.12)` | Subtle borders |
| `--surface` | `rgba(255,255,255,0.03)` | Card backgrounds |

### Typography

| Font | Use |
|---|---|
| Cormorant Garamond | Display headings — italic, weight 300/400 |
| DM Sans | Body text, buttons, UI copy |
| DM Mono | Labels, eyebrows, monospaced details |

Fonts loaded via `next/font/google` in `app/layout.tsx`.

### Key CSS Patterns

- **Floating pill sidebar:** `position: fixed; top: 1.5rem; left: 1.5rem; border-radius: 1.25rem; backdrop-filter: blur(24px);`
- **Animated sections:** `<AnimatedSection>` wraps any content block — fades in from slightly below when scrolled into view
- **Button classes:** `.btn-primary` (gold filled), `.btn-secondary` (gold bordered) — defined in `globals.css`
- **Keyframe animations:** Both `globals.css` and `tailwind.config.js` — Tailwind must know about them for purge safety
- **Image filter (carousel + portfolio):** `brightness(0.87) contrast(1.06) saturate(0.72) sepia(0.08)` — consistent warm editorial tone across all photos

---

## What's Pending / Not Yet Built

| Feature | Status | Notes |
|---|---|---|
| Stripe deposit payments | Not built | DB columns exist (`deposit_amount`, `deposit_paid`, `stripe_charge_id`). Backend needs Stripe webhook handler. |
| Flash days frontend | Removed | Backend API complete. Re-add `app/flash/page.tsx` to restore. |
| Blog system | Not built | Would need `BlogPost` table, admin editor, and `/blog/[slug]` pages |
| Review/testimonials | Not built | `Review` table would need creating; approval workflow; `/testimonials` page to restore |
| SMS reminders | Not built | Would use Twilio alongside existing SendGrid email reminders |
| Second artist (Christina) | Placeholder | `/portfolio` shows a "coming soon" card. Create her artist account when ready. |

---

## Going Live Checklist

1. Delete `frontend/middleware.ts`
2. Update `frontend/app/robots.ts` → `allow: '/'`, `disallow: ['/client/', '/artist/']`
3. Re-add `hallofmirrorstattoo.com` in Vercel → Settings → Domains
4. Upgrade Supabase to Pro ($25/month) — removes 7-day inactivity pause
5. Upgrade Vercel to Pro ($20/month) — required for commercial use under ToS
6. Run `BookingActivity` migration SQL in Supabase SQL editor (if not already done):
   ```sql
   CREATE TABLE IF NOT EXISTS "BookingActivity" (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     booking_id UUID NOT NULL,
     actor_type VARCHAR(10) NOT NULL CHECK (actor_type IN ('artist', 'client', 'system')),
     action VARCHAR(60) NOT NULL,
     original_date DATE, original_time VARCHAR(10),
     proposed_date DATE, proposed_time VARCHAR(10),
     note TEXT,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   CREATE INDEX IF NOT EXISTS idx_booking_activity_booking_id ON "BookingActivity"(booking_id);
   ```
7. Verify `ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS image_url TEXT;` has been run (message images)
8. Test full booking flow end-to-end in production
9. Commit and push — Vercel auto-deploys from `main`
