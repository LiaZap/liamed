import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Brazilian first names for realistic data
const FIRST_NAMES = [
    'Maria', 'João', 'Ana', 'Pedro', 'Juliana', 'Carlos', 'Fernanda', 'Lucas',
    'Camila', 'Rafael', 'Beatriz', 'Gustavo', 'Larissa', 'Thiago', 'Amanda',
    'Bruno', 'Letícia', 'Diego', 'Natália', 'Rodrigo', 'Priscila', 'Marcelo',
    'Patricia', 'André', 'Vanessa', 'Felipe', 'Débora', 'Ricardo', 'Gabriela', 'Eduardo'
];

const LAST_NAMES = [
    'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves',
    'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho',
    'Nascimento', 'Almeida', 'Araújo', 'Barbosa', 'Moreira', 'Melo'
];

const CONSULT_TYPES = ['CONSULTA', 'RETORNO', 'EMERGENCIA'];
const CONSULT_STATUSES = ['CONCLUIDA', 'CONCLUIDA', 'CONCLUIDA', 'AGENDADA', 'CANCELADA']; // More completed

const SYMPTOMS = [
    'Dor de cabeça frequente e tontura',
    'Febre persistente há 3 dias',
    'Dor abdominal e náuseas',
    'Tosse seca e dificuldade respiratória',
    'Dor nas articulações e fadiga',
    'Pressão alta e palpitações',
    'Ansiedade e insônia',
    'Dor lombar crônica',
    'Alergias sazonais',
    'Check-up de rotina'
];

const AI_RESPONSES = [
    `**Hipótese Diagnóstica:**\n- Cefaleia tensional\n- Enxaqueca sem aura\n\n**Recomendações:**\n- Analgésico simples\n- Avaliar gatilhos de estresse\n- Retorno em 15 dias se persistir`,
    `**Hipótese Diagnóstica:**\n- Síndrome gripal\n- Possível infecção viral\n\n**Recomendações:**\n- Repouso e hidratação\n- Antitérmico se necessário\n- Hemograma se febre > 5 dias`,
    `**Hipótese Diagnóstica:**\n- Dispepsia funcional\n- Gastrite\n\n**Recomendações:**\n- Dieta leve\n- Inibidor de bomba de prótons\n- Evitar alimentos irritantes`,
    `**Hipótese Diagnóstica:**\n- IVAS (Infecção de Vias Aéreas Superiores)\n- Bronquite aguda\n\n**Recomendações:**\n- Xarope expectorante\n- Nebulização se necessário\n- Rx de tórax se persistir`,
    `**Hipótese Diagnóstica:**\n- Artralgia a esclarecer\n- Possível artrite inicial\n\n**Recomendações:**\n- Anti-inflamatório\n- Solicitar FAN, FR, PCR\n- Encaminhar reumatologista`
];

function randomElement<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generatePatientName(): string {
    return `${randomElement(FIRST_NAMES)} ${randomElement(LAST_NAMES)}`;
}

function getRandomDateInLastDays(days: number): Date {
    const now = new Date();
    const pastDate = new Date(now.getTime() - Math.random() * days * 24 * 60 * 60 * 1000);
    // Set random hour between 8:00 and 18:00
    pastDate.setHours(randomInt(8, 18), randomInt(0, 59), 0, 0);
    return pastDate;
}

export const demoController = {
    // Populate demo data
    populateDemoData: async (req: Request, res: Response) => {
        try {
            // Find a doctor to assign consultations
            const doctor = await prisma.user.findFirst({
                where: { role: 'MEDICO' }
            });

            const admin = await prisma.user.findFirst({
                where: { role: 'ADMIN' }
            });

            const assignedDoctor = doctor || admin;

            if (!assignedDoctor) {
                return res.status(400).json({ error: 'No doctor/admin found to assign consultations' });
            }

            // Generate consultations for last 30 days
            const consultationsToCreate = randomInt(50, 80);
            const diagnosesToCreate = randomInt(30, 50);

            let consultsCreated = 0;
            let diagnosesCreated = 0;

            // Create consultations
            for (let i = 0; i < consultationsToCreate; i++) {
                const date = getRandomDateInLastDays(30);

                await prisma.consult.create({
                    data: {
                        patientName: generatePatientName(),
                        doctorId: assignedDoctor.id,
                        doctorName: assignedDoctor.name,
                        date: date,
                        type: randomElement(CONSULT_TYPES) as any,
                        status: randomElement(CONSULT_STATUSES) as any
                    }
                });
                consultsCreated++;
            }

            // Create diagnoses
            for (let i = 0; i < diagnosesToCreate; i++) {
                const date = getRandomDateInLastDays(30);

                await prisma.diagnosis.create({
                    data: {
                        doctorId: assignedDoctor.id,
                        patientName: generatePatientName(),
                        userPrompt: randomElement(SYMPTOMS),
                        aiResponse: randomElement(AI_RESPONSES),
                        model: 'gpt-4o-mini',
                        status: 'ORIGINAL',
                        createdAt: date
                    }
                });
                diagnosesCreated++;
            }

            res.json({
                success: true,
                message: 'Demo data populated successfully!',
                data: {
                    consultationsCreated: consultsCreated,
                    diagnosesCreated: diagnosesCreated,
                    assignedTo: assignedDoctor.name
                }
            });

        } catch (error) {
            console.error('Error populating demo data:', error);
            res.status(500).json({ error: 'Failed to populate demo data' });
        }
    },

    // Clear demo data (optional - for reset)
    clearDemoData: async (req: Request, res: Response) => {
        try {
            // Delete consultations from last 30 days that look like demo data
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const deletedConsults = await prisma.consult.deleteMany({
                where: {
                    createdAt: { gte: thirtyDaysAgo }
                }
            });

            const deletedDiagnoses = await prisma.diagnosis.deleteMany({
                where: {
                    createdAt: { gte: thirtyDaysAgo }
                }
            });

            res.json({
                success: true,
                message: 'Demo data cleared!',
                deleted: {
                    consultations: deletedConsults.count,
                    diagnoses: deletedDiagnoses.count
                }
            });

        } catch (error) {
            console.error('Error clearing demo data:', error);
            res.status(500).json({ error: 'Failed to clear demo data' });
        }
    }
};
