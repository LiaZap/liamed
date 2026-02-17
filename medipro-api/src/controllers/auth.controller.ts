import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { logAction } from '../services/audit.service';
import { sendPasswordResetEmail } from '../services/email.service';
import crypto from 'crypto';

const prisma = new PrismaClient();

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        console.log(`[AUTH] Login attempt for: ${email}`);

        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                subscriptions: {
                    // where: { status: { in: ['ACTIVE', 'TRIALING'] } },
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    include: { plan: true }
                }
            }
        });

        if (!user) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role,
                name: user.name
            },
            process.env.JWT_SECRET as string,
            { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any }
        );

        await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
        });

        await logAction({
            userId: user.id,
            userName: user.name,
            action: 'LOGIN',
            resource: 'AUTH',
            details: { email: user.email },
            req
        });

        // Determine plan info
        let plan = 'ESSENTIAL';
        let planStatus = 'ACTIVE';
        if (user.subscriptions && user.subscriptions.length > 0) {
            const sub = user.subscriptions[0];
            if (sub.plan) {
                plan = sub.plan.name.toUpperCase();
            }
            planStatus = sub.status;
        }

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                plan,
                planStatus,
                termsAcceptedAt: user.termsAcceptedAt
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Erro interno ao realizar login.' });
    }
};

// Register new doctor
export const register = async (req: Request, res: Response) => {
    try {
        const { name, email, password, specialty, phone, birthDate, role, clinicName, clinicCnpj, clinicPhone } = req.body;
        console.log(`[AUTH] Register attempt for: ${email} as ${role || 'MEDICO'}`);

        // Validations
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Nome, email e senha são obrigatórios.' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres.' });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'Este email já está cadastrado.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Verify invite code if provided
        let clinicId = null;
        if (req.body.inviteCode) {
            const clinic = await prisma.clinic.findUnique({
                where: { inviteCode: req.body.inviteCode }
            });

            if (clinic) {
                clinicId = clinic.id;
                console.log(`[AUTH] User joining clinic: ${clinic.name} (${clinic.id})`);
            } else {
                // Should we block or just ignore? User friendly: warn them?
                // For now, let's treat invalid code as an error to prevent mistakes
                return res.status(400).json({ error: 'Código de convite da clínica inválido.' });
            }
        }

        // Handle Clinic Creation for GESTOR
        if (role === 'GESTOR') {
            if (!clinicName) {
                return res.status(400).json({ error: 'Nome da clínica é obrigatório para cadastro de gestor.' });
            }

            // Generate simple invite code: FIRST3 + RAND4 (e.g., CLI-5921)
            const prefix = clinicName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'CLI');
            const random = Math.floor(1000 + Math.random() * 9000); // 1000-9999
            const generatedInviteCode = `${prefix}-${random}`;

            try {
                const newClinic = await prisma.clinic.create({
                    data: {
                        name: clinicName,
                        cnpj: clinicCnpj || null,
                        phone: clinicPhone || null,
                        inviteCode: generatedInviteCode
                    }
                });
                clinicId = newClinic.id;
                console.log(`[AUTH] Created new clinic: ${clinicName} (${generatedInviteCode})`);
            } catch (err) {
                console.error("Error creating clinic:", err);
                return res.status(500).json({ error: 'Erro ao criar clínica. Verifique se o CNPJ já existe.' });
            }
        }

        // Create user
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role === 'GESTOR' ? 'GESTOR' : 'MEDICO',
                status: 'ATIVO',
                specialty: specialty || null,
                phone: phone || null,
                birthDate: birthDate ? new Date(birthDate) : null,
                clinicId: clinicId // Link to clinic
            }
        });

        // HANDLE PROMO CODE / TRIAL
        let trialDays = 0;
        let appliedPromoCode = null;

        if (req.body.promoCode) {
            const promo = await prisma.promoCode.findUnique({
                where: { code: req.body.promoCode.toUpperCase() }
            });

            if (promo && promo.isActive) {
                const now = new Date();
                const isExpired = promo.expiresAt && promo.expiresAt < now;
                const isLimitReached = promo.maxUses && promo.currentUses >= promo.maxUses;

                if (!isExpired && !isLimitReached) {
                    // Valid promo!
                    if (promo.type === 'TRIAL_EXTENSION') {
                        trialDays = promo.value;
                    }
                    appliedPromoCode = promo.code;

                    // Increment usage
                    await prisma.promoCode.update({
                        where: { id: promo.id },
                        data: { currentUses: { increment: 1 } }
                    });
                }
            }
        }

        // Only create subscription if trial days were granted via promo code
        let planStatus = 'INACTIVE';
        if (trialDays > 0) {
            const trialEndDate = new Date();
            trialEndDate.setDate(trialEndDate.getDate() + trialDays);

            // Find or create PRO plan
            let proPlan = await prisma.plan.findFirst({ where: { name: 'Pro' } });
            if (!proPlan) {
                proPlan = await prisma.plan.create({
                    data: {
                        name: 'Pro',
                        price: 89.90,
                        interval: 'MONTHLY',
                        features: [
                            'Assistente IA LIAMED',
                            'Transcrições Ilimitadas',
                            'Calculadoras Médicas',
                            'Suporte Prioritário'
                        ]
                    }
                });
            }

            // Create trial subscription
            await prisma.subscription.create({
                data: {
                    userId: user.id,
                    planId: proPlan.id,
                    status: 'TRIALING',
                    currentPeriodStart: new Date(),
                    currentPeriodEnd: trialEndDate
                }
            });
            planStatus = 'TRIALING';
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role,
                name: user.name
            },
            process.env.JWT_SECRET as string,
            { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any }
        );

        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
        });

        // Audit log
        await logAction({
            userId: user.id,
            userName: user.name,
            action: 'REGISTER',
            resource: 'AUTH',
            details: { email: user.email, specialty, promoCode: appliedPromoCode, trialDays },
            req
        });

        console.log(`[AUTH] User registered: ${email}. Promo: ${appliedPromoCode || 'NONE'}. Trial: ${trialDays} days.`);

        res.status(201).json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                specialty: user.specialty,
                plan: trialDays > 0 ? 'PRO' : 'ESSENTIAL', // Assuming Essential is default/fallback
                planStatus: planStatus
            },
            message: trialDays > 0 
                ? `Conta criada com com ${trialDays} dias de teste do Plano PRO!` 
                : 'Conta criada com sucesso!'
        });

    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Erro ao criar conta. Tente novamente.' });
    }
};

