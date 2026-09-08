import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  Subtitles,
  Sparkles,
  NotebookTabs,
  MessageCircle,
  MessageSquare,
  Filter,
  Volume2,
  Heart,
  Radio,
  ChevronUp,
  ChevronDown,
  Plus,
  Edit3,
  X,
  Share2
} from 'lucide-react';
import { MeetingRoom, MeetingNote, ChatMessage, UserSettings, MeetingComment, UserProfile } from '../types';
import { MultiFilterDialog } from './MultiFilterDialog';
import { GranolaNotesModal } from './GranolaNotesModal';
import { MeetingChatModal } from './MeetingChatModal';
import { TikTokCommentsModal } from './TikTokCommentsModal';
import { languageOptions, initialUserProfile } from '../data/initialData';

interface MeetingRoomTileProps {
  room: MeetingRoom;
  rooms: MeetingRoom[];
  chats: ChatMessage[];
  settings: UserSettings;
  roomIndex: number;
  totalRooms: number;
  onPrevRoom: () => void;
  onNextRoom: () => void;
  onSelectRoomToken: (token: string) => void;
  onOpenCreateRoom: () => void;
  onSendMessage: (roomToken: string, text: string, recipient?: string) => void;
  onExportToFeed: (text: string) => void;
  notes?: MeetingNote[];
  onAddNote?: (newNote: MeetingNote) => void;
  isSubtitlesOverlayOn?: boolean;
  onUpdateRoomDetails?: (roomId: string, newTitle: string, newToken: string) => void;
  isRecording?: boolean;
  onToggleRecording?: (token: string, isStart: boolean, durationSec?: number) => void;
  onOpenProfile?: () => void;
  comments?: Record<string, MeetingComment[]>;
  userProfile?: UserProfile;
  onAddComment?: (meetingToken: string, text: string, replyToCommentId?: string, replyToUser?: string) => void;
  onToggleLikeComment?: (meetingToken: string, commentId: string, replyId?: string) => void;
}

interface FloatingHeart {
  id: number;
  x: number;
  color: string;
}

