import { Request, Response } from 'express';
import { prisma } from '../lib/prisma'; // Now valid

interface AuthRequest extends Request {
    user?: any;
}

// Get user's notifications
export const listNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit to last 50
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to list notifications' });
  }
};

// Mark as read
export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.notification.updateMany({
      where: { 
        id, 
        userId: req.user.id // Security check
      },
      data: { read: true }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark as read' });
  }
};

// Delete notification
export const deleteNotification = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.notification.deleteMany({
      where: { 
        id, 
        userId: req.user.id // Security check
      }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete notification' });
  }
};

// Admin Broadcast
export const broadcastNotification = async (req: AuthRequest, res: Response) => {
  try {
    const { title, message, link, type, role, specialty } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required' });
    }

    // Build filter for users
    const userFilter: any = { status: 'ATIVO' };
    
    if (role && role !== 'TODOS') {
      userFilter.role = role;
    }
    
    if (specialty) {
      userFilter.specialty = specialty;
    }

    // Find target users
    const targetUsers = await prisma.user.findMany({
      where: userFilter,
      select: { id: true }
    });

    if (targetUsers.length === 0) {
      return res.status(404).json({ error: 'No users found matching filters' });
    }

    // Create notifications in batch
    const notifications = targetUsers.map(user => ({
      userId: user.id,
      title,
      message,
      link: link || '#',
      type: type || 'INFO', // Uppercase enum
      read: false
    }));

    await prisma.notification.createMany({
      data: notifications
    });

    res.status(201).json({ 
      success: true, 
      count: notifications.length,
      message: `Enviado para ${notifications.length} usuários`
    });

  } catch (error) {
    console.error('Broadcast error:', error);
    res.status(500).json({ error: 'Failed to broadcast notification' });
  }
};
