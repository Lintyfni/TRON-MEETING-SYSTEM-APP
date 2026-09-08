export interface MeetingRoom {
  id: string;
  token: string; // e.g., #MEET-9021
  title: string;
  host: string;
  participants: string[];
  keyPoints: string[];
  category?: string;
  isLive?: boolean;
}

export interface GranolaTranscriptLine {
  id: string;
  speaker: string;
  timestamp: string;
  text: string;
  sentiment?: 'key-insight' | 'decision' | 'action' | 'normal';
}

export interface GranolaActionItem {
  id: string;
  task: string;
  assignee: string;
  status: 'todo' | 'completed';
}

export interface MeetingNote {
  id: string;
  meetingToken: string;
  meetingTitle: string;
  title: string;
  category: 'Decisions' | 'Action Items' | 'Tech Insights' | 'Summary';
  keyPoints: string[];
  whisperSTTQuote?: string;
  speaker?: string;
  timestamp: string;
  tags?: string[];
  // Granola Engine AI Features
  granolaSummary?: string;
  transcriptHistory?: GranolaTranscriptLine[];
  keyDecisions?: string[];
  actionItems?: GranolaActionItem[];
  granolaEngineStatus?: 'Listening' | 'Synthesized' | 'Live';
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
  virtualBackgroundType: 'studio' | 'blur' | 'cyberpunk' | 'office';
  chatFilter: 'all' | 'token';
  whisperLanguage: string;
}

export interface UserProfile {
  name: string;
  handle: string;
  avatar: string;
  bio: string;
  following: number;
  followers: string;
  likes: string;
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
  isFavorited: boolean;
  isUserRecorded?: boolean;
  thumbnailUrl: string;
  participants: string[];
  subtitles: ChatSubtitleLine[];
  notes?: string[];
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

export type TabType = 'meetings' | 'posts' | 'chat' | 'settings' | 'profile';
