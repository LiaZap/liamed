import { Router } from 'express';
import { login, forgotPassword, resetPassword } from '../controllers/auth.controller';

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

router.post('/login', validateLogin, login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
