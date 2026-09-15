import React, { useState, useRef, useEffect } from 'react';
import {
  ShortVideoItem,
  MeetingRoom,
  UserProfile,
  PostComment,
} from '../types';
import {
  Heart,
  MessageCircle,
  Repeat2,
  Bookmark,
  DoorOpen,
  DoorClosed,
  Volume2,
  VolumeX,
  Play,
  X,
  Send,
  Sparkles,
  Camera,
  Video,
  Upload,
  Music,
  Users,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  Lock,
  Globe,
  FileVideo,
} from 'lucide-react';

interface ShortsFeedScreenProps {
  shorts: ShortVideoItem[];
  rooms?: MeetingRoom[];
  userProfile?: UserProfile;
  onJoinMeeting: (token: string) => void;
  onToggleLikeShort: (shortId: string) => void;
  onToggleRepostShort: (shortId: string) => void;
  onToggleBookmarkShort: (shortId: string) => void;
  onAddShortComment: (shortId: string, commentText: string) => void;
  onCreateShort: (newShort: Omit<ShortVideoItem, 'id' | 'likes' | 'isLiked' | 'reposts' | 'isReposted' | 'commentsCount' | 'comments' | 'isBookmarked' | 'timestamp'>) => void;
  onResetSampleShorts?: () => void;
}

