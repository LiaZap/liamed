import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';


export const promoController = {
    // Create a new promo code (Admin only)
    create: async (req: Request, res: Response) => {
        try {
            const { code, value, type, maxUses, expiresAt } = req.body;

            // Check if code exists
            const existing = await prisma.promoCode.findUnique({
                where: { code }
            });

            if (existing) {
                return res.status(400).json({ error: 'Code already exists' });
            }

            const promo = await prisma.promoCode.create({
                data: {
                    code: code.toUpperCase(),
                    value: Number(value),
                    type: type || 'TRIAL_EXTENSION',
                    maxUses: maxUses ? Number(maxUses) : null,
                    expiresAt: expiresAt ? new Date(expiresAt) : null,
                }
            });

            res.status(201).json(promo);
        } catch (error) {
            console.error('Error creating promo code:', error);
            res.status(500).json({ error: 'Failed to create promo code' });
        }
    },

    // List all promo codes (Admin only)
    list: async (req: Request, res: Response) => {
        try {
            const promos = await prisma.promoCode.findMany({
                orderBy: { createdAt: 'desc' }
            });
            res.json(promos);
        } catch (error) {
            console.error('Error listing promo codes:', error);
            res.status(500).json({ error: 'Failed to list promo codes' });
        }
    },

    // Delete/Deactivate a promo code (Admin only)
    delete: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            await prisma.promoCode.delete({
                where: { id }
            });
            res.json({ message: 'Promo code deleted' });
        } catch (error) {
            console.error('Error deleting promo code:', error);
            res.status(500).json({ error: 'Failed to delete promo code' });
        }
    },

    // Validate a promo code (Public/Protected)
    validate: async (req: Request, res: Response) => {
        try {
            const { code } = req.body;
            
            if (!code) return res.status(400).json({ error: 'Code is required' });

            const promo = await prisma.promoCode.findUnique({
                where: { code: code.toUpperCase() }
            });

            if (!promo) {
                return res.status(404).json({ valid: false, message: 'Invalid code' });
            }

            if (!promo.isActive) {
                return res.status(400).json({ valid: false, message: 'Code is inactive' });
            }

            if (promo.expiresAt && new Date() > promo.expiresAt) {
                return res.status(400).json({ valid: false, message: 'Code expired' });
            }

            if (promo.maxUses && promo.currentUses >= promo.maxUses) {
                return res.status(400).json({ valid: false, message: 'Code usage limit reached' });
            }

            res.json({ valid: true, promo });
        } catch (error) {
            console.error('Error validating promo code:', error);
            res.status(500).json({ error: 'Validation failed' });
        }
    }
};
