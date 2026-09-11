import React from 'react';
import { Hand } from 'lucide-react';

interface ZoomReactionsTrayProps {
  isOpen: boolean;
  onClose: () => void;
  isHandRaised: boolean;
  onToggleRaiseHand: () => void;
  onSelectEmoji: (emoji: string) => void;
}

export const ZoomReactionsTray: React.FC<ZoomReactionsTrayProps> = ({
  isOpen,
  onClose,
  isHandRaised,
  onToggleRaiseHand,
  onSelectEmoji,
}) => {
  if (!isOpen) return null;

  const standardEmojis = ['👏', '👍', '❤️', '🎉', '😮', '😂'];

  return (
    <div
      id="zoom-reactions-tray-backdrop"
      className="fixed inset-0 z-40"
      onClick={onClose}
    >
      <div
        id="zoom-reactions-tray-menu"
        className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50 bg-white/95 backdrop-blur-md border border-neutral-200 rounded-2xl p-2.5 shadow-xl animate-in zoom-in-90 duration-150 flex flex-col gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Emoji Row */}
        <div className="flex items-center gap-1.5">
          {standardEmojis.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                onSelectEmoji(emoji);
                onClose();
              }}
              className="w-9 h-9 rounded-xl hover:bg-purple-50 flex items-center justify-center text-xl transition hover:scale-125 active:scale-95 cursor-pointer"
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Raise Hand Toggle Button */}
        <button
          type="button"
          onClick={() => {
            onToggleRaiseHand();
            onClose();
          }}
          className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer border ${
            isHandRaised
              ? 'bg-neutral-100 text-neutral-800 border-neutral-300'
              : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-transparent shadow-md shadow-indigo-500/20'
          }`}
        >
          <Hand className="w-3.5 h-3.5" />
          <span>{isHandRaised ? 'Lower Hand' : 'Raise Hand ✋'}</span>
        </button>
      </div>
    </div>
  );
};
