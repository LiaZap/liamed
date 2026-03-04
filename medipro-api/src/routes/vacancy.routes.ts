import { Router } from 'express';
import { createVacancy, getVacancies, updateVacancy, deleteVacancy } from '../controllers/vacancy.controller';
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware';
import upload from '../config/upload';

const router = Router();

// Médicos, Gestores e Admins podem ver vagas
router.get('/', authenticateToken, authorizeRole(['ADMIN', 'GESTOR', 'MEDICO']), getVacancies);

// Apenas Admins e Gestores podem criar vagas
router.post('/', authenticateToken, authorizeRole(['ADMIN', 'GESTOR']), upload.single('image'), createVacancy);

// Criador da vaga ou ADMIN pode editar
router.put('/:id', authenticateToken, upload.single('image'), updateVacancy);

// Qualquer criador da vaga ou ADMIN pode deletar
router.delete('/:id', authenticateToken, deleteVacancy);

export default router;
