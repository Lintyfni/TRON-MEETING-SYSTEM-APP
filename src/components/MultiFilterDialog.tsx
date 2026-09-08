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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="multi-filter-dialog-container"
        className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-5 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-red-500" />
            <div>
              <h3 className="font-semibold text-base text-white">Filter Participants To View</h3>
              <p className="text-xs text-neutral-400">{roomToken} Stream Focus</p>
            </div>
          </div>
          <button
            id="btn-close-filter-dialog"
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-full hover:bg-neutral-800 transition"
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
                ? 'bg-red-500/15 border border-red-500/40 text-white'
                : 'hover:bg-neutral-800/70 text-neutral-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                  isAllSelected
                    ? 'bg-red-500 border-red-500 text-white'
                    : 'border-neutral-600 bg-neutral-800'
                }`}
              >
                {isAllSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
              <span className="font-medium text-sm">All Participants ({participants.length})</span>
            </div>
            <span className="text-xs text-neutral-400 font-mono">Default</span>
          </button>

          <div className="h-px bg-neutral-800 my-2" />

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
                    ? 'bg-red-500/15 border border-red-500/40 text-white'
                    : 'hover:bg-neutral-800/70 text-neutral-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                      isSelected
                        ? 'bg-red-500 border-red-500 text-white'
                        : 'border-neutral-600 bg-neutral-800'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-red-500/20 text-red-400 text-xs font-bold flex items-center justify-center">
                      {user[0]}
                    </div>
                    <span className="text-sm font-medium">{user}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-500">Live</span>
                  {onDirectChat && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                        onDirectChat(user);
                      }}
                      className="px-2 py-1 bg-red-950/80 hover:bg-red-600 border border-red-800/80 hover:border-red-500 text-red-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition"
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

        <div className="pt-4 border-t border-neutral-800 flex justify-end">
          <button
            id="btn-confirm-filter"
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white font-medium rounded-xl text-sm transition shadow-lg shadow-red-950/40"
          >
            Apply View Filter
          </button>
        </div>
      </div>
    </div>
  );
};
