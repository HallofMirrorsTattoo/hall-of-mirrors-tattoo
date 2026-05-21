import { Router } from 'express';
import { clientAuthMiddleware } from '../middleware/clientAuth.js';
import { authMiddleware } from '../middleware/auth.js';
import { multerUpload } from '../utils/storage.js';
import {
  getClientThreads,
  getClientMessages,
  sendClientMessage,
  getArtistThreads,
  getArtistMessages,
  sendArtistMessage,
  getConsultationMessages,
  sendConsultationMessage,
} from '../controllers/messageController.js';

export const clientMessagesRouter = Router();
clientMessagesRouter.use(clientAuthMiddleware);
clientMessagesRouter.get('/', getClientThreads);
clientMessagesRouter.get('/:bookingId', getClientMessages);
clientMessagesRouter.post('/:bookingId', multerUpload.single('image'), sendClientMessage);

export const artistMessagesRouter = Router();
artistMessagesRouter.use(authMiddleware);
artistMessagesRouter.get('/', getArtistThreads);
artistMessagesRouter.get('/:bookingId', getArtistMessages);
artistMessagesRouter.post('/:bookingId', multerUpload.single('image'), sendArtistMessage);

// Consultation chat routes (shared handler, auth distinguished by req.user vs req.artist)
export const clientConsultationMessagesRouter = Router();
clientConsultationMessagesRouter.use(clientAuthMiddleware);
clientConsultationMessagesRouter.get('/:consultationId', getConsultationMessages);
clientConsultationMessagesRouter.post('/:consultationId', multerUpload.single('image'), sendConsultationMessage);

export const artistConsultationMessagesRouter = Router();
artistConsultationMessagesRouter.use(authMiddleware);
artistConsultationMessagesRouter.get('/:consultationId', getConsultationMessages);
artistConsultationMessagesRouter.post('/:consultationId', multerUpload.single('image'), sendConsultationMessage);
