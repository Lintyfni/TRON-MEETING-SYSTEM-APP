import React, { useState, useRef, useEffect } from 'react';
import { CooMGroup, GroupChatMessage, UserProfile } from '../types';
import {
  Send,
  Users,
  UserPlus,
  Plus,
  Image as ImageIcon,
  Smile,
  ThumbsUp,
  Settings,
  Video,
  Layers,
  Sparkles,
  Info,
  CheckCheck,
  Search,
} from 'lucide-react';
import { AddMemberModal } from './AddMemberModal';

interface GroupMessengerChatProps {
  groups: CooMGroup[];
  activeGroupId: string;
  onSelectGroup: (groupId: string) => void;
  groupChats: GroupChatMessage[];
  currentUser?: UserProfile;
  onSendGroupMessage: (groupId: string, text: string, mediaUrl?: string) => void;
  onToggleReaction: (messageId: string, emoji: string) => void;
  onOpenGroupSettings: (group: CooMGroup) => void;
  onCreateGroupClick: () => void;
  onJumpToMeeting?: (roomToken: string) => void;
  onGoToGroupPosts?: (groupId: string) => void;
  onAddUserToGroup?: (groupId: string, userName: string) => void;
  themeMode?: 'dark' | 'light';
}

const EMOJI_PICKER_OPTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '👏'];

// Theme configurations matching CooM Group Messenger
const THEME_STYLES: Record<string, { bubble: string; text: string; headerBg: string; buttonBg: string }> = {
  ocean: {
    bubble: 'bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700 text-white',
    text: 'text-purple-400',
    headerBg: 'from-purple-950/60 to-violet-950/60 border-purple-800/40',
    buttonBg: 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700',
  },
  berry: {
    bubble: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white',
    text: 'text-purple-600',
    headerBg: 'from-purple-50 to-pink-50 border-purple-200',
    buttonBg: 'bg-purple-600 hover:bg-purple-700',
  },
  sunset: {
    bubble: 'bg-gradient-to-r from-orange-500 to-rose-500 text-white',
    text: 'text-orange-600',
    headerBg: 'from-orange-50 to-rose-50 border-orange-200',
    buttonBg: 'bg-orange-600 hover:bg-orange-700',
  },
  emerald: {
    bubble: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white',
    text: 'text-emerald-600',
    headerBg: 'from-emerald-50 to-teal-50 border-emerald-200',
    buttonBg: 'bg-emerald-600 hover:bg-emerald-700',
  },
  default: {
    bubble: 'bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700 text-white',
    text: 'text-purple-400',
    headerBg: 'from-purple-950/60 to-violet-950/60 border-purple-800/40',
    buttonBg: 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700',
  },
};

