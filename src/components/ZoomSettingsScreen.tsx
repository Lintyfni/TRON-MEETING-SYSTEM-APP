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
  Trash2,
  Lock,
  Share2,
  MessageSquare,
  Edit3
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
      className="relative w-full h-full bg-neutral-50 text-neutral-900 flex flex-col overflow-hidden"
    >
      {/* App Bar */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-neutral-200 px-4 py-3 flex items-center justify-between">
        <h1 className="font-bold text-base text-neutral-900">Settings</h1>
        <span className="text-[11px] text-neutral-500 font-mono">Zoom Core v2.4</span>
      </div>

      <div className="flex-1 overflow-y-auto pb-24 divide-y divide-neutral-200 bg-white">
        {/* 1. Profile Banner (Synchronized with User Profile) */}
        <div
          id="settings-profile-banner"
          className="p-4 flex items-center justify-between hover:bg-neutral-50 transition bg-white"
        >
          <div className="flex items-center gap-3">
            {userProfile?.avatar ? (
              <img
                src={userProfile.avatar}
                alt={userProfile.name}
                className="w-13 h-13 rounded-full object-cover border-2 border-purple-200 shadow-sm"
              />
            ) : (
              <div className="w-13 h-13 rounded-full bg-purple-100 border border-purple-200 text-purple-700 flex items-center justify-center font-bold text-lg shadow-sm">
                <User className="w-6 h-6 text-purple-600" />
              </div>
            )}
            <div>
              <h2 className="font-bold text-base text-neutral-900">{userProfile?.name || 'Aung Myint'}</h2>
              <p className="text-xs text-neutral-500">
                {userProfile?.handle || '@aungmyint'} · Standard Account
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-emerald-600 font-medium">Ready & Connected</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. MEETING SETTINGS */}
        <div className="py-2 bg-white">
          <SectionTitle title="MEETING SETTINGS" />

          <SwitchItem
            id="setting-auto-mute"
            title="Always Mute Microphone on Join"
            subtitle="Automatically enters rooms in muted state"
            checked={settings.autoMuteMic}
            onChange={(val) => onUpdateSettings({ autoMuteMic: val })}
            icon={<Mic className="w-4 h-4 text-purple-600" />}
          />

          <SwitchItem
            id="setting-turn-off-video"
            title="Turn Off My Video on Join"
            subtitle="Start meeting with camera disabled"
            checked={settings.turnOffVideoOnJoin}
            onChange={(val) => onUpdateSettings({ turnOffVideoOnJoin: val })}
            icon={<Video className="w-4 h-4 text-purple-600" />}
          />

          <SwitchItem
            id="setting-show-non-video"
            title="Show Non-Video Participants"
            subtitle="Display audio-only tiles in grid"
            checked={settings.showNonVideoParticipants}
            onChange={(val) => onUpdateSettings({ showNonVideoParticipants: val })}
            icon={<Sliders className="w-4 h-4 text-purple-600" />}
          />
        </div>

        {/* 3. MEETING SECURITY & PRIVACY */}
        <div className="py-2 bg-white">
          <SectionTitle title="MEETING SECURITY & PRIVACY" />

          <SwitchItem
            id="setting-lock-meeting"
            title="Lock Meeting by Default"
            subtitle="Prevent new participants from joining ongoing rooms"
            checked={!!settings.lockMeetingByDefault}
            onChange={(val) => onUpdateSettings({ lockMeetingByDefault: val })}
            icon={<Lock className="w-4 h-4 text-purple-600" />}
          />

          <SwitchItem
            id="setting-waiting-room"
            title="Enable Waiting Room"
            subtitle="Place incoming participants in waiting room until admitted"
            checked={settings.waitingRoomByDefault ?? true}
            onChange={(val) => onUpdateSettings({ waitingRoomByDefault: val })}
            icon={<Shield className="w-4 h-4 text-purple-600" />}
          />

          <SwitchItem
            id="setting-allow-screenshare"
            title="Allow Participants to Share Screen"
            subtitle="Permit non-host participants to broadcast screens"
            checked={!!settings.allowParticipantScreenShare}
            onChange={(val) => onUpdateSettings({ allowParticipantScreenShare: val })}
            icon={<Share2 className="w-4 h-4 text-purple-600" />}
          />

          <SwitchItem
            id="setting-allow-chat"
            title="Allow Participants to Chat"
            subtitle="Permit attendees to send group & direct messages"
            checked={settings.allowParticipantChat ?? true}
            onChange={(val) => onUpdateSettings({ allowParticipantChat: val })}
            icon={<MessageSquare className="w-4 h-4 text-purple-600" />}
          />

          <SwitchItem
            id="setting-allow-rename"
            title="Allow Participants to Rename"
            subtitle="Permit attendees to change their display name"
            checked={settings.allowParticipantRename ?? true}
            onChange={(val) => onUpdateSettings({ allowParticipantRename: val })}
            icon={<Edit3 className="w-4 h-4 text-purple-600" />}
          />

          <SwitchItem
            id="setting-allow-unmute"
            title="Allow Participants to Unmute"
            subtitle="Permit attendees to unmute their own microphone"
            checked={settings.allowParticipantUnmute ?? true}
            onChange={(val) => onUpdateSettings({ allowParticipantUnmute: val })}
            icon={<Mic className="w-4 h-4 text-purple-600" />}
          />
        </div>

        {/* 4. VIDEO & AUDIO & VIRTUAL BACKGROUND */}
        <div className="py-2 bg-white">
          <SectionTitle title="VIDEO & AUDIO" />

          <SwitchItem
            id="setting-hd-video"
            title="Enable HD Video"
            subtitle="720p / 1080p high bitrate streaming"
            checked={settings.hdVideo}
            onChange={(val) => onUpdateSettings({ hdVideo: val })}
            icon={<Video className="w-4 h-4 text-purple-600" />}
          />

          <SwitchItem
            id="setting-mirror-video"
            title="Mirror My Video"
            subtitle="Flips front camera display horizontally"
            checked={settings.mirrorMyVideo}
            onChange={(val) => onUpdateSettings({ mirrorMyVideo: val })}
            icon={<Sliders className="w-4 h-4 text-purple-600" />}
          />

          <SwitchItem
            id="setting-noise-suppression"
            title="Noise Suppression"
            subtitle="Filter background clicks, fans and room echoes"
            checked={settings.noiseSuppression}
            onChange={(val) => onUpdateSettings({ noiseSuppression: val })}
            icon={<Volume2 className="w-4 h-4 text-purple-600" />}
          />

          {/* Virtual Background Configuration Row */}
          <div
            id="setting-virtual-bg-row"
            className="px-4 py-3 flex items-center justify-between hover:bg-neutral-50 transition"
          >
            <div className="flex items-center gap-3">
              <ImageIcon className="w-4 h-4 text-purple-600" />
              <div>
                <span className="text-sm font-medium text-neutral-900">Virtual Background</span>
                <p className="text-xs text-neutral-500 capitalize">
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
                className="text-xs text-purple-700 hover:text-purple-800 font-semibold px-2.5 py-1 bg-purple-50 rounded-lg border border-purple-200 cursor-pointer hover:bg-purple-100 transition"
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
        <div className="py-2 bg-white">
          <SectionTitle title="CHAT & SUBTITLES" />

          {/* Chat Filter */}
          <div
            id="setting-chat-filter"
            onClick={() => setIsChatFilterModalOpen(true)}
            className="px-4 py-3 flex items-center justify-between hover:bg-neutral-50 transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Filter className="w-4 h-4 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-neutral-900">Chat Filter</p>
                <p className="text-xs text-neutral-500">
                  {settings.chatFilter === 'all'
                    ? 'View All Messages Across Rooms'
                    : 'Filter History Strictly by Active Meeting Token'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-neutral-400" />
          </div>

          {/* Subtitle Language Selection */}
          <div
            id="setting-subtitle-language"
            onClick={() => setIsLangModalOpen(true)}
            className="px-4 py-3 flex items-center justify-between hover:bg-neutral-50 transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Languages className="w-4 h-4 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-neutral-900">Live Subtitle Language</p>
                <p className="text-xs text-neutral-500">Current: {currentLanguage}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-purple-700 font-semibold">
              <span>Select</span>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </div>
          </div>
        </div>

        {/* 5. ABOUT */}
        <div className="py-2 bg-white">
          <SectionTitle title="ABOUT" />
          <div className="px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-900">Version</p>
              <p className="text-xs text-neutral-500">2.5.0-clean.2026</p>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-600 font-mono">
              STABLE
            </span>
          </div>
          <div className="px-4 py-2 flex items-center gap-2 text-xs text-neutral-500">
            <Info className="w-3.5 h-3.5 text-purple-600" />
            <span>Real-Time WebRTC Meeting Feed & Video Pad</span>
          </div>
        </div>
      </div>

      {/* Subtitle Language Selection Modal */}
      {isLangModalOpen && (
        <div
          id="lang-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={() => setIsLangModalOpen(false)}
        >
          <div
            id="lang-modal-container"
            className="w-full max-w-sm bg-white border border-neutral-200 rounded-2xl p-5 text-neutral-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 pb-3 border-b border-neutral-200">
              <Languages className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-base text-neutral-900">Subtitle Language</h3>
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
                        ? 'bg-purple-50 border border-purple-300 text-purple-900 font-semibold'
                        : 'hover:bg-neutral-100 text-neutral-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{lang.flag}</span>
                      <span className="text-sm font-medium">{lang.name}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-purple-600" />}
                  </button>
                );
              })}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsLangModalOpen(false)}
                className="w-full py-2 bg-neutral-100 hover:bg-neutral-200 text-xs font-semibold text-neutral-800 rounded-xl transition"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={() => setIsChatFilterModalOpen(false)}
        >
          <div
            id="chat-filter-modal-container"
            className="w-full max-w-sm bg-white border border-neutral-200 rounded-2xl p-5 text-neutral-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-base pb-3 border-b border-neutral-200 text-neutral-900">
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
                    ? 'border-purple-500 bg-purple-50 text-purple-900'
                    : 'border-neutral-200 hover:bg-neutral-50 text-neutral-700'
                }`}
              >
                <div className="font-semibold text-sm text-neutral-900">View All Room Chats</div>
                <div className="text-xs text-neutral-500">Combines chat streams from all meetings</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateSettings({ chatFilter: 'token' });
                  setIsChatFilterModalOpen(false);
                }}
                className={`w-full text-left p-3 rounded-xl border transition ${
                  settings.chatFilter === 'token'
                    ? 'border-purple-500 bg-purple-50 text-purple-900'
                    : 'border-neutral-200 hover:bg-neutral-50 text-neutral-700'
                }`}
              >
                <div className="font-semibold text-sm text-neutral-900">Strict Token Scoping</div>
                <div className="text-xs text-neutral-500">
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setIsBgThemeModalOpen(false)}
        >
          <div
            id="bg-theme-modal-container"
            className="w-full max-w-md bg-white border border-neutral-200 rounded-2xl p-5 text-neutral-900 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <div>
                <h3 className="font-bold text-base text-neutral-900">Virtual Background</h3>
                <p className="text-xs text-neutral-500">
                  Change or upload meeting background
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsBgThemeModalOpen(false)}
                className="w-7 h-7 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 hover:text-neutral-800 flex items-center justify-center transition"
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
                    ? 'border-purple-500 bg-purple-50 text-purple-900'
                    : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                <Camera className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-xs font-bold text-neutral-900">Normal Camera</p>
                  <p className="text-[10px] text-neutral-500">Default Camera</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onUpdateSettings({ enableVirtualBackground: true })}
                className={`p-3 rounded-xl border text-left transition flex items-center gap-2.5 ${
                  settings.enableVirtualBackground
                    ? 'border-purple-500 bg-purple-50 text-purple-900'
                    : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                <ImageIcon className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-xs font-bold text-neutral-900">Virtual Background</p>
                  <p className="text-[10px] text-neutral-500">Virtual Backdrop</p>
                </div>
              </button>
            </div>

            {/* Upload Custom Image Section */}
            <div className="p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-700 flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-purple-600" />
                  <span>Upload Custom Background Photo</span>
                </span>
                {settings.virtualBackgroundCustomImage && (
                  <button
                    type="button"
                    onClick={handleRemoveCustomImage}
                    className="text-[10px] text-purple-600 hover:text-purple-800 flex items-center gap-1 font-semibold"
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
                      ? 'border-purple-600 ring-2 ring-purple-500/30'
                      : 'border-neutral-300'
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
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-600 text-white font-bold">
                      Active
                    </span>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-neutral-300 hover:border-purple-500 rounded-xl p-4 text-center cursor-pointer transition group bg-white"
                >
                  <Upload className="w-6 h-6 mx-auto text-purple-500 mb-1.5 transition" />
                  <p className="text-xs font-medium text-neutral-800">
                    Upload your background photo
                  </p>
                  <p className="text-[10px] text-neutral-400 mt-0.5">
                    JPG, PNG, WebP
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
                className="w-full py-2 bg-neutral-100 hover:bg-neutral-200 text-xs font-semibold text-neutral-700 rounded-lg flex items-center justify-center gap-1.5 transition"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{settings.virtualBackgroundCustomImage ? 'Upload Different Image' : 'Choose Image File'}</span>
              </button>
            </div>

            {/* Or Preset Background Themes */}
            <div className="space-y-2">
              <span className="text-xs text-neutral-500 font-medium">Or Preset Backgrounds:</span>
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
                          ? 'border-purple-600 ring-2 ring-purple-500/40'
                          : 'border-neutral-200 hover:border-neutral-400'
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
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-md">
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
                className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-xs font-bold text-white rounded-xl transition shadow-xs"
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
    <span className="text-[11px] font-bold tracking-wider text-purple-700">{title}</span>
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
    className="px-4 py-3 flex items-center justify-between hover:bg-neutral-50 transition cursor-pointer"
  >
    <div className="flex items-center gap-3 pr-4">
      {icon}
      <div>
        <p className="text-sm font-medium text-neutral-900 leading-snug">{title}</p>
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
      checked ? 'bg-gradient-to-r from-indigo-600 to-purple-600' : 'bg-neutral-300'
    }`}
  >
    <div
      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
);
