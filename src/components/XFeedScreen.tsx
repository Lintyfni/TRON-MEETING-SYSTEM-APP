import React, { useState } from 'react';
import { PostItem, MeetingRoom, UserProfile, PostComment, FacebookGroup } from '../types';
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
} from 'lucide-react';
import { CreateGroupModal } from './CreateGroupModal';
import { GroupSettingsModal } from './GroupSettingsModal';
import { AddMemberModal } from './AddMemberModal';

interface XFeedScreenProps {
  posts: PostItem[];
  rooms: MeetingRoom[];
  initialNewPostText?: string;
  onAddPost: (
    token: string,
    content: string,
    visibility?: 'public' | 'private',
    groupId?: string,
    groupName?: string
  ) => void;
  onToggleLike: (postId: string) => void;
  onToggleRepost?: (postId: string) => void;
  onAddComment?: (postId: string, content: string) => void;
  onToggleCommentLike?: (postId: string, commentId: string) => void;
  onSelectMeetingToken?: (token: string) => void;
  onGoToMeeting?: () => void;
  currentUser?: UserProfile;
  // Groups props
  groups?: FacebookGroup[];
  activeGroupId?: string | null;
  onSelectGroup?: (groupId: string | null) => void;
  onCreateGroup?: (groupData: any) => void;
  onUpdateGroup?: (groupId: string, updates: Partial<FacebookGroup>) => void;
  onAddUserToGroup?: (groupId: string, userName: string) => void;
  onRemoveUserFromGroup?: (groupId: string, userName: string) => void;
  onRequestJoinGroup?: (groupId: string) => void;
  onApproveJoinRequest?: (groupId: string, userName: string) => void;
  onDeclineJoinRequest?: (groupId: string, userName: string) => void;
  onLeaveGroup?: (groupId: string) => void;
  onOpenGroupChat?: (groupId: string) => void;
}

