import { Router, Request, Response } from 'express';
import pkg from 'pg';
import { authMiddleware } from '../middleware/auth.js';

const { Client } = pkg;

export const studioSettingsRouter = Router();
studioSettingsRouter.use(authMiddleware);

const PUBLIC_FIELDS = `
  studio_name, address, postcode, phone, email,
  hours_monday_start, hours_monday_end,
  hours_tuesday_start, hours_tuesday_end,
  hours_wednesday_start, hours_wednesday_end,
  hours_thursday_start, hours_thursday_end,
  hours_friday_start, hours_friday_end,
  hours_saturday_start, hours_saturday_end,
  hours_sunday_start, hours_sunday_end,
  deposit_amount_fixed, cancellation_policy_hours,
  instagram_handle, facebook_url, tiktok_handle,
  about_section
`;

export const publicStudioSettingsRouter = Router();

publicStudioSettingsRouter.get('/', async (req: Request, res: Response) => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const result = await client.query(`SELECT ${PUBLIC_FIELDS} FROM "Studio" LIMIT 1`);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Studio not found' });
    res.json(result.rows[0]);
  } finally {
    await client.end();
  }
});

async function getClient() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  return client;
}

// GET /api/artist/studio-settings
studioSettingsRouter.get('/', async (req: Request, res: Response) => {
  const client = await getClient();
  try {
    const result = await client.query(
      `SELECT id, studio_name, address, postcode, phone, email,
              hours_monday_start, hours_monday_end,
              hours_tuesday_start, hours_tuesday_end,
              hours_wednesday_start, hours_wednesday_end,
              hours_thursday_start, hours_thursday_end,
              hours_friday_start, hours_friday_end,
              hours_saturday_start, hours_saturday_end,
              hours_sunday_start, hours_sunday_end,
              deposit_amount_fixed, cancellation_policy_hours,
              instagram_handle, facebook_url, tiktok_handle,
              about_section
       FROM "Studio" LIMIT 1`
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Studio not found' });
    res.json(result.rows[0]);
  } finally {
    await client.end();
  }
});

// PATCH /api/artist/studio-settings
studioSettingsRouter.patch('/', async (req: Request, res: Response) => {
  const allowed = [
    'studio_name', 'address', 'postcode', 'phone', 'email',
    'hours_monday_start', 'hours_monday_end',
    'hours_tuesday_start', 'hours_tuesday_end',
    'hours_wednesday_start', 'hours_wednesday_end',
    'hours_thursday_start', 'hours_thursday_end',
    'hours_friday_start', 'hours_friday_end',
    'hours_saturday_start', 'hours_saturday_end',
    'hours_sunday_start', 'hours_sunday_end',
    'deposit_amount_fixed', 'cancellation_policy_hours',
    'instagram_handle', 'facebook_url', 'tiktok_handle',
    'about_section',
  ];

  const updates = Object.entries(req.body).filter(([k]) => allowed.includes(k));
  if (updates.length === 0) return res.status(400).json({ error: 'No valid fields provided' });

  const setClauses = updates.map(([k], i) => `"${k}" = $${i + 1}`).join(', ');
  const values = updates.map(([, v]) => v);

  const client = await getClient();
  try {
    const result = await client.query(
      `UPDATE "Studio" SET ${setClauses}, updated_at = NOW() WHERE id = (SELECT id FROM "Studio" LIMIT 1) RETURNING *`,
      values
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Studio not found' });
    res.json(result.rows[0]);
  } finally {
    await client.end();
  }
});
