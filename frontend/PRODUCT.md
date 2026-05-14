# Hall of Mirrors Tattoo — Product Context

## Product Purpose

A luxury booking and portfolio website for Hall of Mirrors Tattoo Studio — a bespoke neo-traditional tattoo studio on Castle Street, Liverpool. Built as a gift by Will for his partner Robyn, who runs the studio. The site handles bookings, portfolio display, client accounts, and consultations.

## Register

brand — the design IS the product. Robyn's clients judge her artistry by how this site looks before they ever walk through the door.

## Users

**Primary:** People considering their first or next tattoo — typically 20s–40s, some design-literate, all emotionally invested in a permanent decision. They need to feel the studio is premium, safe, and personal before committing.

**Secondary:** Robyn herself, using the artist dashboard to manage bookings and consultations.

## Brand & Tone

- **Name:** Hall of Mirrors Tattoo Studio
- **Artist:** Robyn
- **Specialty:** Neo-traditional — bold lines, rich colour, timeless imagery drawn from art history, natural forms, personal narrative
- **Location:** Suite 3, 34 Castle Street, Liverpool L2 0NR (Georgian building, private studio)
- **Tone:** Intimate, confident, unhurried. Like a private gallery, not a high-street shop. The copy is precise and never shouty.
- **Anti-references:** Chain tattoo studios, flash-art shops, anything that feels fast or disposable

## Design Principles

- Every mark is permanent — the design should feel deliberate and considered
- Private, not public — this is a studio you discover, not one that advertises loudly
- The craft is the hero — once real photos exist, they take centre stage
- Limited availability is a feature, not a flaw — scarcity signals quality

## Color Strategy

Committed — obsidian (`#0E0C09`) + antique gold patina (`#C9A84C`) own 50–60% of every surface. The warmth of candlelight in a dim Georgian room.

## Typography System

- **Display:** Cormorant Garamond, italic, weight 300–400 — always italic for headings
- **Body:** DM Sans, weight 300–500
- **Labels / indexes / mono:** DM Mono, uppercase, tracked

## What Must Not Change

- Booking/auth logic (JWT, two separate auth systems for artist and client)
- Supabase raw pg.Client queries (prepared statement workaround)
- Tailwind v3 config (not v4)
- Keyframes must be in BOTH globals.css AND tailwind.config.js

## Current State (May 2026)

- Phase 3 v2 luxury redesign live on Vercel
- Full booking, account, messaging, and pricing system live
- Portfolio and About pages are placeholders pending real photos from Robyn

---

## Feature Log

### Booking System

**Booking form** (`frontend/app/booking/page.tsx`, `backend/src/controllers/bookingController.ts`)
- Multi-step booking form: personal details → tattoo description → date/time via AvailabilityCalendar and TimeSlotPicker → submission
- Optional artist selector — if an artist is chosen, their real availability is used for slot blocking
- Date selection uses a week-view calendar component that reads from the AvailabilityBlock table and blocks already-booked slots (duration-aware — a 3hr booking blocks 3 slots)
- Optional fields: referral source, additional notes, **approximate budget (£)** — budget is stored on the booking record for the artist to see when pricing
- On success: shows a post-booking account activation panel (password field + Create Account button) for new clients who don't yet have a login. "I'll do this later" dismisses the panel
- Booking confirmation email fires to client; activation link in email pre-fills the signup page

**Booking status machine**

`pending_consent` → `confirmed` / `counter_offered` / `cancelled`
`counter_offered` → loops back to `pending_consent` (when either side accepts) or continues counter-offering
Price offer flow: `price_offer_status` — `'none'` → `'offered'` → `'accepted'` (independent of appointment status)

