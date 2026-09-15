import React, { useState, useMemo } from 'react';
import { UserSettings } from '../types';
import { ALL_ANIMAL_AVATARS } from '../data/avatarPresets';
import { X, Search, Ban } from 'lucide-react';

interface AvatarPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
}

export const AvatarPickerModal: React.FC<AvatarPickerModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const activeAvatarId = settings.selectedAvatarId || 'fox';
  const isAvatarEnabled = !!settings.enableAvatarMask;

  // Filter animals by search query
  const filteredAnimals = useMemo(() => {
    if (!searchQuery.trim()) return ALL_ANIMAL_AVATARS;
    const q = searchQuery.toLowerCase().trim();
    return ALL_ANIMAL_AVATARS.filter(
      (a) => a.name.toLowerCase().includes(q) || a.emoji.includes(q)
    );
  }, [searchQuery]);

  if (!isOpen) return null;

  const handleSelectAnimal = (animalId: string) => {
    onUpdateSettings({
      enableAvatarMask: true,
      selectedAvatarId: animalId,
      avatarMaskMode: 'full_avatar', // Always Full Studio Privacy
    });
    onClose();
  };

  const handleTurnOff = () => {
    onUpdateSettings({
      enableAvatarMask: false,
    });
    onClose();
  };

  return (
    <div
      id="avatar-picker-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-3 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="avatar-emoji-picker-box"
        className="w-full max-w-sm sm:max-w-md bg-white border border-neutral-200 rounded-3xl shadow-2xl p-3 sm:p-4 flex flex-col max-h-[80vh] overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Emoji Picker Search & Header Bar */}
        <div className="flex items-center gap-2 pb-2.5 border-b border-neutral-100 shrink-0">
          <div className="flex-1 relative flex items-center">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search animal..."
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-neutral-100 hover:bg-neutral-100/80 focus:bg-white border border-transparent focus:border-purple-300 rounded-xl outline-hidden text-neutral-800 placeholder-neutral-400 transition"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 text-neutral-400 hover:text-neutral-600 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 hover:text-neutral-800 flex items-center justify-center transition cursor-pointer shrink-0"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Emoji Grid */}
        <div className="flex-1 overflow-y-auto py-2.5 px-0.5">
          <div className="grid grid-cols-6 sm:grid-cols-7 gap-1.5 sm:gap-2">
            {/* Turn Off / None Button */}
            <button
              type="button"
              onClick={handleTurnOff}
              title="Off"
              className={`h-11 rounded-2xl flex items-center justify-center text-neutral-500 hover:text-red-500 hover:bg-red-50 transition cursor-pointer border ${
                !isAvatarEnabled
                  ? 'border-red-400 bg-red-50/80 text-red-600 ring-2 ring-red-300/50'
                  : 'border-dashed border-neutral-200 bg-neutral-50'
              }`}
            >
              <Ban className="w-5 h-5" />
            </button>

            {/* Animal Face Emojis */}
            {filteredAnimals.map((animal) => {
              const isSelected = isAvatarEnabled && activeAvatarId === animal.id;
              return (
                <button
                  key={animal.id}
                  type="button"
                  onClick={() => handleSelectAnimal(animal.id)}
                  title={animal.name}
                  className={`h-11 rounded-2xl flex items-center justify-center text-2xl transition cursor-pointer relative hover:scale-110 active:scale-95 ${
                    isSelected
                      ? 'bg-purple-100/90 ring-2 ring-purple-500 border border-purple-300 shadow-xs'
                      : 'hover:bg-neutral-100 border border-transparent'
                  }`}
                >
                  <span className="select-none pointer-events-none leading-none">
                    {animal.emoji}
                  </span>
                </button>
              );
            })}
          </div>

          {filteredAnimals.length === 0 && (
            <div className="py-8 text-center text-xs text-neutral-400">
              No animal found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
