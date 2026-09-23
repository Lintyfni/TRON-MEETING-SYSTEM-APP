import React, { useState } from 'react';
import { PostItem, MeetingRoom, UserProfile, PostComment, CooMGroup } from '../types';
import {
  Edit3,
  Filter,
  Heart,
  MessageSquare,
  Repeat,
  Share2,
  X,
  Sparkles,
  Search,
  Globe,
  Lock,
  Send,
  Check,
  Layers,
  Video,
  Users,
  UserPlus,
  Plus,
  Settings,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Image as ImageIcon,
  List,
  LayoutGrid,
  ChevronDown,
  Film,
  Paperclip,
  Trash2,
  Quote,
} from 'lucide-react';
import { CreateGroupModal } from './CreateGroupModal';
import { GroupSettingsModal } from './GroupSettingsModal';
import { AddMemberModal } from './AddMemberModal';

interface CooMFeedScreenProps {
  posts: PostItem[];
  rooms: MeetingRoom[];
  initialNewPostText?: string;
  onAddPost: (
    token: string,
    content: string,
    visibility?: 'public' | 'private',
    groupId?: string,
    groupName?: string,
    mediaUrl?: string,
    mediaType?: 'image' | 'video',
    quotedPost?: PostItem['quotedPost']
  ) => void;
  onToggleLike: (postId: string) => void;
  onToggleRepost?: (postId: string) => void;
  onAddComment?: (postId: string, content: string) => void;
  onToggleCommentLike?: (postId: string, commentId: string) => void;
  onSelectMeetingToken?: (token: string) => void;
  onGoToMeeting?: () => void;
  currentUser?: UserProfile;
  // Groups props
  groups?: CooMGroup[];
  activeGroupId?: string | null;
  onSelectGroup?: (groupId: string | null) => void;
  onCreateGroup?: (groupData: any) => void;
  onUpdateGroup?: (groupId: string, updates: Partial<CooMGroup>) => void;
  onAddUserToGroup?: (groupId: string, userName: string) => void;
  onRemoveUserFromGroup?: (groupId: string, userName: string) => void;
  onRequestJoinGroup?: (groupId: string) => void;
  onApproveJoinRequest?: (groupId: string, userName: string) => void;
  onDeclineJoinRequest?: (groupId: string, userName: string) => void;
  onLeaveGroup?: (groupId: string) => void;
  onOpenGroupChat?: (groupId: string) => void;
  themeMode?: string;
}

