import React, { useState, useRef, useEffect } from 'react';
import { AvatarMaskId, UserSettings } from '../types';
import { TRENDING_AVATARS } from '../data/avatarPresets';
import { AvatarFaceMaskCanvas } from './AvatarFaceMaskCanvas';
import {
  X,
  Sparkles,
  Camera,
  Shield,
  Volume2,
  Video,
  Check,
  Smile,
  RefreshCw,
  Eye,
  Zap,
} from 'lucide-react';

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
  const [isTestCamActive, setIsTestCamActive] = useState(false);
  const [testStream, setTestStream] = useState<MediaStream | null>(null);
  const [camError, setCamError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const activeAvatarId: AvatarMaskId = settings.selectedAvatarId || 'fox_cyber';
  const isAvatarEnabled = !!settings.enableAvatarMask;
  const maskMode = settings.avatarMaskMode || 'mask_overlay';

  const selectedPreset =
    TRENDING_AVATARS.find((a) => a.id === activeAvatarId) || TRENDING_AVATARS[0];

  // Start / Stop camera for live mirror test inside modal
  const handleToggleTestCam = async () => {
    if (isTestCamActive) {
      stopTestCam();
    } else {
      try {
        setCamError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
          audio: true,
        });
        setTestStream(stream);
        setIsTestCamActive(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.warn('Test camera permission warning:', err);
        setCamError('Camera access required to test real-time face tracking.');
      }
    }
  };

  const stopTestCam = () => {
    if (testStream) {
      testStream.getTracks().forEach((track) => track.stop());
      setTestStream(null);
    }
    setIsTestCamActive(false);
  };

  useEffect(() => {
    if (!isOpen) {
      stopTestCam();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isTestCamActive && videoRef.current && testStream) {
      videoRef.current.srcObject = testStream;
    }
  }, [isTestCamActive, testStream]);

  if (!isOpen) return null;

  return (
    <div
      id="avatar-picker-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="avatar-picker-modal-container"
        className="w-full max-w-lg bg-white border border-neutral-200 rounded-3xl p-4 sm:p-5 text-neutral-900 shadow-2xl space-y-4 max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-200 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-sm">
              <Smile className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-neutral-900 flex items-center gap-1.5">
                <span>Avatar Face Mask (မျက်နှာဖုံး)</span>
                <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">
                  10 Avatars
                </span>
              </h3>
              <p className="text-xs text-neutral-500">
                မျက်နှာမပြချင်သူများအတွက် မျက်နှာလှုပ်ရှားမှု match ဖြစ်သော Avatar
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 hover:text-neutral-800 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Main Toggle: Normal Face vs Avatar Mask */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => onUpdateSettings({ enableAvatarMask: false })}
              className={`p-3 rounded-2xl border text-left transition flex items-center gap-3 ${
                !isAvatarEnabled
                  ? 'border-purple-600 bg-purple-50/80 ring-2 ring-purple-500/20 text-purple-900'
                  : 'border-neutral-200 hover:bg-neutral-50 text-neutral-600'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-700 shrink-0">
                <Camera className="w-5 h-5 text-neutral-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-neutral-900">Normal Face (ရိုးရိုးမျက်နှာ)</p>
                <p className="text-[10px] text-neutral-500">Show real camera video</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onUpdateSettings({ enableAvatarMask: true })}
              className={`p-3 rounded-2xl border text-left transition flex items-center gap-3 ${
                isAvatarEnabled
                  ? 'border-purple-600 bg-purple-50/80 ring-2 ring-purple-500/20 text-purple-900'
                  : 'border-neutral-200 hover:bg-neutral-50 text-neutral-600'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                <Smile className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-neutral-900">Avatar Mask (မျက်နှာဖုံး)</p>
                <p className="text-[10px] text-purple-700 font-medium">Real-time Face Match</p>
              </div>
            </button>
          </div>

          {/* Privacy Mask Mode Selector (AR Overlay vs Full Privacy) */}
          <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-purple-600" />
                <span>Masking Mode (မျက်နှာဖုံး ပုံစံ)</span>
              </span>
              <span className="text-[10px] text-neutral-500">Privacy Preference</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onUpdateSettings({ avatarMaskMode: 'mask_overlay' })}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold text-left transition flex items-center gap-2 ${
                  maskMode === 'mask_overlay'
                    ? 'border-purple-600 bg-white text-purple-900 shadow-xs ring-1 ring-purple-400'
                    : 'border-neutral-200 bg-white/60 text-neutral-600 hover:bg-white'
                }`}
              >
                <span className="text-base">🎭</span>
                <div>
                  <div className="leading-tight">Face Mask Overlay</div>
                  <div className="text-[9px] text-neutral-400 font-normal">
                    Masks face over real webcam
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onUpdateSettings({ avatarMaskMode: 'full_avatar' })}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold text-left transition flex items-center gap-2 ${
                  maskMode === 'full_avatar'
                    ? 'border-purple-600 bg-white text-purple-900 shadow-xs ring-1 ring-purple-400'
                    : 'border-neutral-200 bg-white/60 text-neutral-600 hover:bg-white'
                }`}
              >
                <span className="text-base">🛡️</span>
                <div>
                  <div className="leading-tight">Full Studio Privacy</div>
                  <div className="text-[9px] text-neutral-400 font-normal">
                    100% hides face & room
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Live Camera Testing Mirror */}
          <div className="bg-neutral-900 rounded-2xl p-3 border border-neutral-800 space-y-2 text-white overflow-hidden shadow-inner">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-neutral-200">
                  Live Mirror Test (ကင်မရာ စမ်းသပ်ရန်)
                </span>
              </div>
              <button
                type="button"
                onClick={handleToggleTestCam}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  isTestCamActive
                    ? 'bg-rose-600 hover:bg-rose-500 text-white'
                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>{isTestCamActive ? 'Turn Off Test Cam' : 'Start Live Test'}</span>
              </button>
            </div>

            {/* Live Camera / Avatar Canvas Box */}
            <div className="relative w-full h-44 rounded-xl overflow-hidden bg-black flex items-center justify-center border border-white/10">
              {isTestCamActive ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover -scale-x-100"
                  />
                  {/* Avatar Engine Canvas */}
                  <AvatarFaceMaskCanvas
                    avatarId={activeAvatarId}
                    videoElement={videoRef.current}
                    audioStream={testStream}
                    mode={maskMode}
                    mirror={true}
                    showHUD={true}
                  />
                </>
              ) : (
                <div className="text-center p-4 space-y-2">
                  <div className="text-4xl">{selectedPreset.emoji}</div>
                  <p className="text-xs font-semibold text-neutral-300">
                    {selectedPreset.name} ({selectedPreset.nameMm})
                  </p>
                  <p className="text-[11px] text-neutral-500 max-w-xs mx-auto">
                    Click "Start Live Test" to open camera and test head motion, talking & blinking
                    tracking!
                  </p>
                </div>
              )}

              {camError && (
                <div className="absolute inset-0 bg-black/85 flex items-center justify-center p-4 text-center">
                  <p className="text-xs text-rose-400">{camError}</p>
                </div>
              )}
            </div>
          </div>

          {/* 10 Trending Avatars Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>10 Trending Avatars (ခေတ်စားနေသော Avatar များ)</span>
              </span>
              <span className="text-[11px] text-purple-600 font-semibold">
                {selectedPreset.emoji} {selectedPreset.name}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 gap-2.5">
              {TRENDING_AVATARS.map((avatar) => {
                const isSelected = activeAvatarId === avatar.id;
                return (
                  <button
                    key={avatar.id}
                    type="button"
                    onClick={() => {
                      onUpdateSettings({
                        enableAvatarMask: true,
                        selectedAvatarId: avatar.id,
                      });
                    }}
                    className={`relative p-3 rounded-2xl border text-left transition flex items-start gap-2.5 group cursor-pointer ${
                      isSelected
                        ? 'border-purple-600 bg-purple-50/70 ring-2 ring-purple-500/30'
                        : 'border-neutral-200 hover:border-purple-300 hover:bg-neutral-50/80 bg-white'
                    }`}
                  >
                    {/* Big Emoji Circle with Avatar glow */}
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-xs group-hover:scale-105 transition"
                      style={{
                        backgroundColor: `${avatar.primaryColor}15`,
                        borderColor: avatar.primaryColor,
                      }}
                    >
                      {avatar.emoji}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-neutral-900 truncate">
                          {avatar.name}
                        </span>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] text-purple-700 font-medium truncate">
                        {avatar.nameMm}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-neutral-100 text-neutral-600 font-medium">
                          {avatar.badge}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-2 border-t border-neutral-200 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 active:scale-[0.98] text-xs font-bold text-white rounded-2xl transition shadow-sm text-center cursor-pointer"
          >
            Done (သိမ်းဆည်းမည်)
          </button>
        </div>
      </div>
    </div>
  );
};
