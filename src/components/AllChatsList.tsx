import React, { useState, useMemo } from 'react';
import {
  Search,
  MessageSquare,
  ChevronRight,
  Filter,
  Users,
  Video,
  X,
  Sparkles,
} from 'lucide-react';
import {
  CooMGroup,
  MeetingRoom,
  GroupChatMessage,
  ChatMessage,
  UserProfile,
} from '../types';

interface AllChatsListProps {
  groups: CooMGroup[];
  rooms: MeetingRoom[];
  groupChats: GroupChatMessage[];
  roomChats: ChatMessage[];
  currentUser?: UserProfile;
  onOpenGroup: (groupId: string) => void;
  onOpenRoom: (roomToken: string) => void;
  themeMode?: 'dark' | 'light';
}

interface UnifiedItem {
  id: string;
  type: 'group' | 'room';
  title: string;
  avatar?: string;
  token?: string;
  lastSender?: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  participantsCount: number;
  hasActivity: boolean;
}

export const AllChatsList: React.FC<AllChatsListProps> = ({
  groups,
  rooms,
  groupChats,
  roomChats,
  currentUser,
  onOpenGroup,
  onOpenRoom,
  themeMode = 'dark',
}) => {
  const isDark = themeMode !== 'light';
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'groups' | 'rooms'>('all');

  // Build unified conversation list
  const conversations = useMemo(() => {
    const list: UnifiedItem[] = [];

    // 1. Group Conversations
    groups.forEach((grp) => {
      const msgs = groupChats.filter((m) => m.groupId === grp.id);
      const lastMsg = msgs[msgs.length - 1];
      const pendingCount = grp.pendingRequests?.length || 0;

      list.push({
        id: grp.id,
        type: 'group',
        title: grp.name,
        avatar: grp.avatar,
        lastSender: lastMsg?.sender,
        lastMessage:
          lastMsg?.text ||
          lastMsg?.message ||
          (lastMsg?.mediaUrl ? '📷 Shared photo' : 'Group active • Tap to chat'),
        time: lastMsg?.time || lastMsg?.timestamp || 'Recently',
        unreadCount: pendingCount,
        participantsCount: grp.members.length,
        hasActivity: msgs.length > 0,
      });
    });

    // 2. Room Conversations
    rooms.forEach((room) => {
      const msgs = roomChats.filter((c) => c.meetingToken === room.token);
      const lastMsg = msgs[msgs.length - 1];

      list.push({
        id: room.id,
        type: 'room',
        token: room.token,
        title: room.title ? `${room.title}` : `Meeting Room ${room.token}`,
        avatar: undefined,
        lastSender: lastMsg?.sender,
        lastMessage:
          lastMsg?.message ||
          'Live room open • Join discussion',
        time: lastMsg?.time || 'Active',
        unreadCount: 0,
        participantsCount: room.participants.length,
        hasActivity: msgs.length > 0,
      });
    });

    return list;
  }, [groups, rooms, groupChats, roomChats]);

  // Filter conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter((item) => {
      if (activeFilter === 'groups' && item.type !== 'group') return false;
      if (activeFilter === 'rooms' && item.type !== 'room') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchMsg = item.lastMessage.toLowerCase().includes(q);
        const matchSender = item.lastSender?.toLowerCase().includes(q);
        const matchToken = item.token?.toLowerCase().includes(q);
        return matchTitle || matchMsg || matchSender || matchToken;
      }

      return true;
    });
  }, [conversations, activeFilter, searchQuery]);

  const groupsCount = conversations.filter((c) => c.type === 'group').length;
  const roomsCount = conversations.filter((c) => c.type === 'room').length;

  return (
    <div className={`flex-1 flex flex-col h-full overflow-hidden items-center ${isDark ? 'bg-[#0B0F19]' : 'bg-slate-50'}`}>
      <div className={`w-full max-w-3xl sm:max-w-4xl flex-1 flex flex-col min-h-0 sm:border-x shadow-xs overflow-hidden ${
        isDark ? 'bg-[#0B0F19] border-slate-800' : 'bg-white border-slate-200'
      }`}>
      {/* Messenger-Style Search & Filter Header */}
      <div className={`p-3 border-b space-y-2.5 shrink-0 shadow-xs ${
        isDark ? 'bg-[#131B2E] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        {/* Search Bar */}
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-indigo-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            id="input-all-chats-search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search all group and room conversations..."
            className={`w-full text-xs pl-9 pr-8 py-2 rounded-xl border transition outline-none ${
              isDark
                ? 'bg-[#1E293B] hover:bg-[#25334D] focus:bg-[#25334D] border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30'
                : 'bg-slate-100 hover:bg-slate-100/80 focus:bg-white text-slate-900 border-slate-200 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20'
            }`}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 text-slate-400 hover:text-slate-200 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : isDark
                ? 'bg-[#1E293B] text-slate-400 hover:text-slate-200 hover:bg-[#25334D] border border-slate-700'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/80'
            }`}
          >
            <span>All</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                activeFilter === 'all'
                  ? 'bg-white/25 text-white'
                  : isDark
                  ? 'bg-[#0B0F19] text-slate-300'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {conversations.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('groups')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeFilter === 'groups'
                ? 'bg-indigo-600 text-white shadow-xs'
                : isDark
                ? 'bg-[#1E293B] text-slate-400 hover:text-slate-200 hover:bg-[#25334D] border border-slate-700'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/80'
            }`}
          >
            <Users className="w-3 h-3" />
            <span>Groups</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                activeFilter === 'groups'
                  ? 'bg-white/25 text-white'
                  : isDark
                  ? 'bg-[#0B0F19] text-slate-300'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {groupsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('rooms')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeFilter === 'rooms'
                ? 'bg-indigo-600 text-white shadow-xs'
                : isDark
                ? 'bg-[#1E293B] text-slate-400 hover:text-slate-200 hover:bg-[#25334D] border border-slate-700'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/80'
            }`}
          >
            <MessageSquare className="w-3 h-3" />
            <span>Rooms</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                activeFilter === 'rooms'
                  ? 'bg-white/25 text-white'
                  : isDark
                  ? 'bg-[#0B0F19] text-slate-300'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {roomsCount}
            </span>
          </button>
        </div>
      </div>

      {/* CooM Messenger Style Conversations List (Line by Line) */}
      <div className={`flex-1 overflow-y-auto p-2 sm:p-3 space-y-1.5 ${isDark ? 'bg-[#0B0F19]' : 'bg-transparent'}`}>
        {filteredConversations.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
              isDark ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-slate-100 text-slate-400'
            }`}>
              <Search className="w-5 h-5" />
            </div>
            <p className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>No chats found</p>
            <p className={`text-[11px] mt-1 max-w-[220px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {searchQuery
                ? `No conversation matches "${searchQuery}". Try different keywords.`
                : 'No conversation available in this filter.'}
            </p>
          </div>
        ) : (
          filteredConversations.map((item) => {
            const isGroup = item.type === 'group';

            return (
              <button
                key={`${item.type}-${item.id}`}
                type="button"
                id={`all-chat-item-${item.type}-${item.id}`}
                onClick={() => {
                  if (isGroup) {
                    onOpenGroup(item.id);
                  } else if (item.token) {
                    onOpenRoom(item.token);
                  }
                }}
                className={`w-full px-3 py-2.5 rounded-2xl flex items-center gap-3 transition cursor-pointer shadow-xs text-left group select-none ${
                  isDark
                    ? 'bg-[#131B2E] hover:bg-[#1A243B] border border-slate-800 hover:border-slate-700 text-slate-100'
                    : 'bg-white hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-200 text-slate-900'
                }`}
              >
                {/* Avatar with Type Badge */}
                <div className="relative shrink-0">
                  {isGroup && item.avatar ? (
                    <img
                      src={item.avatar}
                      alt={item.title}
                      className="w-11 h-11 rounded-2xl object-cover border border-slate-700 shadow-xs group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                  )}

                  {/* Micro Type Badge */}
                  <span
                    className={`absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full text-[8px] font-black uppercase text-white shadow-xs border ${
                      isDark ? 'border-[#131B2E]' : 'border-white'
                    } ${isGroup ? 'bg-indigo-600' : 'bg-slate-700'}`}
                  >
                    {isGroup ? 'Group' : 'Room'}
                  </span>
                </div>

                {/* Content Details (Line by Line) */}
                <div className="flex-1 min-w-0">
                  {/* Row 1: Title + Timestamp */}
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className={`text-xs font-bold truncate group-hover:text-indigo-400 transition ${
                      isDark ? 'text-slate-100' : 'text-slate-900'
                    }`}>
                      {item.title}
                    </span>
                    <span className={`text-[10px] font-medium shrink-0 ml-1 ${
                      isDark ? 'text-slate-400' : 'text-slate-400'
                    }`}>
                      {item.time}
                    </span>
                  </div>

                  {/* Row 2: Sender & Last Message Preview */}
                  <p className={`text-xs truncate flex items-center gap-1 ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    {item.lastSender && (
                      <span className={`font-semibold shrink-0 ${
                        isDark ? 'text-indigo-300' : 'text-slate-800'
                      }`}>
                        {item.lastSender === (currentUser?.name || 'Aung Myint') || item.lastSender === 'Me'
                          ? 'You'
                          : item.lastSender}
                        :
                      </span>
                    )}
                    <span className="truncate">{item.lastMessage}</span>
                  </p>

                  {/* Row 3: Meta (Participants count) */}
                  <div className={`flex items-center gap-1.5 mt-0.5 text-[10px] ${
                    isDark ? 'text-slate-400' : 'text-slate-400'
                  }`}>
                    <span>
                      {item.participantsCount} {isGroup ? 'members' : 'participants'}
                    </span>
                    {!isGroup && item.token && (
                      <>
                        <span>·</span>
                        <span className={`font-mono font-bold ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>{item.token}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right Arrow / Unread Pill */}
                <div className="shrink-0 flex items-center gap-1.5">
                  {item.unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-black shadow-xs animate-pulse">
                      {item.unreadCount} new
                    </span>
                  )}
                  <ChevronRight className={`w-4 h-4 transition-all ${
                    isDark ? 'text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5' : 'text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5'
                  }`} />
                </div>
              </button>
            );
          })
        )}
      </div>
      </div>
    </div>
  );
};
