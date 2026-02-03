import { Router } from 'express';
import { getProfile, listUsers, deleteUser, createUser, updateUser, getUserSubscriptions, acceptTerms } from '../controllers/user.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/profile', authenticateToken, getProfile);
router.post('/accept-terms', authenticateToken, acceptTerms);
router.get('/:id/subscriptions', authenticateToken, getUserSubscriptions); // Debug endpoint
router.get('/', authenticateToken, listUsers);
router.post('/', authenticateToken, createUser);
router.put('/:id', authenticateToken, updateUser);
router.delete('/:id', authenticateToken, deleteUser);
router.delete('/', authenticateToken, deleteUser); // Self-delete fallback

export default router;
