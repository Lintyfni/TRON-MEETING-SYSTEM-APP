import React from 'react';
import { RichEmojiPicker } from './RichEmojiPicker';

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

  return (
    <div
      id="zoom-reactions-tray-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-2xs animate-in fade-in"
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()}>
        <RichEmojiPicker
          onSelectEmoji={onSelectEmoji}
          onClose={onClose}
          showRaiseHand={true}
          isHandRaised={isHandRaised}
          onToggleRaiseHand={onToggleRaiseHand}
          title="Meeting Reactions & Emojis"
        />
      </div>
    </div>
  );
};
