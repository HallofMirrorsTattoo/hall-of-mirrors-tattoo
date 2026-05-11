import { Router } from 'express';
import { clientAuthMiddleware } from '../middleware/clientAuth.js';
import { getConsentForm, submitConsentForm, getClientConsentForms } from '../controllers/consentController.js';

const router = Router();

router.use(clientAuthMiddleware);

router.get('/', getClientConsentForms);
router.get('/:bookingId', getConsentForm);
router.post('/:bookingId', submitConsentForm);

export default router;
