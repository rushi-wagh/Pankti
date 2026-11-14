import { Router } from 'express';
import { getCurrentManager, login } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.post('/login', login);
router.get('/me', requireAuth, getCurrentManager);
export default router;
