import { io, Socket } from 'socket.io-client';
import { Meeting } from '@/types/meeting';
import { User } from '@/types/user';

// Events for signaling
export enum SocketEvents {
  JOIN_MEETING = 'join-meeting',
  USER_JOINED = 'user-joined',
  USER_LEFT = 'user-left',
  OFFER = 'offer',
  ANSWER = 'answer',
  ICE_CANDIDATE = 'ice-candidate',
  END_MEETING = 'end-meeting',
  MEETING_ENDED = 'meeting-ended',
}

let socket: Socket | null = null;

/**
 * Initialize socket connection
 */
export const initializeSocket = (token: string): Socket => {
  // Use the same API_URL format as the api.ts file
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';
  // Extract the base URL without the /api/v1 part for socket connection
  const SOCKET_URL = API_BASE_URL.replace(/\/api\/v1$/, '');

  if (socket) {
    socket.disconnect();
  }

  socket = io(SOCKET_URL, {
    auth: {
      token,
    },
    transports: ['websocket'],
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket?.id);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  return socket;
};

/**
 * Join a meeting room
 */
export const joinMeeting = (meetingId: string, user: User): void => {
  if (!socket) {
    throw new Error('Socket not initialized');
  }

  socket.emit(SocketEvents.JOIN_MEETING, { meetingId, user });
};

/**
 * Send WebRTC offer to another user
 */
export const sendOffer = (
  toUserId: string,
  offer: RTCSessionDescriptionInit,
  fromUserId: string,
): void => {
  if (!socket) {
    throw new Error('Socket not initialized');
  }

  socket.emit(SocketEvents.OFFER, { to: toUserId, offer, from: fromUserId });
};

/**
 * Send WebRTC answer to another user
 */
export const sendAnswer = (
  toUserId: string,
  answer: RTCSessionDescriptionInit,
  fromUserId: string,
): void => {
  if (!socket) {
    throw new Error('Socket not initialized');
  }

  socket.emit(SocketEvents.ANSWER, { to: toUserId, answer, from: fromUserId });
};

/**
 * Send ICE candidate to another user
 */
export const sendIceCandidate = (
  toUserId: string,
  candidate: RTCIceCandidate,
  fromUserId: string,
): void => {
  if (!socket) {
    throw new Error('Socket not initialized');
  }

  socket.emit(SocketEvents.ICE_CANDIDATE, { to: toUserId, candidate, from: fromUserId });
};

/**
 * End meeting
 */
export const endMeeting = (meetingId: string): void => {
  if (!socket) {
    throw new Error('Socket not initialized');
  }

  socket.emit(SocketEvents.END_MEETING, { meetingId });
};

/**
 * Leave meeting
 */
export const leaveMeeting = (meetingId: string, userId: string): void => {
  if (!socket) {
    throw new Error('Socket not initialized');
  }

  socket.emit(SocketEvents.USER_LEFT, { meetingId, userId });
};

/**
 * Subscribe to socket events
 */
export const onEvent = (event: SocketEvents, callback: (data: any) => void): void => {
  if (!socket) {
    throw new Error('Socket not initialized');
  }

  socket.on(event, callback);
};

/**
 * Unsubscribe from socket events
 */
export const offEvent = (event: SocketEvents, callback?: (data: any) => void): void => {
  if (!socket) {
    return;
  }

  socket.off(event, callback);
};

/**
 * Disconnect socket
 */
export const disconnectSocket = (): void => {
  if (!socket) {
    return;
  }

  socket.disconnect();
  socket = null;
};
