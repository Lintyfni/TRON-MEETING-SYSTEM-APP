import React, { useState, useMemo } from 'react';
import {
  X,
  NotebookTabs,
  Sparkles,
  CheckCircle2,
  Share2,
  Radio,
  ChevronDown,
  Search,
  Plus,
  Copy,
  Check,
  Tag,
  Mic,
  Calendar,
  Layers,
  FileText,
  Clock,
  CheckSquare,
  Square,
  Volume2,
  Zap,
  Bot
} from 'lucide-react';
import { MeetingNote, MeetingRoom } from '../types';

interface GranolaNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRoomToken: string;
  rooms: MeetingRoom[];
  notes: MeetingNote[];
  onExportToFeed: (text: string) => void;
  onAddNote?: (newNote: MeetingNote) => void;
  onSelectMeetingRoom?: (token: string) => void;
}

export const GranolaNotesModal: React.FC<GranolaNotesModalProps> = ({
  isOpen,
  onClose,
  currentRoomToken,
  rooms,
  notes,
  onExportToFeed,
  onAddNote,
  onSelectMeetingRoom,
}) => {
  const [selectedMeetingFilter, setSelectedMeetingFilter] = useState<string>(currentRoomToken || rooms[0]?.token || 'ALL');
  const [activeSectionTab, setActiveSectionTab] = useState<'notes' | 'transcript' | 'key-points' | 'actions'>('notes');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);

  // Manual note creation state
  const [isAddingManualNote, setIsAddingManualNote] = useState<boolean>(false);
  const [manualTitle, setManualTitle] = useState<string>('');
  const [manualCategory, setManualCategory] = useState<'Decisions' | 'Action Items' | 'Tech Insights' | 'Summary'>('Decisions');
  const [manualSpeaker, setManualSpeaker] = useState<string>('Me');
  const [manualKeyPointsText, setManualKeyPointsText] = useState<string>('');

  // Keep selected meeting in sync when opened
  React.useEffect(() => {
    if (isOpen && currentRoomToken) {
      setSelectedMeetingFilter(currentRoomToken);
    }
  }, [isOpen, currentRoomToken]);

  // Categories list
  const categories = ['All', 'Decisions', 'Action Items', 'Tech Insights', 'Summary'];

  // Current active room object
  const currentRoom = rooms.find((r) => r.token === selectedMeetingFilter) || rooms[0];

  // Filter notes by meeting token, category, and search query
  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      const matchesMeeting =
        selectedMeetingFilter === 'ALL' || note.meetingToken === selectedMeetingFilter;
      if (!matchesMeeting) return false;

      const matchesCategory =
        selectedCategory === 'All' || note.category === selectedCategory;
      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const inTitle = note.title.toLowerCase().includes(q);
      const inMeeting = note.meetingToken.toLowerCase().includes(q) || note.meetingTitle.toLowerCase().includes(q);
      const inPoints = note.keyPoints.some((p) => p.toLowerCase().includes(q));
      const inSpeaker = note.speaker ? note.speaker.toLowerCase().includes(q) : false;
      const inSummary = note.granolaSummary ? note.granolaSummary.toLowerCase().includes(q) : false;
      return inTitle || inMeeting || inPoints || inSpeaker || inSummary;
    });
  }, [notes, selectedMeetingFilter, selectedCategory, searchQuery]);

  // Extract all transcripts for current meeting filter
  const allTranscripts = useMemo(() => {
    const list = filteredNotes.flatMap((n) => n.transcriptHistory || []);
    const uniqueMap = new Map();
    list.forEach((item) => {
      if (!uniqueMap.has(item.id)) {
        uniqueMap.set(item.id, item);
      }
    });
    return Array.from(uniqueMap.values());
  }, [filteredNotes]);

  // Extract all action items for current meeting filter
  const allActionItems = useMemo(() => {
    const items = filteredNotes.flatMap((n) => n.actionItems || []);
    const uniqueMap = new Map();
    items.forEach((item) => {
      if (!uniqueMap.has(item.id)) {
        uniqueMap.set(item.id, item);
      }
    });
    return Array.from(uniqueMap.values());
  }, [filteredNotes]);

  if (!isOpen) return null;

  // Handle Granola AI Auto-Synthesis simulation
  const handleTriggerGranolaSynthesis = () => {
    setIsSynthesizing(true);
    setTimeout(() => {
      const tokenToUse = selectedMeetingFilter === 'ALL' ? (currentRoomToken || rooms[0]?.token || '#MEET-9021') : selectedMeetingFilter;
      const targetRoom = rooms.find((r) => r.token === tokenToUse);
      const newGeneratedNote: MeetingNote = {
        id: 'granola_' + Date.now(),
        meetingToken: tokenToUse,
        meetingTitle: targetRoom ? targetRoom.title : 'Live Session',
        title: `Granola AI Auto-Synthesis: ${targetRoom?.title || 'Session Highlights'}`,
        category: 'Summary',
        speaker: 'Granola Engine',
        timestamp: 'Just now',
        keyPoints: [
          'Granola speech listener detected full alignment on sprint deliverables and deadlines',
          'Automated audio envelope analysis verified 99.6% speech transcription accuracy',
          'Action items assigned directly to respective team members with asynchronous notification',
        ],
        tags: ['Granola-AI', 'Auto-Note', 'Zero-Typing'],
        granolaSummary: 'Granola AI captured this meeting in real-time. Manual note taking was completely bypassed while key commitments and architectural insights were structured into this digest.',
        granolaEngineStatus: 'Synthesized',
        keyDecisions: [
          'Affirmed zero-typing policy with Granola AI actively managing meeting documentation.',
        ],
        actionItems: [
          { id: 'act_gen_' + Date.now(), task: 'Sync Granola action items with project issue tracker', assignee: targetRoom?.host || 'Me', status: 'todo' },
        ],
        transcriptHistory: [
          { id: 'tr_gen_1', speaker: targetRoom?.host || 'Host', timestamp: 'Just now', text: 'Granola Engine automatically synthesized our discussion points into structured notes.', sentiment: 'key-insight' },
          { id: 'tr_gen_2', speaker: 'Team', timestamp: 'Just now', text: 'All action items and decisions are saved and ready to export to Post.', sentiment: 'decision' },
        ],
      };

      if (onAddNote) {
        onAddNote(newGeneratedNote);
      }
      setIsSynthesizing(false);
    }, 1200);
  };

  // Handle manual note submit
  const handleCreateManualNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim()) return;

    const points = manualKeyPointsText
      .split('\n')
      .map((p) => p.trim())
      .filter(Boolean);

    const tokenToUse = selectedMeetingFilter === 'ALL' ? (currentRoomToken || rooms[0]?.token) : selectedMeetingFilter;
    const targetRoom = rooms.find((r) => r.token === tokenToUse);

    const newNote: MeetingNote = {
      id: 'manual_note_' + Date.now(),
      meetingToken: tokenToUse,
      meetingTitle: targetRoom ? targetRoom.title : 'Live Discussion',
      title: manualTitle.trim(),
      category: manualCategory,
      speaker: manualSpeaker.trim() || 'Me',
      timestamp: 'Just now',
      keyPoints: points.length > 0 ? points : ['Note captured by participant'],
      tags: ['Manual', manualCategory],
      granolaSummary: manualTitle.trim(),
      granolaEngineStatus: 'Synthesized',
      keyDecisions: manualCategory === 'Decisions' ? [manualTitle.trim()] : [],
      actionItems: manualCategory === 'Action Items' ? [{ id: 'act_m_' + Date.now(), task: manualTitle.trim(), assignee: manualSpeaker, status: 'todo' }] : [],
    };

    if (onAddNote) {
      onAddNote(newNote);
    }

    setManualTitle('');
    setManualKeyPointsText('');
    setIsAddingManualNote(false);
  };

  const handleCopyNote = (note: MeetingNote) => {
    const text = `📝 [Granola Note · ${note.meetingToken}]\n${note.title}\nCategory: ${note.category}\n\nSummary:\n${note.granolaSummary || note.title}\n\nKey Points:\n• ` +
      note.keyPoints.join('\n• ');
    navigator.clipboard?.writeText(text);
    setCopiedId(note.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShareToFeed = (note: MeetingNote) => {
    const text = `🎙️ [Granola AI Note · ${note.meetingToken}]\n📌 ${note.title}\nCategory: ${note.category}\n\n• ` +
      note.keyPoints.join('\n• ');
    onExportToFeed(text);
    onClose();
  };

  return (
    <div
      id="granola-notes-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="granola-notes-modal-dialog"
        className="relative w-full h-full sm:h-[88vh] max-w-2xl bg-neutral-950 border border-neutral-800 sm:rounded-2xl flex flex-col overflow-hidden text-white shadow-2xl select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Header: Granola Branding & Actions */}
        <header className="px-4 py-3 bg-neutral-900/90 border-b border-neutral-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-sm">
              <NotebookTabs className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-amber-400 truncate">
                  Granola Engine
                </h2>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded font-semibold shrink-0">
                  AI Notes
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 truncate">
                Meeting တက်ရင် Note လိုက်ရေးစရာမလိုတော့ဘူး · AI စုစည်းချက်
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* AI Auto-Synthesize Button */}
            <button
              id="btn-granola-modal-synthesize"
              type="button"
              onClick={handleTriggerGranolaSynthesis}
              disabled={isSynthesizing}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-95 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-amber-950/40 transition disabled:opacity-50 cursor-pointer"
              title="Auto-Synthesize audio with Granola AI Engine"
            >
              <Zap className={`w-3.5 h-3.5 ${isSynthesizing ? 'animate-spin' : 'text-amber-200'}`} />
              <span className="hidden sm:inline">{isSynthesizing ? 'Synthesizing...' : 'Granola AI Note'}</span>
              <span className="sm:hidden">{isSynthesizing ? '...' : 'Auto-Note'}</span>
            </button>

            {/* Close Button */}
            <button
              id="btn-close-granola-modal"
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition cursor-pointer"
              title="Close Notes"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* 2. Granola AI Engine Live Status Banner */}
        <div className="px-4 py-2 bg-amber-950/30 border-b border-amber-900/30 flex items-center justify-between text-xs text-amber-200 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex items-center gap-1 text-emerald-400 shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-[11px] font-semibold">Granola Live Engine</span>
            </div>
            <span className="text-neutral-500 hidden sm:inline">|</span>
            <span className="text-[11px] text-amber-200/90 truncate">
              အသံနားထောင်ပြီး Transcript + အရေးကြီးအချက်များကို အလိုအလျောက် စုစည်းပေးနေသည်
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsAddingManualNote(!isAddingManualNote)}
            className="text-[11px] text-amber-300 hover:text-white bg-amber-900/40 hover:bg-amber-900/70 px-2 py-0.5 rounded-lg border border-amber-800/60 transition shrink-0 flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>{isAddingManualNote ? 'Cancel' : 'New Note'}</span>
          </button>
        </div>

        {/* Manual Note Creation Form (Collapsible) */}
        {isAddingManualNote && (
          <form
            onSubmit={handleCreateManualNote}
            className="p-3 bg-neutral-900 border-b border-neutral-800 space-y-2.5 animate-in slide-in-from-top duration-200 shrink-0"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                Add Custom Meeting Note
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                required
                placeholder="Note Title / Decision summary..."
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                className="bg-neutral-950 border border-neutral-750 text-white text-xs px-3 py-1.5 rounded-lg outline-none focus:border-amber-400"
              />

              <div className="flex items-center gap-2">
                <select
                  value={manualCategory}
                  onChange={(e) => setManualCategory(e.target.value as any)}
                  className="bg-neutral-950 border border-neutral-750 text-white text-xs px-2 py-1.5 rounded-lg outline-none flex-1"
                >
                  <option value="Decisions">Decisions</option>
                  <option value="Action Items">Action Items</option>
                  <option value="Tech Insights">Tech Insights</option>
                  <option value="Summary">Summary</option>
                </select>

                <input
                  type="text"
                  placeholder="Speaker Name"
                  value={manualSpeaker}
                  onChange={(e) => setManualSpeaker(e.target.value)}
                  className="bg-neutral-950 border border-neutral-750 text-white text-xs px-2 py-1.5 rounded-lg outline-none w-28"
                />
              </div>
            </div>

            <textarea
              rows={2}
              placeholder="Bullet points (one per line)..."
              value={manualKeyPointsText}
              onChange={(e) => setManualKeyPointsText(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-750 text-white text-xs p-2 rounded-lg outline-none resize-none focus:border-amber-400"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddingManualNote(false)}
                className="px-3 py-1 rounded-lg text-xs text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition"
              >
                Save Note
              </button>
            </div>
          </form>
        )}

        {/* 3. Top Meeting Selector & Search Filter Bar ("Meeting အလိုက် filter") */}
        <div className="px-4 py-2.5 bg-neutral-900/60 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
          {/* Meeting Dropdown Selector */}
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <span className="text-xs font-bold text-neutral-400 shrink-0">Meeting:</span>
            <div className="relative flex items-center flex-1 max-w-[280px]">
              <select
                id="select-granola-modal-meeting-filter"
                value={selectedMeetingFilter}
                onChange={(e) => {
                  setSelectedMeetingFilter(e.target.value);
                  if (onSelectMeetingRoom && e.target.value !== 'ALL') {
                    onSelectMeetingRoom(e.target.value);
                  }
                }}
                className="appearance-none w-full bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 text-white font-bold text-xs pl-7 pr-6 py-1.5 rounded-xl cursor-pointer outline-none transition focus:ring-1 focus:ring-amber-400 truncate"
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.token} className="bg-neutral-900 text-white">
                    {r.token} · {r.title}
                  </option>
                ))}
                <option value="ALL" className="bg-neutral-900 text-white">
                  All Meetings (#Global Notes)
                </option>
              </select>
              <Radio className="w-3.5 h-3.5 text-amber-400 absolute left-2 pointer-events-none" />
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2 pointer-events-none" />
            </div>
          </div>

          {/* Search Notes Input */}
          <div className="relative flex items-center flex-1 max-w-[220px] min-w-[150px]">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 pointer-events-none" />
            <input
              id="input-search-granola-modal-notes"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes, insights..."
              className="w-full bg-neutral-800/90 border border-neutral-750 text-white text-xs pl-7 pr-3 py-1.5 rounded-xl outline-none placeholder:text-neutral-500 focus:border-amber-400 transition"
            />
          </div>
        </div>

        {/* 4. Granola Structured View Tabs: Notes, Transcript, Key Points, Action Items */}
        <div className="px-4 py-2 bg-neutral-900/30 border-b border-neutral-800/80 flex items-center justify-between gap-1 overflow-x-auto scrollbar-none shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              id="tab-granola-modal-notes"
              type="button"
              onClick={() => setActiveSectionTab('notes')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeSectionTab === 'notes'
                  ? 'bg-amber-500 text-neutral-950 shadow-sm'
                  : 'bg-neutral-800/80 text-neutral-300 hover:text-white hover:bg-neutral-750'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Notes ({filteredNotes.length})</span>
            </button>

            <button
              id="tab-granola-modal-transcript"
              type="button"
              onClick={() => setActiveSectionTab('transcript')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeSectionTab === 'transcript'
                  ? 'bg-amber-500 text-neutral-950 shadow-sm'
                  : 'bg-neutral-800/80 text-neutral-300 hover:text-white hover:bg-neutral-750'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Transcript ({allTranscripts.length})</span>
            </button>

            <button
              id="tab-granola-modal-keypoints"
              type="button"
              onClick={() => setActiveSectionTab('key-points')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeSectionTab === 'key-points'
                  ? 'bg-amber-500 text-neutral-950 shadow-sm'
                  : 'bg-neutral-800/80 text-neutral-300 hover:text-white hover:bg-neutral-750'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>အရေးကြီးအချက်များ</span>
            </button>

            <button
              id="tab-granola-modal-actions"
              type="button"
              onClick={() => setActiveSectionTab('actions')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeSectionTab === 'actions'
                  ? 'bg-amber-500 text-neutral-950 shadow-sm'
                  : 'bg-neutral-800/80 text-neutral-300 hover:text-white hover:bg-neutral-750'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Action Items ({allActionItems.length})</span>
            </button>
          </div>

          {/* Category Filter Pills (Notes Tab) */}
          {activeSectionTab === 'notes' && (
            <div className="hidden sm:flex items-center gap-1 shrink-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 5. Main Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* TAB 1: MEETING NOTES (Granola AI Digest) */}
          {activeSectionTab === 'notes' && (
            <>
              {filteredNotes.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-neutral-500 text-xs text-center p-8">
                  <FileText className="w-10 h-10 stroke-1 text-neutral-600 mb-2" />
                  <span className="font-semibold text-neutral-300 text-sm">No notes found for this filter</span>
                  <span className="text-neutral-500 mt-1 max-w-[280px]">
                    Click "Granola AI Note" above to automatically generate notes from live meeting conversation!
                  </span>
                </div>
              ) : (
                filteredNotes.map((note) => {
                  const isCopied = copiedId === note.id;
                  return (
                    <div
                      key={note.id}
                      id={`modal-granola-note-${note.id}`}
                      className="bg-neutral-900/90 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-700/80 rounded-2xl p-4 transition shadow-sm flex flex-col gap-3"
                    >
                      {/* Category, Token, Timestamp, Status */}
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-amber-500/10 text-amber-300 border-amber-500/30">
                            {note.category}
                          </span>
                          <span className="text-[10px] font-mono bg-neutral-800 text-neutral-300 border border-neutral-700 px-2 py-0.5 rounded-full">
                            {note.meetingToken}
                          </span>
                          <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                            <Bot className="w-3 h-3 text-emerald-400" />
                            <span>Granola Engine</span>
                          </span>
                        </div>
                        <span className="text-[10px] text-neutral-500 font-mono">
                          {note.timestamp}
                        </span>
                      </div>

                      {/* Title & Meeting Name */}
                      <div>
                        <h3 className="font-bold text-base text-neutral-100 leading-snug">
                          {note.title}
                        </h3>
                        <p className="text-xs text-neutral-400 mt-0.5 font-medium">
                          {note.meetingTitle}
                        </p>
                      </div>

                      {/* Granola Executive Summary */}
                      {note.granolaSummary && (
                        <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-900/30 text-xs text-amber-100/90 leading-relaxed">
                          <span className="font-bold text-amber-300 block mb-1">
                            📋 Granola Executive Summary:
                          </span>
                          {note.granolaSummary}
                        </div>
                      )}

                      {/* Key Points (အရေးကြီးတဲ့အချက်များ) */}
                      <div className="space-y-1.5 bg-neutral-950/70 p-3 rounded-xl border border-neutral-800/80">
                        <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>အရေးကြီးတဲ့အချက်များ (Key Insights)</span>
                        </div>
                        {note.keyPoints.map((point, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs text-neutral-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                            <span className="leading-relaxed">{point}</span>
                          </div>
                        ))}
                      </div>

                      {/* Key Decisions */}
                      {note.keyDecisions && note.keyDecisions.length > 0 && (
                        <div className="space-y-1 bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-900/30 text-xs text-emerald-200">
                          <span className="font-bold text-emerald-400 block text-[11px]">
                            ⚖️ Key Decisions Finalized:
                          </span>
                          {note.keyDecisions.map((dec, i) => (
                            <p key={i} className="leading-relaxed pl-2 border-l-2 border-emerald-500/50">
                              {dec}
                            </p>
                          ))}
                        </div>
                      )}

                      {/* Footer Actions */}
                      <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                          {note.tags?.map((t) => (
                            <span key={t} className="text-[9px] text-neutral-400 bg-neutral-800/70 px-2 py-0.5 rounded-full">
                              #{t}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleCopyNote(note)}
                            className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-white text-xs font-medium flex items-center gap-1 border border-neutral-700/60 transition cursor-pointer"
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400 text-[11px]">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-neutral-400" />
                                <span className="text-[11px]">Copy</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleShareToFeed(note)}
                            className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-medium flex items-center gap-1 shadow-sm transition active:scale-95 cursor-pointer"
                            title="Share Granola Note to Post"
                          >
                            <Share2 className="w-3 h-3" />
                            <span className="text-[11px]">To Post</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}

          {/* TAB 2: LIVE TRANSCRIPT */}
          {activeSectionTab === 'transcript' && (
            <div className="space-y-3">
              <div className="p-3 bg-neutral-900/60 rounded-xl border border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
                <span className="flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" />
                  Granola Live Audio Transcript ({selectedMeetingFilter})
                </span>
                <span className="font-mono text-[10px] text-emerald-400">Real-Time STT</span>
              </div>

              {allTranscripts.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-neutral-500 text-xs text-center">
                  No transcript lines logged for this meeting yet.
                </div>
              ) : (
                allTranscripts.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 bg-neutral-900/80 hover:bg-neutral-850 rounded-xl border border-neutral-800 flex flex-col gap-1 transition"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-amber-400">{t.speaker}</span>
                        {t.sentiment === 'decision' && (
                          <span className="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.2 rounded font-semibold">
                            Decision
                          </span>
                        )}
                        {t.sentiment === 'key-insight' && (
                          <span className="text-[9px] bg-cyan-950 text-cyan-400 border border-cyan-800 px-1.5 py-0.2 rounded font-semibold">
                            Key Insight
                          </span>
                        )}
                        {t.sentiment === 'action' && (
                          <span className="text-[9px] bg-purple-950 text-purple-400 border border-purple-800 px-1.5 py-0.2 rounded font-semibold">
                            Action
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-neutral-500 font-mono">{t.timestamp}</span>
                    </div>
                    <p className="text-xs text-neutral-200 leading-relaxed font-normal">
                      "{t.text}"
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: KEY POINTS ONLY */}
          {activeSectionTab === 'key-points' && (
            <div className="space-y-3">
              <div className="p-3 bg-amber-950/20 rounded-xl border border-amber-900/40 text-xs text-amber-200">
                <span className="font-bold text-amber-300 block mb-0.5">
                  ⚡ Granola Key Insights (အရေးကြီးအချက်များ):
                </span>
                Meeting အလိုက် အသံ stream မှ တိုက်ရိုက် ခွဲထုတ်ရရှိသော အဓိက မှတ်သားဖွယ်ရာများ
              </div>

              {filteredNotes.map((note) => (
                <div
                  key={'modal_kp_' + note.id}
                  className="p-3.5 bg-neutral-900/80 rounded-xl border border-neutral-800 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-neutral-100">{note.title}</span>
                    <span className="font-mono text-[10px] text-neutral-400">{note.meetingToken}</span>
                  </div>
                  <ul className="space-y-1.5">
                    {note.keyPoints.map((pt, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-neutral-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                        <span className="leading-relaxed">{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: ACTION ITEMS & DECISIONS */}
          {activeSectionTab === 'actions' && (
            <div className="space-y-3">
              <div className="p-3 bg-neutral-900/70 rounded-xl border border-neutral-800 text-xs text-neutral-300 flex items-center justify-between">
                <span>Granola Action Items &amp; Task Deliverables</span>
                <span className="font-mono text-[10px] text-amber-400 font-bold">{allActionItems.length} Total</span>
              </div>

              {allActionItems.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-neutral-500 text-xs text-center">
                  No action items extracted for this meeting yet.
                </div>
              ) : (
                allActionItems.map((act) => (
                  <div
                    key={act.id}
                    className="p-3 bg-neutral-900/80 hover:bg-neutral-850 rounded-xl border border-neutral-800 flex items-center justify-between gap-3 transition"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      {act.status === 'completed' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <Square className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0">
                        <p className={`text-xs leading-snug ${act.status === 'completed' ? 'line-through text-neutral-500' : 'text-neutral-100 font-medium'}`}>
                          {act.task}
                        </p>
                        <span className="text-[10px] text-neutral-400 mt-0.5 block">
                          Assignee: <span className="text-amber-400 font-semibold">{act.assignee}</span>
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                        act.status === 'completed'
                          ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                          : 'bg-amber-950 text-amber-400 border-amber-800'
                      }`}
                    >
                      {act.status === 'completed' ? 'DONE' : 'TODO'}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
