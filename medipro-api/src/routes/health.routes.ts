import { Router } from 'express';
import { healthController } from '../controllers/health.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Dashboard data - Protected
router.get('/dashboard', authenticateToken, healthController.getHealthStats);

export default router;
