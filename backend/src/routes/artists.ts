import express, { Request, Response } from 'express';
import pkg from 'pg';
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

const { Client } = pkg;
const router = express.Router();

// Public routes
router.get('/', getAllActiveArtists);

// PATCH /api/artist/profile — authenticated artist updates their own profile
router.patch('/profile', authMiddleware, async (req: Request, res: Response) => {
  const allowed = ['full_name', 'bio', 'specialties', 'years_experience', 'instagram_handle'];
  const updates = Object.entries(req.body).filter(([k]) => allowed.includes(k));
  if (updates.length === 0) return res.status(400).json({ error: 'No valid fields provided' });

  const setClauses = updates.map(([k], i) => `"${k}" = $${i + 1}`).join(', ');
  const values = [...updates.map(([, v]) => v), req.artist!.id];

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const result = await client.query(
      `UPDATE "Artist" SET ${setClauses}, updated_at = NOW()
       WHERE id = $${values.length}
       RETURNING id, full_name, bio, specialties, years_experience, instagram_handle, email`,
      values
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Artist not found' });
    res.json(result.rows[0]);
  } finally {
    await client.end();
  }
});

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
