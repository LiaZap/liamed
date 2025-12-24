import { Router } from 'express';
import { getLogs } from '../controllers/audit.controller';
import { authenticateToken, isAdmin } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);
router.use(isAdmin);

router.get('/', getLogs);

export default router;