export const GroupMessengerChat: React.FC<GroupMessengerChatProps> = ({
  groups,
  activeGroupId,
  onSelectGroup,
  groupChats,
  currentUser,
  onSendGroupMessage,
  onToggleReaction,
  onOpenGroupSettings,
  onCreateGroupClick,
  onJumpToMeeting,
  onGoToGroupPosts,
  onAddUserToGroup,
  themeMode = 'dark',
}) => {
  const isDark = themeMode !== 'light';
  const [inputText, setInputText] = useState('');
  const [activeReactionMessageId, setActiveReactionMessageId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeGroup = groups.find((g) => g.id === activeGroupId) || groups[0];
  const currentUserName = currentUser?.name || 'Aung Myint';

  // Filter messages for current group
  const messages = groupChats.filter((m) => m.groupId === (activeGroup?.id || ''));

  const themeStyle = THEME_STYLES[activeGroup?.chatTheme || 'ocean'] || THEME_STYLES.ocean;

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, activeGroupId]);

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !attachedImage) return;
    if (!activeGroup) return;

    onSendGroupMessage(activeGroup.id, inputText.trim(), attachedImage || undefined);
    setInputText('');
    setAttachedImage(null);

    // Simulate occasional friendly bot / member typing response in group
    if (Math.random() > 0.6) {
      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
        }, 2200);
      }, 1000);
    }
  };

  const handleSendQuickThumbsUp = () => {
    if (!activeGroup) return;
    onSendGroupMessage(activeGroup.id, '👍');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAttachedImage(url);
    }
  };

  if (!activeGroup) {
    return (
      <div className={`flex-1 flex flex-col items-center justify-center p-8 text-center ${
        isDark ? 'bg-[#06020c] text-neutral-300' : 'text-neutral-500'
      }`}>
        <Users className={`w-12 h-12 mb-3 ${isDark ? 'text-purple-400/50' : 'text-neutral-300'}`} />
        <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-neutral-800'}`}>No Groups Found</h3>
        <p className={`text-xs mt-1 max-w-xs ${isDark ? 'text-purple-300/60' : 'text-neutral-500'}`}>
          Create or join a group to start group discussions and chat.
        </p>
        <button
          type="button"
          onClick={onCreateGroupClick}
          className="mt-4 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Group</span>
        </button>
      </div>
    );
  }

  const isMember = activeGroup.members.includes(currentUserName) || activeGroup.members.includes('You');

  return (
    <div className={`flex-1 flex flex-col h-full overflow-hidden items-center ${isDark ? 'bg-[#06020c]' : 'bg-neutral-50/50'}`}>
      <div className={`w-full max-w-3xl sm:max-w-4xl flex-1 flex flex-col min-h-0 sm:border-x shadow-2xs overflow-hidden ${
        isDark ? 'bg-[#090414] border-purple-900/30' : 'bg-white border-neutral-200/80'
      }`}>
      {/* 1. Group Header (Clean & Spacious) */}
      <div className={`px-4 py-2.5 border-b flex items-center justify-between gap-3 shrink-0 shadow-2xs ${
        isDark ? 'bg-[#0c051a] border-purple-900/30 text-white' : 'bg-white border-neutral-200 text-neutral-900'
      }`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <img
              src={activeGroup.avatar}
              alt={activeGroup.name}
              className="w-9 h-9 rounded-full object-cover border-2 border-purple-400/50 shadow-xs"
            />
            <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 ${
              isDark ? 'border-[#0c051a]' : 'border-white'
            }`} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                {activeGroup.name}
              </h3>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold shrink-0 ${
                isDark
                  ? 'bg-purple-950/60 text-purple-300 border border-purple-500/30'
                  : 'bg-purple-50 text-purple-700 border border-purple-200'
              }`}>
                {activeGroup.privacy === 'public' ? 'Public Group' : 'Private Group'}
              </span>
            </div>
            <p className={`text-[11px] truncate ${isDark ? 'text-purple-300/60' : 'text-neutral-500'}`}>
              {activeGroup.members.length} members · Admin: {activeGroup.admin}
              {activeGroup.pendingRequests.length > 0 && (
                <span className="ml-1.5 text-amber-400 font-bold">
                  ({activeGroup.pendingRequests.length} pending)
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Non-Member Notice Banner */}
      {!isMember && (
        <div className={`px-4 py-2 border-b text-xs flex items-center justify-between shrink-0 ${
          isDark
            ? 'bg-amber-950/40 border-amber-600/30 text-amber-200'
            : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}>
          <span>You are viewing this group chat as a guest. Join the group to chat freely!</span>
          <button
            type="button"
            onClick={() => onOpenGroupSettings(activeGroup)}
            className="px-3 py-1 rounded-lg bg-amber-600 text-white font-bold hover:bg-amber-700 cursor-pointer shadow-2xs"
          >
            Join Group
          </button>
        </div>
      )}

      {/* 3. Messages Stream Area with Shorts-Style Vertical Action Rail */}
      <div className={`flex-1 relative overflow-hidden flex flex-col ${isDark ? 'bg-[#090414]' : 'bg-transparent'}`}>
        {/* Messenger Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 pr-16">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-xs">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 ${
              isDark ? 'bg-purple-950/60 border border-purple-500/30 text-purple-300' : 'bg-purple-50 border border-purple-100 text-purple-600'
            }`}>
              <Users className="w-7 h-7" />
            </div>
            <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-neutral-800'}`}>Welcome to {activeGroup.name}!</p>
            <p className={`mt-1 max-w-xs ${isDark ? 'text-purple-300/60' : 'text-neutral-500'}`}>
              This is your official group chat. Say hello to your group members below!
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.isMe || msg.sender === currentUserName || msg.sender === 'Me';
            const reactions = msg.reactions || {};
            const hasReactions = Object.keys(reactions).length > 0;

            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end group`}
              >
                {/* Sender Avatar for others */}
                {!isMe && (
                  <img
                    src={
                      msg.senderAvatar ||
                      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face'
                    }
                    alt={msg.sender}
                    className="w-7 h-7 rounded-full object-cover border border-purple-400/30 shrink-0 mb-1"
                    title={msg.sender}
                  />
                )}

                <div className={`flex flex-col max-w-[80%] ${isMe ? 'items-end' : 'items-start'}`}>
                  {/* Sender Name above message bubble for group members */}
                  {!isMe && (
                    <span className={`text-[11px] font-bold px-2 mb-0.5 ${isDark ? 'text-purple-300/80' : 'text-neutral-600'}`}>
                      {msg.sender}
                    </span>
                  )}

                  {/* Bubble Container with hover reaction trigger */}
                  <div className="relative group/bubble">
                    <div
                      className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-xs transition ${
                        isMe
                          ? `${themeStyle.bubble} rounded-br-xs`
                          : isDark
                          ? 'bg-[#15092a] text-white border border-purple-500/25 rounded-bl-xs'
                          : 'bg-white text-neutral-900 border border-neutral-200/90 rounded-bl-xs'
                      }`}
                    >
                      {/* Attached Media Photo */}
                      {msg.mediaUrl && (
                        <div className="mb-2 rounded-xl overflow-hidden max-h-48 border border-white/20">
                          <img src={msg.mediaUrl} alt="Attached" className="w-full h-full object-cover" />
                        </div>
                      )}

                      <p className="whitespace-pre-wrap">{msg.message}</p>
                      <span
                        className={`text-[9px] mt-1 block text-right opacity-70 ${
                          isMe ? 'text-white' : isDark ? 'text-purple-300/50' : 'text-neutral-400'
                        }`}
                      >
                        {msg.time}
                      </span>
                    </div>

                    {/* Messenger Emoji Reaction Picker Bar (Hover / Toggle) */}
                    <div
                      className={`absolute bottom-full mb-1 ${
                        isMe ? 'right-0' : 'left-0'
                      } hidden group-hover/bubble:flex items-center gap-1 rounded-full px-2 py-1 shadow-lg z-20 animate-in fade-in zoom-in-95 ${
                        isDark ? 'bg-[#180a34] border border-purple-500/30 text-white' : 'bg-white border border-neutral-200'
                      }`}
                    >
                      {EMOJI_PICKER_OPTIONS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => onToggleReaction(msg.id, emoji)}
                          className="hover:scale-125 transition text-sm cursor-pointer p-0.5 active:scale-95"
                          title={`React ${emoji}`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>

                    {/* Rendered Reaction Badges */}
                    {hasReactions && (
                      <div
                        className={`flex items-center gap-1 mt-1 ${
                          isMe ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {Object.entries(reactions).map(([emoji, rawUsers]) => {
                          const users = (Array.isArray(rawUsers) ? rawUsers : []) as string[];
                          if (users.length === 0) return null;
                          const hasReacted = users.includes(currentUserName) || users.includes('Me');

                          return (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => onToggleReaction(msg.id, emoji)}
                              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold border transition cursor-pointer flex items-center gap-0.5 shadow-2xs ${
                                hasReacted
                                  ? isDark
                                    ? 'bg-purple-900/70 border-purple-400 text-purple-200'
                                    : 'bg-purple-50 border-purple-300 text-purple-700'
                                  : isDark
                                  ? 'bg-[#15092a] border-purple-900/40 text-purple-300 hover:bg-[#1d0d38]'
                                  : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                              }`}
                              title={`Reacted by: ${users.join(', ')}`}
                            >
                              <span>{emoji}</span>
                              <span>{users.length}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex items-center gap-2 text-xs pl-2">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '300ms' }} />
            <span className={`text-[11px] italic ${isDark ? 'text-purple-300/60' : 'text-neutral-500'}`}>
              Someone is typing in group...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
        </div>

        {/* Shorts-style Vertical Floating Action Rail (Right Side) */}
        <div className="absolute right-2.5 bottom-4 z-20 flex flex-col items-center gap-3 select-none pointer-events-auto animate-in fade-in slide-in-from-right-2 duration-200">
          {/* Add Member Button */}
          <div className="flex flex-col items-center">
            <button
              type="button"
              id="btn-shorts-add-member"
              onClick={() => setIsAddMemberModalOpen(true)}
              className={`w-10 h-10 rounded-full shadow-md hover:scale-105 active:scale-95 flex items-center justify-center transition cursor-pointer group ${
                isDark
                  ? 'bg-[#15092a]/95 hover:bg-[#1d0d38] text-purple-300 border border-purple-500/30'
                  : 'bg-white/95 hover:bg-purple-50 text-purple-700 border border-purple-200/90'
              }`}
              title="Add Member to Group"
            >
              <UserPlus className="w-4 h-4 transition-transform group-hover:scale-110" />
            </button>
            <span className={`text-[9px] font-bold mt-0.5 px-1 py-0.2 rounded shadow-2xs ${
              isDark ? 'bg-[#15092a]/90 text-purple-200 border border-purple-500/20' : 'bg-white/85 text-neutral-700'
            }`}>
              Add
            </span>
          </div>

          {/* Meet Button */}
          <div className="flex flex-col items-center">
            <button
              type="button"
              id="btn-shorts-meet"
              onClick={() => {
                if (activeGroup.linkedMeetingToken && onJumpToMeeting) {
                  onJumpToMeeting(activeGroup.linkedMeetingToken);
                } else if (onJumpToMeeting) {
                  onJumpToMeeting('#MEET-GROUP');
                }
              }}
              className={`w-10 h-10 rounded-full shadow-md hover:scale-105 active:scale-95 flex items-center justify-center transition cursor-pointer group ${
                isDark
                  ? 'bg-[#15092a]/95 hover:bg-emerald-950/40 text-emerald-400 border border-emerald-500/30'
                  : 'bg-white/95 hover:bg-emerald-50 text-emerald-600 border border-emerald-200/90'
              }`}
              title={`Live Meeting (${activeGroup.linkedMeetingToken || 'Room'})`}
            >
              <Video className="w-4 h-4 transition-transform group-hover:scale-110" />
            </button>
            <span className={`text-[9px] font-bold mt-0.5 px-1 py-0.2 rounded shadow-2xs ${
              isDark ? 'bg-[#15092a]/90 text-emerald-300 border border-emerald-500/20' : 'bg-white/85 text-neutral-700'
            }`}>
              Meet
            </span>
          </div>

          {/* Posts Button */}
          <div className="flex flex-col items-center">
            <button
              type="button"
              id="btn-shorts-posts"
              onClick={() => onGoToGroupPosts && onGoToGroupPosts(activeGroup.id)}
              className={`w-10 h-10 rounded-full shadow-md hover:scale-105 active:scale-95 flex items-center justify-center transition cursor-pointer group ${
                isDark
                  ? 'bg-[#15092a]/95 hover:bg-indigo-950/40 text-indigo-300 border border-indigo-500/30'
                  : 'bg-white/95 hover:bg-indigo-50 text-indigo-600 border border-indigo-200/90'
              }`}
              title="View Group Feed & Posts"
            >
              <Layers className="w-4 h-4 transition-transform group-hover:scale-110" />
            </button>
            <span className={`text-[9px] font-bold mt-0.5 px-1 py-0.2 rounded shadow-2xs ${
              isDark ? 'bg-[#15092a]/90 text-indigo-300 border border-indigo-500/20' : 'bg-white/85 text-neutral-700'
            }`}>
              Posts
            </span>
          </div>

          {/* Settings Button */}
          <div className="flex flex-col items-center relative">
            <button
              type="button"
              id="btn-shorts-settings"
              onClick={() => onOpenGroupSettings(activeGroup)}
              className={`w-10 h-10 rounded-full shadow-md hover:scale-105 active:scale-95 flex items-center justify-center transition cursor-pointer relative group ${
                isDark
                  ? 'bg-[#15092a]/95 hover:bg-purple-900/40 text-purple-300 border border-purple-500/30'
                  : 'bg-white/95 hover:bg-neutral-100 text-neutral-700 border border-neutral-200/90'
              }`}
              title="Group Settings, Members & Approvals"
            >
              <Settings className={`w-4 h-4 transition-transform group-hover:rotate-45 ${
                isDark ? 'text-purple-300' : 'text-neutral-700'
              }`} />
              {activeGroup.pendingRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-extrabold flex items-center justify-center shadow-xs animate-pulse">
                  {activeGroup.pendingRequests.length}
                </span>
              )}
            </button>
            <span className={`text-[9px] font-bold mt-0.5 px-1 py-0.2 rounded shadow-2xs ${
              isDark ? 'bg-[#15092a]/90 text-purple-200 border border-purple-500/20' : 'bg-white/85 text-neutral-700'
            }`}>
              Settings
            </span>
          </div>
        </div>
      </div>

      {/* 5. Image Attachment Preview */}
      {attachedImage && (
        <div className={`px-4 py-2 border-t flex items-center gap-3 ${
          isDark ? 'bg-[#0c051a] border-purple-900/30' : 'bg-white border-neutral-200'
        }`}>
          <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-purple-500/30">
            <img src={attachedImage} alt="Attachment" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => setAttachedImage(null)}
              className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/70 text-white rounded-full flex items-center justify-center text-[10px]"
            >
              ×
            </button>
          </div>
          <span className={`text-xs ${isDark ? 'text-purple-300/70' : 'text-neutral-500'}`}>Image attached to message</span>
        </div>
      )}

      {/* 6. CooM Messenger Input Bar */}
      <form
        onSubmit={handleSendMessage}
        className={`p-3 border-t flex items-center gap-2 shrink-0 shadow-2xs ${
          isDark ? 'bg-[#0c051a] border-purple-900/30' : 'bg-white border-neutral-200'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`p-2 rounded-xl transition cursor-pointer ${
            isDark ? 'text-purple-300 hover:text-white hover:bg-purple-900/30' : 'text-neutral-500 hover:text-purple-600 hover:bg-neutral-100'
          }`}
          title="Attach Photo"
        >
          <ImageIcon className="w-5 h-5" />
        </button>

        <div className="relative flex-1">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Message ${activeGroup.name}...`}
            className={`w-full rounded-2xl px-4 py-2.5 text-xs outline-none transition border ${
              isDark
                ? 'bg-[#15092a] hover:bg-[#1a0c35] focus:bg-[#1c0d3a] border-purple-500/25 text-white placeholder:text-purple-300/40 focus:border-purple-500'
                : 'bg-neutral-100 hover:bg-neutral-100/90 focus:bg-white border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:border-purple-600'
            }`}
          />
        </div>

        {inputText.trim() || attachedImage ? (
          <button
            type="submit"
            className={`p-2.5 rounded-2xl text-white transition shadow-sm cursor-pointer ${themeStyle.buttonBg}`}
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSendQuickThumbsUp}
            className={`p-2.5 rounded-2xl transition cursor-pointer ${
              isDark ? 'text-purple-400 hover:bg-purple-900/40' : 'text-purple-600 hover:bg-purple-50'
            }`}
            title="Send Like (👍)"
          >
            <ThumbsUp className="w-5 h-5 fill-purple-600" />
          </button>
        )}
      </form>

      {/* Add Member Modal */}
      {isAddMemberModalOpen && activeGroup && onAddUserToGroup && (
        <AddMemberModal
          isOpen={isAddMemberModalOpen}
          onClose={() => setIsAddMemberModalOpen(false)}
          group={activeGroup}
          currentUser={currentUser}
          onAddUserToGroup={onAddUserToGroup}
          themeMode={themeMode}
        />
      )}
      </div>
    </div>
  );
};
