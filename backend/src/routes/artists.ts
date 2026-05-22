import express, { Request, Response } from 'express';
import pkg from 'pg';
import multer from 'multer';
import { randomUUID } from 'crypto';
import { getAllActiveArtists, getArtistBySlug, getArtistConsultations, respondToConsultation, updateClientNotes } from '../controllers/artistController.js';
import {
  getArtistBookings,
  getArtistBookingById,
  updateBookingStatusByArtist,
  sendRebookInviteByArtist,
  artistCounterOffer,
  artistAcceptClientOffer,
  artistPriceOffer,
} from '../controllers/bookingController.js';
import { authMiddleware } from '../middleware/auth.js';

const { Client } = pkg;
const router = express.Router();

// ── Portfolio photo upload helper (reuses design-ideas bucket) ─────────────

const PORTFOLIO_BUCKET = 'design-ideas';

const photoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

async function uploadPhotoToSupabase(buffer: Buffer, fileName: string, mimeType: string): Promise<{ publicUrl: string; storagePath: string }> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) throw new Error('Supabase storage not configured');

  const storagePath = `portfolio/${fileName}`;
  const res = await fetch(`${supabaseUrl}/storage/v1/object/${PORTFOLIO_BUCKET}/${storagePath}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${serviceKey}`, 'Content-Type': mimeType, 'x-upsert': 'true' },
    body: buffer,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Storage upload failed: ${err}`);
  }
  return {
    publicUrl: `${supabaseUrl}/storage/v1/object/public/${PORTFOLIO_BUCKET}/${storagePath}`,
    storagePath,
  };
}

async function deletePhotoFromSupabase(storagePath: string): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return;
  await fetch(`${supabaseUrl}/storage/v1/object/${PORTFOLIO_BUCKET}/${storagePath}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${serviceKey}` },
  });
}

// ── Public routes ──────────────────────────────────────────────────────────

router.get('/', getAllActiveArtists);

// ── Authenticated routes ───────────────────────────────────────────────────

// PATCH /api/artist/profile — artist updates their own Artist row
router.patch('/profile', authMiddleware, async (req: Request, res: Response) => {
  const allowed = ['full_name', 'bio', 'specialties', 'years_experience', 'instagram_handle', 'portrait_url'];
  const updates = Object.entries(req.body).filter(([k]) => allowed.includes(k));
  if (updates.length === 0) return res.status(400).json({ error: 'No valid fields provided' });

  const setClauses = updates.map(([k], i) => `"${k}" = $${i + 1}`).join(', ');
  const values = [...updates.map(([, v]) => v), req.artist!.id];

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const result = await client.query(
      `UPDATE "Artist" SET ${setClauses}, updated_at = NOW()
       WHERE id = $${values.length}
       RETURNING id, full_name, bio, specialties, years_experience, instagram_handle, email`,
      values
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Artist not found' });
    res.json(result.rows[0]);
  } finally {
    await client.end();
  }
});

// POST /api/artist/portrait — upload/replace artist profile portrait
const portraitUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

router.post('/portrait', authMiddleware, portraitUpload.single('portrait'), async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image file provided' });
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) return res.status(500).json({ error: 'Storage not configured — SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY missing' });

    const ext = req.file.originalname.split('.').pop()?.toLowerCase() ?? 'jpg';
    const fileName = `${req.artist!.id}.${ext}`;
    const storagePath = `portraits/${fileName}`;

    const storageRes = await fetch(`${supabaseUrl}/storage/v1/object/${PORTFOLIO_BUCKET}/${storagePath}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${serviceKey}`, 'Content-Type': req.file.mimetype, 'x-upsert': 'true' },
      body: req.file.buffer,
    });
    if (!storageRes.ok) {
      const err = await storageRes.text();
      console.error('[portrait] Supabase upload failed:', storageRes.status, err);
      return res.status(500).json({ error: `Storage upload failed (${storageRes.status}): ${err}` });
    }
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${PORTFOLIO_BUCKET}/${storagePath}`;

    const db = new Client({ connectionString: process.env.DATABASE_URL });
    await db.connect();
    try {
      await db.query(`UPDATE "Artist" SET portrait_url = $1, updated_at = NOW() WHERE id = $2`, [publicUrl, req.artist!.id]);
      res.json({ portrait_url: publicUrl });
    } finally {
      await db.end();
    }
  } catch (err: any) {
    console.error('[portrait] unhandled error:', err);
    res.status(500).json({ error: err.message ?? 'Portrait upload failed' });
  }
});

