import { PrismaClient } from '@prisma/client';
import { Request } from 'express';

const prisma = new PrismaClient();

interface AuditLogParams {
    userId: string;
    userName: string;
    action: string;
    resource: string;
    resourceId?: string;
    details?: any;
    req?: Request;
}

export const logAction = async (params: AuditLogParams) => {
    try {
        const { userId, userName, action, resource, resourceId, details, req } = params;

        // Verify user exists before creating audit log to prevent FK constraint errors
        const userExists = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
        if (!userExists) {
            console.warn(`[AUDIT] Skipped: User ${userId} does not exist in database`);
            return;
        }

        let ipAddress = 'unknown';
        let userAgent = 'unknown';

        if (req) {
            ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
            userAgent = req.headers['user-agent'] || 'unknown';
        }

        await prisma.auditLog.create({
            data: {
                userId,
                userName,
                action,
                resource,
                resourceId,
                details: details ? JSON.parse(JSON.stringify(details)) : undefined,
                ipAddress,
                userAgent
            }
        });

        // Non-blocking log
        console.log(`[AUDIT] ${userName} performed ${action} on ${resource}`);

    } catch (error) {
        console.error('Error creating audit log:', error);
        // Do not throw error to avoid blocking the main action if logging fails
    }
};
