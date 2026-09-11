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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="zoom-ai-companion-modal"
        className="w-full max-w-lg max-h-[85vh] bg-white border border-neutral-200 rounded-2xl flex flex-col text-neutral-900 shadow-2xl animate-in zoom-in-95 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-neutral-900">Zoom AI Companion</h3>
                <span className="text-[9px] bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.2 rounded-full font-mono font-semibold">
                  LIVE ENGINE
                </span>
              </div>
              <p className="text-[10px] text-neutral-500 truncate max-w-xs">{roomTitle} ({roomToken})</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 rounded-full border-3 border-purple-600 border-t-transparent animate-spin mb-3" />
              <p className="text-sm font-semibold text-purple-700">Generating AI Meeting Summary...</p>
              <p className="text-xs text-neutral-500 mt-1">Analyzing discussion topics, chat queries & key decisions</p>
            </div>
          ) : summaryData ? (
            <>
              {/* Executive Summary */}
              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-700">
                  <FileText className="w-4 h-4 text-purple-600" />
                  <span>Executive Summary</span>
                </div>
                <p className="text-xs text-neutral-800 leading-relaxed">
                  {summaryData.summary}
                </p>
              </div>

              {/* Key Decisions */}
              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Key Decisions Made</span>
                </div>
                <ul className="space-y-1.5">
                  {summaryData.keyDecisions.map((dec, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-neutral-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                      <span>{dec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Items */}
              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-700">
                  <ListTodo className="w-4 h-4 text-purple-600" />
                  <span>Next Steps &amp; Action Items</span>
                </div>
                <div className="space-y-2">
                  {summaryData.actionItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-white border border-neutral-200 flex items-center justify-between text-xs shadow-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-semibold text-neutral-800">{item.task}</p>
                        <p className="text-[10px] text-neutral-500 mt-0.5">
                          Assigned: <span className="text-purple-700 font-semibold">{item.assignee}</span>
                        </p>
                      </div>
                      <span className="text-[10px] bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded font-mono shrink-0 font-semibold">
                        Due: {item.due}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-neutral-500">
              <p className="text-xs">No summary generated yet.</p>
              <button
                type="button"
                onClick={handleGenerateSummary}
                className="mt-2 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold rounded-lg transition shadow-xs cursor-pointer"
              >
                Generate Now
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleGenerateSummary}
            disabled={loading}
            className="px-3 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-xs font-semibold text-neutral-700 hover:text-neutral-900 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Regenerate</span>
          </button>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={handleCopySummary}
              disabled={!summaryData || loading}
              className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 hover:text-neutral-900 transition disabled:opacity-50"
              title="Copy Summary"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={handleShareToFeed}
              disabled={!summaryData || loading}
              className="px-3 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-xs font-semibold text-neutral-700 hover:text-neutral-900 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Share2 className="w-3.5 h-3.5 text-purple-600" />
              <span>Share to Feed</span>
            </button>

            <button
              type="button"
              onClick={handleSaveNote}
              disabled={!summaryData || loading}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 active:scale-95 text-xs font-bold text-white transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
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
