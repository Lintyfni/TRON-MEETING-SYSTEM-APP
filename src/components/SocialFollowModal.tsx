import React, { useState } from 'react';
import { SocialUser, UserProfile } from '../types';
import {
  X,
  UserCheck,
  UserPlus,
  Users,
  Search,
  Sparkles,
  Bell,
  Check,
  UserMinus,
  ArrowRight
} from 'lucide-react';

interface SocialFollowModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  socialUsers: SocialUser[];
  onToggleFollowUser: (userId: string) => void;
  onSimulateIncomingFollow: (userId: string) => void;
  initialTab?: 'following' | 'followers' | 'discover';
}

export const SocialFollowModal: React.FC<SocialFollowModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  socialUsers,
  onToggleFollowUser,
  onSimulateIncomingFollow,
  initialTab = 'following',
}) => {
  const [activeTab, setActiveTab] = useState<'following' | 'followers' | 'discover'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredUserId, setHoveredUserId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter lists
  const followingList = socialUsers.filter((u) => u.isFollowedByMe);
  const followersList = socialUsers.filter((u) => u.isFollowingMe);
  const discoverList = socialUsers.filter((u) => !u.isFollowedByMe);

  // Eligible users who can follow me (not following me yet)
  const usersWhoCanFollowMe = socialUsers.filter((u) => !u.isFollowingMe);

  const getFilteredList = (list: SocialUser[]) => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.handle.toLowerCase().includes(q) ||
        u.bio.toLowerCase().includes(q)
    );
  };

  const currentDisplayedList =
    activeTab === 'following'
      ? getFilteredList(followingList)
      : activeTab === 'followers'
      ? getFilteredList(followersList)
      : getFilteredList(discoverList);

  return (
    <div
      id="social-follow-modal-backdrop"
      className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="social-follow-modal"
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-neutral-200 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center">
              <Users className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-neutral-900 leading-tight">
                {currentUser.name}
              </h3>
              <p className="text-[11px] text-neutral-500 font-mono">{currentUser.handle}</p>
            </div>
          </div>

          <button
            id="btn-close-follow-modal"
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher: Following / Followers / Who to follow */}
        <div className="flex border-b border-neutral-200 bg-neutral-50/50">
          <button
            type="button"
            onClick={() => setActiveTab('following')}
            className={`flex-1 py-2.5 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border-b-2 ${
              activeTab === 'following'
                ? 'border-purple-600 text-purple-700 bg-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <span>Following</span>
            <span className="px-1.5 py-0.2 rounded-full bg-neutral-200/80 text-[10px] text-neutral-700 font-mono">
              {followingList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('followers')}
            className={`flex-1 py-2.5 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border-b-2 ${
              activeTab === 'followers'
                ? 'border-purple-600 text-purple-700 bg-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <span>Followers</span>
            <span className="px-1.5 py-0.2 rounded-full bg-neutral-200/80 text-[10px] text-neutral-700 font-mono">
              {followersList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('discover')}
            className={`flex-1 py-2.5 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border-b-2 ${
              activeTab === 'discover'
                ? 'border-purple-600 text-purple-700 bg-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Sparkles className="w-3 h-3 text-purple-600" />
            <span>Discover</span>
          </button>
        </div>

        {/* Search filter input */}
        <div className="p-3 border-b border-neutral-100 bg-white">
          <div className="flex items-center gap-2 bg-neutral-100 px-3 py-1.5 rounded-xl text-xs text-neutral-700">
            <Search className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent outline-none text-xs text-neutral-900 placeholder:text-neutral-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-neutral-400 hover:text-neutral-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* "Simulate Someone Following Me" Action Section in Followers Tab */}
        {activeTab === 'followers' && (
          <div className="px-3 py-2.5 bg-gradient-to-r from-purple-50 to-indigo-50/50 border-b border-purple-100 text-xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span className="font-bold text-neutral-800 text-[11px]">
                  သူများက ကိုယ့်ကို Follow လုပ်ခြင်း (Simulate):
                </span>
              </div>
              {usersWhoCanFollowMe.length > 0 && (
                <button
                  type="button"
                  onClick={() => onSimulateIncomingFollow(usersWhoCanFollowMe[0].id)}
                  className="px-2 py-0.5 rounded-md bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] shadow-2xs transition active:scale-95 cursor-pointer flex items-center gap-1"
                >
                  <UserPlus className="w-2.5 h-2.5" />
                  <span>+ {usersWhoCanFollowMe[0].name}</span>
                </button>
              )}
            </div>

            {usersWhoCanFollowMe.length > 0 ? (
              <div className="mt-1.5 flex items-center gap-1 overflow-x-auto no-scrollbar">
                <span className="text-[10px] text-neutral-500 shrink-0">Click to follow you:</span>
                {usersWhoCanFollowMe.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => onSimulateIncomingFollow(u.id)}
                    className="text-[10px] bg-white hover:bg-purple-100/70 border border-purple-200 text-purple-700 px-2 py-0.5 rounded-full transition shrink-0 cursor-pointer font-medium"
                    title={`Have ${u.name} follow you`}
                  >
                    + {u.name}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-purple-700 mt-1">
                🎉 All colleagues in the network are currently following you!
              </p>
            )}
          </div>
        )}

        {/* User list */}
        <div className="flex-1 overflow-y-auto divide-y divide-neutral-100 p-2">
          {currentDisplayedList.length === 0 ? (
            <div className="p-8 text-center text-neutral-400">
              <Users className="w-8 h-8 mx-auto text-neutral-300 mb-2" />
              <p className="text-xs font-semibold text-neutral-600">
                {activeTab === 'following'
                  ? 'You are not following anyone yet.'
                  : activeTab === 'followers'
                  ? 'No followers found.'
                  : 'No suggestions available.'}
              </p>
              <p className="text-[11px] text-neutral-400 mt-1">
                {activeTab === 'following'
                  ? 'Discover colleagues in the Discover tab to connect and see their updates!'
                  : activeTab === 'followers'
                  ? 'Use the Simulate button above to let colleagues follow you!'
                  : 'Check back later for more recommendations.'}
              </p>
            </div>
          ) : (
            currentDisplayedList.map((user) => {
              const isHovered = hoveredUserId === user.id;

              return (
                <div
                  key={user.id}
                  className="p-3 hover:bg-neutral-50/80 rounded-xl transition flex items-start justify-between gap-3"
                >
                  {/* Avatar & User Info */}
                  <div className="flex items-start gap-2.5 min-w-0">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover bg-neutral-200 border border-neutral-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs text-neutral-900 truncate">
                          {user.name}
                        </span>
                        {user.isFollowingMe && (
                          <span className="text-[9px] font-semibold text-neutral-600 bg-neutral-100 border border-neutral-200 px-1.5 py-0.2 rounded-md">
                            Follows you
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-500 font-mono">{user.handle}</p>
                      <p className="text-[11px] text-neutral-600 mt-1 line-clamp-2 leading-tight">
                        {user.bio}
                      </p>
                    </div>
                  </div>

                  {/* X-style Follow / Following / Unfollow Button */}
                  <div className="shrink-0">
                    {user.isFollowedByMe ? (
                      <button
                        type="button"
                        onClick={() => onToggleFollowUser(user.id)}
                        onMouseEnter={() => setHoveredUserId(user.id)}
                        onMouseLeave={() => setHoveredUserId(null)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer border ${
                          isHovered
                            ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
                            : 'bg-white text-neutral-800 border-neutral-300 hover:bg-neutral-50'
                        }`}
                      >
                        {isHovered ? 'Unfollow' : 'Following'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onToggleFollowUser(user.id)}
                        className="px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer bg-neutral-900 hover:bg-neutral-800 text-white shadow-xs active:scale-95 flex items-center gap-1"
                      >
                        <UserPlus className="w-3 h-3" />
                        <span>{user.isFollowingMe ? 'Follow back' : 'Follow'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-neutral-50 border-t border-neutral-200 text-center text-[10px] text-neutral-500">
          Syncs seamlessly with your profile stats and live meeting collaborator cards.
        </div>
      </div>
    </div>
  );
};
