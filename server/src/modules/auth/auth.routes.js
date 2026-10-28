import { Router } from 'express';
import {
  registerStudent,
  registerAlumni,
  login,
  getCurrentUser,
  forgotPassword,
  resetPassword
} from './auth.controller.js';
import { verifyJWT } from '../../middleware/auth.middleware.js';
import { upload } from '../../middleware/upload.middleware.js';
import { validateBody, validateEmail } from '../../middleware/validation.middleware.js';

const router = Router();

router.post(
  '/register/student',
  upload.single('studentIdCard'),
  validateBody(['name', 'email', 'password']),
  validateEmail('email'),
  registerStudent
);

router.post(
  '/register/alumni',
  upload.single('alumniIdCard'),
  validateBody(['name', 'email', 'password', 'company', 'designation']),
  validateEmail('email'),
  registerAlumni
);

router.post(
  '/login',
  validateBody(['email', 'password']),
  validateEmail('email'),
  login
);

router.get('/me', verifyJWT, getCurrentUser);

// ─── Password Reset (public, no JWT required) ────────────────────────────────
router.post('/forgot-password', validateBody(['email']), validateEmail('email'), forgotPassword);
router.post('/reset-password',  validateBody(['token', 'newPassword']), resetPassword);

export default router;
