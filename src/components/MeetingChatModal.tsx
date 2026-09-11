import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  MessageSquare,
  Radio,
  ChevronDown,
  User,
  Users,
  Lock,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { ChatMessage, MeetingRoom } from '../types';

interface MeetingChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomToken: string;
  rooms: MeetingRoom[];
  chats: ChatMessage[];
  initialDirectUser?: string | null;
  onSendMessage: (roomToken: string, text: string, recipient?: string) => void;
  onSelectMeetingRoom?: (token: string) => void;
}

export const MeetingChatModal: React.FC<MeetingChatModalProps> = ({
  isOpen,
  onClose,
  roomToken,
  rooms,
  chats,
  initialDirectUser = null,
  onSendMessage,
  onSelectMeetingRoom,
}) => {
  const [selectedToken, setSelectedToken] = useState<string>(roomToken);
  const [directUser, setDirectUser] = useState<string | null>(initialDirectUser);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync state when modal opens or initialDirectUser/roomToken changes
  useEffect(() => {
    if (isOpen) {
      setSelectedToken(roomToken);
      setDirectUser(initialDirectUser);
    }
  }, [isOpen, roomToken, initialDirectUser]);

  // Current active room object
  const currentRoom = rooms.find((r) => r.token === selectedToken) || rooms[0];
  const participants = currentRoom?.participants || ['Kyaw Kyaw', 'Su Su', 'Mya Mya'];

  // Filter messages
  // 1. If directUser is set: only messages between 'Me' and directUser in this meeting
  // 2. If no directUser: public room messages (c.isDirect !== true) OR all messages for selectedToken
  const filteredChats = chats.filter((c) => {
    // Check meeting token filter
    const matchesToken = selectedToken === 'ALL' || c.meetingToken === selectedToken;
    if (!matchesToken) return false;

    if (directUser) {
      // 1-on-1 Direct Chat filter
      const isFromMeToUser = (c.sender === 'Me' || c.isMe) && c.recipient === directUser;
      const isFromUserToMe = c.sender === directUser && (c.recipient === 'Me' || c.isDirect);
      return isFromMeToUser || isFromUserToMe;
    } else {
      // Public room chat (or room-wide messages)
      return !c.isDirect;
    }
  });

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, filteredChats.length, directUser]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const tokenToUse = selectedToken === 'ALL' ? roomToken : selectedToken;
    onSendMessage(tokenToUse, inputText.trim(), directUser || undefined);
    setInputText('');
  };

  const handleRoomTokenChange = (token: string) => {
    setSelectedToken(token);
    if (token !== 'ALL' && onSelectMeetingRoom) {
      onSelectMeetingRoom(token);
    }
  };

  return (
    <div
      id="meeting-chat-modal-backdrop"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="meeting-chat-modal-container"
        className="w-full max-w-md h-[540px] max-h-[90vh] bg-white border-t sm:border border-neutral-200 rounded-t-3xl sm:rounded-2xl flex flex-col text-neutral-900 shadow-2xl animate-in slide-in-from-bottom-6 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1 bg-neutral-300 rounded-full mx-auto mt-2 sm:hidden" />

        {/* 1. Header with Meeting # Filter Dropdown & Close */}
        <div className="px-4 py-3 border-b border-neutral-200 flex items-center justify-between gap-2">
          {/* Left: Meeting # Filter Dropdown */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4 text-purple-600" />
            </div>
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider shrink-0 hidden sm:inline">
                Meet #:
              </span>
              <div className="relative flex items-center max-w-[200px] flex-1">
                <select
                  id="select-chat-meeting-filter"
                  value={selectedToken}
                  onChange={(e) => handleRoomTokenChange(e.target.value)}
                  className="appearance-none w-full bg-neutral-50 hover:bg-neutral-100 border border-neutral-300 text-neutral-900 font-bold text-xs pl-7 pr-6 py-1.5 rounded-full cursor-pointer outline-none transition focus:border-purple-600 truncate"
                  title="Filter chat by Meeting #"
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.token} className="bg-white text-neutral-900">
                      {r.token} ({r.title})
                    </option>
                  ))}
                  <option value="ALL" className="bg-white text-neutral-900">
                    All Meetings (#Global)
                  </option>
                </select>
                <Radio className="w-3.5 h-3.5 text-purple-600 absolute left-2 pointer-events-none" />
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Close Button */}
          <button
            id="btn-close-meeting-chat"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 p-1.5 rounded-full hover:bg-neutral-100 transition shrink-0 cursor-pointer"
            title="Close Chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2. Direct Chat vs Room Chat Tab / Participant Chips */}
        <div className="px-4 py-2 border-b border-neutral-200 bg-neutral-50 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px] text-neutral-500 font-medium">
            <span>Recipient Mode:</span>
            {directUser ? (
              <span className="text-purple-600 font-semibold flex items-center gap-1">
                <Lock className="w-3 h-3 text-purple-600" /> 1-on-1 Direct Chat
              </span>
            ) : (
              <span className="text-purple-600 font-semibold flex items-center gap-1">
                <Users className="w-3 h-3 text-purple-600" /> Public Meeting Chat
              </span>
            )}
          </div>

          {/* Horizontal scrollable recipient list */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {/* Everyone / Room Button */}
            <button
              id="btn-chat-recipient-room"
              type="button"
              onClick={() => setDirectUser(null)}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 flex items-center gap-1 transition cursor-pointer ${
                !directUser
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm'
                  : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
              }`}
            >
              <Users className="w-3 h-3" />
              <span>{selectedToken === 'ALL' ? 'All Rooms' : selectedToken}</span>
            </button>

            {/* Individual Participant Chips for 1-on-1 Chat */}
            {participants
              .filter((name) => name !== 'Me' && name !== 'Aung Aung')
              .map((name) => {
                const isSelected = directUser === name;
                return (
                  <button
                    key={name}
                    id={`btn-chat-direct-${name.replace(/\s+/g, '-').toLowerCase()}`}
                    type="button"
                    onClick={() => setDirectUser(name)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 flex items-center gap-1 border transition cursor-pointer ${
                      isSelected
                        ? 'bg-purple-100 border-purple-400 text-purple-800 shadow-sm font-semibold'
                        : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                    }`}
                    title={`1-on-1 Chat with ${name}`}
                  >
                    <User className="w-3 h-3 text-purple-600" />
                    <span>@{name}</span>
                  </button>
                );
              })}
          </div>
        </div>

        {/* 3. Direct Chat Active Notice Banner (if in direct mode) */}
        {directUser && (
          <div
            id="banner-direct-chat-active"
            className="px-4 py-1.5 bg-purple-50 border-b border-purple-200 flex items-center justify-between text-xs text-purple-800"
          >
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
              <span>
                Chatting directly with <strong>@{directUser}</strong>
              </span>
            </div>
            <button
              onClick={() => setDirectUser(null)}
              className="text-[11px] text-purple-600 hover:text-purple-800 flex items-center gap-1 underline transition cursor-pointer"
            >
              <ArrowLeft className="w-3 h-3" />
              Switch to Room
            </button>
          </div>
        )}

        {/* 4. Chat Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
          {filteredChats.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-neutral-400 text-xs text-center p-6">
              {directUser ? (
                <>
                  <div className="w-12 h-12 rounded-full bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 mb-2">
                    <User className="w-6 h-6" />
                  </div>
                  <span className="font-semibold text-neutral-800 text-sm">
                    1-on-1 Direct Chat with @{directUser}
                  </span>
                  <span className="text-neutral-500 mt-1 max-w-[240px]">
                    No private messages yet. Send a direct message to @{directUser} below!
                  </span>
                </>
              ) : (
                <>
                  <MessageSquare className="w-10 h-10 stroke-1 text-purple-300 mb-2" />
                  <span className="font-semibold text-neutral-800 text-sm">
                    No messages in {selectedToken} yet.
                  </span>
                  <span className="text-neutral-500 mt-1 max-w-[240px]">
                    Click on a participant above or type a message below to start chatting!
                  </span>
                </>
              )}
            </div>
          ) : (
            filteredChats.map((chat) => {
              const isCurrentUser = chat.sender === 'Me' || chat.isMe;
              return (
                <div
                  key={chat.id}
                  id={`chat-msg-${chat.id}`}
                  className={`flex gap-2.5 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Sender Avatar - Clickable to start 1-on-1 chat if not me */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!isCurrentUser) setDirectUser(chat.sender);
                    }}
                    className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold transition ${
                      isCurrentUser
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white cursor-default'
                        : 'bg-neutral-100 text-neutral-700 border border-neutral-200 hover:border-purple-400 hover:scale-105 cursor-pointer'
                    }`}
                    title={isCurrentUser ? 'You' : `Click to direct chat with ${chat.sender}`}
                  >
                    {chat.sender[0]}
                  </button>

                  <div className={`max-w-[78%] flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      {/* Sender Name - Clickable to start 1-on-1 chat if not current user */}
                      {isCurrentUser ? (
                        <span className="text-[11px] font-semibold text-neutral-700">Me</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDirectUser(chat.sender)}
                          className="text-[11px] font-semibold text-neutral-800 hover:text-purple-600 flex items-center gap-1 cursor-pointer"
                          title={`Click to 1-on-1 direct chat with ${chat.sender}`}
                        >
                          <span>{chat.sender}</span>
                          <span className="text-[9px] px-1 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200 font-normal">
                            Direct Chat
                          </span>
                        </button>
                      )}

                      {/* Direct indicator badge if message was private */}
                      {chat.isDirect && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200 font-mono">
                          1:1 Direct
                        </span>
                      )}

                      {/* Meeting Token tag if viewing All */}
                      {selectedToken === 'ALL' && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-neutral-100 text-neutral-600 font-mono">
                          {chat.meetingToken}
                        </span>
                      )}

                      <span className="text-[9px] text-neutral-400">{chat.time}</span>
                    </div>

                    <div
                      className={`px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                        isCurrentUser
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-tr-xs shadow-sm'
                          : 'bg-neutral-100 text-neutral-800 rounded-tl-xs border border-neutral-200 shadow-sm'
                      }`}
                    >
                      {chat.message}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 5. Input Bar with Direct User / Meeting Token Badge */}
        <form onSubmit={handleSubmit} className="p-3 border-t border-neutral-200 bg-neutral-50">
          <div className="flex items-center gap-2 bg-white border border-neutral-300 rounded-xl px-3 py-1.5 focus-within:border-purple-600 transition">
            {/* Input prompt badge */}
            {directUser ? (
              <span className="text-[10px] bg-purple-100 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded font-bold shrink-0">
                @{directUser}
              </span>
            ) : (
              <span className="text-[10px] bg-neutral-100 text-neutral-600 border border-neutral-200 px-1.5 py-0.5 rounded font-bold shrink-0 font-mono">
                {selectedToken}
              </span>
            )}

            <input
              id="input-meeting-chat"
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                directUser
                  ? `Direct message to @${directUser}...`
                  : `Send to ${selectedToken}...`
              }
              className="flex-1 bg-transparent text-neutral-900 text-xs outline-none placeholder:text-neutral-400 py-1"
            />

            <button
              id="btn-send-chat-msg"
              type="submit"
              disabled={!inputText.trim()}
              className="p-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 disabled:opacity-40 hover:from-indigo-500 hover:to-purple-500 text-white transition shrink-0 cursor-pointer active:scale-95"
              title="Send Message"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
