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

        console.log(`[Diagnosis] User ID: ${doctorId}`);
        console.log(`[Diagnosis] Linked Endpoint:`, doctor?.endpoint ? doctor.endpoint.name : 'None');
        console.log(`[Diagnosis] Endpoint Status:`, doctor?.endpoint?.status);

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
        // Prepare context for AI
        const systemInstruction = doctor.customPrompt || `Você é um assistente médico especialista (IA) do sistema BahFlash/LiaMed. 
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
        console.log(`[Diagnosis] Endpoint Object:`, endpoint);

        // --- AI CALL LOGIC ---
        if (endpoint && endpoint.status === 'ATIVO') {
            console.log(`[Diagnosis] Mode: Custom Endpoint (${endpoint.url})`);
            // 1. Use User's Custom Endpoint
            // 1. Use User's Custom Endpoint
            modelUsed = "custom-endpoint";
            try {
                aiResponse = await callOpenAICompatible(endpoint.url, endpoint, systemInstruction, userMessage, { patientName, userPrompt, complementaryData });
            } catch (err: any) {
                console.error("Custom Endpoint Error:", err);
                aiResponse = `Erro ao consultar IA personalizada: ${err.message}. \n\nGerando resposta simulada de fallback...`;
                // Fallback logic could go here
            }

        } else if (process.env.OPENAI_API_KEY) {
            console.log(`[Diagnosis] Mode: System OpenAI`);
            // 2. Use System Default OpenAI
            modelUsed = "system-openai";
            try {
                aiResponse = await callOpenAICompatible(
                    'https://api.openai.com/v1/chat/completions',
                    { authType: 'BEARER', credentials: { token: process.env.OPENAI_API_KEY } },
                    systemInstruction,
                    userMessage,
                    { patientName, userPrompt }
                );
            } catch (err: any) {
                console.error("System OpenAI Error:", err);
                aiResponse = `Erro ao consultar OpenAI do sistema: ${err.message}`;
            }
        } else {
            console.log(`[Diagnosis] Mode: Simulation Fallback`);
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

export const deleteDiagnosis = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const doctorId = (req as any).user.id;
        const userRole = (req as any).user.role;

        // Check ownership or admin
        const diagnosis = await prisma.diagnosis.findUnique({
            where: { id }
        });

        if (!diagnosis) {
            return res.status(404).json({ error: 'Diagnóstico não encontrado.' });
        }

        if (userRole !== 'ADMIN' && diagnosis.doctorId !== doctorId) {
            return res.status(403).json({ error: 'Acesso negado.' });
        }

        await prisma.diagnosis.delete({
            where: { id }
        });

        res.json({ message: 'Diagnóstico removido com sucesso.' });
    } catch (error) {
        console.error('Error deleting diagnosis:', error);
        res.status(500).json({ error: 'Failed to delete diagnosis' });
    }
};

// Helper for generic OpenAI-compatible API calls
// Helper for generic OpenAI-compatible API calls OR Webhooks
async function callOpenAICompatible(url: string, endpointConfig: any, systemPrompt: string, userPrompt: string, originalData: any): Promise<string> {
    const { authType, credentials } = endpointConfig;
    const token = credentials?.token?.trim();

    const headers: any = {
        'Content-Type': 'application/json'
    };

    // Robust Auth Handling (Same as Test Connection)
    if (token) {
        switch (authType) {
            case 'BEARER_TOKEN':
            case 'BEARER':
                headers['Authorization'] = `Bearer ${token}`;
                break;
            case 'BASIC_AUTH':
                headers['Authorization'] = token.startsWith('Basic ') ? token : `Basic ${token}`;
                break;
            case 'API_KEY':
                headers['x-api-key'] = token;
                break;
            case 'JWT':
                headers['Authorization'] = `Bearer ${token}`;
                break;
            default:
                if (authType && authType !== 'NONE') {
                    headers['Authorization'] = token;
                }
                break;
        }
    }

    let body: any;

    // Smart Body Construction
    // If it looks like a generic webhook (N8N, Make, Zapier), send flat data
    if (url.includes('webhook') || url.includes('n8n') || url.includes('make.com') || url.includes('zapier')) {
        body = {
            patientName: originalData.patientName,
            userPrompt: originalData.userPrompt,
            complementaryData: originalData.complementaryData,
            systemInstruction: systemPrompt,
            timestamp: new Date().toISOString(),
            source: 'LiaMed-System'
        };
    } else {
        // Default to OpenAI Chat Completion Format
        body = {
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.7
        };
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

    // Smart Response Parsing
    // If OpenAI format
    if (data.choices?.[0]?.message?.content) {
        return data.choices[0].message.content;
    }

    // If Webhook returned a simple string or "text" or "output" field
    if (typeof data === 'string') return data;
    if (data.output) return data.output;
    if (data.text) return data.text;
    if (data.response) return data.response;
    if (data.message) return data.message;

    // Fallback: Dump JSON
    return JSON.stringify(data, null, 2);
}
