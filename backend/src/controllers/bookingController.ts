import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const CreateBookingSchema = z.object({
  clientName: z.string().min(2, 'Name must be at least 2 characters'),
  clientEmail: z.string().email('Invalid email address'),
  clientPhone: z.string().min(10, 'Phone number must be at least 10 digits'),
  preferredDate: z.string().datetime('Invalid date format'),
  tattooDesignDescription: z.string().min(10, 'Please describe your tattoo design'),
  estimatedSize: z.enum(['small', 'medium', 'large', 'xlarge']),
  estimatedPlacement: z.string().min(2, 'Please specify placement'),
  referralSource: z.string().optional(),
  notes: z.string().optional(),
});

type BookingFormData = z.infer<typeof CreateBookingSchema>;

export async function createBooking(req: Request, res: Response) {
  try {
    const validatedData = CreateBookingSchema.parse(req.body);
    const [firstName, ...lastNameParts] = validatedData.clientName.split(' ');
    const lastName = lastNameParts.join(' ') || 'Guest';

    let user = await prisma.user.findUnique({
      where: { email: validatedData.clientEmail },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: validatedData.clientEmail,
          first_name: firstName,
          last_name: lastName,
          phone: validatedData.clientPhone,
          password_hash: '',
        },
      });
    }

    const booking = await prisma.booking.create({
      data: {
        studio_id: 'default-studio',
        user_id: user.id,
        appointment_date_time: new Date(validatedData.preferredDate),
        appointment_status: 'pending_consent',
        tattoo_description: validatedData.tattooDesignDescription,
        placement: validatedData.estimatedPlacement,
        estimated_size: validatedData.estimatedSize,
        artist_notes: validatedData.notes || null,
        deposit_amount: new (require('decimal.js'))('0'),
        balance_due: new (require('decimal.js'))('0'),
        booking_reference: `BK-${Date.now()}`,
      },
      include: {
        user: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Booking created successfully. You will receive a confirmation email shortly.',
      booking,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }

    console.error('Booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create booking',
    });
  }
}

export async function getBookings(req: Request, res: Response) {
  try {
    const bookings = await prisma.booking.findMany({
      include: { user: true },
      orderBy: { created_at: 'desc' },
    });

    res.json({
      success: true,
      bookings,
    });
  } catch (error) {
    console.error('Fetch bookings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bookings',
    });
  }
}

export async function getBookingById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
    }

    res.json({
      success: true,
      booking,
    });
  } catch (error) {
    console.error('Fetch booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch booking',
    });
  }
}

export async function updateBooking(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { appointment_status, artist_notes } = req.body;

    const booking = await prisma.booking.update({
      where: { id },
      data: {
        ...(appointment_status && { appointment_status }),
        ...(artist_notes && { artist_notes }),
      },
      include: { user: true },
    });

    res.json({
      success: true,
      message: 'Booking updated successfully',
      booking,
    });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update booking',
    });
  }
}

export async function cancelBooking(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.update({
      where: { id },
      data: { appointment_status: 'cancelled' },
      include: { user: true },
    });

    res.json({
      success: true,
      message: 'Booking cancelled',
      booking,
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel booking',
    });
  }
}
