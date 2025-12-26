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
        const doctorId = (req as any).user.id;

        // Get user with endpoint config
        const doctor = await prisma.user.findUnique({
            where: { id: doctorId },
            include: { endpoint: true }
        });

        if (!doctor) {
            return res.status(404).json({ error: 'Médico não encontrado.' });
        }

        // Handle uploaded files (metadata only for now)
        const files = req.files as Express.Multer.File[];
        const examsData = files ? files.map(file => ({
            originalName: file.originalname,
            filename: file.filename,
            path: file.path,
            mimetype: file.mimetype,
            size: file.size
        })) : [];

        // Prepare context for AI
        const systemInstruction = `Você é um assistente médico especialista (IA) do sistema BahFlash/LiaMed. 
        Sua função é auxiliar médicos fornecendo hipóteses diagnósticas e recomendações baseadas nos dados fornecidos.
        IMPORTANTE: Você é um assistente, a decisão final é sempre do médico.
        Formato de resposta: Markdown estruturado (negrito, listas).`;

        const userMessage = `
        **Paciente:** ${patientName}
        **Relato/Sintomas:** ${userPrompt}
        ${complementaryData ? `**Dados Complementares:** ${complementaryData}` : ''}
        ${examsData.length > 0 ? `**Exames Anexados (Metadados):** ${examsData.map(e => e.originalName).join(', ')}` : ''}
        
        Por favor, forneça:
        1. Hipótese Diagnóstica (Listar possíveis condições)
        2. Sugestão de Conduta/Exames
        3. Alertas importantes (se houver)
        `;

        let aiResponse = "";
        let modelUsed = "simulation";

        const endpoint = doctor.endpoint;

        // --- AI CALL LOGIC ---
        if (endpoint && endpoint.status === 'ATIVO') {
            // 1. Use User's Custom Endpoint
            modelUsed = "custom-endpoint";
            try {
                aiResponse = await callOpenAICompatible(endpoint.url, endpoint.credentials, systemInstruction, userMessage);
            } catch (err: any) {
                console.error("Custom Endpoint Error:", err);
                aiResponse = `Erro ao consultar IA personalizada: ${err.message}. \n\nGerando resposta simulada de fallback...`;
                // Fallback logic could go here
            }

        } else if (process.env.OPENAI_API_KEY) {
            // 2. Use System Default OpenAI
            modelUsed = "system-openai";
            try {
                aiResponse = await callOpenAICompatible(
                    'https://api.openai.com/v1/chat/completions',
                    { token: process.env.OPENAI_API_KEY },
                    systemInstruction,
                    userMessage
                );
            } catch (err: any) {
                console.error("System OpenAI Error:", err);
                aiResponse = `Erro ao consultar OpenAI do sistema: ${err.message}`;
            }
        } else {
            // 3. Fallback to Simulation
            modelUsed = "simulation-fallback";
            aiResponse = `**[MODO SIMULAÇÃO]** (Nenhum endpoint ou chave API configurada)\n\n` +
                `**Hipótese:** Baseado em '${userPrompt}', sugere-se avaliar quadros virais ou infecções comuns.\n` +
                `**Recomendação:** Acompanhamento clínico e exames de rotina.`;
        }

        const diagnosis = await prisma.diagnosis.create({
            data: {
                doctorId,
                patientName,
                userPrompt,
                complementaryData,
                exams: examsData,
                aiResponse,
                model: modelUsed,
                status: 'ORIGINAL'
            }
        });

        res.json(diagnosis);

    } catch (error) {
        console.error('Error creating diagnosis:', error);
        res.status(500).json({ error: 'Failed to create diagnosis' });
    }
};

// Helper for generic OpenAI-compatible API calls
async function callOpenAICompatible(url: string, credentials: any, systemPrompt: string, userPrompt: string): Promise<string> {
    const token = credentials?.token || credentials?.apiKey; // Adapt to how it's stored

    // If URL is base (e.g. https://api.openai.com/v1), append chat/completions if missing? 
    // Usually user inserts full endpoint URL like https://api.openai.com/v1/chat/completions
    // But let's be robust: if it doesn't end in chat/completions and looks like a base URL, maybe warn? 
    // For now assume full URL provided in Endpoint config.

    const body = {
        model: "gpt-4o-mini", // Default good model, or make configurable
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ],
        temperature: 0.7
    };

    const headers: any = {
        'Content-Type': 'application/json'
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`API Error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "Sem resposta da IA.";
}
