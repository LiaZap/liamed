import { Router } from 'express';
import { listConsults, createConsult, getConsultStats, getConsultById, updateConsultStatus } from '../controllers/consult.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/stats', authenticateToken, getConsultStats); // Must come before / matchers if any (here listConsults is /)
router.get('/:id', authenticateToken, getConsultById);
router.patch('/:id/status', authenticateToken, updateConsultStatus);
router.get('/', authenticateToken, listConsults);
router.post('/', authenticateToken, createConsult);

export default router;
