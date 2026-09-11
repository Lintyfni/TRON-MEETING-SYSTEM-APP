import React, { useState } from 'react';
import { Search, Hand, Sparkles, Smile, ThumbsUp, Heart, Flame } from 'lucide-react';

interface RichEmojiPickerProps {
  onSelectEmoji: (emoji: string) => void;
  onClose?: () => void;
  showRaiseHand?: boolean;
  isHandRaised?: boolean;
  onToggleRaiseHand?: () => void;
  title?: string;
  compact?: boolean;
  className?: string;
}

const EMOJI_CATEGORIES: { id: string; name: string; icon: React.ReactNode; emojis: string[] }[] = [
  {
    id: 'all',
    name: 'All',
    icon: <Sparkles className="w-3 h-3" />,
    emojis: []
  },
  {
    id: 'popular',
    name: 'Top',
    icon: <Sparkles className="w-3 h-3" />,
    emojis: ['👏', '👍', '❤️', '🔥', '🎉', '😂', '🥰', '😮', '😢', '🙏', '🚀', '💯', '🤩', '😎', '✨', '🙌', '🤝', '🥳']
  },
  {
    id: 'smileys',
    name: 'Faces',
    icon: <Smile className="w-3 h-3" />,
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
      '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
      '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
      '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
      '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮',
      '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '🥸', '😎',
      '🤓', '🧐', '😕', '😟', '🙁', '😮', '😯', '😲', '😳', '🥺',
      '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣',
      '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈'
    ]
  },
  {
    id: 'hands',
    name: 'Hands',
    icon: <ThumbsUp className="w-3 h-3" />,
    emojis: [
      '👍', '👎', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✌️', '🤞',
      '🫰', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️',
      '🫵', '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✊',
      '👊', '🤛', '🤜', '💪', '✍️', '💅', '🤳', '🫶', '❤️‍🔥'
    ]
  },
  {
    id: 'hearts',
    name: 'Hearts',
    icon: <Heart className="w-3 h-3" />,
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
      '❤️‍🔥', '❤️‍🩹', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝',
      '💟', '💌', '💐', '🌹', '🥀', '🌺', '🌸', '🌼', '🌻'
    ]
  },
  {
    id: 'vibes',
    name: 'Vibes',
    icon: <Flame className="w-3 h-3" />,
    emojis: [
      '🔥', '✨', '⭐', '🌟', '💫', '💥', '💯', '🎉', '🎊', '🎈',
      '🎂', '🎁', '🏆', '🥇', '🥈', '🥉', '🎯', '🚀', '💡', '⚡',
      '☕', '🍵', '🍻', '🥂', '🍕', '🍔', '🌮', '🍦', '🍩', '🍫'
    ]
  }
];

