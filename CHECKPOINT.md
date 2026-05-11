# Hall of Mirrors Tattoo — Master Checkpoint

**Last Updated:** May 11, 2026 — Phase 2 complete (commits `840ed93`, `2a827a1`, `54f8620`)
**Status:** Production Live ✅ | Phase 0 done | Phase 2 (consent form) done | DB connection fixed

---

## What This Is

A full-stack booking and portfolio website built as a gift by Will for his partner **Robyn**, who runs **Hall of Mirrors Tattoo Studio** — a bespoke neo-traditional tattoo studio at Suite 3, 34 Castle Street, Liverpool L2 0NR.

This is the canonical reference document. Read this before every session.

---

## Live URLs

| Environment | URL |
|---|---|
| **Frontend (Vercel)** | https://hall-of-mirrors-tattoo.vercel.app |
| **Backend (Railway)** | https://hall-of-mirrors-tattoo-production.up.railway.app |
| **GitHub** | (check `git remote -v` from project root) |

**Test credentials:**
- Artist login: `robyn@hallofmirrorstattoo.com` / `robyn123`
- Client: create via `/client/signup` on any environment

---

## Local Development

```bash
# Terminal 1 — Backend (always on port 49999)
cd /Users/willbangura/hall-of-mirrors-tattoo/backend
PORT=49999 npm run dev

# Terminal 2 — Frontend
cd /Users/willbangura/hall-of-mirrors-tattoo/frontend
npm run dev
# Opens on http://localhost:3000 (or next available port)
```

**Deploy:** `git push origin main` → Vercel auto-deploys frontend within ~2 minutes.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, React 18 |
| Styling | Tailwind CSS v3 + custom `globals.css` design tokens |
| Backend | Node.js + Express.js (TypeScript, ts-node) |
| Database | PostgreSQL via Supabase (Prisma schema + raw `pg.Client` for queries) |
| Auth | JWT — two separate systems: artist auth + client auth |
| Email | SendGrid (`@sendgrid/mail`) — `backend/src/services/emailService.ts` |
| File storage | Supabase Storage (not yet wired up — Phase 1) |
| Frontend hosting | Vercel (auto-deploy from `main`) |
| Backend hosting | Railway |
| Fonts | Google Fonts: Cormorant Garamond + DM Sans + DM Mono |

**Critical:** Tailwind v3 (not v4). Do not use v4 syntax. Config is `tailwind.config.js` (CJS).

---

## Artists on the Platform

Two artists are planned. Robyn exists in the DB. Christina is pending (need her name, email, password, bio, instagram handle from Robyn before adding).

| Artist | Email | ID | Status |
|---|---|---|---|
| Robyn | `robyn@hallofmirrorstattoo.com` | `artist-robyn-001` | Live in DB |
| Christina | TBD | TBD | Pending — need details |

**Rule for new code:** Never hard-code `artist-robyn-001`. Always look up by DB ID or email. All artist features (availability, bookings, portfolio, consultations) must support N artists.

---

## Design System (Phase 3 v2 — Current)

This is the definitive design. All future work uses this system.

### Colour Tokens (CSS custom properties in `globals.css` `:root`)

| Token | Value | Usage |
|---|---|---|
| `--bg` | `#0E0C09` | Page background — obsidian warm black |
| `--surface` | `#171410` | Card backgrounds |
| `--surface-2` | `#1D1A15` | Elevated surfaces |
| `--gold` | `#C9A84C` | Primary accent — burnished gold |
| `--gold-bright` | `#E0C876` | Gold hover/shimmer highlight |
| `--gold-muted` | `rgba(201,168,76,0.15)` | Subtle gold tint |
| `--cream` | `#F2EDE0` | Primary text on dark |
| `--text` | `#EDE8D8` | Body text |
| `--text-mid` | `#9A9082` | Secondary text |
| `--text-low` | `#635C52` | Tertiary/muted text |
| `--border` | `#2A2520` | Card borders |
| `--border-light` | `rgba(201,168,76,0.18)` | Subtle gold borders |
| `--cursor-x` | `50%` | Set dynamically by CursorGlow.tsx |
| `--cursor-y` | `50%` | Set dynamically by CursorGlow.tsx |

### Typography

