import { Router } from 'express';
import { addToken, createQueue, deleteQueue, getQueueTokens, getQueues, serveNext, updateToken } from '../controllers/queueController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);
router.get('/', getQueues);
router.post('/', createQueue);
router.delete('/:id', deleteQueue);
router.get('/:id/tokens', getQueueTokens);
router.post('/:id/tokens', addToken);
router.post('/:id/serve', serveNext);
router.patch('/:id/tokens/:tokenId', updateToken);
export default router;
