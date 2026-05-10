import express from 'express';
import { artistLogin, artistRefresh, getArtistProfile } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';
const router = express.Router();
router.post('/artist/login', artistLogin);
router.post('/artist/refresh', artistRefresh);
router.get('/me', authMiddleware, getArtistProfile);
export default router;
//# sourceMappingURL=auth.js.map