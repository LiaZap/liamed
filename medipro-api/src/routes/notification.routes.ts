import { Router } from 'express';
import { listNotifications, markAsRead, deleteNotification, broadcastNotification, listSentBroadcasts, deleteBroadcast } from '../controllers/notification.controller';
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticateToken, listNotifications);
router.patch('/:id/read', authenticateToken, markAsRead);
router.delete('/:id', authenticateToken, deleteNotification);

// Admin Broadcast
router.post('/broadcast', authenticateToken, authorizeRole(['ADMIN', 'GESTOR']), broadcastNotification);
router.get('/broadcasts', authenticateToken, authorizeRole(['ADMIN', 'GESTOR']), listSentBroadcasts);
router.delete('/broadcast', authenticateToken, authorizeRole(['ADMIN', 'GESTOR']), deleteBroadcast);

export default router;
