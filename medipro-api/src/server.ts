import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit'; // Security
import * as dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();


// Rate Limiters
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 2000, // Limit each IP to 2000 requests per `window` (much higher for dashboard polling)
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again after 15 minutes'
});

const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    limit: 20, // Limit login attempts to 20 per hour
    message: 'Too many login attempts, please try again later'
});

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import statsRoutes from './routes/stats.routes';
import consultRoutes from './routes/consult.routes';
import diagnosisRoutes from './routes/diagnosis.routes';
import endpointRoutes from './routes/endpoint.routes';
import settingRoutes from './routes/setting.routes';
import promptRoutes from './routes/prompt.routes';
import auditRoutes from './routes/audit.routes';
import calculatorRoutes from './routes/calculator.routes';
import paymentRoutes from './routes/payment.routes';
import healthRoutes from './routes/health.routes';
import demoRoutes from './routes/demo.routes';
import clinicRoutes from './routes/clinic.routes';
import supportRoutes from './routes/support.routes';
import notificationRoutes from './routes/notification.routes';
import promoRoutes from './routes/promo.routes';
import uploadRoutes from './routes/upload.routes';
import swaggerUi from 'swagger-ui-express';
import { specs } from './config/swagger';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "img-src": ["'self'", "data:", "blob:", "*"],
        },
    },
}));
// CORS: Production uses only FRONTEND_URL, dev allows localhost
const isProduction = process.env.NODE_ENV === 'production';
const allowedOrigins = isProduction 
    ? [process.env.FRONTEND_URL].filter(Boolean) as string[]
    : [process.env.FRONTEND_URL || 'http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'];
app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));
// Configurar parsing condicional: JSON global exceto para webhook do Stripe
app.use((req, res, next) => {
    if (req.originalUrl === '/api/payments/webhook') {
        next();
    } else {
        express.json()(req, res, next);
    }
});

// Parser raw específico para o webhook do Stripe (necessário para assinatura)
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.set('trust proxy', 1); // Trust first proxy (nginx/cloudflare)
app.use(globalLimiter); // Apply global rate limit

// Routes API
app.use('/api/auth', authLimiter, authRoutes); // Apply stricter limit to auth
app.use('/api/users', userRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/consults', consultRoutes);
app.use('/api/diagnosis', diagnosisRoutes);
app.use('/api/endpoints', endpointRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/prompts', promptRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/calculators', calculatorRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/demo', demoRoutes);
app.use('/api/clinics', clinicRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/promos', promoRoutes);
app.use('/api/upload', uploadRoutes);

// Documentation - Protected in production
if (process.env.NODE_ENV !== 'production') {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
}

// Serve uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Rota de health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'MEDIPRO API está rodando!',
        timestamp: new Date().toISOString()
    });
});

// Rota de teste do banco - Development only
import { authenticateToken, isAdmin } from './middleware/auth.middleware';
if (process.env.NODE_ENV !== 'production') {
    app.get('/test-db', authenticateToken, isAdmin, async (req, res) => {
        try {
            const { PrismaClient } = await import('@prisma/client');
            const prisma = new PrismaClient();

            const usersCount = await prisma.user.count();
            const consultsCount = await prisma.consult.count();
            const diagnosesCount = await prisma.diagnosis.count();

            await prisma.$disconnect();

            res.json({
                status: 'ok',
                database: 'connected',
                stats: {
                    users: usersCount,
                    consults: consultsCount,
                    diagnoses: diagnosesCount
                }
            });
        } catch (error: any) {
            res.status(500).json({
                status: 'error',
                message: 'Erro ao conectar com banco de dados',
                error: error.message
            });
        }
    });
}
// Rota 404
app.use((req, res) => {
    res.status(404).json({
        error: 'Rota não encontrada'
    });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    const isProduction = process.env.NODE_ENV === 'production';
    res.status(500).json({
        error: 'Erro interno do servidor',
        message: isProduction ? 'Ocorreu um erro inesperado' : err.message,
        stack: isProduction ? undefined : err.stack // Hide stack in production
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor MEDIPRO rodando na porta ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
    console.log(`🗄️ Test DB: http://localhost:${PORT}/test-db`);
});
