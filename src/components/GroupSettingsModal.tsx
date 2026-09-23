import React, { useState } from 'react';
import { CooMGroup, SocialUser, UserProfile } from '../types';
import {
  X,
  Users,
  UserPlus,
  ShieldCheck,
  Check,
  Trash2,
  Settings,
  Palette,
  Globe,
  Lock,
  Search,
  UserMinus,
  DoorOpen,
  CheckCircle2,
} from 'lucide-react';
import { initialSocialUsers } from '../data/socialUsers';

interface GroupSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: CooMGroup;
  currentUser?: UserProfile;
  onUpdateGroup: (groupId: string, updates: Partial<CooMGroup>) => void;
  onAddUserToGroup: (groupId: string, userName: string) => void;
  onRemoveUserFromGroup: (groupId: string, userName: string) => void;
  onApproveRequest: (groupId: string, userName: string) => void;
  onDeclineRequest: (groupId: string, userName: string) => void;
  onLeaveGroup?: (groupId: string) => void;
  themeMode?: 'dark' | 'light';
}

export const GroupSettingsModal: React.FC<GroupSettingsModalProps> = ({
  isOpen,
  onClose,
  group,
  currentUser,
  onUpdateGroup,
  onAddUserToGroup,
  onRemoveUserFromGroup,
  onApproveRequest,
  onDeclineRequest,
  onLeaveGroup,
  themeMode = 'dark',
}) => {
  const isDark = themeMode !== 'light';
  const [activeTab, setActiveTab] = useState<'members' | 'invite' | 'pending' | 'settings'>('members');
  const [inviteSearch, setInviteSearch] = useState('');
  const [groupName, setGroupName] = useState(group.name);
  const [description, setDescription] = useState(group.description);
  const [privacy, setPrivacy] = useState<'public' | 'private'>(group.privacy);
  const [requiresApproval, setRequiresApproval] = useState(group.requiresApproval);
  const [chatTheme, setChatTheme] = useState(group.chatTheme || 'ocean');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const currentUserName = currentUser?.name || 'Aung Myint';
  const isAdmin = group.admin === currentUserName || group.admin === 'You' || group.admin === 'Aung Myint';

  // Available users to invite (filter out already members and already pending)
  const availableUsers = initialSocialUsers.filter(
    (u) => !group.members.includes(u.name) && !group.pendingRequests.includes(u.name)
  ).filter((u) => {
    if (!inviteSearch.trim()) return true;
    const q = inviteSearch.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.handle.toLowerCase().includes(q) || u.bio.toLowerCase().includes(q);
  });

  const handleSaveGeneralSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateGroup(group.id, {
      name: groupName.trim(),
      description: description.trim(),
      privacy,
      requiresApproval,
      chatTheme,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className={`rounded-2xl w-full max-w-xl shadow-2xl border overflow-hidden flex flex-col max-h-[90vh] ${
        isDark ? 'bg-[#0e061e] border-purple-500/25 text-white' : 'bg-white border-neutral-200 text-neutral-900'
      }`}>
        {/* Modal Top Header */}
        <div className={`px-5 py-3.5 border-b flex items-center justify-between shrink-0 ${
          isDark ? 'bg-[#120726] border-purple-500/20' : 'bg-white border-neutral-200'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center font-bold ${
              isDark ? 'bg-purple-900/40 border-purple-500/40 text-purple-300' : 'bg-purple-50 border-purple-200 text-purple-700'
            }`}>
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-base font-bold truncate max-w-xs sm:max-w-md ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                Group Settings & Members
              </h2>
              <p className={`text-xs truncate max-w-xs ${isDark ? 'text-purple-300/70' : 'text-neutral-500'}`}>{group.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer ${
              isDark ? 'hover:bg-purple-900/40 text-purple-300' : 'hover:bg-neutral-100 text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Settings Navigation Tabs */}
        <div className={`px-5 py-2 border-b flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0 ${
          isDark ? 'bg-[#120726]/60 border-purple-500/20' : 'bg-neutral-50 border-neutral-200'
        }`}>
          <button
            type="button"
            onClick={() => setActiveTab('members')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'members'
                ? 'bg-purple-600 text-white shadow-2xs'
                : isDark ? 'text-purple-300 hover:bg-purple-900/30' : 'text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Members ({group.members.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('invite')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'invite'
                ? 'bg-purple-600 text-white shadow-2xs'
                : isDark ? 'text-purple-300 hover:bg-purple-900/30' : 'text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add / Invite Users</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer relative ${
              activeTab === 'pending'
                ? 'bg-purple-600 text-white shadow-2xs'
                : isDark ? 'text-purple-300 hover:bg-purple-900/30' : 'text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Pending Requests</span>
            {group.pendingRequests.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-red-500 text-white rounded-full text-[10px] font-extrabold animate-pulse">
                {group.pendingRequests.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-purple-600 text-white shadow-2xs'
                : isDark ? 'text-purple-300 hover:bg-purple-900/30' : 'text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* TAB 1: MEMBERS */}
          {activeTab === 'members' && (
            <div className="space-y-3">
              <div className={`flex items-center justify-between pb-2 border-b ${
                isDark ? 'border-purple-500/20' : 'border-neutral-100'
              }`}>
                <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-purple-300' : 'text-neutral-500'}`}>
                  Group Members ({group.members.length})
                </span>
                <span className={`text-xs ${isDark ? 'text-purple-300/60' : 'text-neutral-400'}`}>
                  Admin: <strong className={isDark ? 'text-white' : 'text-neutral-700'}>{group.admin}</strong>
                </span>
              </div>

              <div className="space-y-2">
                {group.members.map((memberName) => {
                  const isUserAdmin = memberName === group.admin;
                  const isMe = memberName === currentUserName || memberName === 'You';
                  const matchedUser = initialSocialUsers.find((u) => u.name === memberName);

                  return (
                    <div
                      key={memberName}
                      className={`p-2.5 rounded-xl border flex items-center justify-between transition ${
                        isDark ? 'bg-[#150a30] border-purple-500/20 hover:border-purple-500/40' : 'bg-white border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={
                            matchedUser?.avatar ||
                            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop&crop=face'
                          }
                          alt={memberName}
                          className={`w-9 h-9 rounded-full object-cover border ${
                            isDark ? 'border-purple-500/30' : 'border-neutral-200'
                          }`}
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>{memberName}</span>
                            {isMe && (
                              <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                                isDark ? 'bg-purple-900/40 text-purple-300' : 'bg-neutral-100 text-neutral-600'
                              }`}>
                                (You)
                              </span>
                            )}
                            {isUserAdmin && (
                              <span className="text-[10px] bg-purple-600/30 text-purple-300 font-bold px-1.5 py-0.2 rounded flex items-center gap-0.5 border border-purple-500/40">
                                <ShieldCheck className="w-2.5 h-2.5" /> Admin
                              </span>
                            )}
                          </div>
                          <span className={`text-[11px] ${isDark ? 'text-purple-300/60' : 'text-neutral-500'}`}>
                            {matchedUser?.handle || `@${memberName.toLowerCase().replace(/\s+/g, '')}`}
                          </span>
                        </div>
                      </div>

                      {/* Remove Member option for admin */}
                      {isAdmin && !isUserAdmin && (
                        <button
                          type="button"
                          onClick={() => onRemoveUserFromGroup(group.id, memberName)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                          title="Remove user from group"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Leave group option for non-admin or member */}
              {onLeaveGroup && (
                <div className={`pt-4 mt-2 border-t flex justify-end ${
                  isDark ? 'border-purple-500/20' : 'border-neutral-200'
                }`}>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Leave group "${group.name}"?`)) {
                        onLeaveGroup(group.id);
                        onClose();
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-red-500 hover:bg-red-500/10 border border-red-500/30 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <DoorOpen className="w-3.5 h-3.5" />
                    <span>Leave Group</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: INVITE / ADD USERS */}
          {activeTab === 'invite' && (
            <div className="space-y-3">
              <div className="relative">
                <Search className={`w-4 h-4 absolute left-3 top-3 ${isDark ? 'text-purple-400' : 'text-neutral-400'}`} />
                <input
                  type="text"
                  value={inviteSearch}
                  onChange={(e) => setInviteSearch(e.target.value)}
                  placeholder="Search friends & developers to add..."
                  className={`w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border focus:outline-none transition ${
                    isDark
                      ? 'bg-[#180a3a] border-purple-500/30 text-white placeholder:text-purple-400/40 focus:border-purple-400'
                      : 'bg-neutral-50 border-neutral-300 text-neutral-900 placeholder:text-neutral-400 focus:border-purple-500'
                  }`}
                />
              </div>

              <div className="space-y-2 mt-2">
                {availableUsers.length === 0 ? (
                  <div className={`p-8 text-center text-xs ${isDark ? 'text-purple-300/60' : 'text-neutral-500'}`}>
                    No new contacts found to add. All contacts are already in the group!
                  </div>
                ) : (
                  availableUsers.map((user) => (
                    <div
                      key={user.id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between transition ${
                        isDark ? 'bg-[#150a30] border-purple-500/20 hover:border-purple-500/40' : 'bg-white border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className={`w-9 h-9 rounded-full object-cover border ${
                            isDark ? 'border-purple-500/30' : 'border-neutral-200'
                          }`}
                        />
                        <div>
                          <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>{user.name}</p>
                          <p className={`text-[11px] line-clamp-1 ${isDark ? 'text-purple-300/60' : 'text-neutral-500'}`}>{user.bio}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onAddUserToGroup(group.id, user.name)}
                        className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Add User</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: PENDING APPROVAL REQUESTS */}
          {activeTab === 'pending' && (
            <div className="space-y-3">
              <div className={`flex items-center justify-between pb-2 border-b ${
                isDark ? 'border-purple-500/20' : 'border-neutral-100'
              }`}>
                <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-purple-300' : 'text-neutral-500'}`}>
                  Pending Join Requests ({group.pendingRequests.length})
                </span>
                <span className={`text-xs ${isDark ? 'text-purple-300/60' : 'text-neutral-400'}`}>Admin approval control</span>
              </div>

              {group.pendingRequests.length === 0 ? (
                <div className={`py-12 text-center text-xs ${isDark ? 'text-purple-300/60' : 'text-neutral-500'}`}>
                  <ShieldCheck className={`w-10 h-10 mx-auto mb-2 ${isDark ? 'text-purple-400/50' : 'text-neutral-300'}`} />
                  <p className={`font-semibold ${isDark ? 'text-purple-200' : 'text-neutral-700'}`}>No pending join requests</p>
                  <p className="text-neutral-400 mt-0.5">When users request to join this group, they will appear here for admin review.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {group.pendingRequests.map((userName) => {
                    const matchedUser = initialSocialUsers.find((u) => u.name === userName);

                    return (
                      <div
                        key={userName}
                        className={`p-3 rounded-xl border flex items-center justify-between transition ${
                          isDark ? 'bg-amber-900/20 border-amber-500/30' : 'border-amber-200 bg-amber-50/40'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={
                              matchedUser?.avatar ||
                              'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop&crop=face'
                            }
                            alt={userName}
                            className="w-9 h-9 rounded-full object-cover border border-amber-300"
                          />
                          <div>
                            <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>{userName}</p>
                            <span className="text-[10px] bg-amber-500/20 text-amber-300 font-semibold px-1.5 py-0.2 rounded border border-amber-500/30">
                              Wants to join group
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onDeclineRequest(group.id, userName)}
                            className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                              isDark ? 'border-purple-500/20 bg-purple-900/30 text-purple-300 hover:bg-purple-900/50' : 'border-neutral-200 bg-white hover:bg-neutral-100 text-neutral-600'
                            }`}
                          >
                            Decline
                          </button>
                          <button
                            type="button"
                            onClick={() => onApproveRequest(group.id, userName)}
                            className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-2xs flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: GENERAL SETTINGS */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSaveGeneralSettings} className="space-y-4">
              <div>
                <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-purple-200' : 'text-neutral-700'}`}>Group Name</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  disabled={!isAdmin}
                  className={`w-full px-3.5 py-2 text-xs rounded-xl border outline-none transition disabled:opacity-60 ${
                    isDark
                      ? 'bg-[#180a3a] border-purple-500/30 text-white focus:border-purple-400'
                      : 'bg-neutral-50 border-neutral-300 text-neutral-900 focus:border-purple-600'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-purple-200' : 'text-neutral-700'}`}>Group Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={!isAdmin}
                  className={`w-full px-3.5 py-2 text-xs rounded-xl border outline-none transition resize-none disabled:opacity-60 ${
                    isDark
                      ? 'bg-[#180a3a] border-purple-500/30 text-white focus:border-purple-400'
                      : 'bg-neutral-50 border-neutral-300 text-neutral-900 focus:border-purple-600'
                  }`}
                />
              </div>

              <div className={`p-3 rounded-xl border flex items-center justify-between ${
                isDark ? 'bg-[#150a30] border-purple-500/20' : 'bg-neutral-50 border-neutral-200'
              }`}>
                <div>
                  <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>Admin Approval for New Members</p>
                  <p className={`text-[11px] ${isDark ? 'text-purple-300/70' : 'text-neutral-500'}`}>Require approval before new members can join</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requiresApproval}
                    onChange={(e) => setRequiresApproval(e.target.checked)}
                    disabled={!isAdmin}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600" />
                </label>
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1.5 flex items-center gap-1 ${isDark ? 'text-purple-200' : 'text-neutral-700'}`}>
                  <Palette className={`w-3.5 h-3.5 ${isDark ? 'text-purple-400' : 'text-neutral-500'}`} />
                  Group Chat Theme
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'ocean', label: 'Silver Violet', color: 'bg-purple-600' },
                    { id: 'berry', label: 'Royal Berry', color: 'bg-pink-600' },
                    { id: 'sunset', label: 'Sunset Coral', color: 'bg-orange-500' },
                    { id: 'emerald', label: 'Emerald Green', color: 'bg-emerald-600' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setChatTheme(t.id as any)}
                      className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                        chatTheme === t.id
                          ? isDark
                            ? 'border-purple-400 bg-purple-900/40 text-white font-bold'
                            : 'border-neutral-900 bg-neutral-100 font-bold'
                          : isDark
                            ? 'border-purple-500/20 hover:bg-purple-900/20 text-purple-300'
                            : 'border-neutral-200 hover:bg-neutral-50 text-neutral-600'
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full ${t.color}`} />
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className={`pt-3 border-t flex items-center justify-between ${
                isDark ? 'border-purple-500/20' : 'border-neutral-200'
              }`}>
                {savedSuccess && (
                  <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Settings updated!
                  </span>
                )}
                <button
                  type="submit"
                  disabled={!isAdmin}
                  className="ml-auto px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-40 rounded-xl transition shadow-sm cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
