import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  User,
  Radio,
  ChevronDown,
  ArrowLeft,
  X,
  Sparkles,
  Video
} from 'lucide-react';
import { ChatMessage, MeetingRoom } from '../types';

interface MeetingChatScreenProps {
  rooms: MeetingRoom[];
  chats: ChatMessage[];
  activeRoomToken: string;
  onSendMessage: (roomToken: string, text: string, recipient?: string) => void;
  onJumpToMeeting?: (roomToken: string) => void;
}

export const MeetingChatScreen: React.FC<MeetingChatScreenProps> = ({
  rooms,
  chats,
  activeRoomToken,
  onSendMessage,
  onJumpToMeeting,
}) => {
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<string>(activeRoomToken || 'ALL');
  const [directUser, setDirectUser] = useState<string | null>(null);
  const [inputText, setInputText] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats, directUser, selectedRoomFilter]);

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
      className="w-full h-full bg-neutral-50 flex flex-col overflow-hidden text-neutral-900 animate-in fade-in duration-200"
    >
      {/* 1. Top Header */}
      <header className="px-4 py-3 bg-white border-b border-neutral-200 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 shrink-0">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold tracking-tight text-neutral-900 flex items-center gap-2 truncate">
              Meeting Chat
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-50 border border-purple-200 text-purple-700 font-bold">
                LIVE
              </span>
            </h2>
            <p className="text-[11px] text-neutral-500 truncate">
              {directUser ? `Direct 1:1 with @${directUser}` : 'Room conversation'}
            </p>
          </div>
        </div>

        {/* Quick Jump to Live Video Meeting */}
        {onJumpToMeeting && (
          <button
            type="button"
            onClick={() => onJumpToMeeting(selectedRoomFilter === 'ALL' ? activeRoomToken : selectedRoomFilter)}
            className="px-2.5 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold flex items-center gap-1.5 border border-neutral-200 transition"
            title="View Live Video Meeting"
          >
            <Video className="w-3.5 h-3.5 text-purple-600" />
            <span className="hidden sm:inline">Go to Video</span>
          </button>
        )}
      </header>

      {/* 2. Meeting # Filter Bar */}
      <div className="px-4 py-2 bg-neutral-100/70 border-b border-neutral-200 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-xs font-bold text-neutral-600 shrink-0">Meet #:</span>
          <div className="relative flex items-center flex-1 max-w-[240px]">
            <select
              id="select-screen-meeting"
              value={selectedRoomFilter}
              onChange={(e) => {
                setSelectedRoomFilter(e.target.value);
                setDirectUser(null);
              }}
              className="appearance-none w-full bg-white hover:bg-neutral-50 border border-neutral-300 text-neutral-900 font-bold text-xs pl-7 pr-6 py-1.5 rounded-xl cursor-pointer outline-none transition focus:ring-1 focus:ring-purple-500 truncate shadow-xs"
            >
              <option value="ALL" className="bg-white text-neutral-900">
                All Meetings (#Global)
              </option>
              {rooms.map((r) => (
                <option key={r.id} value={r.token} className="bg-white text-neutral-900">
                  {r.token} · {r.title}
                </option>
              ))}
            </select>
            <Radio className="w-3.5 h-3.5 text-purple-600 absolute left-2 pointer-events-none" />
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2 pointer-events-none" />
          </div>
        </div>

        <span className="text-[10px] font-mono text-neutral-500 font-medium">
          {filteredChats.length} msgs
        </span>
      </div>

      {/* 3. Direct 1-on-1 Participant Selector Chips */}
      <div className="px-4 py-2 bg-white border-b border-neutral-200 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
        <span className="text-[11px] font-semibold text-neutral-500 shrink-0 mr-1">
          Chat with:
        </span>
        <button
          type="button"
          onClick={() => setDirectUser(null)}
          className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 transition ${
            !directUser
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xs'
              : 'bg-neutral-100 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-200 border border-neutral-200/60'
          }`}
        >
          # Room Chat
        </button>
        {participants
          .filter((user) => user !== 'Me')
          .map((user) => {
            const isSelected = directUser === user;
            return (
              <button
                key={user}
                type="button"
                onClick={() => setDirectUser(user)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 transition flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xs'
                    : 'bg-neutral-100 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-200 border border-neutral-200/60'
                }`}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-purple-200 text-purple-800 flex items-center justify-center text-[9px] font-bold">
                  {user[0]}
                </div>
                <span>@{user}</span>
              </button>
            );
          })}
      </div>

      {/* 4. Active 1:1 Direct Chat Banner */}
      {directUser && (
        <div className="px-4 py-1.5 bg-purple-50 border-b border-purple-200 flex items-center justify-between text-xs text-purple-800 shrink-0 animate-in fade-in">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
            <span>
              Direct 1-on-1 chat with <strong>@{directUser}</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={() => setDirectUser(null)}
            className="text-[11px] text-purple-700 hover:text-purple-900 underline cursor-pointer font-medium"
          >
            Switch to Room Chat
          </button>
        </div>
      )}

      {/* 5. Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-50/40">
        {filteredChats.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-neutral-500 text-xs text-center p-8">
            <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 mb-2 border border-purple-100">
              <MessageSquare className="w-6 h-6" />
            </div>
            <span className="font-semibold text-neutral-800 text-sm">
              No messages yet
            </span>
            <span className="text-neutral-500 mt-1 max-w-[240px]">
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
                      className="text-[11px] font-bold text-neutral-700 hover:text-purple-600 transition cursor-pointer flex items-center gap-1"
                      title={`Click to direct chat with @${msg.sender}`}
                    >
                      <div className="w-4 h-4 rounded-full bg-purple-100 text-purple-700 border border-purple-200 flex items-center justify-center text-[9px]">
                        {msg.sender[0]}
                      </div>
                      <span>{msg.sender}</span>
                    </button>
                  )}
                  {msg.isDirect && (
                    <span className="text-[9px] bg-purple-100 text-purple-700 border border-purple-200 px-1 rounded font-bold">
                      1:1 Direct
                    </span>
                  )}
                  <span className="text-[10px] text-neutral-400">{msg.time}</span>
                  {selectedRoomFilter === 'ALL' && (
                    <span className="text-[9px] font-mono text-purple-700 bg-purple-50 border border-purple-200 px-1 rounded">
                      {msg.meetingToken}
                    </span>
                  )}
                </div>

                <div
                  className={`max-w-[82%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed shadow-xs ${
                    isMe
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-xs'
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
        className="p-3 bg-white border-t border-neutral-200 flex items-center gap-2 shrink-0"
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
            className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-purple-600 outline-none transition"
          />
          {directUser && (
            <span className="absolute right-2.5 top-2.5 text-[10px] bg-purple-100 text-purple-700 border border-purple-200 px-1.5 py-0.2 rounded font-mono font-medium">
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
  );
};
