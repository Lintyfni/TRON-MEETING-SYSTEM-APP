import React, { useState, useEffect, useRef } from 'react';
import {
  Home,
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
  Share2,
  Users,
  Shield,
  Smile,
  PhoneOff,
  Hand
} from 'lucide-react';
import { MeetingRoom, MeetingNote, ChatMessage, UserSettings, MeetingComment, UserProfile, ParticipantState } from '../types';
import { MultiFilterDialog } from './MultiFilterDialog';
import { GranolaNotesModal } from './GranolaNotesModal';
import { MeetingChatModal } from './MeetingChatModal';
import { TikTokCommentsModal } from './TikTokCommentsModal';
import { ZoomParticipantsDrawer } from './ZoomParticipantsDrawer';
import { ZoomSecurityModal } from './ZoomSecurityModal';
import { ZoomAiCompanionModal } from './ZoomAiCompanionModal';
import { ZoomReactionsTray } from './ZoomReactionsTray';
import { api } from '../services/api';
import { webrtc, RemoteParticipant } from '../services/webrtc';
import { languageOptions, initialUserProfile, virtualBackgroundPresets } from '../data/initialData';

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
  onBackToHome?: () => void;
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
  onBackToHome,
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

  // Zoom Standard Features State
  const [isParticipantsDrawerOpen, setIsParticipantsDrawerOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isAiCompanionModalOpen, setIsAiCompanionModalOpen] = useState(false);
  const [isReactionsTrayOpen, setIsReactionsTrayOpen] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [showEndMeetingDialog, setShowEndMeetingDialog] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState<{ id: number; emoji: string; x: number }[]>([]);

  // Screen Sharing State
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  // Synchronized Room Participants State with Backend
  const [participantsList, setParticipantsList] = useState<ParticipantState[]>(() => {
    return room.participants.map((name) => ({
      name,
      role: name === room.host ? 'host' : 'participant',
      isAudioMuted: name !== room.host,
      isVideoMuted: false,
      isHandRaised: false,
    }));
  });

  // Fetch live participants from backend API
  useEffect(() => {
    let isMounted = true;
    api.fetchRoomParticipants(room.token).then((data) => {
      if (isMounted && data && data.length > 0) {
        setParticipantsList(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [room.token]);

  // Check if current user is the room host (supports profile edit sync)
  const isHostMe =
    room.host === userProfile.name ||
    room.host === userProfile.handle ||
    room.host === userProfile.handle.replace('@', '') ||
    room.host === 'Aung Myint' ||
    room.host === 'Aung Aung' ||
    room.host === 'Aung Aung (Me)';

  // Poked users tracking & playful private poke state
  const [pokedUsers, setPokedUsers] = useState<Record<string, { timestamp: number; count: number }>>({});
  const [lastPokedUser, setLastPokedUser] = useState<string | null>(null);

  const handlePokeUser = (targetUser: string) => {
    setPokedUsers((prev) => {
      const current = prev[targetUser] || { timestamp: 0, count: 0 };
      return {
        ...prev,
        [targetUser]: { timestamp: Date.now(), count: current.count + 1 },
      };
    });
    setLastPokedUser(targetUser);

    // Reset visual floating poke icon after 2 seconds
    setTimeout(() => {
      setLastPokedUser((prev) => (prev === targetUser ? null : prev));
    }, 2000);
  };

  // Floating feedback toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Live WebRTC State for real-time P2P video/audio multi-device streaming
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const [remotePeerInfo, setRemotePeerInfo] = useState<Record<string, RemoteParticipant>>({});
  const [dynamicParticipants, setDynamicParticipants] = useState<string[]>([]);
  const [webrtcStatus, setWebrtcStatus] = useState<'connecting' | 'connected' | 'error' | 'disconnected'>('connecting');

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

  // ZOOM SCREEN SHARING
  const handleStartScreenShare = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = stream;
        setScreenStream(stream);
        setIsScreenSharing(true);
        setToastMessage('🖥️ Screen Sharing Started');
        stream.getVideoTracks()[0].onended = () => {
          handleStopScreenShare();
        };
      } else {
        // Presentation window mode if display media blocked by browser context
        setIsScreenSharing(true);
        setToastMessage('🖥️ Presentation Screen Mode Active');
      }
    } catch (err) {
      console.warn('Screen share cancelled or restricted, enabling interactive presentation window:', err);
      setIsScreenSharing(true);
      setToastMessage('🖥️ Presentation Screen Mode Active');
    }
    setTimeout(() => setToastMessage(null), 2200);
  };

  const handleStopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    setScreenStream(null);
    setIsScreenSharing(false);
    setToastMessage('🛑 Screen Sharing Stopped');
    setTimeout(() => setToastMessage(null), 2000);
  };

  // ZOOM REACTIONS & RAISE HAND
  const handleToggleRaiseHand = () => {
    const nextHand = !isHandRaised;
    setIsHandRaised(nextHand);
    setToastMessage(nextHand ? '✋ Hand Raised! (လက်ထောင်ထားသည်)' : 'Hand Lowered (လက်ပြန်ချသည်)');
    api.updateParticipantState(room.token, userProfile.name, { isHandRaised: nextHand });
    webrtc.broadcastState({ isHandRaised: nextHand });
    setTimeout(() => setToastMessage(null), 2200);
  };

  const handleSelectReaction = (emoji: string) => {
    const newReaction = {
      id: Date.now() + Math.random(),
      emoji,
      x: (Math.random() - 0.5) * 60,
    };
    setFloatingReactions((prev) => [...prev, newReaction]);
    api.sendReaction(room.token, emoji, userProfile.name);
    webrtc.broadcastReaction(emoji);
    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
    }, 2500);
  };

  // ZOOM HOST MODERATION & SECURITY
  const handleMuteAll = () => {
    api.updateRoomSettings(room.token, { muteAll: true });
    setParticipantsList((prev) =>
      prev.map((p) => (p.role !== 'host' ? { ...p, isAudioMuted: true } : p))
    );
    setToastMessage('🔇 Host Muted All Participants');
    setTimeout(() => setToastMessage(null), 2200);
  };

  const handleMuteParticipant = (name: string) => {
    api.updateParticipantState(room.token, name, { isAudioMuted: true });
    setParticipantsList((prev) =>
      prev.map((p) => (p.name === name ? { ...p, isAudioMuted: true } : p))
    );
    setToastMessage(`🔇 Muted ${name}`);
    setTimeout(() => setToastMessage(null), 2000);
  };

  const handleUnmuteParticipant = (name: string) => {
    api.updateParticipantState(room.token, name, { isAudioMuted: false });
    setParticipantsList((prev) =>
      prev.map((p) => (p.name === name ? { ...p, isAudioMuted: false } : p))
    );
    setToastMessage(`🎙️ Asked ${name} to unmute`);
    setTimeout(() => setToastMessage(null), 2000);
  };

  const handleLowerParticipantHand = (name: string) => {
    api.updateParticipantState(room.token, name, { isHandRaised: false });
    setParticipantsList((prev) =>
      prev.map((p) => (p.name === name ? { ...p, isHandRaised: false } : p))
    );
  };

  const handleRemoveParticipant = (name: string) => {
    api.removeParticipant(room.token, name);
    setParticipantsList((prev) => prev.filter((p) => p.name !== name));
    setToastMessage(`🚪 Removed ${name} from room`);
    setTimeout(() => setToastMessage(null), 2000);
  };

  const handleSecurityUpdate = (updates: Partial<MeetingRoom> & { muteAll?: boolean }) => {
    api.updateRoomSettings(room.token, updates);
    if (updates.muteAll) {
      handleMuteAll();
    }
    setToastMessage('🛡️ Meeting Security Settings Updated');
    setTimeout(() => setToastMessage(null), 2000);
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
        // Request video and microphone audio for live WebRTC conferencing
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 1280, min: 320 },
            height: { ideal: 720, min: 240 },
          },
          audio: true,
        });
      } catch (firstErr) {
        console.warn('High quality video+audio constraints rejected, trying fallback { video: true, audio: true }:', firstErr);
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
        } catch {
          // If mic unavailable or denied, fallback to video-only
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }
      }

      // Synchronize initial track states with current UI toggles
      stream.getVideoTracks().forEach((track) => {
        track.enabled = isCameraOn;
      });
      stream.getAudioTracks().forEach((track) => {
        track.enabled = isMicOn;
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

  // Sync mic track enabled status and broadcast over WebRTC
  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = isMicOn;
      });
      webrtc.broadcastState({ isAudioMuted: !isMicOn });
    }
  }, [isMicOn, localStream]);

  // Sync camera track enabled status and broadcast over WebRTC
  useEffect(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = isCameraOn;
      });
      webrtc.broadcastState({ isVideoMuted: !isCameraOn });
    }
  }, [isCameraOn, localStream]);

  // Push updated local stream into WebRTC peer calls
  useEffect(() => {
    if (localStream) {
      webrtc.updateLocalStream(localStream);
    }
  }, [localStream]);

  // WebRTC Peer Lifecycle & Event Handlers
  useEffect(() => {
    let isMounted = true;

    webrtc
      .joinMeetingRoom(room.token, userProfile.name, localStream, userProfile.avatar)
      .then((_id) => {
        if (isMounted) setWebrtcStatus('connected');
      })
      .catch((_err) => {
        if (isMounted) setWebrtcStatus('error');
      });

    const unsubStreamAdded = webrtc.on('stream:added', ({ peerId, userName, stream }) => {
      if (!isMounted) return;
      setRemoteStreams((prev) => ({
        ...prev,
        [userName]: stream,
        [peerId]: stream,
      }));
      setDynamicParticipants((prev) => {
        if (!prev.includes(userName)) return [...prev, userName];
        return prev;
      });
    });

    const unsubStreamRemoved = webrtc.on('stream:removed', ({ peerId }) => {
      if (!isMounted) return;
      setRemoteStreams((prev) => {
        const next = { ...prev };
        delete next[peerId];
        return next;
      });
    });

    const unsubPeerJoined = webrtc.on('peer:joined', (participant: RemoteParticipant) => {
      if (!isMounted) return;
      setRemotePeerInfo((prev) => ({
        ...prev,
        [participant.peerId]: participant,
        [participant.userName]: participant,
      }));
      setDynamicParticipants((prev) => {
        if (!prev.includes(participant.userName)) return [...prev, participant.userName];
        return prev;
      });
      setToastMessage(`👋 ${participant.userName} joined`);
      setTimeout(() => setToastMessage(null), 2500);
    });

    const unsubPeerLeft = webrtc.on('peer:left', ({ peerId }) => {
      if (!isMounted) return;
      setRemoteStreams((prev) => {
        const next = { ...prev };
        delete next[peerId];
        return next;
      });
      setRemotePeerInfo((prev) => {
        const next = { ...prev };
        delete next[peerId];
        return next;
      });
    });

    const unsubStatus = webrtc.on('status:changed', ({ status }) => {
      if (!isMounted) return;
      setWebrtcStatus(status);
    });

    const unsubReaction = webrtc.on('reaction:received', ({ emoji, sender }) => {
      if (!isMounted) return;
      const newReaction = {
        id: Date.now() + Math.random(),
        emoji,
        x: (Math.random() - 0.5) * 60,
      };
      setFloatingReactions((prev) => [...prev, newReaction]);
      setToastMessage(`${sender || 'Participant'} reacted ${emoji}`);
      setTimeout(() => {
        setFloatingReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
      }, 2500);
      setTimeout(() => setToastMessage(null), 2000);
    });

    const unsubChat = webrtc.on('chat:received', ({ message }) => {
      if (!isMounted) return;
      if (message?.text && onSendMessage) {
        onSendMessage(room.token, message.text, message.recipient);
      }
    });

    const unsubState = webrtc.on('state:changed', ({ peerId, isAudioMuted, isVideoMuted }) => {
      if (!isMounted) return;
      setRemotePeerInfo((prev) => {
        const p = prev[peerId];
        if (p) {
          return {
            ...prev,
            [peerId]: {
              ...p,
              isAudioMuted: isAudioMuted !== undefined ? isAudioMuted : p.isAudioMuted,
              isVideoMuted: isVideoMuted !== undefined ? isVideoMuted : p.isVideoMuted,
            },
          };
        }
        return prev;
      });
    });

    return () => {
      isMounted = false;
      unsubStreamAdded();
      unsubStreamRemoved();
      unsubPeerJoined();
      unsubPeerLeft();
      unsubStatus();
      unsubReaction();
      unsubChat();
      unsubState();
      webrtc.leaveMeetingRoom();
    };
  }, [room.token, userProfile.name]);

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

  // Combine room participants with real-time WebRTC joined participants
  const allParticipantNames = Array.from(
    new Set([
      userProfile.name,
      ...room.participants,
      ...dynamicParticipants,
      ...Object.values(remotePeerInfo).map((p: RemoteParticipant) => p.userName),
    ])
  );

  // Filtered participants
  const visibleUsers = selectedFilterUsers.includes('All')
    ? allParticipantNames
    : allParticipantNames.filter((u) => selectedFilterUsers.includes(u));

  const roomChats = chats.filter((c) => c.meetingToken === room.token);

  // Active virtual background URL (custom uploaded image or selected preset)
  const activeVirtualBgUrl =
    settings.virtualBackgroundType === 'custom' && settings.virtualBackgroundCustomImage
      ? settings.virtualBackgroundCustomImage
      : virtualBackgroundPresets.find((p) => p.id === settings.virtualBackgroundType)?.url ||
        virtualBackgroundPresets[0]?.url;

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
        ) : isScreenSharing ? (
          <div className="w-full h-full relative rounded-2xl overflow-hidden bg-neutral-950 flex flex-col border border-emerald-500/40 shadow-2xl">
            {/* Top Green Zoom Banner */}
            <div className="bg-emerald-950/90 border-b border-emerald-500/50 px-4 py-2 flex items-center justify-between text-xs text-white z-30 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-bold text-emerald-300">You are sharing your screen (Zoom Stage)</span>
                <span className="text-neutral-400 hidden sm:inline">| {room.token}</span>
              </div>
              <button
                type="button"
                onClick={handleStopScreenShare}
                className="px-3 py-1 bg-red-600 hover:bg-red-500 active:scale-95 rounded-full text-xs font-bold text-white shadow-lg transition cursor-pointer border border-red-400/50"
              >
                Stop Share
              </button>
            </div>

            {/* Screen Content */}
            <div className="flex-1 relative flex items-center justify-center bg-neutral-900 overflow-hidden">
              {screenStream ? (
                <video
                  ref={(el) => {
                    if (el && screenStream) {
                      el.srcObject = screenStream;
                      el.play().catch(() => {});
                    }
                  }}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="p-8 text-center space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center mx-auto text-emerald-400 shadow-xl">
                    <Share2 className="w-8 h-8 animate-pulse" />
                  </div>
                  <h4 className="font-bold text-base text-white">Live Presentation Mode Active</h4>
                  <p className="text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed">
                    Broadcasting interactive screen &amp; slides to {participantsList.length} participants in {room.token}.
                  </p>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-800/80 border border-neutral-700 text-[11px] text-neutral-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>HD 1080p Stream Active</span>
                  </div>
                </div>
              )}

              {/* Floating Participant Video PIP */}
              <div className="absolute top-4 right-4 z-20 w-32 h-24 sm:w-40 sm:h-28 rounded-xl overflow-hidden bg-neutral-900/90 border border-neutral-700 shadow-2xl backdrop-blur-md">
                {isCameraOn && localStream ? (
                  <video
                    ref={handleVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center">
                    <img src={userProfile.avatar} alt="Me" className="w-8 h-8 rounded-full mb-1 object-cover" />
                    <span className="text-[10px] text-neutral-300 font-medium truncate">{userProfile.name}</span>
                  </div>
                )}
                <div className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded text-[8px] text-white">
                  You
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div
            className={`w-full h-full grid gap-2 ${
              visibleUsers.length === 1
                ? 'grid-cols-1 grid-rows-1'
                : visibleUsers.length === 2
                ? 'grid-cols-1 grid-rows-2 sm:grid-cols-2 sm:grid-rows-1'
                : visibleUsers.length <= 4
                ? 'grid-cols-2 grid-rows-2'
                : 'grid-cols-2 grid-rows-3 sm:grid-cols-3 sm:grid-rows-2'
            }`}
          >
            {visibleUsers.map((user, idx) => {
              const isSpeaker = speakingUser === user;
              const isMe =
                user === userProfile.name ||
                user.toLowerCase() === userProfile.name.toLowerCase() ||
                user.includes('(Me)');
              const displayName = isMe ? userProfile.name : user;
              const isHost =
                user === room.host ||
                (isMe && (room.host === userProfile.name || isHostMe));
              const isLocalWebcam = isMe && isCameraOn && localStream;
              const isUserListening = isMe ? isMicOn : !mutedListeningUsers[user];
              // Subtitles only active for self when enabled
              const isUserSubtitlesOn = isMe
                ? Boolean(userSubtitlesActive[user] ?? userSubtitlesActive[userProfile.name] ?? userSubtitlesActive['Aung Myint'])
                : false;
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
                      <span className="text-[11px] font-normal text-neutral-300 tracking-normal">
                        {displayName.toLowerCase()}
                      </span>
                      <span className="text-[9px] text-neutral-500 mt-0.5">
                        camera off
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
                      {settings.enableVirtualBackground ? (
                        /* Virtual Background mode: background image behind, user's camera feed / person in front */
                        <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
                          {/* Background image (custom uploaded or preset) */}
                          <img
                            src={activeVirtualBgUrl}
                            alt="Virtual Background"
                            className="absolute inset-0 w-full h-full object-cover z-0 filter brightness-90"
                          />
                          <div className="absolute inset-0 bg-black/20 z-1" />

                          {/* Foreground: User live camera video or avatar */}
                          <div className="relative z-10 w-full h-full flex items-center justify-center p-2">
                            {localStream && !cameraError ? (
                              <div className="relative w-[86%] h-[92%] rounded-3xl overflow-hidden shadow-2xl border-2 border-white/20 bg-neutral-900/60 backdrop-blur-xs">
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
                              </div>
                            ) : (
                              <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-amber-400 shadow-2xl">
                                <img
                                  src={userProfile.avatar}
                                  alt={user}
                                  className={`w-full h-full object-cover opacity-95 ${
                                    settings.mirrorMyVideo ? '-scale-x-100' : ''
                                  }`}
                                />
                              </div>
                            )}
                          </div>

                          {/* Virtual BG Active Badge */}
                          <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1 bg-amber-950/90 border border-amber-500/70 px-2 py-0.5 rounded-full text-[9px] font-bold text-amber-300 backdrop-blur-md shadow-md">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            VIRTUAL BG
                          </div>
                        </div>
                      ) : (
                        /* Direct Camera Mode: No virtual background */
                        <>
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

                          {/* Live Cam Active Pill */}
                          {!cameraError && !isCameraLoading && (
                            <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1 bg-emerald-950/90 border border-emerald-500/70 px-2 py-0.5 rounded-full text-[9px] font-bold text-emerald-400 backdrop-blur-md shadow-md">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              CAM LIVE
                            </div>
                          )}
                        </>
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

                      {/* Name Pill overlay: small text in lowercase */}
                      <div className="absolute bottom-2.5 right-2.5 z-20 flex items-center gap-1 bg-black/75 px-2.5 py-0.5 rounded-full border border-neutral-700/80 text-[10px] font-normal text-neutral-200 backdrop-blur-md">
                        <span>{displayName.toLowerCase()}</span>
                        {isHost && <span className="bg-red-600 text-white text-[8px] px-1 rounded font-bold uppercase">HOST</span>}
                      </div>
                    </div>
                  ) : (remoteStreams[user] || (remotePeerInfo[user] && remoteStreams[remotePeerInfo[user].peerId])) ? (
                    /* 3. Other Participants: Live WebRTC Video & Audio Stream */
                    <div className="relative w-full h-full bg-black overflow-hidden flex items-center justify-center">
                      <video
                        ref={(el) => {
                          if (el) {
                            const st = remoteStreams[user] || (remotePeerInfo[user] && remoteStreams[remotePeerInfo[user].peerId]);
                            if (st && el.srcObject !== st) {
                              el.srcObject = st;
                              el.play().catch(() => {});
                            }
                          }
                        }}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                      />
                      {/* Live WebRTC Badge */}
                      <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-full border border-emerald-500/40 text-[9px] text-emerald-400 font-semibold shadow-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>LIVE P2P</span>
                      </div>

                      {/* Remote Mic Indicator */}
                      <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1 bg-black/70 backdrop-blur-md p-1.5 rounded-full border border-neutral-800 text-neutral-300 shadow-md">
                        {remotePeerInfo[user]?.isAudioMuted ? (
                          <MicOff className="w-3 h-3 text-red-500" />
                        ) : (
                          <Mic className="w-3 h-3 text-emerald-400" />
                        )}
                      </div>

                      {/* Participant name pill: lowercase and small font */}
                      <div className="absolute bottom-2.5 right-2.5 z-20 flex items-center gap-1 bg-black/75 px-2.5 py-0.5 rounded-full border border-neutral-700/80 text-[10px] font-normal text-neutral-200 backdrop-blur-md shadow-md">
                        <span>{displayName.toLowerCase()}</span>
                        {isHost && <span className="bg-red-600 text-white text-[8px] px-1 rounded font-bold uppercase">HOST</span>}
                      </div>
                    </div>
                  ) : (
                    /* 4. Other Participants: Avatar & Audio Waveform */
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
                          title={`Click to direct chat with ${displayName}`}
                        >
                          {displayName[0]?.toUpperCase()}
                        </button>
                      </div>

                      {/* Participant name pill: lowercase and small font, NO message icon */}
                      <div
                        id={`user-name-pill-${user.replace(/\s+/g, '-').toLowerCase()}`}
                        className="mt-2.5 flex items-center gap-1.5 bg-black/60 px-2.5 py-0.5 rounded-full border border-neutral-800/80 shadow-md"
                      >
                        <span className="text-[11px] font-normal text-neutral-200 tracking-normal">
                          {displayName.toLowerCase()}
                        </span>
                        {isHost && (
                          <span className="text-[9px] bg-red-600/90 text-white px-1 py-0.2 rounded font-semibold uppercase">
                            HOST
                          </span>
                        )}
                      </div>

                      {/* Waveform Equalizer when speaking */}
                      <div className="mt-2 flex items-center gap-1 h-3">
                        <span className={`w-0.5 bg-emerald-400 rounded-full transition-all ${isSpeaker ? 'h-3 animate-pulse' : 'h-1 opacity-40'}`} />
                        <span className={`w-0.5 bg-emerald-300 rounded-full transition-all ${isSpeaker ? 'h-4 animate-bounce' : 'h-1 opacity-40'}`} />
                        <span className={`w-0.5 bg-emerald-400 rounded-full transition-all ${isSpeaker ? 'h-2 animate-pulse' : 'h-1 opacity-40'}`} />
                        <span className={`w-0.5 bg-emerald-300 rounded-full transition-all ${isSpeaker ? 'h-3.5 animate-bounce' : 'h-1 opacity-40'}`} />
                      </div>
                    </div>
                  )}

                  {/* Playful Private Poke Animation Overlay: Floating swirl/bounce icon only, NO text */}
                  {lastPokedUser === user && !isMe && (
                    <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
                      <div className="text-6xl animate-bounce drop-shadow-[0_10px_25px_rgba(0,0,0,0.9)] animate-in zoom-in-50 duration-200">
                        👉
                      </div>
                    </div>
                  )}

                  {/* Floating Live Subtitle Bubble inside speaker cell (when subtitles on for Me) */}
                  {isMe && isUserSubtitlesOn && isTranscribeOn && (
                    <div
                      id={`bubble-subtitles-${user.replace(/\s+/g, '-').toLowerCase()}`}
                      className="absolute bottom-11 left-2 right-2 z-20 p-2 rounded-xl bg-black/85 backdrop-blur-md border border-cyan-500/50 text-white shadow-xl animate-in fade-in slide-in-from-bottom-1 pointer-events-none"
                    >
                      <div className="flex items-center justify-between text-[9px] text-cyan-400 font-semibold mb-0.5">
                        <span className="flex items-center gap-1">
                          <Volume2 className="w-2.5 h-2.5 text-cyan-400 animate-pulse" />
                          {user} ({settings.subtitleLanguage || 'Myanmar (MM)'})
                        </span>
                        <span className="text-[8px] bg-cyan-950/90 text-cyan-300 border border-cyan-800 px-1 py-0.2 rounded font-mono">
                          SUBTITLE LIVE
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-100 font-medium leading-tight italic line-clamp-2">
                        "{userSubtitleText}"
                      </p>
                    </div>
                  )}

                  {/* Corner Controls: Differentiated between "Me" and "Other Users" */}
                  {isMe ? (
                    /* For Me: LIVE + My Mic Toggle + My Subtitle Toggle + My Cam Toggle (Directly toggleable from screen tile) */
                    <div className="absolute bottom-2 left-2 z-20 flex items-center gap-1.5">
                      <div className="hidden sm:flex items-center gap-1 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10 text-[9px] text-emerald-400 font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        ME
                      </div>

                      {/* 1. Mic Mute / Unmute for Myself */}
                      <button
                        id="btn-my-tile-mic"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsMicOn((prev) => {
                            const next = !prev;
                            setToastMessage(next ? '🎙️ Mic ON (မိမိအသံ ဖွင့်လိုက်ပါပြီ)' : '🔇 Mic Muted (မိမိအသံ ပိတ်လိုက်ပါပြီ)');
                            setTimeout(() => setToastMessage(null), 2000);
                            return next;
                          });
                        }}
                        className={`p-1.5 rounded-full backdrop-blur-md border transition cursor-pointer active:scale-90 flex items-center justify-center ${
                          isMicOn
                            ? 'bg-emerald-950/90 text-emerald-400 border-emerald-500 shadow-sm hover:bg-emerald-900 ring-1 ring-emerald-500/30'
                            : 'bg-red-950/90 text-red-400 border-red-800 hover:bg-red-900 ring-1 ring-red-500/30'
                        }`}
                        title={isMicOn ? 'My Mic ON - Click to Mute (မိမိအသံပိတ်ရန်)' : 'My Mic MUTED - Click to Unmute (မိမိအသံဖွင့်ရန်)'}
                      >
                        {isMicOn ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                      </button>

                      {/* 2. Subtitle Toggle for Myself */}
                      <button
                        id="btn-my-tile-subtitles"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUserSubtitlesActive((prev) => {
                            const current = Boolean(prev[user] ?? prev[userProfile.name] ?? prev['Aung Myint']);
                            const next = !current;
                            setToastMessage(next ? '💬 My Subtitles ON (စာတန်းဖွင့်ပါပြီ)' : '💬 My Subtitles OFF (စာတန်းပိတ်ပါပြီ)');
                            setTimeout(() => setToastMessage(null), 2000);
                            return { ...prev, [user]: next, [userProfile.name]: next, 'Aung Myint': next };
                          });
                        }}
                        className={`p-1.5 rounded-full backdrop-blur-md border transition cursor-pointer active:scale-90 flex items-center justify-center ${
                          isUserSubtitlesOn
                            ? 'bg-cyan-950/90 text-cyan-300 border-cyan-500/70 shadow-sm hover:bg-cyan-900 ring-1 ring-cyan-500/30'
                            : 'bg-black/70 text-neutral-400 border-neutral-700/60 hover:text-white'
                        }`}
                        title={isUserSubtitlesOn ? 'My Subtitles ON - Click to Turn Off (စာတန်းပိတ်မည်)' : 'My Subtitles OFF - Click to Turn On (စာတန်းဖွင့်မည်)'}
                      >
                        <Subtitles className="w-3.5 h-3.5" />
                      </button>

                      {/* 3. Cam Toggle right next to Subtitle - Toggles live camera directly from user tile! */}
                      <button
                        id="btn-my-tile-cam"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleCamera();
                        }}
                        className={`p-1.5 rounded-full backdrop-blur-md border transition cursor-pointer active:scale-90 flex items-center justify-center ${
                          isCameraOn
                            ? 'bg-emerald-950/90 text-emerald-400 border-emerald-500 shadow-sm hover:bg-emerald-900 ring-1 ring-emerald-500/30'
                            : 'bg-red-950/90 text-red-400 border-red-800 hover:bg-red-900 ring-1 ring-red-500/30'
                        }`}
                        title={isCameraOn ? 'My Camera ON - Click to Turn Off (Camera ပိတ်မည်)' : 'My Camera OFF - Click to Turn On (Camera ဖွင့်မည်)'}
                      >
                        {isCameraOn ? <VideoIcon className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  ) : (
                    /* For Other Participants: ONLY Chat icon and Poke icon! NO text labels */
                    <div className="absolute bottom-2 left-2 z-20 flex items-center gap-1.5">
                      {/* 1. Chat icon only */}
                      <button
                        id={`btn-tile-chat-${user.replace(/\s+/g, '-').toLowerCase()}`}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDirectChat(user);
                        }}
                        className="p-1.5 rounded-full bg-black/80 hover:bg-red-600 active:scale-90 text-neutral-200 hover:text-white border border-neutral-700/80 hover:border-red-500 backdrop-blur-md transition shadow-md cursor-pointer flex items-center justify-center group"
                        title={`Chat with ${user}`}
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-red-400 group-hover:text-white transition" />
                      </button>

                      {/* 2. Poke icon only */}
                      <button
                        id={`btn-tile-poke-${user.replace(/\s+/g, '-').toLowerCase()}`}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePokeUser(user);
                        }}
                        className="p-1.5 rounded-full bg-black/80 hover:bg-amber-600 active:scale-90 text-neutral-200 hover:text-white border border-neutral-700/80 hover:border-amber-500 backdrop-blur-md transition shadow-md cursor-pointer flex items-center justify-center group"
                        title={`Poke ${user}`}
                      >
                        <span className="text-sm leading-none group-hover:scale-125 transition-transform duration-150">👉</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. TOP OVERLAY: Current Group Chat / Meeting Title & Number Button (Click to Edit) + Recording Button */}
      {/* (Old MEET row completely removed from top feed as requested; original selectors preserved in Note/Chat modals) */}
      <div className="relative z-30 pt-3 px-3 flex items-center justify-between gap-2 pointer-events-auto">
        {onBackToHome && (
          <button
            id="btn-meeting-back-home"
            type="button"
            onClick={onBackToHome}
            className="p-2 rounded-full bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700/80 text-neutral-300 hover:text-white transition shadow-lg cursor-pointer shrink-0"
            title="Back to Home Screen"
          >
            <Home className="w-4 h-4 text-neutral-300" />
          </button>
        )}
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
        {/* Share Meeting Link Button */}
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

        {/* Note Pad */}
        <button
          id="btn-tile-notes"
          type="button"
          onClick={() => setIsNotesOpen(true)}
          className="flex flex-col items-center group cursor-pointer"
          title="Meeting Notes Pad"
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

      {/* 4. BOTTOM OVERLAY: Speaker Role Toggle (Clean & Unobstructed, without @handle or Bio text) */}
      <div className="relative z-30 p-3 pb-2 pointer-events-auto">
        <button
          id="btn-toggle-speaker-role"
          type="button"
          onClick={() => handleSelectRole(userRole === 'speaker' ? 'listener' : 'speaker')}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition cursor-pointer border backdrop-blur-md shadow-sm active:scale-95 ${
            userRole === 'speaker'
              ? 'bg-emerald-950/90 hover:bg-emerald-900/90 text-emerald-300 border-emerald-500/80 shadow-emerald-950/30'
              : 'bg-neutral-900/80 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 border-neutral-700/80'
          }`}
          title={userRole === 'speaker' ? 'Speaker: ON (Click to turn OFF / Listener)' : 'Speaker: OFF (Click to turn ON / Speak)'}
        >
          <span
            className={`w-2 h-2 rounded-full transition-colors ${
              userRole === 'speaker' ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-500'
            }`}
          />
          <span>Speaker</span>
          <span
            className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase ${
              userRole === 'speaker'
                ? 'bg-emerald-900 text-emerald-200 border border-emerald-500/50'
                : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
            }`}
          >
            {userRole === 'speaker' ? 'ON' : 'OFF'}
          </span>
        </button>
      </div>

      {/* Floating Reaction Emojis Container */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-28 pointer-events-none z-40 overflow-hidden w-64 h-64 flex justify-center">
        {floatingReactions.map((r) => (
          <div
            key={r.id}
            className="absolute bottom-0 text-3xl animate-float-heart drop-shadow-lg"
            style={{
              transform: `translateX(${r.x}px)`,
            }}
          >
            {r.emoji}
          </div>
        ))}
      </div>

      {/* 5. ZOOM BOTTOM ACTION DOCK (Standard Zoom Bar) */}
      <div className="relative z-30 px-2 py-1.5 bg-neutral-950/95 border-t border-neutral-800 backdrop-blur-md flex items-center justify-around gap-1 text-[10px] text-neutral-300 pointer-events-auto">
        {/* Audio Mic Mute / Unmute */}
        <button
          id="zoom-btn-mic"
          type="button"
          onClick={handleToggleGlobalMic}
          className="flex flex-col items-center gap-1 p-1 hover:text-white transition cursor-pointer"
          title={isMicOn ? "Mute Microphone" : "Unmute Microphone"}
        >
          <div className={`p-2 rounded-xl transition ${isMicOn ? 'bg-neutral-800 text-emerald-400' : 'bg-red-950/80 text-red-400 border border-red-800'}`}>
            {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </div>
          <span className="truncate max-w-[46px]">{isMicOn ? 'Mute' : 'Unmute'}</span>
        </button>

        {/* Video Start / Stop */}
        <button
          id="zoom-btn-video"
          type="button"
          onClick={handleToggleCamera}
          className="flex flex-col items-center gap-1 p-1 hover:text-white transition cursor-pointer"
          title={isCameraOn ? "Stop Video" : "Start Video"}
        >
          <div className={`p-2 rounded-xl transition ${isCameraOn ? 'bg-neutral-800 text-emerald-400' : 'bg-red-950/80 text-red-400 border border-red-800'}`}>
            {isCameraOn ? <VideoIcon className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
          </div>
          <span className="truncate max-w-[46px]">{isCameraOn ? 'Stop Video' : 'Start Video'}</span>
        </button>

        {/* Security (Host) */}
        {isHostMe && (
          <button
            id="zoom-btn-security"
            type="button"
            onClick={() => setIsSecurityModalOpen(true)}
            className="flex flex-col items-center gap-1 p-1 hover:text-white transition cursor-pointer"
            title="Host Security Controls"
          >
            <div className="p-2 rounded-xl bg-neutral-800 text-emerald-400 hover:bg-neutral-750 transition">
              <Shield className="w-4 h-4" />
            </div>
            <span>Security</span>
          </button>
        )}

        {/* Participants (Live count badge) */}
        <button
          id="zoom-btn-participants"
          type="button"
          onClick={() => setIsParticipantsDrawerOpen(true)}
          className="flex flex-col items-center gap-1 p-1 hover:text-white transition cursor-pointer relative"
          title="Participants List & Moderation"
        >
          <div className="p-2 rounded-xl bg-neutral-800 text-neutral-200 hover:bg-neutral-750 transition relative">
            <Users className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[9px] px-1 rounded-full font-bold">
              {participantsList.length}
            </span>
          </div>
          <span>Participants</span>
        </button>

        {/* Screen Share (Zoom signature green) */}
        <button
          id="zoom-btn-share"
          type="button"
          onClick={() => {
            if (isScreenSharing) {
              handleStopScreenShare();
            } else {
              handleStartScreenShare();
            }
          }}
          className="flex flex-col items-center gap-1 p-1 hover:text-white transition cursor-pointer"
          title="Share Screen"
        >
          <div className={`p-2 rounded-xl transition ${isScreenSharing ? 'bg-emerald-600 text-white animate-pulse' : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800 hover:bg-emerald-900'}`}>
            <Share2 className="w-4 h-4" />
          </div>
          <span className="text-emerald-400 font-semibold">{isScreenSharing ? 'Sharing' : 'Share'}</span>
        </button>

        {/* Reactions & Raise Hand */}
        <button
          id="zoom-btn-reactions"
          type="button"
          onClick={() => setIsReactionsTrayOpen(true)}
          className="flex flex-col items-center gap-1 p-1 hover:text-white transition cursor-pointer relative"
          title="Reactions & Raise Hand"
        >
          <div className={`p-2 rounded-xl transition ${isHandRaised ? 'bg-amber-500 text-neutral-950' : 'bg-neutral-800 text-neutral-200 hover:bg-neutral-750'}`}>
            {isHandRaised ? <Hand className="w-4 h-4" /> : <Smile className="w-4 h-4" />}
          </div>
          <span>{isHandRaised ? 'Hand ✋' : 'React'}</span>
        </button>

        {/* Zoom AI Companion */}
        <button
          id="zoom-btn-ai-companion"
          type="button"
          onClick={() => setIsAiCompanionModalOpen(true)}
          className="flex flex-col items-center gap-1 p-1 hover:text-white transition cursor-pointer"
          title="Zoom AI Companion & Live Notes"
        >
          <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500/20 to-purple-500/20 text-amber-300 border border-amber-500/40 hover:scale-105 transition shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-amber-300 font-semibold">AI Notes</span>
        </button>

        {/* End / Leave */}
        <button
          id="zoom-btn-leave"
          type="button"
          onClick={() => setShowEndMeetingDialog(true)}
          className="flex flex-col items-center gap-1 p-1 hover:text-white transition cursor-pointer"
          title="Leave / End Meeting"
        >
          <div className="p-2 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/40 transition">
            <PhoneOff className="w-4 h-4" />
          </div>
          <span className="text-red-400 font-bold">{isHostMe ? 'End' : 'Leave'}</span>
        </button>
      </div>

      {/* End / Leave Meeting Confirmation Dialog */}
      {showEndMeetingDialog && (
        <div
          id="zoom-end-meeting-dialog-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={() => setShowEndMeetingDialog(false)}
        >
          <div
            id="zoom-end-meeting-dialog"
            className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl p-5 text-white shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center space-y-1">
              <h3 className="font-bold text-base text-white">
                {isHostMe ? 'End Meeting for All?' : 'Leave Meeting?'}
              </h3>
              <p className="text-xs text-neutral-400">
                {isHostMe
                  ? 'As the host, you can end this meeting for everyone or leave to the Home Screen.'
                  : `Are you sure you want to leave ${room.title} (${room.token})?`}
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              {isHostMe && (
                <button
                  id="btn-end-meeting-for-all"
                  type="button"
                  onClick={() => {
                    setShowEndMeetingDialog(false);
                    if (onBackToHome) onBackToHome();
                  }}
                  className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-950/50 transition cursor-pointer"
                >
                  End Meeting for All
                </button>
              )}

              <button
                id="btn-leave-meeting-confirm"
                type="button"
                onClick={() => {
                  setShowEndMeetingDialog(false);
                  if (onBackToHome) onBackToHome();
                }}
                className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs transition cursor-pointer"
              >
                Leave Meeting
              </button>

              <button
                id="btn-leave-meeting-cancel"
                type="button"
                onClick={() => setShowEndMeetingDialog(false)}
                className="w-full py-2 rounded-xl text-neutral-400 hover:text-white text-xs font-medium transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Toast Notification when toggling per-speaker audio or subtitle */}
      {toastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-black/90 backdrop-blur-md border border-neutral-700 text-white px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-2xl animate-in fade-in slide-in-from-top-2 pointer-events-none flex items-center gap-1.5 whitespace-nowrap">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Zoom Modals */}
      <ZoomParticipantsDrawer
        isOpen={isParticipantsDrawerOpen}
        onClose={() => setIsParticipantsDrawerOpen(false)}
        roomToken={room.token}
        participants={participantsList}
        isHost={isHostMe}
        onMuteAll={handleMuteAll}
        onMuteParticipant={handleMuteParticipant}
        onUnmuteParticipant={handleUnmuteParticipant}
        onLowerHand={handleLowerParticipantHand}
        onRemoveParticipant={handleRemoveParticipant}
      />

      <ZoomSecurityModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        room={room}
        onUpdateSettings={handleSecurityUpdate}
      />

      <ZoomReactionsTray
        isOpen={isReactionsTrayOpen}
        onClose={() => setIsReactionsTrayOpen(false)}
        isHandRaised={isHandRaised}
        onToggleRaiseHand={handleToggleRaiseHand}
        onSelectEmoji={handleSelectReaction}
      />

      <ZoomAiCompanionModal
        isOpen={isAiCompanionModalOpen}
        onClose={() => setIsAiCompanionModalOpen(false)}
        roomTitle={room.title}
        roomToken={room.token}
        keyPoints={room.keyPoints}
        chats={chats.filter((c) => c.meetingToken === room.token).map((c) => ({ sender: c.sender, text: c.text }))}
        onSaveToNotes={(note) => {
          onAddNote(note);
          api.createNote(note);
          setToastMessage('✅ AI Summary saved to Notes!');
          setTimeout(() => setToastMessage(null), 2200);
        }}
        onExportToPost={(content) => {
          if (onExportToFeed) {
            onExportToFeed(content);
            setToastMessage('🚀 AI Takeaways shared to Feed!');
            setTimeout(() => setToastMessage(null), 2200);
          }
        }}
      />

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
        onSendMessage={(token, text, recipient) => {
          onSendMessage(token, text, recipient);
          webrtc.broadcastChat({
            id: `msg_${Date.now()}`,
            meetingToken: token,
            sender: userProfile.name,
            text,
            time: 'Just now',
            recipient,
          });
        }}
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
