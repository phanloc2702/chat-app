import type { Message } from '../../../types/chat';
import { formatTimeVN } from '../../../utils/date';

type MessageBubbleProps = {
  message: Message;
  isMine: boolean;
  showSenderName: boolean;
};

const MessageBubble = ({
  message,
  isMine,
  showSenderName,
}: MessageBubbleProps) => {
  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[70%] ${isMine ? 'items-end' : 'items-start'}`}>
        {!isMine && showSenderName && (
          <p className="mb-1 ml-3 text-xs font-semibold text-slate-500">
            {message.sender?.username || 'Người dùng'}
          </p>
        )}

        <div
          className={`group relative rounded-[22px] px-4 py-2.5 ${
            isMine
              ? 'rounded-br-md bg-blue-600 text-white'
              : 'rounded-bl-md bg-slate-100 text-slate-900'
          }`}
        >
          {message.messageType === 'image' ? (
            <div className="space-y-2">
              {message.imageUrl ? (
                <button
                  type="button"
                  onClick={() => window.open(message.imageUrl || '', '_blank')}
                  className="block overflow-hidden rounded-2xl"
                >
                  <img
                    src={message.imageUrl}
                    alt={message.fileName || 'chat-image'}
                    className="max-h-80 max-w-xs object-cover transition group-hover:scale-[1.02]"
                  />
                </button>
              ) : (
                <div
                  className={`rounded-2xl px-4 py-3 text-sm ${
                    isMine
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  Không tải được ảnh
                </div>
              )}

              {message.content && (
                <p className="whitespace-pre-wrap break-words text-sm leading-6">
                  {message.content}
                </p>
              )}
            </div>
          ) : (
            <p className="whitespace-pre-wrap break-words text-sm leading-6">
              {message.content}
            </p>
          )}
        </div>

        <p
          className={`mt-1 px-2 text-[11px] text-slate-400 ${
            isMine ? 'text-right' : 'text-left'
          }`}
        >
          {formatTimeVN(message.createdAt)}
        </p>
      </div>
    </div>
  );
};

export default MessageBubble;