export const RichEmojiPicker: React.FC<RichEmojiPickerProps> = ({
  onSelectEmoji,
  onClose,
  showRaiseHand = false,
  isHandRaised = false,
  onToggleRaiseHand,
  title = 'Reactions',
  compact = false,
  className = '',
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const realCategories = EMOJI_CATEGORIES.filter((c) => c.id !== 'all');

  return (
    <div
      id="rich-emoji-picker-container"
      className={`bg-white/95 backdrop-blur-md border border-neutral-200/90 rounded-2xl shadow-2xl flex flex-col z-50 text-neutral-800 animate-in zoom-in-95 duration-150 select-none ${
        compact ? 'w-full p-2 gap-1.5' : 'w-72 p-2.5 gap-2'
      } ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-0.5 pb-1 border-b border-neutral-100">
        <div className="flex items-center gap-1 min-w-0">
          <Sparkles className="w-3 h-3 text-purple-600 shrink-0" />
          <span className="text-[11px] font-bold text-neutral-800 truncate">{title}</span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 text-xs px-1 rounded-full hover:bg-neutral-100 transition shrink-0 cursor-pointer"
            title="Close"
          >
            ✕
          </button>
        )}
      </div>

      {/* Search Input (Only when not in ultra-compact or when space permits) */}
      {!compact && (
        <div className="flex items-center gap-1.5 bg-neutral-100/90 px-2 py-1 rounded-xl border border-neutral-200">
          <Search className="w-3 h-3 text-neutral-400 shrink-0" />
          <input
            type="text"
            placeholder="Search emojis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-neutral-800 placeholder:text-neutral-400 outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-[10px] text-neutral-400 hover:text-neutral-700"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Category Pills */}
      {!searchQuery && (
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5">
          {EMOJI_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold transition shrink-0 cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
              title={cat.name}
            >
              {cat.icon}
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Emoji Grid with Smooth Up/Down Vertical Scrollbar */}
      <div
        id="emoji-scroll-container"
        className={`overflow-y-auto pr-0.5 select-none [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-purple-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-neutral-100 ${
          compact ? 'max-h-36 sm:max-h-40' : 'max-h-48'
        }`}
      >
        {searchQuery.trim() ? (
          /* Search results */
          <div className={`grid gap-1 py-0.5 ${compact ? 'grid-cols-4' : 'grid-cols-6'}`}>
            {Array.from(new Set(realCategories.flatMap((c) => c.emojis))).map((emoji, index) => (
              <button
                key={`${emoji}-${index}`}
                type="button"
                onClick={() => {
                  onSelectEmoji(emoji);
                  if (onClose) onClose();
                }}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg hover:bg-purple-50 flex items-center justify-center text-lg transition hover:scale-125 active:scale-90 cursor-pointer"
                title={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        ) : activeCategory === 'all' ? (
          /* All Categories in a continuous vertical scroll */
          <div className="flex flex-col gap-1.5">
            {realCategories.map((cat) => (
              <div key={cat.id} className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1 text-[9px] font-bold text-neutral-400 uppercase tracking-wider px-0.5 sticky top-0 bg-white/95 py-0.5 backdrop-blur-xs">
                  {cat.icon}
                  <span>{cat.name}</span>
                </div>
                <div className={`grid gap-1 ${compact ? 'grid-cols-4' : 'grid-cols-6'}`}>
                  {cat.emojis.map((emoji, index) => (
                    <button
                      key={`${cat.id}-${emoji}-${index}`}
                      type="button"
                      onClick={() => {
                        onSelectEmoji(emoji);
                        if (onClose) onClose();
                      }}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg hover:bg-purple-50 flex items-center justify-center text-base sm:text-lg transition hover:scale-125 active:scale-90 cursor-pointer"
                      title={emoji}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Single selected category */
          <div className={`grid gap-1 py-0.5 ${compact ? 'grid-cols-4' : 'grid-cols-6'}`}>
            {(realCategories.find((c) => c.id === activeCategory)?.emojis || []).map((emoji, index) => (
              <button
                key={`${emoji}-${index}`}
                type="button"
                onClick={() => {
                  onSelectEmoji(emoji);
                  if (onClose) onClose();
                }}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg hover:bg-purple-50 flex items-center justify-center text-base sm:text-lg transition hover:scale-125 active:scale-90 cursor-pointer"
                title={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Raise Hand Toggle Option */}
      {showRaiseHand && onToggleRaiseHand && (
        <div className="pt-1 border-t border-neutral-100">
          <button
            type="button"
            onClick={() => {
              onToggleRaiseHand();
              if (onClose) onClose();
            }}
            className={`w-full py-1 px-2 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border ${
              isHandRaised
                ? 'bg-neutral-100 text-neutral-800 border-neutral-300 hover:bg-neutral-200'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-transparent shadow-xs shadow-indigo-500/20 active:scale-95'
            }`}
          >
            <Hand className="w-3 h-3" />
            <span>{isHandRaised ? 'Lower Hand (လက်ချမည်)' : 'Raise Hand ✋ (လက်ထောင်မည်)'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
