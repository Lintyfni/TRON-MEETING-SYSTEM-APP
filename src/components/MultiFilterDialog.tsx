import React from 'react';
import { Check, X, Users, MessageSquare } from 'lucide-react';

interface MultiFilterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  participants: string[];
  selectedUsers: string[];
  onToggleUser: (userName: string) => void;
  roomToken: string;
  onDirectChat?: (userName: string) => void;
}

export const MultiFilterDialog: React.FC<MultiFilterDialogProps> = ({
  isOpen,
  onClose,
  participants,
  selectedUsers,
  onToggleUser,
  roomToken,
  onDirectChat,
}) => {
  if (!isOpen) return null;

  const isAllSelected = selectedUsers.includes('All');

  return (
    <div
      id="multi-filter-dialog-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="multi-filter-dialog-container"
        className="w-full max-w-sm bg-white border border-neutral-200 rounded-2xl shadow-2xl p-5 text-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            <div>
              <h3 className="font-bold text-base text-neutral-900">Filter Participants To View</h3>
              <p className="text-xs text-neutral-500 font-medium">{roomToken} Stream Focus</p>
            </div>
          </div>
          <button
            id="btn-close-filter-dialog"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-900 p-1 rounded-full hover:bg-neutral-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-3 space-y-1 max-h-72 overflow-y-auto pr-1 mt-2">
          {/* All Participants Checkbox */}
          <button
            id="filter-user-all"
            type="button"
            onClick={() => onToggleUser('All')}
            className={`w-full flex items-center justify-between p-3 rounded-xl transition ${
              isAllSelected
                ? 'bg-purple-50 border border-purple-200 text-neutral-900'
                : 'hover:bg-neutral-50 text-neutral-700 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                  isAllSelected
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 border-purple-600 text-white'
                    : 'border-neutral-300 bg-white'
                }`}
              >
                {isAllSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
              <span className="font-semibold text-sm">All Participants ({participants.length})</span>
            </div>
            <span className="text-xs text-neutral-400 font-mono">Default</span>
          </button>

          <div className="h-px bg-neutral-200 my-2" />

          {/* Individual Participants */}
          {participants.map((user) => {
            const isSelected = selectedUsers.includes(user);
            return (
              <button
                key={user}
                id={`filter-user-${user.replace(/\s+/g, '-').toLowerCase()}`}
                type="button"
                onClick={() => onToggleUser(user)}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition ${
                  isSelected
                    ? 'bg-purple-50 border border-purple-200 text-neutral-900'
                    : 'hover:bg-neutral-50 text-neutral-700 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                      isSelected
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 border-purple-600 text-white'
                        : 'border-neutral-300 bg-white'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold flex items-center justify-center">
                      {user[0]}
                    </div>
                    <span className="text-sm font-medium">{user}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-400">Live</span>
                  {onDirectChat && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                        onDirectChat(user);
                      }}
                      className="px-2 py-1 bg-purple-50 hover:bg-purple-600 border border-purple-200 hover:border-purple-600 text-purple-700 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                      title={`Direct Chat with ${user}`}
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>Chat</span>
                    </button>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="pt-4 border-t border-neutral-200 flex justify-end">
          <button
            id="btn-confirm-filter"
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl text-sm transition shadow-xs cursor-pointer"
          >
            Apply View Filter
          </button>
        </div>
      </div>
    </div>
  );
};