export const XFeedScreen: React.FC<XFeedScreenProps> = ({
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
}) => {
  const [activeTab, setActiveTab] = useState<'feed' | 'groups'>('feed');
  const [selectedTokenFilter, setSelectedTokenFilter] = useState<string>('All');
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

  // Group specific states
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(activeGroupId || null);
  const [groupSearchQuery, setGroupSearchQuery] = useState('');
  const [groupCategoryFilter, setGroupCategoryFilter] = useState('All');
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [groupForSettings, setGroupForSettings] = useState<FacebookGroup | null>(null);
  const [groupForAddMember, setGroupForAddMember] = useState<FacebookGroup | null>(null);
  const [groupLayoutMode, setGroupLayoutMode] = useState<'list' | 'grid'>('list');
  const [groupPostInput, setGroupPostInput] = useState('');

  const currentUserName = currentUser?.name || 'Aung Myint';

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
        selectedTokenFilter === 'All' ? rooms[0]?.token || 'MEET-001' : selectedTokenFilter;
      onSelectMeetingToken(targetToken);
    }
  };

  const filteredPosts = posts
    .filter((p) => (selectedTokenFilter === 'All' ? true : p.meetingToken === selectedTokenFilter))
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
    if (!postContent.trim()) return;

    let targetGroupId: string | undefined = undefined;
    let targetGroupName: string | undefined = undefined;

    if (selectedPostGroupId !== 'none') {
      const matchedGroup = groups.find((g) => g.id === selectedPostGroupId);
      if (matchedGroup) {
        targetGroupId = matchedGroup.id;
        targetGroupName = matchedGroup.name;
      }
    }

    onAddPost(selectedPostToken, postContent.trim(), postVisibility, targetGroupId, targetGroupName);
    setPostContent('');
    setPostVisibility('public');
    setSelectedPostGroupId('none');
    setIsCreateModalOpen(false);
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

  return (
    <div id="xfeed-screen" className="relative w-full h-full bg-neutral-50 text-neutral-900 flex flex-col overflow-hidden">
      {/* 1. APP BAR */}
      <div className="sticky top-0 z-20 bg-white border-b border-neutral-200 px-3 py-2 flex items-center justify-between gap-1.5 shadow-2xs">
        {/* Left: Feed / Groups Switcher Tabs */}
        <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl border border-neutral-200/80 shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab('feed');
              setSelectedGroupId(null);
            }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'feed'
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span>Posts</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('groups')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'groups'
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 shrink-0" />
            <span>Groups</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold text-white ${
                activeTab === 'groups' ? 'bg-white/25' : 'bg-purple-600'
              }`}
            >
              {groups.filter((g) => g.members.includes(currentUserName) || g.members.includes('You')).length}
            </span>
          </button>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-1.5 shrink-0">
          {activeTab === 'feed' ? (
            <>
              {/* Token Filter Dropdown */}
              <div className="relative flex items-center">
                <select
                  id="select-token-filter"
                  value={selectedTokenFilter}
                  onChange={(e) => setSelectedTokenFilter(e.target.value)}
                  className="bg-white border border-neutral-200 rounded-xl h-8 pl-2.5 pr-6 text-xs text-purple-700 font-semibold focus:outline-none focus:border-purple-500 appearance-none cursor-pointer shadow-2xs max-w-[92px] truncate"
                >
                  <option value="All" className="bg-white text-neutral-900">
                    All Tokens
                  </option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.token} className="bg-white text-purple-700 font-medium">
                      {r.token}
                    </option>
                  ))}
                </select>
                <Filter className="w-3 h-3 text-purple-600 absolute right-2 pointer-events-none" />
              </div>

              {/* Go to Meeting */}
              <button
                type="button"
                id="btn-post-goto-meeting"
                onClick={handleGoToMeeting}
                className="h-8 px-2.5 rounded-xl bg-neutral-100 hover:bg-purple-50 text-neutral-700 hover:text-purple-700 hover:border-purple-300 text-xs font-semibold flex items-center gap-1.5 border border-neutral-200 transition shadow-2xs cursor-pointer shrink-0"
                title="Go to Live Meeting"
              >
                <Video className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span>Meet</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setIsCreateGroupModalOpen(true)}
              className="h-8 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span>Create Group</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. TAB A: GROUPS VIEW */}
      {/* ========================================================= */}
      {activeTab === 'groups' && (
        <div className="flex-1 overflow-y-auto pb-24 bg-neutral-50">
          {currentOpenGroup ? (
            /* --- SUBVIEW: SPECIFIC GROUP FEED --- */
            <div className="animate-in fade-in">
              {/* Back Bar */}
              <div className="px-3 py-2 bg-white border-b border-neutral-200 flex items-center justify-between gap-1.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setSelectedGroupId(null)}
                  className="h-8 px-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Add Member Button in Top Bar */}
                  <button
                    type="button"
                    onClick={() => setGroupForAddMember(currentOpenGroup)}
                    className="h-8 px-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
                    title="Add Member to Group"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>

                  {onOpenGroupChat && (
                    <button
                      type="button"
                      onClick={() => onOpenGroupChat(currentOpenGroup.id)}
                      className="h-8 px-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-200 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
                      title="Open Group Chat"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
                      <span>Chat</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setGroupForSettings(currentOpenGroup)}
                    className="h-8 px-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-200 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer relative shrink-0"
                    title="Group Settings, Members & Approvals"
                  >
                    <Settings className="w-3.5 h-3.5 text-neutral-600" />
                    {currentOpenGroup.pendingRequests.length > 0 && (
                      <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-extrabold flex items-center justify-center">
                        {currentOpenGroup.pendingRequests.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Group Cover Banner & Info */}
              <div className="bg-white border-b border-neutral-200">
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
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-3 border-white shadow-xl"
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
                    <p className="text-xs text-neutral-700 leading-relaxed">{currentOpenGroup.description}</p>
                    <p className="text-[11px] text-neutral-400 mt-1">
                      Created by <strong className="text-neutral-700">{currentOpenGroup.admin}</strong> · Category: {currentOpenGroup.category}
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
                          className="h-8 px-3.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 text-xs font-semibold hover:bg-purple-100 transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Add Member</span>
                        </button>
                        <span className="h-8 px-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Joined</span>
                        </span>
                      </>
                    ) : currentOpenGroup.pendingRequests.includes(currentUserName) ? (
                      <span className="h-8 px-3 rounded-xl bg-amber-50 text-amber-800 border border-amber-300 text-xs font-bold flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                        <span>Requested (Pending Admin Approval)</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onRequestJoinGroup && onRequestJoinGroup(currentOpenGroup.id)}
                        className="h-8 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-md shadow-purple-200 cursor-pointer flex items-center gap-1.5"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Join Group</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Group Post Composer */}
              <div className="p-4 bg-white border-b border-neutral-200 shadow-2xs">
                <form onSubmit={handleCreateGroupDirectPost} className="space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face'}
                      alt="You"
                      className="w-8 h-8 rounded-full object-cover border border-neutral-200"
                    />
                    <input
                      type="text"
                      value={groupPostInput}
                      onChange={(e) => setGroupPostInput(e.target.value)}
                      placeholder={`Write something in ${currentOpenGroup.name}...`}
                      className="flex-1 bg-neutral-100 hover:bg-neutral-100/80 focus:bg-white border border-neutral-200 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 outline-none transition"
                    />
                    <button
                      type="submit"
                      disabled={!groupPostInput.trim()}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold transition cursor-pointer shadow-2xs flex items-center gap-1"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Post</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Group Posts Stream */}
              <div className="divide-y divide-neutral-200 bg-white">
                {posts.filter((p) => p.groupId === currentOpenGroup.id).length === 0 ? (
                  <div className="p-12 text-center text-neutral-400 text-xs">
                    <Users className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
                    <p className="font-semibold text-neutral-700">No posts in this group yet</p>
                    <p className="text-neutral-400 mt-1">Be the first to share discussions or updates in this group!</p>
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
                          className="p-4 hover:bg-neutral-50/80 transition duration-150 flex flex-col"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                                {post.author[0]}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-sm text-neutral-900 truncate">{post.author}</span>
                                  <span className="text-[11px] text-neutral-500">· {post.timestamp}</span>
                                </div>
                                <span className="text-[11px] text-neutral-500">
                                  @{post.author.replace(/\s+/g, '').toLowerCase()}
                                </span>
                              </div>
                            </div>

                            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-bold">
                              {currentOpenGroup.name}
                            </span>
                          </div>

                          <div className="mt-2.5 text-sm text-neutral-800 leading-relaxed pl-11 whitespace-pre-line">
                            {formatContentWithHashtags(post.content)}
                          </div>

                          {/* Post Action Buttons */}
                          <div className="mt-3 flex items-center justify-between text-neutral-500 text-xs pl-11 pr-6 max-w-sm">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedCommentsPostId((prev) => (prev === post.id ? null : post.id))
                              }
                              className={`flex items-center gap-1.5 transition cursor-pointer ${
                                isCommentsOpen ? 'text-blue-600 font-bold' : 'hover:text-blue-600'
                              }`}
                            >
                              <MessageSquare className="w-4 h-4" />
                              <span>{commentsCount}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => onToggleRepost?.(post.id)}
                              className={`flex items-center gap-1.5 transition cursor-pointer ${
                                isReposted ? 'text-emerald-600 font-bold' : 'hover:text-emerald-600'
                              }`}
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
                              className="flex items-center gap-1.5 hover:text-blue-600 transition cursor-pointer"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Expanded Comments */}
                          {isCommentsOpen && (
                            <div className="mt-3 pl-11 pr-4 pt-3 border-t border-neutral-100">
                              <div className="space-y-2 mb-3">
                                {post.comments && post.comments.length > 0 ? (
                                  post.comments.map((comment) => (
                                    <div key={comment.id} className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200/60 text-xs">
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="font-bold text-neutral-900">{comment.author}</span>
                                        <span className="text-[10px] text-neutral-400">{comment.timestamp}</span>
                                      </div>
                                      <p className="text-neutral-700">{comment.content}</p>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-xs text-neutral-400 py-1">No comments yet.</p>
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
                                  className="flex-1 px-3 py-1.5 text-xs bg-neutral-50 border border-neutral-300 rounded-xl focus:border-blue-500 outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSendComment(post.id)}
                                  className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700"
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
          ) : (
            /* --- SUBVIEW: GROUP DISCOVERY & SEARCH LIST --- */
            <div className="p-4 space-y-4 max-w-4xl mx-auto animate-in fade-in">
              {/* Search Groups & Action Header */}
              <div className="flex flex-col sm:flex-row items-center gap-2.5">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-2.5" />
                  <input
                    type="text"
                    value={groupSearchQuery}
                    onChange={(e) => setGroupSearchQuery(e.target.value)}
                    placeholder="Search groups by name, category, or topic..."
                    className="w-full pl-10 pr-8 h-9 text-xs bg-white border border-neutral-300 rounded-xl text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-purple-500 shadow-2xs transition"
                  />
                  {groupSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setGroupSearchQuery('')}
                      className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* View Mode & Create Group buttons */}
                <div className="flex items-center gap-1.5 w-full sm:w-auto shrink-0 justify-end">
                  {/* List / Grid Toggle */}
                  <div className="flex items-center bg-neutral-200/80 p-0.5 rounded-xl border border-neutral-300/80">
                    <button
                      type="button"
                      onClick={() => setGroupLayoutMode('list')}
                      className={`h-7 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                        groupLayoutMode === 'list'
                          ? 'bg-white text-purple-700 shadow-2xs'
                          : 'text-neutral-600 hover:text-neutral-900'
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
                          ? 'bg-white text-purple-700 shadow-2xs'
                          : 'text-neutral-600 hover:text-neutral-900'
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
                    className="h-8 px-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer shrink-0"
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
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition cursor-pointer ${
                        groupCategoryFilter === cat
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                      }`}
                    >
                      {cat}
                    </button>
                  )
                )}
              </div>

              {/* Group List or Grid */}
              {filteredGroups.length === 0 ? (
                <div className="py-16 text-center text-neutral-500 bg-white rounded-2xl border border-neutral-200 p-6">
                  <Users className="w-12 h-12 text-neutral-300 mx-auto mb-2" />
                  <p className="font-bold text-neutral-800 text-sm">No groups matched your search</p>
                  <p className="text-neutral-400 text-xs mt-1">Try another keyword or create your own group!</p>
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
                        className="bg-white rounded-2xl border border-neutral-200 hover:border-purple-300 p-3.5 shadow-2xs hover:shadow-xs transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
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
                              className="w-12 h-12 rounded-xl object-cover border border-neutral-200 group-hover:scale-105 transition"
                            />
                            <span className="absolute -bottom-1 -right-1 text-[9px] px-1 py-0.2 rounded-full bg-black/70 text-white font-bold">
                              {grp.privacy === 'public' ? '🌐' : '🔒'}
                            </span>
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3
                                onClick={() => setSelectedGroupId(grp.id)}
                                className="font-bold text-sm text-neutral-900 hover:text-purple-600 transition cursor-pointer truncate"
                              >
                                {grp.name}
                              </h3>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
                                {grp.category}
                              </span>
                            </div>
                            <p className="text-xs text-neutral-500 line-clamp-1 mt-0.5">
                              {grp.description}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5 text-[11px] text-neutral-400 font-medium flex-wrap">
                              <span className="text-neutral-700 font-semibold">{grp.members.length} members</span>
                              <span>·</span>
                              <span>Admin: <strong className="text-neutral-700">{grp.admin}</strong></span>
                              {grp.linkedMeetingToken && (
                                <>
                                  <span>·</span>
                                  <span className="text-purple-600 font-mono font-semibold">{grp.linkedMeetingToken}</span>
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
                                className="h-8 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                title="Add Member to Group"
                              >
                                <UserPlus className="w-3.5 h-3.5" />
                                <span>Add Member</span>
                              </button>

                              {onOpenGroupChat && (
                                <button
                                  type="button"
                                  onClick={() => onOpenGroupChat(grp.id)}
                                  className="h-8 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-200 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                                  title="Open Group Chat"
                                >
                                  <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
                                  <span>Chat</span>
                                </button>
                              )}
                            </>
                          )}

                          <button
                            type="button"
                            onClick={() => setSelectedGroupId(grp.id)}
                            className="h-8 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold transition cursor-pointer"
                          >
                            View Posts
                          </button>

                          {isMember ? (
                            <span className="h-8 px-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Joined</span>
                            </span>
                          ) : isPending ? (
                            <span className="h-8 px-3 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold flex items-center gap-1">
                              <span>Requested ⏳</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onRequestJoinGroup && onRequestJoinGroup(grp.id)}
                              className="h-8 px-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-2xs cursor-pointer flex items-center gap-1.5"
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
                        className="bg-white rounded-2xl border border-neutral-200 hover:border-purple-300 overflow-hidden shadow-2xs hover:shadow-md transition flex flex-col group"
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
                                className="w-11 h-11 rounded-xl object-cover border-2 border-white shadow-md bg-white"
                              />
                            </div>
                            <h3
                              onClick={() => setSelectedGroupId(grp.id)}
                              className="font-bold text-sm text-neutral-900 line-clamp-1 hover:text-purple-600 transition cursor-pointer"
                            >
                              {grp.name}
                            </h3>
                            <p className="text-[11px] text-neutral-500 line-clamp-2 mt-1 leading-relaxed">
                              {grp.description}
                            </p>
                            <div className="flex items-center gap-2 mt-2 text-[11px] text-neutral-400 font-medium">
                              <span>{grp.members.length} members</span>
                              <span>·</span>
                              <span>{grp.category}</span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="pt-3 mt-3 border-t border-neutral-100 flex items-center justify-between gap-1.5 flex-wrap">
                            <div className="flex items-center gap-1">
                              {isMember && (
                                <button
                                  type="button"
                                  onClick={() => setGroupForAddMember(grp)}
                                  className="h-8 px-2.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-semibold border border-purple-200 transition cursor-pointer flex items-center gap-1"
                                  title="Add Member"
                                >
                                  <UserPlus className="w-3 h-3" />
                                  <span>Add</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setSelectedGroupId(grp.id)}
                                className="h-8 px-2.5 rounded-xl text-xs font-semibold text-neutral-700 hover:text-purple-600 transition"
                              >
                                View Posts →
                              </button>
                            </div>

                            {isMember ? (
                              <span className="h-8 px-2.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Joined</span>
                              </span>
                            ) : isPending ? (
                              <span className="h-8 px-2.5 rounded-xl bg-amber-50 text-amber-800 text-[11px] font-bold border border-amber-200 flex items-center">
                                Requested ⏳
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onRequestJoinGroup && onRequestJoinGroup(grp.id)}
                                className="h-8 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-2xs cursor-pointer flex items-center gap-1"
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
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. TAB B: ALL POSTS FEED */}
      {/* ========================================================= */}
      {activeTab === 'feed' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search bar */}
          <div className="px-4 py-2 border-b border-neutral-200 bg-white flex items-center gap-2 shrink-0">
            <div className="flex-1 flex items-center gap-2 bg-neutral-100 px-3 py-1.5 rounded-xl border border-neutral-200 text-xs">
              <Search className="w-3.5 h-3.5 text-purple-500 shrink-0" />
              <input
                type="text"
                placeholder="Search posts, topics, or #MEET tokens..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-neutral-900 placeholder:text-neutral-400 outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-neutral-400 hover:text-neutral-700">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Posts list */}
          <div className="flex-1 overflow-y-auto divide-y divide-neutral-200 bg-white pb-24">
            {filteredPosts.length === 0 ? (
              <div className="p-12 text-center text-neutral-500">
                <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center mx-auto mb-3 text-purple-600 border border-purple-100">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-neutral-700">No posts found</p>
                <p className="text-xs text-neutral-500 mt-1">Tap the edit button to publish a public or private post!</p>
              </div>
            ) : (
              filteredPosts.map((post) => {
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
                    className="p-4 hover:bg-neutral-50/80 transition duration-150 flex flex-col"
                  >
                    {/* Repost Header if applicable */}
                    {post.repostedByUser && (
                      <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-semibold mb-2 pl-9">
                        <Repeat className="w-3.5 h-3.5 text-emerald-600" />
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
                            <span className="font-bold text-sm text-neutral-900 truncate">{post.author}</span>
                            <span className="text-[11px] text-neutral-500">· {post.timestamp}</span>
                            {/* Visibility Badge */}
                            {post.visibility === 'private' ? (
                              <span className="flex items-center gap-0.5 text-[10px] font-semibold text-neutral-600 bg-neutral-100 px-1.5 py-0.2 rounded-md border border-neutral-200">
                                <Lock className="w-2.5 h-2.5 text-neutral-500" />
                                Private
                              </span>
                            ) : (
                              <span className="flex items-center gap-0.5 text-[10px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded-md border border-purple-200">
                                <Globe className="w-2.5 h-2.5 text-purple-600" />
                                Public
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-neutral-500">
                            @{post.author.replace(/\s+/g, '').toLowerCase()}
                          </span>
                        </div>
                      </div>

                      {/* Token Pill */}
                      {post.meetingToken && (
                        <button
                          onClick={() => onSelectMeetingToken?.(post.meetingToken)}
                          className="px-2.5 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 font-mono text-xs font-semibold hover:bg-purple-100 hover:border-purple-300 transition shrink-0"
                        >
                          {post.meetingToken}
                        </button>
                      )}
                    </div>

                    {/* Group Badge if posted inside Facebook Group */}
                    {post.groupName && (
                      <div className="pl-11 mt-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('groups');
                            if (post.groupId) setSelectedGroupId(post.groupId);
                          }}
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-bold hover:bg-blue-100 transition cursor-pointer"
                        >
                          <Users className="w-3 h-3 text-blue-600" />
                          <span>Group: {post.groupName}</span>
                        </button>
                      </div>
                    )}

                    {/* Content */}
                    <div className="mt-2.5 text-sm text-neutral-800 leading-relaxed pl-11 whitespace-pre-line">
                      {formatContentWithHashtags(post.content)}
                    </div>

                    {/* Post Action Buttons */}
                    <div className="mt-3 flex items-center justify-between text-neutral-500 text-xs pl-11 pr-6 max-w-sm">
                      <button
                        id={`btn-comments-toggle-${post.id}`}
                        type="button"
                        onClick={() =>
                          setExpandedCommentsPostId((prev) => (prev === post.id ? null : post.id))
                        }
                        className={`flex items-center gap-1.5 transition cursor-pointer ${
                          isCommentsOpen ? 'text-purple-600 font-bold' : 'hover:text-purple-600'
                        }`}
                        title="Comments"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>{commentsCount}</span>
                      </button>

                      <button
                        id={`btn-repost-${post.id}`}
                        type="button"
                        onClick={() => onToggleRepost?.(post.id)}
                        className={`flex items-center gap-1.5 transition cursor-pointer ${
                          isReposted ? 'text-emerald-600 font-bold' : 'hover:text-emerald-600'
                        }`}
                        title="Repost"
                      >
                        <Repeat className="w-4 h-4" />
                        <span>{repostsCount}</span>
                      </button>

                      <button
                        id={`btn-like-${post.id}`}
                        type="button"
                        onClick={() => onToggleLike(post.id)}
                        className={`flex items-center gap-1.5 transition cursor-pointer ${
                          isLiked ? 'text-rose-500 font-bold' : 'hover:text-rose-500'
                        }`}
                        title="Like"
                      >
                        <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                        <span>{likesCount}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSharePost(post.id)}
                        className="flex items-center gap-1.5 hover:text-purple-600 transition cursor-pointer"
                        title="Share Post"
                      >
                        {copiedPostId === post.id ? (
                          <span className="text-purple-600 font-bold flex items-center gap-1 text-[11px]">
                            <Check className="w-3.5 h-3.5" /> Copied!
                          </span>
                        ) : (
                          <Share2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* Comments Drawer */}
                    {isCommentsOpen && (
                      <div className="mt-3 pl-11 pr-4 pt-3 border-t border-neutral-100">
                        <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
                          {post.comments && post.comments.length > 0 ? (
                            post.comments.map((comment) => (
                              <div
                                key={comment.id}
                                className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200/60 text-xs"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-bold text-neutral-900">{comment.author}</span>
                                  <span className="text-[10px] text-neutral-400">{comment.timestamp}</span>
                                </div>
                                <p className="text-neutral-700 leading-relaxed">{comment.content}</p>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-neutral-400 py-1">No comments yet. Be the first to comment!</p>
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
                            className="flex-1 px-3 py-1.5 text-xs bg-neutral-50 border border-neutral-300 rounded-xl focus:border-purple-600 outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleSendComment(post.id)}
                            className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition"
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
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-neutral-900">Create New Post</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-neutral-100 text-neutral-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="p-5 space-y-4 overflow-y-auto">
              {/* Target Meeting Room Token */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Meeting Discussion Token
                </label>
                <select
                  value={selectedPostToken}
                  onChange={(e) => setSelectedPostToken(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-xs text-neutral-900 focus:border-purple-600 outline-none"
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.token}>
                      {r.token} - {r.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Optional: Post to Facebook Group */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Post Destination
                </label>
                <select
                  value={selectedPostGroupId}
                  onChange={(e) => setSelectedPostGroupId(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-xs text-neutral-900 focus:border-blue-500 outline-none font-medium"
                >
                  <option value="none">🌐 Main Public Feed (All users)</option>
                  {groups.map((grp) => (
                    <option key={grp.id} value={grp.id}>
                      👥 In Group: {grp.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Visibility Choice */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Visibility</label>
                <div className="grid grid-cols-2 gap-2">
                  <div
                    onClick={() => setPostVisibility('public')}
                    className={`p-2.5 rounded-xl border transition cursor-pointer flex flex-col gap-1 ${
                      postVisibility === 'public'
                        ? 'bg-purple-50/80 border-purple-500 ring-2 ring-purple-500/20'
                        : 'bg-neutral-50 border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Globe className={`w-3.5 h-3.5 ${postVisibility === 'public' ? 'text-purple-600' : 'text-neutral-500'}`} />
                      <span className="text-xs font-bold text-neutral-900">Public</span>
                    </div>
                    <p className="text-[10px] text-neutral-500 leading-snug">
                      Visible to everyone in feed.
                    </p>
                  </div>

                  <div
                    onClick={() => setPostVisibility('private')}
                    className={`p-2.5 rounded-xl border transition cursor-pointer flex flex-col gap-1 ${
                      postVisibility === 'private'
                        ? 'bg-purple-50/80 border-purple-500 ring-2 ring-purple-500/20'
                        : 'bg-neutral-50 border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Lock className={`w-3.5 h-3.5 ${postVisibility === 'private' ? 'text-purple-600' : 'text-neutral-500'}`} />
                      <span className="text-xs font-bold text-neutral-900">Private</span>
                    </div>
                    <p className="text-[10px] text-neutral-500 leading-snug">
                      Visible ONLY to you in your profile.
                    </p>
                  </div>
                </div>
              </div>

              {/* Content Box */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-neutral-700">Post Content</label>
                  <button
                    type="button"
                    onClick={handleQuickInsertSummary}
                    className="text-[11px] text-purple-600 hover:text-purple-700 hover:underline flex items-center gap-1 font-medium"
                  >
                    <Sparkles className="w-3 h-3" /> Insert Summary
                  </button>
                </div>
                <textarea
                  id="input-post-content"
                  rows={4}
                  required
                  placeholder="Share meeting highlights, key takeaways, and updates..."
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl p-3 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-purple-600 outline-none resize-none leading-relaxed"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-post"
                  type="submit"
                  disabled={!postContent.trim()}
                  className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-40 rounded-xl transition shadow-md shadow-purple-500/20 cursor-pointer"
                >
                  Post {postVisibility === 'private' ? '(Private)' : '(Public)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE GROUP MODAL */}
      {isCreateGroupModalOpen && (
        <CreateGroupModal
          isOpen={isCreateGroupModalOpen}
          onClose={() => setIsCreateGroupModalOpen(false)}
          currentUser={currentUser}
          rooms={rooms}
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
