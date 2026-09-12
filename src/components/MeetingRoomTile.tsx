import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Home,
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
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
  Hand,
  Link2,
  Globe,
  Lock,
  Search,
  AtSign,
} from 'lucide-react';
import { MeetingRoom, MeetingNote, ChatMessage, UserSettings, MeetingComment, UserProfile, ParticipantState, SocialUser } from '../types';
import { MultiFilterDialog } from './MultiFilterDialog';
import { GranolaNotesModal } from './GranolaNotesModal';
import { MeetingChatModal } from './MeetingChatModal';
import { TikTokCommentsModal } from './TikTokCommentsModal';
import { ZoomParticipantsDrawer } from './ZoomParticipantsDrawer';
import { ZoomSecurityModal } from './ZoomSecurityModal';
import { ZoomReactionsTray } from './ZoomReactionsTray';
import { RichEmojiPicker } from './RichEmojiPicker';
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
  onToggleRecording?: (token: string, isStart: boolean, durationSec?: number, visibility?: 'public' | 'private') => void;
  onOpenProfile?: () => void;
  onBackToHome?: () => void;
  comments?: Record<string, MeetingComment[]>;
  userProfile?: UserProfile;
  socialUsers?: SocialUser[];
  onSelectUser?: (user: SocialUser | UserProfile) => void;
  onAddComment?: (meetingToken: string, text: string, replyToCommentId?: string, replyToUser?: string) => void;
  onToggleLikeComment?: (meetingToken: string, commentId: string, replyId?: string) => void;
}

interface FloatingHeart {
  id: number;
  x: number;
  color: string;
}

