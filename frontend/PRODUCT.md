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
- Email notifications 70% complete (studio-side works, client confirmation doesn't arrive)
- Portfolio and About pages are placeholders pending real photos from Robyn
