import { Router } from 'express';
import { promoController } from '../controllers/promo.controller';
import { authenticateToken, isAdmin } from '../middleware/auth.middleware';

const router = Router();

// Public/Protected route to validate code (can be used during registration)
router.post('/validate', promoController.validate);

// Admin routes
router.post('/', authenticateToken, isAdmin, promoController.create);
router.get('/', authenticateToken, isAdmin, promoController.list);
router.delete('/:id', authenticateToken, isAdmin, promoController.delete);

export default router;
