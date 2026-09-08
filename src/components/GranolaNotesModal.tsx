import React, { useState, useMemo } from 'react';
import {
  X,
  NotebookTabs,
  Share2,
  ChevronDown,
  Search,
  Plus,
  Copy,
  Check,
  Tag,
  Clock,
  Calendar,
  Layers,
  FileText,
  ListPlus,
  ListChecks,
  Trash2,
  Edit3
} from 'lucide-react';
import { MeetingNote, MeetingRoom } from '../types';

interface MeetingNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRoomToken: string;
  rooms: MeetingRoom[];
  notes: MeetingNote[];
  onExportToFeed: (text: string) => void;
  onAddNote?: (newNote: MeetingNote) => void;
  onSelectMeetingRoom?: (token: string) => void;
}

export const GranolaNotesModal: React.FC<MeetingNotesModalProps> = ({
  isOpen,
  onClose,
  currentRoomToken,
  rooms,
  notes,
  onExportToFeed,
  onAddNote,
  onSelectMeetingRoom,
}) => {
  // Meeting filter: 'ALL' or specific token
  const [selectedMeetingFilter, setSelectedMeetingFilter] = useState<string>(
    currentRoomToken || rooms[0]?.token || 'ALL'
  );

  // Search query
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active view: 'pad' (New Note Textpad) or 'history' (Saved Notes List)
  const [activeView, setActiveView] = useState<'pad' | 'history'>('pad');

  // Text pad state
  const [targetRoomToken, setTargetRoomToken] = useState<string>(
    currentRoomToken || rooms[0]?.token || ''
  );
  const [padTitle, setPadTitle] = useState<string>('');
  const [padCategory, setPadCategory] = useState<'General' | 'Decisions' | 'Action Items' | 'Summary'>('General');
  const [padContent, setPadContent] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Keep selected meeting in sync when opened
  React.useEffect(() => {
    if (isOpen && currentRoomToken) {
      setSelectedMeetingFilter(currentRoomToken);
      setTargetRoomToken(currentRoomToken);
    }
  }, [isOpen, currentRoomToken]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Filter notes by meeting token and search query
  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      const matchesMeeting =
        selectedMeetingFilter === 'ALL' || note.meetingToken === selectedMeetingFilter;
      if (!matchesMeeting) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const inTitle = note.title.toLowerCase().includes(q);
      const inMeeting = note.meetingToken.toLowerCase().includes(q) || note.meetingTitle.toLowerCase().includes(q);
      const inPoints = note.keyPoints?.some((p) => p.toLowerCase().includes(q));
      const inContent = note.content ? note.content.toLowerCase().includes(q) : false;
      return inTitle || inMeeting || inPoints || inContent;
    });
  }, [notes, selectedMeetingFilter, searchQuery]);

  // Insert helper text into pad
  const handleInsertSnippet = (prefix: string) => {
    setPadContent((prev) => {
      if (!prev) return prefix;
      if (prev.endsWith('\n')) return prev + prefix;
      return prev + '\n' + prefix;
    });
  };

  const handleInsertTimestamp = () => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    handleInsertSnippet(`[${timeStr}] `);
  };

  // Save note to state
  const handleSaveNote = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!padContent.trim()) {
      showToast('⚠️ Note ရိုက်ထည့်ပါ');
      return;
    }

    const roomObj = rooms.find((r) => r.token === targetRoomToken) || rooms[0];
    const points = padContent
      .split('\n')
      .map((l) => l.replace(/^[•\-\*]\s*/, '').trim())
      .filter(Boolean);

    const newNote: MeetingNote = {
      id: `note_${Date.now()}`,
      meetingToken: roomObj ? roomObj.token : targetRoomToken,
      meetingTitle: roomObj ? roomObj.title : 'Live Meeting',
      title: padTitle.trim() || `Meeting Note (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
      category: padCategory,
      content: padContent,
      keyPoints: points.length > 0 ? points : [padContent],
      timestamp: 'Just now',
      speaker: 'Me',
      tags: [padCategory.toLowerCase().replace(/\s+/g, '-')],
    };

    if (onAddNote) {
      onAddNote(newNote);
    }

    showToast('✅ Note သိမ်းဆည်းပြီးပါပြီ!');
    setPadTitle('');
    setPadContent('');
    setActiveView('history');
  };

  // Load a note into pad for viewing/editing
  const handleLoadNoteToPad = (note: MeetingNote) => {
    setTargetRoomToken(note.meetingToken);
    setPadTitle(note.title);
    setPadCategory((note.category as any) || 'General');
    setPadContent(note.content || note.keyPoints.map((p) => `• ${p}`).join('\n'));
    setActiveView('pad');
    showToast(`📝 Note loaded: ${note.title}`);
  };

  const handleCopyNote = (text: string, id: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopiedId(id);
    showToast('📋 Note ကူးယူပြီးပါပြီ!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div
      id="meeting-notes-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="meeting-notes-modal-container"
        className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92dvh] text-neutral-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toast Notification */}
        {toastMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-neutral-800 text-white text-xs px-4 py-2 rounded-full border border-neutral-700 shadow-xl animate-in fade-in">
            {toastMessage}
          </div>
        )}

        {/* 1. Header Bar */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center">
              <NotebookTabs className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-1.5">
                Meeting Notes Pad
              </h2>
              <p className="text-[11px] text-neutral-400">
                ရိုးရိုးရှင်းရှင်း မှတ်စုရေးသားခြင်းနှင့် မှတ်တမ်းများ
              </p>
            </div>
          </div>

          <button
            id="btn-close-notes-modal"
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2. Top Controls: Meeting Filter & View Switcher */}
        <div className="p-3 bg-neutral-950/40 border-b border-neutral-800/80 flex flex-col gap-2.5">
          {/* Meeting Filter Row */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400 font-medium whitespace-nowrap">Meeting:</span>
            <div className="relative flex-1">
              <select
                id="select-meeting-filter"
                value={selectedMeetingFilter}
                onChange={(e) => {
                  setSelectedMeetingFilter(e.target.value);
                  if (e.target.value !== 'ALL') {
                    setTargetRoomToken(e.target.value);
                    if (onSelectMeetingRoom) onSelectMeetingRoom(e.target.value);
                  }
                }}
                className="w-full bg-neutral-800/90 border border-neutral-700 rounded-xl px-3 py-1.5 text-xs text-white appearance-none cursor-pointer focus:border-amber-500 outline-none pr-8 font-medium"
              >
                <option value="ALL">🌐 All Meetings ({notes.length} notes)</option>
                {rooms.map((r) => {
                  const count = notes.filter((n) => n.meetingToken === r.token).length;
                  return (
                    <option key={r.token} value={r.token}>
                      {r.token} · {r.title} ({count})
                    </option>
                  );
                })}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* View Tab Switcher: Text Pad vs Saved Notes List */}
          <div className="flex items-center gap-1.5 p-1 bg-neutral-950 rounded-xl border border-neutral-800/80">
            <button
              id="tab-view-pad"
              type="button"
              onClick={() => setActiveView('pad')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                activeView === 'pad'
                  ? 'bg-amber-500 text-neutral-950 shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Text Pad (ရိုက်ထည့်ရန်)</span>
            </button>
            <button
              id="tab-view-history"
              type="button"
              onClick={() => setActiveView('history')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                activeView === 'history'
                  ? 'bg-amber-500 text-neutral-950 shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Saved Notes ({filteredNotes.length})</span>
            </button>
          </div>
        </div>

        {/* 3. Main Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* VIEW A: TEXT PAD (Manual Note Pad) */}
          {activeView === 'pad' && (
            <form onSubmit={handleSaveNote} className="space-y-3.5">
              {/* Target Meeting Selector if writing a note */}
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="text-neutral-400">Save To Meeting:</span>
                <select
                  value={targetRoomToken}
                  onChange={(e) => setTargetRoomToken(e.target.value)}
                  className="bg-neutral-800 border border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-amber-300 font-mono focus:border-amber-500 outline-none"
                >
                  {rooms.map((r) => (
                    <option key={r.token} value={r.token}>
                      {r.token} ({r.title.slice(0, 24)}...)
                    </option>
                  ))}
                </select>
              </div>

              {/* Title & Category Row */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Note Title (e.g. Architecture decisions)"
                  value={padTitle}
                  onChange={(e) => setPadTitle(e.target.value)}
                  className="flex-1 bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white outline-none placeholder:text-neutral-500"
                />
                <select
                  value={padCategory}
                  onChange={(e) => setPadCategory(e.target.value as any)}
                  className="bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-2 text-xs text-neutral-300 outline-none"
                >
                  <option value="General">General</option>
                  <option value="Decisions">Decisions</option>
                  <option value="Action Items">Action Items</option>
                  <option value="Summary">Summary</option>
                </select>
              </div>

              {/* Quick Snippet Inserts */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-neutral-500 mr-1">Quick:</span>
                <button
                  type="button"
                  onClick={() => handleInsertSnippet('• ')}
                  className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-lg text-[11px] flex items-center gap-1 transition"
                >
                  <ListPlus className="w-3 h-3 text-amber-400" />
                  <span>Bullet (•)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertSnippet('[ ] ')}
                  className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-lg text-[11px] flex items-center gap-1 transition"
                >
                  <ListChecks className="w-3 h-3 text-amber-400" />
                  <span>Task ([ ])</span>
                </button>
                <button
                  type="button"
                  onClick={handleInsertTimestamp}
                  className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-lg text-[11px] flex items-center gap-1 transition"
                >
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>Timestamp</span>
                </button>
              </div>

              {/* Big Text Pad (Textarea) */}
              <div className="relative">
                <textarea
                  id="textarea-meeting-notes-pad"
                  rows={9}
                  value={padContent}
                  onChange={(e) => setPadContent(e.target.value)}
                  placeholder="ဒီ meeting အတွက် note ရေးပါ... (Type your meeting notes here)...&#10;• အဓိက ဆွေးနွေးချက်များ&#10;• လုပ်ဆောင်ရမည့် လုပ်ငန်းစဉ်များ"
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-2xl p-3.5 text-xs text-neutral-100 font-sans leading-relaxed outline-none resize-none placeholder:text-neutral-600 focus:ring-1 focus:ring-amber-500/50"
                />
                <span className="absolute right-3 bottom-3 text-[10px] text-neutral-500">
                  {padContent.length} chars
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setPadTitle('');
                    setPadContent('');
                  }}
                  className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white text-xs font-medium transition"
                  title="Clear pad"
                >
                  Clear
                </button>

                {padContent.trim() && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleCopyNote(padContent, 'current-pad')}
                      className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onExportToFeed(`📝 Meeting Note (${targetRoomToken}):\n\n${padContent}`);
                        showToast('📤 Exported to Post!');
                        onClose();
                      }}
                      className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>To Post</span>
                    </button>
                  </>
                )}

                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold transition shadow-lg shadow-amber-950/40 flex items-center justify-center gap-1.5 cursor-pointer ml-auto"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Save Note (သိမ်းဆည်းမည်)</span>
                </button>
              </div>
            </form>
          )}

          {/* VIEW B: SAVED NOTES LIST (Meeting History) */}
          {activeView === 'history' && (
            <div className="space-y-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search saved notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-neutral-500 outline-none focus:border-amber-500"
                />
              </div>

              {filteredNotes.length === 0 ? (
                <div className="py-10 text-center text-neutral-500 space-y-2">
                  <FileText className="w-8 h-8 mx-auto text-neutral-600" />
                  <p className="text-xs">မှတ်စု မရှိသေးပါ။</p>
                  <button
                    type="button"
                    onClick={() => setActiveView('pad')}
                    className="text-xs text-amber-400 hover:underline"
                  >
                    + Write first note
                  </button>
                </div>
              ) : (
                filteredNotes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3.5 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-2xl transition space-y-2 group"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            {note.meetingToken}
                          </span>
                          <span className="text-[11px] text-neutral-400 truncate max-w-[200px]">
                            {note.meetingTitle}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-white mt-1">{note.title}</h4>
                      </div>
                      <span className="text-[10px] text-neutral-500 whitespace-nowrap">
                        {note.timestamp}
                      </span>
                    </div>

                    {/* Key points / Content */}
                    <div className="space-y-1 bg-neutral-900/60 p-2.5 rounded-xl text-[11px] text-neutral-300 leading-relaxed font-sans">
                      {note.keyPoints && note.keyPoints.length > 0 ? (
                        note.keyPoints.map((pt, idx) => (
                          <div key={idx} className="flex items-start gap-1.5">
                            <span className="text-amber-500 mt-0.5">•</span>
                            <span>{pt}</span>
                          </div>
                        ))
                      ) : (
                        <p className="whitespace-pre-wrap">{note.content}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-1 text-xs">
                      <button
                        type="button"
                        onClick={() => handleLoadNoteToPad(note)}
                        className="text-amber-400 hover:text-amber-300 flex items-center gap-1 text-[11px] font-medium"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit / Open in Pad</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            handleCopyNote(
                              `${note.title}\n\n${(note.keyPoints || []).map((p) => `• ${p}`).join('\n')}`,
                              note.id
                            )
                          }
                          className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[10px] flex items-center gap-1"
                          title="Copy Note"
                        >
                          {copiedId === note.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>Copy</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const shareText = `📝 ${note.title} (${note.meetingToken}):\n\n${(note.keyPoints || []).map((p) => `• ${p}`).join('\n')}`;
                            onExportToFeed(shareText);
                            showToast('📤 Exported to Post!');
                            onClose();
                          }}
                          className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[10px] flex items-center gap-1"
                          title="Export to Post"
                        >
                          <Share2 className="w-3 h-3" />
                          <span>Post</span>
                        </button>
                      </div>
                    </div>
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
