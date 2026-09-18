export interface MeetingRoom {
  id: string;
  token: string; // e.g., #MEET-9021
  title: string;
  host: string;
  participants: string[];
  keyPoints: string[];
  category?: string;
  isLive?: boolean;
  isLocked?: boolean;
  isWaitingRoomEnabled?: boolean;
  allowShareScreen?: boolean;
  allowChat?: boolean;
}

export interface ParticipantState {
  name: string;
  role: 'host' | 'co-host' | 'participant';
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  isHandRaised: boolean;
  avatar?: string;
}

export interface MeetingNote {
  id: string;
  meetingToken: string;
  meetingTitle: string;
  title: string;
  category?: 'Decisions' | 'Action Items' | 'Tech Insights' | 'Summary' | 'General';
  content?: string;
  keyPoints: string[];
  speaker?: string;
  timestamp: string;
  tags?: string[];
  author?: string;
}

export interface PostComment {
  id: string;
  author: string;
  avatar?: string;
  content: string;
  timestamp: string;
  likes?: number;
  isLiked?: boolean;
}

export interface PostItem {
  id: string;
  meetingToken: string;
  author: string;
  avatar?: string;
  handle?: string;
  content: string;
  timestamp: string;
  likes?: number;
  isLiked?: boolean;
  replies?: number;
  reposts?: number;
  isReposted?: boolean;
  visibility?: 'public' | 'private';
  repostedByUser?: string;
  comments?: PostComment[];
  isShort?: boolean;
  videoUrl?: string;
  videoDuration?: string;
  title?: string;
  isBookmarked?: boolean;
  groupId?: string;
  groupName?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  quotedPost?: {
    id: string;
    meetingToken?: string;
    author: string;
    avatar?: string;
    handle?: string;
    content: string;
    timestamp: string;
    mediaUrl?: string;
    mediaType?: 'image' | 'video';
  };
}

export interface FacebookGroup {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  avatar: string;
  category: string;
  privacy: 'public' | 'private';
  requiresApproval?: boolean;
  requireApproval?: boolean;
  admin: string;
  members: string[];
  pendingRequests: string[];
  chatTheme?: 'default' | 'ocean' | 'berry' | 'sunset' | 'emerald';
  theme?: string;
  createdAt: string;
  linkedMeetingToken?: string;
}

export interface GroupChatMessage {
  id: string;
  groupId: string;
  sender: string;
  senderAvatar?: string;
  message?: string;
  text?: string;
  time?: string;
  timestamp?: string;
  isMe?: boolean;
  reactions?: Record<string, string[]>;
  mediaUrl?: string;
}

export interface ShortVideoItem {
  id: string;
  meetingToken: string;
  meetingTitle?: string;
  title: string;
  author: string;
  handle: string;
  avatar: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration: number; // in seconds (e.g. 30)
  tags: string[];
  likes: number;
  isLiked: boolean;
  reposts: number;
  isReposted: boolean;
  repostedByUser?: string;
  commentsCount: number;
  comments: PostComment[];
  isBookmarked: boolean;
  timestamp: string;
  musicTrack?: string;
  liveParticipantsCount?: number;
  visibility?: 'public' | 'private';
  hasActiveMeeting?: boolean;
}

export interface ChatMessage {
  id: string;
  meetingToken: string;
  sender: string;
  message: string;
  time: string;
  isMe?: boolean;
  recipient?: string; // If 1-on-1 direct chat, target username (e.g. 'Kyaw Kyaw')
  isDirect?: boolean; // True if private 1-on-1 message
  avatar?: string;
}

export type AvatarMaskId = string;

export interface AvatarPreset {
  id: string;
  name: string;
  nameMm?: string;
  category?: string;
  emoji: string;
  description?: string;
  badge?: string;
  primaryColor: string;
  secondaryColor?: string;
  accentColor?: string;
  glowColor?: string;
}

