import express from 'express';
import { getAllActiveArtists } from '../controllers/artistController.js';
import {
  getArtistBookings,
  getArtistBookingById,
  updateBookingStatusByArtist,
} from '../controllers/bookingController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getAllActiveArtists);

// Protected routes (require authentication)
router.get('/bookings', authMiddleware, getArtistBookings);
router.get('/bookings/:id', authMiddleware, getArtistBookingById);
router.patch('/bookings/:id', authMiddleware, updateBookingStatusByArtist);

export default router;
