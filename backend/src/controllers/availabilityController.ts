import { Request, Response } from 'express';
import pkg from 'pg';
import { randomUUID } from 'crypto';

const { Client } = pkg;

// 12 hourly slots: 09:00 – 20:00 (9am – 8pm)
export const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00',
  '17:00', '18:00', '19:00', '20:00',
];

/** Expand a booking into the hour slots it occupies. */
function expandBookingSlots(
  startHour: number,
  durationMinutes: number,
  status: string
): string[] {
  // Pending bookings only hold their start hour until artist sets duration
  const effectiveDuration =
    status === 'confirmed' || status === 'completed' ? durationMinutes : 60;
  const slotsNeeded = Math.ceil(effectiveDuration / 60);
  const occupied: string[] = [];
  for (let i = 0; i < slotsNeeded; i++) {
    const h = startHour + i;
    const slotStr = `${String(h).padStart(2, '0')}:00`;
    if (TIME_SLOTS.includes(slotStr)) occupied.push(slotStr);
  }
  return occupied;
}

export async function getArtistAvailability(req: Request, res: Response) {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    const { artistId } = req.params;
    const { month } = req.query;

    if (!month || typeof month !== 'string' || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ success: false, error: 'Invalid month format. Use YYYY-MM.' });
    }

    const [year, monthNum] = month.split('-').map(Number);
    const startDate = `${year}-${String(monthNum).padStart(2, '0')}-01`;
    const lastDay = new Date(year, monthNum, 0).getDate();
    const endDate = `${year}-${String(monthNum).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    await client.connect();

    // Booking window: how many months ahead clients can book.
    // Defaults to 3 if column missing or NULL. Range enforced at write time.
    const artistRow = await client.query(
      `SELECT booking_window_months FROM "Artist" WHERE id = $1`,
      [artistId]
    );
    const bookingWindowMonths = Number(artistRow.rows[0]?.booking_window_months) || 3;

    // Compute the last day clients can book (today + window months, end of that month)
    const today = new Date();
    const windowEnd = new Date(today.getFullYear(), today.getMonth() + bookingWindowMonths, 0);
    const maxBookingDate = `${windowEnd.getFullYear()}-${String(windowEnd.getMonth() + 1).padStart(2, '0')}-${String(windowEnd.getDate()).padStart(2, '0')}`;

    // Manual artist blocks (whole day or specific slot)
    const blocksResult = await client.query(
      `SELECT id, artist_id, blocked_date::text as blocked_date, blocked_slot, reason
       FROM "AvailabilityBlock"
       WHERE artist_id = $1 AND blocked_date >= $2 AND blocked_date <= $3
       ORDER BY blocked_date`,
      [artistId, startDate, endDate]
    );

    // Non-cancelled bookings — need start hour, duration, and status
    const bookedResult = await client.query(
      `SELECT
         appointment_date_time::date::text AS appointment_date,
         appointment_time AS start_hour,
         appointment_status AS status,
         estimated_duration_minutes AS duration
       FROM "Booking"
       WHERE artist_id = $1
         AND appointment_date_time::date >= $2
         AND appointment_date_time::date <= $3
         AND appointment_status != 'cancelled'
         AND appointment_time IS NOT NULL`,
      [artistId, startDate, endDate]
    );

    // Build slot data map
    const slotData: Record<string, { blocked: string[]; booked: string[] }> = {};

    // Artist manual slot blocks
    for (const row of blocksResult.rows) {
      if (row.blocked_slot) {
        if (!slotData[row.blocked_date]) slotData[row.blocked_date] = { blocked: [], booked: [] };
        slotData[row.blocked_date].blocked.push(row.blocked_slot);
      }
    }

    // Duration-aware booking blocks
    for (const row of bookedResult.rows) {
      const startHour = parseInt(row.start_hour.substring(0, 2), 10);
      if (isNaN(startHour)) continue;
      const occupied = expandBookingSlots(startHour, Number(row.duration) || 120, row.status);
      for (const slot of occupied) {
        if (!slotData[row.appointment_date]) slotData[row.appointment_date] = { blocked: [], booked: [] };
        if (!slotData[row.appointment_date].booked.includes(slot)) {
          slotData[row.appointment_date].booked.push(slot);
        }
      }
    }

    // Full-day manual blocks
    const manualFullDayBlocks = blocksResult.rows
      .filter((r) => !r.blocked_slot)
      .map((r) => r.blocked_date as string);

    // Auto-detect fully-booked days (all 12 hourly slots taken)
    const autoFullyBlockedDays: string[] = [];
    for (const [date, data] of Object.entries(slotData)) {
      const unavailable = new Set([...data.blocked, ...data.booked]);
      if (TIME_SLOTS.every((s) => unavailable.has(s))) {
        autoFullyBlockedDays.push(date);
      }
    }

    const blockedDays = [...new Set([...manualFullDayBlocks, ...autoFullyBlockedDays])];

    res.json({
      success: true,
      month,
      blockedDays,
      slotData,
      blocks: blocksResult.rows,
      bookingWindowMonths,
      maxBookingDate,
    });
  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch availability' });
  } finally {
    await client.end();
  }
}

export async function blockDate(req: Request, res: Response) {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    if (!req.artist) return res.status(401).json({ success: false, error: 'Not authenticated' });

    const { date, slot, reason } = req.body;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ success: false, error: 'Invalid date. Use YYYY-MM-DD.' });
    }

    // Slot must be HH:MM format (1-hour start) or null (whole day)
    if (slot != null && !/^\d{2}:\d{2}$/.test(slot)) {
      return res.status(400).json({ success: false, error: 'Invalid slot format. Use HH:MM.' });
    }

    await client.connect();

    const existing = await client.query(
      `SELECT id FROM "AvailabilityBlock"
       WHERE artist_id = $1 AND blocked_date = $2 AND blocked_slot IS NOT DISTINCT FROM $3`,
      [req.artist.id, date, slot ?? null]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, error: 'This date/slot is already blocked.' });
    }

    const id = randomUUID();
    await client.query(
      `INSERT INTO "AvailabilityBlock" (id, artist_id, blocked_date, blocked_slot, reason, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [id, req.artist.id, date, slot ?? null, reason ?? null]
    );

    res.status(201).json({ success: true, id, message: 'Blocked successfully.' });
  } catch (error) {
    console.error('Block date error:', error);
    res.status(500).json({ success: false, error: 'Failed to block date' });
  } finally {
    await client.end();
  }
}

export async function unblockDate(req: Request, res: Response) {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    if (!req.artist) return res.status(401).json({ success: false, error: 'Not authenticated' });

    const { id } = req.params;
    await client.connect();

    const block = await client.query(
      `SELECT id FROM "AvailabilityBlock" WHERE id = $1 AND artist_id = $2`,
      [id, req.artist.id]
    );

    if (block.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Block not found.' });
    }

    await client.query('DELETE FROM "AvailabilityBlock" WHERE id = $1', [id]);

    res.json({ success: true, message: 'Block removed.' });
  } catch (error) {
    console.error('Unblock date error:', error);
    res.status(500).json({ success: false, error: 'Failed to remove block' });
  } finally {
    await client.end();
  }
}
