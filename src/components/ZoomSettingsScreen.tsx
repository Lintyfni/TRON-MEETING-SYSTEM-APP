import React, { useState } from 'react';
import { UserSettings } from '../types';
import { languageOptions } from '../data/initialData';
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
  Sliders
} from 'lucide-react';

interface ZoomSettingsScreenProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
}

export const ZoomSettingsScreen: React.FC<ZoomSettingsScreenProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);
  const [isChatFilterModalOpen, setIsChatFilterModalOpen] = useState(false);
  const [isBgThemeModalOpen, setIsBgThemeModalOpen] = useState(false);

  return (
    <div id="zoom-settings-screen" className="relative w-full h-full bg-black text-white flex flex-col overflow-hidden">
      {/* App Bar */}
      <div className="sticky top-0 z-20 bg-black/90 backdrop-blur-md border-b border-neutral-800 px-4 py-3 flex items-center justify-between">
        <h1 className="font-bold text-base text-white">Settings</h1>
        <span className="text-[11px] text-neutral-400 font-mono">Zoom Core v2.4</span>
      </div>

      <div className="flex-1 overflow-y-auto pb-24 divide-y divide-neutral-900">
        {/* 1. Profile Banner */}
        <div
          id="settings-profile-banner"
          className="p-4 flex items-center justify-between hover:bg-neutral-950/60 transition cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-13 h-13 rounded-full bg-red-600/20 border border-red-500/40 text-red-400 flex items-center justify-center font-bold text-lg shadow-md">
              <User className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">Aung Aung</h2>
              <p className="text-xs text-neutral-400">aung@example.com · Basic Plan</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-emerald-400 font-medium">Whisper STT Active</span>
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-500" />
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

        {/* 3. VIDEO & AUDIO */}
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
            title="AI Noise Suppression"
            subtitle="Filter background clicks, fans and echoes"
            checked={settings.noiseSuppression}
            onChange={(val) => onUpdateSettings({ noiseSuppression: val })}
            icon={<Volume2 className="w-4 h-4 text-neutral-400" />}
          />

          <div
            id="setting-virtual-bg-row"
            className="px-4 py-3 flex items-center justify-between hover:bg-neutral-950/60 transition"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-neutral-400" />
              <div>
                <span className="text-sm font-medium text-neutral-200">Virtual Background</span>
                <p className="text-xs text-neutral-500 capitalize">
                  Theme: {settings.virtualBackgroundType}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsBgThemeModalOpen(true)}
                className="text-xs text-red-400 hover:text-red-300 font-semibold px-2.5 py-1 bg-red-950/40 rounded-lg border border-red-800/40"
              >
                Change
              </button>
              <Switch
                id="toggle-virtual-bg"
                checked={settings.enableVirtualBackground}
                onChange={(val) => onUpdateSettings({ enableVirtualBackground: val })}
              />
            </div>
          </div>
        </div>

        {/* 4. CHAT & NOTIFICATIONS */}
        <div className="py-2">
          <SectionTitle title="CHAT & NOTIFICATIONS" />

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
                    : 'Filter History Strictly by Token'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-neutral-500" />
          </div>

          {/* Whisper AI Language Selection */}
          <div
            id="setting-whisper-language"
            onClick={() => setIsLangModalOpen(true)}
            className="px-4 py-3 flex items-center justify-between hover:bg-neutral-950/60 transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Languages className="w-4 h-4 text-red-400" />
              <div>
                <p className="text-sm font-medium text-neutral-200">Whisper AI Engine Language</p>
                <p className="text-xs text-neutral-400">Current: {settings.whisperLanguage}</p>
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
              <p className="text-xs text-neutral-500">2.4.0-build.2026</p>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 font-mono">
              STABLE
            </span>
          </div>
          <div className="px-4 py-2 flex items-center gap-2 text-xs text-neutral-500">
            <Info className="w-3.5 h-3.5" />
            <span>TikTok Vertical Meeting Feed & Post Protocol</span>
          </div>
        </div>
      </div>

      {/* Language Selection Modal */}
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
              <h3 className="font-bold text-base">Whisper AI Engine Language</h3>
            </div>

            <div className="py-3 space-y-1">
              {languageOptions.map((lang) => {
                const isSelected = settings.whisperLanguage === lang.name;
                return (
                  <button
                    key={lang.code}
                    id={`lang-option-${lang.code}`}
                    type="button"
                    onClick={() => {
                      onUpdateSettings({ whisperLanguage: lang.name });
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

      {/* Virtual Background Theme Modal */}
      {isBgThemeModalOpen && (
        <div
          id="bg-theme-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={() => setIsBgThemeModalOpen(false)}
        >
          <div
            id="bg-theme-modal-container"
            className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl p-5 text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-base pb-3 border-b border-neutral-800">
              Select Virtual Background
            </h3>
            <div className="py-3 grid grid-cols-2 gap-2">
              {(['studio', 'cyberpunk', 'blur', 'office'] as const).map((bg) => (
                <button
                  key={bg}
                  type="button"
                  onClick={() => {
                    onUpdateSettings({ virtualBackgroundType: bg });
                    setIsBgThemeModalOpen(false);
                  }}
                  className={`p-3 rounded-xl border capitalize text-sm font-medium transition ${
                    settings.virtualBackgroundType === bg
                      ? 'border-red-500 bg-red-600/20 text-white'
                      : 'border-neutral-800 hover:bg-neutral-800 text-neutral-300'
                  }`}
                >
                  {bg}
                </button>
              ))}
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
