import { Router, Request, Response } from 'express';
import pkg from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { clientAuthMiddleware } from '../middleware/clientAuth.js';

const { Client } = pkg;
const router = Router();

// Middleware to verify authentication
router.use(clientAuthMiddleware);

// POST create design idea
router.post('/', async (req: Request, res: Response) => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

    const { image_url, description, booking_id } = req.body;

    if (!image_url) {
      return res.status(400).json({
        success: false,
        error: 'Image URL is required',
      });
    }

    await client.connect();

    // Create design idea
    const result = await client.query(
      `INSERT INTO "DesignIdea" (design_idea_id, user_id, booking_id, image_url, description, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING design_idea_id, image_url, description, created_at`,
      [uuidv4(), req.user.id, booking_id || null, image_url, description || null]
    );

    res.status(201).json({
      success: true,
      message: 'Design idea created',
      design_idea: result.rows[0],
    });
  } catch (error) {
    console.error('Create design idea error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create design idea',
    });
  } finally {
    await client.end();
  }
});

// GET all design ideas for user
router.get('/', async (req: Request, res: Response) => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

    await client.connect();

    const result = await client.query(
      `SELECT design_idea_id, booking_id, image_url, description, created_at
       FROM "DesignIdea"
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json({
      success: true,
      design_ideas: result.rows,
    });
  } catch (error) {
    console.error('Fetch design ideas error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch design ideas',
    });
  } finally {
    await client.end();
  }
});

// DELETE design idea
router.delete('/:id', async (req: Request, res: Response) => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

    const { id } = req.params;

    await client.connect();

    // Verify design idea belongs to user
    const designResult = await client.query(
      `SELECT design_idea_id FROM "DesignIdea" WHERE design_idea_id = $1 AND user_id = $2`,
      [id, req.user.id]
    );

    if (designResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Design idea not found',
      });
    }

    // Delete design idea
    await client.query(
      `DELETE FROM "DesignIdea" WHERE design_idea_id = $1`,
      [id]
    );

    res.json({
      success: true,
      message: 'Design idea deleted',
    });
  } catch (error) {
    console.error('Delete design idea error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete design idea',
    });
  } finally {
    await client.end();
  }
});

export default router;