// Forgot Password
export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        console.log(`[AUTH] Forgot Password request for: ${email}`);

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            return res.json({ message: 'Se o email existir, você receberá um link de recuperação.' });
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 3600000); // 1 hour

        await prisma.passwordResetToken.create({
            data: {
                email,
                token,
                expiresAt
            }
        });

        // REAL EMAIL SENDING
        await sendPasswordResetEmail(email, token);

        res.json({ message: 'Se o email existir, você receberá um link de recuperação.' });

    } catch (error) {
        console.error('Forgot Password error:', error);
        res.status(500).json({ error: 'Erro ao processar solicitação.' });
    }
};

// Reset Password
export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { token, newPassword } = req.body;

        const resetToken = await prisma.passwordResetToken.findUnique({
            where: { token }
        });

        if (!resetToken) {
            return res.status(400).json({ error: 'Token inválido ou expirado.' });
        }

        if (newPassword.length < 6) return res.status(400).json({ error: 'Senha muito curta.' });

        if (resetToken.expiresAt < new Date()) {
            await prisma.passwordResetToken.delete({ where: { token } });
            return res.status(400).json({ error: 'Token expirado. Solicite novamente.' });
        }

        const user = await prisma.user.findUnique({ where: { email: resetToken.email } });
        if (!user) {
            return res.status(400).json({ error: 'Usuário não encontrado.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword }
        });

        await prisma.passwordResetToken.deleteMany({
            where: { email: user.email }
        });

        await logAction({
            userId: user.id,
            userName: user.name,
            action: 'RESET_PASSWORD',
            resource: 'AUTH',
            details: { email: user.email },
            req
        });

        res.json({ message: 'Senha redefinida com sucesso!' });

    } catch (error) {
        console.error('Reset Password error:', error);
        res.status(500).json({ error: 'Erro ao redefinir senha.' });
    }
};

