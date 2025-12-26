import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
    user?: any;
}

export const listEndpoints = async (req: AuthRequest, res: Response) => {
    try {
        const endpoints = await prisma.endpoint.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(endpoints);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao listar endpoints.' });
    }
};

export const createEndpoint = async (req: AuthRequest, res: Response) => {
    try {
        const { name, url, method, authType, credentials, status } = req.body;

        const endpoint = await prisma.endpoint.create({
            data: {
                name,
                url,
                method: method || 'POST',
                authType: authType || 'BASIC_AUTH',
                credentials: credentials || {},
                status: status || 'ATIVO'
            }
        });

        res.status(201).json(endpoint);
    } catch (error) {
        console.error("Create endpoint error details:", error);
        res.status(500).json({ error: 'Erro ao criar endpoint.', details: String(error) });
    }
};

export const updateEndpoint = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, url, method, authType, credentials, status } = req.body;

        const data: any = { name, url, method, authType, credentials, status };

        // Clean undefined
        Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);

        const endpoint = await prisma.endpoint.update({
            where: { id },
            data
        });

        res.json(endpoint);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar endpoint.' });
    }
};

export const deleteEndpoint = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        await prisma.endpoint.delete({
            where: { id }
        });

        res.json({ message: 'Endpoint removido.' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao remover endpoint.' });
    }
};

export const testConnection = async (req: AuthRequest, res: Response) => {
    try {
        const { url, method, authType, credentials } = req.body;

        if (!url || !url.startsWith('http')) {
            return res.status(400).json({ success: false, message: 'URL inválida.' });
        }

        const headers: any = {
            'Content-Type': 'application/json',
            'User-Agent': 'MediPro-System/1.0'
        };

        const token = credentials?.token?.trim();

        if (token) {
            switch (authType) {
                case 'BEARER_TOKEN': // Handle legacy frontend value if passed
                case 'BEARER':
                    headers['Authorization'] = `Bearer ${token}`;
                    break;
                case 'BASIC_AUTH':
                    // If token doesn't start with Basic, add it.
                    // Assumes token is base64 encoded user:pass
                    headers['Authorization'] = token.startsWith('Basic ') ? token : `Basic ${token}`;
                    break;
                case 'API_KEY':
                    // Defaulting to x-api-key, though this varies wildy.
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

        const start = Date.now();

        const fetchOptions: any = {
            method: method || 'GET',
            headers
        };

        // For requests that can have body
        if (['POST', 'PUT', 'PATCH'].includes(method)) {
            // Special handling for OpenAI to ensure 200 OK instead of 400 Bad Request
            if (url.includes('api.openai.com') && url.includes('chat/completions')) {
                fetchOptions.body = JSON.stringify({
                    model: "gpt-3.5-turbo",
                    messages: [{ role: "user", content: "Ping" }],
                    max_tokens: 1
                });
            } else {
                fetchOptions.body = JSON.stringify({ test: 'connection_verify' });
            }
        }

        const response = await fetch(url, fetchOptions);
        const end = Date.now();
        const latency = end - start;

        if (response.ok) {
            res.json({
                success: true,
                message: `Conectado: ${response.status} ${response.statusText}`,
                latency
            });
        } else {
            // If OpenAI returns 401, it's definitely the key.
            // If 404, URL wrong.
            // If 400, Body wrong (fixed above).
            res.json({
                success: false,
                message: `Erro Remoto: ${response.status} ${response.statusText}`,
                latency
            });
        }

    } catch (error: any) {
        console.error("Test connection error:", error);
        res.status(500).json({
            success: false,
            message: `Falha na conexão: ${error.message || String(error)}`
        });
    }
};
