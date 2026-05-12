import { Request, Response } from 'express';
import pkg from 'pg';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import {
  sendBookingConfirmationToClient,
  sendBookingNotificationToStudio,
  sendBookingConfirmedToClient,
  sendRebookInvite,
  sendArtistCancellationToClient,
  sendArtistRescheduleToClient,
} from '../services/emailService.js';

const { Client } = pkg;

const CreateBookingSchema = z.object({
  clientName: z.string().min(2, 'Name must be at least 2 characters'),
  clientEmail: z.string().email('Invalid email address'),
  clientPhone: z.string().min(10, 'Phone number must be at least 10 digits'),
  // New format: separate date + time slot (HH:MM start hour)
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional(),
  appointmentTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time slot').optional(),
  // Legacy format: kept for backward compat
  preferredDate: z.string().optional(),
  tattooDesignDescription: z.string().min(10, 'Please describe your tattoo design'),
  estimatedSize: z.enum(['small', 'medium', 'large', 'xlarge']),
  estimatedPlacement: z.string().min(2, 'Please specify placement'),
  referralSource: z.string().optional(),
  notes: z.string().optional(),
  artistId: z.string().optional(),
}).refine(
  (d) => d.appointmentDate || d.preferredDate,
  { message: 'Please select a date', path: ['appointmentDate'] }
);

type BookingFormData = z.infer<typeof CreateBookingSchema>;

