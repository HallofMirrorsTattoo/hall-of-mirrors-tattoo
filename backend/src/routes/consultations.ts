import express from 'express';
import {
  createConsultation,
  getConsultations,
  getConsultationById,
  updateConsultation,
} from '../controllers/consultationController.js';

const router = express.Router();

router.post('/', createConsultation);
router.get('/', getConsultations);
router.get('/:id', getConsultationById);
router.patch('/:id', updateConsultation);

export default router;
