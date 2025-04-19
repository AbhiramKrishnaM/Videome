import { Router } from 'express';

import { authorize } from '@/middleware/auth';
import { protect } from '@/middleware/auth';
import { getUser, getUsers, updateUser, deleteUser } from '@/controllers/user.controller';

const router = Router();

// Use protect middleware for all routes
router.use(protect);

// Get all users (admin only)
router.get('/', authorize('admin'), getUsers);

// Get user profile
router.get('/:id', getUser);

// Update user profile
router.put('/:id', updateUser);

// Delete user
router.delete('/:id', deleteUser);

export default router;
