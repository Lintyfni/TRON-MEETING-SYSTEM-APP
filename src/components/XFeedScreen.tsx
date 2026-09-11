import React, { useState } from 'react';
import { PostItem, MeetingRoom } from '../types';
import {
  Edit3,
  Filter,
  Heart,
  MessageSquare,
  Repeat,
  Share2,
  X,
  Sparkles,
  Search
} from 'lucide-react';

interface XFeedScreenProps {
  posts: PostItem[];
  rooms: MeetingRoom[];
  initialNewPostText?: string;
  onAddPost: (token: string, content: string) => void;
  onToggleLike: (postId: string) => void;
  onSelectMeetingToken?: (token: string) => void;
}

export const XFeedScreen: React.FC<XFeedScreenProps> = ({
  posts,
  rooms,
  initialNewPostText = '',
  onAddPost,
  onToggleLike,
  onSelectMeetingToken,
}) => {
  const [selectedTokenFilter, setSelectedTokenFilter] = useState<string>('All');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPostToken, setSelectedPostToken] = useState<string>(
    rooms[0]?.token || '#MEET-9021'
  );
  const [postContent, setPostContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

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
    onAddPost(selectedPostToken, postContent.trim());
    setPostContent('');
    setIsCreateModalOpen(false);
  };

  const handleQuickInsertSummary = () => {
    const matchedRoom = rooms.find((r) => r.token === selectedPostToken) || rooms[0];
    if (matchedRoom) {
      const summary = `Highlights from ${matchedRoom.token} (${matchedRoom.title}):\n• ${matchedRoom.keyPoints.join('\n• ')}`;
      setPostContent(summary);
    }
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
            <h1 className="font-bold text-base text-neutral-900 leading-none">Posts</h1>
            <p className="text-[11px] text-neutral-500 mt-0.5">Token-Linked Meeting Feed</p>
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
            <p className="text-sm font-medium text-neutral-700">No posts for {selectedTokenFilter}</p>
            <p className="text-xs text-neutral-500 mt-1">Tap the edit button to publish meeting notes!</p>
          </div>
        ) : (
          filteredPosts.map((post) => {
            const isLiked = post.isLiked || false;
            const likesCount = post.likes || 0;

            return (
              <article
                key={post.id}
                id={`post-item-${post.id}`}
                className="p-4 hover:bg-neutral-50/80 transition duration-150"
              >
                {/* Author Row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 border border-purple-200 flex items-center justify-center font-bold text-sm shrink-0">
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

                {/* Post Action Buttons */}
                <div className="mt-3 flex items-center justify-between text-neutral-500 text-xs pl-11 pr-6 max-w-sm">
                  {/* Replies */}
                  <button className="flex items-center gap-1.5 hover:text-purple-600 transition">
                    <MessageSquare className="w-4 h-4 text-purple-500" />
                    <span>{post.replies ?? 3}</span>
                  </button>

                  {/* Repost */}
                  <button className="flex items-center gap-1.5 hover:text-emerald-600 transition">
                    <Repeat className="w-4 h-4" />
                    <span>{post.reposts ?? 1}</span>
                  </button>

                  {/* Like Button */}
                  <button
                    id={`btn-like-${post.id}`}
                    onClick={() => onToggleLike(post.id)}
                    className={`flex items-center gap-1.5 transition ${
                      isLiked ? 'text-purple-600 font-bold' : 'hover:text-purple-600'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-purple-600 text-purple-600' : 'text-neutral-400'}`} />
                    <span>{likesCount}</span>
                  </button>

                  {/* Share */}
                  <button className="flex items-center gap-1.5 hover:text-purple-600 transition">
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
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
        title="Create Post for Token"
      >
        <Edit3 className="w-6 h-6" />
      </button>

      {/* 4. CREATE POST MODAL */}
      {isCreateModalOpen && (
        <div
          id="create-post-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={() => setIsCreateModalOpen(false)}
        >
          <div
            id="create-post-modal-container"
            className="w-full max-w-md bg-white border border-neutral-200 rounded-2xl p-5 text-neutral-900 shadow-2xl animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-base text-neutral-900">Create Post for Token</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 p-1 rounded-full hover:bg-neutral-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1">Select Meeting Token</label>
                <select
                  id="select-post-token"
                  value={selectedPostToken}
                  onChange={(e) => setSelectedPostToken(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-sm text-neutral-900 focus:border-purple-600 outline-none"
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.token}>
                      {r.token} - {r.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-neutral-600">Post Content</label>
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
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl p-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-purple-600 outline-none resize-none leading-relaxed"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-post"
                  type="submit"
                  disabled={!postContent.trim()}
                  className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-40 rounded-xl transition shadow-md shadow-purple-500/20"
                >
                  Post
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