| Role | Font | Weight | Notes |
|---|---|---|---|
| Display / hero headings | Cormorant Garamond | 300–600 italic | `font-style: italic` always |
| Body text | DM Sans | 300–600 | System-ui fallback |
| Labels / eyebrows / mono | DM Mono | 400–500 | Uppercase, tracked |

All fonts imported via Google Fonts at top of `globals.css`.

### CSS Utility Classes (defined in `globals.css`)

| Class | Description |
|---|---|
| `.glass` | Dark glassmorphism — `rgba(23,20,16,0.75)` + `backdrop-filter: blur(20px)` + gold border |
| `.glass-light` | Light glassmorphism — cream-tinted |
| `.card-premium` | Surface card — `border-radius: 0.75rem`, hover gold border + glow (no translateY lift) |
| `.btn-primary` | Gold pill button with shimmer on hover |
| `.btn-secondary` | Transparent pill button with gold border |
| `.eyebrow` | DM Mono, uppercase, gold, 0.6875rem, 0.25em tracking |
| `.reveal` | Hidden state for scroll reveals (opacity:0, translateY 28px) |
| `.reveal.visible` | Revealed state — added by AnimatedSection.tsx IntersectionObserver |
| `.reveal-delay-1` through `.reveal-delay-5` | Stagger delays (0.1s–0.55s) |
| `.reveal-left` / `.reveal-left.visible` | Horizontal directional reveal variant |
| `.section-divider` | Full-width gold gradient line with centred text |
| `.footer-link` | DM Sans footer nav link with gold hover |
| `.footer-social` | DM Mono uppercase social link with gold hover |
| `.text-gold-solid` | Solid gold emphasis text (replaces removed `.text-gold-shimmer`) |
| `.text-gold` / `.text-cream` / `.text-mid` / `.text-low` | Colour utilities |
| `.bg-surface` / `.bg-surface-2` | Surface background utilities |
| `.service-row` | Editorial service table row — CSS grid: numeral / hairline / content |
| `.service-num` | Large italic Cormorant numeral (gold, dims to 0.4 opacity, brightens on hover) |
| `.service-divider` | 1px vertical hairline — brightens gold on `.service-row:hover` |

### Animations

All keyframes are defined in BOTH `globals.css` AND `tailwind.config.js`. This is intentional.

| Keyframe | Usage |
|---|---|
| `kenBurns` | Carousel images — slow zoom `scale(1.0) → scale(1.12)` over 8s |
| `fadeUp` | Elements entering viewport |
| `fadeIn` | Opacity-only fade |
| `float` | Gentle vertical bob |
| `pulseGlow` | Logo radial glow pulse |
| `shimmer` | Background shimmer (background-position only — not used on text) |
| `lineIn` | Decorative lines drawing in from left |
| `drawLine` | Horizontal line draw (scaleX 0→1, transform-origin: left) |
| `slideUp` | Opacity + translateY entry (alternative to fadeUp) |

---

## Frontend File Structure

