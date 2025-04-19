import { Request, Response } from 'express';
import Meeting, { IMeeting } from '@/models/Meeting';
import User, { IUser } from '@/models/User';
import logger from '@/utils/logger';

// Extended request interface
interface AuthRequest extends Request {
  user?: IUser & { _id: any };
}

/**
 * @desc    Get all meetings for current user
 * @route   GET /api/v1/meetings
 * @access  Private
 */
export const getMeetings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Find meetings where user is the host
    const hostMeetings = await Meeting.find({ host: req.user?._id })
      .sort({ startTime: -1 })
      .populate('host', 'name email');

    // Find meetings where user is a participant
    const participantMeetings = await Meeting.find({
      'participants.user': req.user?._id,
    })
      .sort({ startTime: -1 })
      .populate('host', 'name email');

    // Combine and sort all meetings
    const allMeetings = [...hostMeetings, ...participantMeetings].sort((a, b) => {
      return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
    });

    res.status(200).json({
      success: true,
      count: allMeetings.length,
      data: allMeetings,
    });
  } catch (error) {
    logger.error(`Error in getMeetings: ${error}`);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get single meeting
 * @route   GET /api/v1/meetings/:id
 * @access  Private
 */
export const getMeeting = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const meeting = await Meeting.findById(req.params.id)
      .populate('host', 'name email')
      .populate('participants.user', 'name email');

    if (!meeting) {
      res.status(404).json({ message: 'Meeting not found' });
      return;
    }

    // Check if user is authorized to view the meeting
    const isHost = meeting.host._id.toString() === req.user?._id?.toString();
    const isParticipant = meeting.participants.some(
      (p) => p.user._id.toString() === req.user?._id.toString(),
    );

    if (!isHost && !isParticipant && req.user?.role !== 'admin') {
      res.status(403).json({ message: 'Not authorized to access this meeting' });
      return;
    }

    res.status(200).json({
      success: true,
      data: meeting,
    });
  } catch (error) {
    logger.error(`Error in getMeeting: ${error}`);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Create new meeting
 * @route   POST /api/v1/meetings
 * @access  Private
 */
export const createMeeting = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Add host to the meeting data
    req.body.host = req.user?._id;

    const meeting = await Meeting.create(req.body);

    res.status(201).json({
      success: true,
      data: meeting,
    });
  } catch (error) {
    logger.error(`Error in createMeeting: ${error}`);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Update meeting
 * @route   PUT /api/v1/meetings/:id
 * @access  Private
 */
export const updateMeeting = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      res.status(404).json({ message: 'Meeting not found' });
      return;
    }

    // Check if user is the host or admin
    if (meeting.host.toString() !== req.user?._id.toString() && req.user?.role !== 'admin') {
      res.status(403).json({ message: 'Not authorized to update this meeting' });
      return;
    }

    // Prevent changing the host of the meeting
    if (req.body.host) {
      delete req.body.host;
    }

    meeting = await Meeting.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: meeting,
    });
  } catch (error) {
    logger.error(`Error in updateMeeting: ${error}`);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Delete meeting
 * @route   DELETE /api/v1/meetings/:id
 * @access  Private
 */
export const deleteMeeting = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      res.status(404).json({ message: 'Meeting not found' });
      return;
    }

    // Check if user is the host or admin
    if (meeting.host.toString() !== req.user?._id.toString() && req.user?.role !== 'admin') {
      res.status(403).json({ message: 'Not authorized to delete this meeting' });
      return;
    }

    await meeting.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    logger.error(`Error in deleteMeeting: ${error}`);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Join meeting by code
 * @route   POST /api/v1/meetings/join/:id
 * @access  Private
 */
export const joinMeeting = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Find meeting by code or ID
    const meeting = await Meeting.findOne({
      $or: [{ _id: req.params.id }, { meetingCode: req.params.id }],
    });

    if (!meeting) {
      res.status(404).json({ message: 'Meeting not found' });
      return;
    }

    // Check if meeting is active
    if (!meeting.isActive) {
      res.status(400).json({ message: 'This meeting is no longer active' });
      return;
    }

    // Check if user is already a participant
    const isParticipant = meeting.participants.some(
      (p) => p.user.toString() === req.user?._id.toString(),
    );

    // If not already a participant, add them
    if (!isParticipant && req.user?._id.toString() !== meeting.host.toString()) {
      meeting.participants.push({
        user: req.user?._id,
        joinedAt: new Date(),
      } as any);

      await meeting.save();
    }

    res.status(200).json({
      success: true,
      data: meeting,
    });
  } catch (error) {
    logger.error(`Error in joinMeeting: ${error}`);
    res.status(500).json({ message: 'Server error' });
  }
};
