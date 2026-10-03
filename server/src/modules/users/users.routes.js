import { Router } from 'express';
import { updateStudentProfile, updateAlumniProfile, getAllUsersAdmin, updateUserByAdmin } from './users.controller.js';
import { verifyJWT } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/role.middleware.js';

const router = Router();

router.use(verifyJWT);

// Profile update endpoints
router.patch('/student/profile', authorize('STUDENT'), updateStudentProfile);
router.patch('/alumni/profile', authorize('ALUMNI'), updateAlumniProfile);

// Admin User Management Endpoints (Supports both /users and /users/admin/all)
router.get('/', authorize('ADMIN'), getAllUsersAdmin);
router.get('/admin/all', authorize('ADMIN'), getAllUsersAdmin);

router.patch('/:userId', authorize('ADMIN'), updateUserByAdmin);
router.patch('/admin/users/:userId', authorize('ADMIN'), updateUserByAdmin);

export default router;
