import {
  FiBell,
  FiMessageCircle,
  FiUsers,
  FiX,
} from 'react-icons/fi';
import type { NotificationItem } from '../../../types/chat';
import { formatNotificationTimeVN } from '../../../utils/date';

type NotificationDropdownProps = {
  notifications: NotificationItem[];
  onOpenNotification: (notification: NotificationItem) => void;
  onClose: () => void;
};

const NotificationDropdown = ({
  notifications,
  onOpenNotification,
  onClose,
}: NotificationDropdownProps) => {
  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div
        className="absolute left-4 top-[88px] flex max-h-[520px] w-[348px] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
          <div>
            <h3 className="text-lg font-black text-slate-950">Thông báo</h3>

            <p className="mt-0.5 text-xs font-medium text-slate-500">
              Tin nhắn và hoạt động mới
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {notifications.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <FiBell size={24} />
              </div>

              <p className="font-bold text-slate-800">Chưa có thông báo</p>

              <p className="mt-1 text-sm text-slate-500">
                Tin nhắn mới sẽ hiển thị ở đây
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => onOpenNotification(notification)}
                  className={`flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition ${
                    notification.isRead
                      ? 'hover:bg-slate-50'
                      : 'bg-blue-50 hover:bg-blue-100'
                  }`}
                >
                  <div
                    className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      notification.isRead
                        ? 'bg-slate-100 text-slate-600'
                        : 'bg-blue-600 text-white'
                    }`}
                  >
                    {notification.type === 'new_message' ? (
                      <FiMessageCircle size={18} />
                    ) : (
                      <FiUsers size={18} />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`line-clamp-1 text-sm ${
                          notification.isRead
                            ? 'font-bold text-slate-800'
                            : 'font-black text-slate-950'
                        }`}
                      >
                        {notification.title}
                      </p>

                      {!notification.isRead && (
                        <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600" />
                      )}
                    </div>

                    <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-600">
                      {notification.content}
                    </p>

                    <p className="mt-1 text-xs font-semibold text-blue-600">
                      {formatNotificationTimeVN(notification.createdAt)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationDropdown;