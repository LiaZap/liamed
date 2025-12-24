import { Router } from 'express';
import { calculatorController } from '../controllers/calculator.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Public/Private? Usually calculators are available to logged in users
router.use(authenticateToken);

// List formulas
router.get('/', calculatorController.listFormulas);

// Calculate
router.post('/calculate', calculatorController.calculate);

// History
router.get('/history', calculatorController.getHistory);

export default router;