interface FloatingReaction {
  id: number;
  emoji: string;
  sender: string;
  x: number;
  size?: number;
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
  socialUsers = [],
  onSelectUser,
  onAddComment,
  onToggleLikeComment,
}) => {
  // Search bar state for searching users (in this meeting & social network)
  const meetingSearchContainerRef = useRef<HTMLDivElement | null>(null);
  const [meetingSearchQuery, setMeetingSearchQuery] = useState('');
  const [isMeetingSearchFocused, setIsMeetingSearchFocused] = useState(false);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        meetingSearchContainerRef.current &&
        !meetingSearchContainerRef.current.contains(event.target as Node)
      ) {
        setIsMeetingSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close search dropdown on ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMeetingSearchFocused(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // Build combined users list with meeting participant presence
  const meetingAvailableUsers = React.useMemo(() => {
    const currentAsUser: SocialUser & { isInMeeting: boolean } = {
      id: 'usr_me',
      name: userProfile.name,
      handle: userProfile.handle.startsWith('@') ? userProfile.handle : `@${userProfile.handle}`,
      avatar: userProfile.avatar,
      bio: userProfile.bio || 'WebRTC Live Audio/Video Meeting Host ⚡',
      isFollowedByMe: false,
      isFollowingMe: false,
      followersCount: typeof userProfile.followers === 'number' ? userProfile.followers : 1,
      followingCount: userProfile.following || 0,
      isInMeeting: true,
    };

    const roomParticipantNames = room.participants || [];
    const hostName = room.host;
    const allMeetingNames = Array.from(new Set([userProfile.name, hostName, ...roomParticipantNames]));
    const externalUsers = socialUsers || [];

    const meetingUsers: (SocialUser & { isInMeeting: boolean })[] = [currentAsUser];

    allMeetingNames.forEach((name) => {
      if (name === userProfile.name) return;
      const match = externalUsers.find((u) => u.name.toLowerCase() === name.toLowerCase());
      if (match) {
        meetingUsers.push({ ...match, isInMeeting: true });
      } else {
        meetingUsers.push({
          id: `usr_${name.toLowerCase().replace(/\s+/g, '_')}`,
          name,
          handle: `@${name.toLowerCase().replace(/\s+/g, '')}`,
          avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=face`,
          bio: `Meeting participant in ${room.token}`,
          isFollowedByMe: false,
          isFollowingMe: false,
          followersCount: 88,
          followingCount: 34,
          isInMeeting: true,
        });
      }
    });

    externalUsers.forEach((ext) => {
      const alreadyIncluded = meetingUsers.some(
        (mu) => mu.id === ext.id || mu.name.toLowerCase() === ext.name.toLowerCase()
      );
      if (!alreadyIncluded) {
        meetingUsers.push({ ...ext, isInMeeting: false });
      }
    });

    return meetingUsers;
  }, [userProfile, room.participants, room.host, room.token, socialUsers]);

  // Filter meeting users based on @query or search input
  const filteredMeetingUsers = React.useMemo(() => {
    const rawQuery = meetingSearchQuery.trim().toLowerCase();
    const query = rawQuery.startsWith('@') ? rawQuery.slice(1) : rawQuery;

    if (!query) {
      return meetingAvailableUsers;
    }

    return meetingAvailableUsers.filter((u) => {
      const handleClean = u.handle.toLowerCase().replace('@', '');
      const nameClean = u.name.toLowerCase();
      const bioClean = u.bio.toLowerCase();
      return (
        handleClean.includes(query) ||
        nameClean.includes(query) ||
        bioClean.includes(query)
      );
    });
  }, [meetingAvailableUsers, meetingSearchQuery]);

  // Navigate to selected user profile
  const handleSelectMeetingUser = (user: SocialUser) => {
    setIsMeetingSearchFocused(false);
    setMeetingSearchQuery('');
    if (onSelectUser) {
      if (user.id === 'usr_me' || user.handle === userProfile.handle) {
        onSelectUser(userProfile);
      } else {
        onSelectUser(user);
      }
    } else if (onOpenProfile) {
      onOpenProfile();
    }
  };

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
  const [isReactionsTrayOpen, setIsReactionsTrayOpen] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [showEndMeetingDialog, setShowEndMeetingDialog] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);
  const [isSideShareMenuOpen, setIsSideShareMenuOpen] = useState(false);

  // Screen Sharing State
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  // Synchronized Room Participants State with Backend & real-time peers
  const [participantsList, setParticipantsList] = useState<ParticipantState[]>(() => {
    const combined = Array.from(new Set([userProfile.name, ...room.participants]));
    return combined.map((name) => ({
      name,
      role: name === room.host ? 'host' : 'participant',
      isAudioMuted: name !== room.host && name !== userProfile.name,
      isVideoMuted: false,
      isHandRaised: false,
    }));
  });

  // Active target participant for camera tile inline reactions popover
  const [reactingTargetUser, setReactingTargetUser] = useState<string | null>(null);

  // Close camera reactions popover on outside click
  useEffect(() => {
    if (!reactingTargetUser) return;
    const handleClickOutside = () => setReactingTargetUser(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [reactingTargetUser]);

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

  // Recording Privacy Modal state
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [recordingVisibility, setRecordingVisibility] = useState<'public' | 'private'>('public');

  const handleToggleRecording = () => {
    if (isLocalRecording) {
      // Stop recording
      setIsLocalRecording(false);
      setToastMessage(
        recordingVisibility === 'private'
          ? `🔒 Private Meeting Saved to Profile! (${formatRecordingTime(recordingSeconds)})`
          : `💾 Public Meeting Saved to Profile! (${formatRecordingTime(recordingSeconds)})`
      );
      if (onToggleRecording) onToggleRecording(room.token, false, recordingSeconds, recordingVisibility);
      setTimeout(() => setToastMessage(null), 2500);
    } else {
      // Open modal to select Public or Private before starting
      setIsRecordModalOpen(true);
    }
  };

  const handleConfirmStartRecording = (visibility: 'public' | 'private') => {
    setRecordingVisibility(visibility);
    setIsRecordModalOpen(false);
    setIsLocalRecording(true);
    setToastMessage(
      visibility === 'private'
        ? `🔒 Private Recording Started (${room.token})`
        : `🔴 Public Recording Started (${room.token})`
    );
    if (onToggleRecording) onToggleRecording(room.token, true, 0, visibility);
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

  // Floating reactions helper: triggers emojis rising specifically inside a participant's camera tile
  const triggerParticipantReaction = useCallback((senderName: string, emoji: string) => {
    const count = 5;
    for (let i = 0; i < count; i++) {
      const newReaction: FloatingReaction = {
        id: Date.now() + Math.random() + i,
        emoji,
        sender: senderName,
        x: (Math.random() - 0.5) * 60,
        size: 24 + Math.random() * 10,
      };
      setTimeout(() => {
        setFloatingReactions((prev) => [...prev, newReaction]);
      }, i * 90);

      setTimeout(() => {
        setFloatingReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
      }, 2200 + i * 90);
    }
  }, []);

  const isReactionForParticipant = useCallback((
    reactionSender: string,
    tileUser: string,
    isMe: boolean,
    displayName: string
  ): boolean => {
    if (!reactionSender) return false;
    const s = reactionSender.trim().toLowerCase();
    const t = tileUser.trim().toLowerCase();
    const d = displayName.trim().toLowerCase();
    const myName = (userProfile?.name || '').trim().toLowerCase();

    // If this tile belongs to ME:
    if (isMe) {
      if (s === 'me' || s === myName || s === d || s === t) return true;
      const cleanS = s.replace(/\(me\)/g, '').trim();
      const cleanT = t.replace(/\(me\)/g, '').trim();
      if (cleanS === cleanT || cleanS === myName || cleanS === d) return true;
    }

    // If this tile is someone else:
    if (s === t || s === d) return true;
    const cleanS = s.replace(/\(me\)/g, '').trim();
    const cleanT = t.replace(/\(me\)/g, '').trim();
    return cleanS.length > 0 && cleanS === cleanT;
  }, [userProfile?.name]);

  const handleSelectReaction = (emoji: string) => {
    // 1. Float reaction inside MY camera box
    triggerParticipantReaction(userProfile.name, emoji);
    // 2. Broadcast via WebRTC to peers so they see it in my camera box
    webrtc.broadcastReaction(emoji);
    // 3. Post to backend so all clients across meeting room receive it
    api.sendReaction(room.token, emoji, userProfile.name);

    setToastMessage(`Reacted ${emoji} (Sent to meeting)`);
    setTimeout(() => setToastMessage(null), 1800);
  };

  const handleReactToUser = (targetUser: string, emoji: string) => {
    triggerParticipantReaction(targetUser, emoji);
    webrtc.broadcastReaction(emoji);
    api.sendReaction(room.token, emoji, targetUser);
    setToastMessage(`Reacted ${emoji} to ${targetUser}`);
    setTimeout(() => setToastMessage(null), 1800);
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
      const reactionSender = sender || 'Participant';
      triggerParticipantReaction(reactionSender, emoji);
      setToastMessage(`${reactionSender} reacted ${emoji}`);
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

  // Periodic poll for meeting reactions via API (ensures sync across all participants)
  const lastReactionTimestampRef = useRef<number>(Date.now() - 2000);

  useEffect(() => {
    let isMounted = true;
    const interval = setInterval(async () => {
      if (!isMounted) return;
      try {
        const recent = await api.fetchRoomReactions(room.token, lastReactionTimestampRef.current);
        if (!isMounted || !recent || recent.length === 0) return;
        recent.forEach((r) => {
          if (r.timestamp > lastReactionTimestampRef.current) {
            lastReactionTimestampRef.current = r.timestamp;
          }
          const myName = (userProfile.name || '').toLowerCase();
          if (r.sender?.toLowerCase() !== myName && r.sender?.toLowerCase() !== 'me') {
            triggerParticipantReaction(r.sender, r.emoji);
            setToastMessage(`${r.sender} reacted ${r.emoji}`);
            setTimeout(() => setToastMessage(null), 2000);
          }
        });
      } catch {}
    }, 1500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [room.token, userProfile.name, triggerParticipantReaction]);

  // Occasional peer reactions to keep the room lively and interactive
  useEffect(() => {
    const peerReactTimer = setInterval(() => {
      const otherParticipants = room.participants.filter(
        (p) => p.toLowerCase() !== userProfile.name.toLowerCase() && !p.includes('(Me)')
      );
      if (otherParticipants.length > 0) {
        const randomPeer = otherParticipants[Math.floor(Math.random() * otherParticipants.length)];
        const peerEmojis = ['👏', '👍', '❤️', '🎉', '😂'];
        const randomEmoji = peerEmojis[Math.floor(Math.random() * peerEmojis.length)];
        triggerParticipantReaction(randomPeer, randomEmoji);
      }
    }, 22000);
    return () => clearInterval(peerReactTimer);
  }, [room.participants, userProfile.name, triggerParticipantReaction]);

  const handleTriggerHeart = (e?: React.MouseEvent) => {
    setLikeCount((prev) => prev + 1);
    const id = Date.now() + Math.random();
    const colors = ['#ef4444', '#ec4899', '#f43f5e', '#fb7185', '#a855f7'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const randomX = Math.random() * 50 - 25; // slight spread
    setFloatingHearts((prev) => [...prev.slice(-15), { id, x: randomX, color: randomColor }]);

    // Float heart reaction inside user's camera tile and broadcast to all participants
    triggerParticipantReaction(userProfile.name, '❤️');
    webrtc.broadcastReaction('❤️');
    api.sendReaction(room.token, '❤️', userProfile.name);

    setToastMessage(`❤️ Liked Meeting (${room.title})`);
    setTimeout(() => setToastMessage(null), 1600);

    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((h) => h.id !== id));
    }, 1600);
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

  // Accurate real-time count of active participants in the meeting room
  const liveParticipantCount = allParticipantNames.length;

  // Keep participantsList in sync with all live participants
  useEffect(() => {
    setParticipantsList((prev) => {
      const existingNames = new Set(prev.map((p) => p.name));
      let changed = false;
      const updated = [...prev];
      allParticipantNames.forEach((name) => {
        if (!existingNames.has(name)) {
          changed = true;
          updated.push({
            name,
            role: name === room.host ? 'host' : 'participant',
            isAudioMuted: name !== room.host && name !== userProfile.name,
            isVideoMuted: false,
            isHandRaised: false,
          });
        }
      });
      return changed ? updated : prev;
    });
  }, [allParticipantNames.join(','), room.host, userProfile.name]);


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
      className="relative w-full h-full bg-neutral-100 overflow-hidden select-none flex flex-col justify-between"
      onDoubleClick={handleTriggerHeart}
    >
      {/* 1. Multi-User Video Grid */}
      <div className="absolute inset-0 z-0 bg-neutral-100 flex items-center justify-center p-2 pt-16 pb-28">
        {visibleUsers.length === 0 ? (
          <div className="text-center text-neutral-500 p-6 bg-white rounded-2xl border border-neutral-200 shadow-sm">
            <UsersPlaceholder />
            <p className="text-sm font-medium">No participant selected in filter</p>
            <button
              onClick={() => setSelectedFilterUsers(['All'])}
              className="mt-3 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs"
            >
              Reset to All
            </button>
          </div>
        ) : isScreenSharing ? (
          <div className="w-full h-full relative rounded-2xl overflow-hidden bg-white flex flex-col border border-neutral-200 shadow-xl">
            {/* Top Zoom Banner */}
            <div className="bg-white/95 border-b border-neutral-200 px-4 py-2 flex items-center justify-between text-xs text-neutral-900 z-30 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="font-bold text-emerald-700">You are sharing your screen (Zoom Stage)</span>
                <span className="text-neutral-400 hidden sm:inline">| {room.token}</span>
              </div>
              <button
                type="button"
                onClick={handleStopScreenShare}
                className="px-3 py-1 bg-red-600 hover:bg-red-500 active:scale-95 rounded-full text-xs font-bold text-white shadow-md transition cursor-pointer"
              >
                Stop Share
              </button>
            </div>

            {/* Screen Content */}
            <div className="flex-1 relative flex items-center justify-center bg-neutral-50 overflow-hidden">
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
                  <div className="w-16 h-16 rounded-2xl bg-white border border-neutral-200 flex items-center justify-center mx-auto text-purple-600 shadow-md">
                    <Share2 className="w-8 h-8 animate-pulse text-purple-600" />
                  </div>
                  <h4 className="font-bold text-base text-neutral-900">Live Presentation Mode Active</h4>
                  <p className="text-xs text-neutral-500 max-w-sm mx-auto leading-relaxed">
                    Broadcasting interactive screen &amp; slides to {participantsList.length} participants in {room.token}.
                  </p>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-neutral-200 text-[11px] text-neutral-700 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>HD 1080p Stream Active</span>
                  </div>
                </div>
              )}

              {/* Floating Participant Video PIP */}
              <div className="absolute top-4 right-4 z-20 w-32 h-24 sm:w-40 sm:h-28 rounded-xl overflow-hidden bg-white border border-neutral-200 shadow-xl backdrop-blur-md">
                {isCameraOn && localStream ? (
                  <video
                    ref={handleVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-neutral-50">
                    <img src={userProfile.avatar} alt="Me" className="w-8 h-8 rounded-full mb-1 object-cover border border-neutral-200" />
                    <span className="text-[10px] text-neutral-700 font-medium truncate">{userProfile.name}</span>
                  </div>
                )}
                <div className="absolute bottom-1 right-1 bg-purple-600 px-1.5 py-0.5 rounded text-[8px] text-white font-bold">
                  You
                </div>

                {/* Live Floating Reactions on PIP Cam */}
                <div className="absolute inset-x-0 bottom-2 top-0 pointer-events-none z-30 overflow-hidden flex justify-center items-end">
                  {floatingReactions
                    .filter((r) => isReactionForParticipant(r.sender, userProfile.name, true, userProfile.name))
                    .map((r) => (
                      <div
                        key={r.id}
                        className="absolute bottom-1 animate-float-emoji drop-shadow-md select-none pointer-events-none"
                        style={{
                          left: `calc(50% + ${r.x * 0.4}px)`,
                          fontSize: `${(r.size || 24) * 0.75}px`,
                        }}
                      >
                        {r.emoji}
                      </div>
                    ))}
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
                  className={`relative rounded-2xl overflow-hidden bg-white border transition-all duration-300 flex items-center justify-center shadow-xs ${
                    isSpeaker
                      ? 'border-purple-600 ring-2 ring-purple-600/30 shadow-md'
                      : 'border-neutral-200'
                  }`}
                >
                  {/* Background gradient / simulated room canvas */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-b ${
                      idx % 3 === 0
                        ? 'from-neutral-50 via-white to-neutral-50'
                        : idx % 3 === 1
                        ? 'from-purple-50/40 via-white to-neutral-50'
                        : 'from-neutral-100/40 via-white to-purple-50/20'
                    }`}
                  />

                  {/* 1. If Me and Camera is OFF: မိမိ screen မပေါ်ဘူး (Screen Hidden) */}
                  {isMe && !isCameraOn ? (
                    <div className="relative z-10 flex flex-col items-center justify-center p-4 text-center select-none">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-purple-50 border border-purple-200 flex items-center justify-center mb-2 shadow-xs">
                        <VideoOff className="w-6 h-6 sm:w-7 sm:h-7 text-neutral-400" />
                      </div>
                      <span className="text-[11px] font-semibold text-neutral-900 tracking-normal">
                        {displayName.toLowerCase()}
                      </span>
                      <span className="text-[9px] text-neutral-500 mt-0.5">
                        camera off
                      </span>
                      <button
                        type="button"
                        onClick={handleToggleCamera}
                        className="mt-2.5 px-3 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:scale-95 text-white rounded-full text-[10px] font-semibold transition cursor-pointer shadow-xs flex items-center gap-1.5"
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
                            <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1 bg-white/95 border border-emerald-300 px-2 py-0.5 rounded-full text-[9px] font-bold text-emerald-700 backdrop-blur-md shadow-xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              CAM LIVE
                            </div>
                          )}
                        </>
                      )}

                      {/* Loading State while Camera is initializing */}
                      {isCameraLoading && (
                        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/90 backdrop-blur-xs text-center p-3">
                          <div className="w-8 h-8 rounded-full border-2 border-purple-600 border-t-transparent animate-spin mb-2" />
                          <span className="text-xs font-bold text-purple-700">Camera စတင်ဖွင့်နေပါသည်...</span>
                          <span className="text-[10px] text-neutral-500 mt-0.5">Connecting live webcam video</span>
                        </div>
                      )}

                      {/* Error Banner with Retry Button */}
                      {cameraError && (
                        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-4 bg-white/95 text-center">
                          <div className="w-11 h-11 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mb-2 shadow-xs">
                            <VideoOff className="w-5 h-5 text-red-500" />
                          </div>
                          <span className="text-xs font-bold text-red-600 mb-1">Camera မဖွင့်နိုင်ပါ</span>
                          <p className="text-[10px] text-neutral-600 max-w-[220px] mb-3 leading-snug">
                            {cameraError}
                          </p>
                          <button
                            type="button"
                            onClick={startCamera}
                            className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full text-[10px] font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <VideoIcon className="w-3.5 h-3.5" />
                            <span>Retry Camera (ပြန်လည်ဖွင့်မည်)</span>
                          </button>
                        </div>
                      )}

                      {/* Name Pill overlay: small text in lowercase */}
                      <div className="absolute bottom-2.5 right-2.5 z-20 flex items-center gap-1 bg-white/95 px-2.5 py-0.5 rounded-full border border-neutral-200 text-[10px] font-semibold text-neutral-800 backdrop-blur-md shadow-xs">
                        <span>{displayName.toLowerCase()}</span>
                        {isHost && <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[8px] px-1 rounded font-bold uppercase">HOST</span>}
                      </div>
                    </div>
                  ) : (remoteStreams[user] || (remotePeerInfo[user] && remoteStreams[remotePeerInfo[user].peerId])) ? (
                    /* 3. Other Participants: Live WebRTC Video & Audio Stream */
                    <div className="relative w-full h-full bg-neutral-900 overflow-hidden flex items-center justify-center">
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
                      <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-full border border-emerald-300 text-[9px] text-emerald-700 font-semibold shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>LIVE P2P</span>
                      </div>

                      {/* Remote Mic Indicator */}
                      <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1 bg-white/95 backdrop-blur-md p-1.5 rounded-full border border-neutral-200 text-neutral-700 shadow-xs">
                        {remotePeerInfo[user]?.isAudioMuted ? (
                          <MicOff className="w-3 h-3 text-red-500" />
                        ) : (
                          <Mic className="w-3 h-3 text-purple-600" />
                        )}
                      </div>

                      {/* Participant name pill: lowercase and small font */}
                      <div className="absolute bottom-2.5 right-2.5 z-20 flex items-center gap-1 bg-white/95 px-2.5 py-0.5 rounded-full border border-neutral-200 text-[10px] font-semibold text-neutral-800 backdrop-blur-md shadow-xs">
                        <span>{displayName.toLowerCase()}</span>
                        {isHost && <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[8px] px-1 rounded font-bold uppercase">HOST</span>}
                      </div>
                    </div>
                  ) : (
                    /* 4. Other Participants: Avatar & Audio Waveform */
                    <div className="relative z-10 flex flex-col items-center justify-center p-3">
                      {/* Pulse rings when speaking */}
                      <div className="relative">
                        {isSpeaker && (
                          <div className="absolute -inset-2 rounded-full border-2 border-purple-400/60 animate-ping opacity-75" />
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDirectChat(user);
                          }}
                          className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center font-bold text-xl sm:text-2xl shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                            isSpeaker ? 'scale-105 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white ring-2 ring-purple-400' : 'bg-purple-100 text-purple-700 border border-purple-200 hover:border-purple-400'
                          }`}
                          title={`Click to direct chat with ${displayName}`}
                        >
                          {displayName[0]?.toUpperCase()}
                        </button>
                      </div>

                      {/* Participant name pill: lowercase and small font */}
                      <div
                        id={`user-name-pill-${user.replace(/\s+/g, '-').toLowerCase()}`}
                        className="mt-2.5 flex items-center gap-1.5 bg-white/95 px-2.5 py-0.5 rounded-full border border-neutral-200 shadow-xs"
                      >
                        <span className="text-[11px] font-semibold text-neutral-800 tracking-normal">
                          {displayName.toLowerCase()}
                        </span>
                        {isHost && (
                          <span className="text-[9px] bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-1 py-0.2 rounded font-semibold uppercase">
                            HOST
                          </span>
                        )}
                      </div>

                      {/* Waveform Equalizer when speaking */}
                      <div className="mt-2 flex items-center gap-1 h-3">
                        <span className={`w-0.5 bg-purple-600 rounded-full transition-all ${isSpeaker ? 'h-3 animate-pulse' : 'h-1 opacity-30 bg-neutral-300'}`} />
                        <span className={`w-0.5 bg-purple-500 rounded-full transition-all ${isSpeaker ? 'h-4 animate-bounce' : 'h-1 opacity-30 bg-neutral-300'}`} />
                        <span className={`w-0.5 bg-purple-600 rounded-full transition-all ${isSpeaker ? 'h-2 animate-pulse' : 'h-1 opacity-30 bg-neutral-300'}`} />
                        <span className={`w-0.5 bg-purple-500 rounded-full transition-all ${isSpeaker ? 'h-3.5 animate-bounce' : 'h-1 opacity-30 bg-neutral-300'}`} />
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
                      className="absolute bottom-11 left-2 right-2 z-20 p-2.5 rounded-xl bg-white/95 backdrop-blur-md border border-purple-200 text-neutral-900 shadow-lg animate-in fade-in slide-in-from-bottom-1 pointer-events-none"
                    >
                      <div className="flex items-center justify-between text-[9px] text-purple-700 font-semibold mb-0.5">
                        <span className="flex items-center gap-1">
                          <Volume2 className="w-2.5 h-2.5 text-purple-600 animate-pulse" />
                          {user} ({settings.subtitleLanguage || 'Myanmar (MM)'})
                        </span>
                        <span className="text-[8px] bg-purple-50 text-purple-700 border border-purple-200 px-1 py-0.2 rounded font-mono font-semibold">
                          SUBTITLE LIVE
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-800 font-medium leading-tight italic line-clamp-2">
                        "{userSubtitleText}"
                      </p>
                    </div>
                  )}

                  {/* Corner Controls: Differentiated between "Me" and "Other Users" */}
                  {isMe ? (
                    /* For Me: LIVE + My Mic Toggle + My Subtitle Toggle + My Cam Toggle (Directly toggleable from screen tile) */
                    <div className="absolute bottom-2 left-2 z-20 flex items-center gap-1.5">
                      <div className="hidden sm:flex items-center gap-1 bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-full border border-neutral-200 text-[9px] text-purple-700 font-bold shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse" />
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
                        className={`p-1.5 rounded-full backdrop-blur-md border transition cursor-pointer active:scale-90 flex items-center justify-center shadow-xs ${
                          isMicOn
                            ? 'bg-purple-50 text-purple-600 border-purple-300'
                            : 'bg-red-50 text-red-600 border-red-200'
                        }`}
                        title={isMicOn ? 'My Mic ON - Click to Mute (မိမိအသံပိတ်ရန်)' : 'My Mic MUTED - Click to Unmute (မိမိအသံဖွင့်ရန်)'}
                      >
                        {isMicOn ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                      </button>

                      {/* 2. React Button for Myself (Replaces Subtitle) */}
                      <div className="relative">
                        <button
                          id="btn-my-tile-react"
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setReactingTargetUser((prev) => (prev === 'me' ? null : 'me'));
                          }}
                          className={`p-1.5 rounded-full backdrop-blur-md border transition cursor-pointer active:scale-90 flex items-center justify-center shadow-xs ${
                            reactingTargetUser === 'me'
                              ? 'bg-purple-600 text-white border-purple-600'
                              : isHandRaised
                              ? 'bg-purple-50 text-purple-600 border-purple-300 ring-2 ring-purple-400/40'
                              : 'bg-white/95 text-purple-600 border-neutral-200 hover:bg-purple-50'
                          }`}
                          title="React & Raise Hand (Reactions ပေးရန်)"
                        >
                          {isHandRaised ? <Hand className="w-3.5 h-3.5" /> : <Smile className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      {/* 3. Cam Toggle right next to React - Toggles live camera directly from user tile! */}
                      <button
                        id="btn-my-tile-cam"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleCamera();
                        }}
                        className={`p-1.5 rounded-full backdrop-blur-md border transition cursor-pointer active:scale-90 flex items-center justify-center shadow-xs ${
                          isCameraOn
                            ? 'bg-purple-50 text-purple-600 border-purple-300'
                            : 'bg-red-50 text-red-600 border-red-200'
                        }`}
                        title={isCameraOn ? 'My Camera ON - Click to Turn Off (Camera ပိတ်မည်)' : 'My Camera OFF - Click to Turn On (Camera ဖွင့်မည်)'}
                      >
                        {isCameraOn ? <VideoIcon className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  ) : (
                    /* For Other Participants: ONLY Chat icon and React icon! NO text labels */
                    <div className="absolute bottom-2 left-2 z-20 flex items-center gap-1.5">
                      {/* 1. Chat icon only */}
                      <button
                        id={`btn-tile-chat-${user.replace(/\s+/g, '-').toLowerCase()}`}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDirectChat(user);
                        }}
                        className="p-1.5 rounded-full bg-white/95 hover:bg-purple-50 active:scale-90 text-purple-600 border border-neutral-200 shadow-xs backdrop-blur-md transition cursor-pointer flex items-center justify-center group"
                        title={`Chat with ${user}`}
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-purple-600 transition" />
                      </button>

                      {/* 2. React icon for this participant (Replaces Poke) */}
                      <div>
                        <button
                          id={`btn-tile-react-${user.replace(/\s+/g, '-').toLowerCase()}`}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setReactingTargetUser((prev) => (prev === user ? null : user));
                          }}
                          className={`p-1.5 rounded-full border shadow-xs backdrop-blur-md transition cursor-pointer flex items-center justify-center active:scale-90 ${
                            reactingTargetUser === user
                              ? 'bg-purple-600 text-white border-purple-600'
                              : 'bg-white/95 hover:bg-purple-50 text-purple-600 border-neutral-200'
                          }`}
                          title={`React to ${user}`}
                        >
                          <Smile className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Mini Reactions Popover for Myself: Auto-adjusted to half of camera tile width with up/down vertical scroll */}
                  {isMe && reactingTargetUser === 'me' && (
                    <div
                      id="popover-emoji-me"
                      className="absolute bottom-11 left-2 z-40 w-[50%] min-w-[135px] max-w-[195px] animate-in zoom-in-90 duration-150"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <RichEmojiPicker
                        compact={true}
                        onSelectEmoji={(emoji) => {
                          handleSelectReaction(emoji);
                          setReactingTargetUser(null);
                        }}
                        onClose={() => setReactingTargetUser(null)}
                        showRaiseHand={true}
                        isHandRaised={isHandRaised}
                        onToggleRaiseHand={() => {
                          handleToggleRaiseHand();
                          setReactingTargetUser(null);
                        }}
                        title="Reactions"
                      />
                    </div>
                  )}

                  {/* Mini Reactions Popover for Other Participants: Auto-adjusted to half of camera tile width with up/down vertical scroll */}
                  {!isMe && reactingTargetUser === user && (
                    <div
                      id={`popover-emoji-${user.replace(/\s+/g, '-').toLowerCase()}`}
                      className="absolute bottom-11 left-2 z-40 w-[50%] min-w-[135px] max-w-[195px] animate-in zoom-in-90 duration-150"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <RichEmojiPicker
                        compact={true}
                        onSelectEmoji={(emoji) => {
                          handleReactToUser(user, emoji);
                          setReactingTargetUser(null);
                        }}
                        onClose={() => setReactingTargetUser(null)}
                        title={`React to ${displayName}`}
                      />
                    </div>
                  )}

                  {/* Live Floating Reactions within this participant's camera box */}
                  <div className="absolute inset-x-0 bottom-3 top-0 pointer-events-none z-30 overflow-hidden flex justify-center items-end">
                    {floatingReactions
                      .filter((r) => isReactionForParticipant(r.sender, user, isMe, displayName))
                      .map((r) => (
                        <div
                          key={r.id}
                          className="absolute bottom-2 animate-float-emoji drop-shadow-md select-none pointer-events-none"
                          style={{
                            left: `calc(50% + ${r.x}px)`,
                            fontSize: `${r.size || 28}px`,
                          }}
                        >
                          {r.emoji}
                        </div>
                      ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. TOP OVERLAY: Home Button + Search Bar + Recording Button */}
      <div className="relative z-30 pt-3 px-3 flex items-center justify-between gap-2 pointer-events-auto">
        {onBackToHome && (
          <button
            id="btn-meeting-back-home"
            type="button"
            onClick={onBackToHome}
            className="p-2 rounded-full bg-white/95 hover:bg-neutral-100 border border-neutral-200 text-purple-600 hover:text-purple-700 transition shadow-xs cursor-pointer shrink-0"
            title="Back to Home Screen"
          >
            <Home className="w-4 h-4 text-purple-600" />
          </button>
        )}

        {/* Search Bar Between Home and Record (Clean box with @ symbol, searches in-meeting & network users) */}
        <div ref={meetingSearchContainerRef} className="relative flex-1 min-w-0 z-40">
          <div
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md border transition-all duration-150 shadow-xs ${
              isMeetingSearchFocused
                ? 'border-purple-500 ring-2 ring-purple-500/20 bg-white'
                : 'border-neutral-200 hover:border-neutral-300'
            }`}
          >
            {/* @ Symbol Badge */}
            <div className="w-6 h-6 rounded-full bg-purple-50 border border-purple-200/80 text-purple-600 flex items-center justify-center shrink-0 font-bold text-xs font-mono select-none">
              @
            </div>

            {/* Input without outer texts/labels */}
            <input
              id="input-meeting-search-users"
              type="text"
              value={meetingSearchQuery}
              onChange={(e) => setMeetingSearchQuery(e.target.value)}
              onFocus={() => setIsMeetingSearchFocused(true)}
              placeholder="@"
              className="w-full bg-transparent text-xs text-neutral-900 placeholder-neutral-400 focus:outline-hidden font-medium"
              autoComplete="off"
              spellCheck="false"
            />

            {/* Clear Button or Search Icon */}
            {meetingSearchQuery ? (
              <button
                type="button"
                onClick={() => setMeetingSearchQuery('')}
                className="w-5 h-5 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 flex items-center justify-center transition cursor-pointer shrink-0"
                title="Clear"
              >
                <X className="w-3 h-3" />
              </button>
            ) : (
              <Search className="w-3.5 h-3.5 text-neutral-400 shrink-0 mr-0.5" />
            )}
          </div>

          {/* Search Dropdown Results Popover */}
          {isMeetingSearchFocused && (
            <div
              id="meeting-search-users-dropdown"
              className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-neutral-200 shadow-2xl overflow-hidden z-50 max-h-72 flex flex-col animate-in fade-in slide-in-from-top-1 duration-150"
            >
              {/* Header inside dropdown */}
              <div className="px-3 py-2 bg-neutral-50/90 border-b border-neutral-200 flex items-center justify-between text-xs">
                <span className="font-bold text-neutral-700 flex items-center gap-1.5 text-[11px]">
                  <Search className="w-3 h-3 text-purple-600" />
                  {meetingSearchQuery.trim()
                    ? `Users matching "${meetingSearchQuery}"`
                    : `Participants & Users (${filteredMeetingUsers.length})`}
                </span>
                <button
                  type="button"
                  onClick={() => setIsMeetingSearchFocused(false)}
                  className="text-neutral-400 hover:text-neutral-700 p-0.5 rounded-md hover:bg-neutral-200/50 transition cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              {/* Users list */}
              <div className="overflow-y-auto divide-y divide-neutral-100 flex-1 p-1 max-h-56">
                {filteredMeetingUsers.length > 0 ? (
                  filteredMeetingUsers.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleSelectMeetingUser(user)}
                      className="w-full p-2 rounded-xl hover:bg-purple-50/70 transition flex items-center justify-between text-left group cursor-pointer"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {/* Avatar */}
                        <div className="relative w-8 h-8 rounded-full shrink-0 p-0.5 bg-gradient-to-tr from-purple-500 to-indigo-500 shadow-2xs">
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-full h-full rounded-full object-cover bg-neutral-100"
                          />
                          {user.isInMeeting && (
                            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
                          )}
                        </div>

                        {/* Name & details */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="font-bold text-xs text-neutral-900 group-hover:text-purple-600 transition truncate max-w-[90px] sm:max-w-[130px]">
                              {user.name}
                            </span>
                            <span className="font-mono text-[10px] text-purple-700 bg-purple-50 px-1 py-0.2 rounded-md font-semibold border border-purple-200/60">
                              {user.handle}
                            </span>
                            {user.isInMeeting && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold flex items-center gap-0.5">
                                <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                In Meeting
                              </span>
                            )}
                            {user.id === 'usr_me' && (
                              <span className="text-[9px] px-1 py-0.2 rounded-full bg-purple-100 text-purple-700 font-bold">
                                You
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-neutral-500 truncate max-w-[170px] sm:max-w-xs mt-0.5">
                            {user.bio}
                          </p>
                        </div>
                      </div>

                      {/* Right indicator button */}
                      <div className="flex items-center gap-1 text-purple-600 shrink-0 ml-1 group-hover:translate-x-0.5 transition-transform">
                        <span className="text-[10px] font-bold text-purple-700 bg-purple-100/60 px-1.5 py-0.5 rounded-md border border-purple-200 group-hover:bg-purple-600 group-hover:text-white transition">
                          Profile
                        </span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="py-5 px-3 text-center">
                    <p className="text-xs text-neutral-500">No matching users found</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Recording Button: On/Off toggle -> Only records when ON */}
        <button
          id="btn-toggle-recording"
          type="button"
          onClick={handleToggleRecording}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition shadow-xs shrink-0 cursor-pointer ${
            isLocalRecording
              ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse border border-red-400 shadow-red-200'
              : 'bg-white/95 hover:bg-neutral-100 text-neutral-700 border border-neutral-200'
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

      {/* 3. RIGHT OVERLAY: Action Buttons (Participants, Share, Notes, Comments, Love, Leave) */}
      <div className="absolute right-3 bottom-24 z-30 flex flex-col items-center gap-2.5">
        {/* Participants Button (Above Share with accurate live count) */}
        <button
          id="btn-tile-participants"
          type="button"
          onClick={() => setIsParticipantsDrawerOpen(true)}
          className="flex flex-col items-center group cursor-pointer"
          title={`Participants (${liveParticipantCount} Live)`}
        >
          <div className="w-11 h-11 rounded-full bg-white/95 text-purple-600 border border-neutral-200 hover:bg-purple-50 flex items-center justify-center backdrop-blur-md transition hover:scale-105 active:scale-95 shadow-xs relative">
            <Users className="w-5 h-5 text-purple-600" />
            <span className="absolute -top-1 -right-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold shadow-xs">
              {liveParticipantCount}
            </span>
          </div>
          <span className="text-[10px] font-semibold text-neutral-800 mt-0.5 drop-shadow-xs">
            {liveParticipantCount}
          </span>
        </button>

        {/* Share Button (Screen Share & Meeting Link) */}
        <div className="relative flex flex-col items-center">
          <button
            id="btn-tile-share"
            type="button"
            onClick={() => setIsSideShareMenuOpen((prev) => !prev)}
            className="flex flex-col items-center group cursor-pointer"
            title="Share Options (Screen Share & Link)"
          >
            <div className={`w-11 h-11 rounded-full border flex items-center justify-center backdrop-blur-md transition shadow-xs hover:scale-105 active:scale-95 ${
              isScreenSharing
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-purple-400 animate-pulse'
                : 'bg-white/95 text-purple-600 hover:bg-purple-50 border-neutral-200'
            }`}>
              <Share2 className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-semibold text-neutral-800 mt-0.5 drop-shadow-xs">
              {isScreenSharing ? 'Sharing' : 'Share'}
            </span>
          </button>

          {/* Share Dropdown / Popover Menu */}
          {isSideShareMenuOpen && (
            <div className="absolute right-14 top-0 z-50 w-52 bg-white/95 backdrop-blur-md border border-purple-200 rounded-2xl shadow-xl p-2 animate-in fade-in zoom-in-95 duration-150">
              <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-2 py-1 mb-1">
                Share Options
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsSideShareMenuOpen(false);
                  if (isScreenSharing) {
                    handleStopScreenShare();
                  } else {
                    handleStartScreenShare();
                  }
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer mb-1 ${
                  isScreenSharing
                    ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                    : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                }`}
              >
                <Share2 className="w-4 h-4 shrink-0" />
                <span>{isScreenSharing ? 'Stop Screen Share' : 'Share Screen (မျက်နှာပြင်)'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSideShareMenuOpen(false);
                  const shareUrl = `${window.location.origin}/#${room.token}`;
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(shareUrl).catch(() => {});
                  }
                  setToastMessage(`🔗 Meeting link copied! (${room.token})`);
                  setTimeout(() => setToastMessage(null), 2500);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-neutral-700 hover:bg-neutral-100 transition cursor-pointer"
              >
                <Link2 className="w-4 h-4 shrink-0 text-neutral-500" />
                <span>Copy Meeting Link</span>
              </button>
            </div>
          )}
        </div>

        {/* Note Pad */}
        <button
          id="btn-tile-notes"
          type="button"
          onClick={() => setIsNotesOpen(true)}
          className="flex flex-col items-center group cursor-pointer"
          title="Meeting Notes Pad"
        >
          <div className="w-11 h-11 rounded-full bg-white/95 text-amber-600 border border-neutral-200 hover:bg-amber-50 flex items-center justify-center backdrop-blur-md transition hover:scale-105 shadow-xs relative">
            <NotebookTabs className="w-5 h-5" />
            {roomNotesCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-white font-bold text-[9px] shadow-xs">
                {roomNotesCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-semibold text-neutral-800 mt-0.5 drop-shadow-xs">
            Note
          </span>
        </button>

        {/* Comment Button */}
        <button
          id="btn-tile-comments"
          type="button"
          onClick={() => setIsCommentsOpen(true)}
          className="flex flex-col items-center group cursor-pointer"
          title="Meeting Comments"
        >
          <div className="w-11 h-11 rounded-full bg-white/95 text-purple-600 border border-neutral-200 hover:bg-purple-50 flex items-center justify-center backdrop-blur-md transition shadow-xs hover:scale-105 active:scale-95 relative">
            <MessageCircle className="w-5 h-5" />
            {roomTotalCommentsCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-red-500 text-white font-bold text-[9px] shadow-xs">
                {roomTotalCommentsCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-semibold text-neutral-800 mt-0.5 drop-shadow-xs">
            {roomTotalCommentsCount}
          </span>
        </button>

        {/* Heart / Love Reaction (Like Meeting) */}
        <button
          id="btn-tile-heart"
          type="button"
          onClick={(e) => handleTriggerHeart(e)}
          className="flex flex-col items-center group cursor-pointer"
          title="Like Meeting"
        >
          <div className="w-11 h-11 rounded-full bg-white/95 text-red-500 hover:bg-red-50 hover:scale-110 border border-neutral-200 flex items-center justify-center backdrop-blur-md transition active:scale-95 shadow-xs">
            <Heart className="w-5 h-5 fill-red-500" />
          </div>
          <span className="text-[10px] font-semibold text-neutral-800 mt-0.5 drop-shadow-xs">{likeCount}</span>
        </button>

        {/* Leave Button (Under Love Reaction) */}
        <button
          id="btn-tile-leave"
          type="button"
          onClick={() => setShowEndMeetingDialog(true)}
          className="flex flex-col items-center group cursor-pointer"
          title="Leave Meeting"
        >
          <div className="w-11 h-11 rounded-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 flex items-center justify-center backdrop-blur-md transition hover:scale-105 active:scale-95 shadow-xs">
            <PhoneOff className="w-5 h-5 text-red-600" />
          </div>
          <span className="text-[10px] font-bold text-red-600 mt-0.5 drop-shadow-xs">Leave</span>
        </button>
      </div>

      {/* 4. BOTTOM OVERLAY: Speaker Role Toggle */}
      <div className="relative z-30 p-3 pb-2 pointer-events-auto">
        <button
          id="btn-toggle-speaker-role"
          type="button"
          onClick={() => handleSelectRole(userRole === 'speaker' ? 'listener' : 'speaker')}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold transition cursor-pointer border backdrop-blur-md shadow-xs active:scale-95 ${
            userRole === 'speaker'
              ? 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-300'
              : 'bg-white/95 hover:bg-neutral-100 text-neutral-700 border-neutral-200'
          }`}
          title={userRole === 'speaker' ? 'Speaker: ON (Click to turn OFF / Listener)' : 'Speaker: OFF (Click to turn ON / Speak)'}
        >
          <span
            className={`w-2 h-2 rounded-full transition-colors ${
              userRole === 'speaker' ? 'bg-purple-600 animate-pulse' : 'bg-neutral-400'
            }`}
          />
          <span>Speaker</span>
          <span
            className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase ${
              userRole === 'speaker'
                ? 'bg-purple-600 text-white'
                : 'bg-neutral-200 text-neutral-600'
            }`}
          >
            {userRole === 'speaker' ? 'ON' : 'OFF'}
          </span>
        </button>
      </div>



      {/* End / Leave Meeting Confirmation Dialog */}
      {showEndMeetingDialog && (
        <div
          id="zoom-end-meeting-dialog-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={() => setShowEndMeetingDialog(false)}
        >
          <div
            id="zoom-end-meeting-dialog"
            className="w-full max-w-sm bg-white border border-neutral-200 rounded-2xl p-5 text-neutral-900 shadow-2xl space-y-4 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center space-y-1">
              <h3 className="font-bold text-base text-neutral-900">
                {isHostMe ? 'End Meeting for All?' : 'Leave Meeting?'}
              </h3>
              <p className="text-xs text-neutral-600">
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
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition cursor-pointer"
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
                className="w-full py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-semibold text-xs transition cursor-pointer"
              >
                Leave Meeting
              </button>

              <button
                id="btn-leave-meeting-cancel"
                type="button"
                onClick={() => setShowEndMeetingDialog(false)}
                className="w-full py-2 rounded-xl text-neutral-500 hover:text-neutral-800 text-xs font-medium transition cursor-pointer"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={() => setIsEditMeetingModalOpen(false)}
        >
          <div
            id="edit-meeting-modal-container"
            className="w-full max-w-sm bg-white border border-neutral-200 rounded-2xl p-5 text-neutral-900 shadow-2xl animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-purple-600" />
                <h3 className="font-bold text-sm text-neutral-900">Edit Meeting Details</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditMeetingModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded-full hover:bg-neutral-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMeetingDetails} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs text-neutral-600 mb-1">Meeting Token / #</label>
                <input
                  type="text"
                  required
                  value={editToken}
                  onChange={(e) => setEditToken(e.target.value)}
                  placeholder="#MEET-9021"
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-xs text-neutral-900 focus:bg-white focus:border-purple-600 outline-none font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-600 mb-1">Meeting Title / Topic</label>
                <textarea
                  rows={3}
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Enter meeting topic..."
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl p-2.5 text-xs text-neutral-900 focus:bg-white focus:border-purple-600 outline-none resize-none leading-relaxed"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditMeetingModalOpen(false)}
                  className="flex-1 py-2 rounded-xl text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 text-xs font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn-save-meeting-details"
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold transition shadow-md shadow-indigo-500/20 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Privacy Selection Modal */}
      {isRecordModalOpen && (
        <div
          id="record-privacy-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setIsRecordModalOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-neutral-200 animate-in zoom-in-95 duration-200 flex flex-col gap-4 text-neutral-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                  <span className="w-3 h-3 rounded-full bg-red-600 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">Record Meeting</h3>
                  <p className="text-[11px] text-neutral-500">မှတ်တမ်းတင်မှု သတ်မှတ်ချက် ({room.token})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRecordModalOpen(false)}
                className="p-1 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-2.5">
              <p className="text-xs text-neutral-600 font-medium">
                Choose visibility for this recording:
              </p>

              {/* Public Choice */}
              <div
                onClick={() => setRecordingVisibility('public')}
                className={`p-3 rounded-2xl border transition cursor-pointer flex items-start gap-3 ${
                  recordingVisibility === 'public'
                    ? 'bg-purple-50/80 border-purple-500 ring-2 ring-purple-500/20'
                    : 'bg-neutral-50 border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <div className={`p-2 rounded-xl mt-0.5 ${recordingVisibility === 'public' ? 'bg-purple-600 text-white' : 'bg-neutral-200 text-neutral-600'}`}>
                  <Globe className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-900">Public (အများမြင်)</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">Recommended</span>
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-0.5 leading-snug">
                    Saved to your profile publicly. Anyone can watch, like, repost, and comment.
                  </p>
                </div>
              </div>

              {/* Private Choice */}
              <div
                onClick={() => setRecordingVisibility('private')}
                className={`p-3 rounded-2xl border transition cursor-pointer flex items-start gap-3 ${
                  recordingVisibility === 'private'
                    ? 'bg-purple-50/80 border-purple-500 ring-2 ring-purple-500/20'
                    : 'bg-neutral-50 border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <div className={`p-2 rounded-xl mt-0.5 ${recordingVisibility === 'private' ? 'bg-purple-600 text-white' : 'bg-neutral-200 text-neutral-600'}`}>
                  <Lock className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-900">Private (ကိုယ်ပဲမြင်နိုင်)</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-neutral-200 text-neutral-700 font-medium">Only You</span>
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-0.5 leading-snug">
                    Visible only to you. Hidden when visitors view your profile.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsRecordModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-start-recording"
                onClick={() => handleConfirmStartRecording(recordingVisibility)}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold transition shadow-md shadow-red-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                <span>Start Recording</span>
              </button>
            </div>
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
