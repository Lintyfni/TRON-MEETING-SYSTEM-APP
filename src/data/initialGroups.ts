import { CooMGroup, GroupChatMessage } from '../types';

export const initialGroups: CooMGroup[] = [
  {
    id: 'grp_webrtc_devs',
    name: 'Myanmar WebRTC & Live Streamers 🎥',
    description: 'A community for developers and creators building real-time video audio apps, low-latency live streaming, and interactive room tech.',
    coverImage: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&h=400&fit=crop',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=face',
    category: 'Technology & Dev',
    privacy: 'public',
    requiresApproval: false,
    admin: 'Aung Myint',
    members: ['Aung Myint', 'Kyaw Kyaw', 'Thiri May', 'Su Su', 'Zaw Min'],
    pendingRequests: ['May Thu'],
    chatTheme: 'ocean',
    createdAt: 'Sep 2026',
    linkedMeetingToken: '#MEET-9021',
  },
  {
    id: 'grp_ai_builders',
    name: 'AI & Generative Tech Circle 🤖',
    description: 'Discussing Gemini API, Granola meeting voice-to-text transcription, LLMs, and intelligent meeting assistants in Myanmar.',
    coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&h=400&fit=crop',
    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&h=200&fit=crop',
    category: 'Artificial Intelligence',
    privacy: 'private',
    requiresApproval: true,
    admin: 'Thiri May',
    members: ['Thiri May', 'Aung Myint', 'Kyaw Kyaw'],
    pendingRequests: ['Zaw Min', 'Su Su'],
    chatTheme: 'berry',
    createdAt: 'Aug 2026',
    linkedMeetingToken: '#MEET-001',
  },
  {
    id: 'grp_creator_shorts',
    name: 'CooM Video & Shorts Creators 📱',
    description: 'Tips and tricks for making engaging 30s clips, viral video editing, and live audio room promotion.',
    coverImage: 'https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?w=1200&h=400&fit=crop',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
    category: 'Content Creation',
    privacy: 'public',
    requiresApproval: false,
    admin: 'Su Su',
    members: ['Su Su', 'May Thu', 'Aung Myint'],
    pendingRequests: [],
    chatTheme: 'sunset',
    createdAt: 'Sep 2026',
  }
];

export const initialGroupChats: GroupChatMessage[] = [
  {
    id: 'gmsg_1',
    groupId: 'grp_webrtc_devs',
    sender: 'Kyaw Kyaw',
    senderAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=face',
    message: 'Welcome everyone to the WebRTC & Live Streaming group! Feel free to share your live room tokens and code tips here.',
    time: '10:15 AM',
    reactions: {
      '👍': ['Aung Myint', 'Thiri May'],
      '🔥': ['Su Su'],
    },
  },
  {
    id: 'gmsg_2',
    groupId: 'grp_webrtc_devs',
    sender: 'Thiri May',
    senderAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop&crop=face',
    message: 'We just tested the 30s Short video upload and smooth transition! Works like a charm 🎉',
    time: '10:20 AM',
    reactions: {
      '❤️': ['Aung Myint', 'Kyaw Kyaw'],
      '👏': ['Zaw Min'],
    },
  },
  {
    id: 'gmsg_3',
    groupId: 'grp_ai_builders',
    sender: 'Thiri May',
    senderAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop&crop=face',
    message: 'Hello AI builders! The private group is ready. Please approve your colleagues who request to join.',
    time: '11:00 AM',
    reactions: {
      '👍': ['Aung Myint'],
    },
  },
];
