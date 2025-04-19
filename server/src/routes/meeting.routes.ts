import {
  getMeeting,
  createMeeting,
  getMeetings,
  updateMeeting,
  deleteMeeting,
  joinMeeting,
} from '@/controllers/meeting.controller';
import { protect } from '@/middleware/auth';
import { Router } from 'express';

const router = Router();

// Use protect middleware for all routes
router.use(protect);

// Get all meetings for the user
router.get('/', getMeetings);

// Get single meeting
router.get('/:id', getMeeting);

// Create new meeting
router.post('/', createMeeting);

// Update meeting
router.put('/:id', updateMeeting);

// Delete meeting
router.delete('/:id', deleteMeeting);

// Join meeting (no auth required)
router.post('/join/:id', joinMeeting);

export default router;
