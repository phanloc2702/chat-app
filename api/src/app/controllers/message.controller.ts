import { Request, Response } from 'express';
import * as messageService from '../services/message.service';
import * as notificationService from '../services/notification.service';
import * as conversationService from '../services/conversation.service';
import { NotificationType } from '../entities/notification.entity';
import * as fileService from '../services/file.service';
import { getIo } from '../config/socket';

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const senderId = req.user?.userId;

    if (!senderId) {
      return res.status(401).json({
        message: 'Unauthorized',
      });
    }

    const { conversationId, content } = req.body;

    const message = await messageService.sendMessage({
      conversationId: Number(conversationId),
      senderId,
      content,
    });

    return res.status(201).json({
      message: 'Send message successfully',
      data: message,
    });
  } catch (error) {
    console.error('[message] send text failed:', error);

    return res.status(400).json({
      message: error instanceof Error ? error.message : 'Send message failed',
    });
  }
};

export const sendImageMessage = async (req: Request, res: Response) => {
  try {
    const senderId = req.user?.userId;

    if (!senderId) {
      return res.status(401).json({
        message: 'Unauthorized',
      });
    }

    const conversationId = Number(req.body.conversationId);
    const content = req.body.content || null;

    if (!conversationId) {
      return res.status(400).json({
        message: 'conversationId is required',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: 'Image file is required',
      });
    }

    console.log('[message] uploading image...', {
      conversationId,
      senderId,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
    });

    const uploadedFile = await fileService.uploadChatImage(req.file);

    console.log('[message] image uploaded to minio:', uploadedFile);

    const message = await messageService.sendImageMessage({
      conversationId,
      senderId,
      content,
      fileName: uploadedFile.fileName,
      objectName: uploadedFile.objectName,
      fileMimeType: uploadedFile.mimeType,
      fileSize: uploadedFile.fileSize,
    });

    console.log('[message] image message saved:', {
      messageId: message.id,
      objectName: message.objectName,
      imageUrl: message.imageUrl,
    });

    // Các phần realtime/notification chỉ là side effect.
    // Nếu lỗi ở đây thì không nên làm FE hiểu nhầm là gửi ảnh thất bại.
    try {
      const io = getIo();

      io.to(`conversation_${conversationId}`).emit('receive_message', message);

      const members = await messageService.getConversationMembers(conversationId);

      for (const member of members) {
        try {
          const conversationPayload =
            await conversationService.getConversationDetailForUser(
              conversationId,
              member.id
            );

          io.to(`user_${member.id}`).emit(
            'conversation_updated',
            conversationPayload
          );
        } catch (error) {
          console.error(
            '[message] emit conversation_updated failed:',
            error
          );
        }
      }

      const receivers = members.filter((member) => member.id !== senderId);

      for (const receiver of receivers) {
        try {
          const notification = await notificationService.createNotification({
            userId: receiver.id,
            type: NotificationType.NEW_MESSAGE,
            title: 'Tin nhắn mới',
            content: `${message.sender?.username || 'Có người'} đã gửi một ảnh`,
            relatedConversationId: conversationId,
          });

          io.to(`user_${receiver.id}`).emit('new_notification', notification);
        } catch (error) {
          console.error('[message] create notification failed:', error);
        }
      }
    } catch (error) {
      console.error('[message] realtime side effect failed:', error);
    }

    return res.status(201).json({
      message: 'Send image message successfully',
      data: message,
    });
  } catch (error) {
    console.error('[message] send image failed:', error);

    return res.status(400).json({
      message:
        error instanceof Error ? error.message : 'Send image message failed',
    });
  }
};

export const getMessagesByConversation = async (
  req: Request,
  res: Response
) => {
  try {
    const currentUserId = req.user?.userId;

    if (!currentUserId) {
      return res.status(401).json({
        message: 'Unauthorized',
      });
    }

    const conversationId = Number(req.params.conversationId);

    if (!conversationId) {
      return res.status(400).json({
        message: 'Invalid conversation id',
      });
    }

    const messages = await messageService.getMessagesByConversation(
      conversationId,
      currentUserId
    );

    return res.status(200).json({
      message: 'Get messages successfully',
      data: messages,
    });
  } catch (error) {
    console.error('[message] get messages failed:', error);

    return res.status(400).json({
      message: error instanceof Error ? error.message : 'Get messages failed',
    });
  }
};