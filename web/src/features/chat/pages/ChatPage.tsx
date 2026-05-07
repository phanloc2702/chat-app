import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  getMyConversationsApi,
  markConversationAsReadApi,
} from '../../../api/conversationApi';
import { sendImageMessageApi } from '../../../api/messageApi';
import { disconnectSocket } from '../../../socket/socket';
import { storage } from '../../../utils/storage';
import type {
  Conversation,
  Message,
  NotificationItem,
  TypingUser,
} from '../../../types/chat';

import ChatSidebar from '../components/ChatSidebar';
import ChatHeader from '../components/ChatHeader';
import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';
import NotificationDropdown from '../components/NotificationDropdown';
import CreateGroupModal from '../components/CreateGroupModal';

import { useChatData } from '../hooks/useChatData';
import {
  emitTypingStart,
  emitTypingStop,
  joinConversationRoom,
  leaveConversationRoom,
  sendTextMessageSocket,
  useChatSocket,
} from '../hooks/useChatSocket';

const SELECTED_CONVERSATION_KEY = 'selectedConversationId';

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

const buildLastMessageFromMessage = (message: Message) => {
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
    imageUrl: message.imageUrl,
    createdAt: message.createdAt,
    sender: message.sender,
  };
};

const ChatPage = () => {
  const navigate = useNavigate();
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const currentUser = useMemo(() => storage.getCurrentUser(), []);

  const [messageInput, setMessageInput] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [sendingImage, setSendingImage] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

  const {
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
    loadMessages,
    loadNotifications,

    createPrivateConversation,
    createGroupConversation,
    markNotificationAsRead,
  } = useChatData();

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  const scrollToBottom = () => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const refreshConversations = async () => {
    const response = await getMyConversationsApi();
    const data = sortConversations(response.data || []);

    setConversations(data);

    return data;
  };

  useEffect(() => {
    const initChat = async () => {
      if (!currentUser) {
        navigate('/login');
        return;
      }

      await loadUsers();
      await loadNotifications();

      const latestConversations = await refreshConversations();

      if (latestConversations.length === 0) return;

      const savedConversationId = Number(
        localStorage.getItem(SELECTED_CONVERSATION_KEY)
      );

      const targetConversation =
        latestConversations.find((item) => item.id === savedConversationId) ||
        latestConversations[0];

      setSelectedConversation({
        ...targetConversation,
        unreadCount: 0,
      });

      localStorage.setItem(
        SELECTED_CONVERSATION_KEY,
        String(targetConversation.id)
      );

      await loadMessages(targetConversation.id);
      await markConversationAsReadApi(targetConversation.id);

      joinConversationRoom(targetConversation.id);
      scrollToBottom();
    };

    initChat();
  }, [currentUser, navigate]);

  useChatSocket({
    currentUser,
    selectedConversationId: selectedConversation?.id,
    setMessages,
    setNotifications,
    setUsers,
    setConversations,
    setSelectedConversation,
    setTypingUsers,
    setError,
    scrollToBottom,
  });

  const handleLogout = () => {
    if (selectedConversation?.id) {
      leaveConversationRoom(selectedConversation.id);
    }

    localStorage.removeItem(SELECTED_CONVERSATION_KEY);
    disconnectSocket();
    storage.clearAuth();
    navigate('/login');
  };

  const handleCreatePrivateConversation = async (targetUserId: number) => {
    try {
      setError('');

      const conversation = await createPrivateConversation(targetUserId);

      if (
        selectedConversation?.id &&
        selectedConversation.id !== conversation.id
      ) {
        leaveConversationRoom(selectedConversation.id);
      }

      setSelectedConversation({
        ...conversation,
        unreadCount: 0,
      });

      localStorage.setItem(SELECTED_CONVERSATION_KEY, String(conversation.id));

      joinConversationRoom(conversation.id);
      await markConversationAsReadApi(conversation.id);
      await loadMessages(conversation.id);

      setConversations((prev) => {
        const exists = prev.some((item) => item.id === conversation.id);

        const next = exists
          ? prev.map((item) =>
              item.id === conversation.id
                ? {
                    ...conversation,
                    unreadCount: 0,
                  }
                : item
            )
          : [
              {
                ...conversation,
                unreadCount: 0,
              },
              ...prev,
            ];

        return sortConversations(next);
      });

      scrollToBottom();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Tạo cuộc trò chuyện thất bại');
    }
  };

  const handleSelectConversation = async (conversation: Conversation) => {
    try {
      setError('');

      if (selectedConversation?.id === conversation.id) return;

      if (selectedConversation?.id) {
        leaveConversationRoom(selectedConversation.id);
      }

      setSelectedConversation({
        ...conversation,
        unreadCount: 0,
      });

      localStorage.setItem(SELECTED_CONVERSATION_KEY, String(conversation.id));

      setConversations((prev) =>
        sortConversations(
          prev.map((item) =>
            item.id === conversation.id ? { ...item, unreadCount: 0 } : item
          )
        )
      );

      await loadMessages(conversation.id);
      await markConversationAsReadApi(conversation.id);

      joinConversationRoom(conversation.id);

      setTypingUsers((prev) =>
        prev.filter((item) => item.conversationId !== conversation.id)
      );

      scrollToBottom();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Mở cuộc trò chuyện thất bại');
    }
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedConversation || !currentUser) return;

    sendTextMessageSocket({
      conversationId: selectedConversation.id,
      senderId: currentUser.id,
      content: messageInput.trim(),
    });

    emitTypingStop({
      conversationId: selectedConversation.id,
      userId: currentUser.id,
      username: currentUser.username,
    });

    setMessageInput('');
  };

  const handleUploadImage = async (file: File, content?: string) => {
    if (!selectedConversation || !currentUser) return;

    try {
      setError('');
      setSendingImage(true);

      const response = await sendImageMessageApi({
        conversationId: selectedConversation.id,
        file,
        content,
      });

      const imageMessage: Message = response.data;

      setMessages((prev) => {
        const exists = prev.some((item) => item.id === imageMessage.id);
        if (exists) return prev;

        return [...prev, imageMessage];
      });

      setConversations((prev) =>
        sortConversations(
          prev.map((conversation) =>
            conversation.id === selectedConversation.id
              ? {
                  ...conversation,
                  lastMessage: buildLastMessageFromMessage(imageMessage),
                  lastMessageAt: imageMessage.createdAt,
                  unreadCount: 0,
                }
              : conversation
          )
        )
      );

      setSelectedConversation((prev) => {
        if (!prev || prev.id !== selectedConversation.id) return prev;

        return {
          ...prev,
          lastMessage: buildLastMessageFromMessage(imageMessage),
          lastMessageAt: imageMessage.createdAt,
          unreadCount: 0,
        };
      });

      emitTypingStop({
        conversationId: selectedConversation.id,
        userId: currentUser.id,
        username: currentUser.username,
      });

      setMessageInput('');
      scrollToBottom();
    } catch (err: any) {
      console.error('[FE] send image failed:', err);

      setError(err.response?.data?.message || 'Gửi ảnh thất bại');
    } finally {
      setSendingImage(false);
    }
  };

  const handleTypingStart = () => {
    if (!selectedConversation || !currentUser) return;

    emitTypingStart({
      conversationId: selectedConversation.id,
      userId: currentUser.id,
      username: currentUser.username,
    });
  };

  const handleTypingStop = () => {
    if (!selectedConversation || !currentUser) return;

    emitTypingStop({
      conversationId: selectedConversation.id,
      userId: currentUser.id,
      username: currentUser.username,
    });
  };

  const handleCreateGroup = async (payload: {
    name: string;
    memberIds: number[];
  }) => {
    if (!payload.name.trim()) {
      setError('Vui lòng nhập tên nhóm');
      return;
    }

    if (payload.memberIds.length === 0) {
      setError('Vui lòng chọn ít nhất 1 thành viên');
      return;
    }

    try {
      setError('');
      setCreatingGroup(true);

      if (selectedConversation?.id) {
        leaveConversationRoom(selectedConversation.id);
      }

      const conversation = await createGroupConversation({
        name: payload.name.trim(),
        memberIds: payload.memberIds,
      });

      setSelectedConversation({
        ...conversation,
        unreadCount: 0,
      });

      localStorage.setItem(SELECTED_CONVERSATION_KEY, String(conversation.id));

      joinConversationRoom(conversation.id);
      await markConversationAsReadApi(conversation.id);
      await loadMessages(conversation.id);

      setShowCreateGroupModal(false);
      await refreshConversations();

      scrollToBottom();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Tạo nhóm thất bại');
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleOpenNotification = async (notification: NotificationItem) => {
    try {
      if (!notification.isRead) {
        await markNotificationAsRead(notification.id);
      }

      if (notification.relatedConversationId) {
        const latestConversations = await refreshConversations();

        const target = latestConversations.find(
          (item) => item.id === notification.relatedConversationId
        );

        if (target) {
          await handleSelectConversation(target);
        }
      }

      setShowNotifications(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-white">
      <div className="flex h-full">
        <ChatSidebar
          currentUser={currentUser}
          users={users}
          conversations={conversations}
          selectedConversation={selectedConversation}
          unreadCount={unreadCount}
          onLogout={handleLogout}
          onToggleNotifications={() => setShowNotifications((prev) => !prev)}
          onOpenCreateGroupModal={() => setShowCreateGroupModal(true)}
          onCreatePrivateConversation={handleCreatePrivateConversation}
          onSelectConversation={handleSelectConversation}
        />

        <main className="relative flex min-w-0 flex-1 flex-col bg-white">
          <ChatHeader selectedConversation={selectedConversation} />

          <MessageList
            selectedConversation={selectedConversation}
            messages={messages}
            currentUser={currentUser}
            typingUsers={typingUsers}
            bottomRef={bottomRef}
          />

          {selectedConversation && (
            <MessageInput
              value={messageInput}
              error={error}
              sendingImage={sendingImage}
              onChange={setMessageInput}
              onSendMessage={handleSendMessage}
              onUploadImage={handleUploadImage}
              onTypingStart={handleTypingStart}
              onTypingStop={handleTypingStop}
            />
          )}
        </main>
      </div>

      {showNotifications && (
        <NotificationDropdown
          notifications={notifications}
          onOpenNotification={handleOpenNotification}
          onClose={() => setShowNotifications(false)}
        />
      )}

      {showCreateGroupModal && (
        <CreateGroupModal
          users={users}
          creating={creatingGroup}
          onClose={() => setShowCreateGroupModal(false)}
          onCreateGroup={handleCreateGroup}
        />
      )}
    </div>
  );
};

export default ChatPage;