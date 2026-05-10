import express from 'express';
import {
  createBooking,
  getBookings,
  getBookingById,
  updateBooking,
  cancelBooking,
} from '../controllers/bookingController.js';

const router = express.Router();

router.post('/', createBooking);
router.get('/', getBookings);
router.get('/:id', getBookingById);
router.patch('/:id', updateBooking);
router.delete('/:id', cancelBooking);

export default router;
