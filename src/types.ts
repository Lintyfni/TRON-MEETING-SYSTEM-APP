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

export type TabType = 'home' | 'meetings' | 'posts' | 'chat' | 'settings' | 'profile';

