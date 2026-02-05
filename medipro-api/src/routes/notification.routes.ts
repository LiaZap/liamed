import { Router } from 'express';
import { listNotifications, markAsRead, deleteNotification, broadcastNotification, listSentBroadcasts, deleteBroadcast } from '../controllers/notification.controller';
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware';

const router = Router();

// Admin Broadcast (Specific routes MUST come before generic /:id)
router.post('/broadcast', authenticateToken, authorizeRole(['ADMIN', 'GESTOR']), broadcastNotification);
router.get('/broadcasts', authenticateToken, authorizeRole(['ADMIN', 'GESTOR']), listSentBroadcasts);
router.delete('/broadcast', authenticateToken, authorizeRole(['ADMIN', 'GESTOR']), deleteBroadcast);

// Generic User Routes
router.get('/', authenticateToken, listNotifications);
router.patch('/:id/read', authenticateToken, markAsRead);
router.delete('/:id', authenticateToken, deleteNotification);

export default router;
