import { Router, Request, Response } from 'express';
import pkg from 'pg';
import { clientAuthMiddleware } from '../middleware/clientAuth.js';
import { sendClientCounterOfferToArtist, sendOfferAcceptedToArtist } from '../services/emailService.js';

const { Client } = pkg;
const router = Router();

router.use(clientAuthMiddleware);

// GET /api/client/bookings
router.get('/', async (req: Request, res: Response) => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Not authenticated' });

    await client.connect();

    // Match by user_id OR by email (handles stub users created by the booking form
    // that have a different UUID than the client's signup account)
    const result = await client.query(
      `SELECT b.id, b.booking_reference,
              b.appointment_date_time as appointment_date,
              b.appointment_time, b.appointment_status,
              b.deposit_amount as deposit_price,
              b.final_price_estimate as final_price,
              b.counter_offer_date, b.counter_offer_time,
              b.counter_offer_note, b.counter_offered_by,
              b.created_at,
              a.full_name as artist_name, a.instagram_handle
       FROM "Booking" b
       LEFT JOIN "Artist" a ON b.artist_id = a.id
       LEFT JOIN "User" u ON b.user_id = u.id
       WHERE b.user_id = $1 OR u.email = $2
       ORDER BY b.appointment_date_time DESC`,
      [req.user.id, req.user.email]
    );

    res.json({ success: true, bookings: result.rows });
  } catch (error) {
    console.error('Fetch bookings error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch bookings' });
  } finally {
    await client.end();
  }
});

