import React, { useState, useRef, useEffect } from 'react';
import {
  UserProfile,
  MeetingRecording,
  MeetingNote,
  MeetingRoom,
  LanguageOption,
  PostItem,
  PostComment,
  SocialUser
} from '../types';
import { languageOptions } from '../data/initialData';
import { SocialFollowModal } from './SocialFollowModal';
import {
  Grid,
  Heart,
  FileText,
  MessageSquareCode,
  Edit3,
  Camera,
  Play,
  Pause,
  Clock,
  Eye,
  Share2,
  Filter,
  ChevronDown,
  Volume2,
  VolumeX,
  X,
  Check,
  UserCheck,
  UserPlus,
  Users,
  Copy,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  ArrowLeft,
  Globe,
  Lock,
  Repeat,
  MessageSquare,
  Send,
  List,
  Layers,
  EyeOff,
  User,
  AtSign
} from 'lucide-react';

interface TikTokProfileScreenProps {
  userProfile: UserProfile;
  viewedUser?: SocialUser | UserProfile | null;
  onClearViewedUser?: () => void;
  recordings: MeetingRecording[];
  notes: MeetingNote[];
  rooms: MeetingRoom[];
  posts?: PostItem[];
  socialUsers?: SocialUser[];
  onToggleFollowUser?: (userId: string) => void;
  onSimulateIncomingFollow?: (userId: string) => void;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onToggleFavoriteRecording: (recordingId: string) => void;
  onToggleLikeRecording?: (recordingId: string) => void;
  onToggleRepostRecording?: (recordingId: string) => void;
  onAddRecordingComment?: (recordingId: string, content: string) => void;
  onToggleRecordingCommentLike?: (recordingId: string, commentId: string) => void;
  onToggleLikePost?: (postId: string) => void;
  onToggleRepostPost?: (postId: string) => void;
  onAddPostComment?: (postId: string, content: string) => void;
  onTogglePostCommentLike?: (postId: string, commentId: string) => void;
  onExportToPost: (content: string) => void;
  onJumpToMeeting?: (token: string) => void;
  initialTab?: ProfileTabType;
  onBackToHome?: () => void;
}

type ProfileTabType = 'recordings' | 'posts' | 'favorites' | 'notes' | 'chats';

