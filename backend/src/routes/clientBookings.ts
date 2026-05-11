import { Router, Request, Response } from 'express';
import pkg from 'pg';
import { clientAuthMiddleware } from '../middleware/clientAuth.js';

const { Client } = pkg;
const router = Router();

// Middleware to verify authentication
router.use(clientAuthMiddleware);

// GET all client bookings
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
      `SELECT b.id, b.booking_reference, b.appointment_date, b.appointment_time,
              b.appointment_status, b.deposit_price, b.final_price, b.created_at,
              a.full_name as artist_name, a.instagram_handle
       FROM "Booking" b
       LEFT JOIN "Artist" a ON b.artist_id = a.id
       WHERE b.user_id = $1
       ORDER BY b.appointment_date DESC`,
      [req.user.id]
    );

    res.json({
      success: true,
      bookings: result.rows,
    });
  } catch (error) {
    console.error('Fetch bookings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bookings',
    });
  } finally {
    await client.end();
  }
});

// GET specific booking
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

    // First check if booking belongs to user
    const bookingResult = await client.query(
      `SELECT id FROM "Booking" WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    );

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
    }

    // Get full booking details
    const result = await client.query(
      `SELECT b.id, b.booking_reference, b.appointment_date, b.appointment_time,
              b.appointment_status, b.deposit_price, b.final_price, b.design_notes,
              b.tattoo_placement, b.estimated_duration, b.created_at, b.updated_at,
              a.id as artist_id, a.full_name as artist_name, a.specialties, a.bio, a.instagram_handle,
              di.id as design_idea_id, di.image_url, di.description
       FROM "Booking" b
       LEFT JOIN "Artist" a ON b.artist_id = a.id
       LEFT JOIN "DesignIdea" di ON b.id = di.booking_id
       WHERE b.id = $1 AND b.user_id = $2`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
    }

    // Combine booking with design ideas
    const booking = result.rows[0];
    const designIdeas = result.rows
      .filter(row => row.design_idea_id)
      .map(row => ({
        id: row.design_idea_id,
        image_url: row.image_url,
        description: row.description,
      }));

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
    res.status(500).json({
      success: false,
      error: 'Failed to fetch booking',
    });
  } finally {
    await client.end();
  }
});

// PATCH booking (update status)
router.patch('/:id', async (req: Request, res: Response) => {
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
    const { appointment_status } = req.body;

    // Only allow canceling or rescheduling
    const allowedStatuses = ['cancelled', 'rescheduled'];
    if (!allowedStatuses.includes(appointment_status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Only "cancelled" or "rescheduled" are allowed',
      });
    }

    await client.connect();

    // Verify booking belongs to user
    const bookingResult = await client.query(
      `SELECT id FROM "Booking" WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    );

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
    }

    // Update booking
    const updateResult = await client.query(
      `UPDATE "Booking"
       SET appointment_status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, booking_reference, appointment_status, updated_at`,
      [appointment_status, id]
    );

    res.json({
      success: true,
      message: `Booking ${appointment_status}`,
      booking: updateResult.rows[0],
    });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update booking',
    });
  } finally {
    await client.end();
  }
});

export default router;
