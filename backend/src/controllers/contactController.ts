import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const CreateContactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

export async function submitContact(req: Request, res: Response) {
  try {
    const validatedData = CreateContactSchema.parse(req.body);

    const submission = await prisma.contactFormSubmission.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        message: validatedData.message,
        response_status: 'new',
      },
    });

    res.status(201).json({
      success: true,
      message: 'Your message has been sent. We will get back to you shortly.',
      submission,
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
  }
}

export async function getContactSubmissions(req: Request, res: Response) {
  try {
    const submissions = await prisma.contactFormSubmission.findMany({
      orderBy: { created_at: 'desc' },
    });

    res.json({
      success: true,
      submissions,
    });
  } catch (error) {
    console.error('Fetch submissions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch submissions',
    });
  }
}

export async function markAsRead(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const submission = await prisma.contactFormSubmission.update({
      where: { id },
      data: { response_status: 'read' },
    });

    res.json({
      success: true,
      message: 'Submission marked as read',
      submission,
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update submission',
    });
  }
}
