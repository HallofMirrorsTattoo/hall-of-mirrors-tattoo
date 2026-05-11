import { Router } from 'express';
import {
  clientSignup,
  clientLogin,
  clientRefresh,
  clientActivate,
  getClientProfile,
  forgotPassword,
  resetPassword,
  updateClientProfile,
} from '../controllers/clientAuthController.js';
import { clientAuthMiddleware } from '../middleware/clientAuth.js';

const router = Router();

router.post('/signup', clientSignup);
router.post('/login', clientLogin);
router.post('/refresh', clientRefresh);
router.post('/activate', clientActivate);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', clientAuthMiddleware, getClientProfile);
router.patch('/me', clientAuthMiddleware, updateClientProfile);

export default router;
