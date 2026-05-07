import { useMemo, useState } from 'react';
import { FiUsers } from 'react-icons/fi';
import Avatar from '../../../components/Avatar';
import type { Conversation } from '../../../types/chat';
import { formatConversationTimeVN } from '../../../utils/date';

type ConversationListProps = {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  onSelectConversation: (conversation: Conversation) => void;
};

type FilterType = 'all' | 'unread' | 'group';

const getConversationTitle = (conversation: Conversation) => {
  if (conversation.type === 'private') {
    return conversation.otherUser?.username || `Chat #${conversation.id}`;
  }

  return conversation.name || `Nhóm #${conversation.id}`;
};

const getLastMessagePreview = (conversation: Conversation) => {
  const lastMessage = conversation.lastMessage;

  if (!lastMessage) {
    return conversation.type === 'group'
      ? `${conversation.memberCount || 0} thành viên`
      : conversation.otherUser?.email || 'Bắt đầu trò chuyện';
  }

  const senderPrefix =
    conversation.type === 'group' && lastMessage.sender?.username
      ? `${lastMessage.sender.username}: `
      : '';

  if (lastMessage.messageType === 'image') {
    return `${senderPrefix}Đã gửi một ảnh`;
  }

  return `${senderPrefix}${lastMessage.content || ''}`;
};

const ConversationList = ({
  conversations,
  selectedConversation,
  onSelectConversation,
}: ConversationListProps) => {
  const [keyword, setKeyword] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredConversations = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return conversations.filter((conversation) => {
      const title = getConversationTitle(conversation).toLowerCase();
      const preview = getLastMessagePreview(conversation).toLowerCase();

      const matchKeyword =
        !normalizedKeyword ||
        title.includes(normalizedKeyword) ||
        preview.includes(normalizedKeyword);

      const matchFilter =
        filter === 'all' ||
        (filter === 'unread' && (conversation.unreadCount || 0) > 0) ||
        (filter === 'group' && conversation.type === 'group');

      return matchKeyword && matchFilter;
    });
  }, [conversations, keyword, filter]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-slate-100 px-4 pb-4 pt-3">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Chats</h2>

          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
            {conversations.length}
          </span>
        </div>

        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Tìm kiếm trên Messenger"
          className="w-full rounded-full border border-transparent bg-slate-100 px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
        />

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
              filter === 'all'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tất cả
          </button>

          <button
            type="button"
            onClick={() => setFilter('unread')}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
              filter === 'unread'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Chưa đọc
          </button>

          <button
            type="button"
            onClick={() => setFilter('group')}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
              filter === 'group'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Nhóm
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {filteredConversations.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-slate-500">
            Không tìm thấy cuộc trò chuyện nào
          </div>
        ) : (
          <div className="space-y-1">
            {filteredConversations.map((conversation) => {
              const isActive = selectedConversation?.id === conversation.id;
              const title = getConversationTitle(conversation);
              const preview = getLastMessagePreview(conversation);
              const timeText = formatConversationTimeVN(
                conversation.lastMessageAt || conversation.updatedAt
              );
              const unreadCount = conversation.unreadCount || 0;

              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => onSelectConversation(conversation)}
                  className={`group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${
                    isActive ? 'bg-blue-50' : 'hover:bg-slate-100'
                  }`}
                >
                  <div className="relative shrink-0">
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
                      size="lg"
                    />

                    {conversation.type === 'private' && (
                      <span
                        className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white ${
                          conversation.otherUser?.isOnline
                            ? 'bg-emerald-500'
                            : 'bg-slate-300'
                        }`}
                      />
                    )}

                    {conversation.type === 'group' && (
                      <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-violet-600 text-white">
                        <FiUsers size={12} />
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={`truncate text-sm ${
                          unreadCount > 0
                            ? 'font-extrabold text-slate-950'
                            : 'font-semibold text-slate-800'
                        }`}
                      >
                        {title}
                      </p>

                      <span
                        className={`shrink-0 text-xs ${
                          unreadCount > 0
                            ? 'font-bold text-blue-600'
                            : 'text-slate-400'
                        }`}
                      >
                        {timeText}
                      </span>
                    </div>

                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <p
                        className={`truncate text-sm ${
                          unreadCount > 0
                            ? 'font-bold text-slate-800'
                            : 'text-slate-500'
                        }`}
                      >
                        {preview}
                      </p>

                      {unreadCount > 0 && (
                        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 px-1.5 text-xs font-bold text-white">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationList;