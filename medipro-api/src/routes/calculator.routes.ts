import { Router } from 'express';
import { calculatorController } from '../controllers/calculator.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Admin Seed (Public GET for easy setup - changed from POST/Protected)
router.get('/seed', calculatorController.seedCalculators);

// Protected Routes
router.use(authenticateToken);

// List formulas
router.get('/', calculatorController.listFormulas);

// Calculate
router.post('/calculate', calculatorController.calculate);

// History
router.get('/history', calculatorController.getHistory);

export default router;
