import { Router } from 'express';
import { clientSignup, clientLogin, clientRefresh, clientActivate, getClientProfile } from '../controllers/clientAuthController';
import { clientAuthMiddleware } from '../middleware/clientAuth';
const router = Router();
router.post('/signup', clientSignup);
router.post('/login', clientLogin);
router.post('/refresh', clientRefresh);
router.post('/activate', clientActivate);
router.get('/me', clientAuthMiddleware, getClientProfile);
export default router;
//# sourceMappingURL=clientAuth.js.map