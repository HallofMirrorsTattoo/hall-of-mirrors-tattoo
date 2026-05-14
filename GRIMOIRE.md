# GRIMOIRE
### Hall of Mirrors Tattoo — Master Record

**Last Updated:** 2026-05-14
**Status:** Production live · Phases 0–5, 6.1, 6.3, 6.4, 6.5, 6.7, 7.3 shipped · Nav streamlined to Home / Portfolio / About · Flash Days teaser in Portfolio · Services absorbed into About (no prices) · Phase 6.2+ roadmap active

> This is the single source of truth for all past work, current state, and future plans.
> Read this at the start of every session. Update it at the end of every session.
> No other plan files. Just this.

---

## The Project

A full-stack booking and portfolio platform built as a gift by Will for his partner **Robyn**, who runs **Hall of Mirrors Tattoo Studio** — a bespoke neo-traditional tattoo studio at Suite 3, 34 Castle Street, Liverpool L2 0NR. Two artists on the platform: Robyn (live) and Christina (pending her details).

---

## Live URLs

| Environment | URL |
|---|---|
| Frontend (Vercel) | https://hall-of-mirrors-tattoo.vercel.app |
| Backend (Railway) | https://hall-of-mirrors-tattoo-production.up.railway.app |

**Test credentials:**
- Artist: `robyn@hallofmirrorstattoo.com` / `robyn123`
- Client: create via `/client/signup`

---

## Local Dev

```bash
# Terminal 1 — Backend (always port 49999)
cd backend && PORT=49999 npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
# → http://localhost:3000

# Deploy: git push origin main → Vercel auto-deploys in ~2 min
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, React 18 |
| Styling | Tailwind CSS v3 + custom `globals.css` design tokens |
| Backend | Node.js + Express.js (TypeScript, ts-node) |
| Database | PostgreSQL via Supabase — raw `pg.Client` (no Prisma queries — pooler bug) |
| Auth | JWT — two isolated systems: artist (`artistAccessToken`) + client (`clientAccessToken`) |
| Email | SendGrid (`@sendgrid/mail`) — `backend/src/services/emailService.ts` |
| File storage | Supabase Storage |
| Hosting | Vercel (frontend) + Railway (backend) |
| Fonts | Cormorant Garamond + DM Sans + DM Mono (Google Fonts) |

---

## Design System

**Tokens** (CSS custom properties in `globals.css :root`):

| Token | Value | Role |
|---|---|---|
| `--bg` | `#0E0C09` | Page background — obsidian warm black |
| `--surface` | `#171410` | Card backgrounds |
| `--surface-2` | `#1D1A15` | Elevated surfaces |
| `--gold` | `#C9A84C` | Primary accent — burnished gold |
| `--gold-bright` | `#E0C876` | Gold hover/shimmer |
| `--gold-muted` | `rgba(201,168,76,0.15)` | Subtle gold tint |
| `--cream` | `#F2EDE0` | Primary text on dark |
| `--text` | `#EDE8D8` | Body text |
| `--text-mid` | `#9A9082` | Secondary text |
| `--text-low` | `#635C52` | Tertiary/muted text |
| `--border` | `#2A2520` | Card borders |
| `--border-light` | `rgba(201,168,76,0.18)` | Subtle gold borders |

**Typography:**

| Role | Font | Weight |
|---|---|---|
| Display / hero | Cormorant Garamond | 300–600 italic always |
| Body | DM Sans | 300–600 |
| Labels / mono | DM Mono | 400–500, uppercase, tracked |

**Key utility classes:** `.glass`, `.card-premium`, `.btn-primary`, `.btn-secondary`, `.eyebrow`, `.reveal`, `.service-row`, `.section-divider`

**Banned patterns (do not use):**
- Gradient text (`background-clip: text`) — use solid `var(--gold)`
- Hard-coded `#2a2a2a` — always `var(--bg)`
- Tailwind light-bg classes inside dark surfaces — use inline `React.CSSProperties`
- Identical card grids — use `.service-row` editorial table pattern
- `btn-primary-icon` — use `<span className="btn-icon">`
- `text-primary-dark` inside cards — use `var(--cream)` / `var(--text)`

---

## What's Been Built

### Phase 0 — Foundation (Complete ✅)
- Client + artist JWT auth, isolated systems
- Password reset flow (forgot → email → reset)
- Client profile editing (`/client/profile`)
- Artist consultation response UI
- SendGrid email service with branded HTML templates
- Fix: Railway ESM crash (`.js` extensions on all local imports)
- Fix: DB pooler URL (session pooler, not IPv6 direct)
- Fix: RLS enabled on all Supabase tables
- Fix: artist dashboard auth race condition

