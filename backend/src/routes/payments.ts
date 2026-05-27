import express, { Request, Response } from 'express';
import Stripe from 'stripe';
import pkg from 'pg';
import { clientAuthMiddleware } from '../middleware/clientAuth.js';

const { Client } = pkg;
const router = express.Router();

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY not configured');
  return new Stripe(key);
}

// ---------------------------------------------------------------------------
// POST /api/payments/create-checkout-session
// Body: { booking_reference: string }
// Creates a Stripe Checkout Session and returns { url }
// ---------------------------------------------------------------------------
router.post('/create-checkout-session', clientAuthMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    const { booking_reference } = req.body as { booking_reference?: string };
    if (!booking_reference) {
      return res.status(400).json({ error: 'booking_reference is required' });
    }

    // Fetch deposit amount for this booking AND verify ownership
    const db = new Client({ connectionString: process.env.DATABASE_URL });
    await db.connect();
    let depositAmount: number;
    try {
      const { rows } = await db.query(
        `SELECT b.deposit_amount, b.deposit_paid
         FROM "Booking" b
         LEFT JOIN "User" u ON b.user_id = u.id
         WHERE b.booking_reference = $1 AND (b.user_id = $2 OR u.email = $3)`,
        [booking_reference, req.user.id, req.user.email],
      );
      if (!rows[0]) return res.status(404).json({ error: 'Booking not found' });
      if (rows[0].deposit_paid) return res.status(400).json({ error: 'Deposit already paid' });
      depositAmount = parseFloat(rows[0].deposit_amount);
      if (!Number.isFinite(depositAmount) || depositAmount <= 0) {
        return res.status(400).json({ error: 'Deposit amount not set for this booking' });
      }
    } finally {
      await db.end();
    }

    const stripe = getStripe();
    const frontendUrl =
      process.env.FRONTEND_URL ?? 'https://hall-of-mirrors-tattoo.vercel.app';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: 'Tattoo Session Deposit',
              description: `Booking reference: ${booking_reference}`,
            },
            unit_amount: Math.round(depositAmount * 100), // pence
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${frontendUrl}/client/dashboard?session_id={CHECKOUT_SESSION_ID}&booking_reference=${encodeURIComponent(booking_reference)}&tab=bookings`,
      cancel_url: `${frontendUrl}/client/dashboard?tab=bookings&deposit_cancelled=true`,
      metadata: { booking_reference },
    });

    return res.json({ url: session.url });
  } catch (err: any) {
    console.error('[payments] create-checkout-session error:', err);
    return res.status(500).json({ error: err.message || 'Failed to create checkout session' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/payments/verify-session
// Body: { session_id: string, booking_reference: string }
// Verifies a completed Stripe Checkout Session and marks deposit as paid
// ---------------------------------------------------------------------------
router.post('/verify-session', clientAuthMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    const { session_id, booking_reference } = req.body as {
      session_id?: string;
      booking_reference?: string;
    };
    if (!session_id || !booking_reference) {
      return res.status(400).json({ error: 'session_id and booking_reference are required' });
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    if (session.metadata?.booking_reference !== booking_reference) {
      return res.status(400).json({ error: 'Session does not match booking reference' });
    }

    const db = new Client({ connectionString: process.env.DATABASE_URL });
    await db.connect();
    try {
      // Idempotent: only mark paid if the booking belongs to the user AND isn't already paid.
      // Returns the affected row so we can tell "first verification" from "replay".
      const result = await db.query(
        `UPDATE "Booking" b
         SET deposit_paid = true,
             deposit_payment_method = 'card',
             deposit_paid_date = NOW()
         FROM "User" u
         WHERE b.booking_reference = $1
           AND b.deposit_paid = false
           AND (b.user_id = $2 OR (b.user_id = u.id AND u.email = $3))
         RETURNING b.id`,
        [booking_reference, req.user.id, req.user.email],
      );
      // Either way we return success — the dashboard re-fetches state.
      return res.json({ success: true, firstVerification: (result.rowCount ?? 0) > 0 });
    } finally {
      await db.end();
    }
  } catch (err: any) {
    console.error('[payments] verify-session error:', err);
    return res.status(500).json({ error: err.message || 'Failed to verify session' });
  }
});

export default router;
