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
  themeMode?: 'dark' | 'light' | string;
}

export const SocialFollowModal: React.FC<SocialFollowModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  socialUsers,
  onToggleFollowUser,
  onSimulateIncomingFollow,
  initialTab = 'following',
  themeMode = 'dark',
}) => {
  const isDark = themeMode !== 'light';
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
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="social-follow-modal"
        className={`relative w-full max-w-md rounded-2xl shadow-2xl border overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150 ${
          isDark ? 'bg-[#0e061e] border-purple-500/30 text-white' : 'bg-white border-neutral-200 text-neutral-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-4 py-3 border-b flex items-center justify-between sticky top-0 z-10 ${
          isDark ? 'bg-[#120726] border-purple-500/25' : 'bg-white border-neutral-200'
        }`}>
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${
              isDark ? 'bg-purple-900/40 border-purple-500/30 text-purple-300' : 'bg-purple-100 border-purple-200 text-purple-700'
            }`}>
              <Users className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h3 className={`font-bold text-sm leading-tight ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                {currentUser.name}
              </h3>
              <p className={`text-[11px] font-mono ${isDark ? 'text-purple-300/70' : 'text-neutral-500'}`}>{currentUser.handle}</p>
            </div>
          </div>

          <button
            id="btn-close-follow-modal"
            type="button"
            onClick={onClose}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition cursor-pointer ${
              isDark ? 'text-purple-300 hover:text-white hover:bg-purple-900/40' : 'text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher: Following / Followers / Who to follow */}
        <div className={`flex border-b ${isDark ? 'border-purple-900/40 bg-[#090414]' : 'border-neutral-200 bg-neutral-50/50'}`}>
          <button
            type="button"
            onClick={() => setActiveTab('following')}
            className={`flex-1 py-2.5 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border-b-2 ${
              activeTab === 'following'
                ? isDark
                  ? 'border-purple-400 text-purple-300 bg-[#160b2f]'
                  : 'border-purple-600 text-purple-700 bg-white'
                : isDark
                ? 'border-transparent text-purple-300/60 hover:text-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <span>Following</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              isDark ? 'bg-purple-950/80 text-purple-300 border border-purple-700/40' : 'bg-neutral-200/80 text-neutral-700'
            }`}>
              {followingList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('followers')}
            className={`flex-1 py-2.5 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border-b-2 ${
              activeTab === 'followers'
                ? isDark
                  ? 'border-purple-400 text-purple-300 bg-[#160b2f]'
                  : 'border-purple-600 text-purple-700 bg-white'
                : isDark
                ? 'border-transparent text-purple-300/60 hover:text-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <span>Followers</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              isDark ? 'bg-purple-950/80 text-purple-300 border border-purple-700/40' : 'bg-neutral-200/80 text-neutral-700'
            }`}>
              {followersList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('discover')}
            className={`flex-1 py-2.5 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border-b-2 ${
              activeTab === 'discover'
                ? isDark
                  ? 'border-purple-400 text-purple-300 bg-[#160b2f]'
                  : 'border-purple-600 text-purple-700 bg-white'
                : isDark
                ? 'border-transparent text-purple-300/60 hover:text-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span>Discover</span>
          </button>
        </div>

        {/* Search filter input */}
        <div className={`p-3 border-b ${isDark ? 'border-purple-900/30 bg-[#0c051a]' : 'border-neutral-100 bg-white'}`}>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs border ${
            isDark ? 'bg-[#180a34] border-purple-800/40 text-white' : 'bg-neutral-100 border-neutral-200 text-neutral-700'
          }`}>
            <Search className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-purple-400' : 'text-neutral-400'}`} />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full bg-transparent outline-none text-xs placeholder:text-purple-300/40 ${
                isDark ? 'text-white placeholder:text-purple-300/40' : 'text-neutral-900 placeholder:text-neutral-400'
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className={isDark ? 'text-purple-300 hover:text-white' : 'text-neutral-400 hover:text-neutral-600'}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* "Simulate Someone Following Me" Action Section in Followers Tab */}
        {activeTab === 'followers' && (
          <div className={`px-3 py-2.5 border-b text-xs ${
            isDark
              ? 'bg-[#180a38] border-purple-900/40 text-purple-200'
              : 'bg-gradient-to-r from-purple-50 to-indigo-50/50 border-purple-100 text-neutral-800'
          }`}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className={`font-bold text-[11px] ${isDark ? 'text-purple-200' : 'text-neutral-800'}`}>
                  Follow Simulation (Simulate):
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
                <span className={`text-[10px] shrink-0 ${isDark ? 'text-purple-300/60' : 'text-neutral-500'}`}>Click to follow you:</span>
                {usersWhoCanFollowMe.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => onSimulateIncomingFollow(u.id)}
                    className={`text-[10px] px-2 py-0.5 rounded-full transition shrink-0 cursor-pointer font-medium border ${
                      isDark
                        ? 'bg-purple-950/70 hover:bg-purple-900/80 border-purple-700/50 text-purple-300'
                        : 'bg-white hover:bg-purple-100/70 border-purple-200 text-purple-700'
                    }`}
                    title={`Have ${u.name} follow you`}
                  >
                    + {u.name}
                  </button>
                ))}
              </div>
            ) : (
              <p className={`text-[10px] mt-1 ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                🎉 All colleagues in the network are currently following you!
              </p>
            )}
          </div>
        )}

        {/* User list */}
        <div className={`flex-1 overflow-y-auto divide-y p-2 ${
          isDark ? 'divide-purple-900/30 bg-[#090414]' : 'divide-neutral-100 bg-white'
        }`}>
          {currentDisplayedList.length === 0 ? (
            <div className="p-8 text-center text-neutral-400">
              <Users className={`w-8 h-8 mx-auto mb-2 ${isDark ? 'text-purple-500/40' : 'text-neutral-300'}`} />
              <p className={`text-xs font-semibold ${isDark ? 'text-purple-200' : 'text-neutral-600'}`}>
                {activeTab === 'following'
                  ? 'You are not following anyone yet.'
                  : activeTab === 'followers'
                  ? 'No followers found.'
                  : 'No suggestions available.'}
              </p>
              <p className={`text-[11px] mt-1 ${isDark ? 'text-purple-300/50' : 'text-neutral-400'}`}>
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
                  className={`p-3 rounded-xl transition flex items-start justify-between gap-3 ${
                    isDark ? 'hover:bg-[#15092a]' : 'hover:bg-neutral-50/80'
                  }`}
                >
                  {/* Avatar & User Info */}
                  <div className="flex items-start gap-2.5 min-w-0">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className={`w-10 h-10 rounded-full object-cover shrink-0 border ${
                        isDark ? 'bg-purple-950 border-purple-500/30' : 'bg-neutral-200 border-neutral-200'
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`font-bold text-xs truncate ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                          {user.name}
                        </span>
                        {user.isFollowingMe && (
                          <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded-md border ${
                            isDark
                              ? 'bg-purple-950/80 text-purple-300 border-purple-700/40'
                              : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                          }`}>
                            Follows you
                          </span>
                        )}
                      </div>
                      <p className={`text-[11px] font-mono ${isDark ? 'text-purple-300/60' : 'text-neutral-500'}`}>{user.handle}</p>
                      <p className={`text-[11px] mt-1 line-clamp-2 leading-tight ${isDark ? 'text-purple-200/80' : 'text-neutral-600'}`}>
                        {user.bio}
                      </p>
                    </div>
                  </div>

                  {/* Silver Violet Follow / Following / Unfollow Button */}
                  <div className="shrink-0">
                    {user.isFollowedByMe ? (
                      <button
                        type="button"
                        onClick={() => onToggleFollowUser(user.id)}
                        onMouseEnter={() => setHoveredUserId(user.id)}
                        onMouseLeave={() => setHoveredUserId(null)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer border ${
                          isHovered
                            ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 hover:bg-rose-500/30'
                            : isDark
                            ? 'bg-[#1c0d38] text-purple-200 border-purple-500/40 hover:bg-[#25124b]'
                            : 'bg-white text-neutral-800 border-neutral-300 hover:bg-neutral-50'
                        }`}
                      >
                        {isHovered ? 'Unfollow' : 'Following'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onToggleFollowUser(user.id)}
                        className="px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-xs active:scale-95 flex items-center gap-1"
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
        <div className={`px-4 py-2.5 border-t text-center text-[10px] ${
          isDark ? 'bg-[#0c051a] border-purple-900/30 text-purple-300/60' : 'bg-neutral-50 border-neutral-200 text-neutral-500'
        }`}>
          Syncs seamlessly with your profile stats and live meeting collaborator cards.
        </div>
      </div>
    </div>
  );
};