### Phase 1 — Booking Completion (Complete ✅)
- **Availability calendar** — `AvailabilityBlock` table, Mon-start 7×6 grid calendar, custom obsidian/gold `AvailabilityCalendar.tsx`
- **Time slots** — 12×1hr slots (9am–8pm), `appointment_time TEXT` on Booking
- **Duration-aware blocking** — confirmed bookings block start + N hours; pending blocks start only
- **Booking form** — artist selector → calendar → slot picker → design details → summary
- **File uploads** — Supabase Storage for design ideas, file picker UI
- **Artist availability tab** — block whole days or individual slots from dashboard
- **Artist confirm flow** — duration dropdown, live session preview, notify client toggle

### Phase 2 — Consent Forms (Complete ✅)
- `/client/consent/[bookingId]` — medical history (19 fields) + 10 legal checkboxes + typed e-signature
- `ConsentForm` + `MedicalHistory` tables in DB via `setupDb.ts`
- PDFkit server-side PDF generation, emailed to client + studio
- Booking status `pending_consent → confirmed` on submit
- Consent Forms tab in client dashboard

### Phase 3 — Dashboard Excellence + Messaging (Complete ✅)
- **Client dashboard (4 tabs):** Bookings (active/past toggle), Design Ideas, Consultations, Consent Forms
- **Artist dashboard (5 tabs):** Bookings, Calendar (week-view, hour blocks), Consultations, Availability, Stats
- **Direct messaging** — `Message` table; booking threads + consultation threads; both dashboards
- **Upcoming hub strip** — artist dashboard: next confirmed booking glows gold if today
- **Private booking notes** — artist-side, not visible to client
- **Rebook invite** — "Invite to rebook" on completed bookings
- **Aftercare send** — "Send aftercare instructions" button on completed bookings
- **Stats tab** — revenue estimate (£150/hr × duration), booking counts, status breakdown
- **Counter-offer flow** — artist proposes new date/time; client accepts/declines; new `counter_offered` status
- **One-stop booking workspace** — `/client/bookings/[id]` as full workspace: appointment, cancel/reschedule, consent card, aftercare (completed sessions)
- **Cash payment preference** — client selects cash/card on booking form; `payment_method` column on Booking

### Account Management (Complete ✅)
- Stub user activation in-place (no duplicate User row on signup)
- `DELETE /api/auth/client/me` — soft-delete, anonymises PII
- `account_status = 'deleted'` check on login
- Profile Danger Zone with delete confirmation modal
- Post-booking activation panel on `/booking` confirmation
- Signup pre-fills email from `?email=` query param

### Design Elevation (Complete ✅)
- Luxury Phase 3 v2 obsidian/gold system (Ken Burns carousel, cursor glow, scroll reveals)
- Editorial services table (`.service-row`), ghost-numeral credentials strip, dramatic CTA watermark
- Sitewide dark-theme consistency fix — all inner pages on correct `var(--bg)`
- Status badge refactor to inline `React.CSSProperties` (no Tailwind light-bg overrides)
- `PRODUCT.md` created for impeccable skill context

### Emails (11 functions in `emailService.ts`) (Complete ✅)
1. `sendBookingConfirmationToClient` — request received; "Set up your account" link
2. `sendBookingNotificationToStudio` — new booking alert
3. `sendBookingConfirmedToClient` — artist confirmed; start + optional end time
4. `sendReminderToClient` / `sendReminderToArtist` — 24hr before
5. `sendWelcomeEmail` — on client signup
6. `sendPasswordResetEmail` — reset link
7. `sendConsentFormToClient` / `sendConsentFormToStudio` — PDF attached
8. `sendArtistCancellationToClient` — artist cancelled
9. `sendArtistRescheduleToClient` — new date/time after artist reschedule
10. `sendRebookInvite` — post-session rebook prompt
11. `sendConsultationResponseToClient` — artist responded/approved/declined

### Background Jobs (Complete ✅)
- `reminderJob.ts` — `setInterval(1hr)`, 24hr appointment reminders, `reminder_sent_at` idempotency

---

## Current State (2026-05-14)

Phases 0–5, 6.1, 6.3, 6.4, 6.5, 7.3 shipped plus the full studio/artist data separation and portfolio photo work below.

**Studio settings wired to frontend** (commits `036bf46`, `c45dad8`):
- `GET /api/studio-settings` public endpoint — no auth, returns all public studio fields
- `frontend/lib/studioSettings.ts` — shared `StudioSettings` type + `getStudioSettings()` server-side fetch (1h ISR cache)
- Footer: async server component, address + social links live from `Studio` table
- About page: address from DB; `about_section` surfaces here if Robyn writes it in Studio Settings
- Booking step 3: deposit amount note + cancellation hours dynamically from DB

