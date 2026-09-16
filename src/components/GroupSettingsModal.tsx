import React, { useState } from 'react';
import { FacebookGroup, SocialUser, UserProfile } from '../types';
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
  group: FacebookGroup;
  currentUser?: UserProfile;
  onUpdateGroup: (groupId: string, updates: Partial<FacebookGroup>) => void;
  onAddUserToGroup: (groupId: string, userName: string) => void;
  onRemoveUserFromGroup: (groupId: string, userName: string) => void;
  onApproveRequest: (groupId: string, userName: string) => void;
  onDeclineRequest: (groupId: string, userName: string) => void;
  onLeaveGroup?: (groupId: string) => void;
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
}) => {
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Header */}
        <div className="px-5 py-3.5 border-b border-neutral-200 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-bold">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 truncate max-w-xs sm:max-w-md">
                Group Settings & Members
              </h2>
              <p className="text-xs text-neutral-500 truncate max-w-xs">{group.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-neutral-100 text-neutral-500 hover:text-neutral-800 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Settings Navigation Tabs */}
        <div className="px-5 py-2 border-b border-neutral-200 bg-neutral-50 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('members')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'members'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900'
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
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900'
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
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900'
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
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900'
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
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                  Group Members ({group.members.length})
                </span>
                <span className="text-xs text-neutral-400">
                  Admin: <strong className="text-neutral-700">{group.admin}</strong>
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
                      className="p-2.5 rounded-xl border border-neutral-200 hover:border-neutral-300 bg-white flex items-center justify-between transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={
                            matchedUser?.avatar ||
                            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop&crop=face'
                          }
                          alt={memberName}
                          className="w-9 h-9 rounded-full object-cover border border-neutral-200"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-neutral-900">{memberName}</span>
                            {isMe && (
                              <span className="text-[10px] bg-neutral-100 text-neutral-600 font-semibold px-1.5 py-0.2 rounded">
                                (You)
                              </span>
                            )}
                            {isUserAdmin && (
                              <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.2 rounded flex items-center gap-0.5">
                                <ShieldCheck className="w-2.5 h-2.5" /> Admin
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-neutral-500">
                            {matchedUser?.handle || `@${memberName.toLowerCase().replace(/\s+/g, '')}`}
                          </span>
                        </div>
                      </div>

                      {/* Remove Member option for admin */}
                      {isAdmin && !isUserAdmin && (
                        <button
                          type="button"
                          onClick={() => onRemoveUserFromGroup(group.id, memberName)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
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
                <div className="pt-4 mt-2 border-t border-neutral-200 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Leave group "${group.name}"?`)) {
                        onLeaveGroup(group.id);
                        onClose();
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 border border-red-200 transition cursor-pointer flex items-center gap-1.5"
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
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={inviteSearch}
                  onChange={(e) => setInviteSearch(e.target.value)}
                  placeholder="Search friends & developers to add..."
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-neutral-50 border border-neutral-300 rounded-xl text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div className="space-y-2 mt-2">
                {availableUsers.length === 0 ? (
                  <div className="p-8 text-center text-neutral-500 text-xs">
                    No new contacts found to add. All contacts are already in the group!
                  </div>
                ) : (
                  availableUsers.map((user) => (
                    <div
                      key={user.id}
                      className="p-2.5 rounded-xl border border-neutral-200 bg-white hover:border-neutral-300 flex items-center justify-between transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-9 h-9 rounded-full object-cover border border-neutral-200"
                        />
                        <div>
                          <p className="text-xs font-bold text-neutral-900">{user.name}</p>
                          <p className="text-[11px] text-neutral-500 line-clamp-1">{user.bio}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onAddUserToGroup(group.id, user.name)}
                        className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 hover:border-blue-600 text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
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
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                  Pending Join Requests ({group.pendingRequests.length})
                </span>
                <span className="text-xs text-neutral-400">Admin approval control</span>
              </div>

              {group.pendingRequests.length === 0 ? (
                <div className="py-12 text-center text-neutral-500 text-xs">
                  <ShieldCheck className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
                  <p className="font-semibold text-neutral-700">No pending join requests</p>
                  <p className="text-neutral-400 mt-0.5">When users request to join this group, they will appear here for admin review.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {group.pendingRequests.map((userName) => {
                    const matchedUser = initialSocialUsers.find((u) => u.name === userName);

                    return (
                      <div
                        key={userName}
                        className="p-3 rounded-xl border border-amber-200 bg-amber-50/40 flex items-center justify-between transition"
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
                            <p className="text-xs font-bold text-neutral-900">{userName}</p>
                            <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-1.5 py-0.2 rounded">
                              Wants to join group
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onDeclineRequest(group.id, userName)}
                            className="px-2.5 py-1.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-100 text-neutral-600 text-xs font-semibold transition cursor-pointer"
                          >
                            Decline
                          </button>
                          <button
                            type="button"
                            onClick={() => onApproveRequest(group.id, userName)}
                            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-2xs flex items-center gap-1 cursor-pointer"
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
                <label className="block text-xs font-bold text-neutral-700 mb-1">Group Name</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  disabled={!isAdmin}
                  className="w-full px-3.5 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-xl text-neutral-900 focus:border-blue-500 outline-none transition disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Group Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={!isAdmin}
                  className="w-full px-3.5 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-xl text-neutral-900 focus:border-blue-500 outline-none transition resize-none disabled:opacity-60"
                />
              </div>

              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-neutral-900">Admin Approval for New Members</p>
                  <p className="text-[11px] text-neutral-500">Require approval before new members can join</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requiresApproval}
                    onChange={(e) => setRequiresApproval(e.target.checked)}
                    disabled={!isAdmin}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5 flex items-center gap-1">
                  <Palette className="w-3.5 h-3.5 text-neutral-500" />
                  Group Chat Theme
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'ocean', label: 'Ocean Blue', color: 'bg-blue-600' },
                    { id: 'berry', label: 'Royal Berry', color: 'bg-purple-600' },
                    { id: 'sunset', label: 'Sunset Coral', color: 'bg-orange-500' },
                    { id: 'emerald', label: 'Emerald Green', color: 'bg-emerald-600' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setChatTheme(t.id as any)}
                      className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                        chatTheme === t.id
                          ? 'border-neutral-900 bg-neutral-100 font-bold'
                          : 'border-neutral-200 hover:bg-neutral-50'
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full ${t.color}`} />
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-200 flex items-center justify-between">
                {savedSuccess && (
                  <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Settings updated!
                  </span>
                )}
                <button
                  type="submit"
                  disabled={!isAdmin}
                  className="ml-auto px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 rounded-xl transition shadow-sm cursor-pointer"
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
