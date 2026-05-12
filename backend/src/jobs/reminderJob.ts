import pkg from 'pg';
import { sendReminderToClient, sendReminderToArtist } from '../services/emailService.js';

const { Client } = pkg;

async function sendTomorrowReminders(): Promise<void> {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();

    const result = await client.query(`
      SELECT b.*,
             u.first_name, u.last_name, u.email as client_email, u.phone as client_phone,
             a.full_name as artist_name, a.email as artist_email
      FROM "Booking" b
      JOIN "User" u ON b.user_id = u.id
      LEFT JOIN "Artist" a ON b.artist_id = a.id
      WHERE b.appointment_date_time::date = CURRENT_DATE + 1
        AND b.appointment_status IN ('confirmed', 'pending_consent')
        AND b.reminder_sent_at IS NULL
    `);

    for (const booking of result.rows) {
      const appointmentDate = new Date(booking.appointment_date_time);
      const durationMinutes: number = booking.estimated_duration_minutes ?? 120;
      const startHour = booking.appointment_time
        ? parseInt(booking.appointment_time.substring(0, 2), 10)
        : null;
      const endTime = startHour !== null
        ? String(startHour + Math.round(durationMinutes / 60)).padStart(2, '0') + ':00'
        : null;

      await sendReminderToClient({
        clientEmail: booking.client_email,
        clientName: `${booking.first_name} ${booking.last_name}`,
        bookingReference: booking.booking_reference,
        appointmentDate,
        startTime: booking.appointment_time ?? undefined,
        endTime,
        notifyEndTime: booking.notify_end_time ?? true,
        artistName: booking.artist_name ?? undefined,
      }).catch((e: unknown) => console.error('[reminder] client email failed:', e));

      if (booking.artist_email) {
        await sendReminderToArtist({
          artistEmail: booking.artist_email,
          artistName: booking.artist_name ?? undefined,
          clientName: `${booking.first_name} ${booking.last_name}`,
          clientEmail: booking.client_email,
          clientPhone: booking.client_phone ?? undefined,
          bookingReference: booking.booking_reference,
          appointmentDate,
          startTime: booking.appointment_time ?? undefined,
          durationMinutes,
          placement: booking.placement ?? undefined,
          description: booking.tattoo_description ?? undefined,
        }).catch((e: unknown) => console.error('[reminder] artist email failed:', e));
      }

      await client.query(
        `UPDATE "Booking" SET reminder_sent_at = NOW() WHERE id = $1`,
        [booking.id]
      );
    }

    if (result.rows.length > 0) {
      console.log(`[reminder] sent ${result.rows.length} reminder(s) for tomorrow`);
    }
  } catch (e) {
    console.error('[reminder] job error:', e);
  } finally {
    await client.end();
  }
}

export function startReminderJob(): void {
  // Run once on startup to catch any missed reminders
  sendTomorrowReminders();
  // Then check every hour — reminder_sent_at prevents duplicates
  setInterval(sendTomorrowReminders, 60 * 60 * 1000);
  console.log('⏰ Reminder job started (hourly check)');
}
