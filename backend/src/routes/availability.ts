import { Router } from 'express';
import { getArtistAvailability, blockDate, unblockDate } from '../controllers/availabilityController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Artist-protected routes come first to avoid /:artistId catching "block"
router.post('/block', authMiddleware, blockDate);
router.delete('/block/:id', authMiddleware, unblockDate);

// Public — clients check artist availability
router.get('/:artistId', getArtistAvailability);

export default router;
