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
  DateNote,
  SocialUser,
  ShortVideoItem,
  CooMGroup,
  GroupChatMessage,
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
import { initialSocialUsers } from './data/socialUsers';
import { initialShorts } from './data/shortsData';
import { initialGroups, initialGroupChats } from './data/initialGroups';
import { MeetingHomeScreen } from './components/MeetingHomeScreen';
import { ShortsFeedScreen } from './components/ShortsFeedScreen';
import { CooMMeetingFeed } from './components/TikTokMeetingFeed';
import { XFeedScreen } from './components/XFeedScreen';
import { MeetingChatScreen } from './components/MeetingChatScreen';
import { ZoomSettingsScreen } from './components/ZoomSettingsScreen';
import { CooMProfileScreen } from './components/TikTokProfileScreen';
import { BottomNavBar } from './components/BottomNavBar';

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

  // CooM Groups State
  const [groups, setGroups] = useState<CooMGroup[]>(() => {
    try {
      const saved = localStorage.getItem('coom_groups_data') || localStorage.getItem('facebook_groups_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return initialGroups;
  });

  const [activeGroupId, setActiveGroupId] = useState<string>(initialGroups[0]?.id || 'grp_1');

  const [groupChats, setGroupChats] = useState<GroupChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('coom_group_chats') || localStorage.getItem('facebook_group_chats');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return initialGroupChats;
  });

  // Persist groups
  useEffect(() => {
    try {
      localStorage.setItem('coom_groups_data', JSON.stringify(groups));
    } catch {}
  }, [groups]);

  // Persist group chats
  useEffect(() => {
    try {
      localStorage.setItem('coom_group_chats', JSON.stringify(groupChats));
    } catch {}
  }, [groupChats]);

  // Shorts Feed state with local persistence
  const [shorts, setShorts] = useState<ShortVideoItem[]>(() => {
    try {
      const saved = localStorage.getItem('shorts_feed_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const hasBrokenMixkit = parsed.some((s: ShortVideoItem) => s.videoUrl && s.videoUrl.includes('mixkit'));
          if (!hasBrokenMixkit) {
            return parsed;
          }
        }
      }
    } catch {}
    try {
      localStorage.setItem('shorts_feed_data', JSON.stringify(initialShorts));
    } catch {}
    return initialShorts;
  });

  const handleToggleLikeShort = (shortId: string) => {
    setShorts((prev) => {
      const updated = prev.map((s) => {
        if (s.id === shortId) {
          const nextLiked = !s.isLiked;
          return {
            ...s,
            isLiked: nextLiked,
            likes: nextLiked ? s.likes + 1 : Math.max(0, s.likes - 1),
          };
        }
        return s;
      });
      try {
        localStorage.setItem('shorts_feed_data', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleToggleBookmarkShort = (shortId: string) => {
    setShorts((prev) => {
      const updated = prev.map((s) => {
        if (s.id === shortId) {
          return {
            ...s,
            isBookmarked: !s.isBookmarked,
          };
        }
        return s;
      });
      try {
        localStorage.setItem('shorts_feed_data', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleRepostShort = (shortId: string) => {
    setShorts((prev) => {
      const updated = prev.map((s) => {
        if (s.id === shortId) {
          const nextReposted = !s.isReposted;
          return {
            ...s,
            reposts: nextReposted ? s.reposts + 1 : Math.max(0, s.reposts - 1),
            isReposted: nextReposted,
          };
        }
        return s;
      });
      try {
        localStorage.setItem('shorts_feed_data', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    const targetShort = shorts.find((s) => s.id === shortId);
    if (targetShort) {
      const repostPost: PostItem = {
        id: `post_repost_${Date.now()}`,
        author: userProfile.name,
        handle: userProfile.handle,
        avatar: userProfile.avatar,
        timestamp: 'Just now',
        content: `🔁 Reposted 30s Short from ${targetShort.author}: "${targetShort.title}" 🎥 Join live meeting at ${targetShort.meetingToken}!`,
        likes: 0,
        comments: [],
        reposts: 1,
        isLiked: false,
        isReposted: true,
        meetingToken: targetShort.meetingToken,
        videoUrl: targetShort.videoUrl,
        isShort: true,
      };
      setPosts((prev) => [repostPost, ...prev]);
    }
  };

  const handleAddShortComment = (shortId: string, text: string) => {
    const newCommentItem = {
      id: `comm_${Date.now()}`,
      author: userProfile.name,
      handle: userProfile.handle,
      avatar: userProfile.avatar,
      content: text,
      timestamp: 'Just now',
      likes: 0,
      isLiked: false,
    };

    setShorts((prev) => {
      const updated = prev.map((s) => {
        if (s.id === shortId) {
          return {
            ...s,
            commentsCount: s.commentsCount + 1,
            comments: [...(s.comments || []), newCommentItem],
          };
        }
        return s;
      });
      try {
        localStorage.setItem('shorts_feed_data', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleUploadShort = (newShort: Omit<ShortVideoItem, 'id' | 'likes' | 'commentsCount' | 'reposts' | 'isLiked' | 'isBookmarked' | 'isReposted' | 'comments'>) => {
    const hasActiveMeeting = Boolean(newShort.meetingToken && newShort.meetingToken.trim() !== '' && newShort.meetingToken !== 'none');
    const fullShort: ShortVideoItem = {
      id: `short_${Date.now()}`,
      ...newShort,
      thumbnailUrl: newShort.thumbnailUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=720&h=1280&fit=crop',
      meetingToken: hasActiveMeeting ? newShort.meetingToken : '',
      hasActiveMeeting,
      visibility: newShort.visibility || 'public',
      likes: 0,
      commentsCount: 0,
      reposts: 0,
      isLiked: false,
      isBookmarked: false,
      isReposted: false,
      comments: [],
    };

    setShorts((prev) => {
      const updated = [fullShort, ...prev];
      try {
        localStorage.setItem('shorts_feed_data', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    const newPost: PostItem = {
      id: `post_short_${Date.now()}`,
      author: userProfile.name,
      handle: userProfile.handle,
      avatar: userProfile.avatar,
      timestamp: 'Just now',
      content: hasActiveMeeting
        ? `${newShort.title} 🎥 30s Short Clip. Tap to join live discussion in ${newShort.meetingToken}!`
        : `${newShort.title} 🎥 30s Standalone Short Clip.`,
      likes: 0,
      comments: [],
      reposts: 0,
      isLiked: false,
      isReposted: false,
      meetingToken: hasActiveMeeting ? newShort.meetingToken : undefined,
      videoUrl: newShort.videoUrl,
      isShort: true,
      visibility: newShort.visibility || 'public',
    };
    setPosts((prev) => [newPost, ...prev]);
  };

  const handleSendDirectChatMessage = (targetUserName: string, text: string) => {
    const newChat: ChatMessage = {
      id: `chat_dm_${Date.now()}`,
      sender: userProfile.name,
      avatar: userProfile.avatar,
      message: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      meetingToken: activeRoomToken || 'DIRECT',
      isDirect: true,
      recipient: targetUserName,
      isMe: true,
    };
    setChats((prev) => [...prev, newChat]);
  };

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

  // Social network users state with local persistence (X-like follow system)
  const [socialUsers, setSocialUsers] = useState<SocialUser[]>(() => {
    try {
      const saved = localStorage.getItem('social_users_data');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return initialSocialUsers;
  });

  // User currently being viewed on Profile screen (null = my own profile)
  const [viewedUser, setViewedUser] = useState<SocialUser | UserProfile | null>(null);

  const handleSelectUserFromSearch = (user: SocialUser | UserProfile) => {
    setViewedUser(user);
    setCurrentTab('profile');
  };

  // Follow/Unfollow someone (like X)
  const handleToggleFollowUser = (userId: string) => {
    setSocialUsers((prevUsers) => {
      const target = prevUsers.find((u) => u.id === userId);
      if (!target) return prevUsers;
      const isCurrentlyFollowed = !!target.isFollowedByMe;
      const updatedUsers = prevUsers.map((u) => {
        if (u.id === userId) {
          return {
            ...u,
            isFollowedByMe: !isCurrentlyFollowed,
            followersCount: isCurrentlyFollowed
              ? Math.max(0, u.followersCount - 1)
              : u.followersCount + 1,
          };
        }
        return u;
      });
      try {
        localStorage.setItem('social_users_data', JSON.stringify(updatedUsers));
      } catch {}

      // Synchronize current user profile following count and followingUserIds
      setUserProfile((prevProfile) => {
        const prevIds = prevProfile.followingUserIds || [];
        const nextIds = isCurrentlyFollowed
          ? prevIds.filter((id) => id !== userId)
          : [...prevIds, userId];
        const updated = {
          ...prevProfile,
          following: nextIds.length,
          followingUserIds: nextIds,
        };
        try {
          localStorage.setItem('user_profile_data', JSON.stringify(updated));
        } catch {}
        return updated;
      });

      return updatedUsers;
    });
  };

  // Simulate someone following/unfollowing me (like X incoming follower)
  const handleSimulateIncomingFollow = (userId: string) => {
    setSocialUsers((prevUsers) => {
      const target = prevUsers.find((u) => u.id === userId);
      if (!target) return prevUsers;
      const isNowFollowingMe = !target.isFollowingMe;
      const updatedUsers = prevUsers.map((u) => {
        if (u.id === userId) {
          return {
            ...u,
            isFollowingMe: isNowFollowingMe,
          };
        }
        return u;
      });
      try {
        localStorage.setItem('social_users_data', JSON.stringify(updatedUsers));
      } catch {}

      // Synchronize current user profile followers count and followerUserIds
      setUserProfile((prevProfile) => {
        const prevIds = prevProfile.followerUserIds || [];
        const nextIds = isNowFollowingMe
          ? (prevIds.includes(userId) ? prevIds : [...prevIds, userId])
          : prevIds.filter((id) => id !== userId);
        const updated = {
          ...prevProfile,
          followers: nextIds.length,
          followerUserIds: nextIds,
        };
        try {
          localStorage.setItem('user_profile_data', JSON.stringify(updated));
        } catch {}
        return updated;
      });

      return updatedUsers;
    });
  };
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
  const handleToggleRecording = (
    token: string,
    isStart: boolean,
    durationSec: number = 0,
    visibility: 'public' | 'private' = 'public'
  ) => {
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
                  visibility: visibility || r.visibility || 'public',
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
            reposts: 0,
            isFavorited: false,
            isUserRecorded: true,
            isReposted: false,
            visibility: visibility || 'public',
            comments: [],
            participants: currentRoom?.participants || [userProfile.name, 'Kyaw Kyaw', 'Su Su'],
            notes: currentRoom?.keyPoints || [
              'Granola AI Meeting transcript archived',
              'Collaborative discussion points captured',
            ],
            subtitles: [
              {
                id: `sub_${Date.now()}`,
                speaker: `${userProfile.name} (Host)`,
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

  // Add new X post (with optional Facebook group linking, media attachment, and quote)
  const handleAddPost = (
    token: string,
    content: string,
    visibility: 'public' | 'private' = 'public',
    groupId?: string,
    groupName?: string,
    mediaUrl?: string,
    mediaType?: 'image' | 'video',
    quotedPost?: PostItem['quotedPost']
  ) => {
    const newPost: PostItem = {
      id: `post_${Date.now()}`,
      meetingToken: token,
      author: userProfile.name,
      avatar: userProfile.avatar,
      handle: userProfile.handle,
      content,
      timestamp: 'Just now',
      likes: 0,
      isLiked: false,
      replies: 0,
      reposts: 0,
      isReposted: false,
      visibility: visibility || 'public',
      comments: [],
      groupId,
      groupName,
      mediaUrl,
      mediaType,
      quotedPost,
    };
    setPosts((prev) => [newPost, ...prev]);
    setPrefilledPostText('');
  };

  // Group Handlers
  const handleCreateGroup = (groupData: any) => {
    const newGroup: CooMGroup = {
      id: `grp_${Date.now()}`,
      name: groupData.name,
      description: groupData.description || '',
      category: groupData.category || 'Technology & Dev',
      avatar:
        groupData.avatar ||
        'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=160&h=160&fit=crop&crop=faces',
      coverImage:
        groupData.coverImage ||
        'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1000&h=350&fit=crop',
      admin: userProfile.name,
      members: [userProfile.name, 'You'],
      pendingRequests: [],
      privacy: groupData.privacy || 'public',
      theme: groupData.theme || 'ocean',
      linkedMeetingToken: groupData.linkedMeetingToken || activeRoomToken || '#MEET-9021',
      requireApproval: Boolean(groupData.requireApproval),
      createdAt: 'Just now',
    };

    setGroups((prev) => [newGroup, ...prev]);
    setActiveGroupId(newGroup.id);

    // Initial system announcement
    const welcomeMsg: GroupChatMessage = {
      id: `gc_${Date.now()}`,
      groupId: newGroup.id,
      sender: 'System',
      senderAvatar: newGroup.avatar,
      text: `🎉 Welcome to "${newGroup.name}"! Group created by ${userProfile.name}. Start posting and chatting!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: false,
      reactions: {},
    };
    setGroupChats((prev) => [...prev, welcomeMsg]);
  };

  const handleUpdateGroup = (groupId: string, updates: Partial<CooMGroup>) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, ...updates } : g))
    );
  };

  const handleAddUserToGroup = (groupId: string, userName: string) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id === groupId && !g.members.includes(userName)) {
          return {
            ...g,
            members: [...g.members, userName],
            pendingRequests: g.pendingRequests.filter((u) => u !== userName),
          };
        }
        return g;
      })
    );
  };

  const handleRemoveUserFromGroup = (groupId: string, userName: string) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id === groupId) {
          return {
            ...g,
            members: g.members.filter((m) => m !== userName),
          };
        }
        return g;
      })
    );
  };

  const handleRequestJoinGroup = (groupId: string) => {
    const currentName = userProfile.name;
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id === groupId) {
          if (g.privacy === 'public' && !g.requireApproval) {
            // Join immediately
            return {
              ...g,
              members: [...g.members, currentName],
            };
          } else {
            // Add to pending
            if (!g.pendingRequests.includes(currentName) && !g.members.includes(currentName)) {
              return {
                ...g,
                pendingRequests: [...g.pendingRequests, currentName],
              };
            }
          }
        }
        return g;
      })
    );
  };

  const handleApproveJoinRequest = (groupId: string, userName: string) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id === groupId) {
          return {
            ...g,
            members: [...g.members, userName],
            pendingRequests: g.pendingRequests.filter((u) => u !== userName),
          };
        }
        return g;
      })
    );
  };

  const handleDeclineJoinRequest = (groupId: string, userName: string) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id === groupId) {
          return {
            ...g,
            pendingRequests: g.pendingRequests.filter((u) => u !== userName),
          };
        }
        return g;
      })
    );
  };

  const handleLeaveGroup = (groupId: string) => {
    const currentName = userProfile.name;
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id === groupId) {
          return {
            ...g,
            members: g.members.filter((m) => m !== currentName && m !== 'You'),
          };
        }
        return g;
      })
    );
  };

  const handleSendGroupMessage = (groupId: string, text: string, mediaUrl?: string) => {
    const newMsg: GroupChatMessage = {
      id: `gc_${Date.now()}`,
      groupId,
      sender: userProfile.name,
      senderAvatar: userProfile.avatar,
      text,
      mediaUrl,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
      reactions: {},
    };

    setGroupChats((prev) => [...prev, newMsg]);

    // Realistic interactive bot reply from group member
    const targetGroup = groups.find((g) => g.id === groupId);
    if (targetGroup) {
      const otherMembers = targetGroup.members.filter(
        (m) => m !== userProfile.name && m !== 'You' && m !== 'System'
      );
      if (otherMembers.length > 0) {
        const randomMember = otherMembers[Math.floor(Math.random() * otherMembers.length)];
        setTimeout(() => {
          const replyTextChoices = [
            `မင်္ဂလာပါ @${userProfile.name}! Thanks for sharing in ${targetGroup.name}. 👍`,
            `Great point! Let's discuss this further in our meeting today. 💡`,
            `Agree with you! Looking forward to the next update. 🔥`,
            `Thanks for the message! Very helpful info. 👏`,
          ];
          const chosenReply = replyTextChoices[Math.floor(Math.random() * replyTextChoices.length)];

          const botMsg: GroupChatMessage = {
            id: `gc_${Date.now() + 1}`,
            groupId,
            sender: randomMember,
            senderAvatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face`,
            text: chosenReply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isMe: false,
            reactions: {},
          };
          setGroupChats((prev) => [...prev, botMsg]);
        }, 1200);
      }
    }
  };

  const handleToggleGroupReaction = (messageId: string, emoji: string) => {
    const currentName = userProfile.name;
    setGroupChats((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId) {
          const currentReactions = { ...(msg.reactions || {}) };
          const usersForEmoji = currentReactions[emoji] || [];
          const hasReacted = usersForEmoji.includes(currentName);

          if (hasReacted) {
            currentReactions[emoji] = usersForEmoji.filter((u) => u !== currentName);
            if (currentReactions[emoji].length === 0) {
              delete currentReactions[emoji];
            }
          } else {
            currentReactions[emoji] = [...usersForEmoji, currentName];
          }

          return {
            ...msg,
            reactions: currentReactions,
          };
        }
        return msg;
      })
    );
  };

  const handleOpenGroupChat = (groupId: string) => {
    setActiveGroupId(groupId);
    setCurrentTab('chat');
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

  // Toggle post repost (Attributed to userProfile.name so it appears on their profile as reposted)
  const handleToggleRepost = (postId: string) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const isReposted = !post.isReposted;
          const currentReposts = post.reposts || 0;
          return {
            ...post,
            isReposted,
            reposts: isReposted ? currentReposts + 1 : Math.max(0, currentReposts - 1),
            repostedByUser: isReposted ? userProfile.name : undefined,
          };
        }
        return post;
      })
    );
  };

  // Add comment to post
  const handleAddPostComment = (postId: string, content: string) => {
    const newComment = {
      id: `cmt_${Date.now()}`,
      author: userProfile.name,
      avatar: userProfile.avatar,
      content,
      timestamp: 'Just now',
      likes: 0,
      isLiked: false,
    };
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const currentComments = post.comments || [];
          const updated = [...currentComments, newComment];
          return {
            ...post,
            comments: updated,
            replies: updated.length,
          };
        }
        return post;
      })
    );
  };

  // Toggle like on post comment
  const handleTogglePostCommentLike = (postId: string, commentId: string) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId && post.comments) {
          return {
            ...post,
            comments: post.comments.map((c) => {
              if (c.id === commentId) {
                const isLiked = !c.isLiked;
                return {
                  ...c,
                  isLiked,
                  likes: isLiked ? (c.likes || 0) + 1 : Math.max(0, (c.likes || 0) - 1),
                };
              }
              return c;
            }),
          };
        }
        return post;
      })
    );
  };

  // Toggle like on recording
  const handleToggleLikeRecording = (recordingId: string) => {
    setRecordings((prev) =>
      prev.map((r) => {
        if (r.id === recordingId) {
          const isLiked = !r.isLiked;
          const currentLikes = r.likes || 0;
          return {
            ...r,
            isLiked,
            likes: isLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1),
          };
        }
        return r;
      })
    );
  };

  // Toggle repost on recording:
  // Shows in user profile record list with "Reposted" attribution AND in posts feed!
  const handleToggleRepostRecording = (recordingId: string) => {
    let affectedRec: MeetingRecording | undefined;
    let nowReposted = false;

    setRecordings((prev) =>
      prev.map((r) => {
        if (r.id === recordingId) {
          nowReposted = !r.isReposted;
          const currentReposts = r.reposts || 0;
          affectedRec = {
            ...r,
            isReposted: nowReposted,
            reposts: nowReposted ? currentReposts + 1 : Math.max(0, currentReposts - 1),
            repostedByUser: nowReposted ? userProfile.name : undefined,
          };
          return affectedRec;
        }
        return r;
      })
    );

    // Also synchronize to Posts feed as an X-style repost
    if (affectedRec && nowReposted) {
      const newPost: PostItem = {
        id: `post_repost_rec_${Date.now()}`,
        meetingToken: affectedRec.meetingToken,
        author: userProfile.name,
        content: `🔁 Reposted recording: ${affectedRec.title} (${affectedRec.meetingToken})\nSession duration: ${affectedRec.duration}`,
        timestamp: 'Just now',
        likes: 0,
        isLiked: false,
        replies: 0,
        reposts: 1,
        isReposted: true,
        repostedByUser: userProfile.name,
        visibility: 'public',
        comments: [],
      };
      setPosts((prev) => [newPost, ...prev]);
    }
  };

  // Add comment to recording
  const handleAddRecordingComment = (recordingId: string, content: string) => {
    const newComment = {
      id: `rec_cmt_${Date.now()}`,
      author: userProfile.name,
      avatar: userProfile.avatar,
      content,
      timestamp: 'Just now',
      likes: 0,
      isLiked: false,
    };
    setRecordings((prev) =>
      prev.map((r) => {
        if (r.id === recordingId) {
          const currentComments = r.comments || [];
          return {
            ...r,
            comments: [...currentComments, newComment],
          };
        }
        return r;
      })
    );
  };

  // Toggle like on recording comment
  const handleToggleRecordingCommentLike = (recordingId: string, commentId: string) => {
    setRecordings((prev) =>
      prev.map((r) => {
        if (r.id === recordingId && r.comments) {
          return {
            ...r,
            comments: r.comments.map((c) => {
              if (c.id === commentId) {
                const isLiked = !c.isLiked;
                return {
                  ...c,
                  isLiked,
                  likes: isLiked ? (c.likes || 0) + 1 : Math.max(0, (c.likes || 0) - 1),
                };
              }
              return c;
            }),
          };
        }
        return r;
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
    <div className="w-full min-h-[100dvh] h-[100dvh] bg-neutral-100/90 text-neutral-900 flex items-center justify-center font-sans antialiased selection:bg-purple-600 selection:text-white overflow-hidden p-0">
      {/* Auto Screen Matching Viewport for Phone & Tablet */}
      <div
        id="app-viewport-container"
        className="relative w-full h-[100dvh] bg-white flex flex-col overflow-hidden max-w-full md:max-w-2xl lg:max-w-3xl xl:max-w-4xl shadow-none md:shadow-2xl md:border-x md:border-neutral-200"
      >
        {/* Active Screen Tab View */}
        <div className="flex-1 w-full min-h-0 relative overflow-hidden flex flex-col">
          {currentTab === 'home' && (
            <MeetingHomeScreen
              userProfile={userProfile}
              rooms={rooms}
              notes={notes}
              recordings={recordings}
              scheduledMeetings={scheduledMeetings}
              dateNotes={dateNotes}
              socialUsers={socialUsers}
              onStartNewMeeting={handleStartNewMeeting}
              onJoinMeeting={handleJoinMeeting}
              onNavigateToProfileTab={handleNavigateToProfileTab}
              onAddScheduledMeeting={handleAddScheduledMeeting}
              onAddDateNote={handleAddDateNote}
              onSelectUser={handleSelectUserFromSearch}
              onSendDirectChatMessage={handleSendDirectChatMessage}
              onNavigateToChatWithUser={(userName) => setCurrentTab('chat')}
            />
          )}

          {currentTab === 'shorts' && (
            <ShortsFeedScreen
              shorts={shorts}
              rooms={rooms}
              userProfile={userProfile}
              onJoinMeeting={handleJoinMeeting}
              onToggleLikeShort={handleToggleLikeShort}
              onToggleBookmarkShort={handleToggleBookmarkShort}
              onToggleRepostShort={handleRepostShort}
              onAddShortComment={handleAddShortComment}
              onCreateShort={handleUploadShort}
              onAddPost={handleAddPost}
              onResetSampleShorts={() => {
                setShorts(initialShorts);
                try {
                  localStorage.setItem('shorts_feed_data', JSON.stringify(initialShorts));
                } catch {}
              }}
            />
          )}

          {currentTab === 'meetings' && (
              <CooMMeetingFeed
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
                onOpenProfile={() => {
                  setViewedUser(null);
                  setCurrentTab('profile');
                }}
                onBackToHome={handleBackToHome}
                comments={comments}
                userProfile={userProfile}
                socialUsers={socialUsers}
                onSelectUser={handleSelectUserFromSearch}
                onAddComment={handleAddComment}
                onToggleLikeComment={handleToggleLikeComment}
                onUpdateSettings={handleUpdateSettings}
              />
            )}

            {currentTab === 'posts' && (
              <XFeedScreen
                posts={posts}
                rooms={rooms}
                initialNewPostText={prefilledPostText}
                onAddPost={handleAddPost}
                onToggleLike={handleToggleLike}
                onToggleRepost={handleToggleRepost}
                onAddComment={handleAddPostComment}
                onToggleCommentLike={handleTogglePostCommentLike}
                currentUser={userProfile}
                onSelectMeetingToken={handleJoinMeeting}
                onGoToMeeting={() => {
                  setActiveRoomToken(activeRoomToken || rooms[0]?.token || 'MEET-001');
                  setCurrentTab('meetings');
                }}
                groups={groups}
                activeGroupId={activeGroupId}
                onSelectGroup={(id) => id && setActiveGroupId(id)}
                onCreateGroup={handleCreateGroup}
                onUpdateGroup={handleUpdateGroup}
                onAddUserToGroup={handleAddUserToGroup}
                onRemoveUserFromGroup={handleRemoveUserFromGroup}
                onRequestJoinGroup={handleRequestJoinGroup}
                onApproveJoinRequest={handleApproveJoinRequest}
                onDeclineJoinRequest={handleDeclineJoinRequest}
                onLeaveGroup={handleLeaveGroup}
                onOpenGroupChat={handleOpenGroupChat}
              />
            )}

            {currentTab === 'chat' && (
              <MeetingChatScreen
                rooms={rooms}
                chats={chats}
                activeRoomToken={activeRoomToken}
                onSendMessage={handleSendMessage}
                onJumpToMeeting={handleJoinMeeting}
                groups={groups}
                activeGroupId={activeGroupId}
                onSelectGroup={(id) => setActiveGroupId(id)}
                groupChats={groupChats}
                currentUser={userProfile}
                onSendGroupMessage={handleSendGroupMessage}
                onToggleGroupReaction={handleToggleGroupReaction}
                onUpdateGroup={handleUpdateGroup}
                onAddUserToGroup={handleAddUserToGroup}
                onRemoveUserFromGroup={handleRemoveUserFromGroup}
                onApproveRequest={handleApproveJoinRequest}
                onDeclineRequest={handleDeclineJoinRequest}
                onLeaveGroup={handleLeaveGroup}
                onCreateGroup={handleCreateGroup}
                onGoToGroupPosts={(groupId) => {
                  setActiveGroupId(groupId);
                  setCurrentTab('posts');
                }}
              />
            )}

            {currentTab === 'profile' && (
              <CooMProfileScreen
                userProfile={userProfile}
                viewedUser={viewedUser}
                onClearViewedUser={() => setViewedUser(null)}
                recordings={recordings}
                notes={notes}
                rooms={rooms}
                posts={posts}
                shorts={shorts}
                socialUsers={socialUsers}
                onToggleFollowUser={handleToggleFollowUser}
                onSimulateIncomingFollow={handleSimulateIncomingFollow}
                onUpdateProfile={handleUpdateProfile}
                onToggleFavoriteRecording={handleToggleFavoriteRecording}
                onToggleLikeRecording={handleToggleLikeRecording}
                onToggleRepostRecording={handleToggleRepostRecording}
                onAddRecordingComment={handleAddRecordingComment}
                onToggleRecordingCommentLike={handleToggleRecordingCommentLike}
                onToggleLikePost={handleToggleLike}
                onToggleRepostPost={handleToggleRepost}
                onAddPostComment={handleAddPostComment}
                onTogglePostCommentLike={handleTogglePostCommentLike}
                onExportToPost={handleExportToFeed}
                initialTab={profileActiveTab}
                onBackToHome={handleBackToHome}
                onJumpToMeeting={handleJoinMeeting}
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
            onSelectTab={(tab) => {
              if (tab === 'profile') {
                setViewedUser(null);
              }
              setCurrentTab(tab);
            }}
            unreadChatsCount={chats.filter((c) => c.sender !== 'Me').length}
            userAvatar={userProfile.avatar}
          />
        </div>
      </div>
    );
  }