```
frontend/
├── app/
│   ├── layout.tsx              — Root layout: fonts preconnect, Header, Footer, CursorGlow
│   ├── globals.css             — ENTIRE design system (tokens, typography, utilities, keyframes)
│   ├── page.tsx                — Homepage (Server Component — no 'use client')
│   ├── booking/page.tsx        — Booking form with artist selector
│   ├── portfolio/page.tsx      — Gallery (placeholder — needs Robyn's photos)
│   ├── services/page.tsx       — Services detail pages
│   ├── about/page.tsx          — About / studio story (placeholder)
│   ├── contact/page.tsx        — Contact form
│   ├── artist/
│   │   ├── login/page.tsx      — Artist login
│   │   └── dashboard/page.tsx  — Artist dashboard (bookings tab + consultations tab with response UI)
│   ├── client/
│   │   ├── login/page.tsx      — Includes "Forgot your password?" link
│   │   ├── signup/page.tsx
│   │   ├── forgot-password/page.tsx  — Email form → sends reset link
│   │   ├── reset-password/page.tsx   — Token + new password form (reads token from URL)
│   │   ├── profile/page.tsx          — Edit name, phone, address, emergency contact
│   │   ├── dashboard/
│   │   │   ├── page.tsx        — 4-tab dashboard (bookings / design ideas / consultations / consent forms)
│   │   │   ├── bookings.tsx
│   │   │   ├── design-ideas.tsx
│   │   │   ├── consultations.tsx
│   │   │   └── consent-forms.tsx  — Lists bookings with consent status + "Sign now" CTA
│   │   ├── consent/[bookingId]/page.tsx — Full consent form (medical history + checkboxes + signature)
│   │   └── bookings/[id]/page.tsx — Booking detail view
│   └── components/
│       ├── Header.tsx          — 'use client' — dark glass nav, scroll opacity, active link, mobile menu
│       ├── Footer.tsx          — 'use client' — editorial 12-col grid, CSS-only hover states
│       ├── ShopCarousel.tsx    — Ken Burns carousel with prev/next navigation
│       ├── AnimatedSection.tsx — 'use client' — IntersectionObserver scroll reveal wrapper
│       ├── CursorGlow.tsx      — 'use client' — tracks mouse, sets --cursor-x/--cursor-y on :root
│       └── ScrollGradientFade.tsx — Gradient overlay at bottom of carousel
├── lib/
│   ├── authContext.tsx         — Artist JWT auth context + localStorage
│   ├── clientAuthContext.tsx   — Client JWT auth context + localStorage (separate)
│   └── clientProtectedRoute.tsx — Route guard for client pages
├── public/
│   └── assets/
│       └── logos/
│           ├── White Logo.png       — Icon only (used in nav, footer)
│           └── White Logo Text.png  — Text lockup (used in footer)
├── tailwind.config.js          — v3 config with gold/obsidian tokens + font families + animations
├── PRODUCT.md                  — Brand/user context for the impeccable design skill
└── .env.local                  — NEXT_PUBLIC_API_URL=http://localhost:49999
```

### Key Component Rules

- **`AnimatedSection.tsx`** must be `'use client'` — uses `useRef`, `useEffect`, `IntersectionObserver`
- **`CursorGlow.tsx`** must be `'use client'` — uses `useEffect`, `window.addEventListener`
- **`Footer.tsx`** must be `'use client'` — avoids RSC serialisation errors with Next.js hydration
- **`Header.tsx`** must be `'use client'` — uses `usePathname`, `useEffect`, scroll listener
- **`page.tsx`** (homepage) is a **Server Component** — no event handlers, no `useState`, no `useEffect`
- Never put `as React.CSSProperties` in a Server Component — import React first or remove the cast
- **Artist dashboard / any auth-gated page:** always check `isLoading` from `useAuth()` before acting on `accessToken === null` — the token loads from localStorage in a useEffect and is briefly null on first render. Redirecting before `isLoading` is false causes a blank screen.

---

## Homepage Sections (page.tsx)

1. **Hero** — full-viewport sticky carousel (Ken Burns), "Hall of Mirrors" italic CSS watermark, logo + radial glow, italic tagline, two CTA buttons (Book / Portfolio), DM Mono scroll indicator
2. **Credentials strip** — 3-col bar, LEFT-aligned text, ghost Roman numerals (I/II/III) at 7rem italic as per-column visual anchors, `py-12` height
3. **Portfolio "The Work"** — asymmetric 8-col grid (5+3 alternating rows), ghost Roman numeral watermarks, scroll reveals, DM Mono/Cormorant card labels. Heading: `clamp(3.5rem, 8vw, 6rem)`.
4. **The Artist** — 2-col split, Cormorant italic heading at `clamp(3rem, 7vw, 5.5rem)`, bio paragraphs, stats row (8+ / 100% / 1:1), mirror-frame photo placeholder
5. **Services** — editorial numbered table (`.service-row`): large italic Cormorant numeral left + 1px hairline divider + title/description right. Heading: `clamp(3rem, 7vw, 5.5rem)`. Hover illuminates numeral and hairline gold.
6. **Final CTA** — atmospheric "Begin." watermark at `clamp(6rem, 20vw, 16rem)`, dual radial glows, DM Mono location line (`Suite 3 · Castle Street · Liverpool`), heading at `clamp(3rem, 7vw, 5.5rem)`. No logo.

`<div class="section-divider"><span>HOM</span></div>` appears between each section.

---

## Backend API Endpoints

Base URL local: `http://localhost:49999`
Base URL production: `https://hall-of-mirrors-tattoo-production.up.railway.app`

