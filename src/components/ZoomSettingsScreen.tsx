import React, { useState, useRef } from 'react';
import { UserSettings, UserProfile } from '../types';
import { languageOptions, virtualBackgroundPresets } from '../data/initialData';
import { TRENDING_AVATARS } from '../data/avatarPresets';
import { AvatarPickerModal } from './AvatarPickerModal';
import { compressImageFile } from '../utils/imageCompressor';
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
  Edit3,
  Smile,
  LogOut,
  Sun,
  Moon,
} from 'lucide-react';

interface ZoomSettingsScreenProps {
  settings: UserSettings;
  userProfile?: UserProfile;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onLogout?: () => void;
}

export const ZoomSettingsScreen: React.FC<ZoomSettingsScreenProps> = ({
  settings,
  userProfile,
  onUpdateSettings,
  onLogout,
}) => {
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);
  const [isChatFilterModalOpen, setIsChatFilterModalOpen] = useState(false);
  const [isBgThemeModalOpen, setIsBgThemeModalOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const selectedAvatar =
    TRENDING_AVATARS.find((a) => a.id === settings.selectedAvatarId) || TRENDING_AVATARS[0];

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Compress image to prevent PayloadTooLargeError and improve memory performance
      const compressedDataUrl = await compressImageFile(file, 1280, 720, 0.85);
      onUpdateSettings({
        enableVirtualBackground: true,
        virtualBackgroundType: 'custom',
        virtualBackgroundCustomImage: compressedDataUrl,
      });
    } catch {
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
    }
  };

  const handleRemoveCustomImage = () => {
    onUpdateSettings({
      virtualBackgroundCustomImage: '',
      virtualBackgroundType: 'studio',
    });
  };

  const currentLanguage =
    settings.subtitleLanguage || settings.whisperLanguage || 'Myanmar (MM)';

  const isDark = settings.themeMode !== 'light';

  return (
    <div
      id="zoom-settings-screen"
      className={`relative w-full h-full flex flex-col overflow-hidden transition-colors duration-300 ${
        isDark ? 'bg-[#0B0F19] text-slate-100' : 'bg-[#F8FAFC] text-slate-900'
      }`}
    >
      {/* App Bar */}
      <div
        className={`sticky top-0 z-20 backdrop-blur-md border-b px-4 py-3 transition-colors ${
          isDark
            ? 'bg-[#0B0F19]/95 border-slate-800/80 text-slate-100'
            : 'bg-white/95 border-slate-200 text-slate-900'
        }`}
      >
        <div className="max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-base">Settings</h1>
            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold border ${
              isDark
                ? 'text-indigo-300 bg-indigo-950/60 border-indigo-500/30'
                : 'text-indigo-700 bg-indigo-50 border-indigo-200'
            }`}>
              {isDark ? 'Midnight Slate (Eye-Comfort)' : 'Soft Porcelain (Eye-Comfort)'}
            </span>
          </div>
          <span className={`text-[11px] font-semibold font-mono px-2 py-0.5 rounded-full border ${
            isDark
              ? 'text-slate-300 bg-slate-900 border-slate-700'
              : 'text-slate-600 bg-slate-100 border-slate-200'
          }`}>
            CooM v2.5.0
          </span>
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto pb-24 transition-colors ${isDark ? 'bg-[#0B0F19]' : 'bg-[#F8FAFC]'}`}>
        <div className={`max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto w-full divide-y ${isDark ? 'divide-slate-800/70' : 'divide-slate-200'}`}>
        {/* 1. Profile Banner (Synchronized with User Profile) */}
        <div
          id="settings-profile-banner"
          className={`p-4 flex items-center justify-between transition ${
            isDark ? 'bg-[#131B2E] hover:bg-[#1A253D] text-slate-100' : 'bg-white hover:bg-slate-50 text-slate-900'
          }`}
        >
          <div className="flex items-center gap-3">
            {userProfile?.avatar ? (
              <img
                src={userProfile.avatar}
                alt={userProfile.name}
                className="w-13 h-13 rounded-full object-cover border-2 border-indigo-500/70 shadow-sm"
              />
            ) : (
              <div className="w-13 h-13 rounded-full bg-indigo-950 border border-indigo-500/40 text-indigo-300 flex items-center justify-center font-bold text-lg shadow-sm">
                <User className="w-6 h-6 text-indigo-400" />
              </div>
            )}
            <div>
              <h2 className="font-bold text-base">{userProfile?.name || 'Aung Myint'}</h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {userProfile?.handle || '@aungmyint'} · Standard Account
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-emerald-500 font-medium">Ready & Connected</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. APP THEME & APPEARANCE (Eye-soothing Dark & Light Theme) */}
        <div className={`p-4 transition-colors ${isDark ? 'bg-[#131B2E]' : 'bg-white'}`}>
          <SectionTitle title="THEME & APPEARANCE (မျက်စိအေး အရောင်စနစ်)" isDark={isDark} />
          <div className="grid grid-cols-2 gap-3 mt-2.5">
            {/* Midnight Slate Dark Theme (Eye-comfort dark) */}
            <button
              type="button"
              id="btn-setting-theme-dark"
              onClick={() => onUpdateSettings({ themeMode: 'dark' })}
              className={`p-3.5 rounded-2xl border text-left transition relative cursor-pointer ${
                isDark
                  ? 'bg-[#1A253D] border-indigo-500 shadow-md shadow-indigo-950/50'
                  : 'bg-slate-900 border-slate-700 text-white hover:border-indigo-400'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-slate-900 to-indigo-900 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shadow-xs">
                  <Moon className="w-4 h-4 text-indigo-400" />
                </div>
                {isDark && (
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                    ✓
                  </span>
                )}
              </div>
              <p className="text-xs font-bold text-white">Midnight Slate Dark</p>
              <p className="text-[10px] text-slate-300 mt-0.5">မျက်စိအေး ညအလင်းရောင် (Eye-Comfort)</p>
            </button>

            {/* Soft Porcelain Light Theme (Eye-comfort light) */}
            <button
              type="button"
              id="btn-setting-theme-light"
              onClick={() => onUpdateSettings({ themeMode: 'light' })}
              className={`p-3.5 rounded-2xl border text-left transition relative cursor-pointer ${
                !isDark
                  ? 'bg-indigo-50/70 border-indigo-600 text-slate-900 shadow-sm'
                  : 'bg-[#18233B] border-slate-700/60 text-slate-300 hover:border-indigo-400/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-amber-500 shadow-xs">
                  <Sun className="w-4 h-4 text-amber-500" />
                </div>
                {!isDark && (
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                    ✓
                  </span>
                )}
              </div>
              <p className={`text-xs font-bold ${!isDark ? 'text-slate-900' : 'text-slate-200'}`}>Soft Porcelain Light</p>
              <p className={`text-[10px] ${!isDark ? 'text-slate-600' : 'text-slate-400'} mt-0.5`}>မျက်စိအေး နေ့အလင်းရောင် (Glare-Free)</p>
            </button>
          </div>
        </div>

        {/* 3. MEETING SETTINGS */}
        <div className={`py-2 transition-colors ${isDark ? 'bg-[#131B2E]' : 'bg-white'}`}>
          <SectionTitle title="MEETING SETTINGS" isDark={isDark} />

          <SwitchItem
            id="setting-auto-mute"
            title="Always Mute Microphone on Join"
            subtitle="Automatically enters rooms in muted state"
            checked={settings.autoMuteMic}
            onChange={(val) => onUpdateSettings({ autoMuteMic: val })}
            icon={<Mic className="w-4 h-4 text-indigo-500" />}
            isDark={isDark}
          />

          <SwitchItem
            id="setting-turn-off-video"
            title="Turn Off My Video on Join"
            subtitle="Start meeting with camera disabled"
            checked={settings.turnOffVideoOnJoin}
            onChange={(val) => onUpdateSettings({ turnOffVideoOnJoin: val })}
            icon={<Video className="w-4 h-4 text-indigo-500" />}
            isDark={isDark}
          />

          <SwitchItem
            id="setting-show-non-video"
            title="Show Non-Video Participants"
            subtitle="Display audio-only tiles in grid"
            checked={settings.showNonVideoParticipants}
            onChange={(val) => onUpdateSettings({ showNonVideoParticipants: val })}
            icon={<Sliders className="w-4 h-4 text-indigo-500" />}
            isDark={isDark}
          />
        </div>

        {/* 4. MEETING SECURITY & PRIVACY */}
        <div className={`py-2 transition-colors ${isDark ? 'bg-[#131B2E]' : 'bg-white'}`}>
          <SectionTitle title="MEETING SECURITY & PRIVACY" isDark={isDark} />

          <SwitchItem
            id="setting-lock-meeting"
            title="Lock Meeting by Default"
            subtitle="Prevent new participants from joining ongoing rooms"
            checked={!!settings.lockMeetingByDefault}
            onChange={(val) => onUpdateSettings({ lockMeetingByDefault: val })}
            icon={<Lock className="w-4 h-4 text-indigo-500" />}
            isDark={isDark}
          />

          <SwitchItem
            id="setting-waiting-room"
            title="Enable Waiting Room"
            subtitle="Place incoming participants in waiting room until admitted"
            checked={settings.waitingRoomByDefault ?? true}
            onChange={(val) => onUpdateSettings({ waitingRoomByDefault: val })}
            icon={<Shield className="w-4 h-4 text-indigo-500" />}
            isDark={isDark}
          />

          <SwitchItem
            id="setting-allow-screenshare"
            title="Allow Participants to Share Screen"
            subtitle="Permit non-host participants to broadcast screens"
            checked={!!settings.allowParticipantScreenShare}
            onChange={(val) => onUpdateSettings({ allowParticipantScreenShare: val })}
            icon={<Share2 className="w-4 h-4 text-indigo-500" />}
            isDark={isDark}
          />

          <SwitchItem
            id="setting-allow-chat"
            title="Allow Participants to Chat"
            subtitle="Permit attendees to send group & direct messages"
            checked={settings.allowParticipantChat ?? true}
            onChange={(val) => onUpdateSettings({ allowParticipantChat: val })}
            icon={<MessageSquare className="w-4 h-4 text-indigo-500" />}
            isDark={isDark}
          />

          <SwitchItem
            id="setting-allow-rename"
            title="Allow Participants to Rename"
            subtitle="Permit attendees to change their display name"
            checked={settings.allowParticipantRename ?? true}
            onChange={(val) => onUpdateSettings({ allowParticipantRename: val })}
            icon={<Edit3 className="w-4 h-4 text-indigo-500" />}
            isDark={isDark}
          />

          <SwitchItem
            id="setting-allow-unmute"
            title="Allow Participants to Unmute"
            subtitle="Permit attendees to unmute their own microphone"
            checked={settings.allowParticipantUnmute ?? true}
            onChange={(val) => onUpdateSettings({ allowParticipantUnmute: val })}
            icon={<Mic className="w-4 h-4 text-indigo-500" />}
            isDark={isDark}
          />
        </div>

        {/* 5. VIDEO & AUDIO & VIRTUAL BACKGROUND */}
        <div className={`py-2 transition-colors ${isDark ? 'bg-[#131B2E]' : 'bg-white'}`}>
          <SectionTitle title="VIDEO & AUDIO" isDark={isDark} />

          <SwitchItem
            id="setting-hd-video"
            title="Enable HD Video"
            subtitle="720p / 1080p high bitrate streaming"
            checked={settings.hdVideo}
            onChange={(val) => onUpdateSettings({ hdVideo: val })}
            icon={<Video className="w-4 h-4 text-indigo-500" />}
            isDark={isDark}
          />

          <SwitchItem
            id="setting-mirror-video"
            title="Mirror My Video"
            subtitle="Flips front camera display horizontally"
            checked={settings.mirrorMyVideo}
            onChange={(val) => onUpdateSettings({ mirrorMyVideo: val })}
            icon={<Sliders className="w-4 h-4 text-indigo-500" />}
            isDark={isDark}
          />

          <SwitchItem
            id="setting-noise-suppression"
            title="Noise Suppression"
            subtitle="Filter background clicks, fans and room echoes"
            checked={settings.noiseSuppression}
            onChange={(val) => onUpdateSettings({ noiseSuppression: val })}
            icon={<Volume2 className="w-4 h-4 text-indigo-500" />}
            isDark={isDark}
          />

          {/* Virtual Background Configuration Row */}
          <div
            id="setting-virtual-bg-row"
            className={`px-4 py-3 flex items-center justify-between transition ${
              isDark ? 'hover:bg-[#1A253D] text-slate-100' : 'hover:bg-slate-50 text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <ImageIcon className="w-4 h-4 text-indigo-500" />
              <div>
                <span className={`text-sm font-medium ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Virtual Background</span>
                <p className={`text-xs capitalize ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
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
                className={`text-xs font-semibold px-2.5 py-1 rounded-lg border cursor-pointer transition ${
                  isDark
                    ? 'text-indigo-300 bg-indigo-950/60 border-indigo-500/30 hover:bg-indigo-900/60'
                    : 'text-indigo-700 bg-indigo-50 border-indigo-200 hover:bg-indigo-100'
                }`}
              >
                Change / Upload
              </button>
              <Switch
                id="toggle-virtual-bg"
                checked={settings.enableVirtualBackground}
                onChange={(val) => onUpdateSettings({ enableVirtualBackground: val })}
                isDark={isDark}
              />
            </div>
          </div>

          {/* Avatar on/off */}
          <div
            id="setting-avatar-row"
            className={`px-4 py-3 flex items-center justify-between transition border-t ${
              isDark ? 'hover:bg-[#1A253D] border-slate-800/80 text-slate-100' : 'hover:bg-slate-50 border-slate-100 text-slate-900'
            }`}
          >
            <span
              className={`text-sm font-medium cursor-pointer ${isDark ? 'text-slate-100' : 'text-slate-900'}`}
              onClick={() => setIsAvatarModalOpen(true)}
            >
              Avatar Mode
            </span>
            <Switch
              id="toggle-avatar-mask"
              checked={!!settings.enableAvatarMask}
              onChange={(val) =>
                onUpdateSettings({
                  enableAvatarMask: val,
                  avatarMaskMode: 'full_avatar',
                })
              }
              isDark={isDark}
            />
          </div>
        </div>

        {/* 6. CHAT & SUBTITLES */}
        <div className={`py-2 transition-colors ${isDark ? 'bg-[#131B2E]' : 'bg-white'}`}>
          <SectionTitle title="CHAT & SUBTITLES" isDark={isDark} />

          {/* Chat Filter */}
          <div
            id="setting-chat-filter"
            onClick={() => setIsChatFilterModalOpen(true)}
            className={`px-4 py-3 flex items-center justify-between transition cursor-pointer ${
              isDark ? 'hover:bg-[#1A253D] text-slate-100' : 'hover:bg-slate-50 text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <Filter className="w-4 h-4 text-indigo-500" />
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Chat Filter</p>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {settings.chatFilter === 'all'
                    ? 'View All Messages Across Rooms'
                    : 'Filter History Strictly by Active Meeting Token'}
                </p>
              </div>
            </div>
            <ChevronRight className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
          </div>

          {/* Subtitle Language Selection */}
          <div
            id="setting-subtitle-language"
            onClick={() => setIsLangModalOpen(true)}
            className={`px-4 py-3 flex items-center justify-between transition cursor-pointer ${
              isDark ? 'hover:bg-[#1A253D] text-slate-100' : 'hover:bg-slate-50 text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <Languages className="w-4 h-4 text-indigo-500" />
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Live Subtitle Language</p>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Current: {currentLanguage}</p>
              </div>
            </div>
            <div className={`flex items-center gap-1.5 text-xs font-semibold ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
              <span>Select</span>
              <ChevronRight className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
            </div>
          </div>
        </div>

        {/* 7. ABOUT & LEGAL */}
        <div className={`py-2 transition-colors ${isDark ? 'bg-[#131B2E]' : 'bg-white'}`}>
          <SectionTitle title="ABOUT & LEGAL" isDark={isDark} />
          <div className="px-4 py-3 flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Application</p>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>CooM Social Meeting &amp; Video Platform</p>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold font-mono border ${
              isDark
                ? 'bg-indigo-950/60 border-indigo-500/30 text-indigo-300'
                : 'bg-indigo-50 border-indigo-200 text-indigo-700'
            }`}>
              v2.5.0-clean.2026
            </span>
          </div>
          <div className={`px-4 py-2 flex items-center justify-between text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <span>Package ID (APK)</span>
            <span className={`font-mono text-[11px] font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>com.coom.app</span>
          </div>
          <div className={`px-4 py-2 flex items-center justify-between text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <span>App Name (APK)</span>
            <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>CooM</span>
          </div>

          {/* Account Log Out Action */}
          {onLogout && (
            <div className="px-4 pt-3 pb-1">
              <button
                type="button"
                id="btn-settings-logout"
                onClick={onLogout}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-rose-500/30 transition cursor-pointer active:scale-98"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out of CooM (အကောင့်ထွက်မည်)</span>
              </button>
            </div>
          )}
        </div>

          <div className={`px-4 py-3 border-t mt-2 rounded-xl mx-4 space-y-1 ${
            isDark ? 'border-slate-800 bg-[#131B2E]/60 text-slate-300' : 'border-slate-200 bg-slate-50/80 text-slate-800'
          }`}>
            <p className={`text-[11px] font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              © 2026 CooM Inc. All rights reserved.
            </p>
            <p className={`text-[10px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              CooM™ is a registered trademark of CooM Inc. All content, video streams, audio processing, and software algorithms are protected under international copyright and intellectual property laws.
            </p>
          </div>
        </div>
      </div>

      {/* Subtitle Language Selection Modal */}
      {isLangModalOpen && (
        <div
          id="lang-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={() => setIsLangModalOpen(false)}
        >
          <div
            id="lang-modal-container"
            className={`w-full max-w-sm border rounded-2xl p-5 shadow-2xl transition-colors ${
              isDark ? 'bg-[#131B2E] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`flex items-center gap-2 pb-3 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <Languages className="w-5 h-5 text-indigo-500" />
              <h3 className={`font-bold text-base ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Subtitle Language</h3>
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
                        ? isDark
                          ? 'bg-indigo-950/60 border border-indigo-500/50 text-indigo-300 font-semibold'
                          : 'bg-indigo-50 border border-indigo-300 text-indigo-900 font-semibold'
                        : isDark
                          ? 'hover:bg-[#1A253D] text-slate-300'
                          : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{lang.flag}</span>
                      <span className="text-sm font-medium">{lang.name}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-indigo-500" />}
                  </button>
                );
              })}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsLangModalOpen(false)}
                className={`w-full py-2 text-xs font-semibold rounded-xl transition ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                }`}
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={() => setIsChatFilterModalOpen(false)}
        >
          <div
            id="chat-filter-modal-container"
            className={`w-full max-w-sm border rounded-2xl p-5 shadow-2xl transition-colors ${
              isDark ? 'bg-[#131B2E] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={`font-bold text-base pb-3 border-b ${
              isDark ? 'border-slate-800 text-slate-100' : 'border-slate-200 text-slate-900'
            }`}>
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
                    ? isDark
                      ? 'border-indigo-500 bg-indigo-950/60 text-indigo-300'
                      : 'border-indigo-500 bg-indigo-50 text-indigo-900'
                    : isDark
                      ? 'border-slate-800 hover:bg-[#1A253D] text-slate-300'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className={`font-semibold text-sm ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>View All Room Chats</div>
                <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Combines chat streams from all meetings</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateSettings({ chatFilter: 'token' });
                  setIsChatFilterModalOpen(false);
                }}
                className={`w-full text-left p-3 rounded-xl border transition ${
                  settings.chatFilter === 'token'
                    ? isDark
                      ? 'border-indigo-500 bg-indigo-950/60 text-indigo-300'
                      : 'border-indigo-500 bg-indigo-50 text-indigo-900'
                    : isDark
                      ? 'border-slate-800 hover:bg-[#1A253D] text-slate-300'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className={`font-semibold text-sm ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Strict Token Scoping</div>
                <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setIsBgThemeModalOpen(false)}
        >
          <div
            id="bg-theme-modal-container"
            className={`w-full max-w-md border rounded-2xl p-5 shadow-2xl space-y-4 transition-colors ${
              isDark ? 'bg-[#131B2E] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`flex items-center justify-between pb-3 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <div>
                <h3 className={`font-bold text-base ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Virtual Background</h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Change or upload meeting background
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsBgThemeModalOpen(false)}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800'
                }`}
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
                    ? isDark
                      ? 'border-indigo-500 bg-indigo-950/60 text-indigo-300'
                      : 'border-indigo-500 bg-indigo-50 text-indigo-900'
                    : isDark
                      ? 'border-slate-800 text-slate-400 hover:bg-[#1A253D]'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Camera className="w-5 h-5 text-indigo-500" />
                <div>
                  <p className={`text-xs font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Normal Camera</p>
                  <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Default Camera</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onUpdateSettings({ enableVirtualBackground: true })}
                className={`p-3 rounded-xl border text-left transition flex items-center gap-2.5 ${
                  settings.enableVirtualBackground
                    ? isDark
                      ? 'border-indigo-500 bg-indigo-950/60 text-indigo-300'
                      : 'border-indigo-500 bg-indigo-50 text-indigo-900'
                    : isDark
                      ? 'border-slate-800 text-slate-400 hover:bg-[#1A253D]'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ImageIcon className="w-5 h-5 text-indigo-500" />
                <div>
                  <p className={`text-xs font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Virtual Background</p>
                  <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Virtual Backdrop</p>
                </div>
              </button>
            </div>

            {/* Upload Custom Image Section */}
            <div className={`p-3.5 border rounded-xl space-y-2 ${
              isDark ? 'bg-[#0B0F19] border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <Upload className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Upload Custom Background Photo</span>
                </span>
                {settings.virtualBackgroundCustomImage && (
                  <button
                    type="button"
                    onClick={handleRemoveCustomImage}
                    className="text-[10px] text-rose-500 hover:text-rose-400 flex items-center gap-1 font-semibold"
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
                      ? 'border-indigo-500 ring-2 ring-indigo-500/30'
                      : isDark ? 'border-slate-700' : 'border-slate-300'
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
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-600 text-white font-bold">
                      Active
                    </span>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition group ${
                    isDark
                      ? 'border-slate-700 hover:border-indigo-500 bg-[#131B2E]'
                      : 'border-slate-300 hover:border-indigo-500 bg-white'
                  }`}
                >
                  <Upload className="w-6 h-6 mx-auto text-indigo-500 mb-1.5 transition" />
                  <p className={`text-xs font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    Upload your background photo
                  </p>
                  <p className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
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
                className={`w-full py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{settings.virtualBackgroundCustomImage ? 'Upload Different Image' : 'Choose Image File'}</span>
              </button>
            </div>

            {/* Or Preset Background Themes */}
            <div className="space-y-2">
              <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Or Preset Backgrounds:</span>
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
                          ? 'border-indigo-500 ring-2 ring-indigo-500/40'
                          : isDark ? 'border-slate-800 hover:border-slate-600' : 'border-slate-200 hover:border-slate-400'
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
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md">
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
                className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-xs font-bold text-white rounded-xl transition shadow-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Avatar Face Mask & 10 Trending Avatars Modal */}
      <AvatarPickerModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        settings={settings}
        onUpdateSettings={onUpdateSettings}
      />
    </div>
  );
};

const SectionTitle: React.FC<{ title: string; isDark?: boolean }> = ({ title, isDark }) => (
  <div className="px-4 pt-3 pb-1">
    <span className={`text-[11px] font-bold tracking-wider ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
      {title}
    </span>
  </div>
);

interface SwitchItemProps {
  id: string;
  title: string;
  subtitle?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon?: React.ReactNode;
  isDark?: boolean;
}

const SwitchItem: React.FC<SwitchItemProps> = ({
  id,
  title,
  subtitle,
  checked,
  onChange,
  icon,
  isDark,
}) => (
  <div
    id={id}
    onClick={() => onChange(!checked)}
    className={`px-4 py-3 flex items-center justify-between transition cursor-pointer ${
      isDark ? 'hover:bg-[#1A253D] text-slate-100' : 'hover:bg-slate-50 text-slate-900'
    }`}
  >
    <div className="flex items-center gap-3 pr-4">
      {icon}
      <div>
        <p className={`text-sm font-medium leading-snug ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{title}</p>
        {subtitle && <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{subtitle}</p>}
      </div>
    </div>
    <Switch id={`toggle-${id}`} checked={checked} onChange={onChange} isDark={isDark} />
  </div>
);

const Switch: React.FC<{
  id: string;
  checked: boolean;
  onChange: (val: boolean) => void;
  isDark?: boolean;
}> = ({ id, checked, onChange, isDark }) => (
  <button
    id={id}
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={(e) => {
      e.stopPropagation();
      onChange(!checked);
    }}
    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out shrink-0 cursor-pointer ${
      checked ? 'bg-indigo-600' : isDark ? 'bg-slate-700' : 'bg-slate-300'
    }`}
  >
    <div
      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
);