export async function createBooking(req: Request, res: Response) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const validatedData = CreateBookingSchema.parse(req.body);
    await client.connect();

    // Resolve appointment datetime and time slot
    let appointmentDateTime: string;
    let appointmentTime: string | null = null;

    if (validatedData.appointmentDate) {
      const slotStart = validatedData.appointmentTime
        ? validatedData.appointmentTime.split('-')[0]
        : '12:00';
      appointmentDateTime = `${validatedData.appointmentDate}T${slotStart}:00`;
      appointmentTime = validatedData.appointmentTime ?? null;
    } else {
      appointmentDateTime = validatedData.preferredDate!;
    }

    // Validate slot availability when artist + slot both specified
    if (validatedData.artistId && appointmentTime && validatedData.appointmentDate) {
      // Check artist's manual blocks (whole day or specific hour)
      const blockCheck = await client.query(
        `SELECT id FROM "AvailabilityBlock"
         WHERE artist_id = $1 AND blocked_date = $2
           AND (blocked_slot IS NULL OR blocked_slot = $3)
         LIMIT 1`,
        [validatedData.artistId, validatedData.appointmentDate, appointmentTime]
      );
      if (blockCheck.rows.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'This time slot is not available. Please select another.',
        });
      }

      // Duration-aware overlap check:
      // A pending booking blocks its exact start hour (60 min).
      // A confirmed/completed booking blocks start + duration range.
      const bookingCheck = await client.query(
        `SELECT id FROM "Booking"
         WHERE artist_id = $1
           AND appointment_date_time::date = $2
           AND appointment_status != 'cancelled'
           AND appointment_time IS NOT NULL
           AND (
             appointment_time = $3
             OR (
               appointment_status IN ('confirmed', 'completed')
               AND appointment_time::time <= $3::time
               AND (appointment_time::time
                    + (estimated_duration_minutes || ' minutes')::interval) > $3::time
             )
           )
         LIMIT 1`,
        [validatedData.artistId, validatedData.appointmentDate, appointmentTime]
      );
      if (bookingCheck.rows.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'This slot is not available. Please choose another time.',
        });
      }
    }

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
      userId = randomUUID();
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
    const bookingId = randomUUID();
    const bookingReference = `BK-${Date.now()}`;

    await client.query(
      `INSERT INTO "Booking" (
        id, studio_id, user_id, artist_id, appointment_date_time, appointment_time,
        appointment_status, tattoo_description, placement, estimated_size, artist_notes,
        deposit_amount, balance_due, booking_reference, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())`,
      [
        bookingId,
        'default-studio',
        userId,
        validatedData.artistId || null,
        appointmentDateTime,
        appointmentTime,
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

    // Fire emails non-blocking — don't let email failure block the response
    const appointmentDate = new Date(appointmentDateTime);
    sendBookingConfirmationToClient({
      clientEmail: validatedData.clientEmail,
      clientName: validatedData.clientName,
      bookingReference,
      appointmentDate,
      startTime: appointmentTime ?? undefined,
      placement: validatedData.estimatedPlacement,
      estimatedSize: validatedData.estimatedSize,
      artistName: artistData?.full_name,
    }).catch((e) => console.error('[email] confirmation failed:', e));

    sendBookingNotificationToStudio({
      clientName: validatedData.clientName,
      clientEmail: validatedData.clientEmail,
      clientPhone: validatedData.clientPhone,
      bookingReference,
      appointmentDate,
      placement: validatedData.estimatedPlacement,
      estimatedSize: validatedData.estimatedSize,
      description: validatedData.tattooDesignDescription,
      artistName: artistData?.full_name,
      artistEmail: artistData?.email,
    }).catch((e) => console.error('[email] studio notification failed:', e));

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
    const errorDetail = error instanceof Error ? error.stack : String(error);
    console.error('❌ Booking creation failed:', errorDetail);

    res.status(500).json({
      success: false,
      error: errorMessage, // send the actual error, not a generic string
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
       WHERE b.artist_id = $1
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
    const { status, notes, duration_hours, notify_end_time, new_appointment_date, new_appointment_time } = req.body;

    // Validate status
    const validStatuses = ['pending_consent', 'confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
      });
    }

    // duration_hours must be 1–8 if provided
    if (duration_hours !== undefined) {
      const dh = Number(duration_hours);
      if (!Number.isInteger(dh) || dh < 1 || dh > 8) {
        return res.status(400).json({ success: false, error: 'duration_hours must be 1–8.' });
      }
    }

    await client.connect();

    // Get booking with client info
    const bookingResult = await client.query(
      `SELECT b.*, u.first_name, u.last_name, u.email, u.phone,
              a.full_name as artist_name
       FROM "Booking" b
       JOIN "User" u ON b.user_id = u.id
       LEFT JOIN "Artist" a ON b.artist_id = a.id
       WHERE b.id = $1`,
      [id]
    );

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    const booking = bookingResult.rows[0];
    const previousStatus: string = booking.appointment_status;

    if (booking.artist_id !== req.artist.id) {
      return res.status(403).json({ success: false, error: 'You do not have access to this booking' });
    }

    // Build update fields
    const setClauses: string[] = ['appointment_status = $1', 'artist_notes = $2', 'updated_at = NOW()'];
    const params: unknown[] = [status, notes ?? booking.artist_notes, id];

    if (status === 'confirmed' && duration_hours !== undefined) {
      setClauses.push(`estimated_duration_minutes = $${params.length}`);
      params.splice(params.length - 1, 0, Number(duration_hours) * 60);
    }

    if (notify_end_time !== undefined) {
      setClauses.push(`notify_end_time = $${params.length}`);
      params.splice(params.length - 1, 0, Boolean(notify_end_time));
    }

    // Artist-initiated reschedule: update date + time
    if (new_appointment_date && new_appointment_time) {
      const newDateTime = `${new_appointment_date}T${new_appointment_time}:00`;
      setClauses.push(`appointment_date_time = $${params.length}`);
      params.splice(params.length - 1, 0, newDateTime);
      setClauses.push(`appointment_time = $${params.length}`);
      params.splice(params.length - 1, 0, new_appointment_time);
    }

    const updateResult = await client.query(
      `UPDATE "Booking" SET ${setClauses.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    );

    const updated = updateResult.rows[0];

    // ── Post-update emails ────────────────────────────────────────────────────

    // Booking confirmed with duration → send confirmed email to client
    if (status === 'confirmed' && duration_hours !== undefined && booking.email && booking.appointment_time) {
      const startHour = parseInt(booking.appointment_time.substring(0, 2), 10);
      const endHour = startHour + Number(duration_hours);
      const appointmentDate = new Date(booking.appointment_date_time);
      const notifyEnd = notify_end_time !== undefined ? Boolean(notify_end_time) : true;

      sendBookingConfirmedToClient({
        clientEmail: booking.email,
        clientName: `${booking.first_name} ${booking.last_name}`,
        bookingReference: booking.booking_reference,
        appointmentDate,
        startTime: booking.appointment_time,
        endTime: `${String(endHour).padStart(2, '0')}:00`,
        notifyEndTime: notifyEnd,
        artistName: booking.artist_name ?? undefined,
      }).catch((e) => console.error('[email] booking confirmed failed:', e));
    }

    // Artist cancelled a previously confirmed booking → notify client
    if (status === 'cancelled' && previousStatus === 'confirmed' && booking.email) {
      sendArtistCancellationToClient({
        clientEmail: booking.email,
        clientName: `${booking.first_name} ${booking.last_name}`,
        bookingReference: booking.booking_reference,
        appointmentDate: new Date(booking.appointment_date_time),
        artistName: booking.artist_name ?? undefined,
      }).catch((e) => console.error('[email] cancellation notification failed:', e));
    }

    // Artist rescheduled → notify client of new date/time
    if (new_appointment_date && new_appointment_time && booking.email) {
      sendArtistRescheduleToClient({
        clientEmail: booking.email,
        clientName: `${booking.first_name} ${booking.last_name}`,
        bookingReference: booking.booking_reference,
        newAppointmentDate: new Date(`${new_appointment_date}T${new_appointment_time}:00`),
        newStartTime: new_appointment_time,
        artistName: booking.artist_name ?? undefined,
      }).catch((e) => console.error('[email] reschedule notification failed:', e));
    }

    res.json({
      success: true,
      message: 'Booking status updated',
      booking: updated,
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

export async function sendRebookInviteByArtist(req: Request, res: Response) {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    if (!req.artist) return res.status(401).json({ success: false, error: 'Not authenticated' });

    const { id } = req.params;
    await client.connect();

    const result = await client.query(
      `SELECT b.appointment_status, b.artist_id,
              u.first_name, u.last_name, u.email,
              a.full_name as artist_name
       FROM "Booking" b
       JOIN "User" u ON b.user_id = u.id
       LEFT JOIN "Artist" a ON b.artist_id = a.id
       WHERE b.id = $1`,
      [id]
    );

    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Booking not found' });

    const booking = result.rows[0];
    if (booking.artist_id !== req.artist.id) return res.status(403).json({ success: false, error: 'Access denied' });
    if (booking.appointment_status !== 'completed') return res.status(400).json({ success: false, error: 'Rebook invite can only be sent for completed bookings' });

    await sendRebookInvite({
      clientEmail: booking.email,
      clientName: `${booking.first_name} ${booking.last_name}`,
      artistName: booking.artist_name ?? undefined,
    });

    res.json({ success: true, message: 'Rebook invite sent' });
  } catch (error) {
    console.error('Rebook invite error:', error);
    res.status(500).json({ success: false, error: 'Failed to send invite' });
  } finally {
    await client.end();
  }
}
