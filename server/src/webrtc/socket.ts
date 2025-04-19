import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { config } from '../config/config';
import logger from '../utils/logger';

// Room Management
const rooms = new Map<string, Set<string>>();

// Initialize Socket.io
export const initializeSocketIO = (server: HttpServer): void => {
  const io = new Server(server, {
    cors: {
      origin: config.corsOrigin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket: Socket) => {
    logger.info(`New WebSocket connection: ${socket.id}`);

    // Join a room
    socket.on('join-room', (roomId: string, userId: string, userName: string) => {
      try {
        // Create room if doesn't exist
        if (!rooms.has(roomId)) {
          rooms.set(roomId, new Set<string>());
        }

        // Add user to room
        const room = rooms.get(roomId);
        room?.add(userId);

        socket.join(roomId);
        
        // Notify others in the room
        socket.to(roomId).emit('user-connected', {
          userId,
          userName,
        });

        // Send list of current users to the joining user
        const clients = io.sockets.adapter.rooms.get(roomId) || new Set<string>();
        const users = Array.from(clients).filter((id) => id !== socket.id);
        
        socket.emit('room-users', users);

        logger.info(`User ${userId} joined room ${roomId}`);

        // Handle disconnection
        socket.on('disconnect', () => {
          logger.info(`User ${userId} disconnected from room ${roomId}`);
          socket.to(roomId).emit('user-disconnected', userId);
          
          // Remove user from room
          const room = rooms.get(roomId);
          room?.delete(userId);
          
          // Delete room if empty
          if (room?.size === 0) {
            rooms.delete(roomId);
          }
        });
      } catch (error) {
        logger.error(`Error joining room: ${error}`);
      }
    });

    // WebRTC signaling
    socket.on('signal', (to: string, from: string, signal: any) => {
      io.to(to).emit('signal', from, signal);
    });

    // Chat message
    socket.on('message', (roomId: string, message: any, sender: string) => {
      io.to(roomId).emit('message', message, sender);
    });
  });
}; 