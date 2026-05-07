import { useEffect } from 'react';
import { connectSocket, getSocket } from '../../../socket/socket';
import type {
  Conversation,
  Message,
  NotificationItem,
  TypingUser,
  User,
} from '../../../types/chat';

type UseChatSocketParams = {
  currentUser: User | null;
  selectedConversationId?: number;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setNotifications: React.Dispatch<React.SetStateAction<NotificationItem[]>>;
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  setSelectedConversation: React.Dispatch<
    React.SetStateAction<Conversation | null>
  >;
  setTypingUsers: React.Dispatch<React.SetStateAction<TypingUser[]>>;
  setError: React.Dispatch<React.SetStateAction<string>>;
  scrollToBottom: () => void;
};

const sortConversations = (items: Conversation[]) => {
  return [...items].sort((a, b) => {
    const timeA = new Date(
      a.lastMessageAt || a.updatedAt || a.createdAt
    ).getTime();

    const timeB = new Date(
      b.lastMessageAt || b.updatedAt || b.createdAt
    ).getTime();

    return timeB - timeA;
  });
};

const upsertConversation = (
  conversations: Conversation[],
  updatedConversation: Conversation
) => {
  const exists = conversations.some((item) => item.id === updatedConversation.id);

  if (!exists) {
    return sortConversations([updatedConversation, ...conversations]);
  }

  return sortConversations(
    conversations.map((item) =>
      item.id === updatedConversation.id ? updatedConversation : item
    )
  );
};

export const useChatSocket = ({
  currentUser,
  selectedConversationId,
  setMessages,
  setNotifications,
  setUsers,
  setConversations,
  setSelectedConversation,
  setTypingUsers,
  setError,
  scrollToBottom,
}: UseChatSocketParams) => {
  useEffect(() => {
    if (!currentUser) return;

    const socket = connectSocket();

    socket.on('connect', () => {
      socket.emit('join_user_room', currentUser.id);
      socket.emit('user_connected', currentUser.id);
    });

    socket.on('receive_message', (message: Message) => {
      if (selectedConversationId === message.conversationId) {
        setMessages((prev) => {
          const exists = prev.some((item) => item.id === message.id);
          if (exists) return prev;

          return [...prev, message];
        });

        setTypingUsers((prev) =>
          prev.filter(
            (item) =>
              !(
                item.conversationId === message.conversationId &&
                item.userId === message.senderId
              )
          )
        );

        scrollToBottom();
      }
    });

    socket.on('conversation_updated', (conversation: Conversation) => {
      setConversations((prev) => upsertConversation(prev, conversation));

      setSelectedConversation((prev) => {
        if (!prev || prev.id !== conversation.id) return prev;

        return {
          ...prev,
          ...conversation,
          unreadCount: 0,
        };
      });
    });

    socket.on('new_notification', (notification: NotificationItem) => {
      setNotifications((prev) => {
        const exists = prev.some((item) => item.id === notification.id);
        if (exists) return prev;

        return [notification, ...prev];
      });
    });

    socket.on('conversation_added', (conversation: Conversation) => {
      setConversations((prev) => upsertConversation(prev, conversation));
    });

    socket.on('user_typing', (payload: TypingUser) => {
      if (payload.userId === currentUser.id) return;

      setTypingUsers((prev) => {
        const withoutCurrent = prev.filter(
          (item) =>
            !(
              item.conversationId === payload.conversationId &&
              item.userId === payload.userId
            )
        );

        if (!payload.isTyping) {
          return withoutCurrent;
        }

        return [...withoutCurrent, payload];
      });
    });

    socket.on(
      'user_status_changed',
      (payload: { userId: number; isOnline: boolean }) => {
        setUsers((prev) =>
          prev.map((user) =>
            user.id === payload.userId
              ? { ...user, isOnline: payload.isOnline }
              : user
          )
        );

        setConversations((prev) =>
          prev.map((conversation) => {
            if (
              conversation.type === 'private' &&
              conversation.otherUser?.id === payload.userId
            ) {
              return {
                ...conversation,
                otherUser: {
                  ...conversation.otherUser,
                  isOnline: payload.isOnline,
                },
              };
            }

            return conversation;
          })
        );

        setSelectedConversation((prev) => {
          if (
            prev &&
            prev.type === 'private' &&
            prev.otherUser?.id === payload.userId
          ) {
            return {
              ...prev,
              otherUser: {
                ...prev.otherUser,
                isOnline: payload.isOnline,
              },
            };
          }

          return prev;
        });
      }
    );

    socket.on('message_error', (payload: { message: string }) => {
      setError(payload.message);
    });

    return () => {
      socket.off('connect');
      socket.off('receive_message');
      socket.off('conversation_updated');
      socket.off('new_notification');
      socket.off('conversation_added');
      socket.off('user_typing');
      socket.off('user_status_changed');
      socket.off('message_error');
    };
  }, [currentUser, selectedConversationId]);
};

export const joinConversationRoom = (conversationId: number) => {
  const socket = getSocket();
  socket?.emit('join_conversation', conversationId);
};

export const leaveConversationRoom = (conversationId: number) => {
  const socket = getSocket();
  socket?.emit('leave_conversation', conversationId);
};

export const sendTextMessageSocket = (payload: {
  conversationId: number;
  senderId: number;
  content: string;
}) => {
  const socket = getSocket();
  socket?.emit('send_message', payload);
};

export const emitTypingStart = (payload: {
  conversationId: number;
  userId: number;
  username?: string;
}) => {
  const socket = getSocket();
  socket?.emit('typing_start', payload);
};

export const emitTypingStop = (payload: {
  conversationId: number;
  userId: number;
  username?: string;
}) => {
  const socket = getSocket();
  socket?.emit('typing_stop', payload);
};