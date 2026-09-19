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
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  isOpen,
  onClose,
  group,
  currentUser,
  onAddUserToGroup,
}) => {
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
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in"
    >
      <div
        id="add-member-modal"
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-neutral-200 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center shrink-0">
              <UserPlus className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-neutral-900 truncate">
                Add Members to Group
              </h2>
              <p className="text-[11px] text-neutral-500 truncate">
                {group.name} · {group.members.length} members
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-neutral-100 text-neutral-500 hover:text-neutral-800 flex items-center justify-center transition cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-3.5 border-b border-neutral-100 bg-neutral-50/70 space-y-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search friends by name or @handle..."
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-white border border-neutral-300 rounded-xl text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-purple-600 shadow-2xs transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-700"
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
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              All Friends & Following
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('mutual')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeFilter === 'mutual'
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              Mutual Friends
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('following')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeFilter === 'following'
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              Following
            </button>
          </div>
        </div>

        {/* Friends List */}
        <div className="flex-1 overflow-y-auto divide-y divide-neutral-100 p-2">
          {filteredFriends.length === 0 ? (
            <div className="py-12 text-center text-neutral-400">
              <Users className="w-9 h-9 mx-auto text-neutral-300 mb-2" />
              <p className="text-xs font-semibold text-neutral-600">No contacts found</p>
              <p className="text-[11px] text-neutral-400 mt-0.5">Try searching with a different name</p>
            </div>
          ) : (
            filteredFriends.map((friend) => {
              const isAlreadyMember =
                group.members.includes(friend.name) || addedUserNames.includes(friend.name);
              const isMutual = friend.isFollowedByMe && friend.isFollowingMe;

              return (
                <div
                  key={friend.id}
                  className="p-2.5 flex items-center justify-between gap-3 hover:bg-neutral-50/80 rounded-xl transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative shrink-0">
                      <img
                        src={friend.avatar}
                        alt={friend.name}
                        className="w-10 h-10 rounded-full object-cover border border-neutral-200"
                      />
                      {friend.isOnline && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-neutral-900 truncate">
                          {friend.name}
                        </span>
                        {isMutual && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
                            Friend
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-400 truncate">{friend.handle}</p>
                      {friend.bio && (
                        <p className="text-[10px] text-neutral-500 truncate max-w-xs mt-0.5">
                          {friend.bio}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Add Action Button */}
                  <div className="shrink-0">
                    {isAlreadyMember ? (
                      <span className="px-2.5 py-1.5 rounded-xl bg-neutral-100 text-neutral-500 text-xs font-semibold flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Member</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAddMember(friend.name)}
                        className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition cursor-pointer shadow-2xs flex items-center gap-1.5"
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
        <div className="px-4 py-3 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between shrink-0">
          <span className="text-xs text-neutral-500">
            {addedUserNames.length > 0
              ? `Added ${addedUserNames.length} new member(s)`
              : 'Add contacts from your network'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-neutral-200 hover:bg-neutral-300 text-neutral-800 text-xs font-bold transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