export interface FaceTrackingState {
  faceDetected: boolean;
  x: number; // 0..1 normalized center X
  y: number; // 0..1 normalized center Y
  width: number; // 0..1 normalized width
  height: number; // 0..1 normalized height
  roll: number; // angle in radians (head tilt left/right)
  pitch: number; // angle in radians (nod up/down)
  yaw: number; // angle in radians (turn left/right)
  mouthOpen: number; // 0 (closed) to 1 (wide open)
  mouthSmile: number; // 0 (neutral) to 1 (smile)
  leftEyeBlink: number; // 0 (open) to 1 (closed)
  rightEyeBlink: number; // 0 (open) to 1 (closed)
  isTalking: boolean;
  audioVolume: number; // 0 to 1
}

export interface UserSettings {
  autoMuteMic: boolean;
  turnOffVideoOnJoin: boolean;
  showNonVideoParticipants: boolean;
  hdVideo: boolean;
  mirrorMyVideo: boolean;
  noiseSuppression: boolean;
  enableVirtualBackground: boolean;
  virtualBackgroundType: 'studio' | 'blur' | 'cyberpunk' | 'office' | 'library' | 'custom';
  virtualBackgroundCustomImage?: string;
  // Avatar Face Mask settings
  enableAvatarMask?: boolean;
  selectedAvatarId?: AvatarMaskId;
  avatarMaskMode?: 'mask_overlay' | 'full_avatar';
  chatFilter: 'all' | 'token';
  subtitleLanguage?: string;
  whisperLanguage?: string; // Kept for backwards compatibility
  lockMeetingByDefault?: boolean;
  waitingRoomByDefault?: boolean;
  allowParticipantScreenShare?: boolean;
  allowParticipantChat?: boolean;
  allowParticipantRename?: boolean;
  allowParticipantUnmute?: boolean;
}

export interface SocialUser {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  bio: string;
  isFollowedByMe: boolean;
  isFollowingMe: boolean;
  followersCount: number;
  followingCount: number;
  isOnline?: boolean;
  activeRoomToken?: string;
  lastActive?: string;
}

export interface UserProfile {
  name: string;
  handle: string;
  avatar: string;
  bio: string;
  following: number;
  followers: string | number;
  likes: string | number;
  followingUserIds?: string[];
  followerUserIds?: string[];
}

export interface ChatSubtitleLine {
  id: string;
  speaker: string;
  avatar?: string;
  time: string;
  textByLang: Record<string, string>;
  isMe?: boolean;
  tag?: string;
}

export type LanguageOption = 'Myanmar (MM)' | 'English (US)' | 'Thai (TH)' | 'Japanese (JA)' | 'Chinese (ZH)';

export interface MeetingRecording {
  id: string;
  meetingToken: string;
  meetingTitle: string;
  title: string;
  date: string;
  duration: string;
  views: number;
  likes: number;
  isLiked?: boolean;
  isFavorited: boolean;
  isUserRecorded?: boolean;
  thumbnailUrl: string;
  participants: string[];
  subtitles: ChatSubtitleLine[];
  notes?: string[];
  visibility?: 'public' | 'private';
  reposts?: number;
  isReposted?: boolean;
  repostedByUser?: string;
  commentsCount?: number;
  comments?: PostComment[];
  author?: string;
}

export interface CommentReply {
  id: string;
  author: string;
  handle?: string;
  avatar: string;
  text: string;
  time: string;
  likes: number;
  isLiked?: boolean;
  replyToUser?: string;
  isMe?: boolean;
}

export interface MeetingComment {
  id: string;
  meetingToken: string;
  author: string;
  handle?: string;
  avatar: string;
  text: string;
  time: string;
  likes: number;
  isLiked?: boolean;
  isHost?: boolean;
  isMe?: boolean;
  replies?: CommentReply[];
}

export interface ScheduledMeeting {
  id: string;
  token: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // e.g. "10:00 AM"
  duration: string; // e.g. "30 mins"
  host: string;
  description?: string;
  category?: string;
  participants: string[];
}

export interface DateNote {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  content: string;
  category: string;
  time: string;
}

export type TabType = 'home' | 'shorts' | 'meetings' | 'posts' | 'chat' | 'settings' | 'profile';

