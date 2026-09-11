import React, { useState, useRef, useEffect } from 'react';
import { MeetingRoom, MeetingNote, ChatMessage, UserSettings, MeetingComment, UserProfile } from '../types';
import { MeetingRoomTile } from './MeetingRoomTile';
import { Plus, Hash, Sparkles, Video } from 'lucide-react';

interface TikTokMeetingFeedProps {
  rooms: MeetingRoom[];
  notes?: MeetingNote[];
  chats: ChatMessage[];
  settings: UserSettings;
  activeRoomToken?: string;
  isSubtitlesOverlayOn?: boolean;
  onSendMessage: (roomToken: string, text: string, recipient?: string) => void;
  onExportToFeed: (text: string) => void;
  onAddNewRoom: (title: string, token: string) => void;
  onAddNote?: (newNote: MeetingNote) => void;
  onActiveRoomChange?: (token: string) => void;
  onUpdateRoomDetails?: (roomId: string, newTitle: string, newToken: string) => void;
  isRecording?: boolean;
  onToggleRecording?: (token: string, isStart: boolean, durationSec?: number, visibility?: 'public' | 'private') => void;
  onOpenProfile?: () => void;
  onBackToHome?: () => void;
  comments?: Record<string, MeetingComment[]>;
  userProfile?: UserProfile;
  onAddComment?: (meetingToken: string, text: string, replyToCommentId?: string, replyToUser?: string) => void;
  onToggleLikeComment?: (meetingToken: string, commentId: string, replyId?: string) => void;
}

