import mongoose, { Document, Schema, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

// Meeting participant interface
interface IParticipant {
  user: mongoose.Types.ObjectId;
  joinedAt: Date;
  leftAt?: Date;
}

// Meeting interface
export interface IMeeting extends Document {
  title: string;
  description?: string;
  meetingCode: string;
  host: mongoose.Types.ObjectId;
  participants: IParticipant[];
  startTime: Date;
  endTime?: Date;
  isRecurring: boolean;
  recurringPattern?: string;
  isActive: boolean;
  isRecorded: boolean;
  recordingUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Meeting schema
const MeetingSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a title'],
      trim: true,
      maxlength: [100, 'Title cannot be more than 100 characters'],
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot be more than 500 characters'],
    },
    meetingCode: {
      type: String,
      unique: true,
      default: () => uuidv4().substring(0, 8),
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    participants: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
        leftAt: {
          type: Date,
        },
      },
    ],
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringPattern: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isRecorded: {
      type: Boolean,
      default: false,
    },
    recordingUrl: {
      type: String,
    },
  },
  { timestamps: true }
);

// Indexes
MeetingSchema.index({ host: 1 });
MeetingSchema.index({ meetingCode: 1 });
MeetingSchema.index({ startTime: 1 });

const Meeting: Model<IMeeting> = mongoose.model<IMeeting>('Meeting', MeetingSchema);

export default Meeting; 