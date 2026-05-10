import express from 'express';
import { submitContact, getContactSubmissions, markAsRead, } from '../controllers/contactController.js';
const router = express.Router();
router.post('/', submitContact);
router.get('/', getContactSubmissions);
router.patch('/:id/read', markAsRead);
export default router;
//# sourceMappingURL=contact.js.map