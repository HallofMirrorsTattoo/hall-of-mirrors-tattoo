import { Request, Response } from 'express';
import pkg from 'pg';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const { Client } = pkg;

const CreateContactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

export async function submitContact(req: Request, res: Response) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const validatedData = CreateContactSchema.parse(req.body);
    await client.connect();

    const id = uuidv4();
    await client.query(
      `INSERT INTO "ContactFormSubmission" (id, name, email, message, response_status, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [id, validatedData.name, validatedData.email, validatedData.message, 'new']
    );

    const result = await client.query(
      'SELECT * FROM "ContactFormSubmission" WHERE id = $1',
      [id]
    );

    res.status(201).json({
      success: true,
      message: 'Your message has been sent. We will get back to you shortly.',
      submission: result.rows[0],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }

    console.error('Contact form error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit contact form',
    });
  } finally {
    await client.end();
  }
}

export async function getContactSubmissions(req: Request, res: Response) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();

    const result = await client.query(
      'SELECT * FROM "ContactFormSubmission" ORDER BY created_at DESC'
    );

    res.json({
      success: true,
      submissions: result.rows,
    });
  } catch (error) {
    console.error('Fetch submissions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch submissions',
    });
  } finally {
    await client.end();
  }
}

export async function markAsRead(req: Request, res: Response) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const { id } = req.params;
    await client.connect();

    await client.query(
      'UPDATE "ContactFormSubmission" SET response_status = $1 WHERE id = $2',
      ['read', id]
    );

    const result = await client.query(
      'SELECT * FROM "ContactFormSubmission" WHERE id = $1',
      [id]
    );

    res.json({
      success: true,
      message: 'Submission marked as read',
      submission: result.rows[0],
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update submission',
    });
  } finally {
    await client.end();
  }
}
