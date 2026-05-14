import { Router, Request, Response } from 'express';
import pkg from 'pg';
import { randomUUID } from 'crypto';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth.js';
import { sendFlashSlotClaimed } from '../services/emailService.js';

const { Client } = pkg;

// ── Supabase upload (reuses the design-ideas bucket under flash/ prefix) ──────

async function uploadToSupabase(buffer: Buffer, fileName: string, mimeType: string): Promise<string> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) throw new Error('Supabase storage not configured');
  const bucket = 'design-ideas';
  const path = `flash/${Date.now()}-${fileName}`;
  const res = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${serviceKey}`, 'Content-Type': mimeType, 'x-upsert': 'true' },
    body: buffer,
  });
  if (!res.ok) throw new Error(`Upload failed: ${await res.text()}`);
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Images only'));
  },
});

// ── Public router — /api/flash ────────────────────────────────────────────────

export const publicFlashRouter = Router();

// GET /api/flash — upcoming active flash days with their slots
publicFlashRouter.get('/', async (_req: Request, res: Response) => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    const result = await client.query(`
      SELECT
        fd.id, fd.event_date, fd.title, fd.description, fd.artist_id,
        a.full_name AS artist_name,
        COALESCE(
          json_agg(
            json_build_object(
              'id',           fs.id,
              'title',        fs.title,
              'price_pence',  fs.price_pence,
              'image_url',    fs.image_url,
              'is_available', fs.is_available,
              'claimed_by_name', CASE WHEN NOT fs.is_available THEN fs.claimed_by_name ELSE NULL END
            ) ORDER BY fs.created_at ASC
          ) FILTER (WHERE fs.id IS NOT NULL),
          '[]'
        ) AS slots
      FROM "FlashDay" fd
      JOIN "Artist" a ON a.id = fd.artist_id
      LEFT JOIN "FlashSlot" fs ON fs.flash_day_id = fd.id
      WHERE fd.is_active = TRUE AND fd.event_date >= CURRENT_DATE
      GROUP BY fd.id, a.full_name
      ORDER BY fd.event_date ASC
    `);
    res.json({ success: true, flash_days: result.rows });
  } catch (err) {
    console.error('Get flash days error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch flash days' });
  } finally {
    await client.end();
  }
});

// POST /api/flash/:slotId/claim — atomic claim (name + email required; phone optional)
publicFlashRouter.post('/:slotId/claim', async (req: Request, res: Response) => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    const { name, email, phone } = req.body;
    if (!name?.trim() || !email?.trim()) {
      return res.status(400).json({ success: false, error: 'Name and email are required' });
    }

    await client.connect();

    // Atomic update: only succeeds if is_available is TRUE
    const claim = await client.query(`
      UPDATE "FlashSlot"
      SET is_available = FALSE,
          claimed_by_name  = $1,
          claimed_by_email = $2,
          claimed_by_phone = $3,
          claimed_at       = NOW()
      WHERE id = $4 AND is_available = TRUE
      RETURNING id, title, price_pence, flash_day_id
    `, [name.trim(), email.trim().toLowerCase(), phone?.trim() || null, req.params.slotId]);

    if (claim.rows.length === 0) {
      return res.status(409).json({ success: false, error: 'This design has already been claimed' });
    }

    const slot = claim.rows[0];

    // Fetch flash day info for the email
    const dayRow = await client.query(`
      SELECT fd.title, fd.event_date, a.full_name AS artist_name
      FROM "FlashDay" fd
      JOIN "Artist" a ON a.id = fd.artist_id
      WHERE fd.id = $1
    `, [slot.flash_day_id]);

    const day = dayRow.rows[0];

    // Confirmation emails (best-effort — never fail the response)
    sendFlashSlotClaimed({
      clientName: name.trim(),
      clientEmail: email.trim().toLowerCase(),
      slotTitle: slot.title,
      pricePence: slot.price_pence,
      eventDate: day?.event_date,
      dayTitle: day?.title,
      artistName: day?.artist_name,
    }).catch((e: unknown) => console.warn('Flash claim email failed:', e));

    res.json({ success: true, message: 'Design claimed — check your email for confirmation.' });
  } catch (err) {
    console.error('Claim flash slot error:', err);
    res.status(500).json({ success: false, error: 'Failed to claim design' });
  } finally {
    await client.end();
  }
});

// ── Artist router — /api/artist/flash ─────────────────────────────────────────

export const artistFlashRouter = Router();
artistFlashRouter.use(authMiddleware);

// GET /api/artist/flash — all flash days for this artist (including past)
artistFlashRouter.get('/', async (req: Request, res: Response) => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    const result = await client.query(`
      SELECT
        fd.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id',              fs.id,
              'title',           fs.title,
              'price_pence',     fs.price_pence,
              'image_url',       fs.image_url,
              'is_available',    fs.is_available,
              'claimed_by_name', fs.claimed_by_name,
              'claimed_by_email',fs.claimed_by_email,
              'claimed_by_phone',fs.claimed_by_phone,
              'claimed_at',      fs.claimed_at
            ) ORDER BY fs.created_at ASC
          ) FILTER (WHERE fs.id IS NOT NULL),
          '[]'
        ) AS slots
      FROM "FlashDay" fd
      LEFT JOIN "FlashSlot" fs ON fs.flash_day_id = fd.id
      WHERE fd.artist_id = $1
      GROUP BY fd.id
      ORDER BY fd.event_date DESC
    `, [req.artist!.id]);
    res.json({ success: true, flash_days: result.rows });
  } catch (err) {
    console.error('Artist get flash days error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch flash days' });
  } finally {
    await client.end();
  }
});

// POST /api/artist/flash — create a flash day
artistFlashRouter.post('/', async (req: Request, res: Response) => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    const { event_date, title, description } = req.body;
    if (!event_date || !title?.trim()) {
      return res.status(400).json({ success: false, error: 'event_date and title are required' });
    }
    await client.connect();
    const result = await client.query(`
      INSERT INTO "FlashDay" (id, artist_id, event_date, title, description, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `, [randomUUID(), req.artist!.id, event_date, title.trim(), description?.trim() || null]);
    res.status(201).json({ success: true, flash_day: { ...result.rows[0], slots: [] } });
  } catch (err) {
    console.error('Create flash day error:', err);
    res.status(500).json({ success: false, error: 'Failed to create flash day' });
  } finally {
    await client.end();
  }
});

// PATCH /api/artist/flash/:dayId — edit a flash day
artistFlashRouter.patch('/:dayId', async (req: Request, res: Response) => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    const { event_date, title, description, is_active } = req.body;
    await client.connect();
    const result = await client.query(`
      UPDATE "FlashDay"
      SET
        event_date  = COALESCE($1, event_date),
        title       = COALESCE($2, title),
        description = COALESCE($3, description),
        is_active   = COALESCE($4, is_active)
      WHERE id = $5 AND artist_id = $6
      RETURNING *
    `, [event_date || null, title?.trim() || null, description?.trim() || null, is_active ?? null, req.params.dayId, req.artist!.id]);
    if (!result.rows[0]) return res.status(404).json({ success: false, error: 'Flash day not found' });
    res.json({ success: true, flash_day: result.rows[0] });
  } catch (err) {
    console.error('Update flash day error:', err);
    res.status(500).json({ success: false, error: 'Failed to update flash day' });
  } finally {
    await client.end();
  }
});

// DELETE /api/artist/flash/:dayId — delete a flash day (cascades to slots)
artistFlashRouter.delete('/:dayId', async (req: Request, res: Response) => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    const result = await client.query(`
      DELETE FROM "FlashDay" WHERE id = $1 AND artist_id = $2 RETURNING id
    `, [req.params.dayId, req.artist!.id]);
    if (!result.rows[0]) return res.status(404).json({ success: false, error: 'Flash day not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('Delete flash day error:', err);
    res.status(500).json({ success: false, error: 'Failed to delete flash day' });
  } finally {
    await client.end();
  }
});

// POST /api/artist/flash/:dayId/slots — add a design slot (multipart/form-data)
artistFlashRouter.post('/:dayId/slots', upload.single('image'), async (req: Request, res: Response) => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    const { title, price_pence } = req.body;
    if (!title?.trim() || !price_pence) {
      return res.status(400).json({ success: false, error: 'title and price_pence are required' });
    }
    const price = parseInt(price_pence, 10);
    if (isNaN(price) || price <= 0) {
      return res.status(400).json({ success: false, error: 'price_pence must be a positive integer' });
    }

    await client.connect();

    // Verify flash day belongs to this artist
    const dayCheck = await client.query(
      `SELECT id FROM "FlashDay" WHERE id = $1 AND artist_id = $2`,
      [req.params.dayId, req.artist!.id]
    );
    if (!dayCheck.rows[0]) return res.status(404).json({ success: false, error: 'Flash day not found' });

    let imageUrl: string | null = null;
    if (req.file) {
      const ext = req.file.originalname.split('.').pop() || 'jpg';
      imageUrl = await uploadToSupabase(req.file.buffer, `${randomUUID()}.${ext}`, req.file.mimetype);
    }

    const result = await client.query(`
      INSERT INTO "FlashSlot" (id, flash_day_id, title, price_pence, image_url, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `, [randomUUID(), req.params.dayId, title.trim(), price, imageUrl]);

    res.status(201).json({ success: true, slot: result.rows[0] });
  } catch (err) {
    console.error('Add flash slot error:', err);
    res.status(500).json({ success: false, error: 'Failed to add slot' });
  } finally {
    await client.end();
  }
});

// DELETE /api/artist/flash/:dayId/slots/:slotId — remove a design slot
artistFlashRouter.delete('/:dayId/slots/:slotId', async (req: Request, res: Response) => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    const result = await client.query(`
      DELETE FROM "FlashSlot"
      WHERE id = $1
        AND flash_day_id = $2
        AND EXISTS (SELECT 1 FROM "FlashDay" WHERE id = $2 AND artist_id = $3)
      RETURNING id
    `, [req.params.slotId, req.params.dayId, req.artist!.id]);
    if (!result.rows[0]) return res.status(404).json({ success: false, error: 'Slot not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('Delete slot error:', err);
    res.status(500).json({ success: false, error: 'Failed to delete slot' });
  } finally {
    await client.end();
  }
});

// PATCH /api/artist/flash/:dayId/slots/:slotId/release — unclaim a claimed slot
artistFlashRouter.patch('/:dayId/slots/:slotId/release', async (req: Request, res: Response) => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    const result = await client.query(`
      UPDATE "FlashSlot"
      SET is_available      = TRUE,
          claimed_by_name   = NULL,
          claimed_by_email  = NULL,
          claimed_by_phone  = NULL,
          claimed_by_user_id = NULL,
          claimed_at        = NULL
      WHERE id = $1
        AND flash_day_id = $2
        AND EXISTS (SELECT 1 FROM "FlashDay" WHERE id = $2 AND artist_id = $3)
      RETURNING id
    `, [req.params.slotId, req.params.dayId, req.artist!.id]);
    if (!result.rows[0]) return res.status(404).json({ success: false, error: 'Slot not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('Release slot error:', err);
    res.status(500).json({ success: false, error: 'Failed to release slot' });
  } finally {
    await client.end();
  }
});
