import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logAction } from '../services/audit.service';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
    user?: any;
}

// List all clinics (Admin only)
export const listClinics = async (req: AuthRequest, res: Response) => {
    try {
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Apenas administradores podem listar clínicas.' });
        }

        const clinics = await prisma.clinic.findMany({
            include: {
                _count: {
                    select: { users: true, consults: true, diagnoses: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(clinics);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao listar clínicas.' });
    }
};

// Get clinic by ID
export const getClinicById = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        // GESTOR can only see their own clinic
        if (req.user.role === 'GESTOR' && req.user.clinicId !== id) {
            return res.status(403).json({ error: 'Acesso negado.' });
        }

        const clinic = await prisma.clinic.findUnique({
            where: { id },
            include: {
                users: {
                    select: { id: true, name: true, email: true, role: true, status: true }
                },
                _count: {
                    select: { consults: true, diagnoses: true }
                }
            }
        });

        if (!clinic) {
            return res.status(404).json({ error: 'Clínica não encontrada.' });
        }

        res.json(clinic);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar clínica.' });
    }
};

// Get my clinic (for GESTOR)
export const getMyClinic = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user.clinicId) {
            return res.status(404).json({ error: 'Você não está vinculado a nenhuma clínica.' });
        }

        const clinic = await prisma.clinic.findUnique({
            where: { id: req.user.clinicId },
            include: {
                users: {
                    select: { id: true, name: true, email: true, role: true, status: true, createdAt: true }
                },
                _count: {
                    select: { consults: true, diagnoses: true }
                }
            }
        });

        if (!clinic) {
            return res.status(404).json({ error: 'Clínica não encontrada.' });
        }

        res.json(clinic);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar clínica.' });
    }
};

// Create clinic (Admin only)
export const createClinic = async (req: AuthRequest, res: Response) => {
    try {
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Apenas administradores podem criar clínicas.' });
        }

        const { name, cnpj, address, phone, email, logo } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Nome da clínica é obrigatório.' });
        }

        const clinic = await prisma.clinic.create({
            data: { name, cnpj, address, phone, email, logo }
        });

        await logAction({
            userId: req.user.id,
            userName: req.user.name || 'Unknown',
            action: 'CREATE',
            resource: 'CLINIC',
            resourceId: clinic.id,
            details: { name, cnpj },
            req
        });

        res.status(201).json(clinic);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'CNPJ já cadastrado.' });
        }
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar clínica.' });
    }
};

// Update clinic
export const updateClinic = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        // GESTOR can only update their own clinic
        if (req.user.role === 'GESTOR' && req.user.clinicId !== id) {
            return res.status(403).json({ error: 'Acesso negado.' });
        }
        if (req.user.role !== 'ADMIN' && req.user.role !== 'GESTOR') {
            return res.status(403).json({ error: 'Sem permissão.' });
        }

        const { name, address, phone, email, logo, status, inviteCode } = req.body;

        const clinic = await prisma.clinic.update({
            where: { id },
            data: { name, address, phone, email, logo, status, inviteCode }
        });

        await logAction({
            userId: req.user.id,
            userName: req.user.name || 'Unknown',
            action: 'UPDATE',
            resource: 'CLINIC',
            resourceId: id,
            details: req.body,
            req
        });

        res.json(clinic);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar clínica.' });
    }
};

// Delete clinic (Admin only)
export const deleteClinic = async (req: AuthRequest, res: Response) => {
    try {
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Apenas administradores podem excluir clínicas.' });
        }

        const { id } = req.params;

        // Remove clinic association from users first
        await prisma.user.updateMany({
            where: { clinicId: id },
            data: { clinicId: null }
        });

        await prisma.clinic.delete({ where: { id } });

        await logAction({
            userId: req.user.id,
            userName: req.user.name || 'Unknown',
            action: 'DELETE',
            resource: 'CLINIC',
            resourceId: id,
            details: {},
            req
        });

        res.json({ message: 'Clínica excluída com sucesso.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao excluir clínica.' });
    }
};

// Add user to clinic (Admin or GESTOR of same clinic)
export const addUserToClinic = async (req: AuthRequest, res: Response) => {
    try {
        const { clinicId, userId } = req.body;

        // Permission check
        if (req.user.role === 'GESTOR' && req.user.clinicId !== clinicId) {
            return res.status(403).json({ error: 'Você só pode adicionar usuários à sua própria clínica.' });
        }
        if (req.user.role !== 'ADMIN' && req.user.role !== 'GESTOR') {
            return res.status(403).json({ error: 'Sem permissão.' });
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: { clinicId }
        });

        await logAction({
            userId: req.user.id,
            userName: req.user.name || 'Unknown',
            action: 'UPDATE',
            resource: 'USER',
            resourceId: userId,
            details: { action: 'added_to_clinic', clinicId },
            req
        });

        res.json({ message: 'Usuário adicionado à clínica.', user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao adicionar usuário à clínica.' });
    }
};

// Remove user from clinic
export const removeUserFromClinic = async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.params;

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }

        // Permission check
        if (req.user.role === 'GESTOR' && req.user.clinicId !== user.clinicId) {
            return res.status(403).json({ error: 'Você só pode remover usuários da sua própria clínica.' });
        }
        if (req.user.role !== 'ADMIN' && req.user.role !== 'GESTOR') {
            return res.status(403).json({ error: 'Sem permissão.' });
        }

        await prisma.user.update({
            where: { id: userId },
            data: { clinicId: null }
        });

        await logAction({
            userId: req.user.id,
            userName: req.user.name || 'Unknown',
            action: 'UPDATE',
            resource: 'USER',
            resourceId: userId,
            details: { action: 'removed_from_clinic' },
            req
        });

        res.json({ message: 'Usuário removido da clínica.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao remover usuário da clínica.' });
    }
};
