import { Request, Response } from 'express';
import pkg from 'pg';
import { sendConsultationResponseToClient } from '../services/emailService.js';

const { Client } = pkg;

export async function getArtistConsultations(req: Request, res: Response) {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    if (!req.artist) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }
    await client.connect();
    const result = await client.query(
      `SELECT c.consultation_id, c.message, c.preferred_dates, c.status, c.artist_response, c.created_at,
              u.id as user_id, u.first_name, u.last_name, u.email
       FROM "Consultation" c
       JOIN "User" u ON c.user_id = u.id
       WHERE c.artist_id = $1
       ORDER BY c.created_at DESC`,
      [req.artist.id]
    );
    res.json({ success: true, consultations: result.rows });
  } catch (error) {
    console.error('Get consultations error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch consultations' });
  } finally {
    await client.end();
  }
}

export async function respondToConsultation(req: Request, res: Response) {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    if (!req.artist) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { id } = req.params;
    const { response_message } = req.body;

    if (!response_message?.trim()) {
      return res.status(400).json({ success: false, error: 'Response message is required' });
    }

    await client.connect();

    const result = await client.query(
      `UPDATE "Consultation"
       SET artist_response = $1, status = 'responded', updated_at = NOW()
       WHERE consultation_id = $2 AND artist_id = $3
       RETURNING consultation_id, status`,
      [response_message, id, req.artist.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Consultation not found' });
    }

    // Fetch client details for the email
    const clientResult = await client.query(
      `SELECT u.email, u.first_name FROM "User" u
       JOIN "Consultation" c ON c.user_id = u.id
       WHERE c.consultation_id = $1`,
      [id]
    );

    if (clientResult.rows.length > 0) {
      sendConsultationResponseToClient({
        clientEmail: clientResult.rows[0].email,
        clientName: clientResult.rows[0].first_name,
        artistName: req.artist.full_name,
        responseMessage: response_message,
      }).catch((e) => console.error('[email] consultation response email failed:', e));
    }

    res.json({ success: true, consultation: result.rows[0] });
  } catch (error) {
    console.error('Respond to consultation error:', error);
    res.status(500).json({ success: false, error: 'Failed to send response' });
  } finally {
    await client.end();
  }
}

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