export const MeetingRoomTile: React.FC<MeetingRoomTileProps> = ({
  room,
  rooms,
  chats,
  settings,
  roomIndex,
  totalRooms,
  onPrevRoom,
  onNextRoom,
  onSelectRoomToken,
  onOpenCreateRoom,
  onSendMessage,
  onExportToFeed,
  notes = [],
  onAddNote,
  isSubtitlesOverlayOn = true,
  onUpdateRoomDetails,
  isRecording = false,
  onToggleRecording,
  onOpenProfile,
  comments = {},
  userProfile = initialUserProfile,
  onAddComment,
  onToggleLikeComment,
}) => {
  // State matching Flutter state
  const [selectedFilterUsers, setSelectedFilterUsers] = useState<string[]>(['All']);
  // Default Mic and Subtitles OFF on start as requested
  const [isMicOn, setIsMicOn] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false); // Default Camera OFF as requested
  const [userRole, setUserRole] = useState<'speaker' | 'listener'>('listener'); // Default Listener (Mic Auto-OFF)
  const [isTranscribeOn, setIsTranscribeOn] = useState(false);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [directChatUser, setDirectChatUser] = useState<string | null>(null);
  const [likeCount, setLikeCount] = useState(142 + roomIndex * 37);
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const [subtitlesIndex, setSubtitlesIndex] = useState(0);

  // Count notes for this room
  const roomNotesCount = notes.filter((n) => n.meetingToken === room.token).length;

  // Comments for this room
  const roomComments = comments[room.token] || [];
  const roomTotalCommentsCount = roomComments.reduce(
    (acc, c) => acc + 1 + (c.replies ? c.replies.length : 0),
    0
  );

  // Per-participant audio listening toggle (true = listening to this speaker, false = muted by viewer)
  // Default all users muted when joining as listener
  const [mutedListeningUsers, setMutedListeningUsers] = useState<Record<string, boolean>>(() => {
    const allMuted: Record<string, boolean> = {};
    room.participants.forEach((p) => {
      allMuted[p] = true;
    });
    return allMuted;
  });

  // Per-participant subtitle toggle (default OFF for all speakers as requested)
  const [userSubtitlesActive, setUserSubtitlesActive] = useState<Record<string, boolean>>({});

  // Floating feedback toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Local Recording state with live timer
  const [isLocalRecording, setIsLocalRecording] = useState(isRecording);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setIsLocalRecording(isRecording);
  }, [isRecording]);

  useEffect(() => {
    if (isLocalRecording) {
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      setRecordingSeconds(0);
    }
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [isLocalRecording]);

  const formatRecordingTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleToggleRecording = () => {
    const nextRecording = !isLocalRecording;
    setIsLocalRecording(nextRecording);
    if (nextRecording) {
      setToastMessage(`🔴 Recording Started (${room.token})`);
      if (onToggleRecording) onToggleRecording(room.token, true);
    } else {
      setToastMessage(`💾 Meeting Saved to Profile! (${formatRecordingTime(recordingSeconds)})`);
      if (onToggleRecording) onToggleRecording(room.token, false, recordingSeconds);
    }
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Edit Meeting Details Modal state
  const [isEditMeetingModalOpen, setIsEditMeetingModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(room.title);
  const [editToken, setEditToken] = useState(room.token);

  useEffect(() => {
    setEditTitle(room.title);
    setEditToken(room.token);
  }, [room.id, room.title, room.token]);

  const handleSaveMeetingDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) return;
    const formattedToken = editToken.trim().startsWith('#')
      ? editToken.trim().toUpperCase()
      : `#${editToken.trim().toUpperCase()}`;
    if (onUpdateRoomDetails) {
      onUpdateRoomDetails(room.id, editTitle.trim(), formattedToken);
    }
    setIsEditMeetingModalOpen(false);
    setToastMessage('✏️ Meeting details updated!');
    setTimeout(() => setToastMessage(null), 2000);
  };

  const toggleUserListening = (user: string) => {
    setMutedListeningUsers((prev) => {
      const isCurrentlyMuted = !!prev[user];
      const nextMuted = !isCurrentlyMuted;
      setToastMessage(nextMuted ? `🔇 Muted ${user} (Audio Off)` : `🎧 Listening to ${user} (Audio On)`);
      setTimeout(() => setToastMessage(null), 2200);
      return { ...prev, [user]: nextMuted };
    });
  };

  const toggleUserSubtitles = (user: string) => {
    setUserSubtitlesActive((prev) => {
      const isCurrentlyOn = Boolean(prev[user]);
      const nextOn = !isCurrentlyOn;
      setToastMessage(nextOn ? `💬 Subtitles ON for ${user}` : `💬 Subtitles OFF for ${user}`);
      setTimeout(() => setToastMessage(null), 2200);
      return { ...prev, [user]: nextOn };
    });
  };

  // Role selector (Speaker vs Listener)
  // Selecting Listener auto-mutes mic and turns off audio listening
  // Selecting Speaker auto-unmutes mic and enables audio
  const handleSelectRole = (role: 'speaker' | 'listener') => {
    setUserRole(role);
    if (role === 'speaker') {
      setIsMicOn(true);
      setMutedListeningUsers({});
      setToastMessage('🎙️ Speaker Mode: Mic Auto-ON (All Active)');
    } else {
      setIsMicOn(false);
      const allMuted: Record<string, boolean> = {};
      room.participants.forEach((p) => {
        allMuted[p] = true;
      });
      setMutedListeningUsers(allMuted);
      setToastMessage('🎧 Listener Mode: Mic Auto-OFF (Muted)');
    }
    setTimeout(() => setToastMessage(null), 2200);
  };

  // Master Muted toggle: Toggling off mutes all users' mics; toggling on activates all
  const handleToggleGlobalMic = () => {
    const nextMic = !isMicOn;
    setIsMicOn(nextMic);
    if (nextMic) {
      setUserRole('speaker');
      setMutedListeningUsers({});
      setToastMessage('🎙️ All Mics ON: All User Audio Active');
    } else {
      setUserRole('listener');
      const allMuted: Record<string, boolean> = {};
      room.participants.forEach((p) => {
        allMuted[p] = true;
      });
      setMutedListeningUsers(allMuted);
      setToastMessage('🔇 All Mics Muted: User Audio OFF');
    }
    setTimeout(() => setToastMessage(null), 2200);
  };

  // Camera toggle: When OFF, user screen does not show; when ON, camera opens and face appears
  const handleToggleCamera = () => {
    const nextCam = !isCameraOn;
    setIsCameraOn(nextCam);
    setToastMessage(
      nextCam
        ? '📹 Camera Turned ON (Your Screen Active)'
        : '🚫 Camera Turned OFF (Your Screen Hidden)'
    );
    setTimeout(() => setToastMessage(null), 2200);
  };

  // Active speaker cycling simulation
  const [speakingUser, setSpeakingUser] = useState<string>(room.host);

  // Webcam stream state & lifecycle management
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Robust function to start user camera
  const startCamera = async () => {
    setIsCameraLoading(true);
    setCameraError(null);

    // Stop existing stream if any
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error('Webcam API not supported in this browser.');
      }

      let stream: MediaStream;
      try {
        // First try high-quality user-facing constraints
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 1280, min: 320 },
            height: { ideal: 720, min: 240 },
          },
          audio: false,
        });
      } catch (firstErr) {
        console.warn('High quality constraints rejected, trying fallback { video: true }:', firstErr);
        // Fallback to basic video constraint
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      // Ensure all video tracks are active and unmuted
      stream.getVideoTracks().forEach((track) => {
        track.enabled = true;
      });

      streamRef.current = stream;
      setLocalStream(stream);
      setIsCameraLoading(false);

      // Link immediately to video element if mounted
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((err) => {
          console.warn('Initial video play error:', err);
        });
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setIsCameraLoading(false);
      setCameraError(
        err?.name === 'NotAllowedError'
          ? 'Browser camera permission denied. Please allow camera access in browser.'
          : err?.name === 'NotFoundError'
          ? 'No physical camera detected on this device.'
          : err?.message || 'Unable to access camera.'
      );
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraLoading(false);
    setCameraError(null);
  };

  // Trigger camera start/stop when isCameraOn state changes
  useEffect(() => {
    if (isCameraOn) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isCameraOn]);

  // Ensure stream is always attached to videoRef whenever localStream or ref updates
  useEffect(() => {
    if (videoRef.current && localStream) {
      if (videoRef.current.srcObject !== localStream) {
        videoRef.current.srcObject = localStream;
      }
      videoRef.current.play().catch((err) => {
        console.warn('Video element play error:', err);
      });
    }
  }, [localStream, isCameraOn]);

  // Callback ref for <video> element so stream attaches the very microsecond it mounts
  const handleVideoRef = (el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (el && localStream) {
      if (el.srcObject !== localStream) {
        el.srcObject = localStream;
      }
      el.play().catch((err) => {
        console.warn('Callback ref play error:', err);
      });
    }
  };

  // Language mapping
  const currentLang = languageOptions.find((l) => l.name === settings.whisperLanguage) || languageOptions[0];

  // Cycling subtitles simulation based on language
  const languageTranscriptions: Record<string, string[]> = {
    'Myanmar (MM)': [
      'အသံလှိုင်းကို Whisper AI ဖြင့် အချိန်နှင့်တပြေးညီ တိုက်ရိုက် စာသားပြောင်းနေပါသည်...',
      'ဆွေးနွေးချက် အဓိကအချက်များအား အလိုအလျောက် သီးခြားခွဲထုတ် သိမ်းဆည်းနေပါသည်...',
      'ပါဝင်သူများ၏ အသံကြိမ်နှုန်း စစ်ဆေးမှု အောင်မြင်ပါသည်...',
      'Post သို့ အလိုအလျောက် ရလဒ် ပို့ဆောင်နိုင်ရန် အဆင်သင့်ဖြစ်ပါပြီ...',
    ],
    'English (US)': [
      'Audio stream translated to text in real-time with Whisper AI...',
      'Multi-user dynamic grid layout actively synchronizing...',
      'Capturing key discussion points for automated X-Feed recap...',
      'Whisper AI speech model latency below 45ms across WebRTC streams...',
    ],
    'Thai (TH)': [
      'กำลังแปลสตรีมเสียงเป็นข้อความแบบเรียลไทม์ด้วย Whisper AI...',
      'กำลังบันทึกประเด็นสำคัญของการประชุมโดยอัตโนมัติ...',
    ],
    'Japanese (JA)': [
      'Whisper AIにより音声ストリームをリアルタイムでテキスト変換中...',
      '会議の重要ポイントを自動抽出しています...',
    ],
    'Chinese (ZH)': [
      'Whisper AI 正在将多路会议音频实时转化为字幕...',
      '会议要点与 X-Feed 摘要正在同步就绪...',
    ],
    'Spanish (ES)': [
      'Transmisión de audio traducida a texto en tiempo real con Whisper AI...',
      'Puntos clave sincronizados con el panel de reuniones...',
    ],
  };

  const currentSubtitlesList = languageTranscriptions[settings.whisperLanguage] || languageTranscriptions['Myanmar (MM)'];

  useEffect(() => {
    const interval = setInterval(() => {
      setSubtitlesIndex((prev) => (prev + 1) % currentSubtitlesList.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [currentSubtitlesList.length]);

  // Simulate active speaker switches between participants
  useEffect(() => {
    if (room.participants.length === 0) return;
    const interval = setInterval(() => {
      const randomUser = room.participants[Math.floor(Math.random() * room.participants.length)];
      setSpeakingUser(randomUser);
    }, 5000);
    return () => clearInterval(interval);
  }, [room.participants]);

  const toggleUserFilter = (userName: string) => {
    if (userName === 'All') {
      setSelectedFilterUsers(['All']);
    } else {
      let updated = selectedFilterUsers.filter((u) => u !== 'All');
      if (updated.includes(userName)) {
        updated = updated.filter((u) => u !== userName);
        if (updated.length === 0) {
          updated = ['All'];
        }
      } else {
        updated.push(userName);
      }
      setSelectedFilterUsers(updated);
    }
  };

  const handleTriggerHeart = (e?: React.MouseEvent) => {
    setLikeCount((prev) => prev + 1);
    const id = Date.now() + Math.random();
    const colors = ['#ef4444', '#ec4899', '#f43f5e', '#fb7185', '#f59e0b'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const randomX = Math.random() * 60 - 30; // slight spread
    setFloatingHearts((prev) => [...prev.slice(-12), { id, x: randomX, color: randomColor }]);

    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((h) => h.id !== id));
    }, 1500);
  };

  const handleOpenDirectChat = (userName: string) => {
    setDirectChatUser(userName);
    setIsChatOpen(true);
  };

  const handleOpenRoomChat = () => {
    setDirectChatUser(null);
    setIsChatOpen(true);
  };

  // Filtered participants
  const visibleUsers = selectedFilterUsers.includes('All')
    ? room.participants
    : room.participants.filter((u) => selectedFilterUsers.includes(u));

  const roomChats = chats.filter((c) => c.meetingToken === room.token);

  return (
    <div
      id={`meeting-tile-${room.id}`}
      className="relative w-full h-full bg-black overflow-hidden select-none flex flex-col justify-between"
      onDoubleClick={handleTriggerHeart}
    >
      {/* 1. Multi-User Video Grid */}
      <div className="absolute inset-0 z-0 bg-neutral-950 flex items-center justify-center p-2 pt-16 pb-28">
        {visibleUsers.length === 0 ? (
          <div className="text-center text-neutral-400 p-6 bg-neutral-900/60 rounded-2xl border border-neutral-800">
            <UsersPlaceholder />
            <p className="text-sm font-medium">No participant selected in filter</p>
            <button
              onClick={() => setSelectedFilterUsers(['All'])}
              className="mt-3 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold"
            >
              Reset to All
            </button>
          </div>
        ) : (
          <div
            className={`w-full h-full grid gap-2 ${
              visibleUsers.length === 1
                ? 'grid-cols-1 grid-rows-1'
                : visibleUsers.length === 2
                ? 'grid-cols-1 grid-rows-2 sm:grid-cols-2 sm:grid-rows-1'
                : 'grid-cols-2 grid-rows-2'
            }`}
          >
            {visibleUsers.map((user, idx) => {
              const isSpeaker = speakingUser === user;
              const isHost = user === room.host;
              const isMe = isHost || user === userProfile.name || user.toLowerCase().includes('aung') || user.includes('(Me)');
              const isLocalWebcam = isMe && isCameraOn && localStream;
              const isUserListening = !mutedListeningUsers[user];
              // Subtitles OFF by default as requested
              const isUserSubtitlesOn = Boolean(userSubtitlesActive[user]);
              const userOffset = user.charCodeAt(0) % currentSubtitlesList.length;
              const userSubtitleText = currentSubtitlesList[(subtitlesIndex + userOffset) % currentSubtitlesList.length];

              return (
                <div
                  key={user}
                  id={`video-tile-${user.replace(/\s+/g, '-').toLowerCase()}`}
                  className={`relative rounded-2xl overflow-hidden bg-neutral-900 border transition-all duration-300 flex items-center justify-center ${
                    isSpeaker
                      ? 'border-red-500 ring-2 ring-red-500/40 shadow-lg shadow-red-950/20'
                      : 'border-neutral-800/80'
                  }`}
                >
                  {/* Background gradient / simulated room canvas */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-b ${
                      idx % 3 === 0
                        ? 'from-neutral-900 via-neutral-950 to-neutral-900'
                        : idx % 3 === 1
                        ? 'from-zinc-900 via-neutral-950 to-zinc-900'
                        : 'from-stone-900 via-neutral-950 to-stone-900'
                    }`}
                  />

                  {/* 1. If Me and Camera is OFF: မိမိ screen မပေါ်ဘူး (Screen Hidden) */}
                  {isMe && !isCameraOn ? (
                    <div className="relative z-10 flex flex-col items-center justify-center p-4 text-center select-none">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-neutral-950 border border-neutral-800 flex items-center justify-center mb-2 shadow-2xl">
                        <VideoOff className="w-6 h-6 sm:w-7 sm:h-7 text-red-500" />
                      </div>
                      <span className="text-xs font-bold text-neutral-200 tracking-wide">
                        Camera Off
                      </span>
                      <span className="text-[10px] text-neutral-400 mt-0.5">
                        မိမိ Screen ပိတ်ထားပါသည်
                      </span>
                      <button
                        type="button"
                        onClick={handleToggleCamera}
                        className="mt-2.5 px-3 py-1 bg-red-950/80 hover:bg-red-900 active:scale-95 text-red-300 hover:text-white rounded-full text-[10px] font-semibold transition cursor-pointer border border-red-800/80 shadow-md flex items-center gap-1.5"
                      >
                        <VideoIcon className="w-3 h-3" />
                        <span>Turn on Cam</span>
                      </button>
                    </div>
                  ) : isMe && isCameraOn ? (
                    /* 2. If Me and Camera is ON: Camera ပွင့်ပီး ရုပ်ထွက်လာမယ် (Live webcam or active video feed) */
                    <div className="relative w-full h-full bg-black overflow-hidden flex items-center justify-center">
                      {/* Live Camera Video Feed */}
                      {localStream && !cameraError ? (
                        <video
                          ref={handleVideoRef}
                          autoPlay
                          playsInline
                          muted
                          onLoadedMetadata={(e) => {
                            (e.target as HTMLVideoElement).play().catch(() => {});
                          }}
                          onCanPlay={(e) => {
                            (e.target as HTMLVideoElement).play().catch(() => {});
                          }}
                          className={`w-full h-full object-cover transition-transform duration-200 ${
                            settings.mirrorMyVideo ? '-scale-x-100' : ''
                          }`}
                        />
                      ) : (
                        /* Fallback image when camera is starting or permission pending */
                        <div className="relative w-full h-full flex items-center justify-center bg-neutral-950">
                          <img
                            src={userProfile.avatar}
                            alt={user}
                            className={`w-full h-full object-cover opacity-90 ${
                              settings.mirrorMyVideo ? '-scale-x-100' : ''
                            }`}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
                        </div>
                      )}

                      {/* Loading State while Camera is initializing */}
                      {isCameraLoading && (
                        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80 backdrop-blur-xs text-center p-3">
                          <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mb-2" />
                          <span className="text-xs font-bold text-emerald-400">Camera စတင်ဖွင့်နေပါသည်...</span>
                          <span className="text-[10px] text-neutral-300 mt-0.5">Connecting live webcam video</span>
                        </div>
                      )}

                      {/* Error Banner with Retry Button */}
                      {cameraError && (
                        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-4 bg-black/85 text-center">
                          <div className="w-11 h-11 rounded-full bg-red-950/90 border border-red-700 flex items-center justify-center mb-2 shadow-lg">
                            <VideoOff className="w-5 h-5 text-red-400" />
                          </div>
                          <span className="text-xs font-bold text-red-400 mb-1">Camera မဖွင့်နိုင်ပါ</span>
                          <p className="text-[10px] text-neutral-300 max-w-[220px] mb-3 leading-snug">
                            {cameraError}
                          </p>
                          <button
                            type="button"
                            onClick={startCamera}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-full text-[10px] font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg border border-emerald-400/50"
                          >
                            <VideoIcon className="w-3.5 h-3.5" />
                            <span>Retry Camera (ပြန်လည်ဖွင့်မည်)</span>
                          </button>
                        </div>
                      )}

                      {/* Live Cam Active Pill */}
                      {!cameraError && !isCameraLoading && (
                        <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1 bg-emerald-950/90 border border-emerald-500/70 px-2 py-0.5 rounded-full text-[9px] font-bold text-emerald-400 backdrop-blur-md shadow-md">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          CAM LIVE
                        </div>
                      )}

                      {/* Name Pill overlay */}
                      <div className="absolute bottom-2.5 right-2.5 z-20 flex items-center gap-1 bg-black/75 px-2.5 py-0.5 rounded-full border border-neutral-700/80 text-[10px] font-semibold text-white backdrop-blur-md">
                        <span>{user} (Me)</span>
                        {isHost && <span className="bg-red-600 text-white text-[8px] px-1 rounded font-bold">HOST</span>}
                      </div>
                    </div>
                  ) : (
                    /* 3. Other Participants: Avatar & Audio Waveform */
                    <div className="relative z-10 flex flex-col items-center justify-center p-3">
                      {/* Pulse rings when speaking */}
                      <div className="relative">
                        {isSpeaker && (
                          <div className="absolute -inset-2 rounded-full border-2 border-red-500/60 animate-ping opacity-75" />
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDirectChat(user);
                          }}
                          className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center font-bold text-xl sm:text-2xl shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                            isSpeaker ? 'scale-105 bg-red-600 text-white ring-2 ring-red-400' : 'bg-neutral-800 text-neutral-200 border border-neutral-700 hover:border-red-500'
                          }`}
                          title={`Click to direct chat with ${user}`}
                        >
                          {user[0]}
                        </button>
                      </div>

                      {/* Participant name pill - Clickable for Direct Chat */}
                      <button
                        id={`btn-user-pill-chat-${user.replace(/\s+/g, '-').toLowerCase()}`}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDirectChat(user);
                        }}
                        className="mt-3 flex items-center gap-1.5 bg-black/70 hover:bg-red-950/80 active:scale-95 px-3 py-1 rounded-full border border-neutral-700/80 hover:border-red-500/80 transition cursor-pointer group shadow-lg"
                        title={`Click to 1-on-1 direct chat with ${user}`}
                      >
                        <MessageSquare className="w-3 h-3 text-red-400 group-hover:scale-110 transition" />
                        <span className="text-xs font-semibold text-white tracking-wide group-hover:text-red-200 transition">
                          {user}
                        </span>
                        {isHost && (
                          <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.2 rounded font-bold">
                            HOST
                          </span>
                        )}
                      </button>

                      {/* Waveform Equalizer when speaking & listening vs Audio Muted Badge */}
                      {isUserListening ? (
                        <div className="mt-2 flex items-center gap-1 h-3">
                          <span className={`w-0.5 bg-emerald-400 rounded-full transition-all ${isSpeaker ? 'h-3 animate-pulse' : 'h-1 opacity-40'}`} />
                          <span className={`w-0.5 bg-emerald-300 rounded-full transition-all ${isSpeaker ? 'h-4 animate-bounce' : 'h-1 opacity-40'}`} />
                          <span className={`w-0.5 bg-emerald-400 rounded-full transition-all ${isSpeaker ? 'h-2 animate-pulse' : 'h-1 opacity-40'}`} />
                          <span className={`w-0.5 bg-emerald-300 rounded-full transition-all ${isSpeaker ? 'h-3.5 animate-bounce' : 'h-1 opacity-40'}`} />
                        </div>
                      ) : (
                        <div className="mt-2 flex items-center gap-1 bg-red-950/80 border border-red-800/80 px-2 py-0.5 rounded-full text-[9px] text-red-300 font-mono">
                          <MicOff className="w-2.5 h-2.5" />
                          <span>AUDIO MUTED</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Floating Live Subtitle Bubble inside speaker cell (when subtitles on for this user) */}
                  {isUserSubtitlesOn && isTranscribeOn && (
                    <div
                      id={`bubble-subtitles-${user.replace(/\s+/g, '-').toLowerCase()}`}
                      className="absolute bottom-11 left-2 right-2 z-20 p-2 rounded-xl bg-black/85 backdrop-blur-md border border-cyan-500/50 text-white shadow-xl animate-in fade-in slide-in-from-bottom-1 pointer-events-none"
                    >
                      <div className="flex items-center justify-between text-[9px] text-cyan-400 font-semibold mb-0.5">
                        <span className="flex items-center gap-1">
                          <Volume2 className="w-2.5 h-2.5 text-cyan-400 animate-pulse" />
                          {user} ({settings.whisperLanguage})
                        </span>
                        <span className="text-[8px] bg-cyan-950/90 text-cyan-300 border border-cyan-800 px-1 py-0.2 rounded font-mono">
                          STT LIVE
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-100 font-medium leading-tight italic line-clamp-2">
                        "{userSubtitleText}"
                      </p>
                    </div>
                  )}

                  {/* Top-Right Quick Direct Chat Button (Only for other participants) */}
                  {!isMe && (
                    <button
                      id={`btn-corner-chat-${user.replace(/\s+/g, '-').toLowerCase()}`}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDirectChat(user);
                      }}
                      className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1 bg-black/70 hover:bg-red-600 active:scale-90 text-neutral-300 hover:text-white px-2 py-0.5 rounded-full border border-neutral-700/60 text-[10px] font-medium backdrop-blur-md transition shadow-md cursor-pointer"
                      title={`Direct 1-on-1 Chat with ${user}`}
                    >
                      <MessageSquare className="w-3 h-3 text-red-400 group-hover:text-white" />
                      <span>Chat</span>
                    </button>
                  )}

                  {/* Corner Status: LIVE + Interactive Mic listening on/off + Subtitle on/off */}
                  <div className="absolute bottom-2 left-2 z-20 flex items-center gap-1">
                    <div className="hidden sm:flex items-center gap-1 bg-black/70 backdrop-blur-md px-1.5 py-0.5 rounded-full border border-white/10 text-[9px] text-emerald-400 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      LIVE
                    </div>

                    {/* Interactive Mic Listening Button (on/off per participant) */}
                    <button
                      id={`btn-mic-listen-${user.replace(/\s+/g, '-').toLowerCase()}`}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleUserListening(user);
                      }}
                      className={`p-1.5 rounded-full backdrop-blur-md border transition cursor-pointer active:scale-90 ${
                        isUserListening
                          ? 'bg-emerald-950/85 text-emerald-400 border-emerald-600/70 hover:bg-emerald-900 shadow-sm'
                          : 'bg-red-950/90 text-red-400 border-red-800 hover:bg-red-900'
                      }`}
                      title={isUserListening ? `Listening to ${user} - Click to Mute` : `Muted ${user} - Click to Listen`}
                    >
                      {isUserListening ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                    </button>

                    {/* Subtitle On/Off Button right next to Mic */}
                    <button
                      id={`btn-subtitles-toggle-${user.replace(/\s+/g, '-').toLowerCase()}`}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleUserSubtitles(user);
                      }}
                      className={`p-1.5 rounded-full backdrop-blur-md border transition cursor-pointer active:scale-90 ${
                        isUserSubtitlesOn
                          ? 'bg-cyan-950/90 text-cyan-300 border-cyan-500/70 shadow-sm hover:bg-cyan-900'
                          : 'bg-black/70 text-neutral-400 border-neutral-700/60 hover:text-white'
                      }`}
                      title={isUserSubtitlesOn ? `Subtitles ON for ${user} - Click to Turn Off` : `Subtitles OFF for ${user} - Click to Turn On`}
                    >
                      <Subtitles className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. TOP OVERLAY: Current Group Chat / Meeting Title & Number Button (Click to Edit) + Recording Button */}
      {/* (Old MEET row completely removed from top feed as requested; original selectors preserved in Note/Chat modals) */}
      <div className="relative z-30 pt-3 px-3 flex items-center justify-between gap-2 pointer-events-auto">
        {/* Current Meeting Button: Click to edit name / # */}
        <button
          id="btn-active-meeting-header"
          type="button"
          onClick={() => setIsEditMeetingModalOpen(true)}
          className="flex-1 min-w-0 flex items-center gap-2 bg-neutral-900/90 hover:bg-neutral-800/90 active:scale-98 border border-neutral-700/80 px-3 py-1.5 rounded-full backdrop-blur-md transition cursor-pointer group shadow-lg text-left"
          title="Click to edit Meeting Title and #"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <div className="flex-1 min-w-0 flex items-center gap-1.5 truncate">
            <span className="text-xs font-bold text-red-400 font-mono shrink-0">
              {room.token}
            </span>
            <span className="text-neutral-500 text-xs">·</span>
            <span className="text-xs font-medium text-white truncate group-hover:text-red-300 transition">
              {room.title}
            </span>
          </div>
          <Edit3 className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white shrink-0 transition" />
        </button>

        {/* Recording Button: On/Off toggle -> Only records when ON */}
        <button
          id="btn-toggle-recording"
          type="button"
          onClick={handleToggleRecording}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition shadow-lg shrink-0 cursor-pointer ${
            isLocalRecording
              ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse border border-red-400 shadow-red-950/60'
              : 'bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700/80'
          }`}
          title={isLocalRecording ? 'Click to Stop Recording & Save to Profile' : 'Click to Start Recording'}
        >
          <span className={`w-2 h-2 rounded-full ${isLocalRecording ? 'bg-white animate-ping' : 'bg-red-500'}`} />
          <span>{isLocalRecording ? `REC ${formatRecordingTime(recordingSeconds)}` : 'Record'}</span>
        </button>
      </div>

      {/* Floating Hearts Container */}
      <div className="absolute right-6 bottom-32 pointer-events-none z-40 overflow-hidden w-24 h-64">
        {floatingHearts.map((heart) => (
          <div
            key={heart.id}
            className="absolute bottom-0 animate-float-heart"
            style={{
              left: `${35 + heart.x}px`,
              color: heart.color,
            }}
          >
            <Heart className="w-6 h-6 fill-current drop-shadow-md" />
          </div>
        ))}
      </div>

      {/* 3. RIGHT OVERLAY: TikTok Action Buttons */}
      <div className="absolute right-3 bottom-24 z-30 flex flex-col items-center gap-3">
        {/* Mic Toggle - Master toggle: Off mutes all user mics, On activates all user mics */}
        <button
          id="btn-tile-mic"
          type="button"
          onClick={handleToggleGlobalMic}
          className="flex flex-col items-center group cursor-pointer"
          title={isMicOn ? "All Mics Active - Click to Mute All" : "Muted - Click to Activate All Mics"}
        >
          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md transition shadow-lg ${
              isMicOn
                ? 'bg-black/65 text-emerald-400 border border-emerald-500/50 hover:bg-neutral-800'
                : 'bg-red-600 text-white border border-red-500 shadow-red-900/50'
            }`}
          >
            {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </div>
          <span className="text-[10px] font-medium text-white/90 mt-1 drop-shadow-sm">
            {isMicOn ? 'Mic' : 'Muted'}
          </span>
        </button>

        {/* Cam Toggle: Off hides user screen, On opens camera & shows face */}
        <button
          id="btn-tile-cam"
          type="button"
          onClick={handleToggleCamera}
          className="flex flex-col items-center group cursor-pointer"
          title={isCameraOn ? "Camera ON - Click to Turn Off Screen" : "Camera OFF - Click to Turn On Camera"}
        >
          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md transition shadow-lg ${
              isCameraOn
                ? 'bg-black/65 text-emerald-400 border border-emerald-500/50 hover:bg-neutral-800'
                : 'bg-red-600 text-white border border-red-500 shadow-red-900/50'
            }`}
          >
            {isCameraOn ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </div>
          <span className="text-[10px] font-medium text-white/90 mt-1 drop-shadow-sm">
            {isCameraOn ? 'Cam' : 'Off'}
          </span>
        </button>

        {/* Share Meeting Link Button (Between Cam and Note) */}
        <button
          id="btn-tile-share"
          type="button"
          onClick={() => {
            const shareUrl = `${window.location.origin}/#${room.token}`;
            if (navigator.clipboard) {
              navigator.clipboard.writeText(shareUrl).catch(() => {});
            }
            setToastMessage(`🔗 Meeting link copied! (${room.token})`);
            setTimeout(() => setToastMessage(null), 2500);
          }}
          className="flex flex-col items-center group cursor-pointer"
          title="Share Meeting Link"
        >
          <div className="w-11 h-11 rounded-full bg-black/65 text-white hover:bg-neutral-800 hover:text-red-400 border border-neutral-700/60 flex items-center justify-center backdrop-blur-md transition shadow-lg hover:scale-105 active:scale-95">
            <Share2 className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-medium text-white/90 mt-1 drop-shadow-sm">
            Share
          </span>
        </button>

        {/* Note (Granola AI Engine Meeting Notes) */}
        <button
          id="btn-tile-notes"
          type="button"
          onClick={() => setIsNotesOpen(true)}
          className="flex flex-col items-center group cursor-pointer"
          title="Meeting Notes (Granola Engine - Auto AI Synthesis)"
        >
          <div className="w-11 h-11 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/50 flex items-center justify-center backdrop-blur-md transition hover:scale-105 shadow-lg shadow-amber-950/40 relative">
            <NotebookTabs className="w-5 h-5" />
            {roomNotesCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-neutral-950 font-bold text-[9px] border border-black shadow-sm">
                {roomNotesCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium text-amber-300 mt-1 drop-shadow-sm">
            Note
          </span>
        </button>

        {/* Comment Button (Between Note and Love) */}
        <button
          id="btn-tile-comments"
          type="button"
          onClick={() => setIsCommentsOpen(true)}
          className="flex flex-col items-center group cursor-pointer"
          title="Meeting Comments"
        >
          <div className="w-11 h-11 rounded-full bg-black/65 text-white hover:bg-neutral-800 hover:text-red-400 border border-neutral-700/60 flex items-center justify-center backdrop-blur-md transition shadow-lg hover:scale-105 active:scale-95 relative">
            <MessageCircle className="w-5 h-5" />
            {roomTotalCommentsCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-red-600 text-white font-bold text-[9px] border border-black shadow-sm">
                {roomTotalCommentsCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold text-white/90 mt-1 drop-shadow-sm">
            {roomTotalCommentsCount}
          </span>
        </button>

        {/* Heart Reaction */}
        <button
          id="btn-tile-heart"
          type="button"
          onClick={(e) => handleTriggerHeart(e)}
          className="flex flex-col items-center group cursor-pointer"
        >
          <div className="w-11 h-11 rounded-full bg-black/65 text-red-500 hover:text-red-400 hover:scale-110 border border-neutral-700/60 flex items-center justify-center backdrop-blur-md transition active:scale-95 shadow-lg">
            <Heart className="w-5 h-5 fill-red-500" />
          </div>
          <span className="text-[10px] font-bold text-white/90 mt-1 drop-shadow-sm">{likeCount}</span>
        </button>
      </div>

      {/* 4. BOTTOM OVERLAY: Host & Room Details + Speaker/Listener Role Radio Buttons */}
      <div className="relative z-30 p-3 pb-4 max-w-[calc(100%-80px)] space-y-1.5 pointer-events-auto">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <button
              id="btn-bottom-host-profile"
              type="button"
              onClick={() => onOpenProfile && onOpenProfile()}
              className="font-bold text-sm text-white hover:text-red-400 hover:underline transition drop-shadow-md cursor-pointer flex items-center gap-1 group text-left"
              title={`Go to @${room.host}'s profile`}
            >
              <span>@{room.host}</span>
              <span className="text-[10px] text-red-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition">↗</span>
            </button>
            <span className="text-[10px] text-neutral-400 bg-neutral-900/80 px-2 py-0.5 rounded-full border border-neutral-800">
              {room.participants.length} joined
            </span>
          </div>

          <p className="text-xs text-neutral-300 font-medium line-clamp-1 leading-snug drop-shadow-sm">
            {room.title}
          </p>

          {/* Small text radio buttons for Speaker or Listener */}
          <div className="flex items-center gap-2 pt-0.5">
            <span className="text-[10px] font-semibold text-neutral-400">Mode:</span>

            <label
              id="radio-mode-speaker"
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold transition cursor-pointer border ${
                userRole === 'speaker'
                  ? 'bg-emerald-950/85 border-emerald-500/80 text-emerald-300 shadow-sm'
                  : 'bg-black/60 border-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              <input
                type="radio"
                name={`role-${room.id}`}
                value="speaker"
                checked={userRole === 'speaker'}
                onChange={() => handleSelectRole('speaker')}
                className="w-3 h-3 text-emerald-500 bg-neutral-900 border-neutral-700 accent-emerald-500 cursor-pointer"
              />
              <span>Speaker</span>
            </label>

            <label
              id="radio-mode-listener"
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold transition cursor-pointer border ${
                userRole === 'listener'
                  ? 'bg-red-950/85 border-red-500/80 text-red-300 shadow-sm'
                  : 'bg-black/60 border-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              <input
                type="radio"
                name={`role-${room.id}`}
                value="listener"
                checked={userRole === 'listener'}
                onChange={() => handleSelectRole('listener')}
                className="w-3 h-3 text-red-500 bg-neutral-900 border-neutral-700 accent-red-500 cursor-pointer"
              />
              <span>Listener</span>
            </label>
          </div>
        </div>
      </div>

      {/* Feedback Toast Notification when toggling per-speaker audio or subtitle */}
      {toastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-black/90 backdrop-blur-md border border-neutral-700 text-white px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-2xl animate-in fade-in slide-in-from-top-2 pointer-events-none flex items-center gap-1.5 whitespace-nowrap">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modals */}
      <MultiFilterDialog
        isOpen={isFilterDialogOpen}
        onClose={() => setIsFilterDialogOpen(false)}
        participants={room.participants}
        selectedUsers={selectedFilterUsers}
        onToggleUser={toggleUserFilter}
        roomToken={room.token}
        onDirectChat={handleOpenDirectChat}
      />

      <GranolaNotesModal
        isOpen={isNotesOpen}
        onClose={() => setIsNotesOpen(false)}
        currentRoomToken={room.token}
        rooms={rooms}
        notes={notes}
        onExportToFeed={onExportToFeed}
        onAddNote={onAddNote}
        onSelectMeetingRoom={onSelectRoomToken}
      />

      <MeetingChatModal
        isOpen={isChatOpen}
        onClose={() => {
          setIsChatOpen(false);
          setDirectChatUser(null);
        }}
        roomToken={room.token}
        rooms={rooms}
        chats={chats}
        initialDirectUser={directChatUser}
        onSendMessage={onSendMessage}
        onSelectMeetingRoom={onSelectRoomToken}
      />

      {/* Edit Meeting Details Modal (Triggered by top active meeting button) */}
      {isEditMeetingModalOpen && (
        <div
          id="edit-meeting-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={() => setIsEditMeetingModalOpen(false)}
        >
          <div
            id="edit-meeting-modal-container"
            className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl p-5 text-white shadow-2xl animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-red-500" />
                <h3 className="font-bold text-sm">Edit Meeting Details</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditMeetingModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMeetingDetails} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Meeting Token / #</label>
                <input
                  type="text"
                  required
                  value={editToken}
                  onChange={(e) => setEditToken(e.target.value)}
                  placeholder="#MEET-9021"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:border-red-500 outline-none font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1">Meeting Title / Topic</label>
                <textarea
                  rows={3}
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="e.g. Flutter-to-Web Migration & Granola Engine..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-white focus:border-red-500 outline-none resize-none leading-relaxed"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditMeetingModalOpen(false)}
                  className="flex-1 py-2 rounded-xl text-neutral-400 hover:text-white bg-neutral-800 text-xs font-medium transition"
                >
                  Cancel
                </button>
                <button
                  id="btn-save-meeting-details"
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition shadow-lg shadow-red-950/50"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TikTok Comments Modal */}
      <TikTokCommentsModal
        isOpen={isCommentsOpen}
        onClose={() => setIsCommentsOpen(false)}
        meetingToken={room.token}
        meetingTitle={room.title}
        hostName={room.host}
        comments={roomComments}
        currentUser={userProfile}
        onAddComment={(token, text, replyId, replyUser) => {
          if (onAddComment) onAddComment(token, text, replyId, replyUser);
        }}
        onToggleLikeComment={(token, commentId, replyId) => {
          if (onToggleLikeComment) onToggleLikeComment(token, commentId, replyId);
        }}
      />
    </div>
  );
};

const UsersPlaceholder = () => (
  <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center mx-auto mb-2 text-neutral-500">
    <Filter className="w-6 h-6" />
  </div>
);