**Artist profile separated from studio settings** (commit `c45dad8`):
- `PATCH /api/artist/profile` — authenticated; updates `full_name`, `bio`, `specialties`, `years_experience`, `instagram_handle` on own Artist row only
- Dashboard Settings tab now has two clearly separated sections:
  - **Your Profile** (top) — artist-specific fields, feeds `/artists/[slug]` and `/portfolio`
  - **Studio Settings** (below) — studio-wide fields, feeds footer, about page, booking policy copy

**Portfolio page fully dynamic** (commit `46666eb`):
- `/portfolio` is now an async server component; fetches from `GET /api/artist` (1h cache)
- All artist content (bio, specialty pills, years experience, Instagram link) comes from `Artist` table
- Artists with bio → full section with gallery grid + "View full profile" + booking CTAs
- Artists without bio → "Coming Soon" state
- No hardcoded artist names anywhere in the file

**About page rewritten** (commit `2e291d5`):
- Studio-focused throughout — no individual artist names
- New copy: studio story, "The Hall of Mirrors Approach" (3 pillars: craft, bespoke, consultation)
- Stats updated: "2 Resident Artists / 100% Bespoke / Private by Appointment"
- CTA changed to "Meet Our Artists" → `/portfolio`
- Proper `metadata` export (title, description, OpenGraph) — location + keyword optimised
- `TattooParlor` JSON-LD structured data populated from studio settings (address, phone, socials)
- Eyebrow: "The Studio" (was "The Artist"); h1: "Where craft becomes permanent"

**Portfolio photo management** (commit `072f305`):
- New `PortfolioPhoto` table — `id, artist_id, public_url, storage_path, display_order, created_at`
- `POST /api/artist/photos` — authenticated; multer upload → Supabase Storage `portfolio/{artist_id}/` prefix; max 20 photos
- `GET /api/artist/photos` — returns own photos ordered by display_order
- `DELETE /api/artist/photos/:id` — removes from DB and triggers storage deletion
- `GET /api/artist` now includes `cover_photo` (first photo subquery) per artist — feeds `/portfolio`
- `GET /api/artist/:slug` now includes full `photos[]` array — feeds `/artists/[slug]`
- Artist dashboard: new **Portfolio tab** (8th tab) — upload button, square photo grid, delete per photo, empty state
- `/artists/[slug]`: `GalleryGrid` component — shows real photos if uploaded, falls back to labelled placeholders
- `/portfolio`: shows `cover_photo` as large portrait image when available, falls back to placeholder card grid

**Settings view/edit mode + Studio seed fix** (commit `d48e7b8`):
- Settings tab UX fully rebuilt — each section now renders saved values as read-only view by default with an "Edit" button; clicking Edit unlocks fields for that section only; Save commits + returns to view; Cancel re-fetches from DB and discards
- Root cause of settings not persisting: `Studio` table had no seed row so all PATCHes hit `UPDATE ... WHERE id = (SELECT id ...) RETURNING *` with 0 matching rows, returning 200 OK but saving nothing
- Fix: `setupDb.ts` now seeds a Studio row with `id = 'hom-studio'` on every server start (`ON CONFLICT DO NOTHING`); PATCH route has fallback upsert if row still missing
- Removed optimistic "✓ SAVED" flash — view mode showing live DB values makes saved state self-evident
- Portfolio page ISR cache reduced from 3600s → 60s; artist slug page same — photos appear on public site within ~1 minute of upload instead of up to 1 hour
- Note: if photos still don't appear after 60–90s, check Supabase Storage → `design-ideas` bucket → ensure `anon` SELECT policy is enabled (public read access)

**Async/await Save fix** (commit `1248dfe`):
- `sectionCard` Save button was firing `onSave()` without awaiting — PATCH executed in background, section closed immediately. If PATCH failed, error was silent and local state looked correct until refresh
- `saveProfile` and `saveSettings` now return `Promise<boolean>` — `true` on success, `false` + error message on failure
- Save button now `async () => { const ok = await onSave(); if (ok !== false) setEditingSection(null); }` — only closes on confirmed success; keeps section open with error visible if PATCH fails

**Artist profile save/load root cause fix + Studio Settings removal + Portrait upload** (commit `5f4e6f2`):
- **Root cause of "nothing saves on refresh"**: `fetchProfile()` read `data.full_name` directly, but `GET /api/auth/me` returns `{ success: true, artist: { full_name, … } }`. Fix: `const a = data.artist ?? data` unwraps the envelope. Profile fields now load correctly on every tab open.
- **Studio Settings stripped from artist dashboard**: removed `StudioSettings` interface, `fetchSettings`, `saveSettings`, all four Studio Settings section cards (Contact & Location, Opening Hours, Booking Policy, Social & About), and all related state (`settingsLoading`, `settingsSaving`, `settingsError`). Artists should not manage studio-wide config. No more "Could not load studio settings" error on tab open.
- **Portrait photo upload**: new `portrait_url TEXT` column on `Artist` table (auto-migrated); `POST /api/artist/portrait` (authenticated, multer, Supabase Storage at `portraits/{artist_id}.{ext}`, upserts on same artist ID); dashboard Settings → Artist Profile card now shows portrait thumbnail in view mode and an "Upload portrait" file button in edit mode; public `/artists/[slug]` page now shows the real portrait in the 4/5 hero box — falls back to letter-initial placeholder if none uploaded
- `getArtistBySlug` and `getAllActiveArtists` both now return `portrait_url`; `getArtistProfile` (`GET /api/auth/me`) also returns `portrait_url`

