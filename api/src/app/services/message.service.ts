import { AppDataSource } from '../config/data-source';
import { Conversation } from '../entities/conversation.entity';
import { ConversationMember } from '../entities/conversation-member.entity';
import { Message, MessageType } from '../entities/message.entity';
import { getPresignedImageUrl } from './file.service';
import { getConversationMembersFromCacheOrDb } from './conversation-member-cache.service';

const messageRepository = AppDataSource.getRepository(Message);
const conversationRepository = AppDataSource.getRepository(Conversation);
const conversationMemberRepository =
  AppDataSource.getRepository(ConversationMember);

const checkUserInConversation = async (
  conversationId: number,
  userId: number,
) => {
  const member = await conversationMemberRepository.findOne({
    where: {
      conversationId,
      userId,
    },
  });

  return !!member;
};

const updateConversationLastMessage = async (
  conversationId: number,
  message: Message,
) => {
  await conversationRepository.update(conversationId, {
    lastMessageId: message.id,
    lastMessageAt: message.createdAt,
  });
};

/**
 * Mark read đúng nghiệp vụ:
 * - Không gọi khi user gửi message.
 * - Chỉ gọi khi user mở/đọc conversation, ví dụ getMessagesByConversation.
 */
const markConversationAsRead = async (
  conversationId: number,
  userId: number,
) => {
  await conversationMemberRepository.update(
    {
      conversationId,
      userId,
    },
    {
      lastReadAt: new Date(),
    },
  );
};

const mapMessageResponse = async (message: Message & { sender?: any }) => {
  let imageUrl: string | null = null;

  if (message.messageType === MessageType.IMAGE && message.objectName) {
    try {
      imageUrl = await getPresignedImageUrl(message.objectName);
    } catch (error) {
      console.error(
        '[message] failed to create presigned image url:',
        message.objectName,
        error,
      );

      imageUrl = null;
    }
  }

  return {
    id: message.id,
    conversationId: message.conversationId,
    senderId: message.senderId,
    content: message.content,
    messageType: message.messageType,
    fileName: message.fileName,
    objectName: message.objectName,
    fileMimeType: message.fileMimeType,
    fileSize: message.fileSize,
    imageUrl,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
    sender: message.sender
      ? {
          id: message.sender.id,
          username: message.sender.username,
          email: message.sender.email,
          avatarUrl: message.sender.avatarUrl,
          isOnline: message.sender.isOnline,
        }
      : null,
  };
};

export const getConversationMembers = async (conversationId: number) => {
  return getConversationMembersFromCacheOrDb(conversationId);
};

export const sendMessage = async (payload: {
  conversationId: number;
  senderId: number;
  content: string;
}) => {
  const content = payload.content.trim();

  if (!content) {
    throw new Error('Message content is required');
  }

  const isMember = await checkUserInConversation(
    payload.conversationId,
    payload.senderId,
  );

  if (!isMember) {
    throw new Error('You are not a member of this conversation');
  }

  const message = messageRepository.create({
    conversationId: payload.conversationId,
    senderId: payload.senderId,
    content,
    messageType: MessageType.TEXT,
  });

  const savedMessage = await messageRepository.save(message);

  /**
   * Không update lastReadAt ở đây nữa.
   * Gửi message chỉ cần:
   * - tạo message
   * - cập nhật lastMessage của conversation
   */
  await updateConversationLastMessage(payload.conversationId, savedMessage);

  /**
   * Giữ nguyên response có sender đầy đủ để không ảnh hưởng FE.
   */
  const fullMessage = await messageRepository.findOne({
    where: { id: savedMessage.id },
    relations: {
      sender: true,
    },
  });

  if (!fullMessage) {
    throw new Error('Message not found after save');
  }

  return mapMessageResponse(fullMessage as Message & { sender?: any });
};

export const sendImageMessage = async (payload: {
  conversationId: number;
  senderId: number;
  content?: string | null;
  fileName: string;
  objectName: string;
  fileMimeType: string;
  fileSize: number;
}) => {
  const isMember = await checkUserInConversation(
    payload.conversationId,
    payload.senderId,
  );

  if (!isMember) {
    throw new Error('You are not a member of this conversation');
  }

  if (!payload.fileMimeType.startsWith('image/')) {
    throw new Error('Only image files are allowed');
  }

  const maxSize = 10 * 1024 * 1024;

  if (payload.fileSize > maxSize) {
    throw new Error('Image size must be less than 10MB');
  }

  const message = messageRepository.create({
    conversationId: payload.conversationId,
    senderId: payload.senderId,
    content: payload.content?.trim() || null,
    messageType: MessageType.IMAGE,
    fileName: payload.fileName,
    objectName: payload.objectName,
    fileMimeType: payload.fileMimeType,
    fileSize: String(payload.fileSize),
  });

  const savedMessage = await messageRepository.save(message);

  /**
   * Không update lastReadAt khi gửi ảnh.
   * Mark read sẽ được xử lý khi user đọc conversation.
   */
  await updateConversationLastMessage(payload.conversationId, savedMessage);

  const fullMessage = await messageRepository.findOne({
    where: { id: savedMessage.id },
    relations: {
      sender: true,
    },
  });

  if (!fullMessage) {
    throw new Error('Image message not found after save');
  }

  return mapMessageResponse(fullMessage as Message & { sender?: any });
};

export const getMessagesByConversation = async (
  conversationId: number,
  currentUserId: number,
) => {
  const isMember = await checkUserInConversation(conversationId, currentUserId);

  if (!isMember) {
    throw new Error('You are not a member of this conversation');
  }

  const messages = await messageRepository.find({
    where: { conversationId },
    relations: {
      sender: true,
    },
    order: {
      createdAt: 'ASC',
    },
  });

  /**
   * User đã mở conversation để đọc messages,
   * nên update lastReadAt tại đây là hợp lý hơn.
   */
  await markConversationAsRead(conversationId, currentUserId);

  return Promise.all(
    messages.map((message) =>
      mapMessageResponse(message as Message & { sender?: any }),
    ),
  );
};
