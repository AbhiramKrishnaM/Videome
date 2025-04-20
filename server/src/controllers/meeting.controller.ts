import { Request, Response } from 'express';
import Meeting, { IMeeting } from '@/models/Meeting';
import User, { IUser } from '@/models/User';
import Organization from '@/models/Organization';
import { InvitationStatus } from '@/models/Meeting';
import { createNotification } from '@/controllers/notification.controller';
import { NotificationType } from '@/models/Notification';
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
      .populate('host', 'name email')
      .populate('organization', 'name');

    // Find meetings where user is a participant
    const participantMeetings = await Meeting.find({
      'participants.user': req.user?._id,
    })
      .sort({ startTime: -1 })
      .populate('host', 'name email')
      .populate('organization', 'name');

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
      .populate('organization', 'name')
      .populate('participants.user', 'name email')
      .populate('participants.invitedBy', 'name email');

    if (!meeting) {
      res.status(404).json({ message: 'Meeting not found' });
      return;
    }

    // Check if user is authorized to view the meeting
    const isHost = meeting.host._id.toString() === req.user?._id?.toString();
    const isParticipant = meeting.participants.some(
      (p) => p.user._id.toString() === req.user?._id.toString(),
    );

    // Allow organization admins to view meetings in their organization
    const isOrgAdmin =
      req.user?.role === 'org_admin' &&
      req.user?.organization?.toString() === meeting.organization._id.toString();

    // Super admins can view any meeting
    const isSuperAdmin = req.user?.role === 'super_admin';

    if (!isHost && !isParticipant && !isOrgAdmin && !isSuperAdmin) {
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

    // Set organization
    req.body.organization = req.user?.organization;

    // Check if organization exists
    if (!req.body.organization) {
      res.status(400).json({ message: 'You must be part of an organization to create meetings' });
      return;
    }

    // Process invited participants
    let participants = [];
    if (req.body.invitedUsers && Array.isArray(req.body.invitedUsers)) {
      // Get organization users to validate invited users
      const orgUsers = await User.find({
        organization: req.user?.organization,
        _id: { $ne: req.user?._id }, // Exclude the host
      }).select('_id');

      // Convert to set of IDs for efficient lookup
      const orgUserIds = new Set(orgUsers.map((user) => (user as any)._id.toString()));

      // Filter and format valid invited users
      participants = req.body.invitedUsers
        .filter((userId: string) => orgUserIds.has(userId.toString()))
        .map((userId: string) => ({
          user: userId,
          status: InvitationStatus.PENDING,
          invitedBy: req.user?._id,
          notificationSent: false,
        }));

      // Remove invitedUsers field before creating meeting
      delete req.body.invitedUsers;
    }

    // Add participants to meeting data
    req.body.participants = participants;

    const meeting = await Meeting.create(req.body);

    // Send notifications to invited participants
    const meetingWithDetails = await Meeting.findById(meeting._id)
      .populate('host', 'name')
      .populate('organization', 'name');

    // Send notifications asynchronously
    const notificationPromises = participants.map(async (participant: any) => {
      // Create notification
      const meetingDoc = meeting as unknown as IMeeting;
      const notification = await createNotification(
        participant.user.toString(),
        NotificationType.MEETING_INVITE,
        'Meeting Invitation',
        `${req.user?.name} invited you to meeting: ${meetingDoc.title}`,
        'Meeting',
        (meetingDoc._id as any).toString(),
      );

      // Update participant record to mark notification as sent
      if (notification) {
        await Meeting.updateOne(
          {
            _id: (meeting as IMeeting)._id,
            'participants.user': participant.user,
          },
          {
            $set: {
              'participants.$.notificationSent': true,
              'participants.$.notifiedAt': new Date(),
            },
          },
        );
      }
    });

    // Wait for all notifications to be sent
    await Promise.all(notificationPromises);

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

    // Check if user is the host or admin of the organization
    const isHost = meeting.host.toString() === req.user?._id.toString();
    const isOrgAdmin =
      req.user?.role === 'org_admin' &&
      req.user?.organization?.toString() === meeting.organization.toString();
    const isSuperAdmin = req.user?.role === 'super_admin';

    if (!isHost && !isOrgAdmin && !isSuperAdmin) {
      res.status(403).json({ message: 'Not authorized to update this meeting' });
      return;
    }

    // Prevent changing the host or organization of the meeting
    if (req.body.host) {
      delete req.body.host;
    }

    if (req.body.organization) {
      delete req.body.organization;
    }

    // Handle updated participants if provided
    if (req.body.invitedUsers && Array.isArray(req.body.invitedUsers)) {
      // Get current participants to avoid duplicates
      const currentParticipantIds = meeting.participants.map((p) => p.user.toString());

      // Get organization users to validate new invited users
      const orgUsers = await User.find({
        organization: meeting.organization,
        _id: { $ne: meeting.host.toString() }, // Exclude the host
      }).select('_id');

      // Convert to set of IDs for efficient lookup
      const orgUserIds = new Set(orgUsers.map((user) => (user as any)._id.toString()));

      // Filter and format valid new invited users
      const newParticipants = req.body.invitedUsers
        .filter(
          (userId: string) =>
            // Must be in organization and not already a participant
            orgUserIds.has(userId.toString()) && !currentParticipantIds.includes(userId.toString()),
        )
        .map((userId: string) => ({
          user: userId,
          status: InvitationStatus.PENDING,
          invitedBy: req.user?._id,
          notificationSent: false,
        }));

      // Add new participants to the existing ones
      const updatedParticipants = [...meeting.participants, ...newParticipants];
      req.body.participants = updatedParticipants;

      // Remove invitedUsers field before updating
      delete req.body.invitedUsers;

      // Send notifications for new participants
      newParticipants.forEach(async (participant: any) => {
        const meetingDoc = meeting as unknown as IMeeting;
        await createNotification(
          participant.user.toString(),
          NotificationType.MEETING_INVITE,
          'Meeting Invitation',
          `${req.user?.name} invited you to meeting: ${meetingDoc.title}`,
          'Meeting',
          (meetingDoc._id as any).toString(),
        );

        // Update participant record
        await Meeting.updateOne(
          {
            _id: (meeting as IMeeting)._id,
            'participants.user': participant.user,
          },
          {
            $set: {
              'participants.$.notificationSent': true,
              'participants.$.notifiedAt': new Date(),
            },
          },
        );
      });
    }

    meeting = await Meeting.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    // If meeting time was updated, notify all participants
    if (req.body.startTime || req.body.endTime) {
      const participants = meeting?.participants.map((p) => p.user.toString()) || [];

      participants.forEach(async (userId) => {
        const meetingDoc = meeting as unknown as IMeeting;
        await createNotification(
          userId,
          NotificationType.MEETING_UPDATED,
          'Meeting Updated',
          `The meeting "${meetingDoc?.title}" has been rescheduled`,
          'Meeting',
          meeting?._id ? (meeting._id as any).toString() : '',
        );
      });
    }

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

    // Check if user is the host, org admin, or super admin
    const isHost = meeting.host.toString() === req.user?._id.toString();
    const isOrgAdmin =
      req.user?.role === 'org_admin' &&
      req.user?.organization?.toString() === meeting.organization.toString();
    const isSuperAdmin = req.user?.role === 'super_admin';

    if (!isHost && !isOrgAdmin && !isSuperAdmin) {
      res.status(403).json({ message: 'Not authorized to delete this meeting' });
      return;
    }

    // Notify participants that meeting is canceled
    const participants = meeting.participants.map((p) => p.user.toString());

    participants.forEach(async (userId) => {
      const meetingDoc = meeting as unknown as IMeeting;
      await createNotification(
        userId,
        NotificationType.MEETING_CANCELED,
        'Meeting Canceled',
        `The meeting "${meetingDoc.title}" has been canceled by ${req.user?.name}`,
        'Meeting',
        (meetingDoc._id as any).toString(),
      );
    });

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

    // Check if user belongs to the same organization
    const userOrgId = req.user?.organization?.toString();
    const meetingOrgId = meeting.organization.toString();

    if (userOrgId !== meetingOrgId && req.user?.role !== 'super_admin') {
      res.status(403).json({
        message: 'You cannot join meetings from different organizations',
      });
      return;
    }

    // Check if user is the host (auto-accept)
    if (req.user?._id.toString() === meeting.host.toString()) {
      res.status(200).json({
        success: true,
        data: meeting,
      });
      return;
    }

    // Check if user is already a participant
    const existingParticipant = meeting.participants.find(
      (p) => p.user.toString() === req.user?._id.toString(),
    );

    if (existingParticipant) {
      // Update participant status to accepted if it was pending
      if (existingParticipant.status === InvitationStatus.PENDING) {
        existingParticipant.status = InvitationStatus.ACCEPTED;
        await meeting.save();
      }

      res.status(200).json({
        success: true,
        data: meeting,
      });
      return;
    }

    // If not already a participant, add them
    meeting.participants.push({
      user: req.user?._id,
      joinedAt: new Date(),
      status: InvitationStatus.ACCEPTED,
      notificationSent: false,
    } as any);

    await meeting.save();

    res.status(200).json({
      success: true,
      data: meeting,
    });
  } catch (error) {
    logger.error(`Error in joinMeeting: ${error}`);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Decline meeting invitation
 * @route   POST /api/v1/meetings/:id/decline
 * @access  Private
 */
export const declineMeeting = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      res.status(404).json({ message: 'Meeting not found' });
      return;
    }

    // Find the participant
    const participantIndex = meeting.participants.findIndex(
      (p) => p.user.toString() === req.user?._id.toString(),
    );

    if (participantIndex === -1) {
      res.status(400).json({ message: 'You are not invited to this meeting' });
      return;
    }

    // Update status to declined
    meeting.participants[participantIndex].status = InvitationStatus.DECLINED;
    await meeting.save();

    res.status(200).json({
      success: true,
      data: { message: 'Meeting invitation declined' },
    });
  } catch (error) {
    logger.error(`Error in declineMeeting: ${error}`);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get organization members for meeting invites
 * @route   GET /api/v1/meetings/organization-members
 * @access  Private
 */
export const getOrganizationMembers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Check if user belongs to an organization
    if (!req.user?.organization) {
      res.status(400).json({ message: 'You are not part of any organization' });
      return;
    }

    // Get all members of the user's organization
    const members = await User.find({
      organization: req.user.organization,
      _id: { $ne: req.user._id }, // Exclude current user
      isActive: true, // Only include active users
    })
      .select('_id name email position')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: members.length,
      data: members,
    });
  } catch (error) {
    logger.error(`Error in getOrganizationMembers: ${error}`);
    res.status(500).json({ message: 'Server error' });
  }
};
