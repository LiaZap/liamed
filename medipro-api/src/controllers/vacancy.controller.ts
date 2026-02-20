import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    user?: any;
}

export const createVacancy = async (req: AuthRequest, res: Response) => {
    try {
        const { title, description, sector, specialty, contactEmail, contactWhatsapp } = req.body;
        const userId = req.user.id;
        
        // Find user to get their clinicId if they are a GESTOR
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        // Handle image
        let imageUrl = null;
        if (req.file) {
            // Apenas retorna o nome gerado pelo multer
            imageUrl = `/uploads/${req.file.filename}`;
        }

        const newVacancy = await prisma.vacancy.create({
            data: {
                title,
                description,
                sector,
                specialty,
                contactEmail,
                contactWhatsapp,
                imageUrl,
                clinicId: user.clinicId,
                creatorId: userId
            }
        });

        res.status(201).json(newVacancy);

    } catch (error) {
        console.error('Error creating vacancy:', error);
        res.status(500).json({ error: 'Erro ao criar vaga' });
    }
}

export const getVacancies = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const whereClause: any = { status: 'ATIVO' };

        // Se for GESTOR e tiver clínica, mostra as da clínica. Se não tiver, mostra as que ele criou.
        if (user.role === 'GESTOR') {
            if (user.clinicId) {
                whereClause.clinicId = user.clinicId;
            } else {
                whereClause.creatorId = userId;
            }
        }
        // Se for MEDICO, podemos exibir todas as vagas ativas (sistema global de vagas)
        // Se for ADMIN, vê todas.
        
        const vacancies = await prisma.vacancy.findMany({
            where: whereClause,
            include: {
                clinic: {
                    select: {
                        name: true,
                        logo: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json(vacancies);

    } catch (error) {
        console.error('Error fetching vacancies:', error);
        res.status(500).json({ error: 'Erro ao buscar vagas' });
    }
}

export const deleteVacancy = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        const vacancy = await prisma.vacancy.findUnique({ where: { id } });
        
        if (!vacancy) {
             return res.status(404).json({ error: 'Vaga não encontrada' });
        }

        // Permissão: ADMIN pode tudo. GESTOR/MEDICO apenas a própria vaga
        if (user.role !== 'ADMIN') {
             if (vacancy.creatorId !== userId) {
                 return res.status(403).json({ error: 'Sem permissão para excluir esta vaga.' });
             }
        }

        await prisma.vacancy.delete({ where: { id } });

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting vacancy:', error);
        res.status(500).json({ error: 'Erro ao excluir vaga' });
    }
}
