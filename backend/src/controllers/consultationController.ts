import { Request, Response } from 'express';
import pkg from 'pg';
import { z } from 'zod';
import { randomUUID } from 'crypto';

const { Client } = pkg;

const CreateConsultationSchema = z.object({
  clientName: z.string().min(2, 'Name must be at least 2 characters'),
  clientEmail: z.string().email('Invalid email address'),
  clientPhone: z.string().min(10, 'Phone number must be at least 10 digits'),
  preferredDate: z.string().optional(),
  consultationType: z.enum(['initial', 'design_review', 'follow_up']).optional(),
  message: z.string().min(10, 'Please provide more details about your consultation request'),
  interestedIn: z.string().optional(),
});

type ConsultationFormData = z.infer<typeof CreateConsultationSchema>;

export async function createConsultation(req: Request, res: Response) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const validatedData = CreateConsultationSchema.parse(req.body);
    await client.connect();

    const id = randomUUID();
    await client.query(
      `INSERT INTO "ConsultationRequest" (id, name, email, phone, tattoo_idea, preferred_contact_method, consultation_status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [id, validatedData.clientName, validatedData.clientEmail, validatedData.clientPhone, validatedData.message, validatedData.interestedIn || null, 'new']
    );

    const result = await client.query(
      'SELECT * FROM "ConsultationRequest" WHERE id = $1',
      [id]
    );

    res.status(201).json({
      success: true,
      message: 'Consultation request submitted successfully. We will contact you soon.',
      consultation: result.rows[0],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }

    console.error('Consultation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create consultation request',
    });
  } finally {
    await client.end();
  }
}

export async function getConsultations(req: Request, res: Response) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();

    const result = await client.query(
      'SELECT * FROM "ConsultationRequest" ORDER BY created_at DESC'
    );

    res.json({
      success: true,
      consultations: result.rows,
    });
  } catch (error) {
    console.error('Fetch consultations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch consultations',
    });
  } finally {
    await client.end();
  }
}

export async function getConsultationById(req: Request, res: Response) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const { id } = req.params;
    await client.connect();

    const result = await client.query(
      'SELECT * FROM "ConsultationRequest" WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Consultation not found',
      });
    }

    res.json({
      success: true,
      consultation: result.rows[0],
    });
  } catch (error) {
    console.error('Fetch consultation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch consultation',
    });
  } finally {
    await client.end();
  }
}

export async function updateConsultation(req: Request, res: Response) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const { id } = req.params;
    const { consultation_status, response_message } = req.body;
    await client.connect();

    const updates: string[] = [];
    const values: any[] = [id];
    let paramIndex = 2;

    if (consultation_status) {
      updates.push(`consultation_status = $${paramIndex}`);
      values.push(consultation_status);
      paramIndex++;
    }

    if (response_message) {
      updates.push(`response_message = $${paramIndex}`);
      values.push(response_message);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update',
      });
    }

    await client.query(
      `UPDATE "ConsultationRequest" SET ${updates.join(', ')} WHERE id = $1`,
      values
    );

    const result = await client.query(
      'SELECT * FROM "ConsultationRequest" WHERE id = $1',
      [id]
    );

    res.json({
      success: true,
      message: 'Consultation updated successfully',
      consultation: result.rows[0],
    });
  } catch (error) {
    console.error('Update consultation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update consultation',
    });
  } finally {
    await client.end();
  }
}
