import { Router } from 'express';
import upload from '../config/upload';
import { authenticateToken } from '../middleware/auth.middleware';
import { createDiagnosis, listDiagnoses } from '../controllers/diagnosis.controller';

const router = Router();

// GET /api/diagnosis
router.get('/', authenticateToken, listDiagnoses);

// POST /api/diagnosis
// Uses 'exams' as the key for file uploads (simulating array of files)
router.post('/', authenticateToken, upload.array('exams'), createDiagnosis);

export default router;
