import { Router } from 'express';
import { calculatorController } from '../controllers/calculator.controller';
import { authenticateToken, isAdmin } from '../middleware/auth.middleware';

const router = Router();

// Admin Seed - Protected with auth + isAdmin
router.get('/seed', authenticateToken, isAdmin, calculatorController.seedCalculators);

// Protected Routes
router.use(authenticateToken);

// List formulas
router.get('/', calculatorController.listFormulas);

// Calculate
router.post('/calculate', calculatorController.calculate);

// History
router.get('/history', calculatorController.getHistory);

// Gasometry Analysis (advanced)
router.post('/gasometry', calculatorController.analyzeGasometry);

export default router;
