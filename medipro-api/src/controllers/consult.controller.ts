import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

import { logAction } from '../services/audit.service';

interface AuthRequest extends Request {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    user?: any;
}

export const listConsults = async (req: AuthRequest, res: Response) => {
    try {
        const userRole = req.user.role;
        const userId = req.user.id;
        const userClinicId = req.user.clinicId;

        // Filters
        const { status, type, search } = req.query;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const whereClause: any = {};

        // 1. Restriction by Role
        if (userRole === 'ADMIN') {
            // Admin sees everything
        } else if (userRole === 'GESTOR' && userClinicId) {
            // GESTOR sees only consults from their clinic
            whereClause.clinicId = userClinicId;
        } else {
            // MEDICO sees only their own consults
            whereClause.doctorId = userId;
        }

        // 2. Filter by Status
        if (status && status !== 'all') {
            whereClause.status = (status as string).toUpperCase(); // AGENDADA, CONCLUIDA, CANCELADA
        }

        // 3. Filter by Type
        if (type && type !== 'all') {
            whereClause.type = (type as string).toUpperCase(); // CONSULTA, RETORNO, EMERGENCIA
        }

        // 4. Search (Patient Name or Doctor Name)
        if (search) {
            whereClause.OR = [
                { patientName: { contains: search as string, mode: 'insensitive' } },
                { doctorName: { contains: search as string, mode: 'insensitive' } }
            ];
        }

        const consults = await prisma.consult.findMany({
            where: whereClause,
            orderBy: { date: 'desc' }
        });

        // Formatação para o frontend (Date object to string formatted if needed, or keeping ISO)
        // O frontend espera: { id, patient: { name, initial, color }, doctor, date, time, type, status }
        // Vamos adaptar a resposta

        const formattedConsults = consults.map(consult => {
            const dateObj = new Date(consult.date);
            // Format DD/MM/YYYY
            const dateStr = dateObj.toLocaleDateString('pt-BR');
            // Format HH:mm
            const timeStr = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

            // Generate initials and color based on name (simple hash)
            const initial = consult.patientName.charAt(0).toUpperCase();
            const colors = ['bg-green-500', 'bg-blue-500', 'bg-pink-500', 'bg-purple-500', 'bg-orange-500'];
            const colorIndex = consult.patientName.length % colors.length;

            return {
                id: consult.id,
                patient: {
                    name: consult.patientName,
                    initial: initial,
                    color: colors[colorIndex]
                },
                doctor: consult.doctorName,
                date: dateStr,
                time: timeStr,
                isoDate: consult.date, // Send raw ISO date for client-side timezone handling
                type: consult.type,
                status: consult.status === 'AGENDADA' ? 'AGENDADA' : consult.status === 'CONCLUIDA' ? 'CONCLUÍDA' : consult.status // Mapear status se precisar
            };
        });

        res.json(formattedConsults);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao listar consultas.' });
    }
};

export const createConsult = async (req: AuthRequest, res: Response) => {
    try {
        const { patientName, date, type, doctorId } = req.body;

        // Se for medico criando, atribui a ele mesmo se não passar doctorId
        // Se for admin, pode passar doctorId
        const finalDoctorId = req.user.role === 'ADMIN' && doctorId ? doctorId : req.user.id;

        // Buscar nome do médico
        const doctor = await prisma.user.findUnique({ where: { id: finalDoctorId } });
        if (!doctor) return res.status(404).json({ error: 'Médico não encontrado' });

        const newConsult = await prisma.consult.create({
            data: {
                patientName,
                date: new Date(date), // Espera ISO string
                type,
                doctorId: finalDoctorId,
                doctorName: doctor.name,
                clinicId: doctor.clinicId, // Link to doctor's clinic for multi-clinic support
                status: 'AGENDADA'
            }
        });

        // Audit Log
        await logAction({
            userId: req.user.id,
            userName: req.user.name || 'Unknown',
            action: 'CREATE',
            resource: 'CONSULT',
            resourceId: newConsult.id,
            details: { patientName, date, type, doctorName: doctor.name },
            req
        });

        res.status(201).json(newConsult);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        res.status(500).json({ error: 'Erro ao criar consulta.' });
    }
};

