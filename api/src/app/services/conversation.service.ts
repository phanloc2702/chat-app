import { In } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { Conversation, ConversationType } from '../entities/conversation.entity';
import { ConversationMember } from '../entities/conversation-member.entity';
import { User } from '../entities/user.entity';
import { Message } from '../entities/message.entity';
import * as notificationService from './notification.service';
import { NotificationType } from '../entities/notification.entity';
import { getIo } from '../config/socket';
import { invalidateConversationMembersCache } from './conversation-member-cache.service';

const conversationRepository = AppDataSource.getRepository(Conversation);
const conversationMemberRepository =
  AppDataSource.getRepository(ConversationMember);
const userRepository = AppDataSource.getRepository(User);
const messageRepository = AppDataSource.getRepository(Message);

const formatLastMessage = (message: Message | null) => {
  if (!message) return null;

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
    createdAt: message.createdAt,
    sender: message.sender
      ? {
          id: message.sender.id,
          username: message.sender.username,
          email: message.sender.email,
          avatarUrl: message.sender.avatarUrl,
        }
      : null,
  };
};

const countUnreadMessages = async (
  conversationId: number,
  currentUserId: number
) => {
  const member = await conversationMemberRepository.findOne({
    where: {
      conversationId,
      userId: currentUserId,
    },
  });

  if (!member) return 0;

  const query = messageRepository
    .createQueryBuilder('message')
    .where('message.conversationId = :conversationId', { conversationId })
    .andWhere('message.senderId != :currentUserId', { currentUserId });

  if (member.lastReadAt) {
    query.andWhere('message.createdAt > :lastReadAt', {
      lastReadAt: member.lastReadAt,
    });
  }

  return query.getCount();
};

export const getConversationDetailForUser = async (
  conversationId: number,
  currentUserId: number
) => {
  const conversation = await conversationRepository
    .createQueryBuilder('conversation')
    .leftJoinAndSelect('conversation.members', 'allMembers')
    .leftJoinAndSelect('allMembers.user', 'memberUser')
    .leftJoinAndSelect('conversation.lastMessage', 'lastMessage')
    .leftJoinAndSelect('lastMessage.sender', 'lastMessageSender')
    .where('conversation.id = :conversationId', { conversationId })
    .getOne();

  if (!conversation) {
    throw new Error('Conversation not found');
  }

  const currentMember = conversation.members.find(
    (member) => member.userId === currentUserId
  );

  if (!currentMember) {
    throw new Error('You are not a member of this conversation');
  }

  const unreadCount = await countUnreadMessages(conversation.id, currentUserId);

  if (conversation.type === ConversationType.PRIVATE) {
    const otherMember = conversation.members.find(
      (member) => member.userId !== currentUserId
    );

    return {
      id: conversation.id,
      type: conversation.type,
      name: conversation.name,
      createdById: conversation.createdById,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      lastMessageAt: conversation.lastMessageAt,
      lastMessage: formatLastMessage(conversation.lastMessage),
      unreadCount,
      memberCount: conversation.members.length,
      otherUser: otherMember?.user
        ? {
            id: otherMember.user.id,
            username: otherMember.user.username,
            email: otherMember.user.email,
            avatarUrl: otherMember.user.avatarUrl,
            isOnline: otherMember.user.isOnline,
          }
        : null,
    };
  }

  return {
    id: conversation.id,
    type: conversation.type,
    name: conversation.name,
    createdById: conversation.createdById,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    lastMessageAt: conversation.lastMessageAt,
    lastMessage: formatLastMessage(conversation.lastMessage),
    unreadCount,
    memberCount: conversation.members.length,
  };
};

export const createPrivateConversation = async (
  currentUserId: number,
  targetUserId: number
) => {
  if (currentUserId === targetUserId) {
    throw new Error('You cannot create a private conversation with yourself');
  }

  const targetUser = await userRepository.findOne({
    where: { id: targetUserId },
  });

  if (!targetUser) {
    throw new Error('Target user not found');
  }

  const existingConversation = await conversationRepository
    .createQueryBuilder('conversation')
    .innerJoin('conversation.members', 'member1')
    .innerJoin('conversation.members', 'member2')
    .where('conversation.type = :type', { type: ConversationType.PRIVATE })
    .andWhere('member1.userId = :currentUserId', { currentUserId })
    .andWhere('member2.userId = :targetUserId', { targetUserId })
    .getOne();

  if (existingConversation) {
    return getConversationDetailForUser(existingConversation.id, currentUserId);
  }

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const conversation = queryRunner.manager.create(Conversation, {
      type: ConversationType.PRIVATE,
      name: null,
      createdById: currentUserId,
      lastMessageId: null,
      lastMessageAt: null,
    });

    const savedConversation = await queryRunner.manager.save(conversation);

    const member1 = queryRunner.manager.create(ConversationMember, {
      conversationId: savedConversation.id,
      userId: currentUserId,
      lastReadAt: new Date(),
    });

    const member2 = queryRunner.manager.create(ConversationMember, {
      conversationId: savedConversation.id,
      userId: targetUserId,
      lastReadAt: null,
    });

   await queryRunner.manager.save([member1, member2]);

  await queryRunner.commitTransaction();

  await invalidateConversationMembersCache(savedConversation.id);

  return getConversationDetailForUser(savedConversation.id, currentUserId);
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
};

