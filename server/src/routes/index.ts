import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import meetingRoutes from './meeting.routes';
const router = Router();

// Health check for API
router.get('/', (req, res) => {
  res.status(200).json({ message: 'API is running' });
});

// Routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/meetings', meetingRoutes);

export default router;
