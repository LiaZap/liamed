import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
// pdf-parse v1.1.1 simple function API
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse');

const prisma = new PrismaClient();

import { logAction } from '../services/audit.service';

export const listDiagnoses = async (req: Request, res: Response) => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const doctorId = (req as any).user.id;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userRole = (req as any).user.role;
        const { search, page = '1', limit = '10' } = req.query;

        const pageNum = Math.max(1, parseInt(page as string) || 1);
        const limitNum = Math.min(50, Math.max(1, parseInt(limit as string) || 10));
        const skip = (pageNum - 1) * limitNum;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const whereClause: any = {};

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        // Store base64-encoded images for OpenAI Vision
        const imageDataForVision: { base64: string; mimetype: string; originalName: string }[] = [];

        // Extract text from PDFs and encode images for Vision
        if (files && files.length > 0) {
            for (const file of files) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const fileData: any = {
                    originalName: file.originalname,
                    filename: file.filename,
                    path: file.path,
                    mimetype: file.mimetype,
                    size: file.size
                };

                // Encode image files as base64 for OpenAI Vision analysis
                if (file.mimetype.startsWith('image/')) {
                    try {
                        if (fs.existsSync(file.path)) {
                            const imageBuffer = fs.readFileSync(file.path);
                            const base64Image = imageBuffer.toString('base64');
                            imageDataForVision.push({
                                base64: base64Image,
                                mimetype: file.mimetype,
                                originalName: file.originalname
                            });
                            console.log(`[Diagnosis] Image encoded for Vision: ${file.originalname} (${(imageBuffer.length / 1024).toFixed(1)}KB)`);
                            fileData.textContent = `[Imagem enviada para análise via IA Vision: ${file.originalname}]`;
                        } else {
                            console.error(`[Diagnosis] Image file not found at: ${file.path}`);
                            fileData.textContent = '[Arquivo de imagem não encontrado no servidor]';
                        }
                    } catch (imgErr: any) {
                        console.error(`[Diagnosis] Image encoding error for ${file.originalname}:`, imgErr);
                        fileData.textContent = `[Erro ao processar imagem: ${imgErr.message || 'erro desconhecido'}]`;
                    }
                }
                // Extract text from PDF files
                else if (file.mimetype === 'application/pdf') {
                    try {
                        console.log(`[Diagnosis] Attempting to read PDF: ${file.path}`);

                        // Check if file exists
                        if (!fs.existsSync(file.path)) {
                            console.error(`[Diagnosis] PDF file not found at: ${file.path}`);
                            fileData.textContent = '[Arquivo PDF não encontrado no servidor]';
                        } else {
                            const pdfBuffer = fs.readFileSync(file.path);
                            console.log(`[Diagnosis] PDF buffer size: ${pdfBuffer.length} bytes`);

                            // pdf-parse v1.1.1 simple function
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
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    } catch (pdfErr: any) {
                        console.error(`[Diagnosis] PDF extraction error for ${file.originalname}:`, pdfErr);
                        console.error(`[Diagnosis] Full error:`, JSON.stringify(pdfErr, null, 2));
                        fileData.textContent = `[Erro ao extrair texto do PDF: ${pdfErr.message || 'erro desconhecido'}]`;
                    }
                }

                examsData.push(fileData);
            }
        }

        console.log(`[Diagnosis] Images for Vision analysis: ${imageDataForVision.length}`);

        // --- STEP 1: Pre-analyze images with OpenAI Vision (if available) ---
        // This runs BEFORE the main AI call so the transcription is available as text
        // for any endpoint (webhook, custom, or OpenAI itself)
        if (imageDataForVision.length > 0 && process.env.OPENAI_API_KEY) {
            console.log(`[Diagnosis] Step 1: Analyzing ${imageDataForVision.length} image(s) with OpenAI Vision...`);
            try {
                const visionResult = await analyzeImagesWithVision(imageDataForVision, patientName, userPrompt);
                // Update examsData with the transcription for each image
                for (const exam of examsData) {
                    if (exam.mimetype?.startsWith('image/')) {
                        exam.textContent = visionResult;
                    }
                }
                console.log(`[Diagnosis] Vision analysis complete (${visionResult.length} chars)`);
            } catch (visionErr: any) {
                console.error(`[Diagnosis] Vision analysis failed:`, visionErr);
                // Mark images with error but continue - the diagnosis can still work with symptoms
                for (const exam of examsData) {
                    if (exam.mimetype?.startsWith('image/') && exam.textContent?.includes('análise via IA Vision')) {
                        exam.textContent = `[Erro na análise Vision: ${visionErr.message || 'erro desconhecido'}. Imagem: ${exam.originalName}]`;
                    }
                }
            }
        } else if (imageDataForVision.length > 0) {
            console.log(`[Diagnosis] OPENAI_API_KEY not configured - skipping Vision analysis`);
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

        if (doctor.customPrompt) {
            // 1. Priority: User's custom prompt
            systemInstruction = doctor.customPrompt;
            console.log(`[Diagnosis] Using user's custom prompt`);
        } else if (activePrompt) {
            // 2. Fallback: Global active PROMPT from table
            systemInstruction = activePrompt.content;
            console.log(`[Diagnosis] Using prompt from table: "${activePrompt.name}"`);
        } else {
            // 3. Default fallback
            systemInstruction = `Você é um assistente médico especialista (IA) do sistema LIAMED.
            Sua função é auxiliar médicos fornecendo hipóteses diagnósticas e recomendações baseadas nos dados fornecidos.
            IMPORTANTE: Você é um assistente, a decisão final é sempre do médico.
            Formato de resposta: Markdown estruturado (negrito, listas).`;
            console.log(`[Diagnosis] Using default prompt`);
        }

        // Build exam content for AI (now includes Vision transcriptions)
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

        // --- STEP 2: Main AI call (webhook or OpenAI) ---
        // Images have already been transcribed to text in Step 1, so all endpoints
        // receive the Vision analysis as part of examContent text
        if (endpoint && endpoint.status === 'ATIVO') {
            console.log(`[Diagnosis] Mode: Custom Endpoint (${endpoint.url})`);
            modelUsed = "custom-endpoint";
            try {
                aiResponse = await callOpenAICompatible(endpoint.url, endpoint, systemInstruction, userMessage, { patientName, userPrompt, complementaryData, exams: examsData });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (err: any) {
                console.error("Custom Endpoint Error:", err);
                aiResponse = `Erro ao consultar IA personalizada: ${err.message}. \n\nGerando resposta simulada de fallback...`;
            }

        } else if (process.env.OPENAI_API_KEY) {
            console.log(`[Diagnosis] Mode: System OpenAI (with web search)`);
            modelUsed = "system-openai";
            try {
                aiResponse = await callOpenAIWithSearch(systemInstruction, userMessage);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (err: any) {
                console.error("System OpenAI Error:", err);
                aiResponse = `Erro ao consultar OpenAI do sistema: ${err.message}`;
            }
        } else {
            console.log(`[Diagnosis] Mode: Simulation Fallback`);
            modelUsed = "simulation-fallback";
            aiResponse = `**[MODO SIMULAÇÃO]** (Nenhum endpoint ou chave API configurada)\n\n` +
                `**Hipótese:** Baseado em '${userPrompt}', sugere-se avaliar quadros virais ou infecções comuns.\n` +
                `**Recomendação:** Acompanhamento clínico e exames de rotina.`;
        }

        const diagnosis = await prisma.diagnosis.create({
            data: {
                doctorId,
                clinicId: doctor.clinicId, // Link to doctor's clinic for multi-clinic support
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
                clinicId: doctor.clinicId, // Link to doctor's clinic
                date: new Date(),
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                type: 'CONSULTA' as any,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const doctorId = (req as any).user.id;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            userId: (req as any).user.id,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

// Step 1 helper: Analyze images with OpenAI Vision API (gpt-4o)
// Returns a text transcription/analysis of the medical images
async function analyzeImagesWithVision(
    images: { base64: string; mimetype: string; originalName: string }[],
    patientName: string,
    symptoms: string
): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

    // Build multimodal content array
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userContent: any[] = [
        {
            type: "text",
            text: `Analise a(s) imagem(ns) médica(s) a seguir do paciente "${patientName}".
Sintomas relatados: ${symptoms}

Para cada imagem, forneça uma transcrição/análise detalhada incluindo:
- Tipo de exame identificado (raio-X, tomografia, ultrassom, ECG, etc.)
- Estruturas anatômicas visíveis
- Achados normais observados
- Achados anormais ou suspeitos (se houver)
- Qualidade técnica da imagem
- Correlação com os sintomas relatados

IMPORTANTE: Você é um assistente de apoio ao diagnóstico. A decisão final é sempre do médico.`
        }
    ];

    for (const img of images) {
        userContent.push({
            type: "image_url",
            image_url: {
                url: `data:${img.mimetype};base64,${img.base64}`,
                detail: "high"
            }
        });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: "Você é um assistente médico especialista em análise de exames de imagem (radiologia, tomografia, ultrassonografia, etc). Descreva detalhadamente o que observa nas imagens médicas fornecidas. Seja preciso e técnico, mas compreensível."
                },
                { role: "user", content: userContent }
            ],
            temperature: 0.3,
            max_tokens: 4096
        })
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenAI Vision API Error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '[Análise Vision não retornou resultado]';
}

// Direct OpenAI call using Responses API with web_search_preview
// This replaces the N8N AI Agent with web_search and web_fetch tools
async function callOpenAIWithSearch(systemPrompt: string, userMessage: string): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

    console.log(`[Diagnosis] Calling OpenAI Responses API with web_search_preview...`);

    const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: "gpt-4o",
            tools: [{ type: "web_search_preview" }],
            instructions: systemPrompt,
            input: userMessage,
            temperature: 0.7,
            max_output_tokens: 4096
        })
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenAI Responses API Error ${response.status}: ${errText}`);
    }

    const data = await response.json();

    // Parse the Responses API output format
    let textContent = '';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const citations: { url: string; title: string }[] = [];

    if (data.output && Array.isArray(data.output)) {
        for (const item of data.output) {
            if (item.type === 'message' && item.content) {
                for (const content of item.content) {
                    if (content.type === 'output_text') {
                        textContent += content.text || '';

                        // Collect unique citations from annotations
                        if (content.annotations && Array.isArray(content.annotations)) {
                            for (const ann of content.annotations) {
                                if (ann.type === 'url_citation' && ann.url) {
                                    if (!citations.find(c => c.url === ann.url)) {
                                        citations.push({
                                            url: ann.url,
                                            title: ann.title || ann.url
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    if (!textContent) {
        // Fallback: try other common response fields
        textContent = data.output_text || data.text || JSON.stringify(data, null, 2);
    }

    // Append formatted sources/references at the end of the response
    if (citations.length > 0) {
        textContent += `\n\n---\n\n### Fontes e Referências\n`;
        citations.forEach((cite, i) => {
            textContent += `${i + 1}. [${cite.title}](${cite.url})\n`;
        });
    }

    console.log(`[Diagnosis] Responses API returned ${textContent.length} chars, ${citations.length} citations`);
    return textContent;
}

// Helper for generic OpenAI-compatible API calls OR Webhooks
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function callOpenAICompatible(url: string, endpointConfig: any, systemPrompt: string, userPrompt: string, originalData: any): Promise<string> {
    const { authType, credentials } = endpointConfig;
    const token = credentials?.token?.trim();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let body: any;

    // Smart Body Construction
    // If it looks like a generic webhook (N8N, Make, Zapier), send flat data
    if (url.includes('webhook') || url.includes('n8n') || url.includes('make.com') || url.includes('zapier')) {
        body = {
            patientName: originalData.patientName,
            userPrompt: originalData.userPrompt,
            complementaryData: originalData.complementaryData,
            exams: originalData.exams || [],
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            examsContent: originalData.exams?.filter((e: any) => e.textContent).map((e: any) => ({
                fileName: e.originalName,
                content: e.textContent
            })) || [],
            systemInstruction: systemPrompt,
            fullUserMessage: userPrompt,
            timestamp: new Date().toISOString(),
            source: 'LiaMed-System'
        };
    } else {
        // Default to OpenAI Chat Completion Format (direct call - replaces N8N)
        body = {
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: 4096
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
