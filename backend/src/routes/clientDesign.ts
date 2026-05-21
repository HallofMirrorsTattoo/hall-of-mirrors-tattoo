import { Router, Request, Response } from 'express';
import pkg from 'pg';
import { randomUUID } from 'crypto';
import { multerUpload, uploadToSupabase } from '../utils/storage.js';
import { clientAuthMiddleware } from '../middleware/clientAuth.js';

const { Client } = pkg;
const router = Router();

router.use(clientAuthMiddleware);

// POST /api/client/design-ideas — accepts file upload OR image_url
router.post('/', multerUpload.single('image'), async (req: Request, res: Response) => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Not authenticated' });

    const description: string | undefined = req.body.description || undefined;
    const bookingId: string | undefined = req.body.booking_id || undefined;

    let imageUrl: string;

    if (req.file) {
      // File upload path
      imageUrl = await uploadToSupabase(req.file.buffer, req.file.originalname, req.file.mimetype);
    } else if (req.body.image_url) {
      // URL path (backward compatible)
      imageUrl = req.body.image_url;
    } else {
      return res.status(400).json({ success: false, error: 'Provide either an image file or image_url' });
    }

    await client.connect();

    const result = await client.query(
      `INSERT INTO "DesignIdea" (design_idea_id, user_id, booking_id, image_url, description, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING design_idea_id, image_url, description, created_at`,
      [randomUUID(), req.user.id, bookingId || null, imageUrl, description || null]
    );

    res.status(201).json({ success: true, design_idea: result.rows[0] });
  } catch (error) {
    console.error('Create design idea error:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed to create design idea' });
  } finally {
    await client.end();
  }
});

// GET /api/client/design-ideas
router.get('/', async (req: Request, res: Response) => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Not authenticated' });

    await client.connect();

    const result = await client.query(
      `SELECT design_idea_id, booking_id, image_url, description, created_at
       FROM "DesignIdea"
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json({ success: true, design_ideas: result.rows });
  } catch (error) {
    console.error('Fetch design ideas error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch design ideas' });
  } finally {
    await client.end();
  }
});

// DELETE /api/client/design-ideas/:id
router.delete('/:id', async (req: Request, res: Response) => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Not authenticated' });

    const { id } = req.params;
    await client.connect();

    const designResult = await client.query(
      `SELECT design_idea_id FROM "DesignIdea" WHERE design_idea_id = $1 AND user_id = $2`,
      [id, req.user.id]
    );

    if (designResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Design idea not found' });
    }

    await client.query(`DELETE FROM "DesignIdea" WHERE design_idea_id = $1`, [id]);
    res.json({ success: true, message: 'Design idea deleted' });
  } catch (error) {
    console.error('Delete design idea error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete design idea' });
  } finally {
    await client.end();
  }
});

export default router;