export const TikTokProfileScreen: React.FC<TikTokProfileScreenProps> = ({
  userProfile,
  viewedUser,
  onClearViewedUser,
  recordings,
  notes,
  rooms,
  posts = [],
  socialUsers = [],
  onToggleFollowUser,
  onSimulateIncomingFollow,
  onUpdateProfile,
  onToggleFavoriteRecording,
  onToggleLikeRecording,
  onToggleRepostRecording,
  onAddRecordingComment,
  onToggleRecordingCommentLike,
  onToggleLikePost,
  onToggleRepostPost,
  onAddPostComment,
  onTogglePostCommentLike,
  onExportToPost,
  onJumpToMeeting,
  initialTab,
  onBackToHome,
}) => {
  // Tabs: Recordings, Posts, Favourites, Note History, Chat History
  const [activeTab, setActiveTab] = useState<ProfileTabType>(initialTab || 'recordings');

  // Visitor View Simulator (Allows testing how profile looks when others visit)
  const [isVisitorMode, setIsVisitorMode] = useState<boolean>(false);

  // Social Follow modal state
  const [isFollowModalOpen, setIsFollowModalOpen] = useState<boolean>(false);
  const [followModalInitialTab, setFollowModalInitialTab] = useState<'following' | 'followers' | 'discover'>('following');

  // Recording view mode: 'posts' (feed style with like/repost/comment) vs 'grid'
  const [recordingLayout, setRecordingLayout] = useState<'posts' | 'grid'>('posts');

  // Interactive comment expansion for recordings
  const [expandedRecComments, setExpandedRecComments] = useState<string | null>(null);
  const [recCommentInputs, setRecCommentInputs] = useState<Record<string, string>>({});

  // Interactive comment expansion for posts
  const [expandedPostComments, setExpandedPostComments] = useState<string | null>(null);
  const [postCommentInputs, setPostCommentInputs] = useState<Record<string, string>>({});

  // Synchronize when initialTab prop updates
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Edit Profile Modal
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState(userProfile.name);
  const [editHandle, setEditHandle] = useState(userProfile.handle);
  const [editBio, setEditBio] = useState(userProfile.bio);
  const [editAvatar, setEditAvatar] = useState(userProfile.avatar);

  // Hidden file input for photo upload
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Video playback player modal
  const [activePlaybackRecording, setActivePlaybackRecording] = useState<MeetingRecording | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackProgress, setPlaybackProgress] = useState(35);

  // Tab 3 (Note History): Meeting filter ('All' or room token) and selected note detail
  const [selectedNoteMeetingFilter, setSelectedNoteMeetingFilter] = useState<string>('All');
  const [selectedNoteDetail, setSelectedNoteDetail] = useState<MeetingNote | null>(null);

  // Tab 4 (Chat History): Meeting filter ('All' or room token) and selected chat detail
  const [selectedChatMeetingFilter, setSelectedChatMeetingFilter] = useState<string>('All');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('Myanmar (MM)');
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [selectedChatDetailRecording, setSelectedChatDetailRecording] = useState<MeetingRecording | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Determine if we are viewing someone else's profile vs current user's own profile
  const isViewingOtherUser = Boolean(viewedUser && viewedUser.handle !== userProfile.handle);

  // Match social user record if available to check follow state
  const activeSocialUser = React.useMemo(() => {
    if (!viewedUser) return null;
    return (
      socialUsers.find(
        (u) =>
          u.handle.toLowerCase() === viewedUser.handle.toLowerCase() ||
          u.id === (viewedUser as SocialUser).id
      ) || null
    );
  }, [viewedUser, socialUsers]);

  const activeName = isViewingOtherUser ? viewedUser!.name : userProfile.name;
  const activeHandle = isViewingOtherUser ? viewedUser!.handle : userProfile.handle;
  const activeAvatar = isViewingOtherUser ? viewedUser!.avatar : userProfile.avatar;
  const activeBio = isViewingOtherUser
    ? viewedUser!.bio || 'Active participant on TikTok Meeting & Post ⚡'
    : userProfile.bio;

  const activeFollowing = isViewingOtherUser
    ? activeSocialUser
      ? activeSocialUser.followingCount
      : 'following' in viewedUser!
      ? (viewedUser as UserProfile).following
      : 12
    : userProfile.following;

  const activeFollowers = isViewingOtherUser
    ? activeSocialUser
      ? activeSocialUser.followersCount
      : 'followers' in viewedUser!
      ? (viewedUser as UserProfile).followers
      : 25
    : userProfile.followers;

  const activeLikes = isViewingOtherUser ? 142 : userProfile.likes;

  // Recordings shown in user profile:
  // If viewing someone else, show public recordings; otherwise show own recordings
  const allUserRecordings = isViewingOtherUser
    ? recordings.filter((r) => r.visibility !== 'private')
    : recordings.filter(
        (r) => r.isUserRecorded || r.isReposted || r.repostedByUser === userProfile.name
      );

  // If viewing as visitor, hide all private recordings!
  const displayedRecordings =
    isVisitorMode || isViewingOtherUser
      ? allUserRecordings.filter((r) => r.visibility !== 'private')
      : allUserRecordings;

  // Posts shown in user profile: created by user OR reposted by user
  const allUserPosts = isViewingOtherUser
    ? posts.filter(
        (p) =>
          p.author.toLowerCase() === activeName.toLowerCase() ||
          p.handle?.toLowerCase() === activeHandle.toLowerCase()
      )
    : posts.filter(
        (p) => p.author === userProfile.name || p.isReposted || p.repostedByUser === userProfile.name
      );

  // If viewing as visitor, hide all private posts!
  const displayedPosts =
    isVisitorMode || isViewingOtherUser
      ? allUserPosts.filter((p) => p.visibility !== 'private')
      : allUserPosts;

  // Favorited recordings
  const favoriteRecordings = recordings.filter((r) => r.isFavorited);

  // Handle local image file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setEditAvatar(dataUrl);
        onUpdateProfile({ avatar: dataUrl });
        showToast('📸 Profile picture updated successfully!');
      }
    };
    reader.readAsDataURL(file);
  };

  // Save profile changes
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      name: editName.trim() || userProfile.name,
      handle: editHandle.trim().startsWith('@') ? editHandle.trim() : `@${editHandle.trim()}`,
      bio: editBio.trim(),
      avatar: editAvatar,
    });
    setIsEditProfileOpen(false);
    showToast('✅ Profile saved & updated on Main Screen!');
  };

  // Filter notes by meeting token or All
  const filteredNotes = notes.filter((n) =>
    selectedNoteMeetingFilter === 'All' ? true : n.meetingToken === selectedNoteMeetingFilter
  );

  // Filter recordings for Chat History by meeting token or All
  const filteredChatRecordings = recordings.filter((r) =>
    selectedChatMeetingFilter === 'All' ? true : r.meetingToken === selectedChatMeetingFilter
  );

  const handleCopyText = (text: string, id: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopiedId(id);
    showToast('📋 Copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Send recording comment
  const handleSendRecComment = (recId: string) => {
    const text = recCommentInputs[recId]?.trim();
    if (!text) return;
    if (onAddRecordingComment) {
      onAddRecordingComment(recId, text);
    }
    setRecCommentInputs((prev) => ({ ...prev, [recId]: '' }));
    showToast('💬 Comment posted to recording!');
  };

  // Send post comment
  const handleSendPostComment = (postId: string) => {
    const text = postCommentInputs[postId]?.trim();
    if (!text) return;
    if (onAddPostComment) {
      onAddPostComment(postId, text);
    }
    setPostCommentInputs((prev) => ({ ...prev, [postId]: '' }));
    showToast('💬 Comment posted to thread!');
  };

  return (
    <div
      id="tiktok-profile-screen"
      className="relative w-full h-full bg-neutral-50 text-neutral-900 flex flex-col overflow-hidden"
    >
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-white/95 border border-purple-200 text-neutral-900 text-xs font-medium shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-2">
          {toastMessage}
        </div>
      )}

      {/* Hidden Profile Picture File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* 1. TOP BAR */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-neutral-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-sm text-neutral-900 truncate max-w-[220px]">
          {(onBackToHome || onClearViewedUser) && (
            <button
              id="btn-profile-back-home"
              type="button"
              onClick={() => {
                if (isViewingOtherUser && onClearViewedUser) {
                  onClearViewedUser();
                } else if (onBackToHome) {
                  onBackToHome();
                }
              }}
              className="p-1 -ml-1 text-neutral-500 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 transition cursor-pointer flex items-center gap-1"
              title="Back"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="text-xs font-semibold">Back</span>
            </button>
          )}
          <span>{activeHandle}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse" />
        </div>

        <div className="flex items-center gap-2">
          {isViewingOtherUser && onClearViewedUser && (
            <button
              id="btn-switch-to-my-profile"
              type="button"
              onClick={onClearViewedUser}
              className="px-2.5 py-1 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold border border-purple-200 transition cursor-pointer flex items-center gap-1"
              title="Switch to My Profile"
            >
              <User className="w-3 h-3" />
              <span>My Profile</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              showToast('🔗 Profile link copied to clipboard!');
            }}
            className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 transition cursor-pointer"
            title="Share Profile"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SCROLLABLE PROFILE CONTAINER */}
      <div className="flex-1 overflow-y-auto pb-24 divide-y divide-neutral-200 bg-white">
        {/* 2. PROFILE HEADER & EDIT BIO */}
        <div className="p-4 flex flex-col items-center text-center bg-white">
          {/* Avatar */}
          <div
            className={`relative mb-3 ${!isViewingOtherUser ? 'group cursor-pointer' : ''}`}
            onClick={() => {
              if (!isViewingOtherUser) {
                fileInputRef.current?.click();
              }
            }}
          >
            <div className="w-22 h-22 rounded-full p-0.5 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-md">
              <img
                src={activeAvatar}
                alt={activeName}
                className="w-full h-full rounded-full object-cover bg-neutral-100"
              />
            </div>
            {!isViewingOtherUser ? (
              <button
                type="button"
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-2 border-white flex items-center justify-center shadow-md transition active:scale-95 cursor-pointer"
                title="Upload new profile picture"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-md text-white">
                <Check className="w-3 h-3" />
              </span>
            )}
          </div>

          {/* Name & Handle */}
          <h2 className="font-bold text-base text-neutral-900 flex items-center gap-1.5">
            {activeName}
            <UserCheck className="w-4 h-4 text-purple-600" />
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5 font-mono">{activeHandle}</p>

          {/* Stats Row */}
          <div className="flex items-center justify-center gap-6 my-3.5 text-center">
            <button
              id="btn-profile-stats-following"
              type="button"
              onClick={() => {
                setFollowModalInitialTab('following');
                setIsFollowModalOpen(true);
              }}
              className="hover:opacity-75 transition cursor-pointer group text-center"
              title="Click to view following"
            >
              <span className="font-bold text-sm text-neutral-900 block group-hover:text-purple-600 transition">
                {activeFollowing}
              </span>
              <span className="text-[11px] text-neutral-500 group-hover:text-purple-600 transition flex items-center justify-center gap-0.5">
                Following
              </span>
            </button>

            <div className="w-px h-6 bg-neutral-200" />

            <button
              id="btn-profile-stats-followers"
              type="button"
              onClick={() => {
                setFollowModalInitialTab('followers');
                setIsFollowModalOpen(true);
              }}
              className="hover:opacity-75 transition cursor-pointer group text-center"
              title="Click to view followers"
            >
              <span className="font-bold text-sm text-neutral-900 block group-hover:text-purple-600 transition">
                {activeFollowers}
              </span>
              <span className="text-[11px] text-neutral-500 group-hover:text-purple-600 transition flex items-center justify-center gap-0.5">
                Followers
              </span>
            </button>

            <div className="w-px h-6 bg-neutral-200" />

            <div>
              <span className="font-bold text-sm text-neutral-900 block">{activeLikes}</span>
              <span className="text-[11px] text-neutral-500">Likes</span>
            </div>
          </div>

          {/* Action Buttons: Depending on whether viewing another user or self */}
          {isViewingOtherUser ? (
            <div className="flex items-center gap-2 w-full max-w-xs justify-center mb-3">
              <button
                id="btn-toggle-follow-other-user"
                type="button"
                onClick={() => {
                  if (activeSocialUser && onToggleFollowUser) {
                    onToggleFollowUser(activeSocialUser.id);
                    showToast(
                      activeSocialUser.isFollowedByMe
                        ? `Unfollowed ${activeHandle}`
                        : `Now following ${activeHandle}`
                    );
                  } else {
                    showToast(`Follow state updated for ${activeHandle}!`);
                  }
                }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                  activeSocialUser?.isFollowedByMe
                    ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-300'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white'
                }`}
              >
                {activeSocialUser?.isFollowedByMe ? (
                  <>
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Following</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5 text-white" />
                    <span>Follow</span>
                  </>
                )}
              </button>

              <button
                id="btn-mention-user-in-post"
                type="button"
                onClick={() => {
                  onExportToPost(`Hello ${activeHandle} `);
                  showToast(`Composing new post mentioning ${activeHandle}!`);
                }}
                className="py-2 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-xs font-bold text-purple-700 flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                title="Mention in Post"
              >
                <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
                <span>Mention</span>
              </button>

              {onClearViewedUser && (
                <button
                  type="button"
                  onClick={onClearViewedUser}
                  className="py-2 px-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-xs font-semibold text-neutral-700 flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer"
                  title="Return to My Profile"
                >
                  <User className="w-3.5 h-3.5 text-neutral-600" />
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 w-full max-w-xs justify-center mb-3">
              <button
                id="btn-edit-profile-open"
                type="button"
                onClick={() => {
                  setEditName(userProfile.name);
                  setEditHandle(userProfile.handle);
                  setEditBio(userProfile.bio);
                  setEditAvatar(userProfile.avatar);
                  setIsEditProfileOpen(true);
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-xs font-bold text-white flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-xs"
              >
                <Edit3 className="w-3.5 h-3.5 text-white" />
                <span>Edit Profile</span>
              </button>

              <button
                id="btn-profile-connections"
                type="button"
                onClick={() => {
                  setFollowModalInitialTab('discover');
                  setIsFollowModalOpen(true);
                }}
                className="py-2 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-xs font-bold text-purple-700 flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                title="Follow colleagues and manage network"
              >
                <Users className="w-3.5 h-3.5 text-purple-600" />
                <span>Follows</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="py-2 px-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-xs font-semibold text-neutral-700 hover:text-neutral-900 flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer"
                title="Upload Profile Picture"
              >
                <Camera className="w-3.5 h-3.5 text-purple-600" />
                <span>Photo</span>
              </button>
            </div>
          )}

          {/* Bio Display */}
          <div className="w-full max-w-sm bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-xs text-neutral-700 text-left leading-relaxed">
            <p className="line-clamp-3">{activeBio}</p>
          </div>

          {/* Notice or Perspective Switcher */}
          {isViewingOtherUser ? (
            <div className="w-full max-w-sm mt-3 p-2.5 rounded-xl bg-purple-50/90 border border-purple-200 text-[11px] text-purple-800 flex items-center justify-between font-medium">
              <span className="flex items-center gap-1.5 truncate">
                <AtSign className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span className="truncate">Public Profile: <strong>{activeHandle}</strong></span>
              </span>
              {onClearViewedUser && (
                <button
                  type="button"
                  onClick={onClearViewedUser}
                  className="text-[11px] font-bold text-purple-700 underline shrink-0 ml-2 cursor-pointer"
                >
                  My Profile
                </button>
              )}
            </div>
          ) : (
            <div className="w-full max-w-sm mt-3">
              <div className="flex items-center gap-1 p-1 bg-neutral-100/90 rounded-2xl border border-neutral-200 text-xs">
                <button
                  type="button"
                  id="btn-profile-private-view"
                  onClick={() => setIsVisitorMode(false)}
                  className={`flex-1 py-1.5 px-2.5 rounded-xl font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    !isVisitorMode
                      ? 'bg-white text-purple-700 shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Private</span>
                </button>
                <button
                  type="button"
                  id="btn-profile-public-view"
                  onClick={() => setIsVisitorMode(true)}
                  className={`flex-1 py-1.5 px-2.5 rounded-xl font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    isVisitorMode
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Public</span>
                </button>
              </div>
              {isVisitorMode ? (
                <div className="mt-2 p-2 rounded-xl bg-purple-50 border border-purple-200 text-[11px] text-purple-700 flex items-center gap-1.5 font-medium animate-in fade-in">
                  <Globe className="w-3.5 h-3.5 shrink-0 text-purple-600" />
                  <span>Public: Showing public items only. Private recordings and private posts are hidden.</span>
                </div>
              ) : (
                <div className="mt-2 p-2 rounded-xl bg-neutral-100/80 border border-neutral-200 text-[11px] text-neutral-600 flex items-center gap-1.5 font-medium animate-in fade-in">
                  <Lock className="w-3.5 h-3.5 shrink-0 text-neutral-500" />
                  <span>Private: Showing all items including your private notes &amp; recordings.</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. PROFILE TABS ROW: Recordings, Posts, Favourites, Note History, Chat History */}
        <div className="sticky top-[53px] z-10 bg-white/95 backdrop-blur-md border-b border-neutral-200 flex items-center justify-around px-1 overflow-x-auto">
          {/* Tab 1: Recordings */}
          <button
            id="tab-profile-recordings"
            type="button"
            onClick={() => setActiveTab('recordings')}
            className={`flex-1 py-3 px-2 flex flex-col items-center justify-center border-b-2 transition cursor-pointer shrink-0 ${
              activeTab === 'recordings'
                ? 'border-purple-600 text-purple-700 font-bold'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
            title="Recorded Meetings"
          >
            <Grid className="w-4 h-4" />
            <span className="text-[10px] mt-1 whitespace-nowrap">Recordings ({displayedRecordings.length})</span>
          </button>

          {/* Tab 2: Posts (X style public/reposted feed) */}
          <button
            id="tab-profile-posts"
            type="button"
            onClick={() => setActiveTab('posts')}
            className={`flex-1 py-3 px-2 flex flex-col items-center justify-center border-b-2 transition cursor-pointer shrink-0 ${
              activeTab === 'posts'
                ? 'border-purple-600 text-purple-700 font-bold'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
            title="Posts & Reposts"
          >
            <Layers className="w-4 h-4" />
            <span className="text-[10px] mt-1 whitespace-nowrap">Posts ({displayedPosts.length})</span>
          </button>

          {/* Tab 3: Favourite / Love */}
          <button
            id="tab-profile-favorites"
            type="button"
            onClick={() => setActiveTab('favorites')}
            className={`flex-1 py-3 px-2 flex flex-col items-center justify-center border-b-2 transition cursor-pointer shrink-0 ${
              activeTab === 'favorites'
                ? 'border-purple-600 text-purple-700 font-bold'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
            title="Favourites"
          >
            <Heart className={`w-4 h-4 ${activeTab === 'favorites' ? 'fill-purple-600 text-purple-600' : ''}`} />
            <span className="text-[10px] mt-1 whitespace-nowrap">Favourites</span>
          </button>

          {/* Tab 4: Note History */}
          <button
            id="tab-profile-notes"
            type="button"
            onClick={() => setActiveTab('notes')}
            className={`flex-1 py-3 px-2 flex flex-col items-center justify-center border-b-2 transition cursor-pointer shrink-0 ${
              activeTab === 'notes'
                ? 'border-purple-600 text-purple-700 font-bold'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
            title="Note History"
          >
            <FileText className="w-4 h-4" />
            <span className="text-[10px] mt-1 whitespace-nowrap">Notes</span>
          </button>

          {/* Tab 5: Chat History */}
          <button
            id="tab-profile-subtitles"
            type="button"
            onClick={() => setActiveTab('chats')}
            className={`flex-1 py-3 px-2 flex flex-col items-center justify-center border-b-2 transition cursor-pointer shrink-0 ${
              activeTab === 'chats'
                ? 'border-purple-600 text-purple-700 font-bold'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
            title="Chat History"
          >
            <MessageSquareCode className="w-4 h-4" />
            <span className="text-[10px] mt-1 whitespace-nowrap">Chats</span>
          </button>
        </div>

        {/* 4. TAB CONTENTS */}

        {/* TAB 1: RECORDINGS (POST STYLE WITH LIKE / REPOST / COMMENT) */}
        {activeTab === 'recordings' && (
          <div className="p-3 bg-neutral-50 min-h-[300px] flex flex-col gap-3">
            {/* Layout switch: Post Feed style vs Grid */}
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-neutral-700">
                {isVisitorMode ? 'Public Recordings' : 'Meeting Recordings'} ({displayedRecordings.length})
              </span>
              <div className="flex items-center gap-1 bg-white border border-neutral-200 rounded-lg p-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setRecordingLayout('posts')}
                  className={`p-1 rounded-md text-xs transition cursor-pointer ${
                    recordingLayout === 'posts'
                      ? 'bg-purple-100 text-purple-700 font-bold'
                      : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                  title="Post Feed View (Post ပုံစံ)"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setRecordingLayout('grid')}
                  className={`p-1 rounded-md text-xs transition cursor-pointer ${
                    recordingLayout === 'grid'
                      ? 'bg-purple-100 text-purple-700 font-bold'
                      : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                  title="Grid View"
                >
                  <Grid className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {displayedRecordings.length === 0 ? (
              <div className="py-16 text-center text-neutral-400 space-y-2">
                <Grid className="w-10 h-10 text-neutral-300 mx-auto" />
                <p className="text-xs text-neutral-600 font-medium">
                  {isVisitorMode ? 'No public recordings available.' : 'No meetings recorded yet.'}
                </p>
                <p className="text-[11px] text-neutral-400">
                  {isVisitorMode
                    ? 'This user has not shared any public recordings.'
                    : "Tap 'Record' on any active meeting screen to capture a session!"}
                </p>
              </div>
            ) : recordingLayout === 'posts' ? (
              /* POST FEED STYLE (like / repost / comment as requested by user) */
              <div className="space-y-3.5">
                {displayedRecordings.map((rec) => {
                  const isRecCommentsOpen = expandedRecComments === rec.id;
                  const commentsCount = rec.comments?.length || 0;
                  const isReposted = rec.isReposted || rec.repostedByUser === userProfile.name;

                  return (
                    <article
                      key={rec.id}
                      id={`rec-card-${rec.id}`}
                      className="bg-white rounded-2xl border border-neutral-200 p-3.5 shadow-xs flex flex-col gap-2.5 transition hover:border-purple-300"
                    >
                      {/* Repost Header if applicable */}
                      {isReposted && (
                        <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-semibold pl-1">
                          <Repeat className="w-3.5 h-3.5 text-emerald-600" />
                          <span>
                            {rec.repostedByUser
                              ? rec.repostedByUser === userProfile.name
                                ? 'You reposted'
                                : `${rec.repostedByUser} reposted`
                              : 'You reposted'}
                          </span>
                        </div>
                      )}

                      {/* Header Row */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                            {userProfile.name[0]}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-neutral-900 truncate">
                                {userProfile.name}
                              </span>
                              <span className="text-[10px] text-neutral-400">· {rec.date}</span>
                              {/* Visibility Badge */}
                              {rec.visibility === 'private' ? (
                                <span className="flex items-center gap-0.5 text-[9px] font-semibold text-neutral-600 bg-neutral-100 px-1.5 py-0.2 rounded-md border border-neutral-200">
                                  <Lock className="w-2.5 h-2.5 text-neutral-500" />
                                  Private
                                </span>
                              ) : (
                                <span className="flex items-center gap-0.5 text-[9px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded-md border border-purple-200">
                                  <Globe className="w-2.5 h-2.5 text-purple-600" />
                                  Public
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] font-semibold text-neutral-800 truncate">
                              {rec.title}
                            </p>
                          </div>
                        </div>

                        {/* Meeting Token Pill */}
                        <button
                          type="button"
                          onClick={() => onJumpToMeeting?.(rec.meetingToken)}
                          className="px-2 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 font-mono text-[11px] font-semibold hover:bg-purple-100 transition shrink-0 cursor-pointer"
                        >
                          {rec.meetingToken}
                        </button>
                      </div>

                      {/* Video Player Preview Banner */}
                      <div
                        onClick={() => setActivePlaybackRecording(rec)}
                        className="relative w-full aspect-video rounded-xl overflow-hidden bg-neutral-900 group cursor-pointer shadow-xs"
                      >
                        <img
                          src={rec.thumbnailUrl}
                          alt={rec.title}
                          className="w-full h-full object-cover group-hover:scale-103 transition duration-300 opacity-90"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30 flex items-center justify-center">
                          <div className="w-11 h-11 rounded-full bg-purple-600/90 hover:bg-purple-600 text-white flex items-center justify-center shadow-lg transition transform group-hover:scale-110">
                            <Play className="w-5 h-5 fill-white ml-0.5" />
                          </div>
                        </div>
                        <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-[11px] text-white">
                          <span className="flex items-center gap-1 font-medium bg-black/50 px-2 py-0.5 rounded-md backdrop-blur-xs">
                            <Eye className="w-3.5 h-3.5 text-purple-300" />
                            {rec.views} views
                          </span>
                          <span className="font-mono bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-xs text-[10px]">
                            {rec.duration}
                          </span>
                        </div>
                      </div>

                      {/* X-style Action Row: Like, Repost, Comment, Share */}
                      <div className="flex items-center justify-between pt-1 border-t border-neutral-100 text-neutral-500 text-xs px-2">
                        {/* Comments Button */}
                        <button
                          type="button"
                          id={`btn-rec-comments-${rec.id}`}
                          onClick={() =>
                            setExpandedRecComments((prev) => (prev === rec.id ? null : rec.id))
                          }
                          className={`flex items-center gap-1.5 transition cursor-pointer ${
                            isRecCommentsOpen ? 'text-purple-600 font-bold' : 'hover:text-purple-600'
                          }`}
                          title="Comments"
                        >
                          <MessageSquare className="w-4 h-4 text-purple-500" />
                          <span>{commentsCount}</span>
                        </button>

                        {/* Repost Button */}
                        <button
                          type="button"
                          id={`btn-rec-repost-${rec.id}`}
                          onClick={() => {
                            if (onToggleRepostRecording) {
                              onToggleRepostRecording(rec.id);
                              showToast(isReposted ? 'Removed repost' : '🔁 Reposted recording to profile!');
                            }
                          }}
                          className={`flex items-center gap-1.5 transition cursor-pointer ${
                            isReposted ? 'text-emerald-600 font-bold' : 'hover:text-emerald-600'
                          }`}
                          title={isReposted ? 'Undo repost' : 'Repost recording'}
                        >
                          <Repeat className={`w-4 h-4 ${isReposted ? 'text-emerald-600' : ''}`} />
                          <span>{rec.reposts || 0}</span>
                        </button>

                        {/* Like Button */}
                        <button
                          type="button"
                          id={`btn-rec-like-${rec.id}`}
                          onClick={() => {
                            if (onToggleLikeRecording) {
                              onToggleLikeRecording(rec.id);
                            } else {
                              onToggleFavoriteRecording(rec.id);
                            }
                          }}
                          className={`flex items-center gap-1.5 transition cursor-pointer ${
                            rec.isLiked || rec.isFavorited ? 'text-rose-600 font-bold' : 'hover:text-rose-600'
                          }`}
                          title="Like"
                        >
                          <Heart
                            className={`w-4 h-4 ${
                              rec.isLiked || rec.isFavorited
                                ? 'fill-rose-600 text-rose-600'
                                : 'text-neutral-400'
                            }`}
                          />
                          <span>{rec.likes || 0}</span>
                        </button>

                        {/* Share Button */}
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(window.location.href);
                            showToast('🔗 Recording link copied!');
                          }}
                          className="flex items-center gap-1 hover:text-purple-600 transition cursor-pointer"
                          title="Share"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Interactive Comments Drawer for Recording */}
                      {isRecCommentsOpen && (
                        <div className="mt-2 p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex flex-col gap-2.5 animate-in fade-in-50 duration-150">
                          <span className="text-[11px] font-bold text-neutral-700">
                            Recording Comments & Feedback
                          </span>

                          {rec.comments && rec.comments.length > 0 ? (
                            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                              {rec.comments.map((cmt: PostComment) => (
                                <div
                                  key={cmt.id}
                                  className="bg-white rounded-xl p-2 border border-neutral-200 text-xs shadow-2xs flex flex-col gap-1"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                      <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-[10px]">
                                        {cmt.author[0]}
                                      </div>
                                      <span className="font-bold text-neutral-800 text-[11px]">{cmt.author}</span>
                                      <span className="text-[10px] text-neutral-400">· {cmt.timestamp}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => onToggleRecordingCommentLike?.(rec.id, cmt.id)}
                                      className={`flex items-center gap-1 text-[11px] ${
                                        cmt.isLiked ? 'text-rose-600 font-bold' : 'text-neutral-400 hover:text-rose-600'
                                      }`}
                                    >
                                      <Heart className={`w-3 h-3 ${cmt.isLiked ? 'fill-rose-600 text-rose-600' : ''}`} />
                                      <span>{cmt.likes || 0}</span>
                                    </button>
                                  </div>
                                  <p className="text-neutral-700 text-[11px] leading-relaxed pl-6">{cmt.content}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[11px] text-neutral-400 italic">No comments yet. Write the first feedback!</p>
                          )}

                          {/* Add Comment Input */}
                          <div className="flex items-center gap-1.5 pt-1">
                            <input
                              type="text"
                              placeholder="Write a comment on this recording..."
                              value={recCommentInputs[rec.id] || ''}
                              onChange={(e) =>
                                setRecCommentInputs((prev) => ({ ...prev, [rec.id]: e.target.value }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSendRecComment(rec.id);
                                }
                              }}
                              className="flex-1 bg-white border border-neutral-300 rounded-xl px-2.5 py-1.5 text-xs text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-purple-600"
                            />
                            <button
                              type="button"
                              onClick={() => handleSendRecComment(rec.id)}
                              disabled={!recCommentInputs[rec.id]?.trim()}
                              className="p-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white transition cursor-pointer"
                              title="Send"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            ) : (
              /* GRID STYLE */
              <div className="grid grid-cols-3 gap-2">
                {displayedRecordings.map((rec) => (
                  <div
                    key={rec.id}
                    onClick={() => setActivePlaybackRecording(rec)}
                    className="relative aspect-[3/4] bg-neutral-100 rounded-xl overflow-hidden group cursor-pointer border border-neutral-200 hover:border-purple-400 transition shadow-xs"
                  >
                    <img
                      src={rec.thumbnailUrl}
                      alt={rec.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                    <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-md text-[9px] font-mono text-purple-300 border border-purple-500/30 flex items-center gap-1">
                      {rec.visibility === 'private' ? <Lock className="w-2.5 h-2.5 text-yellow-300" /> : <Globe className="w-2.5 h-2.5 text-purple-300" />}
                      <span>{rec.meetingToken}</span>
                    </div>
                    <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between text-[10px] text-white">
                      <span className="flex items-center gap-1 font-medium">
                        <Play className="w-3 h-3 fill-purple-400 text-purple-400" />
                        {rec.views}
                      </span>
                      <span className="font-mono text-neutral-300 text-[9px]">{rec.duration}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: POSTS & REPOSTS (X style profile view as requested by user) */}
        {activeTab === 'posts' && (
          <div className="p-3 bg-neutral-50 min-h-[300px] flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-neutral-700">
                {isVisitorMode ? 'Public Posts' : 'My Posts & Reposts'} ({displayedPosts.length})
              </span>
            </div>

            {displayedPosts.length === 0 ? (
              <div className="py-16 text-center text-neutral-400 space-y-2">
                <Layers className="w-10 h-10 text-neutral-300 mx-auto" />
                <p className="text-xs text-neutral-600 font-medium">
                  {isVisitorMode ? 'No public posts available.' : 'No posts published yet.'}
                </p>
                <p className="text-[11px] text-neutral-400">
                  {isVisitorMode
                    ? 'This user has no public posts visible to visitors.'
                    : 'Publish notes or highlights from the Posts feed to see them here!'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {displayedPosts.map((post) => {
                  const isPostCommentsOpen = expandedPostComments === post.id;
                  const commentsCount = (post.comments ? post.comments.length : post.replies) || 0;
                  const isReposted = post.isReposted || post.repostedByUser === userProfile.name;

                  return (
                    <article
                      key={post.id}
                      id={`profile-post-${post.id}`}
                      className="bg-white rounded-2xl border border-neutral-200 p-3.5 shadow-xs flex flex-col gap-2 transition hover:border-purple-300"
                    >
                      {/* Repost Header if user reposted it */}
                      {isReposted && (
                        <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-semibold pl-1">
                          <Repeat className="w-3.5 h-3.5 text-emerald-600" />
                          <span>
                            {post.repostedByUser
                              ? post.repostedByUser === userProfile.name
                                ? 'You reposted'
                                : `${post.repostedByUser} reposted`
                              : 'You reposted'}
                          </span>
                        </div>
                      )}

                      {/* Header */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                            {post.author[0]}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-neutral-900 truncate">
                                {post.author}
                              </span>
                              <span className="text-[10px] text-neutral-400">· {post.timestamp}</span>
                              {/* Visibility Badge */}
                              {post.visibility === 'private' ? (
                                <span className="flex items-center gap-0.5 text-[9px] font-semibold text-neutral-600 bg-neutral-100 px-1.5 py-0.2 rounded-md border border-neutral-200">
                                  <Lock className="w-2.5 h-2.5 text-neutral-500" />
                                  Private
                                </span>
                              ) : (
                                <span className="flex items-center gap-0.5 text-[9px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded-md border border-purple-200">
                                  <Globe className="w-2.5 h-2.5 text-purple-600" />
                                  Public
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-neutral-500">
                              @{post.author.replace(/\s+/g, '').toLowerCase()}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => onJumpToMeeting?.(post.meetingToken)}
                          className="px-2 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 font-mono text-[11px] font-semibold hover:bg-purple-100 transition shrink-0 cursor-pointer"
                        >
                          {post.meetingToken}
                        </button>
                      </div>

                      {/* Content */}
                      <p className="text-xs text-neutral-800 leading-relaxed whitespace-pre-line pl-1">
                        {post.content}
                      </p>

                      {/* X Action Buttons */}
                      <div className="flex items-center justify-between pt-1 border-t border-neutral-100 text-neutral-500 text-xs px-2">
                        {/* Comments Button */}
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedPostComments((prev) => (prev === post.id ? null : post.id))
                          }
                          className={`flex items-center gap-1.5 transition cursor-pointer ${
                            isPostCommentsOpen ? 'text-purple-600 font-bold' : 'hover:text-purple-600'
                          }`}
                        >
                          <MessageSquare className="w-4 h-4 text-purple-500" />
                          <span>{commentsCount}</span>
                        </button>

                        {/* Repost Button */}
                        <button
                          type="button"
                          onClick={() => {
                            if (onToggleRepostPost) {
                              onToggleRepostPost(post.id);
                              showToast(isReposted ? 'Removed repost' : '🔁 Reposted to your profile!');
                            }
                          }}
                          className={`flex items-center gap-1.5 transition cursor-pointer ${
                            isReposted ? 'text-emerald-600 font-bold' : 'hover:text-emerald-600'
                          }`}
                        >
                          <Repeat className={`w-4 h-4 ${isReposted ? 'text-emerald-600' : ''}`} />
                          <span>{post.reposts || 0}</span>
                        </button>

                        {/* Like Button */}
                        <button
                          type="button"
                          onClick={() => onToggleLikePost?.(post.id)}
                          className={`flex items-center gap-1.5 transition cursor-pointer ${
                            post.isLiked ? 'text-rose-600 font-bold' : 'hover:text-rose-600'
                          }`}
                        >
                          <Heart
                            className={`w-4 h-4 ${
                              post.isLiked ? 'fill-rose-600 text-rose-600' : 'text-neutral-400'
                            }`}
                          />
                          <span>{post.likes || 0}</span>
                        </button>

                        {/* Share */}
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(window.location.href);
                            showToast('🔗 Post link copied!');
                          }}
                          className="flex items-center gap-1 hover:text-purple-600 transition cursor-pointer"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Interactive Comments Drawer for Post */}
                      {isPostCommentsOpen && (
                        <div className="mt-2 p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex flex-col gap-2 animate-in fade-in-50 duration-150">
                          <span className="text-[11px] font-bold text-neutral-700">Comments</span>

                          {post.comments && post.comments.length > 0 ? (
                            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                              {post.comments.map((cmt: PostComment) => (
                                <div
                                  key={cmt.id}
                                  className="bg-white rounded-xl p-2 border border-neutral-200 text-xs shadow-2xs flex flex-col gap-1"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                      <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-[10px]">
                                        {cmt.author[0]}
                                      </div>
                                      <span className="font-bold text-neutral-800 text-[11px]">{cmt.author}</span>
                                      <span className="text-[10px] text-neutral-400">· {cmt.timestamp}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => onTogglePostCommentLike?.(post.id, cmt.id)}
                                      className={`flex items-center gap-1 text-[11px] ${
                                        cmt.isLiked ? 'text-rose-600 font-bold' : 'text-neutral-400 hover:text-rose-600'
                                      }`}
                                    >
                                      <Heart className={`w-3 h-3 ${cmt.isLiked ? 'fill-rose-600 text-rose-600' : ''}`} />
                                      <span>{cmt.likes || 0}</span>
                                    </button>
                                  </div>
                                  <p className="text-neutral-700 text-[11px] leading-relaxed pl-6">{cmt.content}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[11px] text-neutral-400 italic">No replies yet.</p>
                          )}

                          <div className="flex items-center gap-1.5 pt-1">
                            <input
                              type="text"
                              placeholder="Write a reply..."
                              value={postCommentInputs[post.id] || ''}
                              onChange={(e) =>
                                setPostCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSendPostComment(post.id);
                                }
                              }}
                              className="flex-1 bg-white border border-neutral-300 rounded-xl px-2.5 py-1.5 text-xs text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-purple-600"
                            />
                            <button
                              type="button"
                              onClick={() => handleSendPostComment(post.id)}
                              disabled={!postCommentInputs[post.id]?.trim()}
                              className="p-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white transition cursor-pointer"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: FAVOURITES */}
        {activeTab === 'favorites' && (
          <div className="p-3 bg-neutral-50 min-h-[300px]">
            {favoriteRecordings.length === 0 ? (
              <div className="py-16 text-center text-neutral-400 space-y-2">
                <Heart className="w-10 h-10 text-neutral-300 mx-auto" />
                <p className="text-xs text-neutral-600 font-medium">No favourite meetings saved.</p>
                <p className="text-[11px] text-neutral-400">
                  Tap the heart icon on any recording to save it to your favourites.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {favoriteRecordings.map((rec) => (
                  <div
                    key={rec.id}
                    onClick={() => setActivePlaybackRecording(rec)}
                    className="relative aspect-[3/4] bg-neutral-100 rounded-xl overflow-hidden group cursor-pointer border border-neutral-200 hover:border-purple-400 transition shadow-xs"
                  >
                    <img
                      src={rec.thumbnailUrl}
                      alt={rec.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                    <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-md text-[9px] font-mono text-purple-300 border border-purple-500/30">
                      {rec.meetingToken}
                    </div>
                    <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between text-[10px] text-white">
                      <span className="flex items-center gap-1 font-medium">
                        <Heart className="w-3 h-3 fill-purple-400 text-purple-400" />
                        {rec.likes}
                      </span>
                      <span className="font-mono text-neutral-300 text-[9px]">{rec.duration}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: NOTE HISTORY (All or Meeting Filter with click-to-view detail) */}
        {activeTab === 'notes' && (
          <div className="p-3 space-y-3 bg-neutral-50 min-h-[300px]">
            {/* Meeting Filter Dropdown */}
            <div className="bg-white p-2.5 rounded-xl border border-neutral-200 shadow-xs flex items-center justify-between gap-2">
              <label className="text-xs text-neutral-600 font-medium flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-purple-600" />
                <span>Filter:</span>
              </label>
              <div className="relative flex-1 max-w-[220px]">
                <select
                  id="select-profile-notes-filter"
                  value={selectedNoteMeetingFilter}
                  onChange={(e) => setSelectedNoteMeetingFilter(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1 text-xs text-neutral-800 font-medium focus:outline-none focus:ring-1 focus:ring-purple-500 appearance-none pr-6 cursor-pointer truncate"
                >
                  <option value="All">All Meetings ({notes.length} notes)</option>
                  {rooms.map((r) => {
                    const count = notes.filter((n) => n.meetingToken === r.token).length;
                    return (
                      <option key={r.token} value={r.token}>
                        {r.token} · {r.title.slice(0, 16)}... ({count})
                      </option>
                    );
                  })}
                </select>
                <ChevronDown className="w-3 h-3 text-neutral-500 absolute right-2 top-2 pointer-events-none" />
              </div>
            </div>

            {/* Note List */}
            {filteredNotes.length === 0 ? (
              <div className="py-16 text-center text-neutral-400 space-y-2">
                <FileText className="w-10 h-10 text-neutral-300 mx-auto" />
                <p className="text-xs text-neutral-600 font-medium">No notes available.</p>
                <p className="text-[11px] text-neutral-400">
                  Write notes directly inside meeting rooms.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredNotes.map((note) => (
                  <div
                    key={note.id}
                    onClick={() => setSelectedNoteDetail(note)}
                    className="bg-white border border-neutral-200 hover:border-purple-300 rounded-xl p-3 space-y-2 shadow-xs transition cursor-pointer group"
                  >
                    {/* Meeting Title & Category */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded">
                          {note.meetingToken}
                        </span>
                        <span className="text-[11px] text-neutral-500 font-medium truncate max-w-[180px]">
                          {note.meetingTitle}
                        </span>
                      </div>
                      <span className="text-[10px] text-neutral-400 shrink-0">{note.timestamp}</span>
                    </div>

                    {/* Note Title */}
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-neutral-900 group-hover:text-purple-700 transition">
                        {note.title}
                      </h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200 font-medium">
                        {note.category}
                      </span>
                    </div>

                    {/* Preview snippet */}
                    <p className="text-[11px] text-neutral-600 line-clamp-2 leading-relaxed">
                      {note.content || (note.keyPoints || []).join(' • ')}
                    </p>

                    {/* Footer click hint */}
                    <div className="flex items-center justify-between pt-1 border-t border-neutral-100 text-[10px] text-neutral-400 group-hover:text-purple-600 transition">
                      <span>Click to view details</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: CHAT HISTORY (All or Meeting Filter with click-to-view detail) */}
        {activeTab === 'chats' && (
          <div className="p-3 space-y-3 bg-neutral-50 min-h-[300px]">
            {/* Top Controls: Meeting Filter & Language Selector */}
            <div className="bg-white p-2.5 rounded-xl border border-neutral-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs text-neutral-600 font-medium flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-purple-600" />
                  <span>Filter:</span>
                </label>
                <div className="relative flex-1 max-w-[220px]">
                  <select
                    id="select-profile-chat-filter"
                    value={selectedChatMeetingFilter}
                    onChange={(e) => setSelectedChatMeetingFilter(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1 text-xs text-neutral-800 font-medium focus:outline-none focus:ring-1 focus:ring-purple-500 appearance-none pr-6 cursor-pointer truncate"
                  >
                    <option value="All">All Meetings ({recordings.length} sessions)</option>
                    {recordings.map((r) => (
                      <option key={r.id} value={r.meetingToken}>
                        {r.meetingToken} · {r.title.slice(0, 16)}...
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3 h-3 text-neutral-500 absolute right-2 top-2 pointer-events-none" />
                </div>
              </div>

              {/* Language Selector */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-neutral-100">
                <label className="text-xs text-neutral-600 font-medium flex items-center gap-1.5">
                  <MessageSquareCode className="w-3.5 h-3.5 text-purple-600" />
                  <span>Language:</span>
                </label>
                <div className="relative">
                  <select
                    id="select-chat-history-language"
                    value={selectedLanguage}
                    onChange={(e) => {
                      setSelectedLanguage(e.target.value);
                      showToast(`Language: ${e.target.value}`);
                    }}
                    className="bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1 text-xs text-neutral-800 font-medium focus:outline-none appearance-none pr-6 cursor-pointer"
                  >
                    {languageOptions.map((lang) => (
                      <option key={lang.code} value={lang.name}>
                        {lang.flag} {lang.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3 h-3 text-neutral-500 absolute right-2 top-2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Chat Sessions List (Meeting-by-meeting or All) */}
            {filteredChatRecordings.length === 0 ? (
              <div className="py-16 text-center text-neutral-400 space-y-2">
                <MessageSquareCode className="w-10 h-10 text-neutral-300 mx-auto" />
                <p className="text-xs text-neutral-600 font-medium">No chat history recorded.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredChatRecordings.map((rec) => (
                  <div
                    key={rec.id}
                    className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-xs"
                  >
                    {/* Meeting Session Header */}
                    <div
                      onClick={() => setSelectedChatDetailRecording(rec)}
                      className="p-3 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between cursor-pointer hover:bg-neutral-100 transition"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded">
                          {rec.meetingToken}
                        </span>
                        <span className="text-xs font-semibold text-neutral-900 truncate max-w-[180px]">
                          {rec.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-purple-600 font-semibold">
                        <span>View ({rec.subtitles?.length || 0})</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    {/* Chat Messages Stream for this Meeting */}
                    <div className="p-3 space-y-2.5">
                      {rec.subtitles && rec.subtitles.length > 0 ? (
                        rec.subtitles.slice(0, 3).map((sub) => {
                          const translatedText =
                            sub.textByLang[selectedLanguage] ||
                            sub.textByLang['English (US)'] ||
                            Object.values(sub.textByLang)[0] ||
                            '';

                          return (
                            <div
                              key={sub.id}
                              className={`flex gap-2 items-start ${sub.isMe ? 'flex-row-reverse' : 'flex-row'}`}
                            >
                              <img
                                src={sub.avatar}
                                alt={sub.speaker}
                                className="w-7 h-7 rounded-full object-cover shrink-0 border border-neutral-200 mt-0.5"
                              />
                              <div
                                className={`max-w-[80%] rounded-2xl p-2.5 shadow-xs text-xs ${
                                  sub.isMe
                                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-tr-xs'
                                    : 'bg-neutral-100 border border-neutral-200 text-neutral-800 rounded-tl-xs'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <span className={`font-bold text-[11px] ${sub.isMe ? 'text-white' : 'text-neutral-700'}`}>
                                    {sub.speaker}
                                  </span>
                                  <span className={`text-[9px] font-mono ${sub.isMe ? 'text-purple-100' : 'text-neutral-400'}`}>{sub.time}</span>
                                </div>
                                <p className="leading-relaxed">{translatedText}</p>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-xs text-neutral-400 text-center py-2">No messages recorded</p>
                      )}

                      {rec.subtitles && rec.subtitles.length > 3 && (
                        <button
                          type="button"
                          onClick={() => setSelectedChatDetailRecording(rec)}
                          className="w-full py-1.5 text-center text-[11px] text-purple-600 font-medium hover:underline cursor-pointer"
                        >
                          View all {rec.subtitles.length} messages...
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. INDIVIDUAL NOTE HISTORY DETAIL MODAL */}
      {selectedNoteDetail && (
        <div
          id="note-detail-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 animate-in fade-in"
          onClick={() => setSelectedNoteDetail(null)}
        >
          <div
            id="note-detail-modal-container"
            className="w-full max-w-md bg-white border border-neutral-200 rounded-2xl overflow-hidden text-neutral-900 shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-3.5 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">
                  {selectedNoteDetail.meetingToken}
                </span>
                <span className="text-xs text-neutral-700 truncate max-w-[180px] font-medium">
                  {selectedNoteDetail.meetingTitle}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNoteDetail(null)}
                className="w-7 h-7 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 hover:text-neutral-900 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-3 overflow-y-auto flex-1">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-semibold">
                    {selectedNoteDetail.category}
                  </span>
                  <span className="text-[10px] text-neutral-400">{selectedNoteDetail.timestamp}</span>
                </div>
                <h3 className="text-base font-bold text-neutral-900 mt-1.5">{selectedNoteDetail.title}</h3>
              </div>

              {/* Note Content / Key Points */}
              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 space-y-2">
                <h5 className="text-xs font-bold text-purple-700 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-purple-600" />
                  <span>Note Content &amp; Points:</span>
                </h5>

                {selectedNoteDetail.keyPoints && selectedNoteDetail.keyPoints.length > 0 ? (
                  <ul className="space-y-1.5 text-xs text-neutral-800 leading-relaxed pl-1">
                    {selectedNoteDetail.keyPoints.map((pt, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-purple-600 mt-0.5">•</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-neutral-800 whitespace-pre-wrap leading-relaxed">
                    {selectedNoteDetail.content}
                  </p>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-3 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() =>
                  handleCopyText(
                    `${selectedNoteDetail.title} (${selectedNoteDetail.meetingToken}):\n\n${(selectedNoteDetail.keyPoints || []).map((p) => `• ${p}`).join('\n') || selectedNoteDetail.content}`,
                    selectedNoteDetail.id
                  )
                }
                className="px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 hover:text-neutral-900 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                {copiedId === selectedNoteDetail.id ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>Copy</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const postContent = `📝 Note from ${selectedNoteDetail.meetingToken} (${selectedNoteDetail.title}):\n• ${(selectedNoteDetail.keyPoints || []).join('\n• ')}`;
                  onExportToPost(postContent);
                  setSelectedNoteDetail(null);
                  showToast('📤 Exported to Post!');
                }}
                className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Export to Post</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. INDIVIDUAL CHAT HISTORY DETAIL MODAL */}
      {selectedChatDetailRecording && (
        <div
          id="chat-detail-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 animate-in fade-in"
          onClick={() => setSelectedChatDetailRecording(null)}
        >
          <div
            id="chat-detail-modal-container"
            className="w-full max-w-md bg-white border border-neutral-200 rounded-2xl overflow-hidden text-neutral-900 shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-3.5 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">
                  {selectedChatDetailRecording.meetingToken}
                </span>
                <span className="text-xs text-neutral-700 truncate max-w-[180px] font-medium">
                  {selectedChatDetailRecording.title}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedChatDetailRecording(null)}
                className="w-7 h-7 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 hover:text-neutral-900 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat list */}
            <div className="p-4 space-y-3 overflow-y-auto flex-1">
              {selectedChatDetailRecording.subtitles && selectedChatDetailRecording.subtitles.length > 0 ? (
                selectedChatDetailRecording.subtitles.map((sub) => {
                  const translatedText =
                    sub.textByLang[selectedLanguage] ||
                    sub.textByLang['English (US)'] ||
                    Object.values(sub.textByLang)[0] ||
                    '';

                  const isPlayingAudio = playingAudioId === sub.id;

                  return (
                    <div
                      key={sub.id}
                      className={`flex gap-2.5 items-start ${sub.isMe ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      <img
                        src={sub.avatar}
                        alt={sub.speaker}
                        className="w-8 h-8 rounded-full object-cover shrink-0 border border-neutral-200 mt-0.5"
                      />
                      <div
                        className={`max-w-[80%] rounded-2xl p-3 shadow-xs ${
                          sub.isMe
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-tr-xs'
                            : 'bg-neutral-100 border border-neutral-200 text-neutral-800 rounded-tl-xs'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className={`text-xs font-bold ${sub.isMe ? 'text-white' : 'text-neutral-800'}`}>
                            {sub.speaker}
                          </span>
                          <span className={`text-[10px] font-mono ${sub.isMe ? 'text-purple-100' : 'text-neutral-400'}`}>{sub.time}</span>
                        </div>

                        <p className="text-xs leading-relaxed font-sans">
                          {translatedText}
                        </p>

                        <div className="flex items-center justify-end gap-2 mt-2 pt-1 border-t border-black/5">
                          <button
                            type="button"
                            onClick={() => {
                              if (isPlayingAudio) {
                                setPlayingAudioId(null);
                              } else {
                                setPlayingAudioId(sub.id);
                                setTimeout(() => setPlayingAudioId(null), 3000);
                              }
                            }}
                            className={`flex items-center gap-1 text-[10px] font-medium transition cursor-pointer ${
                              sub.isMe ? 'text-purple-100 hover:text-white' : 'text-purple-600 hover:text-purple-700'
                            }`}
                          >
                            {isPlayingAudio ? (
                              <>
                                <VolumeX className="w-3 h-3 animate-pulse" />
                                <span>Stop Audio</span>
                              </>
                            ) : (
                              <>
                                <Volume2 className="w-3 h-3" />
                                <span>Listen ({selectedLanguage.slice(0, 7)})</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-neutral-400 text-center py-10">No messages in this chat history.</p>
              )}
            </div>

            <div className="p-3 bg-neutral-50 border-t border-neutral-200 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedChatDetailRecording(null)}
                className="px-4 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. EDIT PROFILE MODAL */}
      {isEditProfileOpen && (
        <div
          id="edit-profile-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={() => setIsEditProfileOpen(false)}
        >
          <div
            id="edit-profile-modal-container"
            className="w-full max-w-sm bg-white border border-neutral-200 rounded-2xl p-5 text-neutral-900 shadow-2xl animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-purple-600" />
                <h3 className="font-bold text-sm text-neutral-900">Edit TikTok Profile</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-900 rounded-full hover:bg-neutral-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="mt-4 space-y-3.5">
              {/* Profile Image Preview & Upload Button */}
              <div className="flex items-center gap-3">
                <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-purple-500 shrink-0">
                  <img src={editAvatar} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 space-y-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-xs font-semibold text-neutral-700 hover:text-neutral-900 flex items-center gap-1.5 transition"
                  >
                    <Camera className="w-3.5 h-3.5 text-purple-600" />
                    <span>Upload New Photo</span>
                  </button>
                  <p className="text-[10px] text-neutral-400">Supports PNG, JPG, or WebP</p>
                </div>
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-xs text-neutral-600 mb-1 font-medium">Display Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-900 focus:border-purple-500 outline-none"
                />
              </div>

              {/* Username Handle */}
              <div>
                <label className="block text-xs text-neutral-600 mb-1 font-medium">Handle</label>
                <input
                  type="text"
                  required
                  value={editHandle}
                  onChange={(e) => setEditHandle(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-900 focus:border-purple-500 outline-none font-mono"
                />
              </div>

              {/* Bio Field */}
              <div>
                <label className="block text-xs text-neutral-600 mb-1 font-medium">Bio</label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Introduce yourself, meeting roles, or topics you host..."
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-xs text-neutral-900 focus:border-purple-500 outline-none resize-none leading-relaxed"
                />
              </div>

              {/* Buttons */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="flex-1 py-2 rounded-xl text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn-save-profile"
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. INTERACTIVE VIDEO PLAYBACK MODAL */}
      {activePlaybackRecording && (
        <div
          id="video-playback-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 animate-in fade-in"
          onClick={() => setActivePlaybackRecording(null)}
        >
          <div
            id="video-playback-modal-container"
            className="w-full max-w-sm bg-white border border-neutral-200 rounded-2xl overflow-hidden text-neutral-900 shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Playback Header */}
            <div className="p-3 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between">
              <div className="flex items-center gap-1.5 truncate">
                <span className="font-mono text-xs font-bold text-purple-700">
                  {activePlaybackRecording.meetingToken}
                </span>
                <span className="text-neutral-400">·</span>
                <span className="text-xs font-semibold text-neutral-900 truncate">
                  {activePlaybackRecording.title}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActivePlaybackRecording(null)}
                className="p-1 rounded-full text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Video Canvas Simulation */}
            <div className="relative aspect-[4/3] bg-neutral-900 overflow-hidden flex items-center justify-center">
              <img
                src={activePlaybackRecording.thumbnailUrl}
                alt={activePlaybackRecording.title}
                className="w-full h-full object-cover opacity-80"
              />

              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/10 to-transparent pointer-events-none" />

              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-12 h-12 rounded-full bg-black/70 hover:bg-black/90 text-white flex items-center justify-center border border-white/20 backdrop-blur-md transition active:scale-95 shadow-2xl"
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>

              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/90 to-transparent">
                <div
                  className="w-full bg-neutral-700/60 h-1.5 rounded-full overflow-hidden cursor-pointer"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    setPlaybackProgress(Math.max(5, Math.min(95, Math.round((clickX / rect.width) * 100))));
                  }}
                >
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all" style={{ width: `${playbackProgress}%` }} />
                </div>
                <div className="flex items-center justify-between text-[9px] text-neutral-300 font-mono mt-1">
                  <span>01:34</span>
                  <span>{activePlaybackRecording.duration}</span>
                </div>
              </div>
            </div>

            {/* Playback Content Details & Actions */}
            <div className="p-3.5 space-y-3 overflow-y-auto max-h-[300px] bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onToggleFavoriteRecording(activePlaybackRecording.id)}
                    className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition cursor-pointer ${
                      activePlaybackRecording.isFavorited
                        ? 'bg-purple-50 text-purple-700 border-purple-200 font-semibold'
                        : 'bg-neutral-100 text-neutral-600 border-neutral-200 hover:text-neutral-900'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${activePlaybackRecording.isFavorited ? 'fill-purple-600 text-purple-600' : ''}`} />
                    <span>{activePlaybackRecording.likes}</span>
                  </button>

                  <span className="text-[11px] text-neutral-500 flex items-center gap-1 font-mono">
                    <Eye className="w-3.5 h-3.5" /> {activePlaybackRecording.views} views
                  </span>
                </div>

                {onJumpToMeeting && (
                  <button
                    type="button"
                    onClick={() => {
                      onJumpToMeeting(activePlaybackRecording.meetingToken);
                      setActivePlaybackRecording(null);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold transition shadow-xs"
                  >
                    Jump to Live
                  </button>
                )}
              </div>

              {/* Participants */}
              <div className="space-y-1">
                <p className="text-[10px] text-neutral-500 font-semibold">Participants:</p>
                <div className="flex flex-wrap gap-1">
                  {activePlaybackRecording.participants.map((p, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-neutral-100 border border-neutral-200 text-neutral-700 font-medium">
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              {/* Notes Recap */}
              {activePlaybackRecording.notes && activePlaybackRecording.notes.length > 0 && (
                <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 space-y-1">
                  <p className="text-[10px] text-purple-700 font-bold flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Meeting Notes Recap:
                  </p>
                  <ul className="text-[11px] text-neutral-700 space-y-1 pl-3 list-disc">
                    {activePlaybackRecording.notes.map((note, i) => (
                      <li key={i}>{note}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Social Follow/Followers Modal (X-style connection management) */}
      <SocialFollowModal
        isOpen={isFollowModalOpen}
        onClose={() => setIsFollowModalOpen(false)}
        initialTab={followModalInitialTab}
        currentUser={userProfile}
        users={socialUsers}
        onToggleFollow={(userId) => {
          if (onToggleFollowUser) {
            onToggleFollowUser(userId);
          }
        }}
        onSimulateIncomingFollow={(userId) => {
          if (onSimulateIncomingFollow) {
            onSimulateIncomingFollow(userId);
          }
        }}
      />
    </div>
  );
};
