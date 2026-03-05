import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { sendVacancyNotificationEmail } from '../services/email.service';
import { sendVacancyWhatsApp } from '../services/whatsapp.service';


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

        // --- Notify matching professionals (non-blocking) ---
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const userFilter: any = {
                status: 'ATIVO',
                id: { not: userId }, // Don't notify the creator
                OR: [
                    { notifyVagasEmail: true },
                    { notifyVagasWhatsApp: true },
                ],
            };

            // Filter by specialty if vacancy has one
            if (specialty) {
                userFilter.specialty = specialty;
            }

            const usersToNotify = await prisma.user.findMany({
                where: userFilter,
                select: { id: true, name: true, email: true, phone: true, notifyVagasEmail: true, notifyVagasWhatsApp: true },
            });

            if (usersToNotify.length > 0) {
                // Get clinic name for email
                let clinicName: string | null = null;
                if (newVacancy.clinicId) {
                    const clinic = await prisma.clinic.findUnique({
                        where: { id: newVacancy.clinicId },
                        select: { name: true },
                    });
                    clinicName = clinic?.name || null;
                }

                // Create in-app notifications
                const notifications = usersToNotify.map(u => ({
                    userId: u.id,
                    title: `Nova Vaga: ${title}`,
                    message: `Uma nova vaga de ${specialty || sector} foi publicada. Confira!`,
                    link: '/vagas',
                    type: 'INFO' as const,
                    read: false,
                }));

                await prisma.notification.createMany({ data: notifications });
                console.log(`[VACANCY] ${notifications.length} in-app notifications created`);

                // Send emails (non-blocking, fire-and-forget)
                const emailUsers = usersToNotify.filter(u => u.notifyVagasEmail);
                for (const u of emailUsers) {
                    sendVacancyNotificationEmail(u.email, u.name, {
                        title,
                        description,
                        sector,
                        specialty,
                        contactEmail,
                        contactWhatsapp,
                        clinicName,
                    });
                }
                console.log(`[VACANCY] ${emailUsers.length} email notifications queued`);

                // Send WhatsApp notifications via UaZapi (non-blocking, fire-and-forget)
                const whatsappUsers = usersToNotify.filter(u => u.notifyVagasWhatsApp && u.phone);
                const fullImageUrl = imageUrl && process.env.BACKEND_URL
                    ? `${process.env.BACKEND_URL}${imageUrl}`
                    : null;

                for (const u of whatsappUsers) {
                    sendVacancyWhatsApp(u.phone!, {
                        title,
                        description,
                        sector,
                        specialty,
                        contactEmail,
                        contactWhatsapp,
                        clinicName,
                        imageUrl: fullImageUrl,
                    });
                }
                console.log(`[VACANCY] ${whatsappUsers.length} WhatsApp notifications queued`);
            }
        } catch (notifyError) {
            // Never block vacancy creation if notifications fail
            console.error('[VACANCY] Notification error (non-blocking):', notifyError);
        }

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

export const updateVacancy = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { title, description, sector, specialty, contactEmail, contactWhatsapp } = req.body;

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        const vacancy = await prisma.vacancy.findUnique({ where: { id } });
        if (!vacancy) {
            return res.status(404).json({ error: 'Vaga não encontrada' });
        }

        // Permissão: ADMIN pode tudo. Criador pode editar a própria vaga
        if (user.role !== 'ADMIN' && vacancy.creatorId !== userId) {
            return res.status(403).json({ error: 'Sem permissão para editar esta vaga.' });
        }

        // Handle image
        let imageUrl = vacancy.imageUrl; // keep existing by default
        if (req.file) {
            imageUrl = `/uploads/${req.file.filename}`;
        }

        const updated = await prisma.vacancy.update({
            where: { id },
            data: {
                title,
                description,
                sector,
                specialty: specialty || null,
                contactEmail: contactEmail || null,
                contactWhatsapp: contactWhatsapp || null,
                imageUrl,
            }
        });

        res.json(updated);
    } catch (error) {
        console.error('Error updating vacancy:', error);
        res.status(500).json({ error: 'Erro ao atualizar vaga' });
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