// GET /api/client/bookings/:id
router.get('/:id', async (req: Request, res: Response) => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Not authenticated' });

    const { id } = req.params;
    await client.connect();

    // Ownership check — accept user_id match OR email match
    const ownerCheck = await client.query(
      `SELECT b.id FROM "Booking" b
       LEFT JOIN "User" u ON b.user_id = u.id
       WHERE b.id = $1 AND (b.user_id = $2 OR u.email = $3)`,
      [id, req.user.id, req.user.email]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    // Main booking + artist — no DesignIdea join here so it can't break this query
    const result = await client.query(
      `SELECT b.id, b.booking_reference,
              b.appointment_date_time as appointment_date,
              b.appointment_time, b.appointment_status,
              b.deposit_amount as deposit_price,
              b.final_price_estimate as final_price,
              b.tattoo_description as design_notes,
              b.placement as tattoo_placement,
              b.estimated_duration_minutes as estimated_duration,
              b.counter_offer_date, b.counter_offer_time,
              b.counter_offer_note, b.counter_offered_by,
              b.created_at, b.updated_at,
              a.id as artist_id, a.full_name as artist_name, a.specialties, a.bio, a.instagram_handle
       FROM "Booking" b
       LEFT JOIN "Artist" a ON b.artist_id = a.id
       WHERE b.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    const booking = result.rows[0];

    // DesignIdea lookup — separate so any issue here doesn't block the response
    let designIdeas: { design_idea_id: string; image_url: string; description: string }[] = [];
    try {
      const diResult = await client.query(
        `SELECT design_idea_id, image_url, description FROM "DesignIdea" WHERE booking_id = $1`,
        [id]
      );
      designIdeas = diResult.rows;
    } catch (diErr: any) {
      console.warn('[clientBookings] DesignIdea fetch skipped:', diErr.message);
    }

    res.json({
      success: true,
      booking: {
        id: booking.id,
        booking_reference: booking.booking_reference,
        appointment_date: booking.appointment_date,
        appointment_time: booking.appointment_time,
        appointment_status: booking.appointment_status,
        deposit_price: booking.deposit_price,
        final_price: booking.final_price,
        design_notes: booking.design_notes,
        tattoo_placement: booking.tattoo_placement,
        estimated_duration: booking.estimated_duration,
        created_at: booking.created_at,
        updated_at: booking.updated_at,
        counter_offer_date: booking.counter_offer_date ?? null,
        counter_offer_time: booking.counter_offer_time ?? null,
        counter_offer_note: booking.counter_offer_note ?? null,
        counter_offered_by: booking.counter_offered_by ?? null,
        artist: booking.artist_id ? {
          id: booking.artist_id,
          name: booking.artist_name,
          specialties: booking.specialties,
          bio: booking.bio,
          instagram_handle: booking.instagram_handle,
        } : null,
        design_ideas: designIdeas,
      },
    });
  } catch (error) {
    console.error('Fetch booking detail error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch booking' });
  } finally {
    await client.end();
  }
});

// PATCH /api/client/bookings/:id  (cancel or reschedule)
router.patch('/:id', async (req: Request, res: Response) => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Not authenticated' });

    const { id } = req.params;
    const { appointment_status, new_appointment_date, new_appointment_time } = req.body;

    const allowedStatuses = ['cancelled', 'rescheduled'];
    if (!allowedStatuses.includes(appointment_status)) {
      return res.status(400).json({ success: false, error: 'Only "cancelled" or "rescheduled" are allowed' });
    }

    await client.connect();

    // Ownership + current status — email fallback
    const bookingResult = await client.query(
      `SELECT b.id, b.appointment_date_time, b.appointment_status
       FROM "Booking" b
       LEFT JOIN "User" u ON b.user_id = u.id
       WHERE b.id = $1 AND (b.user_id = $2 OR u.email = $3)`,
      [id, req.user.id, req.user.email]
    );

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    const existing = bookingResult.rows[0];
    if (existing.appointment_status === 'cancelled') {
      return res.status(400).json({ success: false, error: 'Booking is already cancelled' });
    }

    let updateResult;

    if (appointment_status === 'rescheduled' && new_appointment_date && new_appointment_time) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(new_appointment_date) || !/^\d{2}:\d{2}$/.test(new_appointment_time)) {
        return res.status(400).json({ success: false, error: 'Invalid date or time format' });
      }
      const newDateTime = `${new_appointment_date}T${new_appointment_time}:00`;
      updateResult = await client.query(
        `UPDATE "Booking"
         SET appointment_status = 'rescheduled',
             appointment_date_time = $1,
             appointment_time = $2,
             updated_at = NOW()
         WHERE id = $3
         RETURNING id, booking_reference, appointment_status, appointment_date_time, appointment_time, updated_at`,
        [newDateTime, new_appointment_time, id]
      );
    } else {
      updateResult = await client.query(
        `UPDATE "Booking"
         SET appointment_status = $1, updated_at = NOW()
         WHERE id = $2
         RETURNING id, booking_reference, appointment_status, appointment_date_time, appointment_time, updated_at`,
        [appointment_status, id]
      );
    }

    res.json({ success: true, message: `Booking ${appointment_status}`, booking: updateResult.rows[0] });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({ success: false, error: 'Failed to update booking' });
  } finally {
    await client.end();
  }
});

// POST /api/client/bookings/:id/counter-offer  (client proposes a different time)
router.post('/:id/counter-offer', async (req: Request, res: Response) => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Not authenticated' });

    const { id } = req.params;
    const { counter_offer_date, counter_offer_time, counter_offer_note } = req.body;

    if (!counter_offer_date || !/^\d{4}-\d{2}-\d{2}$/.test(counter_offer_date)) {
      return res.status(400).json({ success: false, error: 'counter_offer_date must be YYYY-MM-DD' });
    }
    if (!counter_offer_time || !/^\d{2}:\d{2}$/.test(counter_offer_time)) {
      return res.status(400).json({ success: false, error: 'counter_offer_time must be HH:MM' });
    }
    if (!counter_offer_note || !counter_offer_note.trim()) {
      return res.status(400).json({ success: false, error: 'A note explaining the counter-offer is required' });
    }

    await client.connect();

    const ownerCheck = await client.query(
      `SELECT b.id, b.appointment_status, b.counter_offered_by,
              b.booking_reference, a.email as artist_email, a.full_name as artist_name
       FROM "Booking" b
       LEFT JOIN "User" u ON b.user_id = u.id
       LEFT JOIN "Artist" a ON b.artist_id = a.id
       WHERE b.id = $1 AND (b.user_id = $2 OR u.email = $3)`,
      [id, req.user.id, req.user.email]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    const booking = ownerCheck.rows[0];
    if (booking.appointment_status !== 'counter_offered' || booking.counter_offered_by !== 'artist') {
      return res.status(400).json({ success: false, error: 'No artist counter-offer to respond to' });
    }

    await client.query(
      `UPDATE "Booking"
       SET counter_offer_date = $1, counter_offer_time = $2, counter_offer_note = $3,
           counter_offered_by = 'client', updated_at = NOW()
       WHERE id = $4`,
      [counter_offer_date, counter_offer_time, counter_offer_note.trim(), id]
    );

    if (booking.artist_email) {
      const clientName = `${req.user.first_name || ''} ${req.user.last_name || ''}`.trim() || req.user.email;
      sendClientCounterOfferToArtist({
        artistEmail: booking.artist_email,
        clientName,
        bookingReference: booking.booking_reference,
        proposedDate: counter_offer_date,
        proposedTime: counter_offer_time,
        note: counter_offer_note.trim(),
      }).catch(() => {});
    }

    res.json({ success: true, message: 'Counter-offer sent to artist' });
  } catch (error) {
    console.error('Client counter-offer error:', error);
    res.status(500).json({ success: false, error: 'Failed to send counter-offer' });
  } finally {
    await client.end();
  }
});

// POST /api/client/bookings/:id/accept-offer  (client accepts artist's counter-offer)
router.post('/:id/accept-offer', async (req: Request, res: Response) => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Not authenticated' });

    const { id } = req.params;
    await client.connect();

    const ownerCheck = await client.query(
      `SELECT b.id, b.appointment_status, b.counter_offered_by,
              b.counter_offer_date, b.counter_offer_time, b.booking_reference,
              a.email as artist_email, a.full_name as artist_name
       FROM "Booking" b
       LEFT JOIN "User" u ON b.user_id = u.id
       LEFT JOIN "Artist" a ON b.artist_id = a.id
       WHERE b.id = $1 AND (b.user_id = $2 OR u.email = $3)`,
      [id, req.user.id, req.user.email]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    const booking = ownerCheck.rows[0];
    if (booking.appointment_status !== 'counter_offered' || booking.counter_offered_by !== 'artist') {
      return res.status(400).json({ success: false, error: 'No artist counter-offer to accept' });
    }

    await client.query(
      `UPDATE "Booking"
       SET appointment_date_time = (counter_offer_date::text || 'T' || counter_offer_time || ':00')::timestamp,
           appointment_time = counter_offer_time,
           appointment_status = 'pending_consent',
           counter_offer_date = NULL, counter_offer_time = NULL,
           counter_offer_note = NULL, counter_offered_by = NULL,
           updated_at = NOW()
       WHERE id = $1`,
      [id]
    );

    if (booking.artist_email) {
      const clientName = `${req.user.first_name || ''} ${req.user.last_name || ''}`.trim() || req.user.email;
      sendOfferAcceptedToArtist({
        artistEmail: booking.artist_email,
        clientName,
        bookingReference: booking.booking_reference,
        confirmedDate: booking.counter_offer_date,
        confirmedTime: booking.counter_offer_time,
      }).catch(() => {});
    }

    res.json({ success: true, message: 'Offer accepted — booking updated' });
  } catch (error) {
    console.error('Client accept-offer error:', error);
    res.status(500).json({ success: false, error: 'Failed to accept offer' });
  } finally {
    await client.end();
  }
});

export default router;
