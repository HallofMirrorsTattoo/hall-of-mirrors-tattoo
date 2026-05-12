import { Request, Response } from 'express';
import pkg from 'pg';
import { randomUUID } from 'crypto';

const { Client } = pkg;

export const TIME_SLOTS = [
  '09:00-11:00',
  '11:00-13:00',
  '13:00-15:00',
  '15:00-17:00',
  '17:00-19:00',
  '19:00-21:00',
];

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

    const blocksResult = await client.query(
      `SELECT id, artist_id, blocked_date::text as blocked_date, blocked_slot, reason
       FROM "AvailabilityBlock"
       WHERE artist_id = $1 AND blocked_date >= $2 AND blocked_date <= $3
       ORDER BY blocked_date`,
      [artistId, startDate, endDate]
    );

    const bookedResult = await client.query(
      `SELECT appointment_date_time::date::text as appointment_date, appointment_time
       FROM "Booking"
       WHERE artist_id = $1
         AND appointment_date_time::date >= $2
         AND appointment_date_time::date <= $3
         AND appointment_status != 'cancelled'
         AND appointment_time IS NOT NULL`,
      [artistId, startDate, endDate]
    );

    const slotData: Record<string, { blocked: string[]; booked: string[] }> = {};

    for (const row of blocksResult.rows) {
      if (row.blocked_slot) {
        if (!slotData[row.blocked_date]) slotData[row.blocked_date] = { blocked: [], booked: [] };
        slotData[row.blocked_date].blocked.push(row.blocked_slot);
      }
    }

    for (const row of bookedResult.rows) {
      if (row.appointment_time) {
        if (!slotData[row.appointment_date]) slotData[row.appointment_date] = { blocked: [], booked: [] };
        slotData[row.appointment_date].booked.push(row.appointment_time);
      }
    }

    const manualFullDayBlocks = blocksResult.rows
      .filter((r) => !r.blocked_slot)
      .map((r) => r.blocked_date as string);

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

    if (slot != null && !/^\d{2}:\d{2}-\d{2}:\d{2}$/.test(slot)) {
      return res.status(400).json({ success: false, error: 'Invalid slot format. Use HH:MM-HH:MM.' });
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
