import React, { useState, useRef, useEffect } from 'react';
import { MeetingRoom, MeetingNote, ChatMessage, UserSettings, MeetingComment, UserProfile } from '../types';
import { MeetingRoomTile } from './MeetingRoomTile';
import { Plus, Hash, Sparkles } from 'lucide-react';

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
  onToggleRecording?: (token: string, isStart: boolean, durationSec?: number) => void;
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
      className="relative w-full h-full bg-black flex flex-col overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Vertical Feed Content */}
      <div className="flex-1 w-full h-full relative">
        {activeRoom && (
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={() => setIsCreateRoomOpen(false)}
        >
          <div
            id="create-room-modal-container"
            className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl p-5 text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 pb-3 border-b border-neutral-800">
              <Sparkles className="w-5 h-5 text-red-500" />
              <h3 className="font-bold text-base">Start New Live Meeting</h3>
            </div>

            <form onSubmit={handleCreateRoom} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Meeting Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI Workflow & System Architecture"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:border-red-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1">Meeting Token (Optional)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-neutral-500 text-sm">#</span>
                  <input
                    type="text"
                    placeholder="MEET-7721"
                    value={newToken.replace(/^#/, '')}
                    onChange={(e) => setNewToken('#' + e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-7 pr-3 py-2 text-sm text-white focus:border-red-500 outline-none uppercase font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateRoomOpen(false)}
                  className="flex-1 py-2 rounded-xl text-neutral-400 hover:text-white bg-neutral-800 text-xs font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition shadow-lg shadow-red-950/50"
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
