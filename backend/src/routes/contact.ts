import express from 'express';
import {
  submitContact,
  getContactSubmissions,
  markAsRead,
} from '../controllers/contactController';

const router = express.Router();

router.post('/', submitContact);
router.get('/', getContactSubmissions);
router.patch('/:id/read', markAsRead);

export default router;
