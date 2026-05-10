import { Request, Response } from 'express';
import pkg from 'pg';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const { Client } = pkg;

const CreateBookingSchema = z.object({
  clientName: z.string().min(2, 'Name must be at least 2 characters'),
  clientEmail: z.string().email('Invalid email address'),
  clientPhone: z.string().min(10, 'Phone number must be at least 10 digits'),
  preferredDate: z.string().datetime('Invalid date format'),
  tattooDesignDescription: z.string().min(10, 'Please describe your tattoo design'),
  estimatedSize: z.enum(['small', 'medium', 'large', 'xlarge']),
  estimatedPlacement: z.string().min(2, 'Please specify placement'),
  referralSource: z.string().optional(),
  notes: z.string().optional(),
  artistId: z.string().optional(),
});

type BookingFormData = z.infer<typeof CreateBookingSchema>;

export async function createBooking(req: Request, res: Response) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const validatedData = CreateBookingSchema.parse(req.body);
    await client.connect();

    const [firstName, ...lastNameParts] = validatedData.clientName.split(' ');
    const lastName = lastNameParts.join(' ') || 'Guest';

    // Check if user exists
    const userResult = await client.query(
      `SELECT id, first_name, last_name, email, phone FROM "User" WHERE email = $1`,
      [validatedData.clientEmail]
    );

    let userId: string;
    if (userResult.rows.length > 0) {
      userId = userResult.rows[0].id;
    } else {
      userId = uuidv4();
      await client.query(
        `INSERT INTO "User" (id, email, first_name, last_name, phone, password_hash, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, '', NOW(), NOW())`,
        [userId, validatedData.clientEmail, firstName, lastName, validatedData.clientPhone]
      );
    }

    // Get artist if specified
    let artistData = null;
    if (validatedData.artistId) {
      const artistResult = await client.query(
        `SELECT id, full_name, email FROM "Artist" WHERE id = $1`,
        [validatedData.artistId]
      );
      if (artistResult.rows.length > 0) {
        artistData = artistResult.rows[0];
      }
    }

    // Create booking
    const bookingId = uuidv4();
    const bookingReference = `BK-${Date.now()}`;

    await client.query(
      `INSERT INTO "Booking" (
        id, studio_id, user_id, artist_id, appointment_date_time, appointment_status,
        tattoo_description, placement, estimated_size, artist_notes, deposit_amount,
        balance_due, booking_reference, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())`,
      [
        bookingId,
        'default-studio',
        userId,
        validatedData.artistId || null,
        validatedData.preferredDate,
        'pending_consent',
        validatedData.tattooDesignDescription,
        validatedData.estimatedPlacement,
        validatedData.estimatedSize,
        validatedData.notes || null,
        '0',
        '0',
        bookingReference,
      ]
    );

    // Fetch the created booking with related data
    const bookingResult = await client.query(
      `SELECT b.*, u.first_name, u.last_name, u.email, u.phone FROM "Booking" b
       JOIN "User" u ON b.user_id = u.id
       WHERE b.id = $1`,
      [bookingId]
    );

    const booking = bookingResult.rows[0];


    res.status(201).json({
      success: true,
      message: 'Booking created successfully. You will receive a confirmation email shortly.',
      booking,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Booking creation failed:', errorMessage);

    res.status(500).json({
      success: false,
      error: 'Failed to create booking',
      message: errorMessage,
    });
  } finally {
    await client.end();
  }
}

export async function getBookings(req: Request, res: Response) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();

    const result = await client.query(
      `SELECT b.*, u.id as user_id, u.first_name, u.last_name, u.email, u.phone
       FROM "Booking" b
       JOIN "User" u ON b.user_id = u.id
       ORDER BY b.created_at DESC`
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
}