**Navigation restructure** (commit `bcf96c0`):
- **Header**: nav reduced to 3 links — Home, Portfolio, About. Services and Flash Days removed from top nav.
- **Footer**: Services removed from Navigate column; Flash Days added in its place. New order: Book Appointment, Portfolio, Flash Days, Consultation, About.
- **Portfolio page**: Flash Days teaser section added before the final CTA — 2-column layout explaining flash days (pre-drawn, fixed price, limited) with a "See upcoming flash days ↗" link to `/flash`. Bottom CTA button changed from `/services` to `/about`.
- **About page**: New "What we offer" section added between the Pillars and Find Us sections — four service rows (Bespoke Custom, Free Consultation, Cover-Up & Rework, Touch-Ups & Aftercare) in the same numbered editorial row layout, descriptions only, zero pricing language. Includes Book / Consultation CTAs below the list.
- **Home page**: "All Services & Pricing" button → "About the Studio" linking to `/about`.
- **`/services` redirect**: `next.config.js` now returns a permanent (308) redirect from `/services` → `/about`. Any old bookmarks or search engine links are forwarded cleanly. The `/services/page.tsx` file remains in the codebase but is unreachable in production.
- User journey is now: Home (overview) → Portfolio (meet artists, discover flash days) → About (philosophy, what we offer, credentials, find us) → Book.

**Items still pending user action (not code blockers):**
- [ ] Verify `studio@hallofmirrorstattoo.com` as SendGrid Single Sender
- [ ] Confirm `FRONTEND_URL=https://hall-of-mirrors-tattoo.vercel.app` in Railway env vars
- [ ] Add Christina (need: name, email, password) — she can fill bio/specialties/instagram/photos/portrait herself via dashboard
- [ ] Robyn to fill in Dashboard → Settings → Artist Profile (bio, specialties, instagram, portrait photo) → appears on `/artists/robyn` immediately
- [ ] Robyn to upload portfolio photos via Dashboard → Portfolio tab → appear on site within ~1 min
- [ ] Check Supabase Storage `design-ideas` bucket has public read (anon SELECT policy) if photos/portrait don't surface

---

## Forward Plan

Everything below is unbuilt. Work down the phases in order unless a specific item is pulled forward.

---

### Phase 4 — Frontend Polish ✅ Complete (2026-05-14, commit `7514905`)

All 6 items shipped:
- 4.1 Skeleton loading states — `.skeleton` CSS class, gold-shimmer, card-premium shape. Client bookings, consultations, artist bookings tabs.
- 4.2 Tab micro-animations — `tabFadeIn` keyframe (18s, ease-out-quart), `.tab-content` class, `key={tab}` on both dashboards.
- 4.3 Consultation → Book CTA — gold-tinted panel with Cormorant italic headline + `btn-primary` inside approved consultation cards.
- 4.4 `.ics` calendar download — `GET /api/client/bookings/:id/ics` (RFC 5545), "Add to calendar" DM Mono link on confirmed booking detail.
- 4.5 Referral analytics — Stats tab: "How clients find you" bar-table, computed client-side from existing `referral_source` field.
- 4.6 Loyalty badge — `client_session_count` subquery in `getArtistBookingById`; badge already rendered in artist detail panel, now has real data.

---

### Phase 5 — Small Backend Additions

**4.1 Skeleton loading states**
Replace every "Loading..." label with shimmer card skeletons matching `card-premium` shape. One reusable `<SkeletonCard />`.
Files: `bookings.tsx`, `consultations.tsx`, `design-ideas.tsx`, `consent-forms.tsx`, `artist/dashboard/page.tsx`

**4.2 Tab switch micro-animations**
`opacity: 0→1` + `translateY(6px→0)` on tab content mount. Pure CSS `@keyframes`, no library.
Files: `client/dashboard/page.tsx`, `artist/dashboard/page.tsx`

**4.3 Consultation → Book CTA**
When consultation `status = 'approved'`, show "Ready to book a session?" button linking to `/booking`. Closes the biggest funnel gap.
File: `client/dashboard/consultations.tsx`

