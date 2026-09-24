import React, { useState } from 'react';
import { CooMGroup, UserProfile } from '../types';
import { initialSocialUsers } from '../data/socialUsers';
import {
  X,
  UserPlus,
  Search,
  Check,
  Users,
  UserCheck,
  Sparkles,
} from 'lucide-react';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: CooMGroup | null;
  currentUser?: UserProfile;
  onAddUserToGroup: (groupId: string, userName: string) => void;
  themeMode?: 'dark' | 'light';
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  isOpen,
  onClose,
  group,
  currentUser,
  onAddUserToGroup,
  themeMode = 'dark',
}) => {
  const isDark = themeMode !== 'light';
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'mutual' | 'following'>('all');
  const [addedUserNames, setAddedUserNames] = useState<string[]>([]);

  if (!isOpen || !group) return null;

  const currentUserName = currentUser?.name || 'Aung Myint';

  // Filter users from socialUsers list
  const filteredFriends = initialSocialUsers
    .filter((user) => user.name !== currentUserName && user.name !== 'You')
    .filter((user) => {
      if (activeFilter === 'mutual') {
        return user.isFollowedByMe && user.isFollowingMe;
      }
      if (activeFilter === 'following') {
        return user.isFollowedByMe;
      }
      return true;
    })
    .filter((user) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        user.name.toLowerCase().includes(q) ||
        user.handle.toLowerCase().includes(q) ||
        (user.bio && user.bio.toLowerCase().includes(q))
      );
    });

  const handleAddMember = (userName: string) => {
    onAddUserToGroup(group.id, userName);
    setAddedUserNames((prev) => [...prev, userName]);
  };

  return (
    <div
      id="add-member-modal-overlay"
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in"
    >
      <div
        id="add-member-modal"
        className={`rounded-2xl w-full max-w-md shadow-2xl border overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150 ${
          isDark ? 'bg-[#131B2E] border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className={`px-5 py-3.5 border-b flex items-center justify-between shrink-0 ${
          isDark ? 'bg-[#131B2E] border-slate-800' : 'bg-white border-slate-100'
        }`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${
              isDark ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-indigo-50 border-indigo-200 text-indigo-600'
            }`}>
              <UserPlus className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className={`text-sm font-bold truncate ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                Add Members to Group
              </h2>
              <p className={`text-[11px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {group.name} · {group.members.length} members
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer shrink-0 ${
              isDark ? 'hover:bg-[#1E293B] text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input */}
        <div className={`p-3.5 border-b space-y-2.5 ${
          isDark ? 'bg-[#0B0F19] border-slate-800' : 'bg-slate-50 border-slate-100'
        }`}>
          <div className="relative">
            <Search className={`w-4 h-4 absolute left-3 top-2.5 ${isDark ? 'text-indigo-400' : 'text-slate-400'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search friends by name or @handle..."
              className={`w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border focus:outline-none transition shadow-xs ${
                isDark
                  ? 'bg-[#1E293B] border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-indigo-500'
                  : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-indigo-600'
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className={`absolute right-2.5 top-2.5 ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-700'}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : isDark
                    ? 'bg-[#1E293B] border border-slate-700 text-slate-300 hover:bg-[#25334D]'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              All Friends & Following
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('mutual')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeFilter === 'mutual'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : isDark
                    ? 'bg-[#1E293B] border border-slate-700 text-slate-300 hover:bg-[#25334D]'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Mutual Friends
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('following')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeFilter === 'following'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : isDark
                    ? 'bg-[#1E293B] border border-slate-700 text-slate-300 hover:bg-[#25334D]'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Following
            </button>
          </div>
        </div>

        {/* Friends List */}
        <div className={`flex-1 overflow-y-auto divide-y p-2 ${
          isDark ? 'divide-slate-800' : 'divide-slate-100'
        }`}>
          {filteredFriends.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Users className={`w-9 h-9 mx-auto mb-2 ${isDark ? 'text-indigo-400/40' : 'text-slate-300'}`} />
              <p className={`text-xs font-semibold ${isDark ? 'text-slate-200' : 'text-slate-600'}`}>No contacts found</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Try searching with a different name</p>
            </div>
          ) : (
            filteredFriends.map((friend) => {
              const isAlreadyMember =
                group.members.includes(friend.name) || addedUserNames.includes(friend.name);
              const isMutual = friend.isFollowedByMe && friend.isFollowingMe;

              return (
                <div
                  key={friend.id}
                  className={`p-2.5 flex items-center justify-between gap-3 rounded-xl transition ${
                    isDark ? 'hover:bg-[#1E293B]' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative shrink-0">
                      <img
                        src={friend.avatar}
                        alt={friend.name}
                        className={`w-10 h-10 rounded-full object-cover border ${
                          isDark ? 'border-slate-600' : 'border-slate-200'
                        }`}
                      />
                      {friend.isOnline && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#131B2E]" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-bold truncate ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                          {friend.name}
                        </span>
                        {isMutual && (
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border shrink-0 ${
                            isDark
                              ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          }`}>
                            Friend
                          </span>
                        )}
                      </div>
                      <p className={`text-[11px] truncate ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>{friend.handle}</p>
                      {friend.bio && (
                        <p className={`text-[10px] truncate max-w-xs mt-0.5 ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
                          {friend.bio}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Add Action Button */}
                  <div className="shrink-0">
                    {isAlreadyMember ? (
                      <span className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 ${
                        isDark ? 'bg-indigo-500/15 text-indigo-300' : 'bg-slate-100 text-slate-500'
                      }`}>
                        <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Member</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAddMember(friend.name)}
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold transition cursor-pointer shadow-xs flex items-center gap-1.5"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className={`px-4 py-3 border-t flex items-center justify-between shrink-0 ${
          isDark ? 'bg-[#131B2E] border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {addedUserNames.length > 0
              ? `Added ${addedUserNames.length} new member(s)`
              : 'Add contacts from your network'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              isDark
                ? 'bg-[#1E293B] hover:bg-[#25334D] text-slate-200'
                : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
            }`}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
