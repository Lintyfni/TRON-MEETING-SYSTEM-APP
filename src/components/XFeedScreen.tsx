import React, { useState } from 'react';
import { PostItem, MeetingRoom, UserProfile, PostComment } from '../types';
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
  Check
} from 'lucide-react';

interface XFeedScreenProps {
  posts: PostItem[];
  rooms: MeetingRoom[];
  initialNewPostText?: string;
  onAddPost: (token: string, content: string, visibility?: 'public' | 'private') => void;
  onToggleLike: (postId: string) => void;
  onToggleRepost?: (postId: string) => void;
  onAddComment?: (postId: string, content: string) => void;
  onToggleCommentLike?: (postId: string, commentId: string) => void;
  onSelectMeetingToken?: (token: string) => void;
  currentUser?: UserProfile;
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
  currentUser,
}) => {
  const [selectedTokenFilter, setSelectedTokenFilter] = useState<string>('All');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPostToken, setSelectedPostToken] = useState<string>(
    rooms[0]?.token || '#MEET-9021'
  );
  const [postContent, setPostContent] = useState('');
  const [postVisibility, setPostVisibility] = useState<'public' | 'private'>('public');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCommentsPostId, setExpandedCommentsPostId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState<Record<string, string>>({});
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);

  // Handle passed initial post text from Granola Notes
  React.useEffect(() => {
    if (initialNewPostText) {
      setPostContent(initialNewPostText);
      setIsCreateModalOpen(true);
    }
  }, [initialNewPostText]);

  const filteredPosts = posts
    .filter((p) => (selectedTokenFilter === 'All' ? true : p.meetingToken === selectedTokenFilter))
    .filter((p) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        p.content.toLowerCase().includes(q) ||
        p.author.toLowerCase().includes(q) ||
        p.meetingToken.toLowerCase().includes(q)
      );
    });

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) return;
    onAddPost(selectedPostToken, postContent.trim(), postVisibility);
    setPostContent('');
    setPostVisibility('public');
    setIsCreateModalOpen(false);
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
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-neutral-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
            POST
          </div>
          <div>
            <h1 className="font-bold text-base text-neutral-900 leading-none">Posts & Feed</h1>
            <p className="text-[11px] text-neutral-500 mt-0.5">X-style public feeds, reposts & discussions</p>
          </div>
        </div>

        {/* Token Filter Dropdown */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              id="select-token-filter"
              value={selectedTokenFilter}
              onChange={(e) => setSelectedTokenFilter(e.target.value)}
              className="bg-white border border-neutral-200 rounded-full px-3 py-1.5 text-xs text-purple-700 font-semibold focus:outline-none focus:border-purple-500 appearance-none pr-7 cursor-pointer shadow-xs"
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
            <Filter className="w-3 h-3 text-purple-600 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Search and Quick Filters */}
      <div className="px-4 py-2 border-b border-neutral-200 bg-white flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 bg-neutral-100/90 px-3 py-1.5 rounded-xl border border-neutral-200 text-xs">
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

      {/* 2. POSTS LIST */}
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
                  <button
                    onClick={() => onSelectMeetingToken?.(post.meetingToken)}
                    className="px-2.5 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 font-mono text-xs font-semibold hover:bg-purple-100 hover:border-purple-300 transition shrink-0"
                  >
                    {post.meetingToken}
                  </button>
                </div>

                {/* Content */}
                <div className="mt-2.5 text-sm text-neutral-800 leading-relaxed pl-11 whitespace-pre-line">
                  {formatContentWithHashtags(post.content)}
                </div>

                {/* Post Action Buttons (X style) */}
                <div className="mt-3 flex items-center justify-between text-neutral-500 text-xs pl-11 pr-6 max-w-sm">
                  {/* Comments Toggle */}
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
                    <MessageSquare className="w-4 h-4 text-purple-500" />
                    <span>{commentsCount}</span>
                  </button>

                  {/* Repost Button */}
                  <button
                    id={`btn-repost-${post.id}`}
                    type="button"
                    onClick={() => {
                      if (onToggleRepost) onToggleRepost(post.id);
                    }}
                    className={`flex items-center gap-1.5 transition cursor-pointer ${
                      isReposted ? 'text-emerald-600 font-bold' : 'hover:text-emerald-600'
                    }`}
                    title={isReposted ? 'Undo repost' : 'Repost to profile'}
                  >
                    <Repeat className={`w-4 h-4 ${isReposted ? 'text-emerald-600' : ''}`} />
                    <span>{repostsCount}</span>
                  </button>

                  {/* Like Button */}
                  <button
                    id={`btn-like-${post.id}`}
                    type="button"
                    onClick={() => onToggleLike(post.id)}
                    className={`flex items-center gap-1.5 transition cursor-pointer ${
                      isLiked ? 'text-rose-600 font-bold' : 'hover:text-rose-600'
                    }`}
                    title={isLiked ? 'Unlike' : 'Like'}
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        isLiked ? 'fill-rose-600 text-rose-600' : 'text-neutral-400'
                      }`}
                    />
                    <span>{likesCount}</span>
                  </button>

                  {/* Share Button */}
                  <button
                    type="button"
                    onClick={() => handleSharePost(post.id)}
                    className="flex items-center gap-1 hover:text-purple-600 transition cursor-pointer"
                    title="Share link"
                  >
                    {copiedPostId === post.id ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Share2 className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Interactive Comments Drawer / Section (X style) */}
                {isCommentsOpen && (
                  <div className="mt-3 ml-11 p-3 bg-neutral-100/70 rounded-2xl border border-neutral-200 flex flex-col gap-3 animate-in fade-in-50 duration-150">
                    <span className="text-xs font-bold text-neutral-700">Discussion & Replies</span>

                    {/* Existing Comments */}
                    {post.comments && post.comments.length > 0 ? (
                      <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
                        {post.comments.map((cmt: PostComment) => (
                          <div
                            key={cmt.id}
                            className="bg-white rounded-xl p-2.5 border border-neutral-200 text-xs shadow-2xs flex flex-col gap-1"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-[10px]">
                                  {cmt.author[0]}
                                </div>
                                <span className="font-bold text-neutral-800">{cmt.author}</span>
                                <span className="text-[10px] text-neutral-400">· {cmt.timestamp}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => onToggleCommentLike?.(post.id, cmt.id)}
                                className={`flex items-center gap-1 text-[11px] ${
                                  cmt.isLiked ? 'text-rose-600 font-bold' : 'text-neutral-400 hover:text-rose-600'
                                }`}
                              >
                                <Heart className={`w-3 h-3 ${cmt.isLiked ? 'fill-rose-600 text-rose-600' : ''}`} />
                                <span>{cmt.likes || 0}</span>
                              </button>
                            </div>
                            <p className="text-neutral-700 leading-relaxed pl-6">{cmt.content}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-neutral-400 italic">No replies yet. Be the first to comment!</p>
                    )}

                    {/* Reply Input Box */}
                    <div className="flex items-center gap-2 pt-1">
                      <div className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {currentUser ? currentUser.name[0] : 'U'}
                      </div>
                      <input
                        type="text"
                        placeholder="Post your reply..."
                        value={commentInput[post.id] || ''}
                        onChange={(e) =>
                          setCommentInput((prev) => ({ ...prev, [post.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSendComment(post.id);
                          }
                        }}
                        className="flex-1 bg-white border border-neutral-300 rounded-xl px-3 py-1.5 text-xs text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-purple-600"
                      />
                      <button
                        type="button"
                        onClick={() => handleSendComment(post.id)}
                        disabled={!commentInput[post.id]?.trim()}
                        className="p-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white transition cursor-pointer"
                        title="Send reply"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>

      {/* 3. FLOATING ACTION BUTTON (FAB) */}
      <button
        id="btn-fab-create-post"
        type="button"
        onClick={() => setIsCreateModalOpen(true)}
        className="absolute right-5 bottom-20 z-30 w-13 h-13 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white flex items-center justify-center shadow-lg shadow-purple-500/25 transition-transform active:scale-95 cursor-pointer border border-purple-300/30"
        title="Create Post"
      >
        <Edit3 className="w-6 h-6" />
      </button>

      {/* 4. CREATE POST MODAL WITH PUBLIC/PRIVATE SELECTOR */}
      {isCreateModalOpen && (
        <div
          id="create-post-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={() => setIsCreateModalOpen(false)}
        >
          <div
            id="create-post-modal-container"
            className="w-full max-w-md bg-white border border-neutral-200 rounded-3xl p-5 text-neutral-900 shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-neutral-900">Create Post</h3>
                  <p className="text-[11px] text-neutral-500">Share meeting notes & highlights</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 p-1 rounded-full hover:bg-neutral-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-3">
              {/* Meeting Token Selection */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Select Meeting Token
                </label>
                <select
                  id="select-post-token"
                  value={selectedPostToken}
                  onChange={(e) => setSelectedPostToken(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-xs font-semibold text-neutral-900 focus:border-purple-600 outline-none"
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.token}>
                      {r.token} - {r.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Public vs Private Selector Box (Required by user!) */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Audience & Visibility (မြင်နိုင်မှု ရွေးချယ်ပါ)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {/* Public Option */}
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
                      <span className="text-xs font-bold text-neutral-900">Public (အများမြင်)</span>
                    </div>
                    <p className="text-[10px] text-neutral-500 leading-snug">
                      Visible to everyone on the feed and when others view your profile.
                    </p>
                  </div>

                  {/* Private Option */}
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
                      <span className="text-xs font-bold text-neutral-900">Private (မိမိတစ်ဦးတည်း)</span>
                    </div>
                    <p className="text-[10px] text-neutral-500 leading-snug">
                      Visible ONLY to you in your profile. Hidden from visitor view.
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
                  placeholder="Share meeting highlights, key takeaways, and action items..."
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
