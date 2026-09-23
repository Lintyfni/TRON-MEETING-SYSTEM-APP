import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  User,
  Filter,
  ArrowLeft,
  X,
  Sparkles,
  Video,
  Users,
  Plus,
  ChevronDown,
  Check,
  Layers,
} from 'lucide-react';
import { ChatMessage, MeetingRoom, CooMGroup, GroupChatMessage, UserProfile } from '../types';
import { GroupMessengerChat } from './GroupMessengerChat';
import { AllChatsList } from './AllChatsList';
import { CreateGroupModal } from './CreateGroupModal';
import { GroupSettingsModal } from './GroupSettingsModal';

interface MeetingChatScreenProps {
  rooms: MeetingRoom[];
  chats: ChatMessage[];
  activeRoomToken: string;
  onSendMessage: (roomToken: string, text: string, recipient?: string) => void;
  onJumpToMeeting?: (roomToken: string) => void;
  // CooM Group Chat Props
  groups?: CooMGroup[];
  activeGroupId?: string;
  onSelectGroup?: (groupId: string) => void;
  groupChats?: GroupChatMessage[];
  currentUser?: UserProfile;
  onSendGroupMessage?: (groupId: string, text: string, mediaUrl?: string) => void;
  onToggleGroupReaction?: (messageId: string, emoji: string) => void;
  onUpdateGroup?: (groupId: string, updates: Partial<CooMGroup>) => void;
  onAddUserToGroup?: (groupId: string, userName: string) => void;
  onRemoveUserFromGroup?: (groupId: string, userName: string) => void;
  onApproveRequest?: (groupId: string, userName: string) => void;
  onDeclineRequest?: (groupId: string, userName: string) => void;
  onLeaveGroup?: (groupId: string) => void;
  onCreateGroup?: (groupData: any) => void;
  onGoToGroupPosts?: (groupId: string) => void;
}