**4.4 `.ics` calendar download**
`GET /api/client/bookings/:id/ics` — returns a valid `.ics` file (5 lines of string templating). "Add to calendar" link on booking detail page. Works with Apple Calendar, Outlook, Google.
Files: new backend route + `/client/bookings/[id]/page.tsx`

**4.5 Referral source analytics**
Booking form already captures `referral_source`. Add breakdown to Stats tab: "Instagram: 8, Google: 4, Friend: 3".
Files: stats endpoint + Stats tab section in artist dashboard

**4.6 Client loyalty badge**
"This is Sarah's 3rd session" badge in artist booking detail panel. One `COUNT(*)` subquery on Booking by `user_id`.
Files: booking detail backend response + artist dashboard panel

---

### Phase 5 — Small Backend Additions ✅ Complete (2026-05-14)

**5.1 Post-session review prompt email** — BLOCKED on Google Review URL from Robyn (see Phase 8)

**5.2 Weekly revenue summary email** ✅
- `sendWeeklySummaryToArtist` added to `emailService.ts`
- `sendWeeklySummaries()` in `reminderJob.ts` — Monday-only check, `weekly_summary_last_sent DATE` on Artist for idempotency
- New column: `weekly_summary_last_sent DATE` on `Artist`

**5.3 Pre-appointment intake check** ✅
- `sendIntakeCheckToClient` added to `emailService.ts`
- `sendIntakeChecks()` in `reminderJob.ts` — fires 3 days before, `intake_sent_at` prevents duplicates
- New column: `intake_sent_at TIMESTAMP` on `Booking`

**5.4 Client persistent notes (artist-side)** ✅
- New column: `artist_notes TEXT` on `User` table (returned as `client_artist_notes` in booking queries)
- New endpoint: `PATCH /api/artist/clients/:userId/notes`
- Frontend: "Client notes" textarea in artist booking detail panel, below private booking notes. Saves on User, not Booking. Persists across all bookings for that client.

**5.5 Unread message count per thread** ✅
- `unread_count` subquery added to `getArtistConsultations` (count unread client → artist messages)
- `unread_artist_count` subquery added to client consultations GET endpoint
- Artist "Consultations" tab badge now = sum of real unread message counts
- Client "Consultations" tab badge now = sum of unread artist messages across all threads

---

### Phase 6 — New Features (New DB Tables)

**6.1 Multi-step booking form** ✅ Complete (2026-05-14)
3-step wizard on `/booking`:
- Step 1: Your details (name, email, phone) — validates before advancing
- Step 2: Artist selector + calendar/slot picker + design fields
- Step 3: Summary card, payment preference, policy acknowledgment checkbox, submit
- Consultation mode stays 2-step (details → message)
- `StepIndicator` component with gold active/done states, animated with `.tab-content`
- No backend changes — same `POST /api/bookings`

**6.2 Cancellation waitlist**
Client joins waitlist for cancelled slots. When a confirmed booking cancels, notify waitlisted clients.
- New table: `Waitlist(id, user_id, preferred_date_from, preferred_date_to, created_at)`
- New endpoints: `POST/DELETE /api/client/waitlist`
- New email: `sendWaitlistNotification(user, booking)`

**6.3 Studio settings page** ✅ Complete (2026-05-14, commit `f962a7a`)
- `backend/src/routes/studioSettings.ts` — `GET/PATCH /api/artist/studio-settings` (authenticated) + `GET /api/studio-settings` (public); no new DB tables (Studio table already had all columns)
- Allowlist-based PATCH: only known fields accepted, dynamic `SET` clauses built from request body
- Settings tab added to artist dashboard (`'settings'` in tab union)
- **Note (commit `5f4e6f2`):** Studio Settings sections subsequently removed from artist dashboard — artists should not manage studio-wide config. Studio settings (`/api/artist/studio-settings`) remain available via API for a future admin panel. Dashboard Settings tab now contains only **Your Profile** (artist-specific) — full_name, bio, specialties, years_experience, instagram_handle, portrait_url.

**6.4 Per-artist portfolio page `/artists/[slug]`** ✅ Complete (2026-05-14, updated `072f305`)
- Server component at `app/artists/[slug]/page.tsx` — fetches from `GET /api/artist/:slug`
- Backend: `getArtistBySlug` in `artistController.ts`, slug = `full_name.toLowerCase().replace(/\s+/g, '-')`
- Shows bio, specialties, years experience, Instagram link, booking_count, real photo gallery (or labelled placeholders if none uploaded), "Book with [name]" CTA
- `GalleryGrid` component — real photos from `PortfolioPhoto` table when available; falls back to 6-cell placeholder grid
- Route ordering: `/:slug` registered LAST in `routes/artists.ts` — specific named routes (`/bookings`, `/consultations`, `/photos`) take priority

