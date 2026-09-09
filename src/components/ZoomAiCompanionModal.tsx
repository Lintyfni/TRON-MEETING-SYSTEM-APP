import React, { useState } from 'react';
import {
  X,
  Sparkles,
  CheckCircle2,
  ListTodo,
  FileText,
  Share2,
  Copy,
  Check,
  RefreshCw,
  BookmarkPlus
} from 'lucide-react';
import { api, AiSummaryResponse } from '../services/api';
import { MeetingNote } from '../types';

interface ZoomAiCompanionModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomTitle: string;
  roomToken: string;
  keyPoints: string[];
  chats?: { sender: string; text: string }[];
  onSaveToNotes: (newNote: MeetingNote) => void;
  onExportToPost: (content: string) => void;
}

export const ZoomAiCompanionModal: React.FC<ZoomAiCompanionModalProps> = ({
  isOpen,
  onClose,
  roomTitle,
  roomToken,
  keyPoints,
  chats = [],
  onSaveToNotes,
  onExportToPost,
}) => {
  const [loading, setLoading] = useState(false);
  const [summaryData, setSummaryData] = useState<AiSummaryResponse | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  // Trigger AI generation
  const handleGenerateSummary = async () => {
    setLoading(true);
    setSavedSuccess(false);
    try {
      const res = await api.generateAiMeetingSummary({
        meetingTitle: roomTitle,
        meetingToken: roomToken,
        keyPoints,
        chats,
      });
      setSummaryData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  React.useEffect(() => {
    if (isOpen && !summaryData) {
      handleGenerateSummary();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveNote = () => {
    if (!summaryData) return;
    const bulletItems = [
      `Summary: ${summaryData.summary}`,
      ...summaryData.keyDecisions.map((d) => `Decision: ${d}`),
      ...summaryData.actionItems.map((a) => `Action [${a.assignee}]: ${a.task} (Due: ${a.due})`),
    ];

    const newNote: MeetingNote = {
      id: `ai_note_${Date.now()}`,
      meetingToken: roomToken,
      meetingTitle: roomTitle,
      title: `AI Companion Summary: ${roomTitle}`,
      category: 'Summary',
      keyPoints: bulletItems,
      timestamp: 'Today ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      speaker: 'Zoom AI Companion',
    };

    onSaveToNotes(newNote);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleCopySummary = () => {
    if (!summaryData) return;
    const text = `📋 ${roomTitle} (${roomToken}) - AI Summary\n\n${summaryData.summary}\n\n🎯 Key Decisions:\n${summaryData.keyDecisions.map((d) => `• ${d}`).join('\n')}\n\n✅ Action Items:\n${summaryData.actionItems.map((a) => `• [${a.assignee}] ${a.task} (Due: ${a.due})`).join('\n')}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareToFeed = () => {
    if (!summaryData) return;
    const postText = `⚡ Zoom AI Companion Meeting Takeaways for ${roomToken}:\n\n${summaryData.summary}\n\nTop Decision: ${summaryData.keyDecisions[0] || 'Aligned on sprint roadmap'}`;
    onExportToPost(postText);
    onClose();
  };

  return (
    <div
      id="zoom-ai-companion-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="zoom-ai-companion-modal"
        className="w-full max-w-lg max-h-[85vh] bg-neutral-900 border border-neutral-800 rounded-2xl flex flex-col text-white shadow-2xl animate-in zoom-in-95 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 bg-gradient-to-r from-amber-950/40 via-purple-950/40 to-neutral-900 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-purple-500 flex items-center justify-center shadow-lg shadow-amber-950/50">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">Zoom AI Companion</h3>
                <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded-full font-mono font-semibold">
                  LIVE ENGINE
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 truncate max-w-xs">{roomTitle} ({roomToken})</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 rounded-full border-3 border-amber-500 border-t-transparent animate-spin mb-3" />
              <p className="text-sm font-semibold text-amber-300">Generating AI Meeting Summary...</p>
              <p className="text-xs text-neutral-400 mt-1">Analyzing discussion topics, chat queries & key decisions</p>
            </div>
          ) : summaryData ? (
            <>
              {/* Executive Summary */}
              <div className="p-4 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                  <FileText className="w-4 h-4" />
                  <span>Executive Summary</span>
                </div>
                <p className="text-xs text-neutral-200 leading-relaxed">
                  {summaryData.summary}
                </p>
              </div>

              {/* Key Decisions */}
              <div className="p-4 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Key Decisions Made</span>
                </div>
                <ul className="space-y-1.5">
                  {summaryData.keyDecisions.map((dec, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-neutral-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                      <span>{dec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Items */}
              <div className="p-4 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-sky-400">
                  <ListTodo className="w-4 h-4" />
                  <span>Next Steps &amp; Action Items</span>
                </div>
                <div className="space-y-2">
                  {summaryData.actionItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-medium text-neutral-200">{item.task}</p>
                        <p className="text-[10px] text-neutral-400 mt-0.5">
                          Assigned: <span className="text-sky-300 font-semibold">{item.assignee}</span>
                        </p>
                      </div>
                      <span className="text-[10px] bg-sky-950 text-sky-300 border border-sky-800/80 px-2 py-0.5 rounded font-mono shrink-0">
                        Due: {item.due}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-neutral-400">
              <p className="text-xs">No summary generated yet.</p>
              <button
                type="button"
                onClick={handleGenerateSummary}
                className="mt-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold rounded-lg transition"
              >
                Generate Now
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleGenerateSummary}
            disabled={loading}
            className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-300 hover:text-white transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Regenerate</span>
          </button>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={handleCopySummary}
              disabled={!summaryData || loading}
              className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition disabled:opacity-50"
              title="Copy Summary"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={handleShareToFeed}
              disabled={!summaryData || loading}
              className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-300 hover:text-white transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Share2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Share to Feed</span>
            </button>

            <button
              type="button"
              onClick={handleSaveNote}
              disabled={!summaryData || loading}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-xs font-bold text-neutral-950 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-lg shadow-amber-950/50"
            >
              {savedSuccess ? <Check className="w-3.5 h-3.5" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
              <span>{savedSuccess ? 'Saved to Notes!' : 'Save to Notes'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
