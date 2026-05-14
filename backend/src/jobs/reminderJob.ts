import pkg from 'pg';
import { sendReminderToClient, sendReminderToArtist, sendIntakeCheckToClient, sendWeeklySummaryToArtist } from '../services/emailService.js';

const { Client } = pkg;

async function sendIntakeChecks(): Promise<void> {
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await db.connect();
    const result = await db.query(`
      SELECT b.*,
             u.first_name, u.last_name, u.email as client_email,
             a.full_name as artist_name
      FROM "Booking" b
      JOIN "User" u ON b.user_id = u.id
      LEFT JOIN "Artist" a ON b.artist_id = a.id
      WHERE b.appointment_date_time::date = CURRENT_DATE + 3
        AND b.appointment_status IN ('confirmed', 'pending_consent')
        AND b.intake_sent_at IS NULL
    `);

    for (const booking of result.rows) {
      const appointmentDate = new Date(booking.appointment_date_time);
      await sendIntakeCheckToClient({
        clientEmail: booking.client_email,
        clientName: `${booking.first_name} ${booking.last_name}`,
        bookingReference: booking.booking_reference,
        appointmentDate,
        startTime: booking.appointment_time ?? undefined,
        artistName: booking.artist_name ?? undefined,
      }).catch((e: unknown) => console.error('[intake] email failed:', e));

      await db.query(`UPDATE "Booking" SET intake_sent_at = NOW() WHERE id = $1`, [booking.id]);
    }

    if (result.rows.length > 0) {
      console.log(`[intake] sent ${result.rows.length} intake check(s)`);
    }
  } catch (e) {
    console.error('[intake] job error:', e);
  } finally {
    await db.end();
  }
}

async function sendWeeklySummaries(): Promise<void> {
  const now = new Date();
  if (now.getDay() !== 1) return; // Monday only

  const db = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await db.connect();

    const todayStr = now.toISOString().split('T')[0];
    const artists = await db.query(`
      SELECT id, full_name, email
      FROM "Artist"
      WHERE is_active = true
        AND (weekly_summary_last_sent IS NULL OR weekly_summary_last_sent < $1::date)
    `, [todayStr]);

    for (const artist of artists.rows) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay() + 1); // Monday
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6); // Sunday

      const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      const weekLabel = `${fmt(weekStart)} – ${fmt(weekEnd)}`;

      const bookingRes = await db.query(`
        SELECT b.appointment_date_time, b.appointment_time, b.appointment_status,
               b.estimated_duration_minutes, u.first_name, u.last_name
        FROM "Booking" b
        JOIN "User" u ON b.user_id = u.id
        WHERE b.artist_id = $1
          AND b.appointment_date_time::date BETWEEN $2 AND $3
          AND b.appointment_status NOT IN ('cancelled')
        ORDER BY b.appointment_date_time ASC
      `, [artist.id, weekStart.toISOString().split('T')[0], weekEnd.toISOString().split('T')[0]]);

      const sessionRows = bookingRes.rows;
      const completed = sessionRows.filter((b: any) => b.appointment_status === 'completed');
      const confirmed = sessionRows.filter((b: any) => b.appointment_status === 'confirmed');

      const estRevenue = sessionRows.reduce((sum: number, b: any) => {
        return sum + Math.round((b.estimated_duration_minutes ?? 120) / 60 * 150);
      }, 0);

      const fmtHour = (t: string) => {
        const h = parseInt(t.substring(0, 2), 10);
        if (h < 12) return `${h}am`;
        if (h === 12) return '12pm';
        return `${h - 12}pm`;
      };

      const upcomingBookings = confirmed.map((b: any) => ({
        clientName: `${b.first_name} ${b.last_name}`,
        date: new Date(b.appointment_date_time).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }),
        time: b.appointment_time ? fmtHour(b.appointment_time) : '—',
        duration: b.estimated_duration_minutes ? `${Math.round(b.estimated_duration_minutes / 60)}h` : '—',
      }));

      await sendWeeklySummaryToArtist({
        artistEmail: artist.email,
        artistName: artist.full_name,
        weekLabel,
        sessionsCompleted: completed.length,
        sessionsConfirmed: confirmed.length,
        estimatedRevenue: estRevenue,
        upcomingBookings,
      }).catch((e: unknown) => console.error('[weekly] email failed:', e));

      await db.query(`UPDATE "Artist" SET weekly_summary_last_sent = $1 WHERE id = $2`, [todayStr, artist.id]);
    }

    if (artists.rows.length > 0) {
      console.log(`[weekly] sent ${artists.rows.length} weekly summary(ies)`);
    }
  } catch (e) {
    console.error('[weekly] job error:', e);
  } finally {
    await db.end();
  }
}

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
  sendTomorrowReminders();
  sendIntakeChecks();
  sendWeeklySummaries();

  setInterval(() => {
    sendTomorrowReminders();
    sendIntakeChecks();
    sendWeeklySummaries();
  }, 60 * 60 * 1000);

  console.log('⏰ Reminder job started (hourly: reminders + intake + weekly)');
}