**6.7 Portfolio photo management** ✅ Complete (2026-05-14, commit `072f305`)
- `PortfolioPhoto` table — `id, artist_id, public_url, storage_path, display_order` (max 20 per artist)
- `POST/GET/DELETE /api/artist/photos` — authenticated; uploads to Supabase Storage `portfolio/` prefix in `design-ideas` bucket
- Artist dashboard: Portfolio tab (8th tab) — photo grid, upload, per-photo delete, empty state
- `/portfolio` shows `cover_photo` (first photo) as portrait hero when uploaded
- `/artists/[slug]` shows full photo grid from `PortfolioPhoto` table

**6.5 SEO foundations** ✅ Complete (2026-05-14)
- `app/sitemap.ts` — dynamic sitemap, fetches artist slugs from API at build time
- `app/robots.ts` — disallows `/client/` and `/artist/` (private portals)
- `app/opengraph-image.tsx` — edge-rendered OG image with brand treatment
- JSON-LD LocalBusiness + TattooShop schema injected in homepage
- JSON-LD AggregateRating + Review schema injected in `/testimonials`
- OpenGraph metadata added to homepage and testimonials
- Metadata export added to testimonials page (was missing title/description)

**6.6 Instagram portfolio embed**
oEmbed API, no API key. Pull last 9 posts from Robyn's Instagram.
Placement: homepage portfolio section + `/artists/robyn`
File: `frontend/app/components/InstagramFeed.tsx`

---

### Phase 7 — Major Integrations

**7.1 Stripe deposit payments ⭐ Highest revenue impact**
Currently zero financial commitment on booking. Wire up:
- Booking form: Stripe Elements card field
- Backend: `POST /api/payments/create-intent`, webhook handler (`payment_intent.succeeded` → `deposit_paid = true`, confirmed email)
- `deposit_paid` column already exists on Booking
- Artist dashboard: deposit paid/unpaid badge
- Env vars needed: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

