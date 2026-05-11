# Hall of Mirrors Tattoo — Master Checkpoint

**Last Updated:** May 11, 2026 — Phase 3 v2 Luxury Redesign Complete + Deployed  
**Status:** Production Live ✅ | Luxury redesign live on Vercel | Email 70% complete

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
| Email | SendGrid (`@sendgrid/mail`) |
| Frontend hosting | Vercel (auto-deploy from `main`) |
| Backend hosting | Railway |
| Fonts | Google Fonts: Cormorant Garamond + DM Sans + DM Mono |

**Critical:** Tailwind v3 (not v4). Do not use v4 syntax. Config is `tailwind.config.js` (CJS).

---

## Design System (Phase 3 v2 — Current)

This is the definitive design. All future work uses this system. The previous charcoal/cream/sharp-card design is in git history only (commit before `df7c969`).

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
| `.card-premium` | Surface card with hover glow effect (uses `--card-x`/`--card-y` CSS vars) |
| `.btn-primary` | Gold pill button with shimmer on hover |
| `.btn-secondary` | Transparent pill button with gold border |
| `.eyebrow` | DM Mono, uppercase, gold, 0.6875rem, 0.25em tracking |
| `.reveal` | Hidden state for scroll reveals (opacity:0, translateY 28px) |
| `.reveal.visible` | Revealed state — added by AnimatedSection.tsx IntersectionObserver |
| `.reveal-delay-1` through `.reveal-delay-5` | Stagger delays (0.1s–0.55s) |
| `.section-divider` | Full-width gold gradient line with centred text |
| `.footer-link` | DM Sans footer nav link with gold hover |
| `.footer-social` | DM Mono uppercase social link with gold hover |
| `.text-gold-shimmer` | Animated gold gradient shimmer text |
| `.text-gold` / `.text-cream` / `.text-mid` / `.text-low` | Colour utilities |
| `.bg-surface` / `.bg-surface-2` | Surface background utilities |

### Animations

All keyframes are defined in BOTH `globals.css` (for inline `style={{ animation }}` usage) AND `tailwind.config.js` (for `animate-*` utility class usage). This is intentional — Tailwind JIT won't generate keyframes for animation names used only in inline styles.

| Keyframe | Usage |
|---|---|
| `kenBurns` | Carousel images — slow zoom `scale(1.0) → scale(1.12)` over 8s |
| `fadeUp` | Elements entering viewport |
| `fadeIn` | Opacity-only fade |
| `float` | Gentle vertical bob |
| `pulseGlow` | Logo radial glow pulse |
| `shimmer` | Gold text shimmer (moves background-position) |
| `lineIn` | Decorative lines drawing in from left |

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
│   │   └── dashboard/page.tsx  — Artist dashboard (bookings, consultations)
│   ├── client/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── dashboard/
│   │   │   ├── page.tsx        — 3-tab dashboard (bookings / design ideas / consultations)
│   │   │   ├── bookings.tsx
│   │   │   ├── design-ideas.tsx
│   │   │   └── consultations.tsx
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
└── .env.local                  — NEXT_PUBLIC_API_URL=http://localhost:49999
```

### Key Component Rules

- **`AnimatedSection.tsx`** must be `'use client'` — uses `useRef`, `useEffect`, `IntersectionObserver`
- **`CursorGlow.tsx`** must be `'use client'` — uses `useEffect`, `window.addEventListener`
- **`Footer.tsx`** must be `'use client'` — avoids RSC serialisation errors with Next.js hydration
- **`Header.tsx`** must be `'use client'` — uses `usePathname`, `useEffect`, scroll listener
- **`page.tsx`** (homepage) is a **Server Component** — no event handlers, no `useState`, no `useEffect`
- Never put `as React.CSSProperties` in a Server Component — import React first or remove the cast

---

## Homepage Sections (page.tsx)

1. **Hero** — full-viewport sticky carousel (Ken Burns), "Hall of Mirrors" italic CSS watermark, logo + radial glow, italic tagline, two CTA buttons (Book / Portfolio), DM Mono scroll indicator
2. **Credentials strip** — 3-col horizontal bar with gold dividers, DM Mono eyebrow labels (8+ Years / 100% Custom / 1:1 Consultation)
3. **Portfolio "The Work"** — asymmetric 8-col grid (5+3 alternating rows), ghost Roman numeral watermarks, scroll reveals, DM Mono/Cormorant card labels
4. **The Artist** — 2-col split, Cormorant italic heading, bio paragraphs, stats row (8+ / 100% / 1:1), mirror-frame photo placeholder with nested gold borders + corner accents + logo watermark
5. **Services** — 3 numbered cards (01/02/03), gold numbering, "Find out more →" link
6. **Final CTA** — centred logo, "Ready to begin?" Cormorant italic, radial gold glow

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
| POST | `/api/auth/client/signup` | Register new client |
| POST | `/api/auth/client/login` | Login → returns JWT |
| POST | `/api/auth/client/activate` | Activate guest account |
| GET | `/api/client/bookings` | Client's own bookings |
| GET | `/api/client/bookings/:id` | Single booking detail |
| PATCH | `/api/client/bookings/:id` | Cancel a booking |
| POST | `/api/client/design-ideas` | Upload design idea (URL-based) |
| GET | `/api/client/design-ideas` | Client's design ideas |
| DELETE | `/api/client/design-ideas/:id` | Delete design idea |
| POST | `/api/client/consultations` | Request consultation |
| GET | `/api/client/consultations` | Client's consultations |

### Artist Auth
| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/artist/login` | Artist login → returns JWT |
| GET | `/api/artist/bookings` | All bookings (artist view) |
| PATCH | `/api/artist/bookings/:id` | Accept / reject booking |
| GET | `/api/artist/consultations` | All consultation requests |