**Artist dashboard — bookings tab** (`frontend/app/artist/dashboard/page.tsx`)
- List of all active bookings (pending, confirmed, rescheduled, counter_offered) + past bookings
- Calendar view (week-view) showing confirmed sessions as time-blocking tiles
- Selecting a booking opens a detail panel (centred below the list, max 640px wide)
- Detail panel shows: client info, design description, placement, size, appointment date/time, session duration selector
- Artist can confirm a booking (sets status → confirmed, sends email to client with Google Calendar + ICS attachment)
- Artist can decline a booking (sets status → cancelled, sends cancellation email)
- Artist can reschedule via AvailabilityCalendar (sets status → rescheduled)
- Artist can propose a counter-offer date/time with a note (sets status → counter_offered, counter_offered_by → 'artist', sends email to client)
- When client has counter-offered: panel shows **Original → Proposed** grid (weekday, date, time) + client's note, with Accept / Propose a different time buttons
- When awaiting client response: panel shows Original → Proposal grid + note in muted "Awaiting" panel
- **Price offer section**: artist enters a £ amount + optional note and sends it to the client. Shows "Awaiting client acceptance" or "Price accepted: £X" state. Artist can re-offer at any time before acceptance
- Displays `client_budget` as a hint when the client provided one
- **Inline message thread** at the bottom of the detail panel: scrollable chat (14rem height), gold bubbles for artist / muted for client, timestamps, Enter to send, 30-second poll. Drives from `selectedBooking.id` via separate state from the messages-tab chat
- Private notes field (saved to `artist_notes`, not visible to client)
- Aftercare email button (confirmed/completed bookings)
- Rebook invite email button
- Status badge uses a `StatusBadge` component with colour-coded states including `counter_offered`

**Client booking detail** (`frontend/app/client/bookings/[id]/page.tsx`)
- Shows booking reference, status badge, appointment date/time, design notes, placement, duration
- Status-aware action buttons: Reschedule / Cancel (blocked within 48hrs or on past bookings)
- Reschedule flow: AvailabilityCalendar + TimeSlotPicker → PATCH sets status → rescheduled
- Cancel flow: confirmation panel before PATCH
- **Counter-offer received (from artist)**: gold-tinted panel showing **Original → Proposed** grid + artist's note in a blockquote. Three buttons: Accept this time / Suggest another time / Cancel booking
- **Counter-offer sent (by client)**: muted "Awaiting artist response" panel showing Original → Proposed grid + client's own note
- "Suggest another time" opens a counter-offer form with AvailabilityCalendar + TimeSlotPicker + note textarea; sends to `POST /api/client/bookings/:id/counter-offer`
- **Price offer panel** (in Payment card, right column): when artist has offered a price — Cormorant Garamond £ display, optional note in blockquote, "Accept price" button. On acceptance: shows green "Agreed price: £X"
- **Inline message thread** (left column, below design details): card-premium wrapper, 16rem scrollable area, date separators, client bubbles gold-right / artist muted-left, Enter to send, 30-second poll. Empty state: "Start the conversation — Send a message to [artist] about this booking."
- Design Ideas section (uploaded reference images from DesignIdea table)

### Client Account System

**Authentication** (`backend/src/routes/clientAuth.ts`, `backend/src/controllers/clientAuthController.ts`)
- JWT-based client auth separate from artist auth
- Signup: checks if email belongs to a stub user (created by booking form with empty password_hash) — if so, activates in-place rather than returning 409
- Activate endpoint: sets password for stub users, requires `password_hash = ''` guard (prevents overwriting active accounts)
- Login: checks `account_status` — returns 401 with "This account has been deleted." if matched
- Forgot/reset password flow

**Signup page** (`frontend/app/client/signup/page.tsx`)
- Wrapped in Suspense (Next.js requirement for `useSearchParams`)
- `useSearchParams().get('email')` pre-fills email when arriving from the booking confirmation activation link

**Client dashboard** (`frontend/app/client/dashboard/`)
- Tabs: Bookings, Messages, Profile
- **Bookings tab** (`bookings.tsx`): splits into active (pending_consent, confirmed, rescheduled, counter_offered) and past bookings. Past bookings collapsed by default under "Past Bookings (N) ↓ Show" toggle at 0.7 opacity. BookingCard shows status badge, artist name, date/time, deposit/final price, and counter-offer hint banners ("Response needed — tap to view" / "Awaiting artist response")
- **Messages tab** (`messages.tsx`): thread list with unread counts + per-booking chat view, polls every 30s
- **Profile tab** (`profile/page.tsx`): edit name/phone. Danger Zone section with "Delete my account" button → confirmation modal → `DELETE /api/auth/client/me` (anonymises PII, sets account_status = 'deleted') → logout and redirect to `/`

### Messaging System

**Message table**: `id, booking_id, sender_type ('artist'|'client'), sender_id, body, created_at, read_at`

