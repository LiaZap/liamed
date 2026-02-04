import { Router } from 'express';
import uploadConfig from '../config/upload';
import { uploadFile } from '../controllers/upload.controller';
import { authenticateToken, isAdmin } from '../middleware/auth.middleware';

const router = Router();

// Route: POST /api/upload
// Middleware: Auth + Admin (only admins should upload broadcast images for now, or just Auth if users need it later)
// For Broadcasts, definitely Admin.
router.post('/', authenticateToken, isAdmin, uploadConfig.single('file'), uploadFile);

export default router;
