import { prisma } from '../lib/prisma';
import { logAction } from '../services/audit.service';
import { Request, Response } from 'express';

// Helper interface since we don't have AuthRequest imported here usually. 
// We assume req.user might be present if middleware ran.
interface AuthRequest extends Request {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    user?: any;
}


// Get all settings
export const getSettings = async (req: Request, res: Response) => {
    try {
        const settings = await prisma.setting.findMany();

        // Group by category for easier frontend consumption, or return as list
        // Returning as list to match frontend flexibility, but sorting can be done here if needed.

        res.json(settings);
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ error: 'Erro ao buscar configurações' });
    }
};

// Update a setting
export const updateSetting = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { value } = req.body;

    try {
        const setting = await prisma.setting.update({
            where: { id },
            data: { value: String(value) }
        });

        const authReq = req as AuthRequest;
        if (authReq.user) {
            await logAction({
                userId: authReq.user.id,
                userName: authReq.user.name || 'Admin',
                action: 'UPDATE',
                resource: 'SETTING',
                resourceId: id,
                details: { newValue: value },
                req
            });
        }

        res.json(setting);
    } catch (error) {
        console.error('Error updating setting:', error);
        res.status(500).json({ error: 'Erro ao atualizar configuração' });
    }
};

// Seed/Init settings (optional helper, not exposed directly often, but useful if empty)
export const initSettings = async (req: Request, res: Response) => {
    // Implementation for seeding if needed, for now skipping as it might be done via seed script
    res.json({ message: "Seed endpoint placeholder" });
};
