import React, { useState, useRef } from 'react';
import { UserSettings, UserProfile } from '../types';
import { languageOptions, virtualBackgroundPresets } from '../data/initialData';
import {
  User,
  ChevronRight,
  Shield,
  Volume2,
  Video,
  Mic,
  Languages,
  Filter,
  Info,
  Check,
  Sparkles,
  Sliders,
  Upload,
  Image as ImageIcon,
  Camera,
  X,
  Trash2
} from 'lucide-react';

interface ZoomSettingsScreenProps {
  settings: UserSettings;
  userProfile?: UserProfile;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
}

export const ZoomSettingsScreen: React.FC<ZoomSettingsScreenProps> = ({
  settings,
  userProfile,
  onUpdateSettings,
}) => {
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);
  const [isChatFilterModalOpen, setIsChatFilterModalOpen] = useState(false);
  const [isBgThemeModalOpen, setIsBgThemeModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      onUpdateSettings({
        enableVirtualBackground: true,
        virtualBackgroundType: 'custom',
        virtualBackgroundCustomImage: dataUrl,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCustomImage = () => {
    onUpdateSettings({
      virtualBackgroundCustomImage: '',
      virtualBackgroundType: 'studio',
    });
  };

  const currentLanguage =
    settings.subtitleLanguage || settings.whisperLanguage || 'Myanmar (MM)';

  return (
    <div
      id="zoom-settings-screen"
      className="relative w-full h-full bg-black text-white flex flex-col overflow-hidden"
    >
      {/* App Bar */}
      <div className="sticky top-0 z-20 bg-black/90 backdrop-blur-md border-b border-neutral-800 px-4 py-3 flex items-center justify-between">
        <h1 className="font-bold text-base text-white">Settings</h1>
        <span className="text-[11px] text-neutral-400 font-mono">Zoom Core v2.4</span>
      </div>

      <div className="flex-1 overflow-y-auto pb-24 divide-y divide-neutral-900">
        {/* 1. Profile Banner (Synchronized with User Profile) */}
        <div
          id="settings-profile-banner"
          className="p-4 flex items-center justify-between hover:bg-neutral-950/60 transition"
        >
          <div className="flex items-center gap-3">
            {userProfile?.avatar ? (
              <img
                src={userProfile.avatar}
                alt={userProfile.name}
                className="w-13 h-13 rounded-full object-cover border-2 border-red-500/60 shadow-md"
              />
            ) : (
              <div className="w-13 h-13 rounded-full bg-red-600/20 border border-red-500/40 text-red-400 flex items-center justify-center font-bold text-lg shadow-md">
                <User className="w-6 h-6 text-red-500" />
              </div>
            )}
            <div>
              <h2 className="font-bold text-base text-white">{userProfile?.name || 'Aung Myint'}</h2>
              <p className="text-xs text-neutral-400">
                {userProfile?.handle || '@aungmyint'} · Standard Account
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-emerald-400 font-medium">Ready & Connected</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. MEETING SETTINGS */}
        <div className="py-2">
          <SectionTitle title="MEETING SETTINGS" />

          <SwitchItem
            id="setting-auto-mute"
            title="Always Mute Microphone on Join"
            subtitle="Automatically enters rooms in muted state"
            checked={settings.autoMuteMic}
            onChange={(val) => onUpdateSettings({ autoMuteMic: val })}
            icon={<Mic className="w-4 h-4 text-neutral-400" />}
          />

          <SwitchItem
            id="setting-turn-off-video"
            title="Turn Off My Video on Join"
            subtitle="Start meeting with camera disabled"
            checked={settings.turnOffVideoOnJoin}
            onChange={(val) => onUpdateSettings({ turnOffVideoOnJoin: val })}
            icon={<Video className="w-4 h-4 text-neutral-400" />}
          />

          <SwitchItem
            id="setting-show-non-video"
            title="Show Non-Video Participants"
            subtitle="Display audio-only tiles in grid"
            checked={settings.showNonVideoParticipants}
            onChange={(val) => onUpdateSettings({ showNonVideoParticipants: val })}
            icon={<Sliders className="w-4 h-4 text-neutral-400" />}
          />
        </div>

        {/* 3. VIDEO & AUDIO & VIRTUAL BACKGROUND */}
        <div className="py-2">
          <SectionTitle title="VIDEO & AUDIO" />

          <SwitchItem
            id="setting-hd-video"
            title="Enable HD Video"
            subtitle="720p / 1080p high bitrate streaming"
            checked={settings.hdVideo}
            onChange={(val) => onUpdateSettings({ hdVideo: val })}
            icon={<Video className="w-4 h-4 text-neutral-400" />}
          />

          <SwitchItem
            id="setting-mirror-video"
            title="Mirror My Video"
            subtitle="Flips front camera display horizontally"
            checked={settings.mirrorMyVideo}
            onChange={(val) => onUpdateSettings({ mirrorMyVideo: val })}
            icon={<Sliders className="w-4 h-4 text-neutral-400" />}
          />

          <SwitchItem
            id="setting-noise-suppression"
            title="Noise Suppression"
            subtitle="Filter background clicks, fans and room echoes"
            checked={settings.noiseSuppression}
            onChange={(val) => onUpdateSettings({ noiseSuppression: val })}
            icon={<Volume2 className="w-4 h-4 text-neutral-400" />}
          />

          {/* Virtual Background Configuration Row */}
          <div
            id="setting-virtual-bg-row"
            className="px-4 py-3 flex items-center justify-between hover:bg-neutral-950/60 transition"
          >
            <div className="flex items-center gap-3">
              <ImageIcon className="w-4 h-4 text-amber-400" />
              <div>
                <span className="text-sm font-medium text-neutral-200">Virtual Background</span>
                <p className="text-xs text-neutral-400 capitalize">
                  {settings.enableVirtualBackground
                    ? settings.virtualBackgroundType === 'custom'
                      ? 'Custom Uploaded Image'
                      : `Theme: ${settings.virtualBackgroundType}`
                    : 'Disabled (Normal Camera)'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                id="btn-open-virtual-bg-modal"
                type="button"
                onClick={() => setIsBgThemeModalOpen(true)}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold px-2.5 py-1 bg-amber-950/40 rounded-lg border border-amber-800/40 cursor-pointer"
              >
                Change / Upload
              </button>
              <Switch
                id="toggle-virtual-bg"
                checked={settings.enableVirtualBackground}
                onChange={(val) => onUpdateSettings({ enableVirtualBackground: val })}
              />
            </div>
          </div>
        </div>

        {/* 4. CHAT & SUBTITLES */}
        <div className="py-2">
          <SectionTitle title="CHAT & SUBTITLES" />

          {/* Chat Filter */}
          <div
            id="setting-chat-filter"
            onClick={() => setIsChatFilterModalOpen(true)}
            className="px-4 py-3 flex items-center justify-between hover:bg-neutral-950/60 transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Filter className="w-4 h-4 text-neutral-400" />
              <div>
                <p className="text-sm font-medium text-neutral-200">Chat Filter</p>
                <p className="text-xs text-neutral-400">
                  {settings.chatFilter === 'all'
                    ? 'View All Messages Across Rooms'
                    : 'Filter History Strictly by Active Meeting Token'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-neutral-500" />
          </div>

          {/* Subtitle Language Selection */}
          <div
            id="setting-subtitle-language"
            onClick={() => setIsLangModalOpen(true)}
            className="px-4 py-3 flex items-center justify-between hover:bg-neutral-950/60 transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Languages className="w-4 h-4 text-red-400" />
              <div>
                <p className="text-sm font-medium text-neutral-200">Live Subtitle Language</p>
                <p className="text-xs text-neutral-400">Current: {currentLanguage}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-red-400 font-semibold">
              <span>Select</span>
              <ChevronRight className="w-4 h-4 text-neutral-500" />
            </div>
          </div>
        </div>

        {/* 5. ABOUT */}
        <div className="py-2">
          <SectionTitle title="ABOUT" />
          <div className="px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-200">Version</p>
              <p className="text-xs text-neutral-500">2.5.0-clean.2026</p>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 font-mono">
              STABLE
            </span>
          </div>
          <div className="px-4 py-2 flex items-center gap-2 text-xs text-neutral-500">
            <Info className="w-3.5 h-3.5" />
            <span>Real-Time WebRTC Meeting Feed & Video Pad</span>
          </div>
        </div>
      </div>

      {/* Subtitle Language Selection Modal */}
      {isLangModalOpen && (
        <div
          id="lang-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={() => setIsLangModalOpen(false)}
        >
          <div
            id="lang-modal-container"
            className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl p-5 text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 pb-3 border-b border-neutral-800">
              <Languages className="w-5 h-5 text-red-500" />
              <h3 className="font-bold text-base">Subtitle Language</h3>
            </div>

            <div className="py-3 space-y-1">
              {languageOptions.map((lang) => {
                const isSelected = currentLanguage === lang.name;
                return (
                  <button
                    key={lang.code}
                    id={`lang-option-${lang.code}`}
                    type="button"
                    onClick={() => {
                      onUpdateSettings({
                        subtitleLanguage: lang.name,
                        whisperLanguage: lang.name,
                      });
                      setIsLangModalOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition ${
                      isSelected
                        ? 'bg-red-600/20 border border-red-500 text-white'
                        : 'hover:bg-neutral-800 text-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{lang.flag}</span>
                      <span className="text-sm font-medium">{lang.name}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-red-400" />}
                  </button>
                );
              })}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsLangModalOpen(false)}
                className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-xs text-white rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Filter Modal */}
      {isChatFilterModalOpen && (
        <div
          id="chat-filter-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={() => setIsChatFilterModalOpen(false)}
        >
          <div
            id="chat-filter-modal-container"
            className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl p-5 text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-base pb-3 border-b border-neutral-800">
              Configure Chat History
            </h3>
            <div className="py-3 space-y-2">
              <button
                type="button"
                onClick={() => {
                  onUpdateSettings({ chatFilter: 'all' });
                  setIsChatFilterModalOpen(false);
                }}
                className={`w-full text-left p-3 rounded-xl border transition ${
                  settings.chatFilter === 'all'
                    ? 'border-red-500 bg-red-500/10'
                    : 'border-neutral-800 hover:bg-neutral-800/60'
                }`}
              >
                <div className="font-semibold text-sm">View All Room Chats</div>
                <div className="text-xs text-neutral-400">Combines chat streams from all meetings</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateSettings({ chatFilter: 'token' });
                  setIsChatFilterModalOpen(false);
                }}
                className={`w-full text-left p-3 rounded-xl border transition ${
                  settings.chatFilter === 'token'
                    ? 'border-red-500 bg-red-500/10'
                    : 'border-neutral-800 hover:bg-neutral-800/60'
                }`}
              >
                <div className="font-semibold text-sm">Strict Token Scoping</div>
                <div className="text-xs text-neutral-400">
                  Only show messages matching the active meeting token
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Virtual Background & Custom Image Upload Modal */}
      {isBgThemeModalOpen && (
        <div
          id="bg-theme-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setIsBgThemeModalOpen(false)}
        >
          <div
            id="bg-theme-modal-container"
            className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-5 text-white shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div>
                <h3 className="font-bold text-base text-white">Virtual Background</h3>
                <p className="text-xs text-neutral-400">
                  ပုံ upload လုပ်နိုင်သလို မလုပ်ရင် camera အတိုင်း ပေါ်ပါမည်
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsBgThemeModalOpen(false)}
                className="w-7 h-7 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode: Default Camera vs Virtual Background */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onUpdateSettings({ enableVirtualBackground: false })}
                className={`p-3 rounded-xl border text-left transition flex items-center gap-2.5 ${
                  !settings.enableVirtualBackground
                    ? 'border-red-500 bg-red-500/10 text-white'
                    : 'border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                }`}
              >
                <Camera className="w-5 h-5 text-neutral-300" />
                <div>
                  <p className="text-xs font-bold text-white">Normal Camera</p>
                  <p className="text-[10px] text-neutral-400">မူလ ကင်မရာပုံအတိုင်း</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onUpdateSettings({ enableVirtualBackground: true })}
                className={`p-3 rounded-xl border text-left transition flex items-center gap-2.5 ${
                  settings.enableVirtualBackground
                    ? 'border-amber-500 bg-amber-500/10 text-white'
                    : 'border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                }`}
              >
                <ImageIcon className="w-5 h-5 text-amber-400" />
                <div>
                  <p className="text-xs font-bold text-white">Virtual Background</p>
                  <p className="text-[10px] text-neutral-400">ရုပ်ပေါ် background ချိန်း</p>
                </div>
              </button>
            </div>

            {/* Upload Custom Image Section */}
            <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-amber-400" />
                  <span>Upload Custom Background Photo</span>
                </span>
                {settings.virtualBackgroundCustomImage && (
                  <button
                    type="button"
                    onClick={handleRemoveCustomImage}
                    className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Remove</span>
                  </button>
                )}
              </div>

              {settings.virtualBackgroundCustomImage ? (
                <div
                  onClick={() => {
                    onUpdateSettings({
                      enableVirtualBackground: true,
                      virtualBackgroundType: 'custom',
                    });
                  }}
                  className={`relative rounded-xl overflow-hidden h-28 border-2 cursor-pointer group ${
                    settings.virtualBackgroundType === 'custom' && settings.enableVirtualBackground
                      ? 'border-amber-500 ring-2 ring-amber-500/30'
                      : 'border-neutral-700'
                  }`}
                >
                  <img
                    src={settings.virtualBackgroundCustomImage}
                    alt="Custom Uploaded Background"
                    className="w-full h-full object-cover group-hover:scale-105 transition"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2 justify-between">
                    <span className="text-[11px] font-semibold text-white">
                      ✓ Your Uploaded Background
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-neutral-950 font-bold">
                      Active
                    </span>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-neutral-700 hover:border-amber-500/80 rounded-xl p-4 text-center cursor-pointer transition group bg-neutral-900/40"
                >
                  <Upload className="w-6 h-6 mx-auto text-neutral-400 group-hover:text-amber-400 mb-1.5 transition" />
                  <p className="text-xs font-medium text-neutral-200">
                    မိမိနှစ်သက်ရာ နောက်ခံပုံ Upload လုပ်ပါ
                  </p>
                  <p className="text-[10px] text-neutral-500 mt-0.5">
                    JPG, PNG, WebP (ရုပ်ပဲပေါ်ပြီး background ချိန်းပါမည်)
                  </p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-200 rounded-lg flex items-center justify-center gap-1.5 transition"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{settings.virtualBackgroundCustomImage ? 'Upload Different Image' : 'Choose Image File'}</span>
              </button>
            </div>

            {/* Or Preset Background Themes */}
            <div className="space-y-2">
              <span className="text-xs text-neutral-400 font-medium">Or Preset Backgrounds:</span>
              <div className="grid grid-cols-3 gap-2">
                {virtualBackgroundPresets.map((preset) => {
                  const isSelected =
                    settings.enableVirtualBackground &&
                    settings.virtualBackgroundType === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        onUpdateSettings({
                          enableVirtualBackground: true,
                          virtualBackgroundType: preset.id as any,
                        });
                      }}
                      className={`relative rounded-xl overflow-hidden h-20 border-2 transition group ${
                        isSelected
                          ? 'border-amber-500 ring-2 ring-amber-500/40'
                          : 'border-neutral-800 hover:border-neutral-600'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-end p-1.5">
                        <span className="text-[10px] font-semibold text-white truncate">
                          {preset.name}
                        </span>
                      </div>
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-amber-500 text-neutral-950 flex items-center justify-center shadow-md">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsBgThemeModalOpen(false)}
                className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white rounded-xl transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SectionTitle: React.FC<{ title: string }> = ({ title }) => (
  <div className="px-4 pt-3 pb-1">
    <span className="text-[11px] font-bold tracking-wider text-red-500">{title}</span>
  </div>
);

interface SwitchItemProps {
  id: string;
  title: string;
  subtitle?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon?: React.ReactNode;
}

const SwitchItem: React.FC<SwitchItemProps> = ({
  id,
  title,
  subtitle,
  checked,
  onChange,
  icon,
}) => (
  <div
    id={id}
    onClick={() => onChange(!checked)}
    className="px-4 py-3 flex items-center justify-between hover:bg-neutral-950/60 transition cursor-pointer"
  >
    <div className="flex items-center gap-3 pr-4">
      {icon}
      <div>
        <p className="text-sm font-medium text-neutral-200 leading-snug">{title}</p>
        {subtitle && <p className="text-xs text-neutral-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
    <Switch id={`toggle-${id}`} checked={checked} onChange={onChange} />
  </div>
);

const Switch: React.FC<{
  id: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}> = ({ id, checked, onChange }) => (
  <button
    id={id}
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={(e) => {
      e.stopPropagation();
      onChange(!checked);
    }}
    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out shrink-0 ${
      checked ? 'bg-red-600' : 'bg-neutral-700'
    }`}
  >
    <div
      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
);
