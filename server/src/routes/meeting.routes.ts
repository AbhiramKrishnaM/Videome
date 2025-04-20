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

// Join meeting route (does not require auth)
// Must be defined before the protect middleware
router.post('/join/:id', joinMeeting);

// Use protect middleware for all other routes
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

export default router;
