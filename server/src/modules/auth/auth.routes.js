import { Router } from 'express';
import { registerStudent, registerAlumni, login, getCurrentUser } from './auth.controller.js';
import { verifyJWT } from '../../middleware/auth.middleware.js';
import { upload } from '../../middleware/upload.middleware.js';
import { validateBody, validateEmail } from '../../middleware/validation.middleware.js';

const router = Router();

router.post(
  '/register/student',
  upload.single('studentIdCard'),
  validateBody(['name', 'email', 'password', 'regNumber']),
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

export default router;
