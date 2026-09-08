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
    <div id="xfeed-screen" className="relative w-full h-full bg-black text-white flex flex-col overflow-hidden">
      {/* 1. APP BAR */}
      <div className="sticky top-0 z-20 bg-black/90 backdrop-blur-md border-b border-neutral-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-red-600/20 text-red-500 flex items-center justify-center font-black text-sm">
            POST
          </div>
          <div>
            <h1 className="font-bold text-base text-white leading-none">Posts</h1>
            <p className="text-[11px] text-neutral-400 mt-0.5">Token-Linked Meeting Feed</p>
          </div>
        </div>

        {/* Token Filter Dropdown */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              id="select-token-filter"
              value={selectedTokenFilter}
              onChange={(e) => setSelectedTokenFilter(e.target.value)}
              className="bg-neutral-900 border border-neutral-700/80 rounded-full px-3 py-1.5 text-xs text-red-400 font-semibold focus:outline-none focus:border-red-500 appearance-none pr-7 cursor-pointer"
            >
              <option value="All" className="bg-neutral-900 text-white">
                All Tokens
              </option>
              {rooms.map((r) => (
                <option key={r.id} value={r.token} className="bg-neutral-900 text-red-400">
                  {r.token}
                </option>
              ))}
            </select>
            <Filter className="w-3 h-3 text-red-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Search and Quick Filters */}
      <div className="px-4 py-2 border-b border-neutral-800/80 bg-neutral-950/60 flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 bg-neutral-900 px-3 py-1.5 rounded-xl border border-neutral-800 text-xs">
          <Search className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
          <input
            type="text"
            placeholder="Search posts, topics, or #MEET tokens..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-white placeholder:text-neutral-500 outline-none"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-neutral-500 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. POSTS LIST */}
      <div className="flex-1 overflow-y-auto divide-y divide-neutral-800/80 pb-24">
        {filteredPosts.length === 0 ? (
          <div className="p-12 text-center text-neutral-500">
            <div className="w-12 h-12 rounded-full bg-neutral-900 flex items-center justify-center mx-auto mb-3 text-neutral-600">
              <MessageSquare className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-neutral-400">No posts for {selectedTokenFilter}</p>
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
                className="p-4 hover:bg-neutral-950/50 transition duration-150"
              >
                {/* Author Row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center font-bold text-sm shrink-0">
                      {post.author[0]}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-white truncate">{post.author}</span>
                        <span className="text-[11px] text-neutral-500">· {post.timestamp}</span>
                      </div>
                      <span className="text-[11px] text-neutral-400">
                        @{post.author.replace(/\s+/g, '').toLowerCase()}
                      </span>
                    </div>
                  </div>

                  {/* Token Pill */}
                  <button
                    onClick={() => onSelectMeetingToken?.(post.meetingToken)}
                    className="px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-700/80 text-red-400 font-mono text-xs font-semibold hover:border-red-500 transition shrink-0"
                  >
                    {post.meetingToken}
                  </button>
                </div>

                {/* Content */}
                <div className="mt-2.5 text-sm text-neutral-200 leading-relaxed pl-11 whitespace-pre-line">
                  {formatContentWithHashtags(post.content)}
                </div>

                {/* Post Action Buttons */}
                <div className="mt-3 flex items-center justify-between text-neutral-400 text-xs pl-11 pr-6 max-w-sm">
                  {/* Replies */}
                  <button className="flex items-center gap-1.5 hover:text-white transition">
                    <MessageSquare className="w-4 h-4" />
                    <span>{post.replies ?? 3}</span>
                  </button>

                  {/* Repost */}
                  <button className="flex items-center gap-1.5 hover:text-emerald-400 transition">
                    <Repeat className="w-4 h-4" />
                    <span>{post.reposts ?? 1}</span>
                  </button>

                  {/* Like Button */}
                  <button
                    id={`btn-like-${post.id}`}
                    onClick={() => onToggleLike(post.id)}
                    className={`flex items-center gap-1.5 transition ${
                      isLiked ? 'text-red-500 font-bold' : 'hover:text-red-400'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500' : ''}`} />
                    <span>{likesCount}</span>
                  </button>

                  {/* Share */}
                  <button className="flex items-center gap-1.5 hover:text-white transition">
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
        className="absolute right-5 bottom-20 z-30 w-13 h-13 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-xl shadow-red-950/60 transition-transform active:scale-95 cursor-pointer border border-red-400/40"
        title="Create X Post for Token"
      >
        <Edit3 className="w-6 h-6" />
      </button>

      {/* 4. CREATE POST MODAL */}
      {isCreateModalOpen && (
        <div
          id="create-post-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={() => setIsCreateModalOpen(false)}
        >
          <div
            id="create-post-modal-container"
            className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-5 text-white shadow-2xl animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-red-500" />
                <h3 className="font-bold text-base text-white">Create X Post for Token</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-full hover:bg-neutral-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Select Meeting Token</label>
                <select
                  id="select-post-token"
                  value={selectedPostToken}
                  onChange={(e) => setSelectedPostToken(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:border-red-500 outline-none"
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
                  <label className="block text-xs text-neutral-400">Post Content</label>
                  <button
                    type="button"
                    onClick={handleQuickInsertSummary}
                    className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    <Sparkles className="w-3 h-3" /> Insert Granola Summary
                  </button>
                </div>
                <textarea
                  id="input-post-content"
                  rows={4}
                  required
                  placeholder="Share meeting highlights, key takeaways, and action items..."
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-sm text-white placeholder:text-neutral-500 focus:border-red-500 outline-none resize-none leading-relaxed"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white bg-neutral-800 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-post"
                  type="submit"
                  disabled={!postContent.trim()}
                  className="px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 disabled:opacity-40 rounded-xl transition shadow-lg shadow-red-950/40"
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

// Highlight hashtags like #MEET-9021 in red accent
function formatContentWithHashtags(text: string) {
  const parts = text.split(/(#[A-Za-z0-9_-]+)/g);
  return parts.map((part, i) => {
    if (part.startsWith('#')) {
      return (
        <span key={i} className="text-red-400 font-medium">
          {part}
        </span>
      );
    }
    return part;
  });
}
