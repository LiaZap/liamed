import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import {
    getTickets,
    createTicket,
    getTicketDetails,
    sendMessage,
    updateTicketStatus,
    getUnreadCount
} from '../controllers/support.controller';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get unread count for badge
router.get('/unread', getUnreadCount);

// List tickets (user: own, admin: all)
router.get('/tickets', getTickets);

// Create new ticket
router.post('/tickets', createTicket);

// Get ticket details with messages
router.get('/tickets/:id', getTicketDetails);

// Send message to ticket
router.post('/tickets/:id/messages', sendMessage);

// Update ticket status (admin only)
router.patch('/tickets/:id', updateTicketStatus);

export default router;
