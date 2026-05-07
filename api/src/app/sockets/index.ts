import { Server, Socket } from 'socket.io';
import { registerChatSocket } from './chat.socket';
import * as userService from '../services/user.service';

export const registerSocketHandlers = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log(`[socket] connected: ${socket.id}`);

    socket.on('user_connected', async (userId: number) => {
      socket.data.userId = userId;

      await userService.setUserOnlineStatus(userId, true);

      io.emit('user_status_changed', {
        userId,
        isOnline: true,
      });

      console.log(`[socket] user connected: ${userId}`);
    });

    registerChatSocket(io, socket);

    socket.on('disconnect', async () => {
      const userId = socket.data.userId;

      if (userId) {
        await userService.setUserOnlineStatus(userId, false);

        io.emit('user_status_changed', {
          userId,
          isOnline: false,
        });

        console.log(`[socket] user disconnected: ${userId}`);
      }

      console.log(`[socket] disconnected: ${socket.id}`);
    });
  });
};