### Public
| Method | Path | Description |
|---|---|---|
| GET | `/api/artists` | List active artists (used by booking form) |
| POST | `/api/bookings` | Create a booking (no auth required) |
| POST | `/api/contact` | Submit contact form |

### Client Auth
| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/client/signup` | Register new client (sends welcome email) |
| POST | `/api/auth/client/login` | Login → returns JWT |
| POST | `/api/auth/client/activate` | Activate guest account |
| POST | `/api/auth/client/forgot-password` | Send password reset email |
| POST | `/api/auth/client/reset-password` | Verify token + set new password |
| GET | `/api/auth/client/me` | Get client profile (auth required) |
| PATCH | `/api/auth/client/me` | Update client profile (auth required) |
| GET | `/api/client/bookings` | Client's own bookings |
| GET | `/api/client/bookings/:id` | Single booking detail |
| PATCH | `/api/client/bookings/:id` | Cancel a booking |
| POST | `/api/client/design-ideas` | Upload design idea (URL-based) |
| GET | `/api/client/design-ideas` | Client's design ideas |
| DELETE | `/api/client/design-ideas/:id` | Delete design idea |
| POST | `/api/client/consultations` | Request consultation (logged-in clients) |
| GET | `/api/client/consultations` | Client's consultations |

### Client Consent
| Method | Path | Description |
|---|---|---|
| GET | `/api/client/consent` | All bookings with consent form status for this client |
| GET | `/api/client/consent/:bookingId` | Fetch existing form + booking + profile for pre-fill |
| POST | `/api/client/consent/:bookingId` | Submit consent form → save DB + generate PDF + email + set booking confirmed |

### Artist Auth
| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/artist/login` | Artist login → returns JWT |
| GET | `/api/artist/bookings` | All bookings for this artist |
| PATCH | `/api/artist/bookings/:id` | Accept / reject / complete booking |
| GET | `/api/artist/consultations` | All consultation requests for this artist |
| PATCH | `/api/artist/consultations/:id` | Respond to a consultation (sends email to client) |

### Key Backend Files
```
backend/src/
├── index.ts                    — Express app, middleware, route mounting
├── controllers/
│   ├── artistController.ts     — Artist profile, consultations, response
│   ├── clientAuthController.ts — Client auth, forgot/reset password, profile update
│   ├── bookingController.ts    — Booking CRUD (uses raw pg.Client) + email triggers
│   ├── consentController.ts    — Consent form CRUD + PDF generation trigger
│   └── consultationController.ts — Public consultation requests
├── routes/                     — One file per resource group
│   └── consent.ts              — /api/client/consent routes (client-auth protected)
├── middleware/
│   ├── auth.ts                 — Artist JWT middleware
│   └── clientAuth.ts           — Client JWT middleware
└── services/
    ├── emailService.ts         — SendGrid: 7 email types with brand HTML templates
    └── pdfService.ts           — pdfkit PDF generation for consent forms
```

**Supabase pooling workaround:** Prisma throws "prepared statement already exists" with Supabase's pooler. All production queries use raw `pg.Client` instead of Prisma.

---

## Email Service (`backend/src/services/emailService.ts`)

All email is non-blocking — email failures never block API responses.

| Function | Trigger | Status |
|---|---|---|
| `sendBookingConfirmationToClient` | After POST /api/bookings | ✅ Built |
| `sendBookingNotificationToStudio` | After POST /api/bookings | ✅ Built |
| `sendWelcomeEmail` | After client signup | ✅ Built |
| `sendPasswordResetEmail` | Forgot password request | ✅ Built |
| `sendConsultationResponseToClient` | Artist responds to consultation | ✅ Built |
| `sendConsentFormToClient` | After consent form submitted | ✅ Built — sends PDF attachment |
| `sendConsentFormToStudio` | After consent form submitted | ✅ Built — sends PDF attachment |

**SendGrid setup required in Railway env vars:**
- `SENDGRID_API_KEY` — your SendGrid API key
- `SENDGRID_FROM_EMAIL` — `studio@hallofmirrorstattoo.com`
- `STUDIO_EMAIL` — `studio@hallofmirrorstattoo.com`
- `FRONTEND_URL` — `https://hall-of-mirrors-tattoo.vercel.app`

