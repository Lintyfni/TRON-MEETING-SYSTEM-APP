import React, { useState } from 'react';
import {
  X,
  Shield,
  Lock,
  Unlock,
  Users,
  Check,
  Share2,
  MessageSquare,
  Mic,
  Video as VideoIcon,
  VolumeX
} from 'lucide-react';
import { MeetingRoom } from '../types';

interface ZoomSecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: MeetingRoom;
  onUpdateSecurity: (updates: Partial<MeetingRoom> & { muteAll?: boolean }) => void;
}

export const ZoomSecurityModal: React.FC<ZoomSecurityModalProps> = ({
  isOpen,
  onClose,
  room,
  onUpdateSecurity,
}) => {
  const [isLocked, setIsLocked] = useState(room.isLocked || false);
  const [isWaitingRoom, setIsWaitingRoom] = useState(room.isWaitingRoomEnabled || false);
  const [allowShareScreen, setAllowShareScreen] = useState(room.allowShareScreen ?? true);
  const [allowChat, setAllowChat] = useState(room.allowChat ?? true);

  if (!isOpen) return null;

  const handleToggleLock = () => {
    const next = !isLocked;
    setIsLocked(next);
    onUpdateSecurity({ isLocked: next });
  };

  const handleToggleWaitingRoom = () => {
    const next = !isWaitingRoom;
    setIsWaitingRoom(next);
    onUpdateSecurity({ isWaitingRoomEnabled: next });
  };

  const handleToggleShareScreen = () => {
    const next = !allowShareScreen;
    setAllowShareScreen(next);
    onUpdateSecurity({ allowShareScreen: next });
  };

  const handleToggleChat = () => {
    const next = !allowChat;
    setAllowChat(next);
    onUpdateSecurity({ allowChat: next });
  };

  const handleMuteAll = () => {
    onUpdateSecurity({ muteAll: true });
    onClose();
  };

  return (
    <div
      id="zoom-security-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="zoom-security-modal"
        className="w-full max-w-sm bg-white border border-neutral-200 rounded-2xl p-5 text-neutral-900 shadow-2xl animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center">
              <Shield className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-neutral-900">Security Controls</h3>
              <p className="text-[10px] text-neutral-500">Host Meeting Security Settings</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-700 rounded-full hover:bg-neutral-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Security Options */}
        <div className="mt-4 space-y-3">
          {/* Lock Meeting */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50 border border-neutral-200 transition">
            <div className="flex items-center gap-2.5">
              {isLocked ? <Lock className="w-4 h-4 text-purple-600" /> : <Unlock className="w-4 h-4 text-neutral-500" />}
              <div>
                <p className="text-xs font-semibold text-neutral-900">Lock Meeting</p>
                <p className="text-[10px] text-neutral-500">
                  {isLocked ? 'No new participants can join' : 'Open to invitees'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggleLock}
              className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${
                isLocked ? 'bg-gradient-to-r from-indigo-600 to-purple-600' : 'bg-neutral-300'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  isLocked ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Enable Waiting Room */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50 border border-neutral-200 transition">
            <div className="flex items-center gap-2.5">
              <Users className="w-4 h-4 text-purple-600" />
              <div>
                <p className="text-xs font-semibold text-neutral-900">Enable Waiting Room</p>
                <p className="text-[10px] text-neutral-500">
                  {isWaitingRoom ? 'Host must admit guests' : 'Guests join directly'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggleWaitingRoom}
              className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${
                isWaitingRoom ? 'bg-gradient-to-r from-indigo-600 to-purple-600' : 'bg-neutral-300'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  isWaitingRoom ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Allow Participants To: */}
          <div className="pt-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-2">
              Allow Participants To:
            </p>
            <div className="space-y-1.5 bg-neutral-50 p-2.5 rounded-xl border border-neutral-200">
              <label className="flex items-center justify-between text-xs text-neutral-800 cursor-pointer py-1">
                <span className="flex items-center gap-2">
                  <Share2 className="w-3.5 h-3.5 text-purple-600" />
                  Share Screen
                </span>
                <input
                  type="checkbox"
                  checked={allowShareScreen}
                  onChange={handleToggleShareScreen}
                  className="rounded accent-purple-600 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between text-xs text-neutral-800 cursor-pointer py-1">
                <span className="flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
                  Chat With Everyone
                </span>
                <input
                  type="checkbox"
                  checked={allowChat}
                  onChange={handleToggleChat}
                  className="rounded accent-purple-600 w-4 h-4"
                />
              </label>
            </div>
          </div>

          {/* Mute All Immediate Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleMuteAll}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-500/20"
            >
              <VolumeX className="w-4 h-4 text-white" />
              <span>Mute All Participants Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
