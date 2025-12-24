import { Router } from 'express';
import { listEndpoints, createEndpoint, updateEndpoint, deleteEndpoint, testConnection } from '../controllers/endpoint.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Base path: /endpoints (will be configured in server.ts)

router.get('/', authenticateToken, listEndpoints);
router.post('/', authenticateToken, createEndpoint);
router.post('/test', authenticateToken, testConnection); // Test connection
router.put('/:id', authenticateToken, updateEndpoint);
router.delete('/:id', authenticateToken, deleteEndpoint);

export default router;
