import React, { useState, useRef, useEffect } from 'react';
import {
  ShortVideoItem,
  MeetingRoom,
  UserProfile,
  PostItem,
} from '../types';
import {
  Heart,
  MessageCircle,
  Repeat2,
  Repeat,
  Edit3,
  Image as ImageIcon,
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
  Plus,
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
  themeMode?: 'dark' | 'light';
  onAddPost?: (
    token: string,
    content: string,
    visibility?: 'public' | 'private',
    groupId?: string,
    groupName?: string,
    mediaUrl?: string,
    mediaType?: 'image' | 'video',
    quotedPost?: PostItem
  ) => void;
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
  themeMode = 'dark',
  onAddPost,
}) => {
  const isDark = themeMode !== 'light';
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [progressSeconds, setProgressSeconds] = useState(0);
  const [isCommentDrawerOpen, setIsCommentDrawerOpen] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [videoErrorMap, setVideoErrorMap] = useState<Record<string, boolean>>({});
  const [loadedVideos, setLoadedVideos] = useState<Record<string, boolean>>({});

  // New Short Upload / Record State
  const [shortCaption, setShortCaption] = useState('');
  const [selectedMeetingToken, setSelectedMeetingToken] = useState<string>(rooms[0]?.token || 'none');
  const [shortVisibility, setShortVisibility] = useState<'public' | 'private'>('public');
  const [shortTags, setShortTags] = useState('#WebRTC #AI #Discussion');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isRecordingWebcam, setIsRecordingWebcam] = useState(false);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  const [uploadedThumbnail, setUploadedThumbnail] = useState<string | null>(null);
  const [isExtractingThumbnail, setIsExtractingThumbnail] = useState(false);
  const webcamVideoRef = useRef<HTMLVideoElement | null>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const recordingTimerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Repost & Quote Modal state
  const [repostMenuShort, setRepostMenuShort] = useState<ShortVideoItem | null>(null);
  const [quoteModalShort, setQuoteModalShort] = useState<ShortVideoItem | null>(null);
  const [quoteText, setQuoteText] = useState('');
  const [quoteMediaUrl, setQuoteMediaUrl] = useState('');
  const [quoteMediaType, setQuoteMediaType] = useState<'image' | 'video'>('image');
  const quoteFileInputRef = useRef<HTMLInputElement | null>(null);

  // Smooth Thumbnail Extractor from uploaded video file or stream
  const extractThumbnailFromVideo = (videoSrc: string): Promise<string> => {
    return new Promise((resolve) => {
      const tempVideo = document.createElement('video');
      tempVideo.src = videoSrc;
      tempVideo.crossOrigin = 'anonymous';
      tempVideo.muted = true;
      tempVideo.playsInline = true;
      tempVideo.currentTime = 0.5;

      const capture = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = tempVideo.videoWidth || 360;
          canvas.height = tempVideo.videoHeight || 640;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(tempVideo, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            resolve(dataUrl);
            return;
          }
        } catch {
          // Cross-origin fallback
        }
        resolve('');
      };

      tempVideo.onloadeddata = () => {
        tempVideo.currentTime = 0.5;
      };
      tempVideo.onseeked = capture;
      tempVideo.onerror = () => resolve('');
      setTimeout(() => resolve(''), 1200);
    });
  };

  // Touch Swipe State for Mobile & Tablet vertical video gestures
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
    const recordedVideo = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
    const recordedThumb = 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=720&h=1280&fit=crop';
    setUploadedVideoUrl(recordedVideo);
    setUploadedThumbnail(recordedThumb);
    showToast('30s Short recorded successfully! Ready to publish.');
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadedVideoUrl(url);
      setIsExtractingThumbnail(true);
      showToast(`Video selected: ${file.name}`);
      const thumb = await extractThumbnailFromVideo(url);
      if (thumb) {
        setUploadedThumbnail(thumb);
      } else {
        setUploadedThumbnail('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=720&h=1280&fit=crop');
      }
      setIsExtractingThumbnail(false);
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

    const finalVideoUrl =
      uploadedVideoUrl ||
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4';
    const finalThumbnailUrl =
      uploadedThumbnail ||
      'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=720&h=1280&fit=crop';

    onCreateShort({
      meetingToken: isMeetingLinked ? selectedMeetingToken : '',
      meetingTitle: isMeetingLinked ? (room?.title || 'Live Meeting Discussion') : undefined,
      title: shortCaption.trim(),
      author: userProfile.name,
      handle: userProfile.handle,
      avatar: userProfile.avatar,
      videoUrl: finalVideoUrl,
      thumbnailUrl: finalThumbnailUrl,
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
    setUploadedThumbnail(null);
    setRecordingSeconds(0);
    setActiveIndex(0);
    showToast(`Published ${shortVisibility === 'private' ? '🔒 Private' : '🌐 Public'} Short to Feed & Profile Posts!`);
  };

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !activeShort) return;
    onAddShortComment(activeShort.id, newCommentText.trim());
    setNewCommentText('');
  };

  const handleOpenRepostMenu = (shortItem: ShortVideoItem) => {
    setRepostMenuShort(shortItem);
  };

  const handleConfirmRepost = (shortItem: ShortVideoItem) => {
    onToggleRepostShort(shortItem.id);
    setRepostMenuShort(null);
    showToast(shortItem.isReposted ? 'Removed repost' : '🔁 Reposted to your Profile & Feed!');
  };

  const handleOpenQuoteModal = (shortItem: ShortVideoItem) => {
    setRepostMenuShort(null);
    setQuoteModalShort(shortItem);
    setQuoteText('');
    setQuoteMediaUrl('');
    setQuoteMediaType('image');
  };

  const handleCreateQuotePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteModalShort) return;

    if (onAddPost) {
      onAddPost(
        quoteModalShort.meetingToken || (rooms[0]?.token) || '#MEET-9021',
        quoteText.trim() || 'Quoted video short',
        'public',
        undefined,
        undefined,
        quoteMediaUrl || undefined,
        quoteMediaType,
        {
          id: quoteModalShort.id,
          meetingToken: quoteModalShort.meetingToken,
          author: quoteModalShort.author,
          avatar: quoteModalShort.avatar,
          handle: quoteModalShort.handle,
          content: quoteModalShort.title,
          timestamp: 'Just now',
          mediaUrl: quoteModalShort.thumbnailUrl || quoteModalShort.videoUrl,
          mediaType: 'video',
        }
      );
    }

    if (!quoteModalShort.isReposted) {
      onToggleRepostShort(quoteModalShort.id);
    }

    showToast('Quote repost published to Feed & Profile!');
    setQuoteText('');
    setQuoteMediaUrl('');
    setQuoteModalShort(null);
  };

  const handleQuoteFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVideo = file.type.startsWith('video');
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      if (result) {
        setQuoteMediaUrl(result);
        setQuoteMediaType(isVideo ? 'video' : 'image');
      }
    };
    reader.readAsDataURL(file);
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

  // CooM Vertical Swipe Gestures for Phone & Tablet
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

    // Swiped Up (diff < -35) -> Next Video
    // Swiped Down (diff > 35) -> Previous Video
    if (Math.abs(diff) > 35 && duration < 650) {
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
    if (now - wheelCooldownRef.current < 350) return;
    if (Math.abs(e.deltaY) > 20) {
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
      className="relative w-full h-full bg-neutral-900 text-neutral-900 flex flex-col overflow-hidden select-none touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 bg-white/95 border border-purple-300 text-neutral-900 text-xs px-4 py-2 rounded-full shadow-xl backdrop-blur-md flex items-center gap-2 animate-in fade-in slide-in-from-top-3 duration-200">
          <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />
          <span className="font-semibold text-[11px]">{toastMessage}</span>
        </div>
      )}

      {/* Top Floating Header */}
      <div className={`sticky top-0 left-0 right-0 z-30 px-4 py-2.5 backdrop-blur-md border-b shadow-2xs ${
        isDark ? 'bg-black/95 border-neutral-800 text-white' : 'bg-white/95 border-neutral-200 text-neutral-900'
      }`}>
        <div className="w-full max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base font-black tracking-tight flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 bg-clip-text text-transparent">
                SHORTS
              </span>
            </span>
            {activeShort?.visibility === 'private' ? (
              <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                <Lock className="w-2.5 h-2.5" />
                Private
              </span>
            ) : (
              <span className="text-[10px] font-bold text-neutral-600 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Globe className="w-2.5 h-2.5 text-purple-600" />
                Public
              </span>
            )}
          </div>

          {/* Top Right Sound Toggle & Total Clips */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-neutral-500">
              {safeShorts.length > 0 ? `${safeActiveIndex + 1}/${safeShorts.length}` : '0/0'}
            </span>
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-neutral-700 flex items-center justify-center transition cursor-pointer shadow-2xs active:scale-95"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4 text-emerald-600" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Vertical Video Stage */}
      <div
        className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden bg-neutral-950 transition-transform duration-150 ease-out p-0"
        style={{ transform: dragOffset !== 0 ? `translateY(${dragOffset}px)` : undefined }}
      >
        {activeShort ? (
          <div
            key={activeShort.id}
            className="relative w-full h-full max-w-full sm:max-w-md md:max-w-xl lg:max-w-2xl mx-auto overflow-hidden bg-black shadow-2xl flex items-center justify-center sm:rounded-2xl sm:my-auto sm:max-h-[calc(100vh-130px)]"
          >
            {/* Instant Poster & Backdrop (Prevents black screen flash while video buffers or begins) */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
              <img
                src={
                  activeShort.thumbnailUrl ||
                  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=720&h=1280&fit=crop'
                }
                alt={activeShort.title}
                className="w-full h-full object-cover filter blur-xs scale-105"
              />
              <div className="absolute inset-0 bg-black/10" />
            </div>

            {/* Subtle floating buffer indicator when stream is first connecting */}
            {!loadedVideos[activeShort.id] && !videoErrorMap[activeShort.id] && (
              <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-[10px] font-semibold pointer-events-none animate-pulse shadow-md">
                <Sparkles className="w-3 h-3 text-purple-300 animate-spin" />
                <span>Buffering stream...</span>
              </div>
            )}

            {/* Real Video Element with smooth presentation */}
            {!videoErrorMap[activeShort.id] ? (
              <video
                ref={videoRef}
                src={activeShort.videoUrl}
                poster={activeShort.thumbnailUrl}
                preload="auto"
                className="relative z-1 w-full h-full object-cover cursor-pointer"
                autoPlay
                playsInline
                loop
                muted={isMuted}
                onLoadedData={() => {
                  setLoadedVideos((prev) => ({ ...prev, [activeShort.id]: true }));
                }}
                onCanPlay={() => {
                  setLoadedVideos((prev) => ({ ...prev, [activeShort.id]: true }));
                }}
                onClick={() => setIsPlaying(!isPlaying)}
                onError={() => {
                  setVideoErrorMap((prev) => ({ ...prev, [activeShort.id]: true }));
                }}
              />
            ) : (
              /* Visual Fallback Stage for Network Buffering in Clean Light Aesthetic */
              <div
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-full h-full bg-gradient-to-br from-purple-50 via-white to-pink-50 flex flex-col items-center justify-center p-6 text-center cursor-pointer relative"
              >
                <div className="flex items-end gap-1.5 h-10 mb-3">
                  <span className="w-1.5 bg-purple-600 rounded-full animate-bounce h-6" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 bg-pink-600 rounded-full animate-bounce h-10" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 bg-red-500 rounded-full animate-bounce h-8" style={{ animationDelay: '300ms' }} />
                  <span className="w-1.5 bg-indigo-600 rounded-full animate-bounce h-10" style={{ animationDelay: '200ms' }} />
                  <span className="w-1.5 bg-purple-500 rounded-full animate-bounce h-5" style={{ animationDelay: '400ms' }} />
                  <span className="w-1.5 bg-emerald-500 rounded-full animate-bounce h-7" style={{ animationDelay: '250ms' }} />
                </div>

                {hasActiveMeeting ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600 text-white text-xs font-bold mb-2 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                    Live Meeting Discussion
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200 text-xs font-semibold mb-2">
                    Standalone Short Video
                  </span>
                )}

                <h3 className="text-sm font-bold text-neutral-900 max-w-xs">
                  {activeShort.title}
                </h3>
                <p className="text-[11px] text-purple-700 mt-1 font-mono font-medium">
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
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-300 flex items-center gap-1.5 cursor-pointer"
                    >
                      <DoorOpen className="w-4 h-4" />
                      Join Live Room ({activeShort.meetingToken})
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Subtle Gradient Overlays for High Contrast Text Readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/75 pointer-events-none" />

            {/* Tap to Play / Pause Visual Feedback */}
            {!isPlaying && (
              <div
                onClick={() => setIsPlaying(true)}
                className="absolute inset-0 flex items-center justify-center bg-black/25 backdrop-blur-2xs cursor-pointer z-10"
              >
                <div className="w-16 h-16 rounded-full bg-white/90 border border-white text-neutral-900 flex items-center justify-center shadow-xl">
                  <Play className="w-8 h-8 fill-neutral-900 text-neutral-900 translate-x-0.5" />
                </div>
              </div>
            )}

            {/* Prev / Next Video Floating Arrows (Light Aesthetic) */}
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2 pointer-events-auto">
              <button
                type="button"
                onClick={handleGoPrev}
                className="w-8 h-8 rounded-full bg-white/90 hover:bg-white text-neutral-800 border border-neutral-200 flex items-center justify-center transition active:scale-95 shadow-md cursor-pointer"
                title="Previous Short (Swipe Down)"
              >
                <ChevronUp className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={handleGoNext}
                className="w-8 h-8 rounded-full bg-white/90 hover:bg-white text-neutral-800 border border-neutral-200 flex items-center justify-center transition active:scale-95 shadow-md cursor-pointer"
                title="Next Short (Swipe Up)"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>

            {/* Left Bottom Video Info Column (Frosted Clean Card) */}
            <div className="absolute bottom-5 left-3 right-16 z-20 flex flex-col gap-1.5 pointer-events-auto text-left">
              {/* Linked Live Meeting Room Card OR Standalone Indicator */}
              {hasActiveMeeting ? (
                <div
                  onClick={() => onJoinMeeting(activeShort.meetingToken)}
                  className="inline-flex items-center gap-2 bg-white/95 border border-purple-300 hover:border-purple-400 hover:bg-purple-50 backdrop-blur-md px-2.5 py-1 rounded-xl shadow-md transition cursor-pointer self-start group"
                >
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[11px] font-bold text-purple-700">
                    🔴 Live: {activeShort.meetingToken}
                  </span>
                  <span className="text-[10px] text-neutral-600 flex items-center gap-0.5 font-medium">
                    <Users className="w-2.5 h-2.5 text-purple-600" />
                    {activeShort.liveParticipantsCount || 4} online
                  </span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 bg-white/90 border border-neutral-200/90 backdrop-blur-md px-2.5 py-0.5 rounded-xl self-start shadow-xs">
                  <Video className="w-3 h-3 text-neutral-500" />
                  <span className="text-[10px] text-neutral-700 font-medium">Standalone Short Clip</span>
                </div>
              )}

              {/* Creator Info */}
              <div className="flex items-center gap-2">
                <img
                  src={activeShort.avatar}
                  alt={activeShort.author}
                  className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-md ring-1 ring-purple-400"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] truncate">
                      {activeShort.author}
                    </span>
                    <span className="text-[10px] text-neutral-200 font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                      {activeShort.handle}
                    </span>
                    {activeShort.visibility === 'private' && (
                      <span className="text-[9px] text-amber-800 flex items-center gap-0.5 bg-amber-50 px-1.5 py-0.2 rounded-sm border border-amber-300 font-semibold shadow-2xs">
                        <Lock className="w-2.5 h-2.5" />
                        Private
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] text-neutral-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{activeShort.timestamp}</span>
                </div>
              </div>

              {/* Title / Caption */}
              <p className="text-xs text-white font-normal leading-snug drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] line-clamp-3">
                {activeShort.title}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                {activeShort.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-bold text-purple-200 bg-black/40 px-1.5 py-0.5 rounded-md backdrop-blur-xs drop-shadow-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Music / Audio Track */}
              <div className="flex items-center gap-1 text-[10px] text-neutral-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                <Music className="w-3 h-3 text-pink-400 shrink-0" />
                <span className="truncate">{activeShort.musicTrack || 'Original Audio'}</span>
              </div>
            </div>

            {/* Right Side Action Bar (Vertical Light Aesthetic Buttons) */}
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
                  className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white flex flex-col items-center justify-center shadow-lg shadow-purple-900/40 transition active:scale-90 cursor-pointer ring-2 ring-white animate-pulse"
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
                  className="w-11 h-11 rounded-2xl bg-white/80 border border-neutral-300 text-neutral-400 opacity-60 flex flex-col items-center justify-center transition cursor-not-allowed shadow-sm"
                  title="No active meeting for this video"
                >
                  <DoorClosed className="w-5 h-5 text-neutral-400" />
                  <span className="text-[8px] font-bold tracking-tighter uppercase mt-0.5 leading-none text-neutral-400">
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
                  className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md border shadow-md transition ${
                    activeShort.isLiked
                      ? 'bg-red-50 border-red-300 text-red-500'
                      : 'bg-white/90 border-neutral-200/90 text-neutral-800 group-hover:bg-white'
                  }`}
                >
                  <Heart
                    className={`w-5 h-5 transition ${
                      activeShort.isLiked ? 'fill-red-500 text-red-500 scale-110' : 'group-hover:scale-110'
                    }`}
                  />
                </div>
                <span className="text-[10px] font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] mt-1">
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
                <div className="w-10 h-10 rounded-full bg-white/90 border border-neutral-200/90 text-neutral-800 flex items-center justify-center backdrop-blur-md group-hover:bg-white shadow-md transition">
                  <MessageCircle className="w-5 h-5 group-hover:scale-110 transition text-neutral-700" />
                </div>
                <span className="text-[10px] font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] mt-1">
                  {activeShort.commentsCount || activeShort.comments?.length || 0}
                </span>
              </button>

              {/* 4. REPOST BUTTON (Syncs with Profile Posts) */}
              <button
                id="btn-short-repost"
                type="button"
                onClick={() => handleOpenRepostMenu(activeShort)}
                className="flex flex-col items-center transition cursor-pointer group active:scale-90"
                title="Repost or Quote to Feed & Profile"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md border shadow-md transition ${
                    activeShort.isReposted
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-600'
                      : 'bg-white/90 border-neutral-200/90 text-neutral-800 group-hover:bg-white'
                  }`}
                >
                  <Repeat2
                    className={`w-5 h-5 transition ${
                      activeShort.isReposted ? 'scale-110 text-emerald-600' : 'group-hover:scale-110'
                    }`}
                  />
                </div>
                <span className="text-[10px] font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] mt-1">
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
                  className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md border shadow-md transition ${
                    activeShort.isBookmarked
                      ? 'bg-yellow-50 border-yellow-300 text-yellow-600'
                      : 'bg-white/90 border-neutral-200/90 text-neutral-800 group-hover:bg-white'
                  }`}
                >
                  <Bookmark
                    className={`w-5 h-5 transition ${
                      activeShort.isBookmarked ? 'fill-yellow-500 text-yellow-600 scale-110' : 'group-hover:scale-110'
                    }`}
                  />
                </div>
                <span className="text-[9px] font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] mt-1">
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
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-pink-600 border border-white text-white flex items-center justify-center shadow-md shadow-purple-300 group-hover:scale-110 transition">
                  <Upload className="w-5 h-5" />
                </div>
                <span className="text-[9px] font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] mt-1">
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
                      safeActiveIndex === idx ? 'h-3 bg-white shadow-xs' : 'h-1 bg-white/50 hover:bg-white/80'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* 30-Second Bottom Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-200/80 z-30">
              <div
                className="h-full bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 transition-all duration-300"
                style={{ width: `${Math.min(100, (progressSeconds / 30) * 100)}%` }}
              />
            </div>
          </div>
        ) : (
          <div className={`p-8 text-center rounded-2xl border shadow-sm max-w-sm ${
            isDark ? 'bg-[#0a0a0d] border-neutral-800 text-white' : 'bg-white border-neutral-200 text-neutral-900'
          }`}>
            <Video className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-purple-400' : 'text-neutral-400'}`} />
            <p className="text-sm font-bold">No short videos yet</p>
            <p className={`text-xs mt-1 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
              Be the first to upload a 30s short video clip!
            </p>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-4 px-4 py-2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 mx-auto active:scale-95 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Upload Short Clip</span>
            </button>
          </div>
        )}
      </div>

      {/* COMMENT SHEET DRAWER */}
      {isCommentDrawerOpen && activeShort && (
        <div
          id="shorts-comment-backdrop"
          className="absolute inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex flex-col justify-end items-center animate-in fade-in duration-150"
          onClick={() => setIsCommentDrawerOpen(false)}
        >
          <div
            id="shorts-comment-sheet"
            className={`w-full max-w-lg lg:max-w-xl h-2/3 border-t sm:border-x rounded-t-3xl flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-200 ${
              isDark ? 'bg-[#131B2E] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Header */}
            <div className={`px-4 py-3 border-b flex items-center justify-between shrink-0 ${
              isDark ? 'bg-[#0B0F19] border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <span className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                <MessageCircle className="w-4 h-4 text-indigo-400" />
                Comments ({activeShort.comments?.length || 0})
              </span>
              <button
                type="button"
                onClick={() => setIsCommentDrawerOpen(false)}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition cursor-pointer ${
                  isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white' : 'bg-slate-200/80 hover:bg-slate-300 text-slate-600 hover:text-slate-900'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Comments List */}
            <div className={`flex-1 overflow-y-auto p-4 space-y-3.5 ${isDark ? 'bg-[#131B2E]' : 'bg-white'}`}>
              {activeShort.comments && activeShort.comments.length > 0 ? (
                activeShort.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-2.5 text-left">
                    <img
                      src={comment.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face'}
                      alt={comment.author}
                      className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-slate-700"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-xs font-bold truncate ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                          {comment.author}
                        </span>
                        <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>{comment.timestamp}</span>
                      </div>
                      <p className={`text-xs mt-0.5 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className={`py-12 text-center text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  No comments yet. Start the discussion!
                </div>
              )}
            </div>

            {/* Comment Input Bar */}
            <form
              onSubmit={handleSendComment}
              className={`p-3 border-t flex items-center gap-2 shrink-0 ${
                isDark ? 'bg-[#0B0F19] border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <input
                type="text"
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Add a comment..."
                className={`flex-1 text-xs rounded-full px-3.5 py-2 border outline-hidden shadow-2xs ${
                  isDark
                    ? 'bg-[#1E293B] border-slate-700 text-slate-100 placeholder-slate-400 focus:border-indigo-500'
                    : 'bg-white text-slate-900 placeholder-slate-400 border-slate-300 focus:border-indigo-600'
                }`}
              />
              <button
                type="submit"
                disabled={!newCommentText.trim()}
                className="w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white flex items-center justify-center transition cursor-pointer shrink-0 shadow-xs"
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
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150"
          onClick={() => {
            if (!isRecordingWebcam) setIsCreateModalOpen(false);
          }}
        >
          <div
            id="create-short-modal"
            className={`w-full max-w-sm max-h-[92vh] overflow-y-auto rounded-3xl p-4 flex flex-col gap-3 shadow-2xl text-left animate-in zoom-in-95 duration-150 border ${
              isDark ? 'bg-[#131B2E] border-slate-700/80 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={`flex items-center justify-between pb-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-md">
                  <Upload className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Upload 30s Short Clip</h3>
                  <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Post standalone or link to Live Meeting</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  stopWebcamRecording();
                  setIsCreateModalOpen(false);
                }}
                className={`w-6 h-6 rounded-full flex items-center justify-center transition cursor-pointer ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900'
                }`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Video Preview or Source Selection */}
            <div className={`relative w-full h-40 rounded-2xl overflow-hidden border flex items-center justify-center ${
              isDark ? 'bg-[#0B0F19] border-slate-700' : 'bg-slate-900 border-slate-200'
            }`}>
              {isRecordingWebcam ? (
                <div className="relative w-full h-full">
                  <video
                    ref={webcamVideoRef}
                    className="w-full h-full object-cover"
                    autoPlay
                    playsInline
                    muted
                  />
                  <div className="absolute top-2 left-2 bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    REC 00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds} / 00:30
                  </div>
                  <button
                    type="button"
                    onClick={stopWebcamRecording}
                    className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg transition cursor-pointer"
                  >
                    Done Recording
                  </button>
                </div>
              ) : uploadedVideoUrl ? (
                <div className="relative w-full h-full bg-slate-950 flex items-center justify-center">
                  {uploadedThumbnail && (
                    <img
                      src={uploadedThumbnail}
                      alt="Thumbnail preview"
                      className="absolute inset-0 w-full h-full object-cover filter blur-xs scale-105"
                    />
                  )}
                  <video
                    src={uploadedVideoUrl}
                    poster={uploadedThumbnail || undefined}
                    className="relative z-1 w-full h-full object-cover"
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                  {isExtractingThumbnail && (
                    <div className="absolute inset-0 z-2 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center gap-1.5 text-white text-[11px] font-semibold">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                      <span>Optimizing preview...</span>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 z-3 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                    <CheckCircle2 className="w-3 h-3" /> Ready
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setUploadedVideoUrl(null);
                      setUploadedThumbnail(null);
                    }}
                    className="absolute bottom-2 left-1/2 -translate-x-1/2 z-3 bg-slate-900/90 hover:bg-slate-900 text-white text-[10px] font-semibold px-3 py-1 rounded-full transition cursor-pointer border border-slate-700 shadow-md active:scale-95"
                  >
                    Change Video
                  </button>
                </div>
              ) : (
                <div className={`flex flex-col items-center gap-2 p-3 text-center w-full ${isDark ? 'bg-[#0B0F19] text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="video/*"
                    className="hidden"
                  />
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isDark ? 'bg-indigo-500/15 border border-indigo-500/30 text-indigo-400' : 'bg-indigo-50 border border-indigo-100 text-indigo-600'
                  }`}>
                    <Video className="w-5 h-5" />
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1"
                    >
                      <Upload className="w-3 h-3" />
                      Select Video
                    </button>
                    <button
                      type="button"
                      onClick={startWebcamRecording}
                      className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-xl border transition cursor-pointer flex items-center gap-1 shadow-2xs ${
                        isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                      }`}
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
                      className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-xl border transition cursor-pointer flex items-center gap-1 shadow-2xs ${
                        isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                      }`}
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
              <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Short Caption
              </label>
              <textarea
                value={shortCaption}
                onChange={(e) => setShortCaption(e.target.value)}
                placeholder="What is this 30s clip about? (e.g. Quick tech demo or live discussion...)"
                rows={2}
                className={`w-full text-xs rounded-xl p-2.5 border outline-hidden resize-none shadow-2xs ${
                  isDark
                    ? 'bg-[#1E293B] border-slate-700 text-slate-100 placeholder-slate-400 focus:border-indigo-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-600'
                }`}
              />
            </div>

            {/* Linked Live Meeting Room Selector */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Linked Live Meeting Room
                </label>
                <span className={`text-[9px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {selectedMeetingToken !== 'none' ? '🔴 Join button will glow' : 'Dimmed (No Meet)'}
                </span>
              </div>
              <select
                value={selectedMeetingToken}
                onChange={(e) => setSelectedMeetingToken(e.target.value)}
                className={`w-full text-xs rounded-xl p-2.5 border outline-hidden cursor-pointer shadow-2xs ${
                  isDark
                    ? 'bg-[#1E293B] border-slate-700 text-slate-100 focus:border-indigo-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-indigo-600'
                }`}
              >
                <option value="none">🚫 No Meeting (Standalone Video - Join button dimmed)</option>
                {rooms.map((room) => (
                  <option key={room.token} value={room.token}>
                    🔴 {room.token} — {room.title}
                  </option>
                ))}
              </select>
              <p className={`text-[9px] mt-1 leading-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {selectedMeetingToken === 'none'
                  ? 'Meeting မရှိလဲ video တင်နိုင်ပါသည်။ ဘေးတန်း Join button သည် အရောင်မှိန်နေမည်ဖြစ်ပါသည်။'
                  : `ဒီ short ကို ကြည့်သူများ Join button ကို နှိပ်ပြီး ${selectedMeetingToken} သို့ တိုက်ရိုက်ဝင်ရောက်နိုင်မည်။`}
              </p>
            </div>

            {/* Privacy / Visibility Selector */}
            <div>
              <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Privacy / Visibility
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setShortVisibility('public')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    shortVisibility === 'public'
                      ? isDark
                        ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 shadow-xs'
                        : 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-xs'
                      : isDark
                      ? 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
                      : 'bg-slate-50 border-slate-300 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Globe className={`w-3.5 h-3.5 ${shortVisibility === 'public' ? 'text-indigo-400' : ''}`} />
                  <span>Public (အားလုံး)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShortVisibility('private')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    shortVisibility === 'private'
                      ? isDark
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-xs'
                        : 'bg-amber-50 border-amber-500 text-amber-800 shadow-xs'
                      : isDark
                      ? 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
                      : 'bg-slate-50 border-slate-300 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Lock className={`w-3.5 h-3.5 ${shortVisibility === 'private' ? 'text-amber-400' : ''}`} />
                  <span>Private (ကိုယ်တိုင်သာ)</span>
                </button>
              </div>
            </div>

            {/* Tags Input */}
            <div>
              <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Tags
              </label>
              <input
                type="text"
                value={shortTags}
                onChange={(e) => setShortTags(e.target.value)}
                placeholder="#AI #WebRTC #Tech"
                className={`w-full text-xs rounded-xl px-2.5 py-1.5 border outline-hidden shadow-2xs ${
                  isDark
                    ? 'bg-[#1E293B] border-slate-700 text-slate-100 placeholder-slate-400 focus:border-indigo-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-600'
                }`}
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
                className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePublishShort}
                className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-md shadow-indigo-600/20 transition cursor-pointer"
              >
                Publish 30s Short
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Repost & Quote Selection Modal */}
      {repostMenuShort && (
        <div
          id="shorts-repost-menu-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
          onClick={() => setRepostMenuShort(null)}
        >
          <div
            className="w-full max-w-xs bg-white rounded-2xl p-4 shadow-2xl border border-neutral-200 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <h3 className="text-sm font-bold text-neutral-900">Repost Video</h3>
              <button
                type="button"
                onClick={() => setRepostMenuShort(null)}
                className="p-1 rounded-full text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {/* Option 1: Repost */}
              <button
                type="button"
                id="btn-shorts-confirm-repost"
                onClick={() => handleConfirmRepost(repostMenuShort)}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left font-bold text-sm text-neutral-800 hover:bg-emerald-50 hover:text-emerald-700 transition cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <Repeat className="w-4 h-4" />
                </div>
                <div>
                  <p className="leading-tight">
                    {repostMenuShort.isReposted ? 'Undo Repost' : 'Repost'}
                  </p>
                  <p className="text-[11px] font-normal text-neutral-500">
                    Instantly share this video to your profile & feed
                  </p>
                </div>
              </button>

              {/* Option 2: Quote */}
              <button
                type="button"
                id="btn-shorts-open-quote"
                onClick={() => handleOpenQuoteModal(repostMenuShort)}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left font-bold text-sm text-neutral-800 hover:bg-purple-50 hover:text-purple-700 transition cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <p className="leading-tight">Quote Video</p>
                  <p className="text-[11px] font-normal text-neutral-500">
                    Add your thoughts and attach media with this video
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quote Composer Modal with Text & Media Attachment */}
      {quoteModalShort && (
        <div
          id="shorts-quote-composer-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
          onClick={() => setQuoteModalShort(null)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-2xl p-5 shadow-2xl border border-neutral-200 flex flex-col max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 shrink-0">
              <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-purple-600" />
                Quote Video
              </h3>
              <button
                type="button"
                onClick={() => setQuoteModalShort(null)}
                className="p-1 rounded-full text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQuotePost} className="flex-1 flex flex-col min-h-0 overflow-y-auto pt-3 space-y-3">
              {/* User Avatar & Comment Input */}
              <div className="flex gap-3">
                <img
                  src={userProfile.avatar}
                  alt={userProfile.name}
                  className="w-10 h-10 rounded-full object-cover border border-neutral-200 shrink-0"
                />
                <textarea
                  id="shorts-quote-input"
                  value={quoteText}
                  onChange={(e) => setQuoteText(e.target.value)}
                  placeholder="Add a comment to this video..."
                  rows={3}
                  className="w-full p-2.5 text-sm border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none placeholder:text-neutral-400"
                  autoFocus
                />
              </div>

              {/* Optional Attached Media Preview */}
              {quoteMediaUrl && (
                <div className="relative rounded-xl overflow-hidden border border-neutral-200 bg-neutral-900 max-h-48 flex items-center justify-center">
                  {quoteMediaType === 'video' ? (
                    <video
                      src={quoteMediaUrl}
                      controls
                      className="max-h-48 w-full object-contain"
                    />
                  ) : (
                    <img
                      src={quoteMediaUrl}
                      alt="Quote Attachment"
                      className="max-h-48 w-full object-contain"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => setQuoteMediaUrl('')}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-black text-white cursor-pointer"
                    title="Remove attachment"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Quoted Short Card Preview */}
              <div className="p-3 rounded-xl border border-neutral-200/90 bg-neutral-50/80 flex items-center gap-3">
                <div className="relative w-16 h-20 rounded-lg overflow-hidden bg-neutral-900 shrink-0 border border-neutral-200">
                  <img
                    src={quoteModalShort.thumbnailUrl || quoteModalShort.videoUrl}
                    alt={quoteModalShort.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <Play className="w-4 h-4 text-white fill-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <img
                      src={quoteModalShort.avatar}
                      alt={quoteModalShort.author}
                      className="w-4 h-4 rounded-full object-cover"
                    />
                    <span className="text-xs font-bold text-neutral-800 truncate">
                      {quoteModalShort.author}
                    </span>
                    <span className="text-[11px] text-neutral-400">
                      {quoteModalShort.handle}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 line-clamp-2 mt-1">
                    {quoteModalShort.title}
                  </p>
                  {quoteModalShort.meetingToken && (
                    <span className="inline-block text-[10px] font-bold text-purple-700 bg-purple-100/70 px-1.5 py-0.5 rounded mt-1">
                      Room: {quoteModalShort.meetingToken}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions: Photo/Video Attachment and Post Button */}
              <div className="pt-2 flex items-center justify-between border-t border-neutral-100">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => quoteFileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition border border-neutral-200 cursor-pointer"
                  >
                    <ImageIcon className="w-4 h-4 text-purple-600" />
                    <span>Attach Photo/Video</span>
                  </button>
                  <input
                    ref={quoteFileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleQuoteFileUpload}
                    className="hidden"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuoteModalShort(null)}
                    className="px-4 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm transition cursor-pointer"
                  >
                    Quote Post
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
