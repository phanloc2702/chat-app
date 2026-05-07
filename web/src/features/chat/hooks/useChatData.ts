import { useState } from 'react';
import { getUsersApi } from '../../../api/userApi';
import {
  createGroupConversationApi,
  createPrivateConversationApi,
  getMyConversationsApi,
} from '../../../api/conversationApi';
import { getMessagesByConversationApi } from '../../../api/messageApi';
import {
  getMyNotificationsApi,
  markNotificationAsReadApi,
} from '../../../api/notificationApi';
import type { Conversation, Message, NotificationItem, User } from '../../../types/chat';

export const useChatData = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [error, setError] = useState('');

  const loadUsers = async () => {
    try {
      const response = await getUsersApi();
      setUsers(response.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadConversations = async () => {
    try {
      const response = await getMyConversationsApi();

      const conversationData = (response.data || []).map(
        (item: Conversation) => ({
          ...item,
          unreadCount: item.unreadCount || 0,
        })
      );

      setConversations(conversationData);
    } catch (err) {
      console.error(err);
    }
  };

  const loadMessages = async (conversationId: number) => {
    try {
      const response = await getMessagesByConversationApi(conversationId);
      setMessages(response.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadNotifications = async () => {
    try {
      const response = await getMyNotificationsApi();
      setNotifications(response.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const createPrivateConversation = async (targetUserId: number) => {
    setError('');

    const response = await createPrivateConversationApi(targetUserId);

    const conversation: Conversation = {
      ...response.data,
      unreadCount: 0,
    };

    await loadConversations();
    setSelectedConversation(conversation);
    await loadMessages(conversation.id);

    return conversation;
  };

  const createGroupConversation = async (payload: {
    name: string;
    memberIds: number[];
  }) => {
    setError('');

    const response = await createGroupConversationApi(payload);

    const conversation: Conversation = {
      ...response.data,
      unreadCount: 0,
    };

    await loadConversations();
    setSelectedConversation(conversation);
    await loadMessages(conversation.id);

    return conversation;
  };

  const markNotificationAsRead = async (notificationId: number) => {
    await markNotificationAsReadApi(notificationId);

    setNotifications((prev) =>
      prev.map((item) =>
        item.id === notificationId ? { ...item, isRead: true } : item
      )
    );
  };

  return {
    users,
    setUsers,

    conversations,
    setConversations,

    selectedConversation,
    setSelectedConversation,

    messages,
    setMessages,

    notifications,
    setNotifications,

    error,
    setError,

    loadUsers,
    loadConversations,
    loadMessages,
    loadNotifications,

    createPrivateConversation,
    createGroupConversation,
    markNotificationAsRead,
  };
};