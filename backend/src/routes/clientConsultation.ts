import { Router, Request, Response } from 'express';
import pkg from 'pg';
import { randomUUID } from 'crypto';
import { clientAuthMiddleware } from '../middleware/clientAuth.js';

const { Client } = pkg;
const router = Router();

// Middleware to verify authentication
router.use(clientAuthMiddleware);

// POST create consultation request
router.post('/', async (req: Request, res: Response) => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

    const { artist_id, message, preferred_dates } = req.body;

    if (!artist_id || !message) {
      return res.status(400).json({
        success: false,
        error: 'Artist ID and message are required',
      });
    }

    await client.connect();

    // Verify artist exists
    const artistResult = await client.query(
      `SELECT id FROM "Artist" WHERE id = $1`,
      [artist_id]
    );

    if (artistResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Artist not found',
      });
    }

    // Create consultation request
    const result = await client.query(
      `INSERT INTO "Consultation" (consultation_id, user_id, artist_id, message, preferred_dates, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'pending', NOW(), NOW())
       RETURNING consultation_id, message, status, created_at`,
      [randomUUID(), req.user.id, artist_id, message, preferred_dates || null]
    );

    res.status(201).json({
      success: true,
      message: 'Consultation request created',
      consultation: result.rows[0],
    });
  } catch (error) {
    console.error('Create consultation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create consultation request',
    });
  } finally {
    await client.end();
  }
});

// GET all consultations for user
router.get('/', async (req: Request, res: Response) => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

    await client.connect();

    const result = await client.query(
      `SELECT c.consultation_id, c.artist_id, c.booking_id, c.message, c.preferred_dates, c.status, c.artist_response, c.created_at, c.updated_at,
              a.full_name as artist_name, a.specialties, a.instagram_handle,
              (SELECT COUNT(*) FROM "Message" m WHERE m.consultation_id = c.consultation_id AND m.sender_type = 'artist')::int AS artist_message_count,
              (SELECT COUNT(*) FROM "Message" m WHERE m.consultation_id = c.consultation_id AND m.sender_type = 'artist' AND m.read_at IS NULL)::int AS unread_artist_count
       FROM "Consultation" c
       LEFT JOIN "Artist" a ON c.artist_id = a.id
       WHERE c.user_id = $1
       ORDER BY c.updated_at DESC`,
      [req.user.id]
    );

    res.json({
      success: true,
      consultations: result.rows,
    });
  } catch (error) {
    console.error('Fetch consultations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch consultations',
    });
  } finally {
    await client.end();
  }
});

// GET specific consultation
router.get('/:id', async (req: Request, res: Response) => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

    const { id } = req.params;

    await client.connect();

    const result = await client.query(
      `SELECT c.consultation_id, c.artist_id, c.message, c.preferred_dates, c.status, c.artist_response, c.created_at, c.updated_at,
              a.full_name as artist_name, a.specialties, a.bio, a.instagram_handle
       FROM "Consultation" c
       LEFT JOIN "Artist" a ON c.artist_id = a.id
       WHERE c.consultation_id = $1 AND c.user_id = $2`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Consultation not found',
      });
    }

    res.json({
      success: true,
      consultation: result.rows[0],
    });
  } catch (error) {
    console.error('Fetch consultation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch consultation',
    });
  } finally {
    await client.end();
  }
});

// POST /:id/book — convert a standalone consultation into a formal booking
router.post('/:id/book', async (req: Request, res: Response) => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { id } = req.params;
    const { placement, estimated_size, preferred_date, notes } = req.body;

    if (!placement?.trim()) {
      return res.status(400).json({ success: false, error: 'Placement is required' });
    }

    await client.connect();

    // Fetch the consultation — must belong to this user and not be declined
    const consultResult = await client.query(
      `SELECT c.consultation_id, c.artist_id, c.booking_id, c.message, c.user_id
       FROM "Consultation" c
       WHERE c.consultation_id = $1 AND c.user_id = $2 AND c.status != 'declined'`,
      [id, req.user.id]
    );

    if (consultResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Consultation not found' });
    }

    const consultation = consultResult.rows[0];

    if (consultation.booking_id) {
      return res.status(400).json({ success: false, error: 'This consultation already has a linked booking' });
    }

    // Build appointment datetime if a preferred date was provided
    let appointmentDateTime: string | null = null;
    if (preferred_date) {
      appointmentDateTime = new Date(preferred_date).toISOString();
    }

    // Create the booking
    const bookingId = randomUUID();
    const bookingReference = `BK-${Date.now()}`;

    await client.query(
      `INSERT INTO "Booking" (
        id, studio_id, user_id, artist_id, appointment_date_time,
        appointment_status, tattoo_description, placement, estimated_size,
        artist_notes, deposit_amount, balance_due, booking_reference,
        payment_method, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())`,
      [
        bookingId,
        'default-studio',
        req.user.id,
        consultation.artist_id,
        appointmentDateTime,
        'pending',
        consultation.message,
        placement.trim(),
        estimated_size || null,
        notes || null,
        '0',
        '0',
        bookingReference,
        'not_set',
      ]
    );

    // Link the consultation to this new booking
    await client.query(
      `UPDATE "Consultation" SET booking_id = $1, updated_at = NOW() WHERE consultation_id = $2`,
      [bookingId, id]
    );

    // Return the new booking
    const bookingResult = await client.query(
      `SELECT b.id, b.booking_reference, b.appointment_date_time, b.appointment_status,
              b.placement, b.estimated_size, a.full_name as artist_name
       FROM "Booking" b
       LEFT JOIN "Artist" a ON b.artist_id = a.id
       WHERE b.id = $1`,
      [bookingId]
    );

    res.status(201).json({
      success: true,
      message: 'Booking created from consultation',
      booking: bookingResult.rows[0],
    });
  } catch (error) {
    console.error('Convert consultation to booking error:', error);
    res.status(500).json({ success: false, error: 'Failed to create booking' });
  } finally {
    await client.end();
  }
});

export default router;
