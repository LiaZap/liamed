import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import os from 'os';


export const healthController = {
    getHealthStats: async (req: Request, res: Response) => {
        try {
            const start = Date.now();

            // 1. Database Check & Counts
            const usersCount = await prisma.user.count();
            const consultsCount = await prisma.consult.count();
            const diagnosesCount = await prisma.diagnosis.count();
            const logsCount = await prisma.auditLog.count();

            const dbLatency = Date.now() - start;

            // 2. System Metrics
            const uptime = process.uptime();
            const memory = process.memoryUsage();
            const osLoad = os.loadavg(); // [1, 5, 15] min
            const freeMem = os.freemem();
            const totalMem = os.totalmem();

            // 3. Recent Activity (using Audit Logs if available)
            const recentLogs = await prisma.auditLog.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { name: true, email: true } } }
            });

            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                system: {
                    uptime, // seconds
                    platform: process.platform,
                    nodeVersion: process.version,
                    cpuLoad: osLoad,
                    memory: {
                        rss: memory.rss, // Resident Set Size
                        heapTotal: memory.heapTotal,
                        heapUsed: memory.heapUsed,
                        systemFree: freeMem,
                        systemTotal: totalMem
                    }
                },
                database: {
                    status: 'connected',
                    latency: `${dbLatency}ms`,
                    counts: {
                        users: usersCount,
                        consults: consultsCount,
                        diagnoses: diagnosesCount,
                        logs: logsCount
                    }
                },
                recentActivity: recentLogs
            });

        } catch (error) {
            console.error('Health check failed:', error);
            res.status(500).json({
                status: 'unhealthy',
                error: 'System health check failed',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
};