**7.2 SMS appointment reminders (Twilio)**
More effective than email for same-day nudges.
- 24hr before: "Hi [name], your session with Robyn is tomorrow at [time]. Hall of Mirrors, Castle Street, Liverpool."
- 2hr before: same-day nudge
- New service: `smsService.ts` wrapping Twilio REST
- Env vars: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`

**7.3 Flash day sign-up** ✅ Complete (2026-05-14)
- New tables: `FlashDay`, `FlashSlot` (in `setupDb.ts`)
- `backend/src/routes/flash.ts` — `publicFlashRouter` (GET /api/flash, POST /api/flash/:slotId/claim) + `artistFlashRouter` (full CRUD at /api/artist/flash)
- Atomic claim: UPDATE WHERE is_available = TRUE guards against race conditions
- Image upload: Supabase Storage under `design-ideas/flash/` prefix (reuses existing bucket)
- Email: `sendFlashSlotClaimed` — confirmation to client + studio notification
- `/flash` public page — hero, countdown badges, slot grid, claim modal with validation
- Artist dashboard "Flash Days" tab — create/delete days, add/delete/release slots, view claim details
- "Flash Days" added to site nav (Header.tsx) — subsequently moved off main nav (commit `bcf96c0`); now accessible via Portfolio page teaser and Footer

**7.4 Gift vouchers**
Stripe purchase → unique code emailed to recipient → redeemable against deposit.
- New table: `GiftVoucher(id, code, amount_pence, redeemed_booking_id, purchased_by_email, recipient_email, purchased_at, redeemed_at)`
- New page: `/vouchers`
- Backend: `POST /api/vouchers/purchase` (Stripe), `POST /api/vouchers/redeem`

**7.5 Push / browser notifications**
In-browser notification permission. Poll for new messages so client/artist don't have to refresh.
- Backend: `GET /api/client/notifications/unread`, `GET /api/artist/notifications/unread`
- Frontend: `useNotifications()` hook with `navigator.serviceWorker` + push manager

---

### Phase 8 — Blocked on User Action

These cannot be built until Robyn provides the following:

| Item | What's needed |
|---|---|
| Stripe payments (Phase 7.1) | Create Stripe account → `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PUBLISHABLE_KEY` |
| SMS reminders (Phase 7.2) | Create Twilio account → `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` |
| Review prompt email (Phase 5.1) | Copy "Write a review" link from Google Business Profile |
| Real portfolio photos | Min 9 images for homepage grid |
| Robyn's portrait | Replace mirror-frame placeholder on artist page |
| Studio photos | Carousel + about page |
| Instagram handle confirmed | For embed + footer link |
| TikTok URL | Footer link |
| Christina's details | Name, email, password, bio, specialties, instagram |
| SendGrid verification | Verify `robyn@hallofmirrorstattoo.com` as Single Sender |

---

## Ideas Bank (Lower Priority)

- **Booking hold** — Reserve slot 24h while client confirms budget. Auto-expires with nudge email.
- **Patch test micro-booking** — Separate 30-min booking type, no deposit.
- **Tipping at checkout** — Optional tip field on Stripe payment.
- **Client notification preferences** — `email_reminders BOOLEAN` on User; toggle on profile page.
- **Referral rewards** — Unique referral link per client; discount voucher when referred friend books.
- **Accessibility audit** — ARIA labels, keyboard navigation, focus management (especially modals).
- **Error boundaries** — React `<ErrorBoundary>` wrappers so a tab crash doesn't take down the whole dashboard.
- **Rate limiting** — `express-rate-limit` on booking and auth endpoints.
- **Price estimator** — Interactive tool on `/services`: size + placement + color + complexity → price range.
- **Day-by-day aftercare tracker** — Personalised healing timeline in client dashboard after session.
- **Pre-consultation idea builder** — Guided questionnaire before booking a consultation.
- **Availability snapshot on homepage** — "Next available appointments: [month]" — scarcity signal.

---

## Critical Technical Rules

1. **Tailwind v3 not v4** — `tailwind.config.js` is CJS. v4 syntax breaks the build.
2. **Raw `pg.Client` for all queries** — Prisma throws "prepared statement already exists" with Supabase pooler. Never switch back.
3. **Two isolated auth systems** — `artistAccessToken` and `clientAccessToken` in separate localStorage keys. Middleware files are separate too.
4. **`isLoading` check before auth redirect** — token loads from localStorage in `useEffect` and is briefly null. Never redirect on `accessToken === null` without checking `isLoading === false` first.
5. **`setupDb.ts` is the migration mechanism** — new columns/tables go here as `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` (idempotent). It runs on every backend startup.
6. **All interactive buttons inside forms** — must have `type="button"` or they trigger form submission.
7. **ESM imports need `.js` extension** — all local imports in backend TypeScript files. Missing extensions cause `ENOTFOUND` crashes.
8. **Railway build: `tsc: not found`** — `backend/nixpacks.toml` forces `npm ci --include=dev`. Do not remove that file.
9. **`uuid` package banned** — use `crypto.randomUUID()` instead. uuid v14 crashes on Railway.
10. **Keyframes in both `globals.css` AND `tailwind.config.js`** — intentional. Tailwind JIT won't generate keyframes for inline `style={{ animation }}` props.
11. **Stub-user ownership** — `WHERE b.user_id = $userId OR u.email = $email` on all booking ownership checks. Stub UUID ≠ signup UUID.
12. **`appointment_time` is `HH:MM` start-hour only** — 12 slots, `09:00`–`20:00`. Duration from `estimated_duration_minutes`.
13. **`DesignIdea` PK is `design_idea_id`, not `id`** — use `di.design_idea_id` in SQL.
14. **Ambiguous `id` in JOINs** — always alias (`b.id`, `a.id`) when joining tables that both have an `id` column.
15. **Availability route ordering** — `POST /api/availability/block` and `DELETE /api/availability/block/:id` registered before `GET /api/availability/:artistId`. Do not reorder.
16. **Background is `var(--bg)` = `#0E0C09`** — never hard-code `#2a2a2a`.
17. **No hard-coded artist IDs** — `artist-robyn-001` is legacy. New features look up by DB ID or email.
18. **Supabase pooler URL** — Railway doesn't support IPv6. Always use session pooler (`aws-0-*.pooler.supabase.com:5432`), never the direct connection.
19. **`pdfkit.characterSpacing()` not in @types/pdfkit** — exists at runtime but TypeScript build fails. Don't use it.
20. **Artist confirm `PATCH`** — always include `duration_hours` (1–8) and `notify_end_time` (boolean). Without `duration_hours`, session blocks at 120-min default.
21. **`useSearchParams()` needs `<Suspense>`** — wrap client components using `useSearchParams()` in a Suspense boundary at page level.

---

## File Map

