import { User } from './user';

export interface Meeting {
  _id: string;
  title: string;
  description?: string;
  hostId: string;
  host?: User;
  participants?: User[];
  meetingCode: string;
  startTime?: string;
  endTime?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMeetingData {
  title: string;
  description?: string;
}

export interface JoinMeetingData {
  meetingCode: string;
}
