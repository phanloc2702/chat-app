import { useMemo, useState } from 'react';
import { FiCheck, FiX } from 'react-icons/fi';
import Avatar from '../../../components/Avatar';
import type { User } from '../../../types/chat';

type CreateGroupModalProps = {
  users: User[];
  creating: boolean;
  onClose: () => void;
  onCreateGroup: (payload: { name: string; memberIds: number[] }) => void;
};

const CreateGroupModal = ({
  users,
  creating,
  onClose,
  onCreateGroup,
}: CreateGroupModalProps) => {
  const [groupName, setGroupName] = useState('');
  const [keyword, setKeyword] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);
  const [localError, setLocalError] = useState('');

  const filteredUsers = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return users.filter((user) => {
      if (!normalizedKeyword) return true;

      return (
        user.username.toLowerCase().includes(normalizedKeyword) ||
        user.email.toLowerCase().includes(normalizedKeyword)
      );
    });
  }, [users, keyword]);

  const selectedUsers = useMemo(() => {
    return users.filter((user) => selectedMemberIds.includes(user.id));
  }, [users, selectedMemberIds]);

  const handleToggleMember = (userId: number) => {
    setLocalError('');

    setSelectedMemberIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = () => {
    const trimmedName = groupName.trim();

    if (!trimmedName) {
      setLocalError('Vui lòng nhập tên nhóm');
      return;
    }

    if (selectedMemberIds.length === 0) {
      setLocalError('Vui lòng chọn ít nhất 1 thành viên');
      return;
    }

    onCreateGroup({
      name: trimmedName,
      memberIds: selectedMemberIds,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h3 className="text-xl font-black text-slate-950">
              Tạo nhóm mới
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Chọn thành viên và đặt tên nhóm chat
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
          >
            <FiX size={20} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {localError && (
            <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              {localError}
            </div>
          )}

          <div className="mb-5">
            <label className="mb-2 block text-sm font-bold text-slate-800">
              Tên nhóm
            </label>

            <input
              type="text"
              value={groupName}
              onChange={(e) => {
                setLocalError('');
                setGroupName(e.target.value);
              }}
              placeholder="Ví dụ: Team đồ án chat app"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div className="mb-5">
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-bold text-slate-800">
                Thành viên đã chọn
              </label>

              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">
                {selectedMemberIds.length} người
              </span>
            </div>

            {selectedUsers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center text-sm text-slate-500">
                Chưa chọn thành viên nào
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto rounded-2xl bg-slate-50 p-3">
                {selectedUsers.map((user) => (
                  <div key={user.id} className="relative w-20 shrink-0">
                    <div className="mx-auto h-12 w-12">
                      <Avatar
                        name={user.username}
                        imageUrl={user.avatarUrl}
                        size="md"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleMember(user.id)}
                      className="absolute right-1 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white shadow"
                    >
                      <FiX size={12} />
                    </button>

                    <p className="mt-1 truncate text-center text-xs font-semibold text-slate-600">
                      {user.username}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-bold text-slate-800">
                Chọn người dùng
              </label>

              <span className="text-xs font-semibold text-slate-400">
                {filteredUsers.length} kết quả
              </span>
            </div>

            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm theo tên hoặc email"
              className="mb-3 w-full rounded-full border border-transparent bg-slate-100 px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />

            <div className="max-h-80 space-y-1 overflow-y-auto rounded-2xl border border-slate-100 bg-white p-2">
              {filteredUsers.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-slate-500">
                  Không tìm thấy người dùng phù hợp
                </div>
              ) : (
                filteredUsers.map((user) => {
                  const checked = selectedMemberIds.includes(user.id);

                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleToggleMember(user.id)}
                      className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${
                        checked ? 'bg-blue-50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="relative shrink-0">
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

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-900">
                          {user.username}
                        </p>

                        <p className="truncate text-xs font-medium text-slate-500">
                          {user.email}
                        </p>
                      </div>

                      <div
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                          checked
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-slate-300 bg-white text-transparent'
                        }`}
                      >
                        <FiCheck size={14} />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-4">
          <p className="text-sm text-slate-500">
            Nhóm sẽ gồm bạn và {selectedMemberIds.length} thành viên đã chọn
          </p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
            >
              Hủy
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={creating}
              className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {creating ? 'Đang tạo...' : 'Tạo nhóm'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;