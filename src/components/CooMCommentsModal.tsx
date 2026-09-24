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

interface CooMCommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetingToken: string;
  meetingTitle: string;
  hostName?: string;
  comments: MeetingComment[];
  currentUser: UserProfile;
  onAddComment: (meetingToken: string, text: string, replyToCommentId?: string, replyToUser?: string) => void;
  onToggleLikeComment: (meetingToken: string, commentId: string, replyId?: string) => void;
  themeMode?: 'dark' | 'light';
}

const QUICK_EMOJIS = ['❤️', '🔥', '👏', '😂', '💯', '🚀', '✨', '👍'];

export const CooMCommentsModal: React.FC<CooMCommentsModalProps> = ({
  isOpen,
  onClose,
  meetingToken,
  meetingTitle,
  hostName,
  comments,
  currentUser,
  onAddComment,
  onToggleLikeComment,
  themeMode = 'dark',
}) => {
  const isDark = themeMode !== 'light';
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
      id="coom-comments-backdrop"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/70 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="coom-comments-container"
        className={`w-full max-w-lg max-h-[85vh] h-[75vh] border rounded-t-3xl sm:rounded-3xl flex flex-col shadow-2xl animate-in slide-from-bottom-6 overflow-hidden ${
          isDark ? 'bg-[#131B2E] border-slate-700/80 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Drag Pill & Header */}
        <div className={`pt-2.5 pb-2 px-4 border-b shrink-0 relative ${
          isDark ? 'border-slate-800 bg-[#0B0F19]' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className={`w-10 h-1 rounded-full mx-auto mb-2 ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`} />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                {totalCommentsCount} comments
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold border ${
                isDark ? 'text-indigo-300 bg-indigo-500/15 border-indigo-500/30' : 'text-indigo-700 bg-indigo-50 border-indigo-200'
              }`}>
                {meetingToken}
              </span>
            </div>
            <button
              id="btn-close-comments-modal"
              type="button"
              onClick={onClose}
              className={`p-1.5 rounded-xl transition cursor-pointer ${
                isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className={`text-[11px] truncate mt-0.5 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {meetingTitle}
          </div>
        </div>

        {/* Comments Scrollable List */}
        <div
          ref={commentsListRef}
          className={`flex-1 overflow-y-auto px-4 py-3 space-y-4 ${isDark ? 'bg-[#131B2E]' : 'bg-white'}`}
        >
          {comments.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-2">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                isDark ? 'bg-[#1E293B] border border-slate-700 text-indigo-400' : 'bg-indigo-50 border border-indigo-100 text-indigo-600'
              }`}>
                <Sparkles className="w-6 h-6" />
              </div>
              <p className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>No comments yet</p>
              <p className={`text-xs max-w-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
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
                      className="w-9 h-9 rounded-full object-cover border border-slate-700 shrink-0 mt-0.5"
                    />

                    {/* Comment Content */}
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-xs font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                          {comment.author}
                        </span>
                        {isCommentHost && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md flex items-center gap-0.5 border ${
                            isDark ? 'text-indigo-300 bg-indigo-500/15 border-indigo-500/30' : 'text-indigo-700 bg-indigo-50 border-indigo-200'
                          }`}>
                            <ShieldCheck className="w-2.5 h-2.5" /> Host
                          </span>
                        )}
                        {comment.handle && (
                          <span className={`text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            {comment.handle}
                          </span>
                        )}
                      </div>

                      <p className={`text-xs mt-1 whitespace-pre-wrap leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        {comment.text}
                      </p>

                      <div className={`flex items-center gap-3 mt-1.5 text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
                        <span>{comment.time}</span>
                        <button
                          type="button"
                          onClick={() => handleStartReply(comment.id, comment.author)}
                          className={`font-semibold transition cursor-pointer ${
                            isDark ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'
                          }`}
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
                        className={`p-1 active:scale-125 transition cursor-pointer ${
                          comment.isLiked
                            ? 'text-rose-500'
                            : isDark ? 'text-slate-500 hover:text-rose-400' : 'text-slate-400 hover:text-rose-500'
                        }`}
                        title={comment.isLiked ? 'Unlike comment' : 'Love comment'}
                      >
                        <Heart
                          className={`w-4 h-4 transition ${
                            comment.isLiked
                              ? 'fill-rose-500 text-rose-500 scale-110'
                              : ''
                          }`}
                        />
                      </button>
                      <span className={`text-[10px] font-medium ${
                        comment.isLiked ? 'text-rose-500 font-bold' : isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        {comment.likes}
                      </span>
                    </div>
                  </div>

                  {/* Replies Section */}
                  {hasReplies && (
                    <div className={`ml-12 pl-3 border-l-2 space-y-3 pt-1 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                      {/* Toggle View Replies button */}
                      <button
                        type="button"
                        onClick={() => toggleRepliesExpand(comment.id)}
                        className={`flex items-center gap-1.5 text-[11px] font-semibold transition cursor-pointer py-0.5 ${
                          isDark ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'
                        }`}
                      >
                        <div className={`w-4 h-px ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`} />
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
                                className="w-7 h-7 rounded-full object-cover border border-slate-700 shrink-0 mt-0.5"
                              />

                              <div className="flex-1 min-w-0 pr-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={`text-[11px] font-semibold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                                    {reply.author}
                                  </span>
                                  {reply.handle && (
                                    <span className={`text-[9px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                      {reply.handle}
                                    </span>
                                  )}
                                </div>

                                <p className={`text-xs mt-0.5 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                                  {reply.replyToUser && (
                                    <span className={`font-semibold mr-1.5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                      @{reply.replyToUser}
                                    </span>
                                  )}
                                  {reply.text.replace(new RegExp(`^@${reply.replyToUser}\\s*`), '')}
                                </p>

                                <div className={`flex items-center gap-3 mt-1 text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
                                  <span>{reply.time}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleStartReply(comment.id, reply.author)}
                                    className={`font-semibold transition cursor-pointer ${
                                      isDark ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'
                                    }`}
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
                                  className={`p-1 active:scale-125 transition cursor-pointer ${
                                    reply.isLiked
                                      ? 'text-rose-500'
                                      : isDark ? 'text-slate-500 hover:text-rose-400' : 'text-slate-400 hover:text-rose-500'
                                  }`}
                                >
                                  <Heart
                                    className={`w-3.5 h-3.5 transition ${
                                      reply.isLiked
                                        ? 'fill-rose-500 text-rose-500 scale-110'
                                        : ''
                                    }`}
                                  />
                                </button>
                                <span className={`text-[9px] font-medium ${
                                  reply.isLiked ? 'text-rose-500 font-bold' : isDark ? 'text-slate-400' : 'text-slate-500'
                                }`}>
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
        <div className={`p-3 border-t shrink-0 space-y-2 ${
          isDark ? 'border-slate-800 bg-[#0B0F19]' : 'border-slate-200 bg-slate-50'
        }`}>
          {/* Replying banner if active */}
          {replyingTo && (
            <div className={`flex items-center justify-between px-3 py-1 rounded-xl text-xs border ${
              isDark ? 'bg-[#1E293B] border-slate-700 text-slate-200' : 'bg-indigo-50 border-indigo-200 text-indigo-900'
            }`}>
              <span className="flex items-center gap-1 font-medium">
                <CornerDownRight className="w-3 h-3 text-indigo-400" />
                Replying to <span className="font-bold text-indigo-400">@{replyingTo.author}</span>
              </span>
              <button
                type="button"
                onClick={handleCancelReply}
                className="text-slate-400 hover:text-white p-0.5 transition"
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
                className={`px-2.5 py-0.5 text-xs rounded-full transition active:scale-95 shrink-0 font-medium ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-200/80 hover:bg-slate-200 text-slate-700'
                }`}
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
              className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0"
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
                className={`w-full rounded-full pl-4 pr-10 py-2 text-xs outline-none transition border ${
                  isDark
                    ? 'bg-[#1E293B] border-slate-700 text-slate-100 placeholder-slate-400 focus:border-indigo-500'
                    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-600'
                }`}
              />
              <button
                type="button"
                onClick={() => handleAddEmoji('😊')}
                className={`absolute right-3 ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-700'}`}
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
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs active:scale-95'
                  : isDark ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
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
