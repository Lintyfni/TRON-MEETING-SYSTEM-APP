import React, { useState } from 'react';
import {
  UserProfile,
  MeetingRoom,
  MeetingNote,
  MeetingRecording,
  ScheduledMeeting,
  DateNote
} from '../types';
import {
  Video,
  UserPlus,
  CalendarDays,
  Share2,
  FileText,
  MessageSquareCode,
  Film,
  Plus,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
  Sparkles,
  ArrowRight,
  X,
  Calendar as CalendarIcon,
  Search,
  ExternalLink,
  Mic,
  Camera,
  Play
} from 'lucide-react';

interface MeetingHomeScreenProps {
  userProfile: UserProfile;
  rooms: MeetingRoom[];
  notes: MeetingNote[];
  recordings: MeetingRecording[];
  scheduledMeetings: ScheduledMeeting[];
  dateNotes: DateNote[];
  onStartNewMeeting: (title: string, token: string) => void;
  onJoinMeeting: (token: string) => void;
  onNavigateToProfileTab: (tab: 'recordings' | 'favorites' | 'notes' | 'chats') => void;
  onAddScheduledMeeting: (meeting: ScheduledMeeting) => void;
  onAddDateNote: (dateNote: DateNote) => void;
}

export const MeetingHomeScreen: React.FC<MeetingHomeScreenProps> = ({
  userProfile,
  rooms,
  notes,
  recordings,
  scheduledMeetings,
  dateNotes,
  onStartNewMeeting,
  onJoinMeeting,
  onNavigateToProfileTab,
  onAddScheduledMeeting,
  onAddDateNote,
}) => {
  // Modal states
  const [isNewMeetingModalOpen, setIsNewMeetingModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // New Meeting Form
  const [newMeetingTitle, setNewMeetingTitle] = useState(`${userProfile.name}'s Meeting`);
  const [generatedNewToken, setGeneratedNewToken] = useState(() => `#MEET-${Math.floor(1000 + Math.random() * 9000)}`);

  // Join Meeting Form
  const [joinTokenInput, setJoinTokenInput] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);

  // Share Room State (new generated room link)
  const [shareToken, setShareToken] = useState(() => `#MEET-${Math.floor(1000 + Math.random() * 9000)}`);
  const [shareTopic, setShareTopic] = useState('Team Collaboration Sync');
  const [copiedType, setCopiedType] = useState<string | null>(null);

  // Calendar & Schedule State
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState(8); // September (0-indexed: 8)
  const [currentCalendarYear, setCurrentCalendarYear] = useState(2026);
  const [selectedDateStr, setSelectedDateStr] = useState('2026-09-09');

  // Schedule New Meeting Form
  const [scheduleTitle, setScheduleTitle] = useState('');
  const [scheduleTime, setScheduleTime] = useState('10:00 AM');
  const [scheduleDuration, setScheduleDuration] = useState('45 mins');
  const [scheduleCategory, setScheduleCategory] = useState('General');

  // Add Date Note Form
  const [dateNoteTitle, setDateNoteTitle] = useState('');
  const [dateNoteContent, setDateNoteContent] = useState('');
  const [dateNoteCategory, setDateNoteCategory] = useState('Engineering');

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Helper to copy text
  const handleCopy = (text: string, type: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopiedType(type);
    showToast('📋 Copied to clipboard!');
    setTimeout(() => setCopiedType(null), 2000);
  };

  // Generate fresh token
  const regenerateToken = () => {
    const newToken = `#MEET-${Math.floor(1000 + Math.random() * 9000)}`;
    setShareToken(newToken);
    showToast('✨ New Room Token Generated!');
  };

  // Calendar calculations
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const daysInMonth = new Date(currentCalendarYear, currentCalendarMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentCalendarYear, currentCalendarMonth, 1).getDay();

  const handlePrevMonth = () => {
    if (currentCalendarMonth === 0) {
      setCurrentCalendarMonth(11);
      setCurrentCalendarYear((prev) => prev - 1);
    } else {
      setCurrentCalendarMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentCalendarMonth === 11) {
      setCurrentCalendarMonth(0);
      setCurrentCalendarYear((prev) => prev + 1);
    } else {
      setCurrentCalendarMonth((prev) => prev + 1);
    }
  };

  // Filter scheduled meetings and date notes for selected date
  const selectedDateScheduled = scheduledMeetings.filter((m) => m.date === selectedDateStr);
  const selectedDateNotes = dateNotes.filter((n) => n.date === selectedDateStr);

  // Submit Schedule Meeting
  const handleSaveScheduledMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleTitle.trim()) return;

    const newSched: ScheduledMeeting = {
      id: `sched_${Date.now()}`,
      token: `#MEET-${Math.floor(1000 + Math.random() * 9000)}`,
      title: scheduleTitle.trim(),
      date: selectedDateStr,
      time: scheduleTime,
      duration: scheduleDuration,
      host: userProfile.name,
      category: scheduleCategory,
      participants: [userProfile.name],
    };

    onAddScheduledMeeting(newSched);
    setScheduleTitle('');
    showToast(`📅 Meeting scheduled for ${selectedDateStr}!`);
  };

  // Submit Date Note
  const handleSaveDateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateNoteTitle.trim()) return;

    const newNote: DateNote = {
      id: `dnote_${Date.now()}`,
      date: selectedDateStr,
      title: dateNoteTitle.trim(),
      content: dateNoteContent.trim() || 'No additional details provided.',
      category: dateNoteCategory,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    onAddDateNote(newNote);
    setDateNoteTitle('');
    setDateNoteContent('');
    showToast(`📝 Date Note saved for ${selectedDateStr}!`);
  };

  // Submit Start New Meeting
  const handleConfirmStartNew = (e: React.FormEvent) => {
    e.preventDefault();
    const finalToken = generatedNewToken.startsWith('#') ? generatedNewToken : `#${generatedNewToken}`;
    onStartNewMeeting(newMeetingTitle.trim() || `${userProfile.name}'s Meeting`, finalToken);
    setIsNewMeetingModalOpen(false);
  };

  // Submit Join Meeting
  const handleConfirmJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const tokenToJoin = joinTokenInput.trim().toUpperCase();
    if (!tokenToJoin) {
      setJoinError('Please enter a meeting token or code');
      return;
    }
    const formattedToken = tokenToJoin.startsWith('#') ? tokenToJoin : `#${tokenToJoin}`;
    onJoinMeeting(formattedToken);
    setIsJoinModalOpen(false);
  };

  return (
    <div
      id="meeting-home-screen"
      className="relative w-full h-full bg-neutral-950 text-white flex flex-col overflow-y-auto pb-20 select-none"
    >
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-neutral-900/95 border border-red-500/80 text-white text-xs font-semibold shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-2">
          {toastMessage}
        </div>
      )}

      {/* TOP BRANDING & PROFILE BAR */}
      <div className="p-4 bg-gradient-to-b from-neutral-900 via-neutral-950 to-neutral-950 border-b border-neutral-800/80 sticky top-0 z-20 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          {/* User profile preview chip */}
          <div
            onClick={() => onNavigateToProfileTab('recordings')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="relative w-10 h-10 rounded-full p-0.5 bg-gradient-to-tr from-red-600 via-amber-500 to-cyan-400 group-hover:scale-105 transition shadow-lg">
              <img
                src={userProfile.avatar}
                alt={userProfile.name}
                className="w-full h-full rounded-full object-cover bg-neutral-900"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-neutral-950" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1">
                <span className="font-bold text-sm text-white group-hover:text-red-400 transition truncate max-w-[150px]">
                  {userProfile.name}
                </span>
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <p className="text-[11px] text-neutral-400 font-mono">{userProfile.handle}</p>
            </div>
          </div>

          {/* Current Date Badge */}
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
              Wednesday
            </span>
            <span className="text-xs font-bold text-neutral-200 bg-neutral-900 border border-neutral-800 px-2.5 py-0.5 rounded-full">
              Sep 9, 2026
            </span>
          </div>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div className="p-4 space-y-6 flex-1">
        {/* SECTION 1: PRIMARY ACTION BUTTONS (New, Join, Schedule, Share Room) */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3 flex items-center gap-1.5">
            <Video className="w-3.5 h-3.5 text-red-500" />
            <span>Instant Meeting Actions</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* 1. NEW MEETING BUTTON */}
            <button
              id="btn-home-new-meeting"
              type="button"
              onClick={() => {
                setGeneratedNewToken(`#MEET-${Math.floor(1000 + Math.random() * 9000)}`);
                setNewMeetingTitle(`${userProfile.name}'s Meeting`);
                setIsNewMeetingModalOpen(true);
              }}
              className="relative p-3.5 rounded-2xl bg-gradient-to-br from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white flex flex-col items-start justify-between shadow-lg shadow-red-950/40 border border-red-500/40 transition-all duration-200 hover:scale-[1.02] active:scale-95 cursor-pointer h-28 group"
            >
              <div className="w-9 h-9 rounded-xl bg-black/30 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:scale-110 transition">
                <Video className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="block font-bold text-sm leading-tight">New</span>
                <span className="text-[11px] text-red-100/90 leading-tight">Start Meeting</span>
              </div>
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-white animate-ping" />
            </button>

            {/* 2. JOIN MEETING BUTTON */}
            <button
              id="btn-home-join-meeting"
              type="button"
              onClick={() => {
                setJoinTokenInput('');
                setJoinError(null);
                setIsJoinModalOpen(true);
              }}
              className="relative p-3.5 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white flex flex-col items-start justify-between shadow-lg shadow-blue-950/40 border border-blue-500/40 transition-all duration-200 hover:scale-[1.02] active:scale-95 cursor-pointer h-28 group"
            >
              <div className="w-9 h-9 rounded-xl bg-black/30 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:scale-110 transition">
                <UserPlus className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="block font-bold text-sm leading-tight">Join</span>
                <span className="text-[11px] text-blue-100/90 leading-tight">Enter Token</span>
              </div>
            </button>

            {/* 3. SCHEDULE BUTTON */}
            <button
              id="btn-home-schedule-meeting"
              type="button"
              onClick={() => setIsScheduleModalOpen(true)}
              className="relative p-3.5 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white flex flex-col items-start justify-between shadow-lg shadow-indigo-950/40 border border-indigo-500/40 transition-all duration-200 hover:scale-[1.02] active:scale-95 cursor-pointer h-28 group"
            >
              <div className="w-9 h-9 rounded-xl bg-black/30 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:scale-110 transition">
                <CalendarDays className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="block font-bold text-sm leading-tight">Schedule</span>
                <span className="text-[11px] text-indigo-100/90 leading-tight">Calendar &amp; Notes</span>
              </div>
              <span className="absolute top-2.5 right-2.5 px-1.5 py-0.2 rounded-full bg-purple-900/80 border border-purple-400 text-[9px] font-bold">
                {scheduledMeetings.length}
              </span>
            </button>

            {/* 4. SHARE ROOM BUTTON */}
            <button
              id="btn-home-share-room"
              type="button"
              onClick={() => {
                regenerateToken();
                setIsShareModalOpen(true);
              }}
              className="relative p-3.5 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white flex flex-col items-start justify-between shadow-lg shadow-emerald-950/40 border border-emerald-500/40 transition-all duration-200 hover:scale-[1.02] active:scale-95 cursor-pointer h-28 group"
            >
              <div className="w-9 h-9 rounded-xl bg-black/30 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:scale-110 transition">
                <Share2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="block font-bold text-sm leading-tight">Share Room</span>
                <span className="text-[11px] text-emerald-100/90 leading-tight">Generate Link</span>
              </div>
            </button>
          </div>
        </div>

        {/* SECTION 2: HISTORY & ARCHIVE BUTTONS (Note History, Chat History, Record History) */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>History &amp; Saved Records</span>
          </h3>

          <div className="grid grid-cols-3 gap-2.5">
            {/* 5. NOTE HISTORY */}
            <button
              id="btn-home-note-history"
              type="button"
              onClick={() => onNavigateToProfileTab('notes')}
              className="p-3 rounded-xl bg-neutral-900/90 hover:bg-neutral-850 border border-neutral-800 hover:border-amber-500/60 text-left transition duration-200 group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-2 group-hover:scale-110 transition text-amber-400">
                <FileText className="w-4 h-4" />
              </div>
              <span className="block font-bold text-xs text-white group-hover:text-amber-400 transition">
                Note History
              </span>
              <span className="text-[10px] text-neutral-400">{notes.length} notes</span>
            </button>

            {/* 6. CHAT HISTORY */}
            <button
              id="btn-home-chat-history"
              type="button"
              onClick={() => onNavigateToProfileTab('chats')}
              className="p-3 rounded-xl bg-neutral-900/90 hover:bg-neutral-850 border border-neutral-800 hover:border-cyan-500/60 text-left transition duration-200 group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-2 group-hover:scale-110 transition text-cyan-400">
                <MessageSquareCode className="w-4 h-4" />
              </div>
              <span className="block font-bold text-xs text-white group-hover:text-cyan-400 transition">
                Chat History
              </span>
              <span className="text-[10px] text-neutral-400">{recordings.length} sessions</span>
            </button>

            {/* 7. RECORD HISTORY */}
            <button
              id="btn-home-record-history"
              type="button"
              onClick={() => onNavigateToProfileTab('recordings')}
              className="p-3 rounded-xl bg-neutral-900/90 hover:bg-neutral-850 border border-neutral-800 hover:border-red-500/60 text-left transition duration-200 group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-2 group-hover:scale-110 transition text-red-400">
                <Film className="w-4 h-4" />
              </div>
              <span className="block font-bold text-xs text-white group-hover:text-red-400 transition">
                Record History
              </span>
              <span className="text-[10px] text-neutral-400">
                {recordings.filter((r) => r.isUserRecorded).length} saved
              </span>
            </button>
          </div>
        </div>

        {/* SECTION 3: LIVE ACTIVE MEETINGS ("လက်ရှိ အစည်းအဝေးများ / Live Rooms") */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span>Live Meetings Now ({rooms.length})</span>
            </h3>
            <span className="text-[11px] text-neutral-500">Tap to jump in</span>
          </div>

          <div className="space-y-2.5">
            {rooms.map((room) => (
              <div
                key={room.id}
                onClick={() => onJoinMeeting(room.token)}
                className="p-3 bg-neutral-900/80 hover:bg-neutral-850 border border-neutral-800 hover:border-red-500/50 rounded-xl transition cursor-pointer flex items-center justify-between group shadow-sm"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center shrink-0 group-hover:border-red-500 transition">
                    <Video className="w-5 h-5 text-red-400" />
                  </div>
                  <div className="truncate">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold text-red-400 bg-red-950/80 border border-red-800 px-1.5 py-0.2 rounded">
                        {room.token}
                      </span>
                      <span className="text-xs font-semibold text-white truncate max-w-[170px]">
                        {room.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-1">
                      <span>Host: {room.host}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-neutral-500" />
                        {room.participants.length}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1 transition shrink-0 group-hover:scale-105 shadow-md"
                >
                  <span>Join</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 4: TODAY'S SCHEDULE & DATE NOTES SUMMARY */}
        <div className="p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-indigo-400" />
              <span>Today's Agenda &amp; Date Notes</span>
            </h4>
            <button
              type="button"
              onClick={() => setIsScheduleModalOpen(true)}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-0.5 cursor-pointer"
            >
              <span>Full Calendar</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick preview of today's items */}
          <div className="space-y-2">
            {selectedDateScheduled.slice(0, 2).map((item) => (
              <div
                key={item.id}
                className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800/80 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-semibold text-white block">{item.title}</span>
                  <span className="text-[11px] text-neutral-400 flex items-center gap-1 mt-0.5 font-mono">
                    <Clock className="w-3 h-3 text-indigo-400" />
                    {item.time} ({item.duration}) • {item.token}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onJoinMeeting(item.token)}
                  className="px-2.5 py-1 rounded bg-indigo-600/80 hover:bg-indigo-600 text-[11px] font-bold text-white transition cursor-pointer"
                >
                  Start
                </button>
              </div>
            ))}

            {selectedDateNotes.slice(0, 2).map((note) => (
              <div
                key={note.id}
                className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800/80 flex items-start gap-2 text-xs"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{note.title}</span>
                    <span className="text-[10px] text-neutral-500">{note.time}</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-0.5 line-clamp-1">
                    {note.content}
                  </p>
                </div>
              </div>
            ))}

            {selectedDateScheduled.length === 0 && selectedDateNotes.length === 0 && (
              <p className="text-xs text-neutral-500 text-center py-2">
                No meetings or date notes yet for today. Tap Schedule to add!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ================= MODALS ================= */}

      {/* 1. START NEW MEETING MODAL */}
      {isNewMeetingModalOpen && (
        <div
          id="new-meeting-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={() => setIsNewMeetingModalOpen(false)}
        >
          <div
            id="new-meeting-modal-container"
            className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl p-5 text-white shadow-2xl animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-red-500/20 text-red-500 flex items-center justify-center">
                  <Video className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm">Start Instant Meeting</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewMeetingModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmStartNew} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Meeting Topic</label>
                <input
                  type="text"
                  required
                  value={newMeetingTitle}
                  onChange={(e) => setNewMeetingTitle(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:border-red-500 outline-none"
                  placeholder="Enter meeting title..."
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1">Generated Meeting Token</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={generatedNewToken}
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-red-400 font-mono font-bold outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setGeneratedNewToken(`#MEET-${Math.floor(1000 + Math.random() * 9000)}`)}
                    className="px-2.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-300 transition"
                    title="Generate new code"
                  >
                    🎲 New
                  </button>
                </div>
              </div>

              {/* Ready check info */}
              <div className="p-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800 text-[11px] text-neutral-400 space-y-1">
                <div className="flex items-center justify-between text-neutral-300">
                  <span className="flex items-center gap-1.5">
                    <Camera className="w-3 h-3 text-emerald-400" />
                    Video Camera
                  </span>
                  <span className="text-emerald-400 font-semibold">Enabled</span>
                </div>
                <div className="flex items-center justify-between text-neutral-300">
                  <span className="flex items-center gap-1.5">
                    <Mic className="w-3 h-3 text-emerald-400" />
                    Microphone
                  </span>
                  <span className="text-emerald-400 font-semibold">Ready</span>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewMeetingModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl text-neutral-400 hover:text-white bg-neutral-800 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  id="btn-confirm-start-meeting"
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition shadow-lg shadow-red-950/50 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Video className="w-4 h-4" />
                  <span>Start Now</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. JOIN MEETING MODAL */}
      {isJoinModalOpen && (
        <div
          id="join-meeting-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={() => setIsJoinModalOpen(false)}
        >
          <div
            id="join-meeting-modal-container"
            className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl p-5 text-white shadow-2xl animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-500 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm">Join a Meeting</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsJoinModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmJoin} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Meeting Token or Code</label>
                <input
                  type="text"
                  required
                  value={joinTokenInput}
                  onChange={(e) => {
                    setJoinTokenInput(e.target.value);
                    setJoinError(null);
                  }}
                  placeholder="e.g. #MEET-9021"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500 outline-none font-mono"
                />
                {joinError && <p className="text-[11px] text-red-400 mt-1">{joinError}</p>}
              </div>

              {/* Quick Select from Active Rooms */}
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1.5">Or choose active room:</label>
                <div className="flex flex-wrap gap-1.5">
                  {rooms.map((r) => (
                    <button
                      key={r.token}
                      type="button"
                      onClick={() => setJoinTokenInput(r.token)}
                      className="px-2.5 py-1 rounded-lg bg-neutral-950 hover:bg-neutral-800 border border-neutral-700/80 text-[11px] font-mono text-cyan-300 transition"
                    >
                      {r.token}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsJoinModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl text-neutral-400 hover:text-white bg-neutral-800 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  id="btn-confirm-join-meeting"
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-lg shadow-blue-950/50 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Join Room</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. SHARE ROOM MODAL (Generate New Meeting Link) */}
      {isShareModalOpen && (
        <div
          id="share-room-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={() => setIsShareModalOpen(false)}
        >
          <div
            id="share-room-modal-container"
            className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl p-5 text-white shadow-2xl animate-in zoom-in-95 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Share2 className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm">Share Meeting Room</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Generated Room Token & Refresh */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-neutral-400">Generated Meeting Room Token</label>
                <button
                  type="button"
                  onClick={regenerateToken}
                  className="text-[10px] text-emerald-400 hover:underline"
                >
                  Generate New
                </button>
              </div>
              <div className="flex items-center gap-2 bg-neutral-950 border border-emerald-500/50 rounded-xl p-2.5">
                <span className="flex-1 font-mono font-bold text-sm text-emerald-400">{shareToken}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(shareToken, 'token')}
                  className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-xs text-white font-medium flex items-center gap-1 transition"
                >
                  {copiedType === 'token' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy</span>
                </button>
              </div>
            </div>

            {/* Direct Web Link */}
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Direct Web Invitation Link</label>
              <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 rounded-xl p-2.5">
                <span className="flex-1 text-[11px] text-neutral-300 font-mono truncate">
                  {`${window.location.origin}/#room=${shareToken.replace('#', '')}`}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(`${window.location.origin}/#room=${shareToken.replace('#', '')}`, 'link')
                  }
                  className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-xs text-white font-medium flex items-center gap-1 transition"
                >
                  {copiedType === 'link' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy</span>
                </button>
              </div>
            </div>

            {/* Complete Invitation Preview */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs space-y-1 text-neutral-300 leading-relaxed font-sans">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                Invitation Template Preview:
              </span>
              <p>
                🚀 <strong>{userProfile.name}</strong> is inviting you to a live meeting:
              </p>
              <p className="font-mono text-[11px] text-emerald-300">
                Topic: {shareTopic}
                <br />
                Token: {shareToken}
                <br />
                Link: {window.location.origin}/#room={shareToken.replace('#', '')}
              </p>
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  const fullText = `🚀 ${userProfile.name} is inviting you to a live meeting:\nTopic: ${shareTopic}\nToken: ${shareToken}\nLink: ${window.location.origin}/#room=${shareToken.replace('#', '')}`;
                  handleCopy(fullText, 'all');
                }}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-neutral-950 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-950/40"
              >
                {copiedType === 'all' ? <Check className="w-4 h-4 text-neutral-950" /> : <Share2 className="w-4 h-4" />}
                <span>Copy Full Invitation</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsShareModalOpen(false);
                  onStartNewMeeting(shareTopic, shareToken);
                }}
                className="w-full py-2 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Video className="w-3.5 h-3.5 text-emerald-400" />
                <span>Start This Room Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. SCHEDULE & INTERACTIVE CALENDAR MODAL */}
      {isScheduleModalOpen && (
        <div
          id="schedule-calendar-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-3 sm:p-4 animate-in fade-in"
          onClick={() => setIsScheduleModalOpen(false)}
        >
          <div
            id="schedule-calendar-modal-container"
            className="w-full max-w-md bg-neutral-950 border border-neutral-800 rounded-3xl overflow-hidden text-white shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 bg-neutral-900/90 border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Meeting Schedule &amp; Calendar</h3>
                  <p className="text-[10px] text-neutral-400">Manage dates, notes, and sync times</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-4 space-y-4 overflow-y-auto flex-1 divide-y divide-neutral-900">
              {/* INTERACTIVE CALENDAR WIDGET */}
              <div>
                {/* Month Switcher */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="font-bold text-sm text-white">
                    {monthNames[currentCalendarMonth]} {currentCalendarYear}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 transition cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextMonth}
                      className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 transition cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Days of week */}
                <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-neutral-500 mb-1">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                    <span key={d}>{d}</span>
                  ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1 text-center">
                  {/* Empty cells before month start */}
                  {Array.from({ length: firstDayIndex }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-8" />
                  ))}

                  {/* Day numbers */}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const dayNum = i + 1;
                    const dateStr = `${currentCalendarYear}-${String(currentCalendarMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                    const isSelected = selectedDateStr === dateStr;
                    const isToday = dateStr === '2026-09-09';
                    const hasScheduled = scheduledMeetings.some((m) => m.date === dateStr);
                    const hasNotes = dateNotes.some((n) => n.date === dateStr);

                    return (
                      <button
                        key={dateStr}
                        type="button"
                        onClick={() => setSelectedDateStr(dateStr)}
                        className={`h-8 rounded-lg flex flex-col items-center justify-center relative text-xs font-semibold transition cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-md'
                            : isToday
                            ? 'bg-neutral-900 text-indigo-400 border border-indigo-500/50'
                            : 'hover:bg-neutral-900 text-neutral-300'
                        }`}
                      >
                        <span>{dayNum}</span>
                        {/* Status dots */}
                        <div className="flex items-center gap-0.5 mt-0.5">
                          {hasScheduled && (
                            <span className="w-1 h-1 rounded-full bg-cyan-400" />
                          )}
                          {hasNotes && (
                            <span className="w-1 h-1 rounded-full bg-amber-400" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-center gap-4 mt-2.5 text-[10px] text-neutral-400">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> Scheduled Meeting
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Date Note
                  </span>
                </div>
              </div>

              {/* SECTION: DATE NOTES FOR SELECTED DATE */}
              <div className="pt-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Date Notes for {selectedDateStr} ({selectedDateNotes.length})</span>
                  </h4>
                </div>

                {/* Notes list */}
                {selectedDateNotes.length > 0 ? (
                  <div className="space-y-2">
                    {selectedDateNotes.map((dn) => (
                      <div
                        key={dn.id}
                        className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">{dn.title}</span>
                          <span className="text-[10px] px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {dn.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-300 leading-relaxed whitespace-pre-wrap">
                          {dn.content}
                        </p>
                        <div className="flex items-center justify-between pt-1 border-t border-neutral-800/80 text-[10px] text-neutral-500">
                          <span>{dn.time}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(`${dn.title} (${dn.date}):\n${dn.content}`, dn.id)}
                            className="text-amber-400 hover:underline flex items-center gap-1"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-neutral-500 italic">No notes for this date yet.</p>
                )}

                {/* Form to Add Date Note */}
                <form
                  onSubmit={handleSaveDateNote}
                  className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-3 space-y-2"
                >
                  <span className="text-xs font-bold text-white flex items-center gap-1">
                    <Plus className="w-3 h-3 text-amber-400" />
                    <span>Add Date Note</span>
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={dateNoteTitle}
                      onChange={(e) => setDateNoteTitle(e.target.value)}
                      placeholder="Note Title / Agenda Item..."
                      className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-amber-400"
                    />
                    <select
                      value={dateNoteCategory}
                      onChange={(e) => setDateNoteCategory(e.target.value)}
                      className="bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1.5 text-[11px] text-neutral-300 outline-none cursor-pointer"
                    >
                      <option value="Engineering">Engineering</option>
                      <option value="Product">Product</option>
                      <option value="Action Items">Action Items</option>
                      <option value="General">General</option>
                    </select>
                  </div>
                  <textarea
                    rows={2}
                    value={dateNoteContent}
                    onChange={(e) => setDateNoteContent(e.target.value)}
                    placeholder="Details, key points, or discussion topics..."
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs text-white outline-none focus:border-amber-400 resize-none"
                  />
                  <button
                    type="submit"
                    className="w-full py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Save Date Note</span>
                  </button>
                </form>
              </div>

              {/* SECTION: SCHEDULED MEETINGS FOR SELECTED DATE */}
              <div className="pt-3 space-y-2.5">
                <h4 className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>Scheduled Syncs for {selectedDateStr} ({selectedDateScheduled.length})</span>
                </h4>

                {/* Scheduled list */}
                {selectedDateScheduled.length > 0 ? (
                  <div className="space-y-2">
                    {selectedDateScheduled.map((m) => (
                      <div
                        key={m.id}
                        className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold text-indigo-400 bg-indigo-950 px-1.5 py-0.2 rounded border border-indigo-800">
                              {m.token}
                            </span>
                            <span className="font-semibold text-white truncate max-w-[150px]">{m.title}</span>
                          </div>
                          <span className="text-[11px] text-neutral-400 flex items-center gap-1 mt-1 font-mono">
                            <Clock className="w-3 h-3 text-indigo-400" />
                            {m.time} ({m.duration}) • Host: {m.host}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setIsScheduleModalOpen(false);
                            onJoinMeeting(m.token);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition cursor-pointer shadow-md"
                        >
                          Start
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-neutral-500 italic">No meetings scheduled for this date.</p>
                )}

                {/* Form to Schedule Meeting */}
                <form
                  onSubmit={handleSaveScheduledMeeting}
                  className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-3 space-y-2"
                >
                  <span className="text-xs font-bold text-white flex items-center gap-1">
                    <Plus className="w-3 h-3 text-indigo-400" />
                    <span>Schedule New Meeting</span>
                  </span>
                  <input
                    type="text"
                    required
                    value={scheduleTitle}
                    onChange={(e) => setScheduleTitle(e.target.value)}
                    placeholder="Meeting Topic..."
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-indigo-400"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      placeholder="e.g. 10:00 AM"
                      className="bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-indigo-400"
                    />
                    <select
                      value={scheduleDuration}
                      onChange={(e) => setScheduleDuration(e.target.value)}
                      className="bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1.5 text-[11px] text-neutral-300 outline-none cursor-pointer"
                    >
                      <option value="15 mins">15 mins</option>
                      <option value="30 mins">30 mins</option>
                      <option value="45 mins">45 mins</option>
                      <option value="60 mins">60 mins</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer shadow-md"
                  >
                    <CalendarDays className="w-3.5 h-3.5" />
                    <span>Add to Schedule</span>
                  </button>
                </form>
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 bg-neutral-900/80 border-t border-neutral-800 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
