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

    try {
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
        res.status(500).json({ error: 'Erro ao criar prompt' });
    }
};

// Update a prompt
export const updatePrompt = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, category, content, isActive } = req.body;

    try {
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
        res.status(500).json({ error: 'Erro ao atualizar prompt' });
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