export const getConsultStats = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        const userClinicId = req.user.clinicId;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const whereClause: any = {};
        if (userRole === 'ADMIN') {
            // Admin sees everything
        } else if (userRole === 'GESTOR' && userClinicId) {
            // GESTOR sees only their clinic's stats
            whereClause.clinicId = userClinicId;
        } else {
            // MEDICO sees only their own
            whereClause.doctorId = userId;
        }

        const [total, scheduled, completed, cancelled] = await Promise.all([
            prisma.consult.count({ where: whereClause }),
            prisma.consult.count({ where: { ...whereClause, status: 'AGENDADA' } }),
            prisma.consult.count({ where: { ...whereClause, status: 'CONCLUIDA' } }),
            prisma.consult.count({ where: { ...whereClause, status: 'CANCELADA' } })
        ]);

        res.json({
            total,
            scheduled,
            completed,
            cancelled
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar estatísticas de consultas.' });
    }
};

export const getConsultById = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const consult = await prisma.consult.findUnique({
            where: { id },
            include: {
                diagnosis: true // Include diagnosis to show AI response/prompt
            }
        });

        if (!consult) {
            return res.status(404).json({ error: 'Consulta não encontrada.' });
        }

        // Security Check: IDOR Prevention
        if (req.user.role !== 'ADMIN' && consult.doctorId !== req.user.id) {
            return res.status(403).json({ error: 'Acesso negado. Você não tem permissão para visualizar esta consulta.' });
        }

        res.json(consult);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar detalhes da consulta.' });
    }
};

export const updateConsultStatus = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // Expecting { status: 'AGENDADA' | 'CONCLUIDA' | 'CANCELADA' }

        // 1. Fetch consult to check existence and ownership
        const existingConsult = await prisma.consult.findUnique({ where: { id } });

        if (!existingConsult) {
            return res.status(404).json({ error: 'Consulta não encontrada.' });
        }

        // 2. Security Check
        if (req.user.role !== 'ADMIN' && existingConsult.doctorId !== req.user.id) {
            return res.status(403).json({ error: 'Acesso negado. Você não tem permissão para alterar esta consulta.' });
        }

        const updatedConsult = await prisma.consult.update({
            where: { id },
            data: { status }
        });

        // Audit Log
        await logAction({
            userId: req.user.id,
            userName: req.user.name || 'Unknown',
            action: 'UPDATE',
            resource: 'CONSULT',
            resourceId: id,
            details: { status, previousStatus: existingConsult.status },
            req
        });

        res.json(updatedConsult);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar status da consulta.' });
    }
};

export const deleteConsult = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        // 1. Only ADMIN or GESTOR can delete
        if (req.user.role !== 'ADMIN' && req.user.role !== 'GESTOR') {
            return res.status(403).json({ error: 'Apenas administradores podem excluir consultas.' });
        }

        // 2. Check if consult exists
        const existingConsult = await prisma.consult.findUnique({
            where: { id },
            include: { diagnosis: true }
        });

        if (!existingConsult) {
            return res.status(404).json({ error: 'Consulta não encontrada.' });
        }

        // 3. If there's a linked diagnosis, delete it first (or set consultId to null)
        if (existingConsult.diagnosis) {
            await prisma.diagnosis.delete({ where: { id: existingConsult.diagnosis.id } });
        }

        // 4. Delete the consult
        await prisma.consult.delete({ where: { id } });

        // 5. Audit Log
        await logAction({
            userId: req.user.id,
            userName: req.user.name || 'Unknown',
            action: 'DELETE',
            resource: 'CONSULT',
            resourceId: id,
            details: { patientName: existingConsult.patientName, doctorName: existingConsult.doctorName },
            req
        });

        res.json({ message: 'Consulta excluída com sucesso.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao excluir consulta.' });
    }
};
