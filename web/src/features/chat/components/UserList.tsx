import Avatar from '../../../components/Avatar';
import type { User } from '../../../types/chat';

type UserListProps = {
  users: User[];
  onCreatePrivateConversation: (targetUserId: number) => void;
  onOpenCreateGroupModal: () => void;
};

const UserList = ({
  users,
  onCreatePrivateConversation,
  onOpenCreateGroupModal,
}: UserListProps) => {
  return (
    <div className="border-b border-slate-200/70 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
          Người dùng
        </h2>

        <button
          onClick={onOpenCreateGroupModal}
          className="rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:opacity-90"
        >
          + Tạo nhóm
        </button>
      </div>

      <div className="space-y-2">
        {users.map((user) => (
          <button
            key={user.id}
            onClick={() => onCreatePrivateConversation(user.id)}
            className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative">
                <Avatar name={user.username} imageUrl={user.avatarUrl} size="md" />

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
                <p className="truncate text-xs text-slate-500">{user.email}</p>
              </div>
            </div>

            <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
              Chat
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default UserList;