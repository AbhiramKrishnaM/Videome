import mongoose, { Document, Schema, Model } from 'mongoose';

// Define notification types
export enum NotificationType {
  MEETING_INVITE = 'meeting_invite',
  MEETING_REMINDER = 'meeting_reminder',
  MEETING_CANCELED = 'meeting_canceled',
  MEETING_UPDATED = 'meeting_updated',
  MEETING_STARTED = 'meeting_started',
}

// Notification interface
export interface INotification extends Document {
  user: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  relatedTo: {
    model: string;
    id: mongoose.Types.ObjectId;
  };
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Notification schema
const NotificationSchema: Schema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    relatedTo: {
      model: {
        type: String,
        required: true,
        enum: ['Meeting', 'User', 'Organization'],
      },
      id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

// Indexes for faster lookups
NotificationSchema.index({ user: 1 });
NotificationSchema.index({ isRead: 1 });
NotificationSchema.index({ type: 1 });
NotificationSchema.index({ 'relatedTo.id': 1 });
NotificationSchema.index({ createdAt: -1 });

const Notification: Model<INotification> = mongoose.model<INotification>(
  'Notification',
  NotificationSchema,
);

export default Notification;