export const createGroupConversation = async (
  currentUserId: number,
  name: string,
  memberIds: number[]
) => {
  const uniqueMemberIds = [...new Set(memberIds.map(Number))].filter(
    (id) => id !== currentUserId
  );

  if (!name.trim()) {
    throw new Error('Group name is required');
  }

  if (uniqueMemberIds.length === 0) {
    throw new Error('Please select at least 1 member');
  }

  const allIds = [currentUserId, ...uniqueMemberIds];

  const users = await userRepository.find({
    where: {
      id: In(allIds),
    },
  });

  if (users.length !== allIds.length) {
    throw new Error('One or more users not found');
  }

  const creator = users.find((user) => user.id === currentUserId);

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const conversation = queryRunner.manager.create(Conversation, {
      type: ConversationType.GROUP,
      name: name.trim(),
      createdById: currentUserId,
      lastMessageId: null,
      lastMessageAt: null,
    });

    const savedConversation = await queryRunner.manager.save(conversation);

    const members = allIds.map((userId) =>
      queryRunner.manager.create(ConversationMember, {
        conversationId: savedConversation.id,
        userId,
        lastReadAt: userId === currentUserId ? new Date() : null,
      })
    );

    await queryRunner.manager.save(members);

    await queryRunner.commitTransaction();

    await invalidateConversationMembersCache(savedConversation.id);

    const io = getIo();

    for (const memberId of uniqueMemberIds) {
      const notification = await notificationService.createNotification({
        userId: memberId,
        type: NotificationType.ADDED_TO_GROUP,
        title: 'Bạn được thêm vào nhóm',
        content: `${creator?.username || 'Một người dùng'} đã thêm bạn vào nhóm "${savedConversation.name}"`,
        relatedConversationId: savedConversation.id,
      });

      const conversationPayload = await getConversationDetailForUser(
        savedConversation.id,
        memberId
      );

      io.to(`user_${memberId}`).emit('new_notification', notification);
      io.to(`user_${memberId}`).emit('conversation_added', conversationPayload);
    }

    return getConversationDetailForUser(savedConversation.id, currentUserId);
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
};

export const getMyConversations = async (currentUserId: number) => {
  const conversations = await conversationRepository
    .createQueryBuilder('conversation')
    .innerJoin('conversation.members', 'currentMember')
    .leftJoinAndSelect('conversation.members', 'allMembers')
    .leftJoinAndSelect('allMembers.user', 'memberUser')
    .leftJoinAndSelect('conversation.lastMessage', 'lastMessage')
    .leftJoinAndSelect('lastMessage.sender', 'lastMessageSender')
    .where('currentMember.userId = :currentUserId', { currentUserId })
    .orderBy('conversation.lastMessageAt', 'DESC', 'NULLS LAST')
    .addOrderBy('conversation.updatedAt', 'DESC')
    .getMany();

  const result = [];

  for (const conversation of conversations) {
    const unreadCount = await countUnreadMessages(
      conversation.id,
      currentUserId
    );

    if (conversation.type === ConversationType.PRIVATE) {
      const otherMember = conversation.members.find(
        (member) => member.userId !== currentUserId
      );

      result.push({
        id: conversation.id,
        type: conversation.type,
        name: conversation.name,
        createdById: conversation.createdById,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        lastMessageAt: conversation.lastMessageAt,
        lastMessage: formatLastMessage(conversation.lastMessage),
        unreadCount,
        memberCount: conversation.members.length,
        otherUser: otherMember?.user
          ? {
              id: otherMember.user.id,
              username: otherMember.user.username,
              email: otherMember.user.email,
              avatarUrl: otherMember.user.avatarUrl,
              isOnline: otherMember.user.isOnline,
            }
          : null,
      });

      continue;
    }

    result.push({
      id: conversation.id,
      type: conversation.type,
      name: conversation.name,
      createdById: conversation.createdById,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      lastMessageAt: conversation.lastMessageAt,
      lastMessage: formatLastMessage(conversation.lastMessage),
      unreadCount,
      memberCount: conversation.members.length,
    });
  }

  return result;
};

export const markConversationAsRead = async (
  conversationId: number,
  currentUserId: number
) => {
  const member = await conversationMemberRepository.findOne({
    where: {
      conversationId,
      userId: currentUserId,
    },
  });

  if (!member) {
    throw new Error('You are not a member of this conversation');
  }

  member.lastReadAt = new Date();

  await conversationMemberRepository.save(member);

  return {
    conversationId,
    userId: currentUserId,
    lastReadAt: member.lastReadAt,
    unreadCount: 0,
  };
};