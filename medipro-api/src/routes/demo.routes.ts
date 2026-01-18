import { Router } from 'express';
import { demoController } from '../controllers/demo.controller';

const router = Router();

// GET endpoint for easy access (can be called from browser)
router.get('/populate', demoController.populateDemoData);
router.get('/clear', demoController.clearDemoData);

// POST endpoints for programmatic access
router.post('/populate', demoController.populateDemoData);
router.post('/clear', demoController.clearDemoData);

export default router;