// GET /api/artist/photos — list own portfolio photos
router.get('/photos', authMiddleware, async (req: Request, res: Response) => {
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  try {
    const result = await db.query(
      `SELECT id, public_url, display_order, created_at FROM "PortfolioPhoto"
       WHERE artist_id = $1 ORDER BY display_order ASC, created_at ASC`,
      [req.artist!.id]
    );
    res.json({ success: true, photos: result.rows });
  } finally {
    await db.end();
  }
});

// POST /api/artist/photos — upload a new portfolio photo
router.post('/photos', authMiddleware, photoUpload.single('photo'), async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'No image file provided' });

  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  try {
    // Enforce max 20 photos
    const countResult = await db.query(
      `SELECT COUNT(*)::int AS total FROM "PortfolioPhoto" WHERE artist_id = $1`,
      [req.artist!.id]
    );
    if (countResult.rows[0].total >= 20) {
      return res.status(400).json({ error: 'Maximum 20 photos per portfolio. Delete some to upload more.' });
    }

    const ext = req.file.mimetype.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg';
    const fileName = `${req.artist!.id}/${randomUUID()}.${ext}`;
    const { publicUrl, storagePath } = await uploadPhotoToSupabase(req.file.buffer, fileName, req.file.mimetype);

    const orderResult = await db.query(
      `SELECT COALESCE(MAX(display_order), -1) + 1 AS next_order FROM "PortfolioPhoto" WHERE artist_id = $1`,
      [req.artist!.id]
    );
    const displayOrder = orderResult.rows[0].next_order;

    const id = randomUUID();
    const insertResult = await db.query(
      `INSERT INTO "PortfolioPhoto" (id, artist_id, public_url, storage_path, display_order, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id, public_url, display_order, created_at`,
      [id, req.artist!.id, publicUrl, storagePath, displayOrder]
    );
    res.status(201).json({ success: true, photo: insertResult.rows[0] });
  } catch (err: any) {
    console.error('Photo upload error:', err);
    res.status(500).json({ error: err.message ?? 'Upload failed' });
  } finally {
    await db.end();
  }
});

// DELETE /api/artist/photos/:id — delete own portfolio photo
router.delete('/photos/:id', authMiddleware, async (req: Request, res: Response) => {
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  try {
    const result = await db.query(
      `DELETE FROM "PortfolioPhoto" WHERE id = $1 AND artist_id = $2 RETURNING storage_path`,
      [req.params.id, req.artist!.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Photo not found' });
    deletePhotoFromSupabase(result.rows[0].storage_path).catch(() => {});
    res.json({ success: true });
  } finally {
    await db.end();
  }
});

router.get('/bookings', authMiddleware, getArtistBookings);
router.get('/bookings/:id/activity', authMiddleware, async (req: Request, res: Response) => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    if (!req.artist) return res.status(401).json({ error: 'Not authenticated' });
    const { id } = req.params;
    await client.connect();
    const check = await client.query(
      `SELECT id FROM "Booking" WHERE id = $1 AND artist_id = $2`,
      [id, req.artist.id]
    );
    if (check.rows.length === 0) return res.status(404).json({ error: 'Booking not found' });
    const result = await client.query(
      `SELECT id, actor_type, action, original_date, original_time, proposed_date, proposed_time, note, created_at
       FROM "BookingActivity" WHERE booking_id = $1 ORDER BY created_at ASC`,
      [id]
    );
    res.json({ success: true, activity: result.rows });
  } catch (err) {
    console.error('Activity fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch activity' });
  } finally {
    await client.end();
  }
});
router.get('/bookings/:id', authMiddleware, getArtistBookingById);
router.patch('/bookings/:id', authMiddleware, updateBookingStatusByArtist);
router.post('/bookings/:id/rebook-invite', authMiddleware, sendRebookInviteByArtist);
router.post('/bookings/:id/counter-offer', authMiddleware, artistCounterOffer);
router.post('/bookings/:id/accept-offer', authMiddleware, artistAcceptClientOffer);
router.post('/bookings/:id/price-offer', authMiddleware, artistPriceOffer);
router.get('/consultations', authMiddleware, getArtistConsultations);
router.patch('/consultations/:id', authMiddleware, respondToConsultation);
router.patch('/clients/:userId/notes', authMiddleware, updateClientNotes);

// Public slug route — must be last to avoid intercepting named routes above
router.get('/:slug', getArtistBySlug);

export default router;
