import { PrismaClient } from '@prisma/client';
import { Decimal } from 'decimal.js';
import { z } from 'zod';
import { sendNewBookingNotification, sendBookingStatusUpdate } from '../services/emailService.js';
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
    artistId: z.string().optional(),
});
export async function createBooking(req, res) {
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
        // Get artist if specified
        let artist = null;
        if (validatedData.artistId) {
            artist = await prisma.artist.findUnique({
                where: { id: validatedData.artistId },
            });
        }
        const booking = await prisma.booking.create({
            data: {
                studio_id: 'default-studio',
                user_id: user.id,
                artist_id: validatedData.artistId || null,
                appointment_date_time: new Date(validatedData.preferredDate),
                appointment_status: 'pending_consent',
                tattoo_description: validatedData.tattooDesignDescription,
                placement: validatedData.estimatedPlacement,
                estimated_size: validatedData.estimatedSize,
                artist_notes: validatedData.notes || null,
                deposit_amount: new Decimal('0'),
                balance_due: new Decimal('0'),
                booking_reference: `BK-${Date.now()}`,
            },
            include: {
                user: true,
                artist: true,
            },
        });
        // Send email notifications
        await sendNewBookingNotification({
            id: booking.id,
            booking_reference: booking.booking_reference,
            appointment_date_time: booking.appointment_date_time,
            tattoo_description: booking.tattoo_description || '',
            placement: booking.placement || '',
            estimated_size: booking.estimated_size || '',
            user: {
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                phone: user.phone || '',
            },
            artist: artist ? {
                id: artist.id,
                full_name: artist.full_name,
                email: artist.email,
            } : undefined,
        });
        res.status(201).json({
            success: true,
            message: 'Booking created successfully. You will receive a confirmation email shortly.',
            booking,
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: error.errors,
            });
        }
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorCode = error?.code;
        const errorMeta = error?.meta;
        console.error('❌ Booking creation failed');
        console.error('Error message:', errorMessage);
        console.error('Error code:', errorCode);
        console.error('Error meta:', errorMeta);
        console.error('Full error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create booking',
            message: errorMessage,
            code: errorCode,
            meta: errorMeta,
        });
    }
}
export async function getBookings(req, res) {
    try {
        const bookings = await prisma.booking.findMany({
            include: { user: true },
            orderBy: { created_at: 'desc' },
        });
        res.json({
            success: true,
            bookings,
        });
    }
    catch (error) {
        console.error('Fetch bookings error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch bookings',
        });
    }
}
export async function getBookingById(req, res) {
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
    }
    catch (error) {
        console.error('Fetch booking error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch booking',
        });
    }
}
export async function updateBooking(req, res) {
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
    }
    catch (error) {
        console.error('Update booking error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update booking',
        });
    }
}
export async function cancelBooking(req, res) {
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
    }
    catch (error) {
        console.error('Cancel booking error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to cancel booking',
        });
    }
}
// Artist-specific endpoints
export async function getArtistBookings(req, res) {
    try {
        if (!req.artist) {
            return res.status(401).json({
                success: false,
                error: 'Not authenticated',
            });
        }
        const bookings = await prisma.booking.findMany({
            where: {
                artist_id: req.artist.id,
                appointment_status: {
                    not: 'cancelled',
                },
            },
            include: {
                user: true,
                artist: true,
            },
            orderBy: {
                appointment_date_time: 'asc',
            },
        });
        res.json({
            success: true,
            bookings,
        });
    }
    catch (error) {
        console.error('Get artist bookings error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch bookings',
        });
    }
}
export async function getArtistBookingById(req, res) {
    try {
        if (!req.artist) {
            return res.status(401).json({
                success: false,
                error: 'Not authenticated',
            });
        }
        const { id } = req.params;
        const booking = await prisma.booking.findUnique({
            where: { id },
            include: {
                user: true,
                artist: true,
            },
        });
        if (!booking) {
            return res.status(404).json({
                success: false,
                error: 'Booking not found',
            });
        }
        // Check if this booking belongs to the artist
        if (booking.artist_id !== req.artist.id) {
            return res.status(403).json({
                success: false,
                error: 'You do not have access to this booking',
            });
        }
        res.json({
            success: true,
            booking,
        });
    }
    catch (error) {
        console.error('Get booking error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch booking',
        });
    }
}
export async function updateBookingStatusByArtist(req, res) {
    try {
        if (!req.artist) {
            return res.status(401).json({
                success: false,
                error: 'Not authenticated',
            });
        }
        const { id } = req.params;
        const { status, notes } = req.body;
        // Validate status
        const validStatuses = ['pending_consent', 'confirmed', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid status',
            });
        }
        const booking = await prisma.booking.findUnique({
            where: { id },
            include: { user: true, artist: true },
        });
        if (!booking) {
            return res.status(404).json({
                success: false,
                error: 'Booking not found',
            });
        }
        // Check if this booking belongs to the artist
        if (booking.artist_id !== req.artist.id) {
            return res.status(403).json({
                success: false,
                error: 'You do not have access to this booking',
            });
        }
        const updatedBooking = await prisma.booking.update({
            where: { id },
            data: {
                appointment_status: status,
                artist_notes: notes || booking.artist_notes,
            },
            include: { user: true, artist: true },
        });
        // Send email notification to client
        if (booking.user) {
            await sendBookingStatusUpdate(booking.user.email, `${booking.user.first_name} ${booking.user.last_name}`, booking.booking_reference, status, req.artist.full_name, notes);
        }
        res.json({
            success: true,
            message: 'Booking status updated',
            booking: updatedBooking,
        });
    }
    catch (error) {
        console.error('Update booking status error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update booking',
        });
    }
}
//# sourceMappingURL=bookingController.js.map