import { Router } from 'express';
import { clientAuthMiddleware } from '../middleware/clientAuth.js';
import { authMiddleware } from '../middleware/auth.js';
import {
  getClientThreads,
  getClientMessages,
  sendClientMessage,
  getArtistThreads,
  getArtistMessages,
  sendArtistMessage,
} from '../controllers/messageController.js';

export const clientMessagesRouter = Router();
clientMessagesRouter.use(clientAuthMiddleware);
clientMessagesRouter.get('/', getClientThreads);
clientMessagesRouter.get('/:bookingId', getClientMessages);
clientMessagesRouter.post('/:bookingId', sendClientMessage);

export const artistMessagesRouter = Router();
artistMessagesRouter.use(authMiddleware);
artistMessagesRouter.get('/', getArtistThreads);
artistMessagesRouter.get('/:bookingId', getArtistMessages);
artistMessagesRouter.post('/:bookingId', sendArtistMessage);
