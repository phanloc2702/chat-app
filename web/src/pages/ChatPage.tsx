import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../components/Avatar';
import { getUsersApi } from '../api/userApi';
import {
  createGroupConversationApi,
  createPrivateConversationApi,
  getMyConversationsApi,
} from '../api/conversationApi';
import {
  getMessagesByConversationApi,
  sendImageMessageApi,
} from '../api/messageApi';
import {
  getMyNotificationsApi,
  markNotificationAsReadApi,
} from '../api/notificationApi';
import { connectSocket, disconnectSocket, getSocket } from '../socket/socket';
import { Conversation, Message, NotificationItem, User } from '../types/chat';
import { storage } from '../utils/storage';

const ChatPage = () => {
  const navigate = useNavigate();
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const currentUser = useMemo(() => storage.getCurrentUser(), []);

  const [users, setUsers] = useState<User[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [error, setError] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [sendingImage, setSendingImage] = useState(false);

  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);
  const [creatingGroup, setCreatingGroup] = useState(false);

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  const scrollToBottom = () => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

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
      scrollToBottom();
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

  const handleLogout = () => {
    disconnectSocket();
    storage.clearAuth();
    navigate('/login');
  };

  const handleCreatePrivateConversation = async (targetUserId: number) => {
    try {
      setError('');
      const response = await createPrivateConversationApi(targetUserId);
      const conversation = response.data;

      await loadConversations();
      setSelectedConversation({
        ...conversation,
        unreadCount: 0,
      });
      await loadMessages(conversation.id);

      const socket = getSocket();
      socket?.emit('join_conversation', conversation.id);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Tạo cuộc trò chuyện thất bại');
    }
  };

  const handleSelectConversation = async (conversation: Conversation) => {
    if (selectedConversation?.id === conversation.id) return;

    const socket = getSocket();

    if (selectedConversation?.id) {
      socket?.emit('leave_conversation', selectedConversation.id);
    }

    setSelectedConversation(conversation);
    setConversations((prev) =>
      prev.map((item) =>
        item.id === conversation.id ? { ...item, unreadCount: 0 } : item
      )
    );
    await loadMessages(conversation.id);
    socket?.emit('join_conversation', conversation.id);
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation || !currentUser) return;

    const socket = getSocket();

    socket?.emit('send_message', {
      conversationId: selectedConversation.id,
      senderId: currentUser.id,
      content: messageInput.trim(),
    });

    setMessageInput('');
  };

  const handleChooseImage = () => {
    fileInputRef.current?.click();
  };

  const handleUploadImage = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file || !selectedConversation) return;

    try {
      setError('');
      setSendingImage(true);

      await sendImageMessageApi({
        conversationId: selectedConversation.id,
        file,
      });

      e.target.value = '';
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gửi ảnh thất bại');
    } finally {
      setSendingImage(false);
    }
  };

  const handleToggleMember = (userId: number) => {
    setSelectedMemberIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const resetGroupForm = () => {
    setGroupName('');
    setSelectedMemberIds([]);
    setShowCreateGroupModal(false);
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setError('Vui lòng nhập tên nhóm');
      return;
    }

    if (selectedMemberIds.length === 0) {
      setError('Vui lòng chọn ít nhất 1 thành viên');
      return;
    }

    try {
      setError('');
      setCreatingGroup(true);

      const response = await createGroupConversationApi({
        name: groupName.trim(),
        memberIds: selectedMemberIds,
      });

      const conversation = {
        ...response.data,
        unreadCount: 0,
      };

      await loadConversations();

      const socket = getSocket();
      if (selectedConversation?.id) {
        socket?.emit('leave_conversation', selectedConversation.id);
      }

      setSelectedConversation(conversation);
      await loadMessages(conversation.id);
      socket?.emit('join_conversation', conversation.id);

      resetGroupForm();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Tạo nhóm thất bại');
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleOpenNotification = async (notification: NotificationItem) => {
    try {
      if (!notification.isRead) {
        await markNotificationAsReadApi(notification.id);
        setNotifications((prev) =>
          prev.map((item) =>
            item.id === notification.id ? { ...item, isRead: true } : item
          )
        );
      }

      if (notification.relatedConversationId) {
        const response = await getMyConversationsApi();
        const latestConversations = (response.data || []).map(
          (item: Conversation) => ({
            ...item,
            unreadCount:
              item.id === notification.relatedConversationId
                ? 0
                : item.unreadCount || 0,
          })
        );
        setConversations(latestConversations);

        const target = latestConversations.find(
          (item: Conversation) => item.id === notification.relatedConversationId
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

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    loadUsers();
    loadConversations();
    loadNotifications();

    const socket = connectSocket();

    socket.on('connect', () => {
      socket.emit('join_user_room', currentUser.id);
      socket.emit('user_connected', currentUser.id);
    });

    socket.on('receive_message', (message: Message) => {
      if (selectedConversation?.id === message.conversationId) {
        setMessages((prev) => {
          const exists = prev.some((item) => item.id === message.id);
          if (exists) return prev;
          return [...prev, message];
        });
      }

      loadConversations();
      scrollToBottom();
    });

    socket.on('new_notification', (notification: NotificationItem) => {
      setNotifications((prev) => [notification, ...prev]);

      if (notification.relatedConversationId) {
        setConversations((prev) =>
          prev.map((conversation) =>
            conversation.id === notification.relatedConversationId
              ? {
                  ...conversation,
                  unreadCount: (conversation.unreadCount || 0) + 1,
                }
              : conversation
          )
        );
      }

      loadConversations();
    });

    socket.on('conversation_added', async () => {
      await loadConversations();
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
      socket.off('new_notification');
      socket.off('conversation_added');
      socket.off('user_status_changed');
      socket.off('message_error');
    };
  }, [currentUser, navigate, selectedConversation?.id]);

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-sky-50 to-indigo-100">
      <div className="flex h-full">
        <aside className="flex w-80 flex-col border-r border-white/40 bg-white/80 backdrop-blur-xl">
          <div className="border-b border-slate-200/70 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-4 text-white">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-xl font-bold tracking-tight">Chat App</h1>
                <p className="truncate text-sm text-blue-100">
                  {currentUser?.username}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowNotifications((prev) => !prev)}
                  className="relative rounded-xl bg-white/20 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/30"
                >
                  Chuông
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-xs text-white shadow">
                      {unreadCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={handleLogout}
                  className="rounded-xl bg-rose-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-rose-600"
                >
                  Thoát
                </button>
              </div>
            </div>
          </div>

          <div className="border-b border-slate-200/70 p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
                Người dùng
              </h2>
              <button
                onClick={() => setShowCreateGroupModal(true)}
                className="rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:opacity-90"
              >
                + Tạo nhóm
              </button>
            </div>

            <div className="space-y-2">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleCreatePrivateConversation(user.id)}
                  className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative">
                      <Avatar
                        name={user.username}
                        imageUrl={user.avatarUrl}
                        size="md"
                      />
                      <span
                        className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
                          user.isOnline ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                      />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-800">
                        {user.username}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                    Chat
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
              Cuộc trò chuyện
            </h2>

            <div className="space-y-3">
              {conversations.map((conversation) => {
                const isActive = selectedConversation?.id === conversation.id;

                const title =
                  conversation.type === 'private'
                    ? conversation.otherUser?.username || `Chat #${conversation.id}`
                    : conversation.name || `Nhóm #${conversation.id}`;

                const subtitle =
                  conversation.type === 'private'
                    ? conversation.otherUser?.isOnline
                      ? 'Đang hoạt động'
                      : conversation.otherUser?.email || 'Offline'
                    : `${conversation.memberCount || 0} thành viên`;

                return (
                  <button
                    key={conversation.id}
                    onClick={() => handleSelectConversation(conversation)}
                    className={`w-full rounded-2xl border px-4 py-3 text-left shadow-sm transition ${
                      isActive
                        ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 ring-2 ring-blue-100'
                        : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-blue-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={
                          conversation.type === 'private'
                            ? conversation.otherUser?.username
                            : conversation.name
                        }
                        imageUrl={
                          conversation.type === 'private'
                            ? conversation.otherUser?.avatarUrl
                            : null
                        }
                        size="md"
                      />

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-slate-800">
                          {title}
                        </p>
                        <p className="mt-1 truncate text-sm text-slate-500">
                          {subtitle}
                        </p>
                      </div>

                      {(conversation.unreadCount || 0) > 0 && (
                        <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-rose-500 px-2 text-xs font-bold text-white shadow">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        <main className="relative flex flex-1 flex-col">
          <div className="border-b border-white/50 bg-white/70 px-6 py-4 backdrop-blur-xl">
            {selectedConversation ? (
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar
                    name={
                      selectedConversation.type === 'private'
                        ? selectedConversation.otherUser?.username
                        : selectedConversation.name
                    }
                    imageUrl={
                      selectedConversation.type === 'private'
                        ? selectedConversation.otherUser?.avatarUrl
                        : null
                    }
                    size="lg"
                  />

                  {selectedConversation.type === 'private' && (
                    <span
                      className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white ${
                        selectedConversation.otherUser?.isOnline
                          ? 'bg-emerald-500'
                          : 'bg-slate-300'
                      }`}
                    />
                  )}
                </div>

                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    {selectedConversation.type === 'private'
                      ? selectedConversation.otherUser?.username || 'Đoạn chat'
                      : selectedConversation.name || 'Nhóm chat'}
                  </h2>

                  {selectedConversation.type === 'private' ? (
                    <p className="mt-1 text-sm text-slate-500">
                      {selectedConversation.otherUser?.isOnline
                        ? 'Đang hoạt động'
                        : 'Offline'}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-slate-500">
                      {selectedConversation.memberCount || 0} thành viên
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <h2 className="text-xl font-bold text-slate-800">
                Chọn một cuộc trò chuyện
              </h2>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {!selectedConversation ? (
              <div className="flex h-full items-center justify-center">
                <div className="rounded-3xl border border-white/60 bg-white/70 px-10 py-12 text-center shadow-lg backdrop-blur">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-violet-500 text-2xl text-white shadow-md">
                    💬
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">
                    Chọn một cuộc trò chuyện
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Hãy chọn user hoặc tạo group để bắt đầu nhắn tin realtime
                  </p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <div className="rounded-3xl border border-white/60 bg-white/70 px-8 py-10 text-center shadow-lg backdrop-blur">
                  <div className="mx-auto mb-4 text-4xl">✨</div>
                  <p className="font-semibold text-slate-700">
                    Chưa có tin nhắn nào
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Gửi tin nhắn hoặc ảnh đầu tiên để bắt đầu cuộc trò chuyện
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => {
                  const isMine = message.senderId === currentUser?.id;

                  return (
                    <div
                      key={message.id}
                      className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-md rounded-3xl px-4 py-3 shadow-md ${
                          isMine
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                            : 'border border-white/60 bg-white/80 text-slate-800 backdrop-blur'
                        }`}
                      >
                        {!isMine && (
                          <p className="mb-1 text-xs font-semibold text-blue-600">
                            {message.sender?.username}
                          </p>
                        )}

                        {message.messageType === 'image' && message.imageUrl ? (
                          <div className="space-y-2">
                            <img
                              src={message.imageUrl}
                              alt={message.fileName || 'chat-image'}
                              className="max-w-xs rounded-2xl"
                            />
                            {message.content && (
                              <p className="break-words text-sm leading-6">
                                {message.content}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="break-words text-sm leading-6">
                            {message.content}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {selectedConversation && (
            <div className="border-t border-white/50 bg-white/70 p-4 backdrop-blur-xl">
              {error && (
                <div className="mb-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleUploadImage}
                />

                <button
                  onClick={handleChooseImage}
                  disabled={sendingImage}
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-3 font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  {sendingImage ? 'Đang gửi ảnh...' : 'Ảnh'}
                </button>

                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSendMessage();
                    }
                  }}
                />
                <button
                  onClick={handleSendMessage}
                  className="rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:opacity-90"
                >
                  Gửi
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {showNotifications && (
        <div className="fixed right-6 top-20 z-50 max-h-96 w-96 overflow-y-auto rounded-3xl border border-white/50 bg-white/95 shadow-2xl backdrop-blur-xl">
          <div className="sticky top-0 rounded-t-3xl border-b border-slate-200 bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-3 text-white">
            <h3 className="font-semibold">Thông báo</h3>
          </div>

          <div className="p-3">
            {notifications.length === 0 ? (
              <p className="px-3 py-4 text-sm text-slate-500">
                Chưa có thông báo
              </p>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleOpenNotification(notification)}
                  className={`mb-2 w-full rounded-2xl px-4 py-3 text-left transition ${
                    notification.isRead
                      ? 'bg-slate-50 hover:bg-slate-100'
                      : 'bg-gradient-to-r from-blue-50 to-violet-50 hover:from-blue-100 hover:to-violet-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800">
                        {notification.title}
                      </p>
                      <p className="mt-1 break-words text-sm text-slate-600">
                        {notification.content}
                      </p>
                    </div>

                    {!notification.isRead && (
                      <span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-500" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {showCreateGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-white/40 bg-white/95 p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800">Tạo nhóm chat</h3>
              <button
                onClick={resetGroupForm}
                className="rounded-xl bg-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-300"
              >
                Đóng
              </button>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Tên nhóm
              </label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Nhập tên nhóm"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Chọn thành viên
              </label>

              <div className="max-h-72 space-y-2 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-3">
                {users.map((user) => {
                  const checked = selectedMemberIds.includes(user.id);

                  return (
                    <label
                      key={user.id}
                      className="flex cursor-pointer items-center gap-3 rounded-xl bg-white px-3 py-3 shadow-sm transition hover:bg-blue-50"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleToggleMember(user.id)}
                        className="h-4 w-4"
                      />
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="relative">
                          <Avatar
                            name={user.username}
                            imageUrl={user.avatarUrl}
                            size="md"
                          />
                          <span
                            className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
                              user.isOnline ? 'bg-emerald-500' : 'bg-slate-300'
                            }`}
                          />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-800">
                            {user.username}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={resetGroupForm}
                className="rounded-2xl bg-slate-200 px-4 py-3 font-medium text-slate-700 hover:bg-slate-300"
              >
                Hủy
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={creatingGroup}
                className="rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-70"
              >
                {creatingGroup ? 'Đang tạo...' : 'Tạo nhóm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;