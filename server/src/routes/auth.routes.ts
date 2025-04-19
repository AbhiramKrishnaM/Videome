import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, getMe, logout } from '@/controllers/auth.controller';
import { protect } from '@/middleware/auth';

const router = Router();

// Register user
router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please include a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  register,
);

// Login user
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please include a valid email'),
    body('password').exists().withMessage('Password is required'),
  ],
  login,
);

// Get current logged in user
router.get('/me', protect, getMe);

// Logout user
router.post('/logout', logout);

export default router;
