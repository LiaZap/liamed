import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logAction } from '../services/audit.service';

interface AuthRequest extends Request {
    user?: any;
}

const prisma = new PrismaClient();

// List all prompts
export const listPrompts = async (req: Request, res: Response) => {
    try {
        const prompts = await prisma.prompt.findMany({
            orderBy: { name: 'asc' }
        });
        res.json(prompts);
    } catch (error) {
        console.error('Error fetching prompts:', error);
        res.status(500).json({ error: 'Erro ao buscar prompts' });
    }
};

// Create a prompt
export const createPrompt = async (req: Request, res: Response) => {
    const { name, category, content, isActive } = req.body;

    console.log('[PromptController] Creating prompt:', { name, category, isActive });

    if (!category) {
        return res.status(400).json({ error: 'Category is required' });
    }

    try {
        if (isActive === true) {
            console.log('[PromptController] Deactivating other prompts in category:', category);
            // Deactivate others in same category
            await prisma.prompt.updateMany({
                where: { category, isActive: true },
                data: { isActive: false }
            });
        }

        const prompt = await prisma.prompt.create({
            data: {
                name,
                category,
                content,
                isActive: isActive ?? true
            }
        });

        const authReq = req as AuthRequest;
        if (authReq.user) {
            await logAction({
                userId: authReq.user.id,
                userName: authReq.user.name || 'Admin',
                action: 'CREATE',
                resource: 'PROMPT',
                resourceId: prompt.id,
                details: { name, category },
                req
            });
        }
        res.status(201).json(prompt);
    } catch (error) {
        console.error('Error creating prompt:', error);
        res.status(500).json({ error: 'Erro ao criar prompt', details: String(error) });
    }
};

// Update a prompt
export const updatePrompt = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, category, content, isActive } = req.body;

    console.log('[PromptController] Updating prompt:', id, { name, category, isActive });

    try {
        if (isActive === true) {
            if (!category) {
                 // Fetch existing category if not provided?
                 // For now, if category is missing in update payload, we skip recursive deactivation to be safe, 
                 // OR we must fetch the prompt first.
                 // Given the UI sends full object, category IS expected.
                 // If missing, we might deactivate WRONG prompts if we aren't careful.
                 console.warn('[PromptController] Warning: isActive=true but category missing in payload. Fetching from DB.');
                 const existing = await prisma.prompt.findUnique({ where: { id }, select: { category: true } });
                 if (existing) {
                     console.log('[PromptController] Deactivating others in category (from DB):', existing.category);
                     await prisma.prompt.updateMany({
                        where: { 
                            category: existing.category, 
                            isActive: true,
                            id: { not: id } 
                        },
                        data: { isActive: false }
                    });
                 }
            } else {
                console.log('[PromptController] Deactivating others in category:', category);
                // Deactivate others in same category (excluding current if creating new version, but here it's update)
                await prisma.prompt.updateMany({
                    where: { 
                        category, 
                        isActive: true,
                        id: { not: id } // Don't deactivate self if already active (redundant but safe)
                    },
                    data: { isActive: false }
                });
            }
        }

        const prompt = await prisma.prompt.update({
            where: { id },
            data: {
                name,
                category,
                content,
                isActive
            }
        });

        const authReq = req as AuthRequest;
        if (authReq.user) {
            await logAction({
                userId: authReq.user.id,
                userName: authReq.user.name || 'Admin',
                action: 'UPDATE',
                resource: 'PROMPT',
                resourceId: id,
                details: { name, category },
                req
            });
        }
        res.json(prompt);
    } catch (error) {
        console.error('Error updating prompt:', error);
        res.status(500).json({ error: 'Erro ao atualizar prompt', details: String(error) });
    }
};

// Delete a prompt
export const deletePrompt = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        await prisma.prompt.delete({
            where: { id }
        });

        const authReq = req as AuthRequest;
        if (authReq.user) {
            await logAction({
                userId: authReq.user.id,
                userName: authReq.user.name || 'Admin',
                action: 'DELETE',
                resource: 'PROMPT',
                resourceId: id,
                req
            });
        }
        res.json({ message: 'Prompt removido com sucesso' });
    } catch (error) {
        console.error('Error deleting prompt:', error);
        res.status(500).json({ error: 'Erro ao remover prompt' });
    }
};