### Key Backend Files
```
backend/src/
├── index.ts                    — Express app, middleware, route mounting
├── controllers/
│   ├── artistController.ts     — Artist auth, profile (uses raw pg.Client)
│   ├── clientAuthController.ts — Client auth
│   ├── bookingController.ts    — Booking CRUD (uses raw pg.Client)
│   └── consultationController.ts
├── routes/                     — One file per resource group
├── middleware/
│   ├── auth.ts                 — Artist JWT middleware
│   └── clientAuth.ts           — Client JWT middleware
└── services/
    └── emailService.ts         — SendGrid email sending
```

**Supabase pooling workaround:** Prisma throws "prepared statement already exists" with Supabase's pooler. All production queries use raw `pg.Client` instead of Prisma. Prisma schema is still the source of truth for the data model.

---

## Email Notifications (Phase 4 — 70% Complete)

| Email type | Status |
|---|---|
| Studio booking notification → `studio@hallofmirrorstattoo.com` | ✅ Working |
| Client booking confirmation | ⚠️ Code written, not arriving (delivery/settings issue) |
| Client signup welcome | ❌ Not implemented |
| Artist consultation response → client | ❌ Not implemented |
| Password reset | ❌ Not implemented |

SendGrid API key is configured in Railway environment variables. Studio-side emails confirmed working.

---

## What's Done ✅

- Full booking system (form → backend → database)
- Artist auth + JWT + dashboard (accept/reject bookings)
- Client auth + JWT + dashboard (3 tabs: bookings, design ideas, consultations)
- Luxury Phase 3 v2 redesign (obsidian palette, Cormorant Garamond, Ken Burns, cursor glow, scroll reveals)
- Production deployment on Vercel + Railway
- SendGrid setup + studio notification emails working

---

## What's Still To Do ⚠️

### High Priority
- [ ] Fix client confirmation emails (SendGrid delivery issue — code is written)
- [ ] Artist consultation response UI (respond button + message in dashboard)
- [ ] Client profile editing page (`/client/profile`)
- [ ] Password reset flow (forgot password → email → reset form)

### Medium Priority
- [ ] Real portfolio images — replace placeholder dark cards in homepage grid
- [ ] Robyn's artist photo — replace mirror-frame placeholder in Artist section
- [ ] Social media links — Instagram + TikTok in footer currently `href="#"`
- [ ] Portfolio page (`/portfolio`) — full gallery, currently placeholder
- [ ] About page — Robyn's bio and studio story
- [ ] File upload for design ideas (currently URL-based only)

### Lower Priority
- [ ] Calendar / availability management
- [ ] Booking reminder emails (24h before)
- [ ] Review system (post-booking)
- [ ] Direct messaging (artist ↔ client)
- [ ] Stripe payment integration (deposits)
- [ ] Admin dashboard

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
4. **No `blur()` in CSS `transform`** — `blur()` is a `filter` function, not a `transform` function. Use `filter: blur()` separately.
5. **Stale `.next` cache** — if you add new client components and see manifest errors, run `rm -rf frontend/.next` and restart the dev server.
6. **Two separate auth systems** — artist tokens and client tokens are completely separate. Artist tokens stored in one localStorage key, client tokens in another. The middleware files are different too (`auth.ts` vs `clientAuth.ts`).
7. **Supabase prepared statements** — use raw `pg.Client` for all production queries. Never switch back to Prisma client for Supabase-pooled connections.
8. **Artist ID** — Robyn's ID is `artist-robyn-001`. Hard-coded in some places; search before adding new artist logic.

---

## Placeholders to Replace with Real Assets

| Location | Placeholder | What's needed |
|---|---|---|
| Homepage portfolio grid | Dark cards with Roman numerals | Robyn's tattoo photos |
| Homepage Artist section | Mirror-frame "coming soon" box | Robyn's portrait photo |
| Footer Instagram link | `href="#"` | Real Instagram URL |
| Footer TikTok link | `href="#"` | Real TikTok URL |
| Carousel images | Stock/placeholder images | Robyn's studio/work photos |
