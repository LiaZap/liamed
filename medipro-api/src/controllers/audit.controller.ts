import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getLogs = async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 20, search, action, startDate, endDate } = req.query;

        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: any = {};

        if (search) {
            where.OR = [
                { userName: { contains: String(search), mode: 'insensitive' } },
                { resource: { contains: String(search), mode: 'insensitive' } },
                { action: { contains: String(search), mode: 'insensitive' } }
            ];
        }

        if (action && action !== 'ALL') {
            where.action = String(action);
        }

        if (startDate && endDate) {
            where.createdAt = {
                gte: new Date(String(startDate)),
                lte: new Date(String(endDate))
            };
        }

        const logs = await prisma.auditLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take,
            include: { user: { select: { name: true, email: true } } }
        });

        const total = await prisma.auditLog.count({ where });

        res.json({
            data: logs,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / Number(limit))
            }
        });

    } catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({ error: 'Erro ao buscar logs de auditoria' });
    }
};
