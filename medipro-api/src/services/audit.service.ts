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
                details: details ? JSON.parse(JSON.stringify(details)) : undefined, // Ensure it's JSON serializable
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