**Critical:** `studio@hallofmirrorstattoo.com` must be verified as a Single Sender in SendGrid (Settings → Sender Authentication → Verify a Single Sender). Without this, all emails fail with 403 regardless of the API key being correct.

---

## Full Product Roadmap

The full roadmap is documented in the plan file:
`/Users/willbangura/.claude/plans/effervescent-spinning-eagle.md`

### Summary by Phase

| Phase | Focus | Status |
|---|---|---|
| **0** | Foundation fixes (emails, password reset, profile, artist consultations) | ✅ Complete |
| **1** | Booking completion (availability calendar, file uploads, Stripe deposits) | Next |
| **2** | Legal & medical (digital consent form, PDF backup to Google Drive) | After Phase 1 |
| **3** | Dashboard excellence (GetInk-style client/artist hubs, direct messaging) | After Phase 2 |
| **4** | Social & media (Instagram embed, YouTube, TikTok, artist social links) | After Phase 3 |
| **5** | Engagement & revenue (reviews, automated reminders, waitlist, gift vouchers) | After Phase 4 |
| **6** | Innovation differentiators (flash designs, aftercare tracker, price estimator) | After Phase 5 |
| **7** | Content & media (portfolio, about page, SEO — pending real photos from Robyn) | When assets ready |

### Key Decisions (Locked)
- **File storage:** Supabase Storage for all website files; Google Drive for consent form PDF backups only
- **Consent form signing:** Typed name + checkbox (legally valid, works on all devices)
- **Availability calendar:** Option A (blocking) or B (explicit slots) — pending Robyn/Christina's preference
- **Artists:** Robyn + Christina. Christina's DB record pending her details.

---

## What's Done ✅

- Full booking system (form → backend → database → both emails sent)
- Artist auth + JWT + rebuilt dashboard (bookings tab, consultations tab with response UI)
- Client auth + JWT + dashboard (4 tabs: bookings, design ideas, consultations, consent forms)
- Client profile editing page (`/client/profile`)
- Password reset flow (forgot-password → email → reset-password)
- Email service with 7 branded HTML templates including PDF attachments (obsidian/gold design)
- `Consultation`, `ConsentForm`, `MedicalHistory` tables added to DB schema via setupDb.ts
- `password_reset_token` + `password_reset_expires` columns on User table
- **Phase 2: Digital consent form** — `/client/consent/[bookingId]` with medical history (19 fields), 10 legal checkboxes, typed name e-signature; pdfkit PDF generated on submit, emailed to client + studio, booking flipped to `confirmed`
- **Fix: Railway ESM crash** — three route files were importing `clientAuth` without `.js` extension; fixed all three
- **Fix: DB connection** — Railway was pointing to old IPv6 Supabase hostname; updated to session pooler URL (`aws-0-*.pooler.supabase.com`)
- **Fix: RLS enabled** on all Supabase tables (User, Artist, Booking, Consultation, ConsultationRequest, ContactFormSubmission, Studio, ConsentForm, MedicalHistory, DesignIdea, Review, MedicalHistory, Payment, TattooPortfolio)
- Fix: artist dashboard race condition (blank screen on load) — waits for `isLoading`
- Fix: Robyn's password hash corrected (old hash was fabricated, not a valid bcrypt of robyn123)
- Luxury Phase 3 v2 redesign (obsidian palette, Cormorant Garamond, Ken Burns, cursor glow, scroll reveals)
- Design elevation (editorial services table, ghost-numeral credentials strip, dramatic CTA)
- `frontend/PRODUCT.md` created (impeccable skill context file)
- Production deployment on Vercel + Railway

---

## What's Still To Do ⚠️

### Immediate (before Phase 1)
- [ ] Verify `studio@hallofmirrorstattoo.com` as a SendGrid Single Sender (required for all email to work)
- [ ] Confirm `FRONTEND_URL=https://hall-of-mirrors-tattoo.vercel.app` is set in Railway env vars
- [ ] Add Christina as second artist (need: full name, email, password, bio, instagram handle from Robyn)
- [ ] Add real Instagram + TikTok URLs to footer (currently `href="#"`)

### Phase 1 — Booking Completion
- [ ] Availability calendar (Robyn/Christina to decide: Option A blocking vs Option B explicit slots)
- [ ] File uploads for design ideas (currently URL-only — use Supabase Storage)
- [ ] Stripe deposit payments (collect deposit on booking → Payment model has `stripe_charge_id`)

