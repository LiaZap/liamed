import { Router } from 'express';
import { demoController } from '../controllers/demo.controller';
import { authenticateToken, isAdmin } from '../middleware/auth.middleware';

const router = Router();

// SECURITY: Demo routes must be admin-only and dev-only
if (process.env.NODE_ENV !== 'production') {
    router.use(authenticateToken);
    router.use(isAdmin);
    
    // GET endpoint for easy access (can be called from browser)
    router.get('/populate', demoController.populateDemoData);
    router.get('/clear', demoController.clearDemoData);

    // POST endpoints for programmatic access
    router.post('/populate', demoController.populateDemoData);
    router.post('/clear', demoController.clearDemoData);
}

export default router;
