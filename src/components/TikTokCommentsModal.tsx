import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Heart,
  Send,
  CornerDownRight,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Smile,
  ShieldCheck
} from 'lucide-react';
import { MeetingComment, CommentReply, UserProfile } from '../types';

interface TikTokCommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetingToken: string;
  meetingTitle: string;
  hostName?: string;
  comments: MeetingComment[];
  currentUser: UserProfile;
  onAddComment: (meetingToken: string, text: string, replyToCommentId?: string, replyToUser?: string) => void;
  onToggleLikeComment: (meetingToken: string, commentId: string, replyId?: string) => void;
}

const QUICK_EMOJIS = ['❤️', '🔥', '👏', '😂', '💯', '🚀', '✨', '👍'];

export const TikTokCommentsModal: React.FC<TikTokCommentsModalProps> = ({
  isOpen,
  onClose,
  meetingToken,
  meetingTitle,
  hostName,
  comments,
  currentUser,
  onAddComment,
  onToggleLikeComment,
}) => {
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ commentId: string; author: string } | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const commentsListRef = useRef<HTMLDivElement>(null);

  // Focus input when replying
  useEffect(() => {
    if (replyingTo && inputRef.current) {
      inputRef.current.focus();
    }
  }, [replyingTo]);

  if (!isOpen) return null;

  // Calculate total comments count including all nested replies
  const totalCommentsCount = comments.reduce(
    (acc, c) => acc + 1 + (c.replies ? c.replies.length : 0),
    0
  );

  const toggleRepliesExpand = (commentId: string) => {
    setExpandedReplies((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  const handleStartReply = (commentId: string, author: string) => {
    setReplyingTo({ commentId, author });
    // Auto-expand replies for this comment
    setExpandedReplies((prev) => ({ ...prev, [commentId]: true }));
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    if (replyingTo) {
      onAddComment(meetingToken, inputText.trim(), replyingTo.commentId, replyingTo.author);
      // Keep replies expanded
      setExpandedReplies((prev) => ({ ...prev, [replyingTo.commentId]: true }));
      setReplyingTo(null);
    } else {
      onAddComment(meetingToken, inputText.trim());
      // Scroll to bottom after new comment
      setTimeout(() => {
        if (commentsListRef.current) {
          commentsListRef.current.scrollTop = commentsListRef.current.scrollHeight;
        }
      }, 100);
    }
    setInputText('');
  };

  const handleAddEmoji = (emoji: string) => {
    setInputText((prev) => prev + emoji);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div
      id="tiktok-comments-backdrop"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="tiktok-comments-container"
        className="w-full max-w-lg max-h-[85vh] h-[75vh] bg-white border border-neutral-200 rounded-t-3xl sm:rounded-3xl flex flex-col text-neutral-900 shadow-2xl animate-in slide-from-bottom-6 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Drag Pill & Header */}
        <div className="pt-2.5 pb-2 px-4 border-b border-neutral-200 bg-neutral-50 shrink-0 relative">
          <div className="w-10 h-1 rounded-full bg-neutral-300 mx-auto mb-2" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight text-neutral-900">
                {totalCommentsCount} comments
              </span>
              <span className="text-[10px] text-purple-700 font-mono bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full font-semibold">
                {meetingToken}
              </span>
            </div>
            <button
              id="btn-close-comments-modal"
              type="button"
              onClick={onClose}
              className="p-1 text-neutral-400 hover:text-neutral-900 rounded-full hover:bg-neutral-200 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="text-[11px] text-neutral-500 truncate mt-0.5 font-medium">
            {meetingTitle}
          </div>
        </div>

        {/* Comments Scrollable List */}
        <div
          ref={commentsListRef}
          className="flex-1 overflow-y-auto px-4 py-3 space-y-4 scrollbar-thin scrollbar-thumb-neutral-200"
        >
          {comments.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 text-neutral-400 space-y-2">
              <div className="w-14 h-14 rounded-full bg-purple-50 flex items-center justify-center text-purple-500">
                <Sparkles className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-neutral-700">No comments yet</p>
              <p className="text-xs text-neutral-500 max-w-xs">
                Be the first to comment on this meeting session!
              </p>
            </div>
          ) : (
            comments.map((comment) => {
              const isCommentHost = comment.isHost || (hostName && comment.author.toLowerCase().includes(hostName.toLowerCase()));
              const hasReplies = comment.replies && comment.replies.length > 0;
              const isRepliesExpanded = expandedReplies[comment.id] ?? false;

              return (
                <div key={comment.id} className="space-y-2">
                  {/* Top-Level Comment */}
                  <div className="flex items-start gap-3 group">
                    {/* User Avatar */}
                    <img
                      src={comment.avatar}
                      alt={comment.author}
                      className="w-9 h-9 rounded-full object-cover border border-neutral-200 shrink-0 mt-0.5"
                    />

                    {/* Comment Content */}
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-semibold text-neutral-900">
                          {comment.author}
                        </span>
                        {isCommentHost && (
                          <span className="text-[9px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                            <ShieldCheck className="w-2.5 h-2.5" /> Host
                          </span>
                        )}
                        {comment.handle && (
                          <span className="text-[10px] text-neutral-400 font-mono">
                            {comment.handle}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-neutral-800 mt-1 whitespace-pre-wrap leading-relaxed">
                        {comment.text}
                      </p>

                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-neutral-400">
                        <span>{comment.time}</span>
                        <button
                          type="button"
                          onClick={() => handleStartReply(comment.id, comment.author)}
                          className="font-semibold text-purple-600 hover:text-purple-700 transition cursor-pointer"
                        >
                          Reply
                        </button>
                      </div>
                    </div>

                    {/* Heart Like Button on Right */}
                    <div className="flex flex-col items-center shrink-0 pt-0.5 pl-1">
                      <button
                        type="button"
                        onClick={() => onToggleLikeComment(meetingToken, comment.id)}
                        className="p-1 text-neutral-400 hover:text-purple-600 active:scale-125 transition cursor-pointer"
                        title={comment.isLiked ? 'Unlike comment' : 'Love comment'}
                      >
                        <Heart
                          className={`w-4 h-4 transition ${
                            comment.isLiked
                              ? 'fill-purple-600 text-purple-600 scale-110'
                              : 'text-neutral-400 hover:text-purple-600'
                          }`}
                        />
                      </button>
                      <span className={`text-[10px] font-medium ${comment.isLiked ? 'text-purple-600 font-bold' : 'text-neutral-500'}`}>
                        {comment.likes}
                      </span>
                    </div>
                  </div>

                  {/* Replies Section */}
                  {hasReplies && (
                    <div className="ml-12 pl-3 border-l-2 border-neutral-200 space-y-3 pt-1">
                      {/* Toggle View Replies button */}
                      <button
                        type="button"
                        onClick={() => toggleRepliesExpand(comment.id)}
                        className="flex items-center gap-1.5 text-[11px] font-semibold text-purple-600 hover:text-purple-700 transition cursor-pointer py-0.5"
                      >
                        <div className="w-4 h-px bg-neutral-300" />
                        <span>
                          {isRepliesExpanded
                            ? 'Hide replies'
                            : `View ${comment.replies!.length} replies`}
                        </span>
                        {isRepliesExpanded ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </button>

                      {/* Nested Replies List */}
                      {isRepliesExpanded && (
                        <div className="space-y-3 pt-1 animate-in fade-in">
                          {comment.replies!.map((reply) => (
                            <div key={reply.id} className="flex items-start gap-2.5 group">
                              <img
                                src={reply.avatar}
                                alt={reply.author}
                                className="w-7 h-7 rounded-full object-cover border border-neutral-200 shrink-0 mt-0.5"
                              />

                              <div className="flex-1 min-w-0 pr-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[11px] font-semibold text-neutral-900">
                                    {reply.author}
                                  </span>
                                  {reply.handle && (
                                    <span className="text-[9px] text-neutral-400 font-mono">
                                      {reply.handle}
                                    </span>
                                  )}
                                </div>

                                <p className="text-xs text-neutral-800 mt-0.5 leading-relaxed">
                                  {reply.replyToUser && (
                                    <span className="text-purple-600 font-semibold mr-1.5">
                                      @{reply.replyToUser}
                                    </span>
                                  )}
                                  {reply.text.replace(new RegExp(`^@${reply.replyToUser}\\s*`), '')}
                                </p>

                                <div className="flex items-center gap-3 mt-1 text-[10px] text-neutral-400">
                                  <span>{reply.time}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleStartReply(comment.id, reply.author)}
                                    className="font-semibold text-purple-600 hover:text-purple-700 transition cursor-pointer"
                                  >
                                    Reply
                                  </button>
                                </div>
                              </div>

                              {/* Reply Heart Reaction */}
                              <div className="flex flex-col items-center shrink-0 pt-0.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    onToggleLikeComment(meetingToken, comment.id, reply.id)
                                  }
                                  className="p-1 text-neutral-400 hover:text-purple-600 active:scale-125 transition cursor-pointer"
                                >
                                  <Heart
                                    className={`w-3.5 h-3.5 transition ${
                                      reply.isLiked
                                        ? 'fill-purple-600 text-purple-600 scale-110'
                                        : 'text-neutral-400 hover:text-purple-600'
                                    }`}
                                  />
                                </button>
                                <span className={`text-[9px] font-medium ${reply.isLiked ? 'text-purple-600 font-bold' : 'text-neutral-500'}`}>
                                  {reply.likes}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Input Area */}
        <div className="p-3 border-t border-neutral-200 bg-neutral-50 shrink-0 space-y-2">
          {/* Replying banner if active */}
          {replyingTo && (
            <div className="flex items-center justify-between bg-purple-50 border border-purple-200 px-3 py-1 rounded-full text-xs text-purple-800">
              <span className="flex items-center gap-1 font-medium">
                <CornerDownRight className="w-3 h-3 text-purple-600" />
                Replying to <span className="font-bold text-purple-700">@{replyingTo.author}</span>
              </span>
              <button
                type="button"
                onClick={handleCancelReply}
                className="text-purple-600 hover:text-purple-900 p-0.5 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Quick Emoji Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleAddEmoji(emoji)}
                className="px-2 py-0.5 text-xs bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-full transition active:scale-95 shrink-0 font-medium"
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Comment Form */}
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-8 h-8 rounded-full object-cover border border-neutral-200 shrink-0"
            />
            <div className="flex-1 relative flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  replyingTo
                    ? `Reply to @${replyingTo.author}...`
                    : 'Add comment...'
                }
                className="w-full bg-white border border-neutral-200 rounded-full pl-4 pr-10 py-2 text-xs text-neutral-900 placeholder-neutral-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition"
              />
              <button
                type="button"
                onClick={() => handleAddEmoji('😊')}
                className="absolute right-3 text-neutral-400 hover:text-purple-600"
              >
                <Smile className="w-4 h-4" />
              </button>
            </div>

            <button
              id="btn-submit-comment"
              type="submit"
              disabled={!inputText.trim()}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition shrink-0 cursor-pointer ${
                inputText.trim()
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-xs active:scale-95'
                  : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
              }`}
              title="Post comment"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