export const CooMFeedScreen: React.FC<CooMFeedScreenProps> = ({
  posts,
  rooms,
  initialNewPostText = '',
  onAddPost,
  onToggleLike,
  onToggleRepost,
  onAddComment,
  onToggleCommentLike,
  onSelectMeetingToken,
  onGoToMeeting,
  currentUser,
  groups = [],
  activeGroupId,
  onSelectGroup,
  onCreateGroup,
  onUpdateGroup,
  onAddUserToGroup,
  onRemoveUserFromGroup,
  onRequestJoinGroup,
  onApproveJoinRequest,
  onDeclineJoinRequest,
  onLeaveGroup,
  onOpenGroupChat,
  themeMode = 'dark',
}) => {
  const isDark = themeMode !== 'light';
  const [postMode, setPostMode] = useState<'groups' | 'rooms' | 'all'>('all');
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<string>('ALL');
  const [isRoomFilterDropdownOpen, setIsRoomFilterDropdownOpen] = useState<boolean>(false);
  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState<boolean>(false);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('ALL');
  const [groupSubView, setGroupSubView] = useState<'feed' | 'directory'>('feed');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPostToken, setSelectedPostToken] = useState<string>(
    rooms[0]?.token || '#MEET-9021'
  );
  const [postContent, setPostContent] = useState('');
  const [postVisibility, setPostVisibility] = useState<'public' | 'private'>('public');
  const [selectedPostGroupId, setSelectedPostGroupId] = useState<string>('none');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCommentsPostId, setExpandedCommentsPostId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState<Record<string, string>>({});
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);

  // Repost & Quote states
  const [repostMenuPost, setRepostMenuPost] = useState<PostItem | null>(null);
  const [quoteModalPost, setQuoteModalPost] = useState<PostItem | null>(null);
  const [quoteText, setQuoteText] = useState('');
  const [quoteMediaUrl, setQuoteMediaUrl] = useState('');
  const [quoteMediaType, setQuoteMediaType] = useState<'image' | 'video'>('image');

  // Create Post media attachment states
  const [postMediaUrl, setPostMediaUrl] = useState('');
  const [postMediaType, setPostMediaType] = useState<'image' | 'video'>('image');

  // Feedback Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Group specific states
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(activeGroupId || null);
  const [groupSearchQuery, setGroupSearchQuery] = useState('');
  const [groupCategoryFilter, setGroupCategoryFilter] = useState('All');
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [groupForSettings, setGroupForSettings] = useState<CooMGroup | null>(null);
  const [groupForAddMember, setGroupForAddMember] = useState<CooMGroup | null>(null);
  const [groupLayoutMode, setGroupLayoutMode] = useState<'list' | 'grid'>('list');
  const [groupPostInput, setGroupPostInput] = useState('');

  const currentUserName = currentUser?.name || 'Aung Myint';
  const totalPendingRequests = groups.reduce((acc, g) => acc + (g.pendingRequests?.length || 0), 0);
  const myGroupsCount = groups.filter(
    (g) => g.members.includes(currentUser?.name || 'Aung Myint') || g.members.includes('You')
  ).length;
  const notiCount = totalPendingRequests > 0 ? totalPendingRequests : myGroupsCount;

  // Active room object based on selectedRoomFilter
  const activeRoomObj = rooms.find(
    (r) => r.token.toUpperCase() === selectedRoomFilter.toUpperCase()
  );

  // Sync activeGroupId if passed
  React.useEffect(() => {
    if (activeGroupId) {
      setSelectedGroupId(activeGroupId);
      setSelectedGroupFilter(activeGroupId);
      setPostMode('groups');
    }
  }, [activeGroupId]);

  // Handle passed initial post text from Granola Notes
  React.useEffect(() => {
    if (initialNewPostText) {
      setPostContent(initialNewPostText);
      setIsCreateModalOpen(true);
    }
  }, [initialNewPostText]);

  const handleGoToMeeting = () => {
    if (onGoToMeeting) {
      onGoToMeeting();
    } else if (onSelectMeetingToken) {
      const targetToken =
        selectedRoomFilter === 'ALL' ? rooms[0]?.token || 'MEET-001' : selectedRoomFilter;
      onSelectMeetingToken(targetToken);
    }
  };

  const filteredPosts = posts
    .filter((p) => {
      if (postMode === 'groups') {
        // Group post filter
        if (!p.groupId) return false;
        if (selectedGroupFilter !== 'ALL' && p.groupId !== selectedGroupFilter) return false;
        return true;
      }
      if (postMode === 'rooms') {
        // Room post filter
        if (!p.meetingToken) return false;
        if (
          selectedRoomFilter !== 'ALL' &&
          p.meetingToken.toUpperCase() !== selectedRoomFilter.toUpperCase()
        ) {
          return false;
        }
        return true;
      }
      // 'all': Show all posts
      return true;
    })
    .filter((p) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        p.content.toLowerCase().includes(q) ||
        p.author.toLowerCase().includes(q) ||
        (p.meetingToken && p.meetingToken.toLowerCase().includes(q)) ||
        (p.groupName && p.groupName.toLowerCase().includes(q))
      );
    });

  // Currently open group in group view
  const currentOpenGroup = groups.find((g) => g.id === selectedGroupId) || null;

  // Filtered groups for discovery
  const filteredGroups = groups.filter((grp) => {
    const matchesCategory =
      groupCategoryFilter === 'All'
        ? true
        : groupCategoryFilter === 'My Groups'
        ? grp.members.includes(currentUserName) || grp.members.includes('You')
        : grp.category.includes(groupCategoryFilter);

    if (!matchesCategory) return false;
    if (!groupSearchQuery.trim()) return true;
    const q = groupSearchQuery.toLowerCase();
    return (
      grp.name.toLowerCase().includes(q) ||
      grp.description.toLowerCase().includes(q) ||
      grp.category.toLowerCase().includes(q)
    );
  });

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim() && !postMediaUrl) return;

    let targetGroupId: string | undefined = undefined;
    let targetGroupName: string | undefined = undefined;

    if (selectedPostGroupId !== 'none') {
      const matchedGroup = groups.find((g) => g.id === selectedPostGroupId);
      if (matchedGroup) {
        targetGroupId = matchedGroup.id;
        targetGroupName = matchedGroup.name;
      }
    }

    onAddPost(
      selectedPostToken,
      postContent.trim(),
      postVisibility,
      targetGroupId,
      targetGroupName,
      postMediaUrl || undefined,
      postMediaType
    );
    setPostContent('');
    setPostMediaUrl('');
    setPostVisibility('public');
    setSelectedPostGroupId('none');
    setIsCreateModalOpen(false);
    setToastMessage('Post published!');
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleCreateQuotePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteModalPost) return;

    onAddPost(
      quoteModalPost.meetingToken || rooms[0]?.token || '#MEET-9021',
      quoteText.trim() || 'Quoted post',
      'public',
      quoteModalPost.groupId,
      quoteModalPost.groupName,
      quoteMediaUrl || undefined,
      quoteMediaType,
      {
        id: quoteModalPost.id,
        meetingToken: quoteModalPost.meetingToken,
        author: quoteModalPost.author,
        avatar: quoteModalPost.avatar,
        handle: quoteModalPost.handle,
        content: quoteModalPost.content,
        timestamp: quoteModalPost.timestamp,
        mediaUrl: quoteModalPost.mediaUrl,
        mediaType: quoteModalPost.mediaType,
      }
    );

    if (!quoteModalPost.isReposted) {
      onToggleRepost?.(quoteModalPost.id);
    }

    setToastMessage('Quote post published to feed!');
    setTimeout(() => setToastMessage(null), 2500);

    setQuoteText('');
    setQuoteMediaUrl('');
    setQuoteModalPost(null);
  };

  const handleOpenRepostMenu = (post: PostItem) => {
    setRepostMenuPost(post);
  };

  const handleConfirmRepost = (post: PostItem) => {
    onToggleRepost?.(post.id);
    setRepostMenuPost(null);
    setToastMessage(post.isReposted ? 'Removed repost' : 'Reposted to your feed & profile!');
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleOpenQuoteModal = (post: PostItem) => {
    setRepostMenuPost(null);
    setQuoteModalPost(post);
    setQuoteText('');
    setQuoteMediaUrl('');
    setQuoteMediaType('image');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'post' | 'quote') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVideo = file.type.startsWith('video');
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (target === 'post') {
        setPostMediaUrl(result);
        setPostMediaType(isVideo ? 'video' : 'image');
      } else {
        setQuoteMediaUrl(result);
        setQuoteMediaType(isVideo ? 'video' : 'image');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateGroupDirectPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupPostInput.trim() || !currentOpenGroup) return;

    onAddPost(
      currentOpenGroup.linkedMeetingToken || rooms[0]?.token || '#MEET-9021',
      groupPostInput.trim(),
      'public',
      currentOpenGroup.id,
      currentOpenGroup.name
    );
    setGroupPostInput('');
  };

  const handleQuickInsertSummary = () => {
    const matchedRoom = rooms.find((r) => r.token === selectedPostToken) || rooms[0];
    if (matchedRoom) {
      const summary = `Highlights from ${matchedRoom.token} (${matchedRoom.title}):\n• ${matchedRoom.keyPoints.join('\n• ')}`;
      setPostContent(summary);
    }
  };

  const handleSharePost = (postId: string) => {
    setCopiedPostId(postId);
    navigator.clipboard?.writeText(window.location.href);
    setTimeout(() => setCopiedPostId(null), 2000);
  };

  const handleSendComment = (postId: string) => {
    const text = commentInput[postId]?.trim();
    if (!text) return;
    if (onAddComment) {
      onAddComment(postId, text);
    }
    setCommentInput((prev) => ({ ...prev, [postId]: '' }));
  };

  // Reusable Post Item Card renderer for Groups, Rooms, and All Posts
  const renderPostItem = (post: PostItem) => {
    const isLiked = post.isLiked || false;
    const likesCount = post.likes || 0;
    const isReposted = post.isReposted || false;
    const repostsCount = post.reposts || 0;
    const commentsCount = (post.comments ? post.comments.length : post.replies) || 0;
    const isCommentsOpen = expandedCommentsPostId === post.id;

    return (
      <article
        key={post.id}
        id={`post-item-${post.id}`}
        className={`p-4 transition duration-150 flex flex-col ${
          isDark
            ? 'bg-[#090414] hover:bg-[#120724] border-b border-purple-900/30'
            : 'bg-white hover:bg-neutral-50/80 border-b border-neutral-100'
        }`}
      >
        {/* Repost Header if applicable */}
        {post.repostedByUser && (
          <div className={`flex items-center gap-1.5 text-xs font-semibold mb-2 pl-9 ${
            isDark ? 'text-purple-300/70' : 'text-neutral-500'
          }`}>
            <Repeat className="w-3.5 h-3.5 text-emerald-500" />
            <span>
              {currentUser && currentUser.name === post.repostedByUser
                ? 'You reposted'
                : `${post.repostedByUser} reposted`}
            </span>
          </div>
        )}

        {/* Author Row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
              {post.author[0]}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={`font-bold text-sm truncate ${isDark ? 'text-white' : 'text-neutral-900'}`}>{post.author}</span>
                <span className={`text-[11px] ${isDark ? 'text-purple-300/50' : 'text-neutral-500'}`}>· {post.timestamp}</span>
                {/* Visibility Badge */}
                {post.visibility === 'private' ? (
                  <span className={`flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.2 rounded-md border ${
                    isDark
                      ? 'text-purple-300 bg-purple-950/70 border-purple-800/40'
                      : 'text-neutral-600 bg-neutral-100 border-neutral-200'
                  }`}>
                    <Lock className="w-2.5 h-2.5 opacity-70" />
                    Private
                  </span>
                ) : (
                  <span className={`flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.2 rounded-md border ${
                    isDark
                      ? 'text-purple-300 bg-purple-900/40 border-purple-700/50'
                      : 'text-purple-700 bg-purple-50 border-purple-200'
                  }`}>
                    <Globe className="w-2.5 h-2.5 opacity-80" />
                    Public
                  </span>
                )}
              </div>
              <span className={`text-[11px] ${isDark ? 'text-purple-300/50' : 'text-neutral-500'}`}>
                @{post.author.replace(/\s+/g, '').toLowerCase()}
              </span>
            </div>
          </div>

          {/* Token Pill */}
          {post.meetingToken && (
            <button
              type="button"
              onClick={() => {
                setPostMode('rooms');
                setSelectedRoomFilter(post.meetingToken);
                onSelectMeetingToken?.(post.meetingToken);
              }}
              className={`px-2.5 py-1 rounded-full font-mono text-xs font-semibold transition shrink-0 cursor-pointer border ${
                isDark
                  ? 'bg-purple-950/80 border-purple-700/50 text-purple-300 hover:bg-purple-900/60'
                  : 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'
              }`}
              title="Filter by this meeting room"
            >
              {post.meetingToken}
            </button>
          )}
        </div>

        {/* Group Badge if posted inside CooM Group */}
        {post.groupName && (
          <div className="pl-11 mt-1.5">
            <button
              type="button"
              onClick={() => {
                setPostMode('groups');
                if (post.groupId) {
                  setSelectedGroupId(post.groupId);
                  setSelectedGroupFilter(post.groupId);
                  setGroupSubView('feed');
                }
              }}
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold transition cursor-pointer border ${
                isDark
                  ? 'bg-purple-950/70 border-purple-800/50 text-purple-300 hover:bg-purple-900/50'
                  : 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'
              }`}
              title="View Group"
            >
              <Users className="w-3 h-3 text-purple-400" />
              <span>Group: {post.groupName}</span>
            </button>
          </div>
        )}

        {/* Content */}
        <div className={`mt-2.5 text-sm leading-relaxed pl-11 whitespace-pre-line ${
          isDark ? 'text-neutral-200' : 'text-neutral-800'
        }`}>
          {formatContentWithHashtags(post.content)}
        </div>

        {/* Attached Photo or Video */}
        {post.mediaUrl && (
          <div className="mt-2.5 pl-11 pr-2">
            {post.mediaType === 'video' || post.mediaUrl.match(/\.(mp4|webm|mov)($|\?)/i) || post.mediaUrl.startsWith('data:video') ? (
              <div className={`relative rounded-2xl overflow-hidden bg-black max-h-80 shadow-xs border ${
                isDark ? 'border-purple-900/30' : 'border-neutral-200'
              }`}>
                <video
                  src={post.mediaUrl}
                  controls
                  playsInline
                  className="w-full max-h-80 object-contain bg-black"
                />
              </div>
            ) : (
              <div className={`relative rounded-2xl overflow-hidden max-h-80 shadow-xs border ${
                isDark ? 'border-purple-900/30 bg-[#120724]' : 'border-neutral-200 bg-neutral-100'
              }`}>
                <img
                  src={post.mediaUrl}
                  alt="Post attachment"
                  className="w-full max-h-80 object-cover hover:scale-[1.01] transition-transform duration-200 cursor-pointer"
                  onClick={() => window.open(post.mediaUrl, '_blank')}
                />
              </div>
            )}
          </div>
        )}

        {/* Quoted Post Card (CooM embedded card) */}
        {post.quotedPost && (
          <div className="mt-2.5 pl-11 pr-2">
            <div className={`rounded-2xl border transition p-3 ${
              isDark
                ? 'border-purple-800/40 bg-[#15092a] hover:bg-[#1a0c34]'
                : 'border-neutral-200/90 bg-neutral-50/70 hover:bg-neutral-100/70'
            }`}>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                  {post.quotedPost.author[0]}
                </div>
                <span className={`font-bold text-xs truncate ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                  {post.quotedPost.author}
                </span>
                <span className={`text-[10px] ${isDark ? 'text-purple-300/50' : 'text-neutral-500'}`}>
                  @{post.quotedPost.handle || post.quotedPost.author.replace(/\s+/g, '').toLowerCase()} · {post.quotedPost.timestamp}
                </span>
                {post.quotedPost.meetingToken && (
                  <span className={`ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded-md border ${
                    isDark
                      ? 'text-purple-300 bg-purple-900/50 border-purple-700/50'
                      : 'text-purple-700 bg-purple-50 border-purple-200'
                  }`}>
                    {post.quotedPost.meetingToken}
                  </span>
                )}
              </div>
              <p className={`text-xs leading-relaxed line-clamp-3 ${
                isDark ? 'text-neutral-200' : 'text-neutral-800'
              }`}>
                {post.quotedPost.content}
              </p>
              {post.quotedPost.mediaUrl && (
                <div className={`mt-2 rounded-xl overflow-hidden max-h-44 border bg-black ${
                  isDark ? 'border-purple-800/40' : 'border-neutral-200'
                }`}>
                  {post.quotedPost.mediaType === 'video' ? (
                    <video src={post.quotedPost.mediaUrl} controls playsInline className="w-full max-h-44 object-contain bg-black" />
                  ) : (
                    <img src={post.quotedPost.mediaUrl} alt="Quoted attachment" className="w-full max-h-44 object-cover" />
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Post Action Buttons */}
        <div className={`mt-3 flex items-center justify-between text-xs pl-11 pr-6 max-w-sm ${
          isDark ? 'text-purple-300/60' : 'text-neutral-500'
        }`}>
          <button
            id={`btn-comments-toggle-${post.id}`}
            type="button"
            onClick={() =>
              setExpandedCommentsPostId((prev) => (prev === post.id ? null : post.id))
            }
            className={`flex items-center gap-1.5 transition cursor-pointer ${
              isCommentsOpen
                ? 'text-purple-500 font-bold'
                : isDark ? 'hover:text-purple-300' : 'hover:text-purple-600'
            }`}
            title="Comments"
          >
            <MessageSquare className="w-4 h-4" />
            <span>{commentsCount}</span>
          </button>

          <button
            id={`btn-repost-${post.id}`}
            type="button"
            onClick={() => handleOpenRepostMenu(post)}
            className={`flex items-center gap-1.5 transition cursor-pointer ${
              isReposted
                ? 'text-emerald-500 font-bold'
                : isDark ? 'hover:text-emerald-400' : 'hover:text-emerald-600'
            }`}
            title="Repost or Quote"
          >
            <Repeat className="w-4 h-4" />
            <span>{repostsCount}</span>
          </button>

          <button
            id={`btn-like-${post.id}`}
            type="button"
            onClick={() => onToggleLike(post.id)}
            className={`flex items-center gap-1.5 transition cursor-pointer ${
              isLiked
                ? 'text-rose-500 font-bold'
                : isDark ? 'hover:text-rose-400' : 'hover:text-rose-500'
            }`}
            title="Like"
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
            <span>{likesCount}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSharePost(post.id)}
            className={`flex items-center gap-1.5 transition cursor-pointer ${
              isDark ? 'hover:text-purple-300' : 'hover:text-purple-600'
            }`}
            title="Share Post"
          >
            {copiedPostId === post.id ? (
              <span className="text-purple-400 font-bold flex items-center gap-1 text-[11px]">
                <Check className="w-3.5 h-3.5" /> Copied!
              </span>
            ) : (
              <Share2 className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Comments Drawer */}
        {isCommentsOpen && (
          <div className={`mt-3 pl-11 pr-4 pt-3 border-t ${
            isDark ? 'border-purple-900/30' : 'border-neutral-100'
          }`}>
            <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
              {post.comments && post.comments.length > 0 ? (
                post.comments.map((comment) => (
                  <div
                    key={comment.id}
                    className={`p-2.5 rounded-xl border text-xs ${
                      isDark
                        ? 'bg-[#15092a] border-purple-800/30 text-white'
                        : 'bg-neutral-50 border-neutral-200/60 text-neutral-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-bold ${isDark ? 'text-purple-200' : 'text-neutral-900'}`}>{comment.author}</span>
                      <span className={`text-[10px] ${isDark ? 'text-purple-300/40' : 'text-neutral-400'}`}>{comment.timestamp}</span>
                    </div>
                    <p className={`leading-relaxed ${isDark ? 'text-neutral-200' : 'text-neutral-700'}`}>{comment.content}</p>
                  </div>
                ))
              ) : (
                <p className={`text-xs py-1 ${isDark ? 'text-purple-300/40' : 'text-neutral-400'}`}>No comments yet. Be the first to comment!</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Write a comment..."
                value={commentInput[post.id] || ''}
                onChange={(e) =>
                  setCommentInput((prev) => ({ ...prev, [post.id]: e.target.value }))
                }
                onKeyDown={(e) => e.key === 'Enter' && handleSendComment(post.id)}
                className={`flex-1 px-3 py-1.5 text-xs rounded-xl outline-none border transition ${
                  isDark
                    ? 'bg-[#15092a] border-purple-700/40 text-white placeholder:text-purple-300/40 focus:border-purple-500'
                    : 'bg-neutral-50 border-neutral-300 text-neutral-900 placeholder:text-neutral-400 focus:border-purple-600'
                }`}
              />
              <button
                type="button"
                onClick={() => handleSendComment(post.id)}
                className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
              >
                Reply
              </button>
            </div>
          </div>
        )}
      </article>
    );
  };

  return (
    <div id="coom-feed-screen" className={`relative w-full h-full flex flex-col overflow-hidden ${
      isDark ? 'bg-[#06020c] text-white' : 'bg-neutral-50 text-neutral-900'
    }`}>
      {/* 1. APP BAR - Centered Equal-Sized Mode Switcher (Groups / Rooms / All Posts) */}
      <header className={`sticky top-0 z-20 border-b px-3 py-2 flex items-center justify-center shrink-0 shadow-2xs ${
        isDark ? 'bg-[#0c051a] border-purple-900/30' : 'bg-white border-neutral-200'
      }`}>
        <div className={`w-full max-w-sm sm:max-w-md md:max-w-lg flex items-center p-1 rounded-2xl shadow-2xs gap-1 border ${
          isDark ? 'bg-[#15092a] border-purple-900/40' : 'bg-neutral-100/90 border-neutral-200/90'
        }`}>
          {/* Groups Tab with Dropdown Filter */}
          <div className="flex-1 relative">
            <button
              type="button"
              id="btn-posts-mode-groups"
              onClick={() => {
                setPostMode('groups');
                setIsGroupDropdownOpen((prev) => !prev);
                setIsRoomFilterDropdownOpen(false);
              }}
              className={`w-full h-8.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none ${
                postMode === 'groups'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : isDark
                  ? 'text-purple-300/80 hover:text-white hover:bg-purple-900/30'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/50'
              }`}
              title="Click to Filter Groups"
            >
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span>Groups</span>
              {notiCount > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-black text-white shrink-0 ${
                    postMode === 'groups' ? 'bg-white/25' : 'bg-purple-600'
                  }`}
                >
                  {notiCount}
                </span>
              )}
              <ChevronDown
                className={`w-3 h-3 shrink-0 transition-transform duration-150 ${
                  isGroupDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Groups Dropdown Filter Menu */}
            {isGroupDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsGroupDropdownOpen(false)}
                />
                <div className={`absolute left-0 sm:-left-4 top-full mt-2 w-72 sm:w-80 max-h-84 rounded-2xl shadow-2xl border z-50 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-150 ${
                  isDark ? 'bg-[#0e071e] border-purple-500/30 text-white' : 'bg-white border-neutral-200 text-neutral-900'
                }`}>
                  <div className={`px-3.5 py-2.5 border-b flex items-center justify-between ${
                    isDark ? 'bg-[#15092a] border-purple-900/40' : 'bg-neutral-50 border-neutral-100'
                  }`}>
                    <span className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                      isDark ? 'text-purple-300' : 'text-neutral-600'
                    }`}>
                      <Filter className="w-3 h-3 text-purple-500" />
                      Select Group
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isDark ? 'text-purple-300 bg-purple-950/70 border-purple-800/40' : 'text-purple-700 bg-purple-50 border-purple-200/60'
                    }`}>
                      {groups.length} groups
                    </span>
                  </div>

                  <div className={`overflow-y-auto max-h-60 py-1 divide-y ${
                    isDark ? 'divide-purple-900/30' : 'divide-neutral-100'
                  }`}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedGroupFilter('ALL');
                        setSelectedGroupId(null);
                        setGroupSubView('feed');
                        setPostMode('groups');
                        setIsGroupDropdownOpen(false);
                      }}
                      className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between text-xs transition cursor-pointer ${
                        selectedGroupFilter === 'ALL' && !selectedGroupId
                          ? isDark ? 'bg-purple-900/50 text-purple-200 font-bold' : 'bg-purple-50 text-purple-900 font-bold'
                          : isDark ? 'hover:bg-purple-950/40 text-purple-100' : 'hover:bg-neutral-50 text-neutral-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isDark ? 'bg-purple-900/60 text-purple-300' : 'bg-purple-100 text-purple-700'
                        }`}>
                          <Users className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className={`font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>All Group Posts</div>
                          <div className={`text-[10px] truncate ${isDark ? 'text-purple-300/50' : 'text-neutral-500'}`}>
                            View posts across all {groups.length} groups
                          </div>
                        </div>
                      </div>
                      {selectedGroupFilter === 'ALL' && !selectedGroupId && (
                        <Check className="w-4 h-4 text-purple-400 shrink-0" />
                      )}
                    </button>

                    {groups.map((grp) => {
                      const isSelected = selectedGroupId === grp.id || selectedGroupFilter === grp.id;
                      return (
                        <button
                          key={grp.id}
                          type="button"
                          onClick={() => {
                            setSelectedGroupFilter(grp.id);
                            setSelectedGroupId(grp.id);
                            setGroupSubView('feed');
                            setPostMode('groups');
                            setIsGroupDropdownOpen(false);
                          }}
                          className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between text-xs transition cursor-pointer ${
                            isSelected
                              ? isDark ? 'bg-purple-900/50 text-purple-200 font-bold' : 'bg-purple-50 text-purple-900 font-bold'
                              : isDark ? 'hover:bg-purple-950/40 text-purple-100' : 'hover:bg-neutral-50 text-neutral-800'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={grp.avatar}
                              alt={grp.name}
                              className={`w-8 h-8 rounded-xl object-cover shrink-0 border ${
                                isDark ? 'border-purple-800/40' : 'border-neutral-200'
                              }`}
                            />
                            <div className="min-w-0">
                              <div className={`font-bold truncate ${isDark ? 'text-white' : 'text-neutral-900'}`}>{grp.name}</div>
                              <div className={`text-[10px] truncate flex items-center gap-1.5 ${
                                isDark ? 'text-purple-300/60' : 'text-neutral-500'
                              }`}>
                                <span>{grp.members.length} members</span>
                                <span>·</span>
                                <span className={isDark ? 'text-purple-400' : 'text-purple-600'}>{grp.category}</span>
                              </div>
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-purple-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className={`p-2 border-t flex items-center gap-2 ${
                    isDark ? 'bg-[#15092a] border-purple-900/40' : 'bg-neutral-50 border-neutral-100'
                  }`}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsGroupDropdownOpen(false);
                        setIsCreateGroupModalOpen(true);
                      }}
                      className="flex-1 py-1.5 px-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold flex items-center justify-center gap-1 shadow-2xs cursor-pointer transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create Group</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsGroupDropdownOpen(false);
                        setSelectedGroupFilter('ALL');
                        setSelectedGroupId(null);
                        setGroupSubView('directory');
                        setPostMode('groups');
                      }}
                      className={`py-1.5 px-2.5 rounded-xl border text-[11px] font-semibold flex items-center justify-center gap-1 shadow-2xs cursor-pointer transition ${
                        isDark
                          ? 'bg-[#1b0c36] hover:bg-[#25104a] text-purple-200 border-purple-800/40'
                          : 'bg-white hover:bg-neutral-100 text-neutral-700 border-neutral-200'
                      }`}
                    >
                      <LayoutGrid className="w-3.5 h-3.5 opacity-70" />
                      <span>Explore</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Rooms Tab - Equal Size */}
          <div className="flex-1">
            <button
              type="button"
              id="btn-posts-mode-rooms"
              onClick={() => {
                setPostMode('rooms');
                setIsGroupDropdownOpen(false);
                setIsRoomFilterDropdownOpen(false);
              }}
              className={`w-full h-8.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none ${
                postMode === 'rooms'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : isDark
                  ? 'text-purple-300/80 hover:text-white hover:bg-purple-900/30'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/50'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 shrink-0" />
              <span>Rooms</span>
            </button>
          </div>

          {/* All Posts Tab - Equal Size */}
          <div className="flex-1">
            <button
              type="button"
              id="btn-posts-mode-all"
              onClick={() => {
                setPostMode('all');
                setIsGroupDropdownOpen(false);
                setIsRoomFilterDropdownOpen(false);
              }}
              className={`w-full h-8.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none ${
                postMode === 'all'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : isDark
                  ? 'text-purple-300/80 hover:text-white hover:bg-purple-900/30'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span>All Posts</span>
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. TAB A: GROUPS VIEW */}
      {/* ========================================================= */}
      {postMode === 'groups' && (
        <div className={`flex-1 overflow-y-auto pb-24 flex flex-col items-center ${isDark ? 'bg-[#06020c]' : 'bg-neutral-50'}`}>
          <div className={`w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl flex-1 flex flex-col min-h-0 sm:border-x shadow-2xs ${
            isDark ? 'bg-[#0c051a] border-purple-900/30' : 'bg-white border-neutral-200/80'
          }`}>
          {/* Subbar for Group Filter & Actions when not in specific group view */}
          {!currentOpenGroup && (
            <div className={`px-3.5 py-2 border-b shrink-0 flex items-center justify-between gap-2 shadow-2xs ${
              isDark ? 'bg-[#0f0720] border-purple-900/30' : 'bg-white border-neutral-200'
            }`}>
              <div className="flex items-center gap-2 min-w-0">
                <span className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-neutral-800'}`}>
                  {selectedGroupFilter === 'ALL'
                    ? `All Group Posts (${groups.length} Groups)`
                    : groups.find((g) => g.id === selectedGroupFilter)?.name || 'Group Posts'}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 border ${
                  isDark ? 'bg-purple-950/80 text-purple-300 border-purple-700/40' : 'bg-purple-50 text-purple-700 border-purple-200'
                }`}>
                  {selectedGroupFilter === 'ALL' ? 'All Groups' : 'Filtered'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setGroupSubView(groupSubView === 'directory' ? 'feed' : 'directory')}
                  className={`h-8 px-2.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer border ${
                    groupSubView === 'directory'
                      ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                      : isDark
                      ? 'bg-[#180a34] hover:bg-[#220e48] text-purple-200 border-purple-800/40'
                      : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border-neutral-200'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>{groupSubView === 'directory' ? 'View Feed' : 'Explore Groups'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreateGroupModalOpen(true)}
                  className={`h-8 px-2.5 rounded-xl text-xs font-semibold transition flex items-center gap-1 cursor-pointer shadow-2xs border ${
                    isDark
                      ? 'bg-purple-950/70 hover:bg-purple-900/80 text-purple-300 border-purple-700/40'
                      : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Create</span>
                </button>
              </div>
            </div>
          )}

          {currentOpenGroup ? (
            /* --- SUBVIEW: SPECIFIC GROUP FEED --- */
            <div className="animate-in fade-in">
              {/* Back Bar */}
              <div className={`px-3 py-2 border-b flex items-center justify-between gap-1.5 shadow-2xs ${
                isDark ? 'bg-[#0f0720] border-purple-900/30' : 'bg-white border-neutral-200'
              }`}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedGroupId(null);
                    setSelectedGroupFilter('ALL');
                  }}
                  className={`h-8 px-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                    isDark ? 'bg-[#180a34] hover:bg-[#220e48] text-purple-200' : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                  }`}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Add Member Button in Top Bar */}
                  <button
                    type="button"
                    onClick={() => setGroupForAddMember(currentOpenGroup)}
                    className={`h-8 px-2.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0 border ${
                      isDark
                        ? 'bg-purple-950/70 hover:bg-purple-900/80 text-purple-300 border-purple-700/40'
                        : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200'
                    }`}
                    title="Add Member to Group"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>

                  {onOpenGroupChat && (
                    <button
                      type="button"
                      onClick={() => onOpenGroupChat(currentOpenGroup.id)}
                      className={`h-8 px-2.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0 border ${
                        isDark
                          ? 'bg-[#180a34] hover:bg-[#220e48] text-purple-200 border-purple-800/40'
                          : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border-neutral-200'
                      }`}
                      title="Open Group Chat"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                      <span>Chat</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setGroupForSettings(currentOpenGroup)}
                    className={`h-8 px-2.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer relative shrink-0 border ${
                      isDark
                        ? 'bg-[#180a34] hover:bg-[#220e48] text-purple-200 border-purple-800/40'
                        : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border-neutral-200'
                    }`}
                    title="Group Settings, Members & Approvals"
                  >
                    <Settings className={`w-3.5 h-3.5 ${isDark ? 'text-purple-300' : 'text-neutral-600'}`} />
                    {currentOpenGroup.pendingRequests.length > 0 && (
                      <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-extrabold flex items-center justify-center">
                        {currentOpenGroup.pendingRequests.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Group Cover Banner & Info */}
              <div className={`border-b ${isDark ? 'bg-[#0c051a] border-purple-900/30' : 'bg-white border-neutral-200'}`}>
                <div className="relative h-40 sm:h-52 w-full overflow-hidden bg-neutral-900">
                  <img
                    src={currentOpenGroup.coverImage}
                    alt={currentOpenGroup.name}
                    className="w-full h-full object-cover opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  {/* Group Avatar overlaid on banner */}
                  <div className="absolute bottom-3 left-4 flex items-end gap-3">
                    <img
                      src={currentOpenGroup.avatar}
                      alt={currentOpenGroup.name}
                      className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-3 shadow-xl ${
                        isDark ? 'border-[#0c051a]' : 'border-white'
                      }`}
                    />
                    <div className="text-white pb-1">
                      <h2 className="text-base sm:text-xl font-extrabold drop-shadow-md">
                        {currentOpenGroup.name}
                      </h2>
                      <div className="flex items-center gap-2 text-xs text-neutral-200">
                        <span>{currentOpenGroup.privacy === 'public' ? '🌐 Public Group' : '🔒 Private Group'}</span>
                        <span>·</span>
                        <span>{currentOpenGroup.members.length} members</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Group Details and Join/Invite actions */}
                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="max-w-xl">
                    <p className={`text-xs leading-relaxed ${isDark ? 'text-purple-200' : 'text-neutral-700'}`}>{currentOpenGroup.description}</p>
                    <p className={`text-[11px] mt-1 ${isDark ? 'text-purple-300/60' : 'text-neutral-400'}`}>
                      Created by <strong className={isDark ? 'text-white' : 'text-neutral-700'}>{currentOpenGroup.admin}</strong> · Category: {currentOpenGroup.category}
                    </p>
                  </div>

                  {/* Join / Invite Controls */}
                  <div className="flex items-center gap-2 shrink-0">
                    {currentOpenGroup.members.includes(currentUserName) ||
                    currentOpenGroup.members.includes('You') ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setGroupForAddMember(currentOpenGroup)}
                          className={`h-8 px-3.5 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                            isDark
                              ? 'bg-purple-950/70 hover:bg-purple-900/80 text-purple-300 border-purple-700/40'
                              : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200'
                          }`}
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Add Member</span>
                        </button>
                        <span className="h-8 px-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Joined</span>
                        </span>
                      </>
                    ) : currentOpenGroup.pendingRequests.includes(currentUserName) ? (
                      <span className="h-8 px-3 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                        <span>Requested (Pending Admin Approval)</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onRequestJoinGroup && onRequestJoinGroup(currentOpenGroup.id)}
                        className="h-8 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold transition shadow-md shadow-purple-900/30 cursor-pointer flex items-center gap-1.5"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Join Group</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Group Post Composer */}
              <div className={`p-4 border-b shadow-2xs ${isDark ? 'bg-[#0f0720] border-purple-900/30' : 'bg-white border-neutral-200'}`}>
                <form onSubmit={handleCreateGroupDirectPost} className="space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face'}
                      alt="You"
                      className={`w-8 h-8 rounded-full object-cover border ${isDark ? 'border-purple-500/30' : 'border-neutral-200'}`}
                    />
                    <input
                      type="text"
                      value={groupPostInput}
                      onChange={(e) => setGroupPostInput(e.target.value)}
                      placeholder={`Write something in ${currentOpenGroup.name}...`}
                      className={`flex-1 border rounded-xl px-3.5 py-2 text-xs outline-none transition ${
                        isDark
                          ? 'bg-[#180a36] hover:bg-[#200d45] focus:bg-[#240e4f] border-purple-800/40 focus:border-purple-400 text-white placeholder:text-purple-300/40'
                          : 'bg-neutral-100 hover:bg-neutral-100/80 focus:bg-white border-neutral-200 focus:border-purple-600 text-neutral-900 placeholder:text-neutral-400'
                      }`}
                    />
                    <button
                      type="submit"
                      disabled={!groupPostInput.trim()}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-40 text-white text-xs font-bold transition cursor-pointer shadow-2xs flex items-center gap-1"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Post</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Group Posts Stream */}
              <div className={`divide-y ${isDark ? 'divide-purple-900/30 bg-[#0c051a]' : 'divide-neutral-200 bg-white'}`}>
                {posts.filter((p) => p.groupId === currentOpenGroup.id).length === 0 ? (
                  <div className={`p-12 text-center text-xs ${isDark ? 'text-purple-300/50' : 'text-neutral-400'}`}>
                    <Users className={`w-10 h-10 mx-auto mb-2 ${isDark ? 'text-purple-500/40' : 'text-neutral-300'}`} />
                    <p className={`font-semibold ${isDark ? 'text-purple-200' : 'text-neutral-700'}`}>No posts in this group yet</p>
                    <p className={`mt-1 ${isDark ? 'text-purple-300/40' : 'text-neutral-400'}`}>Be the first to share discussions or updates in this group!</p>
                  </div>
                ) : (
                  posts
                    .filter((p) => p.groupId === currentOpenGroup.id)
                    .map((post) => {
                      const isLiked = post.isLiked || false;
                      const likesCount = post.likes || 0;
                      const isReposted = post.isReposted || false;
                      const repostsCount = post.reposts || 0;
                      const commentsCount = (post.comments ? post.comments.length : post.replies) || 0;
                      const isCommentsOpen = expandedCommentsPostId === post.id;

                      return (
                        <article
                          key={post.id}
                          className={`p-4 transition duration-150 flex flex-col ${
                            isDark ? 'hover:bg-[#15092a]' : 'hover:bg-neutral-50/80'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                                {post.author[0]}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className={`font-bold text-sm truncate ${isDark ? 'text-white' : 'text-neutral-900'}`}>{post.author}</span>
                                  <span className={`text-[11px] ${isDark ? 'text-purple-300/60' : 'text-neutral-500'}`}>· {post.timestamp}</span>
                                </div>
                                <span className={`text-[11px] ${isDark ? 'text-purple-300/60' : 'text-neutral-500'}`}>
                                  @{post.author.replace(/\s+/g, '').toLowerCase()}
                                </span>
                              </div>
                            </div>

                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                              isDark
                                ? 'bg-purple-950/80 text-purple-300 border-purple-700/40'
                                : 'bg-purple-50 border-purple-200 text-purple-700'
                            }`}>
                              {currentOpenGroup.name}
                            </span>
                          </div>

                          <div className={`mt-2.5 text-sm leading-relaxed pl-11 whitespace-pre-line ${
                            isDark ? 'text-purple-100' : 'text-neutral-800'
                          }`}>
                            {formatContentWithHashtags(post.content)}
                          </div>

                          {/* Post Action Buttons */}
                          <div className={`mt-3 flex items-center justify-between text-xs pl-11 pr-6 max-w-sm ${
                            isDark ? 'text-purple-300/60' : 'text-neutral-500'
                          }`}>
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedCommentsPostId((prev) => (prev === post.id ? null : post.id))
                              }
                              className={`flex items-center gap-1.5 transition cursor-pointer ${
                                isCommentsOpen
                                  ? 'text-purple-400 font-bold'
                                  : isDark ? 'hover:text-purple-300' : 'hover:text-purple-600'
                              }`}
                            >
                              <MessageSquare className="w-4 h-4" />
                              <span>{commentsCount}</span>
                            </button>

                            <button
                              id={`btn-repost-card-${post.id}`}
                              type="button"
                              onClick={() => handleOpenRepostMenu(post)}
                              className={`flex items-center gap-1.5 transition cursor-pointer ${
                                isReposted ? 'text-emerald-400 font-bold' : isDark ? 'hover:text-emerald-400' : 'hover:text-emerald-600'
                              }`}
                              title="Repost or Quote"
                            >
                              <Repeat className="w-4 h-4" />
                              <span>{repostsCount}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => onToggleLike(post.id)}
                              className={`flex items-center gap-1.5 transition cursor-pointer ${
                                isLiked ? 'text-rose-500 font-bold' : 'hover:text-rose-500'
                              }`}
                            >
                              <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                              <span>{likesCount}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSharePost(post.id)}
                              className={`flex items-center gap-1.5 transition cursor-pointer ${
                                isDark ? 'hover:text-purple-300' : 'hover:text-purple-600'
                              }`}
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Expanded Comments */}
                          {isCommentsOpen && (
                            <div className={`mt-3 pl-11 pr-4 pt-3 border-t ${
                              isDark ? 'border-purple-900/30' : 'border-neutral-100'
                            }`}>
                              <div className="space-y-2 mb-3">
                                {post.comments && post.comments.length > 0 ? (
                                  post.comments.map((comment) => (
                                    <div key={comment.id} className={`p-2.5 rounded-xl border text-xs ${
                                      isDark ? 'bg-[#180a34] border-purple-800/40 text-purple-200' : 'bg-neutral-50 border-neutral-200/60 text-neutral-700'
                                    }`}>
                                      <div className="flex items-center justify-between mb-1">
                                        <span className={`font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>{comment.author}</span>
                                        <span className={`text-[10px] ${isDark ? 'text-purple-300/50' : 'text-neutral-400'}`}>{comment.timestamp}</span>
                                      </div>
                                      <p>{comment.content}</p>
                                    </div>
                                  ))
                                ) : (
                                  <p className={`text-xs py-1 ${isDark ? 'text-purple-300/50' : 'text-neutral-400'}`}>No comments yet.</p>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  placeholder="Write a comment in group..."
                                  value={commentInput[post.id] || ''}
                                  onChange={(e) =>
                                    setCommentInput((prev) => ({ ...prev, [post.id]: e.target.value }))
                                  }
                                  onKeyDown={(e) => e.key === 'Enter' && handleSendComment(post.id)}
                                  className={`flex-1 px-3 py-1.5 text-xs rounded-xl outline-none border ${
                                    isDark
                                      ? 'bg-[#180a36] border-purple-800/40 focus:border-purple-400 text-white placeholder:text-purple-300/40'
                                      : 'bg-neutral-50 border-neutral-300 rounded-xl focus:border-purple-600 text-neutral-900'
                                  }`}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSendComment(post.id)}
                                  className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-xs font-bold hover:from-purple-700 hover:to-indigo-700 cursor-pointer"
                                >
                                  Reply
                                </button>
                              </div>
                            </div>
                          )}
                        </article>
                      );
                    })
                )}
              </div>
            </div>
          ) : groupSubView === 'directory' ? (
            /* --- SUBVIEW: GROUP DISCOVERY & SEARCH LIST --- */
            <div className="p-4 space-y-4 max-w-4xl mx-auto animate-in fade-in">
              {/* Search Groups & Action Header */}
              <div className="flex flex-col sm:flex-row items-center gap-2.5">
                <div className="relative flex-1 w-full">
                  <Search className={`w-4 h-4 absolute left-3.5 top-2.5 ${isDark ? 'text-purple-400' : 'text-neutral-400'}`} />
                  <input
                    type="text"
                    value={groupSearchQuery}
                    onChange={(e) => setGroupSearchQuery(e.target.value)}
                    placeholder="Search groups by name, category, or topic..."
                    className={`w-full pl-10 pr-8 h-9 text-xs rounded-xl shadow-2xs transition focus:outline-none border ${
                      isDark
                        ? 'bg-[#180a36] border-purple-800/40 text-white placeholder:text-purple-300/40 focus:border-purple-400'
                        : 'bg-white border-neutral-300 text-neutral-900 placeholder:text-neutral-400 focus:border-purple-500'
                    }`}
                  />
                  {groupSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setGroupSearchQuery('')}
                      className={`absolute right-2.5 top-2.5 ${isDark ? 'text-purple-300 hover:text-white' : 'text-neutral-400 hover:text-neutral-700'}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* View Mode & Create Group buttons */}
                <div className="flex items-center gap-1.5 w-full sm:w-auto shrink-0 justify-end">
                  {/* List / Grid Toggle */}
                  <div className={`flex items-center p-0.5 rounded-xl border ${
                    isDark ? 'bg-[#15092a] border-purple-800/40' : 'bg-neutral-200/80 border-neutral-300/80'
                  }`}>
                    <button
                      type="button"
                      onClick={() => setGroupLayoutMode('list')}
                      className={`h-7 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                        groupLayoutMode === 'list'
                          ? isDark
                            ? 'bg-[#25124b] text-purple-200 shadow-2xs font-bold'
                            : 'bg-white text-purple-700 shadow-2xs'
                          : isDark ? 'text-purple-300/60 hover:text-white' : 'text-neutral-600 hover:text-neutral-900'
                      }`}
                      title="List View"
                    >
                      <List className="w-3.5 h-3.5" />
                      <span>List</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setGroupLayoutMode('grid')}
                      className={`h-7 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                        groupLayoutMode === 'grid'
                          ? isDark
                            ? 'bg-[#25124b] text-purple-200 shadow-2xs font-bold'
                            : 'bg-white text-purple-700 shadow-2xs'
                          : isDark ? 'text-purple-300/60 hover:text-white' : 'text-neutral-600 hover:text-neutral-900'
                      }`}
                      title="Grid View"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span>Grid</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsCreateGroupModalOpen(true)}
                    className="h-8 px-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Group</span>
                  </button>
                </div>
              </div>

              {/* Category Filters */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
                {['All', 'My Groups', 'Technology & Dev', 'Artificial Intelligence', 'Content Creation', 'Live Meeting Club'].map(
                  (cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setGroupCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition cursor-pointer border ${
                        groupCategoryFilter === cat
                          ? isDark
                            ? 'bg-purple-600 text-white border-purple-500 shadow-xs'
                            : 'bg-purple-600 text-white border-purple-600 shadow-xs'
                          : isDark
                          ? 'bg-[#15092a] border-purple-800/40 text-purple-200 hover:bg-[#1f0d3e]'
                          : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                      }`}
                    >
                      {cat}
                    </button>
                  )
                )}
              </div>

              {/* Group List or Grid */}
              {filteredGroups.length === 0 ? (
                <div className={`py-16 text-center rounded-2xl border p-6 ${
                  isDark ? 'bg-[#0e061e] border-purple-900/30 text-purple-300/60' : 'bg-white border-neutral-200 text-neutral-500'
                }`}>
                  <Users className={`w-12 h-12 mx-auto mb-2 ${isDark ? 'text-purple-500/40' : 'text-neutral-300'}`} />
                  <p className={`font-bold text-sm ${isDark ? 'text-purple-200' : 'text-neutral-800'}`}>No groups matched your search</p>
                  <p className={`text-xs mt-1 ${isDark ? 'text-purple-300/40' : 'text-neutral-400'}`}>Try another keyword or create your own group!</p>
                </div>
              ) : groupLayoutMode === 'list' ? (
                /* --- LIST FORMAT --- */
                <div className="space-y-2.5">
                  {filteredGroups.map((grp) => {
                    const isMember = grp.members.includes(currentUserName) || grp.members.includes('You');
                    const isPending = grp.pendingRequests.includes(currentUserName);

                    return (
                      <div
                        key={grp.id}
                        className={`rounded-2xl border p-3.5 shadow-2xs transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 group ${
                          isDark
                            ? 'bg-[#0f0720] border-purple-900/30 hover:border-purple-600/50 hover:bg-[#140a2b]'
                            : 'bg-white border-neutral-200 hover:border-purple-300 hover:shadow-xs'
                        }`}
                      >
                        {/* Left: Avatar & Details */}
                        <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                          <div
                            className="relative cursor-pointer shrink-0"
                            onClick={() => setSelectedGroupId(grp.id)}
                          >
                            <img
                              src={grp.avatar}
                              alt={grp.name}
                              className={`w-12 h-12 rounded-xl object-cover border group-hover:scale-105 transition ${
                                isDark ? 'border-purple-500/30' : 'border-neutral-200'
                              }`}
                            />
                            <span className="absolute -bottom-1 -right-1 text-[9px] px-1 py-0.2 rounded-full bg-black/70 text-white font-bold">
                              {grp.privacy === 'public' ? '🌐' : '🔒'}
                            </span>
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3
                                onClick={() => setSelectedGroupId(grp.id)}
                                className={`font-bold text-sm transition cursor-pointer truncate ${
                                  isDark ? 'text-white hover:text-purple-300' : 'text-neutral-900 hover:text-purple-600'
                                }`}
                              >
                                {grp.name}
                              </h3>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 border ${
                                isDark
                                  ? 'bg-purple-950/80 text-purple-300 border-purple-700/40'
                                  : 'bg-purple-50 text-purple-700 border-purple-200'
                              }`}>
                                {grp.category}
                              </span>
                            </div>
                            <p className={`text-xs line-clamp-1 mt-0.5 ${isDark ? 'text-purple-200/70' : 'text-neutral-500'}`}>
                              {grp.description}
                            </p>
                            <div className={`flex items-center gap-2 mt-1.5 text-[11px] font-medium flex-wrap ${
                              isDark ? 'text-purple-300/50' : 'text-neutral-400'
                            }`}>
                              <span className={`font-semibold ${isDark ? 'text-purple-200' : 'text-neutral-700'}`}>{grp.members.length} members</span>
                              <span>·</span>
                              <span>Admin: <strong className={isDark ? 'text-white' : 'text-neutral-700'}>{grp.admin}</strong></span>
                              {grp.linkedMeetingToken && (
                                <>
                                  <span>·</span>
                                  <span className="text-purple-400 font-mono font-semibold">{grp.linkedMeetingToken}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                          {isMember && (
                            <>
                              <button
                                type="button"
                                onClick={() => setGroupForAddMember(grp)}
                                className={`h-8 px-3 rounded-xl border text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                                  isDark
                                    ? 'bg-purple-950/70 hover:bg-purple-900/80 text-purple-300 border-purple-700/40'
                                    : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200'
                                }`}
                                title="Add Member to Group"
                              >
                                <UserPlus className="w-3.5 h-3.5" />
                                <span>Add Member</span>
                              </button>

                              {onOpenGroupChat && (
                                <button
                                  type="button"
                                  onClick={() => onOpenGroupChat(grp.id)}
                                  className={`h-8 px-3 rounded-xl border text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                                    isDark
                                      ? 'bg-[#180a36] hover:bg-[#200d45] text-purple-200 border-purple-800/40'
                                      : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border-neutral-200'
                                  }`}
                                  title="Open Group Chat"
                                >
                                  <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                                  <span>Chat</span>
                                </button>
                              )}
                            </>
                          )}

                          <button
                            type="button"
                            onClick={() => setSelectedGroupId(grp.id)}
                            className={`h-8 px-3 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                              isDark
                                ? 'bg-[#180a36] hover:bg-[#200d45] text-purple-200 border-purple-800/40'
                                : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border-transparent'
                            }`}
                          >
                            View Posts
                          </button>

                          {isMember ? (
                            <span className="h-8 px-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Joined</span>
                            </span>
                          ) : isPending ? (
                            <span className="h-8 px-3 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1">
                              <span>Requested ⏳</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onRequestJoinGroup && onRequestJoinGroup(grp.id)}
                              className="h-8 px-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold transition shadow-2xs cursor-pointer flex items-center gap-1.5"
                            >
                              <Users className="w-3.5 h-3.5" />
                              <span>Join</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* --- GRID FORMAT --- */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {filteredGroups.map((grp) => {
                    const isMember = grp.members.includes(currentUserName) || grp.members.includes('You');
                    const isPending = grp.pendingRequests.includes(currentUserName);

                    return (
                      <div
                        key={grp.id}
                        className={`rounded-2xl border overflow-hidden shadow-2xs transition flex flex-col group ${
                          isDark
                            ? 'bg-[#0f0720] border-purple-900/30 hover:border-purple-600/50 hover:bg-[#140a2b]'
                            : 'bg-white border-neutral-200 hover:border-purple-300 hover:shadow-md'
                        }`}
                      >
                        {/* Card Cover */}
                        <div
                          className="relative h-28 w-full bg-neutral-900 cursor-pointer overflow-hidden"
                          onClick={() => setSelectedGroupId(grp.id)}
                        >
                          <img
                            src={grp.coverImage}
                            alt={grp.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/60 text-white backdrop-blur-xs">
                            {grp.privacy === 'public' ? '🌐 Public' : '🔒 Private'}
                          </span>
                        </div>

                        {/* Card Content */}
                        <div className="p-3.5 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-2 -mt-7 mb-2">
                              <img
                                src={grp.avatar}
                                alt={grp.name}
                                className={`w-11 h-11 rounded-xl object-cover border-2 shadow-md ${
                                  isDark ? 'border-[#0f0720] bg-[#0f0720]' : 'border-white bg-white'
                                }`}
                              />
                            </div>
                            <h3
                              onClick={() => setSelectedGroupId(grp.id)}
                              className={`font-bold text-sm line-clamp-1 transition cursor-pointer ${
                                isDark ? 'text-white hover:text-purple-300' : 'text-neutral-900 hover:text-purple-600'
                              }`}
                            >
                              {grp.name}
                            </h3>
                            <p className={`text-[11px] line-clamp-2 mt-1 leading-relaxed ${
                              isDark ? 'text-purple-200/70' : 'text-neutral-500'
                            }`}>
                              {grp.description}
                            </p>
                            <div className={`flex items-center gap-2 mt-2 text-[11px] font-medium ${
                              isDark ? 'text-purple-300/50' : 'text-neutral-400'
                            }`}>
                              <span>{grp.members.length} members</span>
                              <span>·</span>
                              <span>{grp.category}</span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className={`pt-3 mt-3 border-t flex items-center justify-between gap-1.5 flex-wrap ${
                            isDark ? 'border-purple-900/30' : 'border-neutral-100'
                          }`}>
                            <div className="flex items-center gap-1">
                              {isMember && (
                                <button
                                  type="button"
                                  onClick={() => setGroupForAddMember(grp)}
                                  className={`h-8 px-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                                    isDark
                                      ? 'bg-purple-950/70 text-purple-300 border-purple-700/40 hover:bg-purple-900/80'
                                      : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200'
                                  }`}
                                  title="Add Member"
                                >
                                  <UserPlus className="w-3 h-3" />
                                  <span>Add</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setSelectedGroupId(grp.id)}
                                className={`h-8 px-2.5 rounded-xl text-xs font-semibold transition ${
                                  isDark ? 'text-purple-300 hover:text-white' : 'text-neutral-700 hover:text-purple-600'
                                }`}
                              >
                                View Posts →
                              </button>
                            </div>

                            {isMember ? (
                              <span className="h-8 px-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/40 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Joined</span>
                              </span>
                            ) : isPending ? (
                              <span className="h-8 px-2.5 rounded-xl bg-amber-500/20 text-amber-300 text-[11px] font-bold border border-amber-500/40 flex items-center">
                                Requested ⏳
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onRequestJoinGroup && onRequestJoinGroup(grp.id)}
                                className="h-8 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold transition shadow-2xs cursor-pointer flex items-center gap-1"
                              >
                                <Users className="w-3 h-3" />
                                <span>Join</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* --- SUBVIEW: ALL GROUP POSTS FEED --- */
            <div className={`flex-1 divide-y ${isDark ? 'divide-purple-900/30 bg-[#0c051a]' : 'divide-neutral-200 bg-white'}`}>
              {filteredPosts.length === 0 ? (
                <div className={`p-12 text-center ${isDark ? 'text-purple-300/60' : 'text-neutral-500'}`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 border ${
                    isDark ? 'bg-purple-900/40 text-purple-300 border-purple-700/40' : 'bg-purple-50 text-purple-600 border-purple-100'
                  }`}>
                    <Users className="w-6 h-6" />
                  </div>
                  <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-neutral-800'}`}>No group posts found</p>
                  <p className={`text-xs mt-1 ${isDark ? 'text-purple-300/50' : 'text-neutral-500'}`}>
                    Join groups or create a group post to start discussions!
                  </p>
                  <button
                    type="button"
                    onClick={() => setGroupSubView('directory')}
                    className="mt-3.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold transition shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Explore Groups</span>
                  </button>
                </div>
              ) : (
                filteredPosts.map((post) => renderPostItem(post))
              )}
            </div>
          )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. TAB B: ROOMS VIEW */}
      {/* ========================================================= */}
      {postMode === 'rooms' && (
        <div className={`flex-1 flex flex-col overflow-hidden items-center ${isDark ? 'bg-[#06020c]' : 'bg-neutral-50'}`}>
          <div className={`w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl flex-1 flex flex-col min-h-0 sm:border-x shadow-2xs overflow-hidden ${
            isDark ? 'bg-[#0c051a] border-purple-900/30' : 'bg-white border-neutral-200/80'
          }`}>
          {/* Full-width Room Filter Bar */}
          <div className={`w-full px-3 py-2 border-b shrink-0 shadow-2xs ${
            isDark ? 'bg-[#0f0720] border-purple-900/30' : 'bg-white border-neutral-200'
          }`}>
            <div className="relative w-full">
              <button
                type="button"
                id="btn-posts-room-filter"
                onClick={() => {
                  setIsRoomFilterDropdownOpen((prev) => !prev);
                  setIsGroupDropdownOpen(false);
                }}
                className={`w-full min-h-[42px] px-3.5 py-1.5 rounded-xl border flex items-center justify-between gap-3 transition cursor-pointer shadow-2xs text-left ${
                  isDark
                    ? 'bg-[#180a36] hover:bg-[#220d48] border-purple-800/40 text-white focus:border-purple-400'
                    : 'bg-neutral-50 hover:bg-neutral-100/80 border-neutral-200 hover:border-purple-300 focus:bg-white text-neutral-900'
                }`}
                title="Click to select or change room filter"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 border ${
                    isDark
                      ? 'bg-purple-900/40 text-purple-300 border-purple-700/40'
                      : 'bg-purple-100 text-purple-700 border-purple-200'
                  }`}>
                    <Filter className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                        {selectedRoomFilter === 'ALL'
                          ? `All Room (Combined Posts Across ${rooms.length} Rooms)`
                          : `#${selectedRoomFilter} • ${activeRoomObj?.title || 'Meeting Room'}`}
                      </span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold shrink-0 border ${
                        isDark
                          ? 'bg-purple-950/80 text-purple-300 border-purple-700/40'
                          : 'bg-purple-100 text-purple-800 border-transparent'
                      }`}>
                        {selectedRoomFilter === 'ALL'
                          ? 'All Rooms'
                          : `${activeRoomObj?.participants.length || 0} Members`}
                      </span>
                    </div>
                    <p className={`text-[10px] truncate mt-0.5 ${isDark ? 'text-purple-300/60' : 'text-neutral-500'}`}>
                      {selectedRoomFilter === 'ALL'
                        ? 'Showing posts across all rooms • Click to choose a specific room'
                        : `Viewing posts for #${selectedRoomFilter} (${activeRoomObj?.participants.length || 0} active participants) • Click to switch`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 pl-2">
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-150 ${
                      isRoomFilterDropdownOpen ? 'rotate-180 text-purple-400' : isDark ? 'text-purple-300/60' : 'text-neutral-500'
                    }`}
                  />
                </div>
              </button>

              {/* Full-width All Room Filter Dropdown */}
              {isRoomFilterDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsRoomFilterDropdownOpen(false)}
                  />
                  <div className={`absolute left-0 right-0 top-full mt-1.5 w-full rounded-2xl shadow-xl border z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-150 max-h-72 flex flex-col ${
                    isDark ? 'bg-[#0f0720] border-purple-900/40 shadow-2xl' : 'bg-white border-neutral-200 shadow-xl'
                  }`}>
                    <div className={`px-3.5 py-2 border-b flex items-center justify-between ${
                      isDark ? 'bg-[#15092a] border-purple-900/30' : 'bg-neutral-50 border-neutral-100'
                    }`}>
                      <span className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                        isDark ? 'text-purple-300/70' : 'text-neutral-500'
                      }`}>
                        <Filter className="w-3 h-3 text-purple-400" />
                        Choose Room Filter
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isDark
                          ? 'text-purple-300 bg-purple-950/80 border-purple-700/40'
                          : 'text-purple-700 bg-purple-50 border-purple-200/60'
                      }`}>
                        {rooms.length} Rooms
                      </span>
                    </div>

                    <div className={`overflow-y-auto py-1 divide-y ${
                      isDark ? 'divide-purple-900/30' : 'divide-neutral-100'
                    }`}>
                      {/* Option 1: All Room */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedRoomFilter('ALL');
                          setIsRoomFilterDropdownOpen(false);
                        }}
                        className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between text-xs transition cursor-pointer ${
                          selectedRoomFilter === 'ALL'
                            ? isDark
                              ? 'bg-purple-900/40 text-purple-200 font-bold'
                              : 'bg-purple-50 text-purple-900 font-bold'
                            : isDark
                            ? 'hover:bg-[#180a36] text-purple-200'
                            : 'hover:bg-neutral-50 text-neutral-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                            isDark ? 'bg-purple-900/40 text-purple-300' : 'bg-purple-100 text-purple-700'
                          }`}>
                            <MessageSquare className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className={`font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>All Room (အခန်းပေါင်းစုံ)</div>
                            <div className={`text-[10px] truncate ${isDark ? 'text-purple-300/60' : 'text-neutral-500'}`}>
                              Combined posts across all {rooms.length} active meeting rooms
                            </div>
                          </div>
                        </div>
                        {selectedRoomFilter === 'ALL' && (
                          <Check className="w-4 h-4 text-purple-400 shrink-0 ml-2" />
                        )}
                      </button>

                      {/* Option 2..N: Individual Rooms */}
                      {rooms.map((r) => {
                        const isSelected = selectedRoomFilter.toUpperCase() === r.token.toUpperCase();
                        return (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => {
                              setSelectedRoomFilter(r.token);
                              setSelectedPostToken(r.token);
                              setIsRoomFilterDropdownOpen(false);
                            }}
                            className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between text-xs transition cursor-pointer ${
                              isSelected
                                ? isDark
                                  ? 'bg-purple-900/40 text-purple-200 font-bold'
                                  : 'bg-purple-50 text-purple-900 font-bold'
                                : isDark
                                ? 'hover:bg-[#180a36] text-purple-200'
                                : 'hover:bg-neutral-50 text-neutral-800'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono text-[10px] font-bold shrink-0 ${
                                isDark ? 'bg-[#1f0d40] text-purple-300' : 'bg-neutral-100 text-neutral-700'
                              }`}>
                                #
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className={`font-bold truncate ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                                    {r.token}
                                  </span>
                                  <span className={`text-[10px] truncate ${isDark ? 'text-purple-300/60' : 'text-neutral-500'}`}>
                                    · {r.title}
                                  </span>
                                </div>
                                <div className={`text-[10px] truncate ${isDark ? 'text-purple-300/50' : 'text-neutral-500'}`}>
                                  {r.participants.length} participants · {r.category}
                                </div>
                              </div>
                            </div>
                            {isSelected && (
                              <Check className="w-4 h-4 text-purple-400 shrink-0 ml-2" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Quick inline composer for rooms */}
          <div className={`px-4 py-2 border-b flex items-center gap-2.5 shrink-0 ${
            isDark ? 'bg-[#0f0720] border-purple-900/30' : 'bg-white border-neutral-200'
          }`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
              {currentUserName[0]}
            </div>
            <button
              type="button"
              onClick={() => {
                if (selectedRoomFilter !== 'ALL') {
                  setSelectedPostToken(selectedRoomFilter);
                }
                setIsCreateModalOpen(true);
              }}
              className={`flex-1 h-9 px-3 border rounded-xl text-xs text-left transition cursor-pointer flex items-center justify-between ${
                isDark
                  ? 'bg-[#180a36] hover:bg-[#220d48] border-purple-800/40 text-purple-300/70'
                  : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-500'
              }`}
            >
              <span className="truncate">
                {selectedRoomFilter === 'ALL'
                  ? 'Post meeting discussion, notes or takeaway...'
                  : `Post an update in #${selectedRoomFilter}...`}
              </span>
              <Edit3 className="w-3.5 h-3.5 text-purple-400 shrink-0 ml-1.5" />
            </button>
          </div>

          {/* Room Posts Feed */}
          <div className={`flex-1 overflow-y-auto divide-y pb-24 ${
            isDark ? 'divide-purple-900/30 bg-[#0c051a]' : 'divide-neutral-200 bg-white'
          }`}>
            {filteredPosts.length === 0 ? (
              <div className={`p-12 text-center ${isDark ? 'text-purple-300/60' : 'text-neutral-500'}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 border ${
                  isDark ? 'bg-purple-900/40 text-purple-300 border-purple-700/40' : 'bg-purple-50 text-purple-600 border-purple-100'
                }`}>
                  <MessageSquare className="w-6 h-6" />
                </div>
                <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-neutral-800'}`}>
                  {selectedRoomFilter === 'ALL'
                    ? 'No room posts yet'
                    : `No posts found for #${selectedRoomFilter}`}
                </p>
                <p className={`text-xs mt-1 ${isDark ? 'text-purple-300/50' : 'text-neutral-500'}`}>
                  Be the first to post a takeaway or discussion for this room!
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedRoomFilter !== 'ALL') setSelectedPostToken(selectedRoomFilter);
                    setIsCreateModalOpen(true);
                  }}
                  className="mt-3.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold transition shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Create Room Post</span>
                </button>
              </div>
            ) : (
              filteredPosts.map((post) => renderPostItem(post))
            )}
          </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. TAB C: ALL POSTS VIEW */}
      {/* ========================================================= */}
      {postMode === 'all' && (
        <div className={`flex-1 flex flex-col overflow-hidden items-center ${isDark ? 'bg-[#06020c]' : 'bg-neutral-50'}`}>
          <div className={`w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl flex-1 flex flex-col min-h-0 sm:border-x shadow-2xs overflow-hidden ${
            isDark ? 'bg-[#0c051a] border-purple-900/30' : 'bg-white border-neutral-200/80'
          }`}>
          {/* Search bar */}
          <div className={`px-4 py-2 border-b flex items-center gap-2 shrink-0 ${
            isDark ? 'bg-[#0f0720] border-purple-900/30' : 'bg-white border-neutral-200'
          }`}>
            <div className={`flex-1 flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs ${
              isDark
                ? 'bg-[#180a36] border-purple-800/40 text-white'
                : 'bg-neutral-100 border-neutral-200 text-neutral-900'
            }`}>
              <Search className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <input
                type="text"
                placeholder="Search posts, topics, or #MEET tokens..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full bg-transparent outline-none ${
                  isDark ? 'text-white placeholder:text-purple-300/40' : 'text-neutral-900 placeholder:text-neutral-400'
                }`}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className={isDark ? 'text-purple-300/60 hover:text-white' : 'text-neutral-400 hover:text-neutral-700'}>
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Quick inline composer for all posts */}
          <div className={`px-4 py-2 border-b flex items-center gap-2.5 shrink-0 ${
            isDark ? 'bg-[#0f0720] border-purple-900/30' : 'bg-white border-neutral-200'
          }`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
              {currentUserName[0]}
            </div>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className={`flex-1 h-9 px-3 border rounded-xl text-xs text-left transition cursor-pointer flex items-center justify-between ${
                isDark
                  ? 'bg-[#180a36] hover:bg-[#220d48] border-purple-800/40 text-purple-300/70'
                  : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-500'
              }`}
            >
              <span className="truncate">What's on your mind? Share an update or meeting note...</span>
              <Edit3 className="w-3.5 h-3.5 text-purple-400 shrink-0 ml-1.5" />
            </button>
          </div>

          {/* Posts list */}
          <div className={`flex-1 overflow-y-auto divide-y pb-24 ${
            isDark ? 'divide-purple-900/30 bg-[#0c051a]' : 'divide-neutral-200 bg-white'
          }`}>
            {filteredPosts.length === 0 ? (
              <div className={`p-12 text-center ${isDark ? 'text-purple-300/60' : 'text-neutral-500'}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 border ${
                  isDark ? 'bg-purple-900/40 text-purple-300 border-purple-700/40' : 'bg-purple-50 text-purple-600 border-purple-100'
                }`}>
                  <MessageSquare className="w-6 h-6" />
                </div>
                <p className={`text-sm font-medium ${isDark ? 'text-purple-200' : 'text-neutral-700'}`}>No posts found</p>
                <p className={`text-xs mt-1 ${isDark ? 'text-purple-300/50' : 'text-neutral-500'}`}>Tap the edit button to publish a public or private post!</p>
              </div>
            ) : (
              filteredPosts.map((post) => renderPostItem(post))
            )}
          </div>
          </div>
        </div>
      )}

      {/* Floating Action Button for Creating Post */}
      <button
        type="button"
        id="btn-create-post-fab"
        onClick={() => setIsCreateModalOpen(true)}
        className="fixed bottom-20 right-5 sm:bottom-6 sm:right-6 w-14 h-14 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition z-30 cursor-pointer"
        title="Compose New Post"
      >
        <Edit3 className="w-6 h-6" />
      </button>

      {/* CREATE POST MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className={`rounded-2xl w-full max-w-lg shadow-2xl border overflow-hidden flex flex-col max-h-[90vh] ${
            isDark ? 'bg-[#0f0720] border-purple-900/40 text-white' : 'bg-white border-neutral-200 text-neutral-900'
          }`}>
            <div className={`px-5 py-4 border-b flex items-center justify-between ${
              isDark ? 'border-purple-900/30' : 'border-neutral-200'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isDark ? 'bg-purple-900/40 text-purple-300' : 'bg-purple-50 text-purple-600'
                }`}>
                  <Edit3 className="w-4 h-4" />
                </div>
                <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-neutral-900'}`}>Create New Post</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition ${
                  isDark ? 'hover:bg-[#1f0d40] text-purple-300/70 hover:text-white' : 'hover:bg-neutral-100 text-neutral-500'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="p-5 space-y-4 overflow-y-auto">
              {/* Target Meeting Room Token */}
              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-purple-200' : 'text-neutral-700'}`}>
                  Meeting Discussion Token
                </label>
                <select
                  value={selectedPostToken}
                  onChange={(e) => setSelectedPostToken(e.target.value)}
                  className={`w-full rounded-xl px-3 py-2 text-xs focus:border-purple-500 outline-none border transition ${
                    isDark
                      ? 'bg-[#180a36] border-purple-800/40 text-white'
                      : 'bg-neutral-50 border-neutral-300 text-neutral-900'
                  }`}
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.token} className={isDark ? 'bg-[#140a2b] text-white' : ''}>
                      {r.token} - {r.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Optional: Post to CooM Group */}
              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-purple-200' : 'text-neutral-700'}`}>
                  Post Destination
                </label>
                <select
                  value={selectedPostGroupId}
                  onChange={(e) => setSelectedPostGroupId(e.target.value)}
                  className={`w-full rounded-xl px-3 py-2 text-xs focus:border-purple-500 outline-none font-medium border transition ${
                    isDark
                      ? 'bg-[#180a36] border-purple-800/40 text-white'
                      : 'bg-neutral-50 border-neutral-300 text-neutral-900'
                  }`}
                >
                  <option value="none" className={isDark ? 'bg-[#140a2b] text-white' : ''}>🌐 Main Public Feed (All users)</option>
                  {groups.map((grp) => (
                    <option key={grp.id} value={grp.id} className={isDark ? 'bg-[#140a2b] text-white' : ''}>
                      👥 In Group: {grp.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Visibility Choice */}
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-purple-200' : 'text-neutral-700'}`}>Visibility</label>
                <div className="grid grid-cols-2 gap-2">
                  <div
                    onClick={() => setPostVisibility('public')}
                    className={`p-2.5 rounded-xl border transition cursor-pointer flex flex-col gap-1 ${
                      postVisibility === 'public'
                        ? isDark
                          ? 'bg-purple-950/80 border-purple-500 ring-2 ring-purple-500/20'
                          : 'bg-purple-50/80 border-purple-500 ring-2 ring-purple-500/20'
                        : isDark
                        ? 'bg-[#180a36] border-purple-800/40 hover:border-purple-600/50'
                        : 'bg-neutral-50 border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Globe className={`w-3.5 h-3.5 ${postVisibility === 'public' ? 'text-purple-400' : isDark ? 'text-purple-300/50' : 'text-neutral-500'}`} />
                      <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>Public</span>
                    </div>
                    <p className={`text-[10px] leading-snug ${isDark ? 'text-purple-300/60' : 'text-neutral-500'}`}>
                      Visible to everyone in feed.
                    </p>
                  </div>

                  <div
                    onClick={() => setPostVisibility('private')}
                    className={`p-2.5 rounded-xl border transition cursor-pointer flex flex-col gap-1 ${
                      postVisibility === 'private'
                        ? isDark
                          ? 'bg-purple-950/80 border-purple-500 ring-2 ring-purple-500/20'
                          : 'bg-purple-50/80 border-purple-500 ring-2 ring-purple-500/20'
                        : isDark
                        ? 'bg-[#180a36] border-purple-800/40 hover:border-purple-600/50'
                        : 'bg-neutral-50 border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Lock className={`w-3.5 h-3.5 ${postVisibility === 'private' ? 'text-purple-400' : isDark ? 'text-purple-300/50' : 'text-neutral-500'}`} />
                      <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>Private</span>
                    </div>
                    <p className={`text-[10px] leading-snug ${isDark ? 'text-purple-300/60' : 'text-neutral-500'}`}>
                      Visible ONLY to you in your profile.
                    </p>
                  </div>
                </div>
              </div>

              {/* Content Box */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={`block text-xs font-semibold ${isDark ? 'text-purple-200' : 'text-neutral-700'}`}>Post Content</label>
                  <button
                    type="button"
                    onClick={handleQuickInsertSummary}
                    className="text-[11px] text-purple-400 hover:text-purple-300 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" /> Insert Summary
                  </button>
                </div>
                <textarea
                  id="input-post-content"
                  rows={4}
                  placeholder="Share meeting highlights, key takeaways, and updates..."
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  className={`w-full rounded-xl p-3 text-xs focus:border-purple-500 outline-none resize-none leading-relaxed border transition ${
                    isDark
                      ? 'bg-[#180a36] border-purple-800/40 text-white placeholder:text-purple-300/40'
                      : 'bg-neutral-50 border-neutral-300 text-neutral-900 placeholder:text-neutral-400'
                  }`}
                />

                {/* Attached Media Preview */}
                {postMediaUrl && (
                  <div className={`relative mt-2.5 rounded-xl overflow-hidden border max-h-52 ${
                    isDark ? 'border-purple-800/40 bg-black/60' : 'border-neutral-200 bg-neutral-100'
                  }`}>
                    {postMediaType === 'video' ? (
                      <video src={postMediaUrl} controls className="w-full max-h-52 object-contain bg-black" />
                    ) : (
                      <img src={postMediaUrl} alt="Attached" className="w-full max-h-52 object-cover" />
                    )}
                    <button
                      type="button"
                      onClick={() => setPostMediaUrl('')}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition cursor-pointer"
                      title="Remove attachment"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Media Attachment toolbar */}
                <div className={`mt-2.5 p-2 rounded-xl border flex flex-wrap items-center justify-between gap-2 ${
                  isDark ? 'bg-[#140a2b] border-purple-900/30' : 'bg-neutral-50 border-neutral-200/80'
                }`}>
                  <span className={`text-[11px] font-semibold ${isDark ? 'text-purple-300/70' : 'text-neutral-500'}`}>Attach Media:</span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <label className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition cursor-pointer shadow-2xs ${
                      isDark
                        ? 'bg-[#1f0d40] border-purple-700/40 hover:border-purple-400 text-purple-200'
                        : 'bg-white border-neutral-200 hover:border-purple-300 text-neutral-700'
                    }`}>
                      <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
                      <span>Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'post')}
                      />
                    </label>

                    <label className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition cursor-pointer shadow-2xs ${
                      isDark
                        ? 'bg-[#1f0d40] border-purple-700/40 hover:border-purple-400 text-purple-200'
                        : 'bg-white border-neutral-200 hover:border-purple-300 text-neutral-700'
                    }`}>
                      <Film className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Video</span>
                      <input
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'post')}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        setPostMediaUrl('https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&fit=crop');
                        setPostMediaType('image');
                      }}
                      className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition cursor-pointer ${
                        isDark ? 'bg-purple-900/40 text-purple-300 hover:bg-purple-800/50' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                      }`}
                    >
                      Sample Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPostMediaUrl('https://assets.mixkit.co/videos/preview/mixkit-software-developer-working-on-code-41584-large.mp4');
                        setPostMediaType('video');
                      }}
                      className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition cursor-pointer ${
                        isDark ? 'bg-indigo-900/40 text-indigo-300 hover:bg-indigo-800/50' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                      }`}
                    >
                      Sample Video
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl transition cursor-pointer ${
                    isDark ? 'bg-[#180a36] text-purple-200 hover:bg-[#220d48]' : 'bg-neutral-100 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200'
                  }`}
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-post"
                  type="submit"
                  disabled={!postContent.trim() && !postMediaUrl}
                  className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-40 rounded-xl transition shadow-md shadow-purple-500/20 cursor-pointer"
                >
                  Post {postVisibility === 'private' ? '(Private)' : '(Public)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REPOST & QUOTE MENU MODAL */}
      {repostMenuPost && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
          onClick={() => setRepostMenuPost(null)}
        >
          <div
            className={`w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl shadow-2xl border overflow-hidden p-4 space-y-2 animate-in slide-in-from-bottom-4 duration-200 ${
              isDark ? 'bg-[#0f0720] border-purple-900/40 text-white' : 'bg-white border-neutral-200'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`flex items-center justify-between pb-2 border-b ${
              isDark ? 'border-purple-900/30' : 'border-neutral-100'
            }`}>
              <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-purple-300/70' : 'text-neutral-500'}`}>
                Repost Options
              </span>
              <button
                type="button"
                onClick={() => setRepostMenuPost(null)}
                className={`w-7 h-7 rounded-full flex items-center justify-center cursor-pointer ${
                  isDark ? 'hover:bg-[#1f0d40] text-purple-300/70' : 'hover:bg-neutral-100 text-neutral-500'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Option 1: Direct Repost Confirm */}
            <button
              id="btn-confirm-repost"
              type="button"
              onClick={() => handleConfirmRepost(repostMenuPost)}
              className={`w-full p-3.5 rounded-xl border transition flex items-center gap-3 text-left cursor-pointer group ${
                isDark ? 'border-purple-900/30 hover:bg-[#180a36]' : 'border-neutral-200/80 hover:bg-neutral-50'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition">
                <Repeat className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`font-bold text-sm flex items-center gap-2 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                  <span>{repostMenuPost.isReposted ? 'Undo Repost' : 'Repost'}</span>
                  {repostMenuPost.isReposted && (
                    <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/30">
                      Active
                    </span>
                  )}
                </div>
                <p className={`text-xs truncate ${isDark ? 'text-purple-300/60' : 'text-neutral-500'}`}>
                  {repostMenuPost.isReposted
                    ? 'Remove this repost from your feed'
                    : 'Instantly repost to your feed & profile'}
                </p>
              </div>
            </button>

            {/* Option 2: Quote Post */}
            <button
              id="btn-open-quote"
              type="button"
              onClick={() => handleOpenQuoteModal(repostMenuPost)}
              className={`w-full p-3.5 rounded-xl border transition flex items-center gap-3 text-left cursor-pointer group ${
                isDark ? 'border-purple-900/30 hover:bg-[#180a36]' : 'border-neutral-200/80 hover:bg-neutral-50'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition ${
                isDark ? 'bg-purple-900/40 text-purple-300 group-hover:bg-purple-600 group-hover:text-white' : 'bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white'
              }`}>
                <Edit3 className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`font-bold text-sm ${isDark ? 'text-white' : 'text-neutral-900'}`}>Quote</div>
                <p className={`text-xs truncate ${isDark ? 'text-purple-300/60' : 'text-neutral-500'}`}>
                  Add your commentary, photo or video before sharing
                </p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* QUOTE POST MODAL (CooM Style) */}
      {quoteModalPost && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className={`rounded-2xl w-full max-w-lg shadow-2xl border overflow-hidden flex flex-col max-h-[90vh] ${
            isDark ? 'bg-[#0f0720] border-purple-900/40 text-white' : 'bg-white border-neutral-200'
          }`}>
            <div className={`px-5 py-3.5 border-b flex items-center justify-between ${
              isDark ? 'border-purple-900/30' : 'border-neutral-200'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isDark ? 'bg-purple-900/40 text-purple-300' : 'bg-purple-50 text-purple-600'
                }`}>
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-neutral-900'}`}>Quote Post</h3>
                  <p className={`text-[11px] ${isDark ? 'text-purple-300/60' : 'text-neutral-500'}`}>Add commentary or media to repost</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuoteModalPost(null)}
                className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer ${
                  isDark ? 'hover:bg-[#1f0d40] text-purple-300/70' : 'hover:bg-neutral-100 text-neutral-500'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateQuotePost} className="p-5 space-y-3.5 overflow-y-auto">
              {/* Current user header */}
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                  {currentUserName[0]}
                </div>
                <div>
                  <span className={`font-bold text-xs ${isDark ? 'text-white' : 'text-neutral-900'}`}>{currentUserName}</span>
                  <p className={`text-[10px] ${isDark ? 'text-purple-300/60' : 'text-neutral-400'}`}>
                    Replying with a quote to @{quoteModalPost.handle || quoteModalPost.author.replace(/\s+/g, '').toLowerCase()}
                  </p>
                </div>
              </div>

              {/* Quote comment text area */}
              <textarea
                id="input-quote-content"
                rows={3}
                placeholder="Add your comment or thoughts..."
                value={quoteText}
                onChange={(e) => setQuoteText(e.target.value)}
                className={`w-full rounded-xl p-3 text-xs focus:border-purple-500 outline-none resize-none leading-relaxed border transition ${
                  isDark
                    ? 'bg-[#180a36] border-purple-800/40 text-white placeholder:text-purple-300/40'
                    : 'bg-neutral-50 border-neutral-300 text-neutral-900 placeholder:text-neutral-400'
                }`}
                autoFocus
              />

              {/* Media preview if attached */}
              {quoteMediaUrl && (
                <div className={`relative rounded-xl overflow-hidden border max-h-48 ${
                  isDark ? 'border-purple-800/40 bg-black/60' : 'border-neutral-200 bg-neutral-100'
                }`}>
                  {quoteMediaType === 'video' ? (
                    <video src={quoteMediaUrl} controls className="w-full max-h-48 object-contain bg-black" />
                  ) : (
                    <img src={quoteMediaUrl} alt="Quote Attachment" className="w-full max-h-48 object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => setQuoteMediaUrl('')}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Media attachment toolbar for Quote */}
              <div className={`p-2 rounded-xl border flex flex-wrap items-center justify-between gap-2 ${
                isDark ? 'bg-[#140a2b] border-purple-900/30' : 'bg-neutral-50 border-neutral-200/80'
              }`}>
                <span className={`text-[11px] font-semibold ${isDark ? 'text-purple-300/70' : 'text-neutral-500'}`}>Attach Media:</span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <label className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition cursor-pointer shadow-2xs ${
                    isDark
                      ? 'bg-[#1f0d40] border-purple-700/40 hover:border-purple-400 text-purple-200'
                      : 'bg-white border-neutral-200 hover:border-purple-300 text-neutral-700'
                  }`}>
                    <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
                    <span>Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'quote')}
                    />
                  </label>

                  <label className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition cursor-pointer shadow-2xs ${
                    isDark
                      ? 'bg-[#1f0d40] border-purple-700/40 hover:border-purple-400 text-purple-200'
                      : 'bg-white border-neutral-200 hover:border-purple-300 text-neutral-700'
                  }`}>
                    <Film className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Video</span>
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'quote')}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setQuoteMediaUrl('https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&fit=crop');
                      setQuoteMediaType('image');
                    }}
                    className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition cursor-pointer ${
                      isDark ? 'bg-purple-900/40 text-purple-300 hover:bg-purple-800/50' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                    }`}
                  >
                    Sample Photo
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setQuoteMediaUrl('https://assets.mixkit.co/videos/preview/mixkit-software-developer-working-on-code-41584-large.mp4');
                      setQuoteMediaType('video');
                    }}
                    className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition cursor-pointer ${
                      isDark ? 'bg-indigo-900/40 text-indigo-300 hover:bg-indigo-800/50' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                    }`}
                  >
                    Sample Video
                  </button>
                </div>
              </div>

              {/* Embedded Quoted Post Preview (X Card) */}
              <div className={`rounded-xl border p-3 select-none ${
                isDark ? 'border-purple-900/40 bg-[#140a2b]' : 'border-neutral-200 bg-neutral-50'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold text-[10px]">
                    {quoteModalPost.author[0]}
                  </div>
                  <span className={`font-bold text-xs ${isDark ? 'text-white' : 'text-neutral-900'}`}>{quoteModalPost.author}</span>
                  <span className={`text-[10px] ${isDark ? 'text-purple-300/60' : 'text-neutral-500'}`}>
                    @{quoteModalPost.handle || quoteModalPost.author.replace(/\s+/g, '').toLowerCase()} · {quoteModalPost.timestamp}
                  </span>
                  {quoteModalPost.meetingToken && (
                    <span className={`ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                      isDark ? 'text-purple-300 bg-purple-950/80 border-purple-700/40' : 'text-purple-600 bg-purple-50 border-purple-200'
                    }`}>
                      {quoteModalPost.meetingToken}
                    </span>
                  )}
                </div>
                <p className={`text-xs leading-relaxed line-clamp-3 ${isDark ? 'text-purple-100/90' : 'text-neutral-700'}`}>
                  {quoteModalPost.content}
                </p>
                {quoteModalPost.mediaUrl && (
                  <div className={`mt-2 rounded-lg overflow-hidden max-h-32 border bg-black ${
                    isDark ? 'border-purple-800/40' : 'border-neutral-200'
                  }`}>
                    {quoteModalPost.mediaType === 'video' ? (
                      <video src={quoteModalPost.mediaUrl} className="w-full max-h-32 object-cover" muted />
                    ) : (
                      <img src={quoteModalPost.mediaUrl} alt="Original media" className="w-full max-h-32 object-cover" />
                    )}
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setQuoteModalPost(null)}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl transition cursor-pointer ${
                    isDark ? 'bg-[#180a36] text-purple-200 hover:bg-[#220d48]' : 'bg-neutral-100 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200'
                  }`}
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-quote-post"
                  type="submit"
                  disabled={!quoteText.trim() && !quoteMediaUrl}
                  className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-40 rounded-xl transition shadow-md shadow-purple-500/20 cursor-pointer"
                >
                  Quote Repost
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast feedback */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-neutral-900/90 text-white text-xs px-4 py-2 rounded-full shadow-xl backdrop-blur-md flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200 pointer-events-none">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* CREATE GROUP MODAL */}
      {isCreateGroupModalOpen && (
        <CreateGroupModal
          isOpen={isCreateGroupModalOpen}
          onClose={() => setIsCreateGroupModalOpen(false)}
          currentUser={currentUser}
          rooms={rooms}
          themeMode={themeMode}
          onCreateGroup={(data) => {
            if (onCreateGroup) onCreateGroup(data);
            setIsCreateGroupModalOpen(false);
          }}
        />
      )}

      {/* GROUP SETTINGS & MEMBERS MODAL */}
      {groupForSettings && (
        <GroupSettingsModal
          isOpen={Boolean(groupForSettings)}
          onClose={() => setGroupForSettings(null)}
          group={groups.find((g) => g.id === groupForSettings.id) || groupForSettings}
          currentUser={currentUser}
          themeMode={themeMode}
          onUpdateGroup={(groupId, updates) => onUpdateGroup && onUpdateGroup(groupId, updates)}
          onAddUserToGroup={(groupId, userName) => onAddUserToGroup && onAddUserToGroup(groupId, userName)}
          onRemoveUserFromGroup={(groupId, userName) =>
            onRemoveUserFromGroup && onRemoveUserFromGroup(groupId, userName)
          }
          onApproveRequest={(groupId, userName) => onApproveJoinRequest && onApproveJoinRequest(groupId, userName)}
          onDeclineRequest={(groupId, userName) => onDeclineJoinRequest && onDeclineJoinRequest(groupId, userName)}
          onLeaveGroup={(groupId) => onLeaveGroup && onLeaveGroup(groupId)}
        />
      )}

      {/* ADD MEMBER MODAL */}
      {groupForAddMember && (
        <AddMemberModal
          isOpen={Boolean(groupForAddMember)}
          onClose={() => setGroupForAddMember(null)}
          group={groups.find((g) => g.id === groupForAddMember.id) || groupForAddMember}
          currentUser={currentUser}
          themeMode={themeMode}
          onAddUserToGroup={(groupId, userName) => {
            if (onAddUserToGroup) {
              onAddUserToGroup(groupId, userName);
            }
          }}
        />
      )}
    </div>
  );
};

// Highlight hashtags like #MEET-9021 in purple accent
function formatContentWithHashtags(text: string) {
  const parts = text.split(/(#[A-Za-z0-9_-]+)/g);
  return parts.map((part, i) => {
    if (part.startsWith('#')) {
      return (
        <span key={i} className="text-purple-600 font-semibold">
          {part}
        </span>
      );
    }
    return part;
  });
}
