import {
  MeetingRoom,
  MeetingNote,
  PostItem,
  ChatMessage,
  UserProfile,
  UserSettings,
  MeetingRecording,
  MeetingComment,
  ScheduledMeeting,
  DateNote
} from '../types';

export const initialUserProfile: UserProfile = {
  name: 'Aung Myint',
  handle: '@aungmyint',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face',
  bio: 'WebRTC Live Audio/Video Meeting System',
  following: 0,
  followers: '0',
  likes: '0',
};

export const initialSettings: UserSettings = {
  autoMuteMic: false,
  turnOffVideoOnJoin: false,
  showNonVideoParticipants: true,
  hdVideo: true,
  mirrorMyVideo: false,
  noiseSuppression: true,
  enableVirtualBackground: false,
  virtualBackgroundType: 'office',
  chatFilter: 'all',
  subtitleLanguage: 'Myanmar (MM)',
  whisperLanguage: 'Myanmar (MM)',
};

export const languageOptions = [
  { code: 'my', name: 'Myanmar (MM)', flag: '🇲🇲' },
  { code: 'en', name: 'English (US)', flag: '🇺🇸' },
  { code: 'th', name: 'Thai (TH)', flag: '🇹🇭' },
  { code: 'ja', name: 'Japanese (JA)', flag: '🇯🇵' },
  { code: 'zh', name: 'Chinese (ZH)', flag: '🇨🇳' },
];

export const virtualBackgroundPresets = [
  {
    id: 'office',
    name: 'Modern Office',
    url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1280&h=720&fit=crop',
  },
  {
    id: 'minimalist',
    name: 'Minimal Living',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1280&h=720&fit=crop',
  },
  {
    id: 'library',
    name: 'Studio Bookshelf',
    url: 'https://images.unsplash.com/photo-1507842229452-772d1c324391?w=1280&h=720&fit=crop',
  },
  {
    id: 'cafe',
    name: 'Cosy Coffee',
    url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1280&h=720&fit=crop',
  },
  {
    id: 'nature',
    name: 'Green Nature',
    url: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=1280&h=720&fit=crop',
  },
];

// All user-facing sample meeting/notes/recordings/chats are blank as requested
export const initialRecordings: MeetingRecording[] = [];

export const initialMeetingNotes: MeetingNote[] = [];

export const initialRooms: MeetingRoom[] = [];

export const initialPosts: PostItem[] = [];

export const initialChats: ChatMessage[] = [];

export const initialMeetingComments: Record<string, MeetingComment[]> = {};

export const initialScheduledMeetings: ScheduledMeeting[] = [];

export const initialDateNotes: DateNote[] = [];
