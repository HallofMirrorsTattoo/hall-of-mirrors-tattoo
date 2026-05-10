import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

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
  try {
    const validatedData = CreateConsultationSchema.parse(req.body);

    const consultation = await prisma.consultationRequest.create({
      data: {
        name: validatedData.clientName,
        email: validatedData.clientEmail,
        phone: validatedData.clientPhone,
        tattoo_idea: validatedData.message,
        preferred_contact_method: validatedData.interestedIn || null,
        consultation_status: 'new',
      },
    });

    res.status(201).json({
      success: true,
      message: 'Consultation request submitted successfully. We will contact you soon.',
      consultation,
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
  }
}

export async function getConsultations(req: Request, res: Response) {
  try {
    const consultations = await prisma.consultationRequest.findMany({
      orderBy: { created_at: 'desc' },
    });

    res.json({
      success: true,
      consultations,
    });
  } catch (error) {
    console.error('Fetch consultations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch consultations',
    });
  }
}

export async function getConsultationById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const consultation = await prisma.consultationRequest.findUnique({
      where: { id },
    });

    if (!consultation) {
      return res.status(404).json({
        success: false,
        error: 'Consultation not found',
      });
    }

    res.json({
      success: true,
      consultation,
    });
  } catch (error) {
    console.error('Fetch consultation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch consultation',
    });
  }
}

export async function updateConsultation(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { consultation_status, response_message } = req.body;

    const consultation = await prisma.consultationRequest.update({
      where: { id },
      data: {
        ...(consultation_status && { consultation_status }),
        ...(response_message && { response_message }),
      },
    });

    res.json({
      success: true,
      message: 'Consultation updated successfully',
      consultation,
    });
  } catch (error) {
    console.error('Update consultation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update consultation',
    });
  }
}
