import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import pkg from 'pg';

const { Client } = pkg;

async function verifyClientOwnership(
  db: InstanceType<typeof Client>,
  bookingId: string,
  userId: string,
  email: string
): Promise<boolean> {
  const r = await db.query(
    `SELECT b.id FROM "Booking" b
     LEFT JOIN "User" u ON b.user_id = u.id
     WHERE b.id = $1 AND (b.user_id = $2 OR u.email = $3)`,
    [bookingId, userId, email]
  );
  return r.rows.length > 0;
}

// ── Client routes ──────────────────────────────────────────────────────────

export async function getClientThreads(req: Request, res: Response) {
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Not authenticated' });
    await db.connect();

    const result = await db.query(
      `SELECT
         b.id, b.booking_reference,
         b.appointment_date_time, b.appointment_status,
         a.full_name AS artist_name,
         (SELECT COUNT(*) FROM "Message" WHERE booking_id = b.id)::int AS total_messages,
         (SELECT COUNT(*) FROM "Message" WHERE booking_id = b.id AND sender_type = 'artist' AND read_at IS NULL)::int AS unread_count,
         (SELECT body FROM "Message" WHERE booking_id = b.id ORDER BY created_at DESC LIMIT 1) AS last_message_body,
         (SELECT sender_type FROM "Message" WHERE booking_id = b.id ORDER BY created_at DESC LIMIT 1) AS last_message_sender,
         (SELECT created_at FROM "Message" WHERE booking_id = b.id ORDER BY created_at DESC LIMIT 1) AS last_message_at
       FROM "Booking" b
       LEFT JOIN "Artist" a ON b.artist_id = a.id
       LEFT JOIN "User" u ON b.user_id = u.id
       WHERE (b.user_id = $1 OR u.email = $2) AND b.appointment_status != 'cancelled'
       ORDER BY last_message_at DESC NULLS LAST, b.appointment_date_time DESC`,
      [req.user.id, req.user.email]
    );

    res.json({ success: true, threads: result.rows });
  } catch (err) {
    console.error('getClientThreads error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch threads' });
  } finally {
    await db.end();
  }
}

export async function getClientMessages(req: Request, res: Response) {
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Not authenticated' });
    const { bookingId } = req.params;
    await db.connect();

    if (!(await verifyClientOwnership(db, bookingId, req.user.id, req.user.email))) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    await db.query(
      `UPDATE "Message" SET read_at = NOW()
       WHERE booking_id = $1 AND sender_type = 'artist' AND read_at IS NULL`,
      [bookingId]
    );

    const result = await db.query(
      `SELECT id, booking_id, sender_type, body, created_at, read_at
       FROM "Message" WHERE booking_id = $1 ORDER BY created_at ASC`,
      [bookingId]
    );

    res.json({ success: true, messages: result.rows });
  } catch (err) {
    console.error('getClientMessages error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch messages' });
  } finally {
    await db.end();
  }
}

export async function sendClientMessage(req: Request, res: Response) {
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Not authenticated' });
    const { bookingId } = req.params;
    const { body } = req.body;

    if (!body?.trim()) {
      return res.status(400).json({ success: false, error: 'Message body is required' });
    }

    await db.connect();

    if (!(await verifyClientOwnership(db, bookingId, req.user.id, req.user.email))) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    const id = randomUUID();
    const result = await db.query(
      `INSERT INTO "Message" (id, booking_id, sender_type, sender_id, body, created_at)
       VALUES ($1, $2, 'client', $3, $4, NOW())
       RETURNING id, booking_id, sender_type, body, created_at`,
      [id, bookingId, req.user.id, body.trim()]
    );

    res.status(201).json({ success: true, message: result.rows[0] });
  } catch (err) {
    console.error('sendClientMessage error:', err);
    res.status(500).json({ success: false, error: 'Failed to send message' });
  } finally {
    await db.end();
  }
}

// ── Artist routes ──────────────────────────────────────────────────────────

export async function getArtistThreads(req: Request, res: Response) {
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    if (!req.artist) return res.status(401).json({ success: false, error: 'Not authenticated' });
    await db.connect();

    const result = await db.query(
      `SELECT
         b.id, b.booking_reference,
         b.appointment_date_time, b.appointment_status,
         u.first_name, u.last_name, u.email AS client_email,
         (SELECT COUNT(*) FROM "Message" WHERE booking_id = b.id)::int AS total_messages,
         (SELECT COUNT(*) FROM "Message" WHERE booking_id = b.id AND sender_type = 'client' AND read_at IS NULL)::int AS unread_count,
         (SELECT body FROM "Message" WHERE booking_id = b.id ORDER BY created_at DESC LIMIT 1) AS last_message_body,
         (SELECT sender_type FROM "Message" WHERE booking_id = b.id ORDER BY created_at DESC LIMIT 1) AS last_message_sender,
         (SELECT created_at FROM "Message" WHERE booking_id = b.id ORDER BY created_at DESC LIMIT 1) AS last_message_at
       FROM "Booking" b
       LEFT JOIN "User" u ON b.user_id = u.id
       WHERE b.artist_id = $1 AND b.appointment_status != 'cancelled'
       ORDER BY last_message_at DESC NULLS LAST, b.appointment_date_time DESC`,
      [req.artist.id]
    );

    res.json({ success: true, threads: result.rows });
  } catch (err) {
    console.error('getArtistThreads error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch threads' });
  } finally {
    await db.end();
  }
}

export async function getArtistMessages(req: Request, res: Response) {
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    if (!req.artist) return res.status(401).json({ success: false, error: 'Not authenticated' });
    const { bookingId } = req.params;
    await db.connect();

    const ownerCheck = await db.query(
      `SELECT id FROM "Booking" WHERE id = $1 AND artist_id = $2`,
      [bookingId, req.artist.id]
    );
    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    await db.query(
      `UPDATE "Message" SET read_at = NOW()
       WHERE booking_id = $1 AND sender_type = 'client' AND read_at IS NULL`,
      [bookingId]
    );

    const result = await db.query(
      `SELECT id, booking_id, sender_type, body, created_at, read_at
       FROM "Message" WHERE booking_id = $1 ORDER BY created_at ASC`,
      [bookingId]
    );

    res.json({ success: true, messages: result.rows });
  } catch (err) {
    console.error('getArtistMessages error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch messages' });
  } finally {
    await db.end();
  }
}

export async function sendArtistMessage(req: Request, res: Response) {
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    if (!req.artist) return res.status(401).json({ success: false, error: 'Not authenticated' });
    const { bookingId } = req.params;
    const { body } = req.body;

    if (!body?.trim()) {
      return res.status(400).json({ success: false, error: 'Message body is required' });
    }

    await db.connect();

    const ownerCheck = await db.query(
      `SELECT id FROM "Booking" WHERE id = $1 AND artist_id = $2`,
      [bookingId, req.artist.id]
    );
    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    const id = randomUUID();
    const result = await db.query(
      `INSERT INTO "Message" (id, booking_id, sender_type, sender_id, body, created_at)
       VALUES ($1, $2, 'artist', $3, $4, NOW())
       RETURNING id, booking_id, sender_type, body, created_at`,
      [id, bookingId, req.artist.id, body.trim()]
    );

    res.status(201).json({ success: true, message: result.rows[0] });
  } catch (err) {
    console.error('sendArtistMessage error:', err);
    res.status(500).json({ success: false, error: 'Failed to send message' });
  } finally {
    await db.end();
  }
}
