import express from 'express';
import { createBooking, getBookingById } from '../controllers/bookingController.js';

const router = express.Router();

// Public — used by the booking form. Validation lives in the controller.
router.post('/', createBooking);

// Single-booking lookup by ID. Returns minimal public info (no PII beyond what
// the booking holder already knows). Authenticated reads use /api/client/bookings
// or /api/artist/bookings, which scope by ownership.
router.get('/:id', getBookingById);

// Legacy unauthenticated list / mutate / cancel endpoints removed —
// list/PATCH/DELETE go through /api/client/bookings or /api/artist/bookings.

export default router;