**Routes**
- `GET /api/client/messages` — list all booking thread summaries with unread counts
- `GET /api/client/messages/:bookingId` — fetch thread for a booking (auto-marks artist messages read)
- `POST /api/client/messages/:bookingId` — client sends message
- `GET /api/artist/messages` — list artist's threads
- `GET /api/artist/messages/:bookingId` — fetch thread (auto-marks client messages read)
- `POST /api/artist/messages/:bookingId` — artist sends message

Messages are surfaced in three places: the client messages tab, the artist messages tab, and inline in the booking detail views on both sides.

### Counter-Offer System

Stored on the Booking row: `counter_offer_date (DATE)`, `counter_offer_time (TEXT HH:MM)`, `counter_offer_note (TEXT)`, `counter_offered_by ('artist'|'client')`

Flow: artist sends counter → `counter_offered_by = 'artist'` → client can accept (→ pending_consent) or counter back (`counter_offered_by = 'client'`) → artist can accept or counter again — continues until one party accepts

Emails fire at each step (sendgrid branded HTML templates):
- `sendCounterOfferToClient` — artist proposes new time
- `sendClientCounterOfferToArtist` — client proposes back
- `sendOfferAcceptedToArtist` / `sendOfferAcceptedToClient` — whichever side accepts

**Bug fixed (2026-05-14)**: `counter_offer_date` is a PostgreSQL `DATE` column returned by the pg library as a full ISO timestamp (`"2026-05-15T00:00:00.000Z"`). Constructing `new Date(\`${date}T12:00:00\`)` produced "Invalid Date". Fixed everywhere by extracting the first 10 characters (`.substring(0, 10)`) before string interpolation.

### Price Offer System

New columns on Booking: `client_budget DECIMAL(10,2)`, `price_offer_status TEXT DEFAULT 'none'`, `price_offer_note TEXT`

Flow: client submits budget (optional) → artist reviews and sends price offer → `price_offer_status = 'offered'`, `final_price_estimate = £X` → client accepts → `price_offer_status = 'accepted'`. If client wants to negotiate they use the booking message thread, then the artist re-offers.

Routes:
- `POST /api/artist/bookings/:id/price-offer` — artist sets price and note
- `POST /api/client/bookings/:id/accept-price` — client accepts

Emails:
- `sendPriceOfferToClient` — artist has set a price, includes CTA direct to the booking detail
- `sendPriceAcceptedToArtist` — client accepted

### Email Notifications

All via SendGrid. Branded HTML using `baseTemplate`, `heading`, `body`, `detail`, `ctaButton` helpers. Events covered:
- Booking submitted (to client — includes account activation link)
- Booking submitted (to studio)
- Booking confirmed (to client — includes Google Calendar link + ICS attachment)
- Booking cancelled by artist (to client)
- Booking rescheduled by artist (to client)
- Counter-offer: artist → client
- Counter-offer: client → artist
- Offer accepted: to artist / to client
- Price offer: artist → client
- Price accepted: client → artist
- Rebook invite (to client)
- Aftercare instructions (to client)
- Consultation response (to client)
- Password reset

### Consultation System

- `Consultation` table: `user_id, artist_id, message, preferred_dates, status, artist_response`
- Client can submit a consultation request (linked to an artist)
- Artist dashboard Consultations tab shows pending requests; artist can approve or decline with a response message
- Consultation messages stored in `Message` table via `consultation_id` foreign key
- Email fires to client on artist response

### Availability System

- `AvailabilityBlock` table: `artist_id, blocked_date (DATE), blocked_slot (TEXT), reason`
- Artist can block full days or individual slots from the Availability tab
- `expandBookingSlots` on the backend expands confirmed bookings into their full slot range (duration-aware) so they appear blocked to future bookers
- `AvailabilityCalendar` component (frontend): week-view, fetches from `/api/availability/:artistId?month=YYYY-MM`, shows blocked slots greyed out, selected date highlighted in gold
- `TimeSlotPicker` component: renders available slots for a selected date

### Removed / Adjusted

- Free Consultation button removed from homepage — single CTA entry point
- Artist dashboard: switched from two-column grid layout (list left, detail right sidebar) to single-column stacked layout (detail panel drops below list, centred, max 640px wide, no sticky positioning)
- Messaging and Consultations tabs merged into one unified hub in the artist dashboard
- Logo swapped from black HOMLOGO to white version in nav
- Gradient text removed from design system (design elevation rule)
- Services displayed as a table layout (not cards)
- `card-premium` component sharpened (border, shadow, inner padding)
