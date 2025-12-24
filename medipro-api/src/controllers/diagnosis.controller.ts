import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const listDiagnoses = async (req: Request, res: Response) => {
    try {
        const doctorId = (req as any).user.id;
        const userRole = (req as any).user.role;
        const { search } = req.query;

        let whereClause: any = {};

        // Show all for admin, restrict for doctor
        if (userRole !== 'ADMIN') {
            whereClause.doctorId = doctorId;
        }

        if (search) {
            whereClause.OR = [
                { patientName: { contains: search as string, mode: 'insensitive' } },
                { userPrompt: { contains: search as string, mode: 'insensitive' } }
            ];
        }

        const diagnoses = await prisma.diagnosis.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            take: 50 // Limit to last 50 for now
        });

        res.json(diagnoses);
    } catch (error) {
        console.error('Error listing diagnoses:', error);
        res.status(500).json({ error: 'Failed to list diagnoses' });
    }
};

export const createDiagnosis = async (req: Request, res: Response) => {
    try {
        const { patientName, userPrompt, complementaryData } = req.body;
        const doctorId = (req as any).user.id; // User ID from auth middleware

        // Handle uploaded files
        const files = req.files as Express.Multer.File[];
        const examsData = files ? files.map(file => ({
            originalName: file.originalname,
            filename: file.filename,
            path: file.path,
            mimetype: file.mimetype,
            size: file.size
        })) : [];

        // Simulate AI Response (replace with real AI call later)
        const aiResponse = `**Análise Clínica Preliminar (IA)**
        
**Paciente:** ${patientName}
**Sintomas:** ${userPrompt}
${complementaryData ? `**Dados Complementares:** ${complementaryData}` : ''}
${examsData.length > 0 ? `**Exames Anexados:** ${examsData.length} arquivos analisados.` : ''}

**Hipótese Diagnóstica:**
Com base nos sintomas relatados, sugere-se investigação para...

**Recomendações:**
1. Acompanhamento clínico.
2. Avaliação especialista.
`;

        const diagnosis = await prisma.diagnosis.create({
            data: {
                doctorId,
                patientName,
                userPrompt,
                complementaryData,
                exams: examsData,
                aiResponse,
                model: 'gpt-4-mock',
                status: 'ORIGINAL'
            }
        });

        res.json(diagnosis);

    } catch (error) {
        console.error('Error creating diagnosis:', error);
        res.status(500).json({ error: 'Failed to create diagnosis' });
    }
};
