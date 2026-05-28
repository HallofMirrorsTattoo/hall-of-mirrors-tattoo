import { Router } from 'express';
import { submitWalkInConsentForm } from '../controllers/consentController.js';
import { multerUpload } from '../utils/storage.js';

// Public endpoint — no clientAuthMiddleware. Used by the in-shop QR code and
// the footer link, both of which take walk-in clients straight to /consent
// without requiring them to register or log in first.
const router = Router();

router.post('/walk-in', multerUpload.single('id_proof'), submitWalkInConsentForm);

export default router;
