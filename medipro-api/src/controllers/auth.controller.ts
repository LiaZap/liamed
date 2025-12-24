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
            where: { email }
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

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Erro interno ao realizar login.' });
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

        // SIMULATE EMAIL SENDING
        // const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
        // console.log('----------------------------------------------------');
        // console.log('📧  [MOCK EMAIL SERVICE] Password Reset Link:');
        // console.log(`📧  To: ${email}`);
        // console.log(`🔗  Link: ${resetLink}`);
        // console.log('----------------------------------------------------');

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

