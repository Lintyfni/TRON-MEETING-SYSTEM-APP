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
      className="w-full h-full bg-neutral-950 flex flex-col overflow-hidden text-white animate-in fade-in duration-200"
    >
      {/* 1. Top Header */}
      <header className="px-4 py-3 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500 shrink-0">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold tracking-tight text-white flex items-center gap-2 truncate">
              Meeting Chat
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-red-950 border border-red-800 text-red-400">
                LIVE
              </span>
            </h2>
            <p className="text-[11px] text-neutral-400 truncate">
              {directUser ? `Direct 1:1 with @${directUser}` : 'Meeting # အလိုက် စကားပြောရန်'}
            </p>
          </div>
        </div>

        {/* Quick Jump to Live Video Meeting */}
        {onJumpToMeeting && (
          <button
            type="button"
            onClick={() => onJumpToMeeting(selectedRoomFilter === 'ALL' ? activeRoomToken : selectedRoomFilter)}
            className="px-2.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 border border-neutral-700 transition"
            title="View Live Video Meeting"
          >
            <Video className="w-3.5 h-3.5 text-red-500" />
            <span className="hidden sm:inline">Go to Video</span>
          </button>
        )}
      </header>

      {/* 2. Meeting # Filter Bar */}
      <div className="px-4 py-2 bg-neutral-900/60 border-b border-neutral-800 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-xs font-bold text-neutral-400 shrink-0">Meet #:</span>
          <div className="relative flex items-center flex-1 max-w-[240px]">
            <select
              id="select-screen-meeting"
              value={selectedRoomFilter}
              onChange={(e) => {
                setSelectedRoomFilter(e.target.value);
                setDirectUser(null);
              }}
              className="appearance-none w-full bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 text-white font-bold text-xs pl-7 pr-6 py-1.5 rounded-xl cursor-pointer outline-none transition focus:ring-1 focus:ring-red-500 truncate"
            >
              <option value="ALL" className="bg-neutral-900 text-white">
                All Meetings (#Global)
              </option>
              {rooms.map((r) => (
                <option key={r.id} value={r.token} className="bg-neutral-900 text-white">
                  {r.token} · {r.title}
                </option>
              ))}
            </select>
            <Radio className="w-3.5 h-3.5 text-red-500 absolute left-2 pointer-events-none" />
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2 pointer-events-none" />
          </div>
        </div>

        <span className="text-[10px] font-mono text-neutral-400">
          {filteredChats.length} msgs
        </span>
      </div>

      {/* 3. Direct 1-on-1 Participant Selector Chips */}
      <div className="px-4 py-2 bg-neutral-900/40 border-b border-neutral-800/60 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
        <span className="text-[11px] font-semibold text-neutral-400 shrink-0 mr-1">
          Chat with:
        </span>
        <button
          type="button"
          onClick={() => setDirectUser(null)}
          className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 transition ${
            !directUser
              ? 'bg-red-600 text-white shadow-sm'
              : 'bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-750'
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
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-750'
                }`}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-neutral-700 flex items-center justify-center text-[9px] font-bold">
                  {user[0]}
                </div>
                <span>@{user}</span>
              </button>
            );
          })}
      </div>

      {/* 4. Active 1:1 Direct Chat Banner */}
      {directUser && (
        <div className="px-4 py-1.5 bg-red-950/40 border-b border-red-900/40 flex items-center justify-between text-xs text-red-300 shrink-0 animate-in fade-in">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            <span>
              Direct 1-on-1 chat with <strong>@{directUser}</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={() => setDirectUser(null)}
            className="text-[11px] text-neutral-400 hover:text-white underline cursor-pointer"
          >
            Switch to Room Chat
          </button>
        </div>
      )}

      {/* 5. Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredChats.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-neutral-500 text-xs text-center p-8">
            <MessageSquare className="w-10 h-10 stroke-1 text-neutral-600 mb-2" />
            <span className="font-semibold text-neutral-300 text-sm">
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
                      className="text-[11px] font-bold text-neutral-300 hover:text-red-400 transition cursor-pointer flex items-center gap-1"
                      title={`Click to direct chat with @${msg.sender}`}
                    >
                      <div className="w-4 h-4 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-[9px] text-white">
                        {msg.sender[0]}
                      </div>
                      <span>{msg.sender}</span>
                    </button>
                  )}
                  {msg.isDirect && (
                    <span className="text-[9px] bg-red-950 text-red-300 border border-red-800/80 px-1 rounded font-bold">
                      1:1 Direct
                    </span>
                  )}
                  <span className="text-[10px] text-neutral-500">{msg.time}</span>
                  {selectedRoomFilter === 'ALL' && (
                    <span className="text-[9px] font-mono text-neutral-400 bg-neutral-900 border border-neutral-800 px-1 rounded">
                      {msg.meetingToken}
                    </span>
                  )}
                </div>

                <div
                  className={`max-w-[82%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed ${
                    isMe
                      ? 'bg-red-600 text-white rounded-br-xs shadow-md shadow-red-950/40'
                      : 'bg-neutral-900 text-neutral-100 border border-neutral-800 rounded-bl-xs'
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
        className="p-3 bg-neutral-900 border-t border-neutral-800 flex items-center gap-2 shrink-0"
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
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-neutral-500 focus:border-red-500 outline-none transition"
          />
          {directUser && (
            <span className="absolute right-2.5 top-2.5 text-[10px] bg-red-950 text-red-400 border border-red-800 px-1.5 py-0.2 rounded font-mono">
              @{directUser}
            </span>
          )}
        </div>

        <button
          id="btn-screen-send-chat"
          type="submit"
          disabled={!inputText.trim()}
          className="p-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:hover:bg-red-600 text-white transition shrink-0 cursor-pointer shadow-md shadow-red-950/40"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
