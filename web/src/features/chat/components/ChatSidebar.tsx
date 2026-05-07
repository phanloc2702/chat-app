import { useMemo, useState } from 'react';
import {
  FiBell,
  FiLogOut,
  FiPlus,
  FiUsers,
} from 'react-icons/fi';
import Avatar from '../../../components/Avatar';
import type { Conversation, User } from '../../../types/chat';
import ConversationList from './ConversationList';

type ChatSidebarProps = {
  currentUser: User | null;
  users: User[];
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  unreadCount: number;
  onLogout: () => void;
  onToggleNotifications: () => void;
  onOpenCreateGroupModal: () => void;
  onCreatePrivateConversation: (targetUserId: number) => void;
  onSelectConversation: (conversation: Conversation) => void;
};

const ChatSidebar = ({
  currentUser,
  users,
  conversations,
  selectedConversation,
  unreadCount,
  onLogout,
  onToggleNotifications,
  onOpenCreateGroupModal,
  onCreatePrivateConversation,
  onSelectConversation,
}: ChatSidebarProps) => {
  const [showPeople, setShowPeople] = useState(true);

  const onlineUsers = useMemo(() => {
    return users.filter((user) => user.isOnline).slice(0, 12);
  }, [users]);

  const offlineUsers = useMemo(() => {
    return users.filter((user) => !user.isOnline).slice(0, 12);
  }, [users]);

  const displayUsers = onlineUsers.length > 0 ? onlineUsers : offlineUsers;

  return (
    <aside className="flex h-full w-[380px] shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-4 pb-4 pt-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar
              name={currentUser?.username || 'User'}
              imageUrl={currentUser?.avatarUrl || null}
              size="lg"
            />

            <div className="min-w-0">
              <h1 className="truncate text-2xl font-black tracking-tight text-slate-950">
                Chats
              </h1>

              <p className="truncate text-xs font-medium text-slate-500">
                {currentUser?.username || 'Người dùng'}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onToggleNotifications}
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200"
              title="Thông báo"
            >
              <FiBell size={19} />

              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white shadow-sm">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-red-50 hover:text-red-600"
              title="Đăng xuất"
            >
              <FiLogOut size={19} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onOpenCreateGroupModal}
            className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
          >
            <FiPlus size={17} />
            Tạo nhóm
          </button>

          <button
            type="button"
            onClick={() => setShowPeople((prev) => !prev)}
            className="flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
          >
            <FiUsers size={17} />
            {showPeople ? 'Ẩn bạn bè' : 'Hiện bạn bè'}
          </button>
        </div>
      </div>

      {showPeople && (
        <div className="border-b border-slate-100 px-4 py-3">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-bold text-slate-900">Người dùng</p>

            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-600">
              {onlineUsers.length} online
            </span>
          </div>

          {displayUsers.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 px-4 py-4 text-center text-sm text-slate-500">
              Chưa có người dùng khác
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {displayUsers.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => onCreatePrivateConversation(user.id)}
                  className="group w-20 shrink-0"
                  title={user.username}
                >
                  <div className="relative mx-auto h-14 w-14">
                    <Avatar
                      name={user.username}
                      imageUrl={user.avatarUrl}
                      size="lg"
                    />

                    <span
                      className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white ${
                        user.isOnline ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    />
                  </div>

                  <p className="mt-1 truncate text-center text-xs font-semibold text-slate-600 group-hover:text-blue-600">
                    {user.username}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <ConversationList
        conversations={conversations}
        selectedConversation={selectedConversation}
        onSelectConversation={onSelectConversation}
      />
    </aside>
  );
};

export default ChatSidebar;