import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logAction } from '../services/audit.service';

const prisma = new PrismaClient();

// Get tickets (user sees their own, admin sees all)
export const getTickets = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const userRole = (req as any).user.role;
        const { status } = req.query;

        const whereClause: any = {};
        
        // Non-admin users can only see their own tickets
        if (userRole !== 'ADMIN') {
            whereClause.userId = userId;
        }

        // Filter by status if provided
        if (status && ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(status as string)) {
            whereClause.status = status;
        }

        const tickets = await prisma.supportTicket.findMany({
            where: whereClause,
            include: {
                user: {
                    select: { id: true, name: true, email: true }
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    select: {
                        content: true,
                        createdAt: true,
                        isFromAdmin: true
                    }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });

        // Add unread count for each ticket
        const ticketsWithUnread = await Promise.all(tickets.map(async (ticket) => {
            const unreadCount = await prisma.supportMessage.count({
                where: {
                    ticketId: ticket.id,
                    readAt: null,
                    isFromAdmin: userRole !== 'ADMIN' ? true : false
                }
            });
            return { ...ticket, unreadCount };
        }));

        res.json(ticketsWithUnread);
    } catch (error) {
        console.error('Error fetching tickets:', error);
        res.status(500).json({ error: 'Erro ao buscar tickets' });
    }
};

// Create new ticket
export const createTicket = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { subject, message } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Mensagem é obrigatória' });
        }

        const ticket = await prisma.supportTicket.create({
            data: {
                userId,
                subject: subject || 'Dúvida Geral',
                messages: {
                    create: {
                        senderId: userId,
                        content: message,
                        isFromAdmin: false
                    }
                }
            },
            include: {
                messages: true
            }
        });

        await logAction({
            userId,
            userName: (req as any).user.name,
            action: 'CREATE',
            resource: 'SUPPORT_TICKET',
            details: { ticketId: ticket.id, subject: ticket.subject },
            req
        });

        res.status(201).json(ticket);
    } catch (error) {
        console.error('Error creating ticket:', error);
        res.status(500).json({ error: 'Erro ao criar ticket' });
    }
};

// Get ticket details with messages
export const getTicketDetails = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const userRole = (req as any).user.role;
        const { id } = req.params;

        const ticket = await prisma.supportTicket.findUnique({
            where: { id },
            include: {
                user: {
                    select: { id: true, name: true, email: true, specialty: true }
                },
                messages: {
                    orderBy: { createdAt: 'asc' },
                    include: {
                        sender: {
                            select: { id: true, name: true, role: true }
                        }
                    }
                }
            }
        });

        if (!ticket) {
            return res.status(404).json({ error: 'Ticket não encontrado' });
        }

        // Non-admin users can only see their own tickets
        if (userRole !== 'ADMIN' && ticket.userId !== userId) {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        // Mark messages as read
        const messagesToMark = ticket.messages.filter(m => 
            m.readAt === null && 
            (userRole === 'ADMIN' ? !m.isFromAdmin : m.isFromAdmin)
        );

        if (messagesToMark.length > 0) {
            await prisma.supportMessage.updateMany({
                where: {
                    id: { in: messagesToMark.map(m => m.id) }
                },
                data: { readAt: new Date() }
            });
        }

        res.json(ticket);
    } catch (error) {
        console.error('Error fetching ticket:', error);
        res.status(500).json({ error: 'Erro ao buscar ticket' });
    }
};

// Send message to ticket
export const sendMessage = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const userRole = (req as any).user.role;
        const { id } = req.params;
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({ error: 'Mensagem é obrigatória' });
        }

        // Check ticket exists and user has access
        const ticket = await prisma.supportTicket.findUnique({
            where: { id }
        });

        if (!ticket) {
            return res.status(404).json({ error: 'Ticket não encontrado' });
        }

        if (userRole !== 'ADMIN' && ticket.userId !== userId) {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        if (ticket.status === 'CLOSED') {
            return res.status(400).json({ error: 'Ticket está fechado' });
        }

        const message = await prisma.supportMessage.create({
            data: {
                ticketId: id,
                senderId: userId,
                content,
                isFromAdmin: userRole === 'ADMIN'
            },
            include: {
                sender: {
                    select: { id: true, name: true, role: true }
                }
            }
        });

        // Update ticket status if admin responds
        if (userRole === 'ADMIN' && ticket.status === 'OPEN') {
            await prisma.supportTicket.update({
                where: { id },
                data: { status: 'IN_PROGRESS' }
            });
        }

        res.status(201).json(message);
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Erro ao enviar mensagem' });
    }
};

// Update ticket status (admin only)
export const updateTicketStatus = async (req: Request, res: Response) => {
    try {
        const userRole = (req as any).user.role;
        const { id } = req.params;
        const { status } = req.body;

        if (userRole !== 'ADMIN') {
            return res.status(403).json({ error: 'Apenas administradores podem alterar status' });
        }

        if (!['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(status)) {
            return res.status(400).json({ error: 'Status inválido' });
        }

        const updateData: any = { status };
        if (status === 'CLOSED' || status === 'RESOLVED') {
            updateData.closedAt = new Date();
        }

        const ticket = await prisma.supportTicket.update({
            where: { id },
            data: updateData
        });

        await logAction({
            userId: (req as any).user.id,
            userName: (req as any).user.name,
            action: 'UPDATE',
            resource: 'SUPPORT_TICKET',
            details: { ticketId: id, newStatus: status },
            req
        });

        res.json(ticket);
    } catch (error) {
        console.error('Error updating ticket:', error);
        res.status(500).json({ error: 'Erro ao atualizar ticket' });
    }
};

// Get unread count (for notification badge)
export const getUnreadCount = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const userRole = (req as any).user.role;

        let count: number;

        if (userRole === 'ADMIN') {
            // Admin sees unread messages from users
            count = await prisma.supportMessage.count({
                where: {
                    readAt: null,
                    isFromAdmin: false
                }
            });
        } else {
            // User sees unread messages from admin on their tickets
            count = await prisma.supportMessage.count({
                where: {
                    ticket: { userId },
                    readAt: null,
                    isFromAdmin: true
                }
            });
        }

        res.json({ unreadCount: count });
    } catch (error) {
        console.error('Error getting unread count:', error);
        res.status(500).json({ error: 'Erro ao buscar contagem' });
    }
};
