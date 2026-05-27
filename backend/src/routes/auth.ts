import express from 'express';
import { artistLogin, artistRefresh, getArtistProfile, changeArtistPassword } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/artist/login', artistLogin);
router.post('/artist/refresh', artistRefresh);
router.get('/me', authMiddleware, getArtistProfile);
router.post('/artist/change-password', authMiddleware, changeArtistPassword);

export default router;