### Phase 2 — already done ✅ (consent form shipped)

### Later phases — see roadmap file

### Assets Needed from Robyn
- [ ] Real portfolio photos (replace placeholder dark cards in homepage grid)
- [ ] Robyn's portrait photo (replace mirror-frame placeholder in Artist section)
- [ ] Studio photos (for carousel, about page)
- [ ] Instagram URL + TikTok URL
- [ ] Christina's artist details (name, email, password, bio, instagram)

---

## Deployment

```bash
# From project root — triggers Vercel auto-deploy
git add -A
git commit -m "Your message"
git push origin main
```

Vercel builds from `main` branch. Build command: `npm run build`. Output: `.next/`.
Railway backend deploys separately — check Railway dashboard for backend deploys.

---

## Known Gotchas

1. **Tailwind v3 not v4** — `tailwind.config.js` uses CJS exports. v4 syntax (`@import "tailwindcss"`) will break the build.
2. **Keyframes in globals.css AND tailwind.config.js** — intentional duplication. Tailwind only generates keyframe CSS for `animate-*` classes used in scanned content; keyframes used in inline `style={{ animation }}` props need to be in globals.css directly.
3. **Footer and AnimatedSection must be `'use client'`** — Next.js App Router will throw serialisation errors otherwise.
4. **No `blur()` in CSS `transform`** — `blur()` is a `filter` function. Use `filter: blur()` separately.
5. **Stale `.next` cache** — if you add new client components and see manifest errors, run `rm -rf frontend/.next` and restart the dev server.
6. **Two separate auth systems** — artist tokens (`artistAccessToken` in localStorage) and client tokens (`clientAccessToken`) are completely isolated. Middleware files are different too.
7. **Supabase prepared statements** — use raw `pg.Client` for all production queries. Never switch back to Prisma client for Supabase-pooled connections.
8. **Artist auth race condition** — auth context loads the token from localStorage in a `useEffect`, so `accessToken` is null on first render. Always check `isLoading` from `useAuth()` before treating null as "not logged in". Failing to do this causes immediate redirect to login (blank screen).
9. **No gradient text** — `background-clip: text` with a gradient is banned. Use solid `var(--gold)` with font-weight for emphasis.
10. **No identical card grids** — use the `.service-row` editorial table pattern instead.
11. **No hard-coded artist IDs in new code** — `artist-robyn-001` exists in legacy code. New features must look up by DB ID or email to support multiple artists.
12. **SendGrid sender verification** — `SENDGRID_FROM_EMAIL` must be verified in SendGrid before any email sends. A missing verification returns 403 silently.
13. **setupDb.ts is the migration mechanism** — Prisma migrations don't run in production (Supabase pooling). New columns/tables go into `setupDb.ts` using `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` (idempotent). It runs on every backend startup.
14. **Railway + Supabase = use session pooler URL** — Railway's infrastructure doesn't support IPv6 outbound. Supabase's direct connection (`db.[ref].supabase.co`) resolves to IPv6 and fails with `ENETUNREACH`. Always use the session pooler URL (`postgresql://postgres.[ref]:[pw]@aws-0-[region].pooler.supabase.com:5432/postgres`) in `DATABASE_URL`.
15. **pdfkit `characterSpacing` not in @types/pdfkit** — the `characterSpacing()` method exists at runtime but is missing from the TypeScript type definitions. Don't use it — TypeScript build will fail. Omit it (letter-spacing in PDFs is cosmetic only).
16. **ESM imports need `.js` extension** — all local imports in backend TypeScript files must end with `.js` (e.g. `from '../middleware/clientAuth.js'`). Missing extensions cause `ENOTFOUND` crashes at startup in both ts-node and compiled Node.js ESM.

---

## Placeholders to Replace with Real Assets

| Location | Placeholder | What's needed |
|---|---|---|
| Homepage portfolio grid | Dark cards with Roman numerals | Robyn's tattoo photos |
| Homepage Artist section | Mirror-frame "coming soon" box | Robyn's portrait photo |
| Footer Instagram link | `href="#"` | Real Instagram URL |
| Footer TikTok link | `href="#"` | Real TikTok URL |
| Carousel images | Stock/placeholder images | Robyn's studio/work photos |
