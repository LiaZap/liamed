import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
const pdfParse = require('pdf-parse');

const prisma = new PrismaClient();

import { logAction } from '../services/audit.service';

export const listDiagnoses = async (req: Request, res: Response) => {
    try {
        const doctorId = (req as any).user.id;
        const userRole = (req as any).user.role;
        const { search, page = '1', limit = '10' } = req.query;

        const pageNum = Math.max(1, parseInt(page as string) || 1);
        const limitNum = Math.min(50, Math.max(1, parseInt(limit as string) || 10));
        const skip = (pageNum - 1) * limitNum;

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

        const [diagnoses, total] = await Promise.all([
            prisma.diagnosis.findMany({
                where: whereClause,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limitNum
            }),
            prisma.diagnosis.count({ where: whereClause })
        ]);

        const totalPages = Math.ceil(total / limitNum);

        res.json({
            data: diagnoses,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: totalPages
            }
        });
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

        // Handle uploaded files and extract PDF content
        const files = req.files as Express.Multer.File[];
        const examsData: { originalName: string; filename: string; path: string; mimetype: string; size: number; textContent?: string }[] = [];

        // Extract text from PDFs
        if (files && files.length > 0) {
            for (const file of files) {
                const fileData: any = {
                    originalName: file.originalname,
                    filename: file.filename,
                    path: file.path,
                    mimetype: file.mimetype,
                    size: file.size
                };

                // Extract text from PDF files
                if (file.mimetype === 'application/pdf') {
                    try {
                        console.log(`[Diagnosis] Attempting to read PDF: ${file.path}`);

                        // Check if file exists
                        if (!fs.existsSync(file.path)) {
                            console.error(`[Diagnosis] PDF file not found at: ${file.path}`);
                            fileData.textContent = '[Arquivo PDF não encontrado no servidor]';
                        } else {
                            const pdfBuffer = fs.readFileSync(file.path);
                            console.log(`[Diagnosis] PDF buffer size: ${pdfBuffer.length} bytes`);

                            const pdfData = await pdfParse(pdfBuffer);
                            const extractedText = pdfData.text?.trim() || '';

                            console.log(`[Diagnosis] Extracted ${pdfData.numpages} pages, ${extractedText.length} chars from ${file.originalname}`);

                            // Check if PDF has actual text content (not just scanned images)
                            if (extractedText.length < 50) {
                                fileData.textContent = `[PDF pode ser escaneado - texto extraído insuficiente (${extractedText.length} caracteres). Nome: ${file.originalname}]`;
                            } else {
                                fileData.textContent = extractedText;
                            }
                        }
                    } catch (pdfErr: any) {
                        console.error(`[Diagnosis] PDF extraction error for ${file.originalname}:`, pdfErr);
                        console.error(`[Diagnosis] Full error:`, JSON.stringify(pdfErr, null, 2));
                        fileData.textContent = `[Erro ao extrair texto do PDF: ${pdfErr.message || 'erro desconhecido'}]`;
                    }
                }

                examsData.push(fileData);
            }
        }

        // Fetch the active DIAGNOSTICO prompt from the database
        let systemInstruction = '';

        // 1. First try: Get the active DIAGNOSTICO prompt from Prompt table
        const activePrompt = await prisma.prompt.findFirst({
            where: {
                category: 'DIAGNOSTICO',
                isActive: true
            }
        });

        if (activePrompt) {
            systemInstruction = activePrompt.content;
            console.log(`[Diagnosis] Using prompt from table: "${activePrompt.name}"`);
        } else if (doctor.customPrompt) {
            // 2. Fallback: User's custom prompt
            systemInstruction = doctor.customPrompt;
            console.log(`[Diagnosis] Using user's custom prompt`);
        } else {
            // 3. Default fallback
            systemInstruction = `Você é um assistente médico especialista (IA) do sistema LIAMED. 
            Sua função é auxiliar médicos fornecendo hipóteses diagnósticas e recomendações baseadas nos dados fornecidos.
            IMPORTANTE: Você é um assistente, a decisão final é sempre do médico.
            Formato de resposta: Markdown estruturado (negrito, listas).`;
            console.log(`[Diagnosis] Using default prompt`);
        }

        // Build exam content for AI
        let examContent = '';
        if (examsData.length > 0) {
            const examTexts = examsData
                .filter(e => e.textContent)
                .map(e => `\n--- EXAME: ${e.originalName} ---\n${e.textContent}`)
                .join('\n');

            if (examTexts) {
                examContent = `\n\n**Conteúdo dos Exames Anexados:**${examTexts}`;
            } else {
                examContent = `\n\n**Exames Anexados (sem texto extraído):** ${examsData.map(e => e.originalName).join(', ')}`;
            }
        }

        const userMessage = `
        **Paciente:** ${patientName}
        **Relato/Sintomas:** ${userPrompt}
        ${complementaryData ? `**Dados Complementares:** ${complementaryData}` : ''}${examContent}
        
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
                aiResponse = await callOpenAICompatible(endpoint.url, endpoint, systemInstruction, userMessage, { patientName, userPrompt, complementaryData, exams: examsData });
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

        // Auto-create linked consultation
        const consult = await prisma.consult.create({
            data: {
                patientName,
                doctorId,
                doctorName: doctor.name,
                date: new Date(),
                type: 'CONSULTA' as any,
                status: 'CONCLUIDA' as any
            }
        });

        // Link diagnosis to consultation
        await prisma.diagnosis.update({
            where: { id: diagnosis.id },
            data: { consultId: consult.id }
        });

        // Audit Log
        await logAction({
            userId: doctorId,
            userName: doctor.name || 'Unknown',
            action: 'CREATE',
            resource: 'DIAGNOSIS',
            resourceId: diagnosis.id,
            details: { patientName, model: modelUsed, linkedConsultId: consult.id },
            req
        });

        res.json({ ...diagnosis, consultId: consult.id });

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

        // Audit Log
        await logAction({
            userId: (req as any).user.id,
            userName: (req as any).user.name || 'Unknown',
            action: 'DELETE',
            resource: 'DIAGNOSIS',
            resourceId: id,
            req
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
            exams: originalData.exams || [],
            examsContent: originalData.exams?.filter((e: any) => e.textContent).map((e: any) => ({
                fileName: e.originalName,
                content: e.textContent
            })) || [],
            systemInstruction: systemPrompt,
            fullUserMessage: userPrompt, // This contains the assembled message with exam content
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
