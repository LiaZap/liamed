import { Router } from 'express';
import { login, register, forgotPassword, resetPassword } from '../controllers/auth.controller';

const router = Router();

import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

const validateLogin = [
    body('email').isEmail().withMessage('Email inválido'),
    body('password').notEmpty().withMessage('Senha é obrigatória'),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

const validateRegister = [
    body('name').notEmpty().withMessage('Nome é obrigatório'),
    body('email').isEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres'),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

router.post('/login', validateLogin, login);
router.post('/register', validateRegister, register);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
