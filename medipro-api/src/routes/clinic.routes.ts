import { Router } from 'express';
import {
    listClinics,
    getClinicById,
    getMyClinic,
    createClinic,
    updateClinic,
    deleteClinic,
    addUserToClinic,
    removeUserFromClinic
} from '../controllers/clinic.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/my', authenticateToken, getMyClinic);
router.get('/', authenticateToken, listClinics);
router.get('/:id', authenticateToken, getClinicById);
router.post('/', authenticateToken, createClinic);
router.put('/:id', authenticateToken, updateClinic);
router.delete('/:id', authenticateToken, deleteClinic);
router.post('/add-user', authenticateToken, addUserToClinic);
router.delete('/remove-user/:userId', authenticateToken, removeUserFromClinic);

export default router;
