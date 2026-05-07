import type { RefObject } from 'react';
import { FiMessageCircle } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi2';
import type {
  Conversation,
  Message,
  TypingUser,
  User,
} from '../../../types/chat';
import {
  formatDateSeparatorVN,
  isDifferentDayVN,
} from '../../../utils/date';
import MessageBubble from './MessageBubble';

type MessageListProps = {
  selectedConversation: Conversation | null;
  messages: Message[];
  currentUser: User | null;
  typingUsers: TypingUser[];
  bottomRef: RefObject<HTMLDivElement | null>;
};

const MessageList = ({
  selectedConversation,
  messages,
  currentUser,
  typingUsers,
  bottomRef,
}: MessageListProps) => {
  const activeTypingUsers = typingUsers.filter(
    (item) =>
      item.conversationId === selectedConversation?.id &&
      item.userId !== currentUser?.id &&
      item.isTyping
  );

  return (
    <div className="flex-1 overflow-y-auto bg-white px-6 py-5">
      {!selectedConversation ? (
        <div className="flex h-full items-center justify-center">
          <div className="max-w-sm text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <FiMessageCircle size={36} />
            </div>

            <h3 className="text-2xl font-bold text-slate-900">
              Chọn một cuộc trò chuyện
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Chọn một người dùng hoặc nhóm để bắt đầu nhắn tin realtime.
            </p>
          </div>
        </div>
      ) : messages.length === 0 ? (
        <div className="flex h-full items-center justify-center">
          <div className="max-w-sm text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <HiSparkles size={38} />
            </div>

            <h3 className="text-xl font-bold text-slate-900">
              Chưa có tin nhắn nào
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Gửi tin nhắn hoặc ảnh đầu tiên để bắt đầu cuộc trò chuyện.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {messages.map((message, index) => {
            const previousMessage = messages[index - 1];

            const showDateSeparator = isDifferentDayVN(
              previousMessage?.createdAt,
              message.createdAt
            );

            const isMine = message.senderId === currentUser?.id;

            const showSenderName =
              !isMine &&
              selectedConversation.type === 'group' &&
              previousMessage?.senderId !== message.senderId;

            return (
              <div key={message.id}>
                {showDateSeparator && (
                  <div className="my-5 flex justify-center">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                      {formatDateSeparatorVN(message.createdAt)}
                    </span>
                  </div>
                )}

                <MessageBubble
                  message={message}
                  isMine={isMine}
                  showSenderName={showSenderName}
                />
              </div>
            );
          })}

          {activeTypingUsers.length > 0 && (
            <div className="flex justify-start">
              <div className="rounded-[22px] rounded-bl-md bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-500">
                {activeTypingUsers[0].username || 'Ai đó'} đang nhập
                <span className="ml-1 inline-flex gap-0.5">
                  <span>•</span>
                  <span>•</span>
                  <span>•</span>
                </span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
};

export default MessageList;