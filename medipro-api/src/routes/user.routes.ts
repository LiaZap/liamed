import { Router } from 'express';
import { getProfile, listUsers, deleteUser, createUser, updateUser } from '../controllers/user.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/profile', authenticateToken, getProfile);
router.get('/', authenticateToken, listUsers);
router.post('/', authenticateToken, createUser);
router.put('/:id', authenticateToken, updateUser);
router.delete('/:id', authenticateToken, deleteUser);
router.delete('/', authenticateToken, deleteUser); // Self-delete fallback

export default router;