export const TikTokMeetingFeed: React.FC<TikTokMeetingFeedProps> = ({
  rooms,
  notes = [],
  chats,
  settings,
  activeRoomToken,
  isSubtitlesOverlayOn = true,
  onSendMessage,
  onExportToFeed,
  onAddNewRoom,
  onAddNote,
  onActiveRoomChange,
  onUpdateRoomDetails,
  isRecording,
  onToggleRecording,
  onOpenProfile,
  onBackToHome,
  comments,
  userProfile,
  onAddComment,
  onToggleLikeComment,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newToken, setNewToken] = useState('');

  // Sync activeIndex if activeRoomToken changes from external tab
  useEffect(() => {
    if (activeRoomToken) {
      const idx = rooms.findIndex((r) => r.token === activeRoomToken);
      if (idx !== -1 && idx !== activeIndex) {
        setActiveIndex(idx);
      }
    }
  }, [activeRoomToken, rooms]);

  // Notify external caller when room changes
  useEffect(() => {
    if (rooms[activeIndex] && onActiveRoomChange) {
      onActiveRoomChange(rooms[activeIndex].token);
    }
  }, [activeIndex, rooms, onActiveRoomChange]);

  const touchStartY = useRef<number | null>(null);

  const handlePrev = () => {
    if (activeIndex > 0) {
      setActiveIndex((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (activeIndex < rooms.length - 1) {
      setActiveIndex((prev) => prev + 1);
    }
  };

  // Keyboard navigation up / down
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        handlePrev();
      } else if (e.key === 'ArrowDown') {
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, rooms.length]);

  // Touch swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;

    if (diff > 50) {
      // Swiped up -> next room
      handleNext();
    } else if (diff < -50) {
      // Swiped down -> previous room
      handlePrev();
    }
    touchStartY.current = null;
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const token = newToken.trim().startsWith('#')
      ? newToken.trim()
      : `#MEET-${Math.floor(1000 + Math.random() * 9000)}`;
    onAddNewRoom(newTitle.trim(), token);
    setNewTitle('');
    setNewToken('');
    setIsCreateRoomOpen(false);
    setActiveIndex(rooms.length); // jump to newly created room
  };

  const activeRoom = rooms[activeIndex] || rooms[0];

  return (
    <div
      id="tiktok-meeting-feed"
      className="relative w-full h-full bg-white flex flex-col overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Vertical Feed Content */}
      <div className="flex-1 w-full h-full relative">
        {!activeRoom ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-white">
            <div className="w-16 h-16 rounded-full bg-purple-50 border border-purple-100 flex items-center justify-center mb-4 text-purple-600 shadow-xs">
              <Video className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-neutral-900 mb-1">No Active Meeting</h3>
            <p className="text-xs text-neutral-500 max-w-xs mb-6 leading-relaxed">
              Start a new live meeting or join a room using a Meeting Token.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
              <button
                type="button"
                onClick={() => setIsCreateRoomOpen(true)}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition active:scale-95 shadow-md shadow-indigo-500/20 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-white" />
                <span>New Meeting</span>
              </button>
              {onBackToHome && (
                <button
                  type="button"
                  onClick={onBackToHome}
                  className="flex-1 py-3 px-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer border border-neutral-200"
                >
                  <span>Back to Home</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <MeetingRoomTile
            key={activeRoom.id}
            room={activeRoom}
            rooms={rooms}
            chats={chats}
            settings={settings}
            roomIndex={activeIndex}
            totalRooms={rooms.length}
            onPrevRoom={handlePrev}
            onNextRoom={handleNext}
            onSelectRoomToken={(token) => {
              const idx = rooms.findIndex((r) => r.token === token);
              if (idx !== -1) setActiveIndex(idx);
            }}
            onOpenCreateRoom={() => setIsCreateRoomOpen(true)}
            onSendMessage={onSendMessage}
            onExportToFeed={onExportToFeed}
            notes={notes}
            onAddNote={onAddNote}
            isSubtitlesOverlayOn={isSubtitlesOverlayOn}
            onUpdateRoomDetails={onUpdateRoomDetails}
            isRecording={isRecording}
            onToggleRecording={onToggleRecording}
            onOpenProfile={onOpenProfile}
            onBackToHome={onBackToHome}
            comments={comments}
            userProfile={userProfile}
            onAddComment={onAddComment}
            onToggleLikeComment={onToggleLikeComment}
          />
        )}
      </div>

      {/* Create New Meeting Modal */}
      {isCreateRoomOpen && (
        <div
          id="create-room-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={() => setIsCreateRoomOpen(false)}
        >
          <div
            id="create-room-modal-container"
            className="w-full max-w-sm bg-white border border-neutral-200 rounded-2xl p-5 text-neutral-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 pb-3 border-b border-neutral-200">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center">
                <Video className="w-4 h-4 text-purple-600" />
              </div>
              <h3 className="font-bold text-sm text-neutral-900">Start New Meeting</h3>
            </div>

            <form onSubmit={handleCreateRoom} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Meeting Name (ခေါင်းစဉ်)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Weekly Strategy Sync"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-xs text-neutral-900 focus:bg-white focus:border-purple-600 outline-none"
                />
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1.5">
                  <span className="text-[10px] text-neutral-400 shrink-0">Presets:</span>
                  {['Weekly Sync', 'Project Review', 'Team Catchup', 'Brainstorming'].map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setNewTitle(suggestion)}
                      className="text-[10px] bg-neutral-100 hover:bg-purple-50 hover:text-purple-700 text-neutral-600 px-2 py-0.5 rounded-full transition shrink-0 cursor-pointer"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-neutral-600 mb-1">Meeting Token (Optional)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-neutral-400 text-sm">#</span>
                  <input
                    type="text"
                    placeholder="MEET-7721"
                    value={newToken.replace(/^#/, '')}
                    onChange={(e) => setNewToken('#' + e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl pl-7 pr-3 py-2 text-sm text-neutral-900 focus:bg-white focus:border-purple-600 outline-none uppercase font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateRoomOpen(false)}
                  className="flex-1 py-2 rounded-xl text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold transition shadow-md shadow-indigo-500/20 cursor-pointer"
                >
                  Create Meeting
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