```
frontend/app/
├── layout.tsx                    Root layout: fonts, Header, Footer, CursorGlow
├── globals.css                   ENTIRE design system (tokens, utilities, keyframes)
├── page.tsx                      Homepage (Server Component)
├── booking/page.tsx              Booking form (mode toggle: session / consultation)
├── portfolio/page.tsx            Artists page: fully dynamic from GET /api/artist — bio, specialties, socials, coming-soon state; Flash Days teaser section with /flash link
├── services/page.tsx             RETIRED — permanent redirect → /about via next.config.js
├── about/page.tsx                Studio identity — story, vision, "What we offer" (4 services no prices), credentials, JSON-LD TattooParlor schema (no artist names)
├── contact/page.tsx              Contact form
├── aftercare/page.tsx            Aftercare instructions
├── artist/
│   ├── login/page.tsx
│   └── dashboard/page.tsx        8 tabs: Bookings, Calendar, Consultations, Availability, Stats, Flash Days, Portfolio, Settings
├── client/
│   ├── login/page.tsx
│   ├── signup/page.tsx           Pre-fills email from ?email= param
│   ├── forgot-password/page.tsx
│   ├── reset-password/page.tsx
│   ├── profile/page.tsx          Edit details + Danger Zone (delete account)
│   ├── dashboard/
│   │   ├── page.tsx              4-tab dashboard shell
│   │   ├── bookings.tsx          Active/past toggle, consent banner, countdown
│   │   ├── design-ideas.tsx      File upload + gallery
│   │   ├── consultations.tsx     Unified comms hub (booking threads + consultation threads)
│   │   └── consent-forms.tsx     Sign / view consent forms
│   ├── consent/[bookingId]/page.tsx  Digital consent form
│   └── bookings/[id]/page.tsx    Full booking workspace
└── components/
    ├── Header.tsx                Dark glass nav, scroll opacity, mobile menu
    ├── Footer.tsx                Async server component — address + social links live from Studio table
    ├── ShopCarousel.tsx          Ken Burns carousel
    ├── AnimatedSection.tsx       IntersectionObserver scroll reveal wrapper
    ├── CursorGlow.tsx            Tracks mouse → --cursor-x/--cursor-y
    ├── AvailabilityCalendar.tsx  Custom obsidian/gold calendar
    └── TimeSlotPicker.tsx        12×1hr slot grid

frontend/lib/
├── studioSettings.ts             StudioSettings type + getStudioSettings() — server-side fetch, 1h ISR cache
├── authContext.tsx               Artist JWT context
├── clientAuthContext.tsx         Client JWT context
└── clientProtectedRoute.tsx      Client-side auth guard

backend/src/
├── index.ts                      Express app, middleware, route mounting
├── setupDb.ts                    Idempotent migrations — runs on every startup
├── controllers/
│   ├── artistController.ts       Artist profile, bookings, consultations
│   ├── availabilityController.ts Block/unblock + getArtistAvailability
│   ├── clientAuthController.ts   Client auth, profile, account delete
│   ├── bookingController.ts      Booking CRUD + email triggers + slot validation
│   ├── consentController.ts      Consent form CRUD + PDF generation
│   └── consultationController.ts Public consultation requests
├── routes/                       One file per resource
├── middleware/
│   ├── auth.ts                   Artist JWT
│   └── clientAuth.ts             Client JWT
└── services/
    ├── emailService.ts           11 SendGrid email functions
    └── pdfService.ts             PDFkit consent form generation
```

---

## Homepage Sections

1. **Hero** — full-viewport Ken Burns carousel, "Hall of Mirrors" italic CSS watermark, logo + radial glow, tagline, two CTAs (Book / Portfolio), DM Mono scroll indicator
2. **Credentials strip** — 3-col, LEFT-aligned, ghost Roman numerals (I/II/III) at 7rem italic
3. **Portfolio "The Work"** — asymmetric 8-col grid (5+3 alternating), ghost numeral watermarks, scroll reveals
4. **The Artist** — 2-col split, stats row (8+ / 100% / 1:1), mirror-frame photo placeholder
5. **Services** — editorial numbered table (`.service-row`): numeral + hairline + title/description
6. **Final CTA** — "Begin." atmospheric watermark at `clamp(6rem, 20vw, 16rem)`, dual radial glows, DM Mono location line

`<div class="section-divider"><span>HOM</span></div>` between each section.

---

## Database Tables

| Table | Key Notes |
|---|---|
| User | `password_hash = ''` = stub; `account_status = 'deleted'` = soft-deleted (PII anonymised) |
| Artist | `is_active`, `instagram_handle`, `portrait_url` (nullable, Supabase Storage URL), one row per artist |
| Booking | `appointment_date_time`, `appointment_time` (HH:MM start), `estimated_duration_minutes`, `notify_end_time`, `payment_method`, `counter_offer_*` columns |
| AvailabilityBlock | `blocked_date DATE`, `blocked_slot TEXT` (null = whole day) |
| Consultation | `status`: pending / approved / declined / responded; `status_updated_at` |
| ConsultationRequest | Public lead form submissions (not authenticated) |
| Message | `booking_id` OR `consultation_id` (one set per row, never both); `read_at` |
| ConsentForm | One per booking (UNIQUE on `booking_id`); `form_reference_no` |
| MedicalHistory | One per user (UNIQUE on `user_id`) |
| DesignIdea | PK is `design_idea_id` (not `id`); `image_url` is Supabase Storage URL |
| ContactFormSubmission | General contact form |

---

*Updated at end of each session. This is the only plan file.*
