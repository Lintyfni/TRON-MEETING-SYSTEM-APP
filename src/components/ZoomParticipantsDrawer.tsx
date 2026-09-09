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
      className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="zoom-participants-panel"
        className="w-full max-w-sm h-full bg-neutral-900 border-l border-neutral-800 flex flex-col text-white shadow-2xl animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            <div>
              <h2 className="font-bold text-sm">Participants ({participants.length})</h2>
              <p className="text-[10px] text-neutral-400 font-mono">{roomToken}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-3 border-b border-neutral-800/80">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Find participant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Participant List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 divide-y divide-neutral-800/40">
          {filtered.map((p) => {
            const isMe = p.name.toLowerCase() === currentUserName.toLowerCase();
            return (
              <div
                key={p.name}
                className="pt-2 first:pt-0 flex items-center justify-between gap-2 hover:bg-neutral-850/60 p-2 rounded-xl transition"
              >
                {/* User details */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative shrink-0">
                    <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-xs text-neutral-200">
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
                      <span className="text-xs font-semibold text-white truncate max-w-[130px]">
                        {p.name}
                      </span>
                      {isMe && (
                        <span className="text-[10px] text-neutral-400 font-normal">(Me)</span>
                      )}
                      {p.role === 'host' && (
                        <span className="text-[9px] bg-red-950 text-red-300 border border-red-800/80 px-1 py-0.2 rounded font-bold uppercase">
                          Host
                        </span>
                      )}
                      {p.role === 'co-host' && (
                        <span className="text-[9px] bg-blue-950 text-blue-300 border border-blue-800/80 px-1 py-0.2 rounded font-bold uppercase">
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
                      className="p-1 rounded bg-amber-950/80 hover:bg-amber-900 text-amber-400 text-[10px] font-medium border border-amber-800 transition"
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
                    className={`p-1.5 rounded-lg border transition ${
                      p.isAudioMuted
                        ? 'bg-red-950/80 border-red-800/60 text-red-400 hover:bg-red-900'
                        : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:text-white'
                    }`}
                    title={p.isAudioMuted ? 'Muted (Click to request unmute)' : 'Active (Click to mute)'}
                  >
                    {p.isAudioMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  </button>

                  {/* Video icon */}
                  <div
                    className={`p-1.5 rounded-lg border ${
                      p.isVideoMuted
                        ? 'bg-red-950/80 border-red-800/60 text-red-400'
                        : 'bg-neutral-800 border-neutral-700 text-neutral-300'
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
                      className="p-1.5 rounded-lg bg-neutral-800 hover:bg-red-900/60 text-neutral-400 hover:text-red-300 border border-neutral-700 hover:border-red-700 transition"
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

        {/* Footer Actions (Standard Zoom: Mute All & Invite) */}
        <div className="p-3 border-t border-neutral-800 bg-neutral-950/80 flex items-center justify-between gap-2">
          {isHost && (
            <button
              type="button"
              onClick={() => setShowMuteAllConfirm(true)}
              className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 hover:text-white transition flex items-center gap-1.5 cursor-pointer border border-neutral-700"
            >
              <VolumeX className="w-3.5 h-3.5 text-red-400" />
              <span>Mute All</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopyLink}
            className="flex-1 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-xs font-bold text-white transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-blue-950/50"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Link Copied!' : 'Invite / Copy Link'}</span>
          </button>
        </div>

        {/* Mute All Confirmation Modal */}
        {showMuteAllConfirm && (
          <div className="absolute inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
            <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-4 text-center max-w-xs shadow-2xl">
              <div className="w-10 h-10 rounded-full bg-red-950 text-red-400 border border-red-800 flex items-center justify-center mx-auto mb-2">
                <VolumeX className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">Mute all current participants?</h3>
              <p className="text-xs text-neutral-400 mb-4">
                New and current participants will be muted. They can still unmute themselves unless locked.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowMuteAllConfirm(false)}
                  className="flex-1 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onMuteAll();
                    setShowMuteAllConfirm(false);
                  }}
                  className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white shadow-lg"
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
