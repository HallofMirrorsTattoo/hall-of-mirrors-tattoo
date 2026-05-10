import { Request, Response } from 'express';
import pkg from 'pg';

const { Client } = pkg;

export async function getAllActiveArtists(req: Request, res: Response) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();

    const result = await client.query(
      `SELECT id, full_name, specialties, years_experience, bio, instagram_handle
       FROM "Artist"
       WHERE is_active = true
       ORDER BY full_name ASC`
    );

    res.json({
      success: true,
      artists: result.rows,
    });
  } catch (error) {
    console.error('Get artists error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch artists',
    });
  } finally {
    await client.end();
  }
}
