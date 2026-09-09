import React, { useState, useEffect } from 'react';
import {
  TabType,
  MeetingRoom,
  MeetingNote,
  PostItem,
  ChatMessage,
  UserSettings,
  UserProfile,
  MeetingRecording,
  MeetingComment,
  CommentReply,
  ScheduledMeeting,
  DateNote
} from './types';
import { api } from './services/api';
import {
  initialRooms,
  initialMeetingNotes,
  initialPosts,
  initialChats,
  initialSettings,
  initialUserProfile,
  initialRecordings,
  initialMeetingComments,
  initialScheduledMeetings,
  initialDateNotes,
} from './data/initialData';
import { MeetingHomeScreen } from './components/MeetingHomeScreen';
import { TikTokMeetingFeed } from './components/TikTokMeetingFeed';
import { XFeedScreen } from './components/XFeedScreen';
import { MeetingChatScreen } from './components/MeetingChatScreen';
import { ZoomSettingsScreen } from './components/ZoomSettingsScreen';
import { TikTokProfileScreen } from './components/TikTokProfileScreen';
import { BottomNavBar } from './components/BottomNavBar';
import {
  Smartphone,
  Maximize2,
  Wifi,
  Battery,
  Sparkles,
  Layers,
  Video,
  MessageSquare,
  Settings,
  User,
  Home
} from 'lucide-react';

