import { Router } from 'express';
import { listPrompts, createPrompt, updatePrompt, deletePrompt } from '../controllers/prompt.controller';
import { authenticateToken, isAdmin } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);
// Prompts might be viewable by doctors but editable only by admins? 
// For now, let's assume fully Admin managed.
router.use(isAdmin);

router.get('/', listPrompts);
router.post('/', createPrompt);
router.put('/:id', updatePrompt);
router.delete('/:id', deletePrompt);

export default router;