export const ShortsFeedScreen: React.FC<ShortsFeedScreenProps> = ({
  shorts = [],
  rooms = [],
  userProfile = {
    name: 'You',
    handle: '@you',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=face',
    bio: 'Tech enthusiast',
    stats: { following: 12, followers: 85, likes: 210 },
  },
  onJoinMeeting,
  onToggleLikeShort,
  onToggleRepostShort,
  onToggleBookmarkShort,
  onAddShortComment,
  onCreateShort,
  onResetSampleShorts,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [progressSeconds, setProgressSeconds] = useState(0);
  const [isCommentDrawerOpen, setIsCommentDrawerOpen] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [videoErrorMap, setVideoErrorMap] = useState<Record<string, boolean>>({});

  // New Short Upload / Record State
  const [shortCaption, setShortCaption] = useState('');
  const [selectedMeetingToken, setSelectedMeetingToken] = useState<string>(rooms[0]?.token || 'none');
  const [shortVisibility, setShortVisibility] = useState<'public' | 'private'>('public');
  const [shortTags, setShortTags] = useState('#WebRTC #AI #Discussion');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isRecordingWebcam, setIsRecordingWebcam] = useState(false);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  const webcamVideoRef = useRef<HTMLVideoElement | null>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const recordingTimerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Touch Swipe State for Mobile / Tablet TikTok gestures
  const touchStartY = useRef<number>(0);
  const touchCurrentY = useRef<number>(0);
  const touchStartTime = useRef<number>(0);
  const isSwiping = useRef<boolean>(false);
  const [dragOffset, setDragOffset] = useState<number>(0);

  const safeShorts = shorts && shorts.length > 0 ? shorts : [];
  const safeActiveIndex = Math.min(activeIndex, Math.max(0, safeShorts.length - 1));
  const activeShort = safeShorts[safeActiveIndex];
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Check if current short has active meeting
  const hasActiveMeeting = Boolean(
    activeShort &&
    activeShort.hasActiveMeeting !== false &&
    activeShort.meetingToken &&
    activeShort.meetingToken.trim() !== '' &&
    activeShort.meetingToken !== 'none'
  );

  // 30s playback timer simulation for bottom progress bar
  useEffect(() => {
    setProgressSeconds(0);
    const interval = window.setInterval(() => {
      setProgressSeconds((prev) => {
        if (prev >= 30) {
          return 0; // loop
        }
        return prev + 0.5;
      });
    }, 500);
    return () => clearInterval(interval);
  }, [safeActiveIndex]);

  // Handle video element play / pause
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, safeActiveIndex, activeShort?.videoUrl]);

  // Desktop keyboard navigation (ArrowUp, ArrowDown, Space)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (e.target as HTMLElement)?.tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeTag)) {
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleGoNext();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleGoPrev();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [safeShorts.length]);

  // Handle webcam recording for 30s short
  const startWebcamRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 720, height: 1280, facingMode: 'user' },
        audio: true,
      });
      webcamStreamRef.current = stream;
      if (webcamVideoRef.current) {
        webcamVideoRef.current.srcObject = stream;
        webcamVideoRef.current.play();
      }
      setIsRecordingWebcam(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 29) {
            stopWebcamRecording();
            return 30;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.warn('Webcam permission error, fallback to sample video recording:', err);
      setIsRecordingWebcam(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 29) {
            stopWebcamRecording();
            return 30;
          }
          return prev + 1;
        });
      }, 1000);
    }
  };

  const stopWebcamRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (webcamStreamRef.current) {
      webcamStreamRef.current.getTracks().forEach((track) => track.stop());
      webcamStreamRef.current = null;
    }
    setIsRecordingWebcam(false);
    setUploadedVideoUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
    showToast('30s Short recorded successfully! Ready to publish.');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadedVideoUrl(url);
      showToast(`Video selected: ${file.name}`);
    }
  };

  const handlePublishShort = () => {
    if (!shortCaption.trim()) {
      showToast('Please enter a caption for your short video');
      return;
    }

    const isMeetingLinked = selectedMeetingToken !== 'none' && Boolean(selectedMeetingToken);
    const room = isMeetingLinked ? rooms.find((r) => r.token === selectedMeetingToken) : null;
    const tagsArray = shortTags.split(/\s+/).filter((t) => t.startsWith('#'));

    onCreateShort({
      meetingToken: isMeetingLinked ? selectedMeetingToken : '',
      meetingTitle: isMeetingLinked ? (room?.title || 'Live Meeting Discussion') : undefined,
      title: shortCaption.trim(),
      author: userProfile.name,
      handle: userProfile.handle,
      avatar: userProfile.avatar,
      videoUrl: uploadedVideoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      duration: 30,
      tags: tagsArray.length > 0 ? tagsArray : ['#30sShort', '#LiveRoom'],
      musicTrack: `Original Sound - ${userProfile.name} 🎵`,
      liveParticipantsCount: isMeetingLinked ? (room?.participants.length || 3) : 0,
      visibility: shortVisibility,
      hasActiveMeeting: isMeetingLinked,
    });

    setIsCreateModalOpen(false);
    setShortCaption('');
    setUploadedVideoUrl(null);
    setRecordingSeconds(0);
    showToast(`Published ${shortVisibility === 'private' ? '🔒 Private' : '🌐 Public'} Short to Feed & Profile Posts!`);
  };

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !activeShort) return;
    onAddShortComment(activeShort.id, newCommentText.trim());
    setNewCommentText('');
  };

  const handleRepostAction = (shortId: string) => {
    onToggleRepostShort(shortId);
    showToast('🔁 Reposted to your Profile Posts feed!');
  };

  const handleBookmarkAction = (shortId: string) => {
    onToggleBookmarkShort(shortId);
    if (!activeShort.isBookmarked) {
      showToast('🔖 Saved to Bookmarks in Profile (Chats ဘေး)!');
    } else {
      showToast('Removed from Bookmarks');
    }
  };

  const handleGoPrev = () => {
    if (safeShorts.length === 0) return;
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : safeShorts.length - 1));
  };

  const handleGoNext = () => {
    if (safeShorts.length === 0) return;
    setActiveIndex((prev) => (prev < safeShorts.length - 1 ? prev + 1 : 0));
  };

  // TikTok Vertical Swipe Gestures for Phone & Tablet
  const handleTouchStart = (e: React.TouchEvent) => {
    // If touching on interactive controls, drawers, or modals, skip gesture
    if ((e.target as HTMLElement).closest('button, input, textarea, select, #shorts-comment-sheet, #create-short-modal')) {
      return;
    }
    touchStartY.current = e.touches[0].clientY;
    touchCurrentY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
    isSwiping.current = true;
    setDragOffset(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping.current) return;
    touchCurrentY.current = e.touches[0].clientY;
    const diff = touchCurrentY.current - touchStartY.current;
    // Apply soft pull resistance
    setDragOffset(diff * 0.35);
  };

  const handleTouchEnd = () => {
    if (!isSwiping.current) return;
    isSwiping.current = false;
    const diff = touchCurrentY.current - touchStartY.current;
    const duration = Date.now() - touchStartTime.current;
    setDragOffset(0);

    // Swiped Up (diff < -40) -> Next Video
    // Swiped Down (diff > 40) -> Previous Video
    if (Math.abs(diff) > 40 && duration < 500) {
      if (diff < 0) {
        handleGoNext();
      } else {
        handleGoPrev();
      }
    }
  };

  // Mouse wheel scroll handler with debounce
  const wheelCooldownRef = useRef<number>(0);
  const handleWheel = (e: React.WheelEvent) => {
    // If user is inside modal or drawer, don't trigger
    if ((e.target as HTMLElement).closest('#shorts-comment-sheet, #create-short-modal')) {
      return;
    }
    const now = Date.now();
    if (now - wheelCooldownRef.current < 400) return;
    if (Math.abs(e.deltaY) > 25) {
      wheelCooldownRef.current = now;
      if (e.deltaY > 0) {
        handleGoNext();
      } else {
        handleGoPrev();
      }
    }
  };

  return (
    <div
      id="shorts-feed-container"
      className="relative w-full h-full bg-black text-white flex flex-col overflow-hidden select-none touch-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 bg-neutral-900/95 border border-purple-500/80 text-white text-xs px-4 py-2 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-2 animate-in fade-in slide-in-from-top-3 duration-200">
          <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          <span className="font-medium text-[11px]">{toastMessage}</span>
        </div>
      )}

      {/* Top Floating Header (Clean Minimalist TikTok Style - No Clutter) */}
      <div className="absolute top-0 left-0 right-0 z-30 pt-3 pb-2 px-4 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <span className="text-base font-black tracking-tight text-white flex items-center gap-1.5 drop-shadow-md">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span className="bg-gradient-to-r from-red-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
              SHORTS
            </span>
          </span>
          {activeShort?.visibility === 'private' && (
            <span className="text-[10px] font-bold text-amber-300 bg-amber-950/80 border border-amber-500/40 px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-xs">
              <Lock className="w-2.5 h-2.5" />
              Private
            </span>
          )}
        </div>

        {/* Top Right Sound Toggle */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-black/80 transition cursor-pointer"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Main Full-Screen Vertical Video Stage */}
      <div
        className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden transition-transform duration-150 ease-out"
        style={{ transform: dragOffset !== 0 ? `translateY(${dragOffset}px)` : undefined }}
      >
        {activeShort ? (
          <div key={activeShort.id} className="relative w-full h-full flex items-center justify-center bg-black">
            {/* Real Video Element */}
            {!videoErrorMap[activeShort.id] ? (
              <video
                ref={videoRef}
                src={activeShort.videoUrl}
                className="w-full h-full object-cover cursor-pointer"
                autoPlay
                playsInline
                loop
                muted={isMuted}
                onClick={() => setIsPlaying(!isPlaying)}
                onError={() => {
                  setVideoErrorMap((prev) => ({ ...prev, [activeShort.id]: true }));
                }}
              />
            ) : (
              /* Visual Fallback Stage for Network Buffering */
              <div
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-full h-full bg-gradient-to-br from-neutral-950 via-purple-950/40 to-neutral-900 flex flex-col items-center justify-center p-6 text-center cursor-pointer relative"
              >
                <div className="flex items-end gap-1.5 h-10 mb-3">
                  <span className="w-1.5 bg-purple-500 rounded-full animate-bounce h-6" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 bg-pink-500 rounded-full animate-bounce h-10" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 bg-red-500 rounded-full animate-bounce h-8" style={{ animationDelay: '300ms' }} />
                  <span className="w-1.5 bg-indigo-500 rounded-full animate-bounce h-10" style={{ animationDelay: '200ms' }} />
                  <span className="w-1.5 bg-purple-400 rounded-full animate-bounce h-5" style={{ animationDelay: '400ms' }} />
                  <span className="w-1.5 bg-emerald-400 rounded-full animate-bounce h-7" style={{ animationDelay: '250ms' }} />
                </div>

                {hasActiveMeeting ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/80 text-white text-xs font-bold mb-2">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                    Live Meeting Discussion
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-800 text-neutral-300 text-xs font-bold mb-2">
                    Standalone Short Video
                  </span>
                )}

                <h3 className="text-sm font-bold text-white max-w-xs drop-shadow-md">
                  {activeShort.title}
                </h3>
                <p className="text-[11px] text-purple-300 mt-1 font-mono">
                  {activeShort.musicTrack || 'Original Sound - Myanmar Live Audio'}
                </p>

                {hasActiveMeeting && (
                  <div className="mt-4 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onJoinMeeting(activeShort.meetingToken);
                      }}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-900/50 flex items-center gap-1.5 cursor-pointer"
                    >
                      <DoorOpen className="w-4 h-4" />
                      Join Live Room ({activeShort.meetingToken})
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Subtle Gradient Overlays for Readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/85 pointer-events-none" />

            {/* Tap to Play / Pause Visual Feedback */}
            {!isPlaying && (
              <div
                onClick={() => setIsPlaying(true)}
                className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-2xs cursor-pointer z-10"
              >
                <div className="w-16 h-16 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white shadow-2xl">
                  <Play className="w-8 h-8 fill-white translate-x-0.5" />
                </div>
              </div>
            )}

            {/* Prev / Next Video Floating Arrows (Desktop & Tablet helper) */}
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2 pointer-events-auto">
              <button
                type="button"
                onClick={handleGoPrev}
                className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 text-white flex items-center justify-center transition active:scale-95 shadow-lg cursor-pointer"
                title="Previous Short (Swipe Down)"
              >
                <ChevronUp className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={handleGoNext}
                className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 text-white flex items-center justify-center transition active:scale-95 shadow-lg cursor-pointer"
                title="Next Short (Swipe Up)"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>

            {/* Left Bottom Video Info Column */}
            <div className="absolute bottom-5 left-3 right-16 z-20 flex flex-col gap-2 pointer-events-auto text-left">
              {/* Linked Live Meeting Room Card OR Standalone Indicator */}
              {hasActiveMeeting ? (
                <div
                  onClick={() => onJoinMeeting(activeShort.meetingToken)}
                  className="inline-flex items-center gap-2 bg-black/75 border border-purple-500/80 hover:border-purple-400 hover:bg-purple-950/80 backdrop-blur-md px-2.5 py-1 rounded-xl shadow-lg transition cursor-pointer self-start group"
                >
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[11px] font-bold text-purple-200">
                    🔴 Live: {activeShort.meetingToken}
                  </span>
                  <span className="text-[10px] text-neutral-300 flex items-center gap-0.5">
                    <Users className="w-2.5 h-2.5" />
                    {activeShort.liveParticipantsCount || 4} online
                  </span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 bg-black/60 border border-white/10 backdrop-blur-md px-2.5 py-0.5 rounded-xl self-start">
                  <Video className="w-3 h-3 text-neutral-400" />
                  <span className="text-[10px] text-neutral-300 font-medium">Standalone Short Clip</span>
                </div>
              )}

              {/* Creator Info */}
              <div className="flex items-center gap-2">
                <img
                  src={activeShort.avatar}
                  alt={activeShort.author}
                  className="w-9 h-9 rounded-full object-cover border-2 border-white/80 shadow-md ring-1 ring-purple-500"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white drop-shadow-md truncate">
                      {activeShort.author}
                    </span>
                    <span className="text-[10px] text-neutral-300 font-medium">
                      {activeShort.handle}
                    </span>
                    {activeShort.visibility === 'private' && (
                      <span className="text-[9px] text-amber-300 flex items-center gap-0.5 bg-amber-950/60 px-1.5 py-0.2 rounded-sm border border-amber-500/30">
                        <Lock className="w-2.5 h-2.5" />
                        Private
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] text-neutral-400">{activeShort.timestamp}</span>
                </div>
              </div>

              {/* Title / Caption */}
              <p className="text-xs text-neutral-100 font-normal leading-snug drop-shadow-md line-clamp-3">
                {activeShort.title}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                {activeShort.tags.map((tag, idx) => (
                  <span key={idx} className="text-[10px] font-bold text-purple-300 drop-shadow-xs">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Music / Audio Track */}
              <div className="flex items-center gap-1 text-[10px] text-neutral-300 drop-shadow-xs">
                <Music className="w-3 h-3 text-pink-400 shrink-0" />
                <span className="truncate">{activeShort.musicTrack || 'Original Audio'}</span>
              </div>
            </div>

            {/* Right Side Action Bar (TikTok Vertical Column) */}
            <div
              id="shorts-vertical-action-bar"
              className="absolute bottom-5 right-2 z-20 flex flex-col items-center gap-3.5 pointer-events-auto"
            >
              {/* 1. JOIN ROOM BUTTON (Glowing if Meeting Active, Dimmed if Offline) */}
              {hasActiveMeeting ? (
                <button
                  id="btn-short-join-room"
                  type="button"
                  onClick={() => onJoinMeeting(activeShort.meetingToken)}
                  className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white flex flex-col items-center justify-center shadow-xl shadow-purple-900/60 transition active:scale-90 cursor-pointer ring-2 ring-white/30 animate-pulse"
                  title={`Join Live Discussion Room (${activeShort.meetingToken})`}
                >
                  <DoorOpen className="w-5 h-5" />
                  <span className="text-[8px] font-black tracking-tighter uppercase mt-0.5 leading-none">
                    Join
                  </span>
                </button>
              ) : (
                <button
                  id="btn-short-join-room-disabled"
                  type="button"
                  onClick={() => showToast('ဒီ short မှာ live meeting မရှိပါ (Standalone video clip)')}
                  className="w-11 h-11 rounded-2xl bg-neutral-900/80 border border-neutral-700 text-neutral-500 opacity-40 flex flex-col items-center justify-center transition cursor-not-allowed"
                  title="No active meeting for this video"
                >
                  <DoorClosed className="w-5 h-5 text-neutral-500" />
                  <span className="text-[8px] font-medium tracking-tighter uppercase mt-0.5 leading-none text-neutral-500">
                    Offline
                  </span>
                </button>
              )}

              {/* 2. LIKE BUTTON */}
              <button
                id="btn-short-like"
                type="button"
                onClick={() => onToggleLikeShort(activeShort.id)}
                className="flex flex-col items-center transition cursor-pointer group active:scale-90"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md border transition ${
                    activeShort.isLiked
                      ? 'bg-red-500/20 border-red-500 text-red-500'
                      : 'bg-black/50 border-white/15 text-white group-hover:bg-black/70'
                  }`}
                >
                  <Heart
                    className={`w-5 h-5 transition ${
                      activeShort.isLiked ? 'fill-red-500 scale-110' : 'group-hover:scale-110'
                    }`}
                  />
                </div>
                <span className="text-[10px] font-bold text-white mt-1 drop-shadow-md">
                  {activeShort.likes}
                </span>
              </button>

              {/* 3. COMMENT BUTTON */}
              <button
                id="btn-short-comment"
                type="button"
                onClick={() => setIsCommentDrawerOpen(true)}
                className="flex flex-col items-center transition cursor-pointer group active:scale-90"
              >
                <div className="w-10 h-10 rounded-full bg-black/50 border border-white/15 text-white flex items-center justify-center backdrop-blur-md group-hover:bg-black/70 transition">
                  <MessageCircle className="w-5 h-5 group-hover:scale-110 transition" />
                </div>
                <span className="text-[10px] font-bold text-white mt-1 drop-shadow-md">
                  {activeShort.commentsCount || activeShort.comments?.length || 0}
                </span>
              </button>

              {/* 4. REPOST BUTTON (Syncs with Profile Posts) */}
              <button
                id="btn-short-repost"
                type="button"
                onClick={() => handleRepostAction(activeShort.id)}
                className="flex flex-col items-center transition cursor-pointer group active:scale-90"
                title="Repost to Profile Posts"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md border transition ${
                    activeShort.isReposted
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                      : 'bg-black/50 border-white/15 text-white group-hover:bg-black/70'
                  }`}
                >
                  <Repeat2
                    className={`w-5 h-5 transition ${
                      activeShort.isReposted ? 'scale-110 text-emerald-400' : 'group-hover:scale-110'
                    }`}
                  />
                </div>
                <span className="text-[10px] font-bold text-white mt-1 drop-shadow-md">
                  {activeShort.reposts}
                </span>
              </button>

              {/* 5. BOOKMARKS / SAVE BUTTON (Saved to Profile Bookmarks Tab) */}
              <button
                id="btn-short-bookmark"
                type="button"
                onClick={() => handleBookmarkAction(activeShort.id)}
                className="flex flex-col items-center transition cursor-pointer group active:scale-90"
                title="Save to Profile Bookmarks"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md border transition ${
                    activeShort.isBookmarked
                      ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
                      : 'bg-black/50 border-white/15 text-white group-hover:bg-black/70'
                  }`}
                >
                  <Bookmark
                    className={`w-5 h-5 transition ${
                      activeShort.isBookmarked ? 'fill-yellow-400 scale-110' : 'group-hover:scale-110'
                    }`}
                  />
                </div>
                <span className="text-[9px] font-bold text-white mt-1 drop-shadow-md">
                  {activeShort.isBookmarked ? 'Saved' : 'Save'}
                </span>
              </button>

              {/* 6. UPLOAD SHORT BUTTON (Placed directly below Save/Bookmark icon) */}
              <button
                id="btn-short-upload"
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="flex flex-col items-center transition cursor-pointer group active:scale-90"
                title="Upload / Record 30s Short Clip"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-pink-600 border border-white/25 text-white flex items-center justify-center shadow-lg shadow-purple-900/50 group-hover:scale-110 transition">
                  <Upload className="w-5 h-5" />
                </div>
                <span className="text-[9px] font-bold text-white mt-1 drop-shadow-md">
                  Upload
                </span>
              </button>

              {/* Quick Dot Indicators for available clips */}
              <div className="flex flex-col gap-1 mt-1">
                {safeShorts.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveIndex(idx)}
                    className={`w-1.5 rounded-full transition-all cursor-pointer ${
                      safeActiveIndex === idx ? 'h-3 bg-white' : 'h-1 bg-white/40 hover:bg-white/70'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* 30-Second Bottom Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-30">
              <div
                className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 transition-all duration-300"
                style={{ width: `${Math.min(100, (progressSeconds / 30) * 100)}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-neutral-400">
            <Video className="w-12 h-12 mx-auto text-neutral-600 mb-3" />
            <p className="text-sm font-semibold">No short videos yet</p>
            <p className="text-xs text-neutral-500 mt-1">Be the first to upload a 30s short clip!</p>
            {onResetSampleShorts && (
              <button
                type="button"
                onClick={onResetSampleShorts}
                className="mt-4 px-4 py-2 rounded-full bg-purple-600 text-white text-xs font-bold cursor-pointer"
              >
                Load Sample Video Clips
              </button>
            )}
          </div>
        )}
      </div>

      {/* COMMENT SHEET DRAWER (TikTok Style) */}
      {isCommentDrawerOpen && activeShort && (
        <div
          id="shorts-comment-backdrop"
          className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-150"
          onClick={() => setIsCommentDrawerOpen(false)}
        >
          <div
            id="shorts-comment-sheet"
            className="w-full h-2/3 bg-neutral-900 border-t border-neutral-800 rounded-t-3xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Header */}
            <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between shrink-0">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-purple-400" />
                Comments ({activeShort.comments?.length || 0})
              </span>
              <button
                type="button"
                onClick={() => setIsCommentDrawerOpen(false)}
                className="w-7 h-7 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {activeShort.comments && activeShort.comments.length > 0 ? (
                activeShort.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-2.5 text-left">
                    <img
                      src={comment.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face'}
                      alt={comment.author}
                      className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-neutral-700"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-neutral-200 truncate">
                          {comment.author}
                        </span>
                        <span className="text-[10px] text-neutral-500">{comment.timestamp}</span>
                      </div>
                      <p className="text-xs text-neutral-300 mt-0.5 leading-relaxed">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-neutral-500 text-xs">
                  No comments yet. Start the discussion!
                </div>
              )}
            </div>

            {/* Comment Input Bar */}
            <form
              onSubmit={handleSendComment}
              className="p-3 border-t border-neutral-800 bg-neutral-950 flex items-center gap-2 shrink-0"
            >
              <input
                type="text"
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 bg-neutral-800 text-white placeholder-neutral-500 text-xs rounded-full px-3.5 py-2 border border-transparent focus:border-purple-500 outline-hidden"
              />
              <button
                type="submit"
                disabled={!newCommentText.trim()}
                className="w-8 h-8 rounded-full bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white flex items-center justify-center transition cursor-pointer shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CREATE / UPLOAD 30S SHORT MODAL */}
      {isCreateModalOpen && (
        <div
          id="create-short-backdrop"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-150"
          onClick={() => {
            if (!isRecordingWebcam) setIsCreateModalOpen(false);
          }}
        >
          <div
            id="create-short-modal"
            className="w-full max-w-sm max-h-[92vh] overflow-y-auto bg-neutral-900 border border-neutral-800 rounded-3xl p-4 flex flex-col gap-3 shadow-2xl text-left animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center text-white shadow-md">
                  <Upload className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">Upload 30s Short Clip</h3>
                  <p className="text-[10px] text-neutral-400">Post standalone or link to Live Meeting</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  stopWebcamRecording();
                  setIsCreateModalOpen(false);
                }}
                className="w-6 h-6 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Video Preview or Source Selection */}
            <div className="relative w-full h-40 bg-black rounded-2xl overflow-hidden border border-neutral-800 flex items-center justify-center">
              {isRecordingWebcam ? (
                <div className="relative w-full h-full">
                  <video
                    ref={webcamVideoRef}
                    className="w-full h-full object-cover"
                    autoPlay
                    playsInline
                    muted
                  />
                  <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    REC 00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds} / 00:30
                  </div>
                  <button
                    type="button"
                    onClick={stopWebcamRecording}
                    className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg transition cursor-pointer"
                  >
                    Done Recording
                  </button>
                </div>
              ) : uploadedVideoUrl ? (
                <div className="relative w-full h-full">
                  <video
                    src={uploadedVideoUrl}
                    className="w-full h-full object-cover"
                    autoPlay
                    loop
                    muted
                  />
                  <div className="absolute top-2 right-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Ready
                  </div>
                  <button
                    type="button"
                    onClick={() => setUploadedVideoUrl(null)}
                    className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-neutral-900/90 text-white text-[10px] px-3 py-1 rounded-full hover:bg-neutral-800 transition cursor-pointer border border-white/20"
                  >
                    Change Video
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 p-3 text-center w-full">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="video/*"
                    className="hidden"
                  />
                  <div className="w-10 h-10 rounded-full bg-purple-600/20 border border-purple-500/40 text-purple-400 flex items-center justify-center">
                    <Video className="w-5 h-5" />
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-md transition cursor-pointer flex items-center gap-1"
                    >
                      <Upload className="w-3 h-3" />
                      Select Video
                    </button>
                    <button
                      type="button"
                      onClick={startWebcamRecording}
                      className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[11px] font-medium px-2.5 py-1.5 rounded-xl border border-neutral-700 transition cursor-pointer flex items-center gap-1"
                    >
                      <Camera className="w-3 h-3" />
                      Camera (30s)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadedVideoUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
                        showToast('Sample 30s video selected!');
                      }}
                      className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] font-medium px-2.5 py-1.5 rounded-xl border border-neutral-700 transition cursor-pointer flex items-center gap-1"
                    >
                      <FileVideo className="w-3 h-3" />
                      Sample
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Caption Input */}
            <div>
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                Short Caption
              </label>
              <textarea
                value={shortCaption}
                onChange={(e) => setShortCaption(e.target.value)}
                placeholder="What is this 30s clip about? (e.g. Quick tech demo or live discussion...)"
                rows={2}
                className="w-full bg-neutral-800 text-white text-xs rounded-xl p-2.5 border border-neutral-700 focus:border-purple-500 outline-hidden placeholder-neutral-500 resize-none"
              />
            </div>

            {/* Linked Live Meeting Room Selector */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Linked Live Meeting Room
                </label>
                <span className="text-[9px] text-neutral-500">
                  {selectedMeetingToken !== 'none' ? '🔴 Join button will glow' : 'Dimmed (No Meet)'}
                </span>
              </div>
              <select
                value={selectedMeetingToken}
                onChange={(e) => setSelectedMeetingToken(e.target.value)}
                className="w-full bg-neutral-800 text-white text-xs rounded-xl p-2.5 border border-neutral-700 focus:border-purple-500 outline-hidden cursor-pointer"
              >
                <option value="none">🚫 No Meeting (Standalone Video - Join button dimmed)</option>
                {rooms.map((room) => (
                  <option key={room.token} value={room.token}>
                    🔴 {room.token} — {room.title}
                  </option>
                ))}
              </select>
              <p className="text-[9px] text-neutral-400 mt-1 leading-normal">
                {selectedMeetingToken === 'none'
                  ? 'Meeting မရှိလဲ video တင်နိုင်ပါသည်။ ဘေးတန်း Join button သည် အရောင်မှိန်နေမည်ဖြစ်ပါသည်။'
                  : `ဒီ short ကို ကြည့်သူများ Join button ကို နှိပ်ပြီး ${selectedMeetingToken} သို့ တိုက်ရိုက်ဝင်ရောက်နိုင်မည်။`}
              </p>
            </div>

            {/* Privacy / Visibility Selector */}
            <div>
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                Privacy / Visibility
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setShortVisibility('public')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    shortVisibility === 'public'
                      ? 'bg-purple-600/30 border-purple-500 text-purple-200'
                      : 'bg-neutral-800/80 border-neutral-700 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5 text-purple-400" />
                  <span>Public (အားလုံး)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShortVisibility('private')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    shortVisibility === 'private'
                      ? 'bg-amber-600/30 border-amber-500 text-amber-200'
                      : 'bg-neutral-800/80 border-neutral-700 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Private (ကိုယ်တိုင်သာ)</span>
                </button>
              </div>
            </div>

            {/* Tags Input */}
            <div>
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                Tags
              </label>
              <input
                type="text"
                value={shortTags}
                onChange={(e) => setShortTags(e.target.value)}
                placeholder="#AI #WebRTC #Tech"
                className="w-full bg-neutral-800 text-white text-xs rounded-xl px-2.5 py-1.5 border border-neutral-700 focus:border-purple-500 outline-hidden placeholder-neutral-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  stopWebcamRecording();
                  setIsCreateModalOpen(false);
                }}
                className="flex-1 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-300 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePublishShort}
                className="flex-1 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-xs font-bold text-white shadow-lg shadow-purple-900/50 transition cursor-pointer"
              >
                Publish 30s Short
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