export async function getBookingById(req: Request, res: Response) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const { id } = req.params;
    await client.connect();

    const result = await client.query(
      `SELECT b.*, u.id as user_id, u.first_name, u.last_name, u.email, u.phone
       FROM "Booking" b
       JOIN "User" u ON b.user_id = u.id
       WHERE b.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
    }

    res.json({
      success: true,
      booking: result.rows[0],
    });
  } catch (error) {
    console.error('Fetch booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch booking',
    });
  } finally {
    await client.end();
  }
}

export async function updateBooking(req: Request, res: Response) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const { id } = req.params;
    const { appointment_status, artist_notes } = req.body;
    await client.connect();

    const updates: string[] = ['updated_at = NOW()'];
    const params: any[] = [];
    let paramIndex = 1;

    if (appointment_status) {
      updates.push(`appointment_status = $${paramIndex}`);
      params.push(appointment_status);
      paramIndex++;
    }

    if (artist_notes) {
      updates.push(`artist_notes = $${paramIndex}`);
      params.push(artist_notes);
      paramIndex++;
    }

    params.push(id);

    const result = await client.query(
      `UPDATE "Booking" SET ${updates.join(', ')} WHERE id = $${paramIndex}
       RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
    }

    res.json({
      success: true,
      message: 'Booking updated successfully',
      booking: result.rows[0],
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
}

export async function cancelBooking(req: Request, res: Response) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const { id } = req.params;
    await client.connect();

    const result = await client.query(
      `UPDATE "Booking" SET appointment_status = 'cancelled', updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
    }

    res.json({
      success: true,
      message: 'Booking cancelled',
      booking: result.rows[0],
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel booking',
    });
  } finally {
    await client.end();
  }
}

// Artist-specific endpoints
export async function getArtistBookings(req: Request, res: Response) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    if (!req.artist) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

    await client.connect();

    const result = await client.query(
      `SELECT b.*, u.id as user_id, u.first_name, u.last_name, u.email, u.phone,
              a.id as artist_id, a.full_name as artist_name, a.email as artist_email
       FROM "Booking" b
       JOIN "User" u ON b.user_id = u.id
       LEFT JOIN "Artist" a ON b.artist_id = a.id
       WHERE b.artist_id = $1 AND b.appointment_status != 'cancelled'
       ORDER BY b.appointment_date_time ASC`,
      [req.artist.id]
    );

    res.json({
      success: true,
      bookings: result.rows,
    });
  } catch (error) {
    console.error('Get artist bookings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bookings',
    });
  } finally {
    await client.end();
  }
}

export async function getArtistBookingById(req: Request, res: Response) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    if (!req.artist) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

    const { id } = req.params;
    await client.connect();

    const result = await client.query(
      `SELECT b.*, u.id as user_id, u.first_name, u.last_name, u.email, u.phone,
              a.id as artist_id, a.full_name as artist_name, a.email as artist_email
       FROM "Booking" b
       JOIN "User" u ON b.user_id = u.id
       LEFT JOIN "Artist" a ON b.artist_id = a.id
       WHERE b.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
    }

    const booking = result.rows[0];

    // Check if this booking belongs to the artist
    if (booking.artist_id !== req.artist.id) {
      return res.status(403).json({
        success: false,
        error: 'You do not have access to this booking',
      });
    }

    res.json({
      success: true,
      booking,
    });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch booking',
    });
  } finally {
    await client.end();
  }
}

export async function updateBookingStatusByArtist(req: Request, res: Response) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    if (!req.artist) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

    const { id } = req.params;
    const { status, notes } = req.body;

    // Validate status
    const validStatuses = ['pending_consent', 'confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
      });
    }

    await client.connect();

    // Get booking
    const bookingResult = await client.query(
      `SELECT b.*, u.id as user_id, u.first_name, u.last_name, u.email, u.phone
       FROM "Booking" b
       JOIN "User" u ON b.user_id = u.id
       WHERE b.id = $1`,
      [id]
    );

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
    }

    const booking = bookingResult.rows[0];

    // Check if this booking belongs to the artist
    if (booking.artist_id !== req.artist.id) {
      return res.status(403).json({
        success: false,
        error: 'You do not have access to this booking',
      });
    }

    // Update booking status
    const updateResult = await client.query(
      `UPDATE "Booking" SET appointment_status = $1, artist_notes = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [status, notes || booking.artist_notes, id]
    );


    res.json({
      success: true,
      message: 'Booking status updated',
      booking: updateResult.rows[0],
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update booking',
    });
  } finally {
    await client.end();
  }
}
