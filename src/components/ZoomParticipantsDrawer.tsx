import React, { useState } from 'react';
import {
  X,
  Users,
  Search,
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  Hand,
  Shield,
  UserCheck,
  UserX,
  Copy,
  Check,
  VolumeX
} from 'lucide-react';
import { ParticipantState } from '../types';

interface ZoomParticipantsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  roomToken: string;
  roomTitle: string;
  participants: ParticipantState[];
  isHost: boolean;
  currentUserName: string;
  onMuteParticipant: (name: string) => void;
  onUnmuteParticipant: (name: string) => void;
  onLowerHand: (name: string) => void;
  onRemoveParticipant: (name: string) => void;
  onMuteAll: () => void;
}

export const ZoomParticipantsDrawer: React.FC<ZoomParticipantsDrawerProps> = ({
  isOpen,
  onClose,
  roomToken,
  participants,
  isHost,
  currentUserName,
  onMuteParticipant,
  onUnmuteParticipant,
  onLowerHand,
  onRemoveParticipant,
  onMuteAll,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [showMuteAllConfirm, setShowMuteAllConfirm] = useState(false);

  if (!isOpen) return null;

  const filtered = participants.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopyLink = () => {
    const link = `${window.location.origin}/#${roomToken}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link).catch(() => {});
    }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div
      id="zoom-participants-backdrop"
      className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="zoom-participants-panel"
        className="w-full max-w-sm h-full bg-white border-l border-neutral-200 flex flex-col text-neutral-900 shadow-2xl animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center">
              <Users className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-neutral-900">Participants ({participants.length})</h2>
              <p className="text-[10px] text-purple-700 font-mono font-bold">{roomToken}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-3 border-b border-neutral-200">
          <div className="relative">
            <Search className="w-4 h-4 text-purple-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Find participant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-300 rounded-xl pl-9 pr-3 py-1.5 text-xs text-neutral-900 placeholder-neutral-400 focus:bg-white focus:border-purple-600 outline-none"
            />
          </div>
        </div>

        {/* Participant List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 divide-y divide-neutral-100">
          {filtered.map((p) => {
            const isMe = p.name.toLowerCase() === currentUserName.toLowerCase();
            return (
              <div
                key={p.name}
                className="pt-2 first:pt-0 flex items-center justify-between gap-2 hover:bg-neutral-50 p-2 rounded-xl transition"
              >
                {/* User details */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative shrink-0">
                    <div className="w-8 h-8 rounded-full bg-purple-50 border border-purple-200 flex items-center justify-center font-bold text-xs text-purple-700">
                      {p.name[0]?.toUpperCase()}
                    </div>
                    {p.isHandRaised && (
                      <span className="absolute -bottom-1 -right-1 text-xs animate-bounce" title="Hand Raised">
                        ✋
                      </span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-neutral-900 truncate max-w-[130px]">
                        {p.name}
                      </span>
                      {isMe && (
                        <span className="text-[10px] text-neutral-500 font-normal">(Me)</span>
                      )}
                      {p.role === 'host' && (
                        <span className="text-[9px] bg-purple-100 text-purple-700 border border-purple-200 px-1 py-0.2 rounded font-bold uppercase">
                          Host
                        </span>
                      )}
                      {p.role === 'co-host' && (
                        <span className="text-[9px] bg-neutral-100 text-neutral-700 border border-neutral-200 px-1 py-0.2 rounded font-bold uppercase">
                          Co-host
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status & Host Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {p.isHandRaised && isHost && (
                    <button
                      type="button"
                      onClick={() => onLowerHand(p.name)}
                      className="p-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-700 text-[10px] font-medium border border-amber-200 transition cursor-pointer"
                      title="Lower Hand"
                    >
                      Lower
                    </button>
                  )}

                  {/* Mic icon */}
                  <button
                    type="button"
                    disabled={!isHost && !isMe}
                    onClick={() => {
                      if (p.isAudioMuted) {
                        onUnmuteParticipant(p.name);
                      } else {
                        onMuteParticipant(p.name);
                      }
                    }}
                    className={`p-1.5 rounded-lg border transition cursor-pointer ${
                      p.isAudioMuted
                        ? 'bg-red-50 border-red-200 text-red-500 hover:bg-red-100'
                        : 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100'
                    }`}
                    title={p.isAudioMuted ? 'Muted' : 'Active'}
                  >
                    {p.isAudioMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  </button>

                  {/* Video icon */}
                  <div
                    className={`p-1.5 rounded-lg border ${
                      p.isVideoMuted
                        ? 'bg-red-50 border-red-200 text-red-500'
                        : 'bg-purple-50 border-purple-200 text-purple-600'
                    }`}
                    title={p.isVideoMuted ? 'Video Off' : 'Video On'}
                  >
                    {p.isVideoMuted ? <VideoOff className="w-3.5 h-3.5" /> : <VideoIcon className="w-3.5 h-3.5" />}
                  </div>

                  {/* Host Kick Option */}
                  {isHost && !isMe && (
                    <button
                      type="button"
                      onClick={() => onRemoveParticipant(p.name)}
                      className="p-1.5 rounded-lg bg-neutral-100 hover:bg-red-50 text-neutral-500 hover:text-red-600 border border-neutral-200 hover:border-red-200 transition cursor-pointer"
                      title={`Remove ${p.name} from meeting`}
                    >
                      <UserX className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions (Mute All & Invite) */}
        <div className="p-3 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between gap-2">
          {isHost && (
            <button
              type="button"
              onClick={() => setShowMuteAllConfirm(true)}
              className="px-3 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-xs font-semibold text-neutral-800 transition flex items-center gap-1.5 cursor-pointer border border-neutral-200"
            >
              <VolumeX className="w-3.5 h-3.5 text-purple-600" />
              <span>Mute All</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopyLink}
            className="flex-1 px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:scale-95 text-xs font-bold text-white transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-indigo-500/20"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-white" />}
            <span>{copiedLink ? 'Link Copied!' : 'Invite / Copy Link'}</span>
          </button>
        </div>

        {/* Mute All Confirmation Modal */}
        {showMuteAllConfirm && (
          <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white border border-neutral-200 rounded-2xl p-4 text-center max-w-xs shadow-2xl animate-in zoom-in-95">
              <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center mx-auto mb-2">
                <VolumeX className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-sm font-bold text-neutral-900 mb-1">Mute all current participants?</h3>
              <p className="text-xs text-neutral-600 mb-4">
                Current participants will be muted. They can unmute if enabled.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowMuteAllConfirm(false)}
                  className="flex-1 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-xs font-semibold text-neutral-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onMuteAll();
                    setShowMuteAllConfirm(false);
                  }}
                  className="flex-1 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-xs font-bold text-white shadow-md shadow-indigo-500/20 transition cursor-pointer"
                >
                  Mute All
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
