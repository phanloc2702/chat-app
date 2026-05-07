import {
  FiInfo,
  FiMessageCircle,
  FiPhone,
  FiUsers,
  FiVideo,
} from 'react-icons/fi';
import Avatar from '../../../components/Avatar';
import type { Conversation } from '../../../types/chat';

type ChatHeaderProps = {
  selectedConversation: Conversation | null;
};

const ChatHeader = ({ selectedConversation }: ChatHeaderProps) => {
  const title = selectedConversation
    ? selectedConversation.type === 'private'
      ? selectedConversation.otherUser?.username || 'Đoạn chat'
      : selectedConversation.name || 'Nhóm chat'
    : 'Messenger';

  const subtitle = selectedConversation
    ? selectedConversation.type === 'private'
      ? selectedConversation.otherUser?.isOnline
        ? 'Đang hoạt động'
        : 'Offline'
      : `${selectedConversation.memberCount || 0} thành viên`
    : 'Chọn một cuộc trò chuyện để bắt đầu';

  const avatarName = selectedConversation
    ? selectedConversation.type === 'private'
      ? selectedConversation.otherUser?.username
      : selectedConversation.name
    : 'Messenger';

  const avatarUrl =
    selectedConversation?.type === 'private'
      ? selectedConversation.otherUser?.avatarUrl
      : null;

  return (
    <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-5">
      <div className="flex min-w-0 items-center gap-3">
        {selectedConversation ? (
          <div className="relative shrink-0">
            <Avatar name={avatarName} imageUrl={avatarUrl} size="lg" />

            {selectedConversation.type === 'private' && (
              <span
                className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white ${
                  selectedConversation.otherUser?.isOnline
                    ? 'bg-emerald-500'
                    : 'bg-slate-300'
                }`}
              />
            )}

            {selectedConversation.type === 'group' && (
              <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-violet-600 text-white">
                <FiUsers size={12} />
              </span>
            )}
          </div>
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <FiMessageCircle size={24} />
          </div>
        )}

        <div className="min-w-0">
          <h2 className="truncate text-base font-extrabold text-slate-900">
            {title}
          </h2>

          <div className="mt-0.5 flex items-center gap-1.5">
            {selectedConversation?.type === 'private' && (
              <span
                className={`h-2 w-2 rounded-full ${
                  selectedConversation.otherUser?.isOnline
                    ? 'bg-emerald-500'
                    : 'bg-slate-300'
                }`}
              />
            )}

            <p className="truncate text-xs font-medium text-slate-500">
              {subtitle}
            </p>
          </div>
        </div>
      </div>

      {selectedConversation && (
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition hover:bg-blue-100"
            title="Gọi thoại"
          >
            <FiPhone size={19} />
          </button>

          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition hover:bg-blue-100"
            title="Gọi video"
          >
            <FiVideo size={19} />
          </button>

          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition hover:bg-blue-100"
            title="Thông tin đoạn chat"
          >
            <FiInfo size={20} />
          </button>
        </div>
      )}
    </header>
  );
};

export default ChatHeader;