import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import meetingRoutes from './meeting.routes';
import organizationRoutes from './organization.routes';
import notificationRoutes from './notification.routes';

const router = Router();

// Health check for API
router.get('/', (req, res) => {
  res.status(200).json({ message: 'API is running' });
});

// Routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/meetings', meetingRoutes);
router.use('/organizations', organizationRoutes);
router.use('/notifications', notificationRoutes);

export default router;
