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
  changeClientPassword,
  deleteClientAccount,
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
router.post('/change-password', clientAuthMiddleware, changeClientPassword);
router.delete('/me', clientAuthMiddleware, deleteClientAccount);

export default router;