export const MeetingChatScreen: React.FC<MeetingChatScreenProps> = ({
  rooms,
  chats,
  activeRoomToken,
  onSendMessage,
  onJumpToMeeting,
  groups = [],
  activeGroupId,
  onSelectGroup,
  groupChats = [],
  currentUser,
  onSendGroupMessage,
  onToggleGroupReaction,
  onUpdateGroup,
  onAddUserToGroup,
  onRemoveUserFromGroup,
  onApproveRequest,
  onDeclineRequest,
  onLeaveGroup,
  onCreateGroup,
  onGoToGroupPosts,
  themeMode = 'dark',
}) => {
  const isDark = themeMode !== 'light';
  const [chatMode, setChatMode] = useState<'groups' | 'rooms' | 'all'>('groups');
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<string>(activeRoomToken || 'ALL');
  const [directUser, setDirectUser] = useState<string | null>(null);
  const [inputText, setInputText] = useState<string>('');
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [groupForSettings, setGroupForSettings] = useState<CooMGroup | null>(null);
  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);
  const [isRoomFilterDropdownOpen, setIsRoomFilterDropdownOpen] = useState(false);
  const [selectedGroupIdState, setSelectedGroupIdState] = useState<string>(activeGroupId || groups[0]?.id || '');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (activeGroupId) {
      setSelectedGroupIdState(activeGroupId);
    } else if (!selectedGroupIdState && groups.length > 0) {
      setSelectedGroupIdState(groups[0].id);
    }
  }, [activeGroupId, groups]);

  const currentActiveGroup = groups.find((g) => g.id === (selectedGroupIdState || activeGroupId)) || groups[0];
  const totalPendingRequests = groups.reduce((acc, g) => acc + (g.pendingRequests?.length || 0), 0);
  const myGroupsCount = groups.filter((g) => g.members.includes(currentUser?.name || 'Aung Myint') || g.members.includes('You')).length;
  const notiCount = totalPendingRequests > 0 ? totalPendingRequests : myGroupsCount;

  // Auto-scroll when messages update
  useEffect(() => {
    if (chatMode === 'rooms') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chats, directUser, selectedRoomFilter, chatMode]);

  // Current active room object
  const activeRoomObj = rooms.find((r) => r.token === selectedRoomFilter);

  // List of participants for 1-on-1 direct chips
  const participants = activeRoomObj
    ? activeRoomObj.participants
    : Array.from(new Set(rooms.flatMap((r) => r.participants)));

  // Filter messages
  const filteredChats = chats.filter((msg) => {
    // 1-on-1 direct filter
    if (directUser) {
      const isWithDirectUser =
        (msg.sender === directUser && (msg.recipient === 'Me' || !msg.recipient)) ||
        (msg.sender === 'Me' && msg.recipient === directUser);
      return isWithDirectUser;
    }

    // Meeting # filter
    if (selectedRoomFilter === 'ALL') {
      return !msg.isDirect; // public messages across all rooms
    }

    return msg.meetingToken === selectedRoomFilter && !msg.isDirect;
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const targetToken =
      selectedRoomFilter === 'ALL'
        ? activeRoomToken || rooms[0]?.token || '#MEET-9021'
        : selectedRoomFilter;

    onSendMessage(targetToken, inputText.trim(), directUser || undefined);
    setInputText('');
  };

  return (
    <div
      id="meeting-chat-screen"
      className={`w-full h-full flex flex-col overflow-hidden animate-in fade-in duration-200 ${
        isDark ? 'bg-[#06020c] text-white' : 'bg-neutral-50 text-neutral-900'
      }`}
    >
      {/* 1. Top Header with Centered Equal-Sized Mode Switcher (Groups / Rooms / All Chats) */}
      <header className={`px-3 py-2 border-b flex items-center justify-center shrink-0 shadow-2xs ${
        isDark ? 'bg-[#0c051a] border-purple-900/30' : 'bg-white border-neutral-200'
      }`}>
        {/* Centered Mode Switcher - 3 Equal Size & Symmetrical Buttons */}
        <div className={`w-full max-w-sm sm:max-w-md md:max-w-lg flex items-center p-1 rounded-2xl shadow-2xs gap-1 border ${
          isDark ? 'bg-[#15092a] border-purple-900/40' : 'bg-neutral-100/90 border-neutral-200/90'
        }`}>
          {/* Groups Tab with Dropdown Filter */}
          <div className="flex-1 relative">
            <button
              type="button"
              id="btn-group-dropdown-filter"
              onClick={() => {
                setChatMode('groups');
                setIsGroupDropdownOpen((prev) => !prev);
                setIsRoomFilterDropdownOpen(false);
              }}
              className={`w-full h-8.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none ${
                chatMode === 'groups'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : isDark
                  ? 'text-purple-300/80 hover:text-white hover:bg-purple-900/30'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/50'
              }`}
              title="Click to Filter Groups"
            >
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span>Groups</span>
              {notiCount > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-black text-white shrink-0 ${
                    chatMode === 'groups' ? 'bg-white/25' : 'bg-purple-600'
                  }`}
                >
                  {notiCount}
                </span>
              )}
              <ChevronDown
                className={`w-3 h-3 shrink-0 transition-transform duration-150 ${
                  isGroupDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu - Line by Line Group Names */}
            {isGroupDropdownOpen && (
              <>
                {/* Backdrop to close when clicking outside */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsGroupDropdownOpen(false)}
                />

                <div className={`absolute left-0 sm:-left-4 top-full mt-2 w-72 sm:w-80 max-h-84 rounded-2xl shadow-2xl border z-50 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-150 ${
                  isDark ? 'bg-[#15092a] border-purple-500/30 text-white' : 'bg-white border-neutral-200 text-neutral-900'
                }`}>
                  {/* Dropdown Header */}
                  <div className={`px-3.5 py-2.5 border-b flex items-center justify-between ${
                    isDark ? 'bg-[#1a0c34] border-purple-900/40' : 'bg-neutral-50 border-neutral-100'
                  }`}>
                    <span className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                      isDark ? 'text-purple-300' : 'text-neutral-600'
                    }`}>
                      <Filter className="w-3 h-3 text-purple-400" />
                      Select Group
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isDark ? 'bg-purple-950/70 text-purple-300 border-purple-500/30' : 'bg-purple-50 text-purple-700 border-purple-200/60'
                    }`}>
                      {groups.length} groups
                    </span>
                  </div>

                  {/* Groups List (Line by Line) */}
                  <div className={`overflow-y-auto max-h-60 py-1 divide-y ${isDark ? 'divide-purple-900/30' : 'divide-neutral-100'}`}>
                    {groups.map((grp) => {
                      const isSelected = grp.id === currentActiveGroup?.id;
                      const pendingCount = grp.pendingRequests?.length || 0;

                      return (
                        <button
                          key={grp.id}
                          type="button"
                          onClick={() => {
                            setSelectedGroupIdState(grp.id);
                            if (onSelectGroup) onSelectGroup(grp.id);
                            setChatMode('groups');
                            setIsGroupDropdownOpen(false);
                          }}
                          className={`w-full px-3.5 py-2.5 text-left flex items-center gap-2.5 transition cursor-pointer ${
                            isSelected
                              ? isDark
                                ? 'bg-purple-900/50 text-purple-200 font-bold'
                                : 'bg-purple-50 text-purple-900 font-bold'
                              : isDark
                              ? 'hover:bg-purple-900/30 text-neutral-200'
                              : 'hover:bg-neutral-50 text-neutral-800'
                          }`}
                        >
                          <img
                            src={grp.avatar}
                            alt={grp.name}
                            className="w-8 h-8 rounded-full object-cover border border-purple-400/40 shrink-0 shadow-2xs"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className={`text-xs truncate font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                                {grp.name}
                              </span>
                              {isSelected && (
                                <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                              )}
                            </div>
                            <div className={`flex items-center gap-1.5 text-[10px] mt-0.5 ${isDark ? 'text-purple-300/60' : 'text-neutral-500'}`}>
                              <span>{grp.members.length} members</span>
                              <span>·</span>
                              <span className="capitalize">{grp.privacy}</span>
                              {pendingCount > 0 && (
                                <span className="ml-auto text-[9px] px-1.5 py-0.2 rounded-full bg-red-500 text-white font-black shrink-0">
                                  {pendingCount} new
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Create New Group Option at bottom */}
                  <div className={`p-2 border-t ${isDark ? 'border-purple-900/40 bg-[#120724]' : 'border-neutral-100 bg-neutral-50/70'}`}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsGroupDropdownOpen(false);
                        setIsCreateGroupModalOpen(true);
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create New Group</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Rooms Tab - Equal Size */}
          <div className="flex-1">
            <button
              type="button"
              id="btn-chat-mode-rooms"
              onClick={() => {
                setChatMode('rooms');
                setIsGroupDropdownOpen(false);
                setIsRoomFilterDropdownOpen(false);
              }}
              className={`w-full h-8.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none ${
                chatMode === 'rooms'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : isDark
                  ? 'text-purple-300/80 hover:text-white hover:bg-purple-900/30'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/50'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 shrink-0" />
              <span>Rooms</span>
            </button>
          </div>

          {/* All Chats Tab - Equal Size */}
          <div className="flex-1">
            <button
              type="button"
              id="btn-chat-mode-all"
              onClick={() => {
                setChatMode('all');
                setIsGroupDropdownOpen(false);
                setIsRoomFilterDropdownOpen(false);
              }}
              className={`w-full h-8.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none ${
                chatMode === 'all'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : isDark
                  ? 'text-purple-300/80 hover:text-white hover:bg-purple-900/30'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span>All Chats</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. CHAT CONTENT BASED ON MODE */}
      {chatMode === 'groups' ? (
        <GroupMessengerChat
          groups={groups}
          activeGroupId={selectedGroupIdState || activeGroupId || groups[0]?.id || ''}
          onSelectGroup={(id) => {
            setSelectedGroupIdState(id);
            if (onSelectGroup) onSelectGroup(id);
          }}
          groupChats={groupChats}
          currentUser={currentUser}
          onSendGroupMessage={(groupId, text, mediaUrl) =>
            onSendGroupMessage && onSendGroupMessage(groupId, text, mediaUrl)
          }
          onToggleReaction={(msgId, emoji) =>
            onToggleGroupReaction && onToggleGroupReaction(msgId, emoji)
          }
          onOpenGroupSettings={(grp) => setGroupForSettings(grp)}
          onCreateGroupClick={() => setIsCreateGroupModalOpen(true)}
          onJumpToMeeting={onJumpToMeeting}
          onGoToGroupPosts={onGoToGroupPosts}
          onAddUserToGroup={onAddUserToGroup}
          themeMode={themeMode}
        />
      ) : chatMode === 'all' ? (
        <AllChatsList
          groups={groups}
          rooms={rooms}
          groupChats={groupChats}
          roomChats={chats}
          currentUser={currentUser}
          themeMode={themeMode}
          onOpenGroup={(groupId) => {
            setSelectedGroupIdState(groupId);
            if (onSelectGroup) onSelectGroup(groupId);
            setChatMode('groups');
          }}
          onOpenRoom={(roomToken) => {
            setSelectedRoomFilter(roomToken);
            setDirectUser(null);
            setChatMode('rooms');
          }}
        />
      ) : (
        /* Room Chats Stream */
        <div className={`flex-1 flex flex-col overflow-hidden items-center ${isDark ? 'bg-[#06020c]' : 'bg-neutral-50/50'}`}>
          <div className={`w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl flex-1 flex flex-col min-h-0 sm:border-x shadow-2xs overflow-hidden ${
            isDark ? 'bg-[#090414] border-purple-900/30' : 'bg-white border-neutral-200/80'
          }`}>
          {/* Full-width All Room Filter Bar with long readable title */}
          <div className={`px-3 py-2 border-b shrink-0 shadow-2xs ${
            isDark ? 'bg-[#0c051a] border-purple-900/30' : 'bg-white border-neutral-200'
          }`}>
            <div className="relative w-full">
              <button
                type="button"
                id="btn-all-room-filter-fullwidth"
                onClick={() => setIsRoomFilterDropdownOpen((prev) => !prev)}
                className={`w-full min-h-[42px] px-3.5 py-1.5 rounded-xl border flex items-center justify-between gap-3 transition cursor-pointer shadow-2xs text-left ${
                  isDark
                    ? 'border-purple-500/30 bg-[#15092a] hover:bg-[#1c0d38] hover:border-purple-400 focus:bg-[#1d0e3a]'
                    : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100/80 hover:border-purple-300 focus:bg-white'
                }`}
                title="Click to select or change room filter"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 border ${
                    isDark
                      ? 'bg-purple-950/70 text-purple-300 border-purple-500/30'
                      : 'bg-purple-100 text-purple-700 border-purple-200'
                  }`}>
                    <Filter className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                        {selectedRoomFilter === 'ALL'
                          ? `All Room (Combined Public Feed Across ${rooms.length} Rooms)`
                          : `#${selectedRoomFilter} • ${activeRoomObj?.title || 'Meeting Room'}`}
                      </span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold shrink-0 ${
                        isDark ? 'bg-purple-950/70 text-purple-300 border border-purple-500/30' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {selectedRoomFilter === 'ALL'
                          ? 'Public Feed'
                          : `${activeRoomObj?.participants.length || 0} Members`}
                      </span>
                    </div>
                    <p className={`text-[10px] truncate mt-0.5 ${isDark ? 'text-purple-300/60' : 'text-neutral-500'}`}>
                      {selectedRoomFilter === 'ALL'
                        ? 'Showing public messages across all rooms • Click to choose a specific room'
                        : `Viewing messages for #${selectedRoomFilter} (${activeRoomObj?.participants.length || 0} active participants) • Click to switch`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 pl-2">
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-150 ${
                      isDark ? 'text-purple-300' : 'text-neutral-500'
                    } ${isRoomFilterDropdownOpen ? 'rotate-180 text-purple-400' : ''}`}
                  />
                </div>
              </button>

              {/* Full-width All Room Filter Dropdown */}
              {isRoomFilterDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsRoomFilterDropdownOpen(false)}
                  />
                  <div className={`absolute left-0 right-0 top-full mt-1.5 w-full rounded-2xl shadow-xl border z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-150 max-h-72 flex flex-col ${
                    isDark ? 'bg-[#15092a] border-purple-500/30 text-white' : 'bg-white border-neutral-200 text-neutral-900'
                  }`}>
                    <div className={`px-3.5 py-2 border-b flex items-center justify-between ${
                      isDark ? 'bg-[#1a0c34] border-purple-900/40' : 'bg-neutral-50 border-neutral-100'
                    }`}>
                      <span className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                        isDark ? 'text-purple-300' : 'text-neutral-500'
                      }`}>
                        <Filter className="w-3 h-3 text-purple-400" />
                        Choose Room Filter
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isDark ? 'bg-purple-950/70 text-purple-300 border-purple-500/30' : 'bg-purple-50 text-purple-700 border-purple-200/60'
                      }`}>
                        {rooms.length} Rooms
                      </span>
                    </div>

                    <div className={`overflow-y-auto py-1 divide-y ${isDark ? 'divide-purple-900/30' : 'divide-neutral-100'}`}>
                      {/* Option 1: All Room */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedRoomFilter('ALL');
                          setDirectUser(null);
                          setIsRoomFilterDropdownOpen(false);
                        }}
                        className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between text-xs transition cursor-pointer ${
                          selectedRoomFilter === 'ALL'
                            ? isDark
                              ? 'bg-purple-900/60 text-purple-200 font-bold'
                              : 'bg-purple-50 text-purple-900 font-bold'
                            : isDark
                            ? 'hover:bg-purple-900/30 text-neutral-200'
                            : 'hover:bg-neutral-50 text-neutral-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                            isDark ? 'bg-purple-950/70 text-purple-300' : 'bg-purple-100 text-purple-700'
                          }`}>
                            <MessageSquare className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className={`font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>All Room</div>
                            <div className={`text-[10px] truncate ${isDark ? 'text-purple-300/60' : 'text-neutral-500'}`}>
                              Combined public feed across all {rooms.length} active meeting rooms
                            </div>
                          </div>
                        </div>
                        {selectedRoomFilter === 'ALL' && (
                          <Check className="w-4 h-4 text-purple-400 shrink-0 ml-2" />
                        )}
                      </button>

                      {/* Option 2..N: Individual Rooms */}
                      {rooms.map((r) => {
                        const isSelected = selectedRoomFilter === r.token;
                        return (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => {
                              setSelectedRoomFilter(r.token);
                              setDirectUser(null);
                              setIsRoomFilterDropdownOpen(false);
                            }}
                            className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between text-xs transition cursor-pointer ${
                              isSelected
                                ? isDark
                                  ? 'bg-purple-900/60 text-purple-200 font-bold'
                                  : 'bg-purple-50 text-purple-900 font-bold'
                                : isDark
                                ? 'hover:bg-purple-900/30 text-neutral-200'
                                : 'hover:bg-neutral-50 text-neutral-800'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono font-bold text-xs shrink-0 border ${
                                isDark
                                  ? 'bg-purple-950/60 text-purple-300 border-purple-500/30'
                                  : 'bg-neutral-100 text-purple-600 border-neutral-200'
                              }`}>
                                #
                              </div>
                              <div className="min-w-0">
                                <div className={`font-bold flex items-center gap-1.5 truncate ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                                  <span className="font-mono text-purple-400 font-bold">{r.token}</span>
                                  {r.title && <span className="truncate">• {r.title}</span>}
                                </div>
                                <div className={`text-[10px] truncate ${isDark ? 'text-purple-300/60' : 'text-neutral-500'}`}>
                                  {r.participants.length} participants active • {r.type || 'Meeting'}
                                </div>
                              </div>
                            </div>
                            {isSelected && (
                              <Check className="w-4 h-4 text-purple-400 shrink-0 ml-2" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Active 1:1 Direct Chat Banner */}
          {directUser && (
            <div className={`px-4 py-1.5 border-b flex items-center justify-between text-xs shrink-0 animate-in fade-in ${
              isDark
                ? 'bg-purple-950/60 border-purple-800/40 text-purple-200'
                : 'bg-purple-50 border-purple-200 text-purple-800'
            }`}>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                <span>
                  Direct 1-on-1 chat with <strong>@{directUser}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setDirectUser(null)}
                className={`text-[11px] underline cursor-pointer font-medium ${
                  isDark ? 'text-purple-300 hover:text-white' : 'text-purple-700 hover:text-purple-900'
                }`}
              >
                Switch to Room Chat
              </button>
            </div>
          )}

          {/* Messages Stream */}
          <div className={`flex-1 overflow-y-auto p-4 space-y-3 ${isDark ? 'bg-[#090414]' : 'bg-neutral-50/40'}`}>
            {filteredChats.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-xs text-center p-8">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 border ${
                  isDark ? 'bg-purple-950/70 text-purple-300 border-purple-500/30' : 'bg-purple-50 text-purple-600 border-purple-100'
                }`}>
                  <MessageSquare className="w-6 h-6" />
                </div>
                <span className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-neutral-800'}`}>
                  No messages yet
                </span>
                <span className={`mt-1 max-w-[240px] ${isDark ? 'text-purple-300/60' : 'text-neutral-500'}`}>
                  {directUser
                    ? `Start your direct 1-on-1 chat with @${directUser} below.`
                    : `Be the first to send a message in ${selectedRoomFilter}!`}
                </span>
              </div>
            ) : (
              filteredChats.map((msg) => {
                const isMe = msg.isMe || msg.sender === 'Me';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      {!isMe && (
                        <button
                          type="button"
                          onClick={() => setDirectUser(msg.sender)}
                          className={`text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                            isDark ? 'text-purple-300 hover:text-white' : 'text-neutral-700 hover:text-purple-600'
                          }`}
                          title={`Click to direct chat with @${msg.sender}`}
                        >
                          <div className="w-4 h-4 rounded-full bg-purple-100 text-purple-700 border border-purple-200 flex items-center justify-center text-[9px]">
                            {msg.sender[0]}
                          </div>
                          <span>{msg.sender}</span>
                        </button>
                      )}
                      {msg.isDirect && (
                        <span className={`text-[9px] px-1 rounded font-bold border ${
                          isDark ? 'bg-purple-950/80 text-purple-300 border-purple-500/30' : 'bg-purple-100 text-purple-700 border-purple-200'
                        }`}>
                          1:1 Direct
                        </span>
                      )}
                      <span className={`text-[10px] ${isDark ? 'text-purple-300/50' : 'text-neutral-400'}`}>{msg.time}</span>
                      {selectedRoomFilter === 'ALL' && (
                        <span className={`text-[9px] font-mono px-1 rounded border ${
                          isDark ? 'text-purple-300 bg-purple-950/60 border-purple-500/30' : 'text-purple-700 bg-purple-50 border-purple-200'
                        }`}>
                          {msg.meetingToken}
                        </span>
                      )}
                    </div>

                    <div
                      className={`max-w-[82%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed shadow-xs ${
                        isMe
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-xs'
                          : isDark
                          ? 'bg-[#15092a] text-white border border-purple-500/25 rounded-bl-xs'
                          : 'bg-white text-neutral-900 border border-neutral-200 rounded-bl-xs'
                      }`}
                    >
                      <p>{msg.message}</p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 6. Input Form */}
          <form
            onSubmit={handleSend}
            className={`p-3 border-t flex items-center gap-2 shrink-0 ${
              isDark ? 'bg-[#0c051a] border-purple-900/30' : 'bg-white border-neutral-200'
            }`}
          >
            <div className="relative flex-1">
              <input
                id="input-screen-chat"
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  directUser
                    ? `Direct message to @${directUser}...`
                    : `Message ${selectedRoomFilter === 'ALL' ? '#Global' : selectedRoomFilter}...`
                }
                className={`w-full rounded-xl px-3 py-2.5 text-xs outline-none transition border ${
                  isDark
                    ? 'bg-[#15092a] border-purple-500/30 text-white placeholder:text-purple-300/40 focus:border-purple-500'
                    : 'bg-neutral-50 border-neutral-300 text-neutral-900 placeholder:text-neutral-400 focus:border-purple-600'
                }`}
              />
              {directUser && (
                <span className={`absolute right-2.5 top-2.5 text-[10px] px-1.5 py-0.2 rounded font-mono font-medium border ${
                  isDark ? 'bg-purple-950/80 text-purple-300 border-purple-500/30' : 'bg-purple-100 text-purple-700 border-purple-200'
                }`}>
                  @{directUser}
                </span>
              )}
            </div>

            <button
              id="btn-screen-send-chat"
              type="submit"
              disabled={!inputText.trim()}
              className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-40 text-white transition shrink-0 cursor-pointer shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {isCreateGroupModalOpen && (
        <CreateGroupModal
          isOpen={isCreateGroupModalOpen}
          onClose={() => setIsCreateGroupModalOpen(false)}
          currentUser={currentUser}
          rooms={rooms}
          onCreateGroup={(data) => {
            if (onCreateGroup) onCreateGroup(data);
            setIsCreateGroupModalOpen(false);
          }}
          themeMode={themeMode}
        />
      )}

      {/* Group Settings & Members Modal */}
      {groupForSettings && (
        <GroupSettingsModal
          isOpen={Boolean(groupForSettings)}
          onClose={() => setGroupForSettings(null)}
          group={groups.find((g) => g.id === groupForSettings.id) || groupForSettings}
          currentUser={currentUser}
          onUpdateGroup={(groupId, updates) => onUpdateGroup && onUpdateGroup(groupId, updates)}
          onAddUserToGroup={(groupId, userName) => onAddUserToGroup && onAddUserToGroup(groupId, userName)}
          onRemoveUserFromGroup={(groupId, userName) =>
            onRemoveUserFromGroup && onRemoveUserFromGroup(groupId, userName)
          }
          onApproveRequest={(groupId, userName) => onApproveRequest && onApproveRequest(groupId, userName)}
          onDeclineRequest={(groupId, userName) => onDeclineRequest && onDeclineRequest(groupId, userName)}
          onLeaveGroup={(groupId) => onLeaveGroup && onLeaveGroup(groupId)}
          themeMode={themeMode}
        />
      )}
    </div>
  );
};
