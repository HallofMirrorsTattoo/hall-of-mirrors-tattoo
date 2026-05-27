import express from 'express';
import { createConsultation } from '../controllers/consultationController.js';

const router = express.Router();

// Public — used by the public consultation request form.
router.post('/', createConsultation);

// Legacy unauthenticated GET/PATCH endpoints removed — artist reads/writes go
// through /api/artist/consultations (scoped by artist), client reads go through
// /api/client/consultations (scoped by user).

export default router;
