import { Router } from 'express';
import { getStats } from '../controllers/stats.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticateToken, getStats);

export default router;