export default function App() {
  // Starts with 'home' screen as requested by user ("app စစချင်း ဝင်တဲ့ Screen တခုထည့်ပါ")
  const [currentTab, setCurrentTab] = useState<TabType>('home');
  const [profileActiveTab, setProfileActiveTab] = useState<'recordings' | 'favorites' | 'notes' | 'chats'>('recordings');
  const [rooms, setRooms] = useState<MeetingRoom[]>(initialRooms);
  const [posts, setPosts] = useState<PostItem[]>(initialPosts);
  const [chats, setChats] = useState<ChatMessage[]>(initialChats);
  const [settings, setSettings] = useState<UserSettings>(initialSettings);
  const [notes, setNotes] = useState<MeetingNote[]>(initialMeetingNotes);
  const [scheduledMeetings, setScheduledMeetings] = useState<ScheduledMeeting[]>(initialScheduledMeetings);
  const [dateNotes, setDateNotes] = useState<DateNote[]>(initialDateNotes);
  const [activeRoomToken, setActiveRoomToken] = useState<string>(initialRooms[0]?.token || '');
  const [isSubtitlesOverlayOn, setIsSubtitlesOverlayOn] = useState<boolean>(true);
  const [prefilledPostText, setPrefilledPostText] = useState<string>('');
  const [isMobileFrame, setIsMobileFrame] = useState<boolean>(true);

  // User Profile state with local persistence
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('user_profile_data');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return initialUserProfile;
  });
  // Meeting Recordings (persisted recordings for profile)
  const [recordings, setRecordings] = useState<MeetingRecording[]>(initialRecordings);
  // Active Recording state per meeting room
  const [activeRecordingTokens, setActiveRecordingTokens] = useState<Record<string, boolean>>({});
  // TikTok Meeting Comments state per room token
  const [comments, setComments] = useState<Record<string, MeetingComment[]>>(initialMeetingComments);

  // Synchronize with Backend API on mount
  useEffect(() => {
    let isMounted = true;
    api.fetchRooms().then((backendRooms) => {
      if (isMounted && backendRooms) {
        setRooms(backendRooms);
        if (backendRooms.length > 0 && !activeRoomToken) {
          setActiveRoomToken(backendRooms[0].token);
        }
      }
    });
    api.fetchNotes().then((backendNotes) => {
      if (isMounted && backendNotes && backendNotes.length > 0) {
        setNotes(backendNotes);
      }
    });
    api.fetchChats().then((backendChats) => {
      if (isMounted && backendChats && backendChats.length > 0) {
        setChats(backendChats);
      }
    });
    api.fetchSchedules().then((backendSchedules) => {
      if (isMounted && backendSchedules && backendSchedules.length > 0) {
        setScheduledMeetings(backendSchedules);
      }
    });
    api.fetchRecordings().then((backendRecordings) => {
      if (isMounted && backendRecordings && backendRecordings.length > 0) {
        setRecordings(backendRecordings);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Add Comment or Reply
  const handleAddComment = (
    meetingToken: string,
    text: string,
    replyToCommentId?: string,
    replyToUser?: string
  ) => {
    setComments((prev) => {
      const roomComments = prev[meetingToken] ? [...prev[meetingToken]] : [];
      if (replyToCommentId) {
        const updated = roomComments.map((c) => {
          if (c.id === replyToCommentId) {
            const newReply: CommentReply = {
              id: `reply_${Date.now()}`,
              author: userProfile.name,
              handle: userProfile.handle,
              avatar: userProfile.avatar,
              text: replyToUser ? `@${replyToUser} ${text}` : text,
              time: 'Just now',
              likes: 0,
              isLiked: false,
              replyToUser,
              isMe: true,
            };
            return {
              ...c,
              replies: [...(c.replies || []), newReply],
            };
          }
          return c;
        });
        return { ...prev, [meetingToken]: updated };
      } else {
        const newComment: MeetingComment = {
          id: `comment_${Date.now()}`,
          meetingToken,
          author: userProfile.name,
          handle: userProfile.handle,
          avatar: userProfile.avatar,
          text,
          time: 'Just now',
          likes: 0,
          isLiked: false,
          isMe: true,
          replies: [],
        };
        return { ...prev, [meetingToken]: [...roomComments, newComment] };
      }
    });
  };

  // Toggle Love React on Comment or Reply
  const handleToggleLikeComment = (
    meetingToken: string,
    commentId: string,
    replyId?: string
  ) => {
    setComments((prev) => {
      const roomComments = prev[meetingToken] ? [...prev[meetingToken]] : [];
      const updated = roomComments.map((c) => {
        if (c.id === commentId) {
          if (replyId) {
            const updatedReplies = (c.replies || []).map((r) => {
              if (r.id === replyId) {
                const nextLiked = !r.isLiked;
                return {
                  ...r,
                  isLiked: nextLiked,
                  likes: nextLiked ? r.likes + 1 : Math.max(0, r.likes - 1),
                };
              }
              return r;
            });
            return { ...c, replies: updatedReplies };
          } else {
            const nextLiked = !c.isLiked;
            return {
              ...c,
              isLiked: nextLiked,
              likes: nextLiked ? c.likes + 1 : Math.max(0, c.likes - 1),
            };
          }
        }
        return c;
      });
      return { ...prev, [meetingToken]: updated };
    });
  };

  // Add new meeting note
  const handleAddNote = (newNote: MeetingNote) => {
    setNotes((prev) => [newNote, ...prev]);
    api.createNote(newNote).catch((e) => console.warn('Backend createNote sync error:', e));
  };

  // Update User Profile details & synchronize with meeting rooms
  const handleUpdateProfile = (updated: Partial<UserProfile>) => {
    const oldName = userProfile.name;
    const oldHandle = userProfile.handle;
    const nextProfile = { ...userProfile, ...updated };
    setUserProfile(nextProfile);

    // Save to localStorage
    try {
      localStorage.setItem('user_profile_data', JSON.stringify(nextProfile));
    } catch {}

    // Synchronize user name, handle, and avatar with rooms, posts, and comments
    if (updated.name || updated.handle || updated.avatar) {
      const newName = updated.name || userProfile.name;
      const newHandle = updated.handle || userProfile.handle;

      setRooms((prevRooms) =>
        prevRooms.map((r) => {
          const isHostMe =
            r.host === oldName ||
            r.host === 'Aung Myint' ||
            r.host === 'Aung Aung' ||
            r.host === 'Aung Aung (Me)' ||
            r.host === oldHandle;
          const updatedHost = isHostMe ? newName : r.host;
          const updatedParticipants = r.participants.map((p) =>
            p === oldName ||
            p === 'Aung Myint' ||
            p === 'Aung Aung' ||
            p === 'Aung Aung (Me)' ||
            p.includes('(Me)')
              ? newName
              : p
          );
          return {
            ...r,
            host: updatedHost,
            participants: updatedParticipants,
          };
        })
      );

      // Synchronize posts author
      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.author === oldName || p.author === 'Aung Aung' || p.author === 'Aung Myint'
            ? { ...p, author: newName }
            : p
        )
      );

      // Synchronize comments author & handle
      setComments((prevComments) => {
        const next: Record<string, MeetingComment[]> = {};
        for (const [token, list] of Object.entries(prevComments) as [string, MeetingComment[]][]) {
          next[token] = list.map((c) => ({
            ...c,
            author: c.isMe ? newName : c.author,
            handle: c.isMe ? newHandle : c.handle,
            avatar: c.isMe && updated.avatar ? updated.avatar : c.avatar,
            replies: (c.replies || []).map((rep) => ({
              ...rep,
              author: rep.isMe ? newName : rep.author,
              handle: rep.isMe ? newHandle : rep.handle,
              avatar: rep.isMe && updated.avatar ? updated.avatar : rep.avatar,
            })),
          }));
        }
        return next;
      });
    }
  };

  // Toggle favorite on recording
  const handleToggleFavoriteRecording = (recordingId: string) => {
    setRecordings((prev) =>
      prev.map((r) => {
        if (r.id === recordingId) {
          const isFav = !r.isFavorited;
          return {
            ...r,
            isFavorited: isFav,
            likes: isFav ? r.likes + 1 : Math.max(0, r.likes - 1),
          };
        }
        return r;
      })
    );
  };

  // Update room title and token
  const handleUpdateRoomDetails = (roomId: string, newTitle: string, newToken: string) => {
    setRooms((prev) =>
      prev.map((r) => (r.id === roomId ? { ...r, title: newTitle, token: newToken } : r))
    );
    setActiveRoomToken(newToken);
  };

  // Handle Recording toggle
  const handleToggleRecording = (token: string, isStart: boolean, durationSec: number = 0) => {
    setActiveRecordingTokens((prev) => ({ ...prev, [token]: isStart }));

    // When recording stops, ensure it is archived in user recordings!
    if (!isStart) {
      const currentRoom = rooms.find((r) => r.token === token);
      const minutes = Math.floor(durationSec / 60);
      const seconds = durationSec % 60;
      const formattedDuration = durationSec > 0
        ? `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        : '02:45';

      setRecordings((prev) => {
        const existingIndex = prev.findIndex((r) => r.meetingToken === token);
        if (existingIndex !== -1) {
          return prev.map((r, idx) =>
            idx === existingIndex
              ? {
                  ...r,
                  isUserRecorded: true,
                  duration: formattedDuration,
                  title: currentRoom?.title || r.title,
                }
              : r
          );
        } else {
          const newRecording: MeetingRecording = {
            id: `rec_${Date.now()}`,
            meetingToken: token,
            meetingTitle: currentRoom?.title || `Live Meeting (${token})`,
            title: currentRoom?.title || `Live Meeting Session (${token})`,
            duration: formattedDuration,
            date: 'Just now',
            thumbnailUrl:
              'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=600&auto=format&fit=crop&q=80',
            views: 1,
            likes: 0,
            isFavorited: false,
            isUserRecorded: true,
            participants: currentRoom?.participants || ['Aung Aung (Me)', 'Kyaw Kyaw', 'Su Su'],
            notes: currentRoom?.keyPoints || [
              'Granola AI Meeting transcript archived',
              'Collaborative discussion points captured',
            ],
            subtitles: [
              {
                id: `sub_${Date.now()}`,
                speaker: 'Aung Aung (Me)',
                avatar: userProfile.avatar,
                time: 'Just now',
                isMe: true,
                tag: 'Host Summary',
                textByLang: {
                  'Myanmar (MM)': 'ဒီ meeting ကို အောင်မြင်စွာ record လုပ်ပြီး သိမ်းဆည်းလိုက်ပါပြီ။',
                  'English (US)': 'Successfully recorded and archived this meeting.',
                  'Thai (TH)': 'บันทึกการประชุมนี้เรียบร้อยแล้ว',
                  'Japanese (JA)': 'このミーティングの録画が正常に保存されました。',
                  'Chinese (ZH)': '本次会议已成功录制并保存。',
                },
              },
            ],
          };
          return [newRecording, ...prev];
        }
      });
    }
  };

  // Send message to meeting token or direct recipient
  const handleSendMessage = (roomToken: string, text: string, recipient?: string) => {
    const isDirect = Boolean(recipient);
    const newMsg: ChatMessage = {
      id: `chat_${Date.now()}`,
      meetingToken: roomToken,
      sender: 'Me',
      message: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
      recipient: recipient,
      isDirect: isDirect,
    };
    setChats((prev) => [...prev, newMsg]);
    api.sendChatMessage(newMsg).catch((e) => console.warn('Backend sendChatMessage error:', e));

    // If direct message to another user, simulate realistic reply
    if (recipient && recipient !== 'Me') {
      setTimeout(() => {
        const replyMap: Record<string, string[]> = {
          'Kyaw Kyaw': [
            'ဟုတ်ကဲ့ အစ်ကို၊ နားထောင်နေပါတယ်ခင်ဗျာ!',
            'ရပါတယ် အစ်ကို၊ အခုပဲ ဆောင်ရွက်ပေးပါမယ်။',
            'Meeting # ပြီးရင် ပြန် share ပေးပါမယ်ခင်ဗျာ။',
          ],
          'Su Su': [
            'ဟုတ်ကဲ့ပါ အစ်ကို၊ Note မှတ်ထားလိုက်ပါမယ်။',
            'Thanks for the update! Meeting ပြီးရင် ဆက်ဆွေးနွေးကြတာပေါ့။',
          ],
          'Mya Mya': [
            'သဘောတူပါတယ်ရှင့်!',
            'Live subtitles ထဲမှာလဲ အသံ ကောင်းကောင်းဖမ်းမိနေပါတယ်။',
          ],
          'David': [
            'Got it, will update the Web3 proposal right away!',
            'Thanks for reaching out directly.',
          ],
          'Alex': [
            'Noted! Looking forward to the testnet launch.',
          ],
          'Elena': [
            'Great points! I will incorporate this into the mobile design system.',
          ],
          'Marcus': [
            'Understood, checking the Figma components now.',
          ],
        };
        const replies = replyMap[recipient] || ['ဟုတ်ကဲ့ခင်ဗျာ၊ မက်ဆေ့ခ်ျ လက်ခံရရှိပါသည်!'];
        const randomReply = replies[Math.floor(Math.random() * replies.length)];
        const replyMsg: ChatMessage = {
          id: `chat_reply_${Date.now()}`,
          meetingToken: roomToken,
          sender: recipient,
          message: randomReply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          recipient: 'Me',
          isDirect: true,
        };
        setChats((prev) => [...prev, replyMsg]);
        api.sendChatMessage(replyMsg).catch((e) => console.warn('Backend reply chat sync error:', e));
      }, 1100);
    }
  };

  // Add new X post
  const handleAddPost = (token: string, content: string) => {
    const newPost: PostItem = {
      id: `post_${Date.now()}`,
      meetingToken: token,
      author: 'Aung Aung',
      content,
      timestamp: 'Just now',
      likes: 1,
      isLiked: true,
      replies: 0,
      reposts: 0,
    };
    setPosts((prev) => [newPost, ...prev]);
    setPrefilledPostText('');
  };

  // Toggle post like
  const handleToggleLike = (postId: string) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const isLiked = !post.isLiked;
          const currentLikes = post.likes || 0;
          return {
            ...post,
            isLiked,
            likes: isLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1),
          };
        }
        return post;
      })
    );
  };

  // Quick export from Granola Notes to X-Feed
  const handleExportToFeed = (text: string) => {
    setPrefilledPostText(text);
    setCurrentTab('posts');
  };

  // Add new meeting room
  const handleAddNewRoom = (title: string, token: string) => {
    const formattedToken = token.startsWith('#') ? token : `#${token}`;
    const newRoom: MeetingRoom = {
      id: `room_${Date.now()}`,
      token: formattedToken,
      title,
      host: userProfile.name,
      participants: [userProfile.name, 'Kyaw Kyaw', 'Su Su'],
      keyPoints: [
        'Initial session established with Granola AI Engine',
        'Live multi-user filter initialized',
        'Ready for real-time collaborative discussion',
      ],
      category: 'General Discussion',
      isLive: true,
    };
    setRooms((prev) => [newRoom, ...prev]);
    setActiveRoomToken(formattedToken);
    api.createRoom(newRoom).catch((e) => console.warn('Backend createRoom sync error:', e));
  };

  // Start new meeting directly from Main Entry Screen
  const handleStartNewMeeting = (title: string, token: string) => {
    handleAddNewRoom(title, token);
    setCurrentTab('meetings');
  };

  // Join meeting from Main Entry Screen
  const handleJoinMeeting = (token: string) => {
    const formattedToken = token.startsWith('#') ? token : `#${token}`;
    const roomExists = rooms.some((r) => r.token.toUpperCase() === formattedToken.toUpperCase());
    if (!roomExists) {
      handleAddNewRoom(`Meeting ${formattedToken}`, formattedToken);
    } else {
      setActiveRoomToken(formattedToken);
    }
    setCurrentTab('meetings');
  };

  // Navigate to specific Profile tab (Note History / Chat History / Record History)
  const handleNavigateToProfileTab = (tab: 'recordings' | 'favorites' | 'notes' | 'chats') => {
    setProfileActiveTab(tab);
    setCurrentTab('profile');
  };

  // Add new scheduled meeting
  const handleAddScheduledMeeting = (meeting: ScheduledMeeting) => {
    setScheduledMeetings((prev) => [meeting, ...prev]);
    api.createSchedule(meeting).catch((e) => console.warn('Backend createSchedule error:', e));
  };

  // Add new date note
  const handleAddDateNote = (dateNote: DateNote) => {
    setDateNotes((prev) => [dateNote, ...prev]);
  };

  // Back to Home screen
  const handleBackToHome = () => {
    setCurrentTab('home');
  };

  // Update settings
  const handleUpdateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  return (
    <div className="w-full min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center font-sans antialiased selection:bg-red-500 selection:text-white">
      {/* Top Utility Bar for Switching Frame & Quick Info */}
      <header className="w-full max-w-4xl px-4 py-3 flex items-center justify-between border-b border-neutral-900 z-50 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
          <span className="font-bold tracking-tight text-white sm:inline hidden">
            TikTok Style Meeting &amp; Posts System
          </span>
          <span className="text-neutral-500 font-mono text-[11px] sm:inline hidden">
            · Flutter-to-Web Architecture
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick tab switcher pill in header */}
          <div className="hidden sm:flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-0.5 text-[11px]">
            <button
              onClick={() => setCurrentTab('meetings')}
              className={`px-2.5 py-1 rounded-md transition flex items-center gap-1 ${
                currentTab === 'meetings' ? 'bg-red-600 text-white font-semibold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Video className="w-3 h-3" /> Meetings
            </button>
            <button
              onClick={() => setCurrentTab('posts')}
              className={`px-2.5 py-1 rounded-md transition flex items-center gap-1 ${
                currentTab === 'posts' ? 'bg-red-600 text-white font-semibold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Layers className="w-3 h-3" /> Posts
            </button>
            <button
              onClick={() => setCurrentTab('chat')}
              className={`px-2.5 py-1 rounded-md transition flex items-center gap-1 ${
                currentTab === 'chat' ? 'bg-red-600 text-white font-semibold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3 h-3" /> Chat
            </button>
            <button
              onClick={() => setCurrentTab('profile')}
              className={`px-2.5 py-1 rounded-md transition flex items-center gap-1 ${
                currentTab === 'profile' ? 'bg-red-600 text-white font-semibold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <User className="w-3 h-3" /> Profile
            </button>
            <button
              onClick={() => setCurrentTab('settings')}
              className={`px-2.5 py-1 rounded-md transition flex items-center gap-1 ${
                currentTab === 'settings' ? 'bg-red-600 text-white font-semibold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Settings className="w-3 h-3" /> Settings
            </button>
          </div>

          {/* Viewport Frame Toggle */}
          <button
            id="btn-toggle-frame"
            type="button"
            onClick={() => setIsMobileFrame(!isMobileFrame)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition"
            title={isMobileFrame ? 'Expand to Fluid Layout' : 'Constrain to Phone Frame'}
          >
            {isMobileFrame ? (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-neutral-400" />
                <span>Expand View</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5 text-red-500" />
                <span>Mobile Frame</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Container - Supports authentic Mobile Device Frame or Responsive Fluid */}
      <main className="flex-1 w-full flex items-center justify-center p-0 sm:p-4 overflow-hidden">
        <div
          id="app-viewport-container"
          className={`relative bg-black transition-all duration-300 flex flex-col overflow-hidden ${
            isMobileFrame
              ? 'w-full max-w-[395px] h-[100dvh] sm:h-[844px] sm:rounded-[44px] sm:border-[8px] sm:border-neutral-800 sm:shadow-2xl sm:shadow-black ring-1 ring-white/10'
              : 'w-full max-w-4xl h-[100dvh] sm:h-[820px] sm:rounded-2xl sm:border sm:border-neutral-800'
          }`}
        >
          {/* Simulated Mobile Status Bar */}
          {isMobileFrame && (
            <div className="relative z-50 w-full px-7 pt-3 pb-1 flex items-center justify-between text-[11px] font-semibold text-white/90 select-none pointer-events-none shrink-0">
              <span>9:41</span>
              <div className="w-20 h-4 bg-neutral-900 rounded-full mx-auto -mt-1" />
              <div className="flex items-center gap-1.5 text-neutral-300">
                <Wifi className="w-3 h-3" />
                <span className="text-[10px] font-mono">5G</span>
                <Battery className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
          )}

          {/* Active Screen Tab View */}
          <div className="flex-1 w-full h-full relative overflow-hidden">
            {currentTab === 'home' && (
              <MeetingHomeScreen
                userProfile={userProfile}
                rooms={rooms}
                notes={notes}
                recordings={recordings}
                scheduledMeetings={scheduledMeetings}
                dateNotes={dateNotes}
                onStartNewMeeting={handleStartNewMeeting}
                onJoinMeeting={handleJoinMeeting}
                onNavigateToProfileTab={handleNavigateToProfileTab}
                onAddScheduledMeeting={handleAddScheduledMeeting}
                onAddDateNote={handleAddDateNote}
              />
            )}

            {currentTab === 'meetings' && (
              <TikTokMeetingFeed
                rooms={rooms}
                notes={notes}
                chats={chats}
                settings={settings}
                activeRoomToken={activeRoomToken}
                isSubtitlesOverlayOn={isSubtitlesOverlayOn}
                onSendMessage={handleSendMessage}
                onExportToFeed={handleExportToFeed}
                onAddNewRoom={handleAddNewRoom}
                onAddNote={handleAddNote}
                onActiveRoomChange={setActiveRoomToken}
                onUpdateRoomDetails={handleUpdateRoomDetails}
                isRecording={Boolean(activeRecordingTokens[activeRoomToken])}
                onToggleRecording={handleToggleRecording}
                onOpenProfile={() => setCurrentTab('profile')}
                onBackToHome={handleBackToHome}
                comments={comments}
                userProfile={userProfile}
                onAddComment={handleAddComment}
                onToggleLikeComment={handleToggleLikeComment}
              />
            )}

            {currentTab === 'posts' && (
              <XFeedScreen
                posts={posts}
                rooms={rooms}
                initialNewPostText={prefilledPostText}
                onAddPost={handleAddPost}
                onToggleLike={handleToggleLike}
                onSelectMeetingToken={(token) => {
                  const roomExists = rooms.some((r) => r.token === token);
                  if (roomExists) {
                    setActiveRoomToken(token);
                    setCurrentTab('meetings');
                  }
                }}
              />
            )}

            {currentTab === 'chat' && (
              <MeetingChatScreen
                rooms={rooms}
                chats={chats}
                activeRoomToken={activeRoomToken}
                onSendMessage={handleSendMessage}
                onJumpToMeeting={(token) => {
                  setActiveRoomToken(token);
                  setCurrentTab('meetings');
                }}
              />
            )}

            {currentTab === 'profile' && (
              <TikTokProfileScreen
                userProfile={userProfile}
                recordings={recordings}
                notes={notes}
                rooms={rooms}
                onUpdateProfile={handleUpdateProfile}
                onToggleFavoriteRecording={handleToggleFavoriteRecording}
                onExportToPost={handleExportToFeed}
                initialTab={profileActiveTab}
                onBackToHome={handleBackToHome}
                onJumpToMeeting={(token) => {
                  setActiveRoomToken(token);
                  setCurrentTab('meetings');
                }}
              />
            )}

            {currentTab === 'settings' && (
              <ZoomSettingsScreen
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
              />
            )}
          </div>

          {/* Bottom Navigation matching Flutter BottomNavigationBar */}
          <BottomNavBar
            currentTab={currentTab}
            onSelectTab={(tab) => setCurrentTab(tab)}
            unreadChatsCount={chats.filter((c) => c.sender !== 'Me').length}
            userAvatar={userProfile.avatar}
          />
        </div>
      </main>
    </div>
  );
}
