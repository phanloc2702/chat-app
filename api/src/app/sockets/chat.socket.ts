import { Server, Socket } from 'socket.io';
import * as messageService from '../services/message.service';
import * as notificationService from '../services/notification.service';
import * as conversationService from '../services/conversation.service';
import { NotificationType } from '../entities/notification.entity';

export const registerChatSocket = (io: Server, socket: Socket) => {
  socket.on('join_user_room', (userId: number) => {
    socket.join(`user_${userId}`);
    console.log(`[socket] ${socket.id} joined user_${userId}`);
  });

  socket.on('join_conversation', (conversationId: number) => {
    socket.join(`conversation_${conversationId}`);
    console.log(`[socket] ${socket.id} joined conversation_${conversationId}`);
  });

  socket.on('leave_conversation', (conversationId: number) => {
    socket.leave(`conversation_${conversationId}`);
    console.log(`[socket] ${socket.id} left conversation_${conversationId}`);
  });

  socket.on(
    'typing_start',
    (payload: {
      conversationId: number;
      userId: number;
      username?: string;
    }) => {
      socket.to(`conversation_${payload.conversationId}`).emit('user_typing', {
        conversationId: payload.conversationId,
        userId: payload.userId,
        username: payload.username,
        isTyping: true,
      });
    }
  );

  socket.on(
    'typing_stop',
    (payload: {
      conversationId: number;
      userId: number;
      username?: string;
    }) => {
      socket.to(`conversation_${payload.conversationId}`).emit('user_typing', {
        conversationId: payload.conversationId,
        userId: payload.userId,
        username: payload.username,
        isTyping: false,
      });
    }
  );

  socket.on(
    'send_message',
    async (payload: {
      conversationId: number;
      senderId: number;
      content: string;
    }) => {
      try {
        const { conversationId, senderId, content } = payload;

        const message = await messageService.sendMessage({
          conversationId,
          senderId,
          content,
        });

        io.to(`conversation_${conversationId}`).emit(
          'receive_message',
          message
        );

        const members = await messageService.getConversationMembers(
          conversationId
        );

        for (const member of members) {
          const conversationPayload =
            await conversationService.getConversationDetailForUser(
              conversationId,
              member.id
            );

          io.to(`user_${member.id}`).emit(
            'conversation_updated',
            conversationPayload
          );
        }

        const receivers = members.filter((member) => member.id !== senderId);

        for (const receiver of receivers) {
          const notification = await notificationService.createNotification({
            userId: receiver.id,
            type: NotificationType.NEW_MESSAGE,
            title: 'Tin nhắn mới',
            content: `${message.sender?.username || 'Có người'}: ${
              message.content || 'Đã gửi một ảnh'
            }`,
            relatedConversationId: conversationId,
          });

          io.to(`user_${receiver.id}`).emit('new_notification', notification);
        }

        socket.to(`conversation_${conversationId}`).emit('user_typing', {
          conversationId,
          userId: senderId,
          username: message.sender?.username,
          isTyping: false,
        });

        console.log(
          `[socket] message emitted to conversation_${conversationId} | sender=${senderId}`
        );
      } catch (error) {
        socket.emit('message_error', {
          message:
            error instanceof Error ? error.message : 'Send message failed',
        });
      }
    }
  );
};