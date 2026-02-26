import { Router } from 'express';
import { promoController } from '../controllers/promo.controller';
import { authenticateToken, isAdmin } from '../middleware/auth.middleware';

const router = Router();

// Protected route to validate code (requires authentication)
router.post('/validate', authenticateToken, promoController.validate);

// Admin routes
router.post('/', authenticateToken, isAdmin, promoController.create);
router.get('/', authenticateToken, isAdmin, promoController.list);
router.delete('/:id', authenticateToken, isAdmin, promoController.delete);

export default router;
