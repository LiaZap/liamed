import { Router } from 'express';
import { getSettings, updateSetting } from '../controllers/setting.controller';
import { authenticateToken, isAdmin } from '../middleware/auth.middleware';

const router = Router();

// Public/Protected based on requirement. Settings usually require Admin.
router.use(authenticateToken);
router.use(isAdmin);

router.get('/', getSettings);
router.patch('/:id', updateSetting);

export default router;
