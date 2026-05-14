import express from 'express';
import { getAllActiveArtists, getArtistBySlug, getArtistConsultations, respondToConsultation, updateClientNotes } from '../controllers/artistController.js';
import {
  getArtistBookings,
  getArtistBookingById,
  updateBookingStatusByArtist,
  sendRebookInviteByArtist,
  artistCounterOffer,
  artistAcceptClientOffer,
  artistPriceOffer,
} from '../controllers/bookingController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getAllActiveArtists);

// Protected routes (require authentication)
router.get('/bookings', authMiddleware, getArtistBookings);
router.get('/bookings/:id', authMiddleware, getArtistBookingById);
router.patch('/bookings/:id', authMiddleware, updateBookingStatusByArtist);
router.post('/bookings/:id/rebook-invite', authMiddleware, sendRebookInviteByArtist);
router.post('/bookings/:id/counter-offer', authMiddleware, artistCounterOffer);
router.post('/bookings/:id/accept-offer', authMiddleware, artistAcceptClientOffer);
router.post('/bookings/:id/price-offer', authMiddleware, artistPriceOffer);
router.get('/consultations', authMiddleware, getArtistConsultations);
router.patch('/consultations/:id', authMiddleware, respondToConsultation);
router.patch('/clients/:userId/notes', authMiddleware, updateClientNotes);

// Public slug route — must be last to avoid intercepting named routes above
router.get('/:slug', getArtistBySlug);

export default router;
