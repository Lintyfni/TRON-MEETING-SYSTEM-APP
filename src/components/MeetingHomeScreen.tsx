import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  UserProfile,
  MeetingRoom,
  MeetingNote,
  MeetingRecording,
  ScheduledMeeting,
  DateNote,
  SocialUser
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
  Play,
  Edit3,
  AtSign,
  UserCheck,
  User
} from 'lucide-react';

interface MeetingHomeScreenProps {
  userProfile: UserProfile;
  rooms: MeetingRoom[];
  notes: MeetingNote[];
  recordings: MeetingRecording[];
  scheduledMeetings: ScheduledMeeting[];
  dateNotes: DateNote[];
  socialUsers?: SocialUser[];
  onStartNewMeeting: (title: string, token: string) => void;
  onJoinMeeting: (token: string) => void;
  onNavigateToProfileTab: (tab: 'recordings' | 'favorites' | 'notes' | 'chats') => void;
  onAddScheduledMeeting: (meeting: ScheduledMeeting) => void;
  onAddDateNote: (dateNote: DateNote) => void;
  onSelectUser?: (user: SocialUser | UserProfile) => void;
}

export const MeetingHomeScreen: React.FC<MeetingHomeScreenProps> = ({
  userProfile,
  rooms,
  notes,
  recordings,
  scheduledMeetings,
  dateNotes,
  socialUsers = [],
  onStartNewMeeting,
  onJoinMeeting,
  onNavigateToProfileTab,
  onAddScheduledMeeting,
  onAddDateNote,
  onSelectUser,
}) => {
  // Modal states
  const [isNewMeetingModalOpen, setIsNewMeetingModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // User Search Bar State (@username search)
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Combine current user and network social users for search
  const allAvailableUsers = useMemo<SocialUser[]>(() => {
    const currentAsUser: SocialUser = {
      id: 'usr_me',
      name: userProfile.name,
      handle: userProfile.handle.startsWith('@') ? userProfile.handle : `@${userProfile.handle}`,
      avatar: userProfile.avatar,
      bio: userProfile.bio || 'WebRTC Live Audio/Video Meeting Host ⚡',
      isFollowedByMe: false,
      isFollowingMe: false,
      followersCount: typeof userProfile.followers === 'number' ? userProfile.followers : 1,
      followingCount: userProfile.following || 0,
    };

    const externalUsers = socialUsers || [];
    return [currentAsUser, ...externalUsers];
  }, [userProfile, socialUsers]);

  // Filter users matching query (@username, name, bio)
  const filteredUsers = useMemo(() => {
    const rawQuery = searchUserQuery.trim().toLowerCase();
    const query = rawQuery.startsWith('@') ? rawQuery.slice(1) : rawQuery;

    if (!query) {
      return allAvailableUsers;
    }

    return allAvailableUsers.filter((u) => {
      const handleClean = u.handle.toLowerCase().replace('@', '');
      const nameClean = u.name.toLowerCase();
      const bioClean = u.bio.toLowerCase();
      return (
        handleClean.includes(query) ||
        nameClean.includes(query) ||
        bioClean.includes(query)
      );
    });
  }, [allAvailableUsers, searchUserQuery]);

  // Select a user and navigate directly to their profile
  const handleSelectUser = (user: SocialUser) => {
    setIsSearchFocused(false);
    setSearchUserQuery('');
    if (onSelectUser) {
      if (user.id === 'usr_me' || user.handle === userProfile.handle) {
        onSelectUser(userProfile);
      } else {
        onSelectUser(user);
      }
    } else {
      onNavigateToProfileTab('recordings');
    }
  };

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
      className="relative w-full h-full bg-white text-neutral-900 flex flex-col overflow-y-auto pb-20 select-none"
    >
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-neutral-900 text-white text-xs font-semibold shadow-xl animate-in fade-in slide-in-from-top-2">
          {toastMessage}
        </div>
      )}

      {/* TOP BRANDING & PROFILE BAR */}
      <div className="p-4 bg-white/95 border-b border-neutral-200 sticky top-0 z-20 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          {/* User profile preview chip */}
          <div
            onClick={() => onNavigateToProfileTab('recordings')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="relative w-10 h-10 rounded-full p-0.5 bg-gradient-to-tr from-indigo-600 to-purple-600 group-hover:scale-105 transition shadow-sm">
              <img
                src={userProfile.avatar}
                alt={userProfile.name}
                className="w-full h-full rounded-full object-cover bg-neutral-100"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1">
                <span className="font-bold text-sm text-neutral-900 group-hover:text-purple-600 transition truncate max-w-[150px]">
                  {userProfile.name}
                </span>
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              </div>
              <p className="text-[11px] text-neutral-500 font-mono">{userProfile.handle}</p>
            </div>
          </div>

          {/* Current Date Badge */}
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">
              Wednesday
            </span>
            <span className="text-xs font-bold text-neutral-800 bg-neutral-100 border border-neutral-200 px-2.5 py-0.5 rounded-full">
              Sep 9, 2026
            </span>
          </div>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div className="p-4 space-y-6 flex-1 bg-white">
        {/* ========================================================================= */}
        {/* HORIZONTAL ELONGATED SEARCH BAR FOR @USERNAME (Directly Above Meeting Actions) */}
        {/* ========================================================================= */}
        <div ref={searchContainerRef} className="relative z-30">
          <div
            className={`w-full relative flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border transition-all duration-200 shadow-xs ${
              isSearchFocused
                ? 'border-purple-500 ring-2 ring-purple-500/20 shadow-xs'
                : 'border-neutral-200 hover:border-neutral-300 bg-neutral-50/60 hover:bg-white'
            }`}
          >
            {/* AtSign Icon Badge */}
            <div className="w-6 h-6 rounded-full bg-purple-50 border border-purple-200/80 text-purple-600 flex items-center justify-center shrink-0 font-bold text-xs font-mono select-none">
              @
            </div>

            {/* Input Field */}
            <div className="flex-1 min-w-0">
              <input
                id="input-search-username"
                type="text"
                value={searchUserQuery}
                onChange={(e) => setSearchUserQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                placeholder="@"
                className="w-full bg-transparent text-xs sm:text-sm text-neutral-900 placeholder-neutral-400 focus:outline-hidden font-medium py-0.5"
                autoComplete="off"
                spellCheck="false"
              />
            </div>

            {/* Clear Button or Search icon */}
            {searchUserQuery ? (
              <button
                id="btn-clear-username-search"
                type="button"
                onClick={() => setSearchUserQuery('')}
                className="w-5 h-5 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 flex items-center justify-center transition cursor-pointer shrink-0"
                title="Clear"
              >
                <X className="w-3 h-3" />
              </button>
            ) : (
              <Search className="w-3.5 h-3.5 text-neutral-400 shrink-0 mr-0.5" />
            )}
          </div>

          {/* DROPDOWN RESULTS POPOVER */}
          {isSearchFocused && (
            <div
              id="search-username-dropdown"
              className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-neutral-200 shadow-2xl overflow-hidden z-50 max-h-84 flex flex-col animate-in fade-in slide-in-from-top-2 duration-150"
            >
              {/* Header inside dropdown */}
              <div className="px-3.5 py-2.5 bg-neutral-50/90 border-b border-neutral-200 flex items-center justify-between text-xs">
                <span className="font-bold text-neutral-700 flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-purple-600" />
                  {searchUserQuery.trim()
                    ? `Found Users for "${searchUserQuery}" (${filteredUsers.length})`
                    : `Registered Users & Profiles (${filteredUsers.length})`}
                </span>
                <button
                  type="button"
                  onClick={() => setIsSearchFocused(false)}
                  className="text-neutral-400 hover:text-neutral-700 p-1 rounded-md hover:bg-neutral-200/50 transition cursor-pointer"
                  title="Close dropdown"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Users list */}
              <div className="overflow-y-auto divide-y divide-neutral-100 flex-1 p-1 max-h-64">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleSelectUser(user)}
                      className="w-full p-2.5 rounded-xl hover:bg-purple-50/70 transition flex items-center justify-between text-left group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Avatar */}
                        <div className="relative w-10 h-10 rounded-full shrink-0 p-0.5 bg-gradient-to-tr from-purple-500 to-indigo-500 shadow-2xs">
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-full h-full rounded-full object-cover bg-neutral-100"
                          />
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                        </div>

                        {/* Name, Handle, Badges & Bio */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-xs text-neutral-900 group-hover:text-purple-600 transition truncate">
                              {user.name}
                            </span>
                            <span className="font-mono text-[11px] text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded-md font-semibold border border-purple-200/60">
                              {user.handle}
                            </span>
                            {user.id === 'usr_me' && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                                You
                              </span>
                            )}
                            {user.isFollowingMe && user.id !== 'usr_me' && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                                Follows you
                              </span>
                            )}
                            {user.isFollowedByMe && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-medium">
                                Following
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-neutral-500 truncate max-w-[220px] sm:max-w-xs mt-0.5">
                            {user.bio}
                          </p>
                        </div>
                      </div>

                      {/* Right indicator button */}
                      <div className="flex items-center gap-1 text-purple-600 shrink-0 ml-2 group-hover:translate-x-0.5 transition-transform">
                        <span className="text-[11px] font-bold text-purple-700 bg-purple-100/60 px-2 py-1 rounded-lg border border-purple-200 group-hover:bg-purple-600 group-hover:text-white transition">
                          Profile
                        </span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="py-7 px-4 text-center">
                    <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-2 border border-purple-200">
                      <AtSign className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-semibold text-neutral-800">
                      No @username found matching "{searchUserQuery}"
                    </p>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      Try searching for @kyawkyaw, @susu, @thirimay, @zawmin or @aungmyint
                    </p>
                  </div>
                )}
              </div>

              {/* Bottom footer: note about future account creation */}
              <div className="px-3.5 py-2 bg-purple-50/60 border-t border-purple-100 flex items-center justify-between text-[11px] text-purple-700">
                <span className="flex items-center gap-1 font-medium truncate">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span>Account Create / Sign In &amp; @username registration ready</span>
                </span>
                <span className="font-mono text-[9px] text-purple-500 font-bold shrink-0">
                  User Directory
                </span>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 1: PRIMARY ACTION BUTTONS (New, Join, Schedule, Share Room) */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3 flex items-center gap-1.5">
            <Video className="w-3.5 h-3.5 text-purple-600" />
            <span>Meeting Actions</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-3.5">
            {/* 1. NEW MEETING BUTTON */}
            <button
              id="btn-home-new-meeting"
              type="button"
              onClick={() => {
                setGeneratedNewToken(`#MEET-${Math.floor(1000 + Math.random() * 9000)}`);
                setNewMeetingTitle(`${userProfile.name}'s Meeting`);
                setIsNewMeetingModalOpen(true);
              }}
              className="group relative h-28 p-3 rounded-2xl bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 hover:from-orange-400 hover:to-amber-500 text-white flex flex-col items-center justify-center text-center shadow-md shadow-orange-500/20 border border-orange-300/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-orange-500/30 active:scale-[0.98] cursor-pointer"
            >
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 text-white group-hover:scale-105 transition-transform duration-200 shadow-2xs mb-2">
                <Video className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs sm:text-[13px] font-semibold text-white tracking-wide leading-tight text-center drop-shadow-2xs">
                New
              </span>
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
              className="group relative h-28 p-3 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-600 text-white flex flex-col items-center justify-center text-center shadow-md shadow-blue-500/20 border border-blue-300/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/30 active:scale-[0.98] cursor-pointer"
            >
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 text-white group-hover:scale-105 transition-transform duration-200 shadow-2xs mb-2">
                <UserPlus className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs sm:text-[13px] font-semibold text-white tracking-wide leading-tight text-center drop-shadow-2xs">
                Join
              </span>
            </button>

            {/* 3. SCHEDULE BUTTON */}
            <button
              id="btn-home-schedule-meeting"
              type="button"
              onClick={() => setIsScheduleModalOpen(true)}
              className="group relative h-28 p-3 rounded-2xl bg-gradient-to-br from-purple-600 via-fuchsia-600 to-purple-700 hover:from-purple-500 hover:to-fuchsia-600 text-white flex flex-col items-center justify-center text-center shadow-md shadow-purple-500/20 border border-purple-300/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-500/30 active:scale-[0.98] cursor-pointer"
            >
              {scheduledMeetings.length > 0 && (
                <span className="absolute top-2 right-2.5 px-1.5 py-0.5 rounded-full bg-white text-purple-700 text-[10px] font-bold shadow-xs">
                  {scheduledMeetings.length}
                </span>
              )}
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 text-white group-hover:scale-105 transition-transform duration-200 shadow-2xs mb-2">
                <CalendarDays className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs sm:text-[13px] font-semibold text-white tracking-wide leading-tight text-center drop-shadow-2xs">
                Schedule
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
              className="group relative h-28 p-3 rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 text-white flex flex-col items-center justify-center text-center shadow-md shadow-emerald-500/20 border border-emerald-300/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/30 active:scale-[0.98] cursor-pointer"
            >
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 text-white group-hover:scale-105 transition-transform duration-200 shadow-2xs mb-2">
                <Share2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs sm:text-[13px] font-semibold text-white tracking-wide leading-tight text-center drop-shadow-2xs">
                Share
              </span>
            </button>
          </div>

          {/* Quick Start / Set Meeting Name directly on Initial Home Screen */}
          <div className="mt-3.5 p-3.5 bg-neutral-50 hover:bg-neutral-100/80 border border-neutral-200 rounded-2xl transition shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                  <Edit3 className="w-3.5 h-3.5 text-purple-600" />
                </div>
                <span className="text-xs font-bold text-neutral-800">Meeting Title</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono text-purple-700 font-bold bg-white px-2 py-0.5 rounded-md border border-purple-200 shadow-2xs">
                  {generatedNewToken}
                </span>
                <button
                  type="button"
                  onClick={() => setGeneratedNewToken(`#MEET-${Math.floor(1000 + Math.random() * 9000)}`)}
                  className="text-[10px] text-neutral-500 hover:text-purple-600 bg-white hover:bg-purple-50 px-1.5 py-0.5 rounded border border-neutral-200 transition cursor-pointer"
                  title="Generate new token"
                >
                  🎲
                </button>
              </div>
            </div>

            <form onSubmit={handleConfirmStartNew} className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  id="input-home-meeting-name"
                  type="text"
                  required
                  value={newMeetingTitle}
                  onChange={(e) => setNewMeetingTitle(e.target.value)}
                  placeholder="Enter meeting name (e.g. Weekly Strategy Sync)..."
                  className="flex-1 bg-white border border-neutral-300 focus:border-purple-600 rounded-xl px-3 py-2 text-xs text-neutral-900 outline-none transition shadow-2xs placeholder:text-neutral-400"
                />
                <button
                  id="btn-home-direct-start"
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 active:scale-95 transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Video className="w-3.5 h-3.5 text-white" />
                  <span>Start</span>
                </button>
              </div>

              {/* Suggestions chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
                <span className="text-[10px] text-neutral-400 shrink-0">Presets:</span>
                {['Weekly Sync', 'Project Review', 'Team Catchup', 'Brainstorming'].map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setNewMeetingTitle(suggestion)}
                    className="text-[10px] bg-white hover:bg-purple-50 border border-neutral-200 hover:border-purple-300 text-neutral-600 hover:text-purple-700 px-2 py-0.5 rounded-full transition shrink-0 cursor-pointer"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </form>
          </div>
        </div>

        {/* SECTION 2: HISTORY & ARCHIVE (Chat History, Note History & Record History) */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-purple-600" />
            <span>History &amp; Records</span>
          </h3>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {/* CHAT HISTORY */}
            <button
              id="btn-home-chat-history"
              type="button"
              onClick={() => onNavigateToProfileTab('chats')}
              className="p-3 rounded-xl bg-white hover:bg-purple-50/40 border border-neutral-200 hover:border-purple-300 text-left transition duration-200 group cursor-pointer shadow-xs"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center mb-2 group-hover:scale-110 transition text-purple-600">
                <MessageSquareCode className="w-4 h-4 text-purple-600" />
              </div>
              <span className="block font-bold text-xs text-neutral-900 group-hover:text-purple-600 transition truncate">
                Chat History
              </span>
              <span className="text-[10px] text-neutral-500 truncate block">{recordings.length} sessions</span>
            </button>

            {/* NOTES HISTORY */}
            <button
              id="btn-home-notes-history"
              type="button"
              onClick={() => onNavigateToProfileTab('notes')}
              className="p-3 rounded-xl bg-white hover:bg-purple-50/40 border border-neutral-200 hover:border-purple-300 text-left transition duration-200 group cursor-pointer shadow-xs"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center mb-2 group-hover:scale-110 transition text-purple-600">
                <FileText className="w-4 h-4 text-purple-600" />
              </div>
              <span className="block font-bold text-xs text-neutral-900 group-hover:text-purple-600 transition truncate">
                Meeting Notes
              </span>
              <span className="text-[10px] text-neutral-500 truncate block">{notes.length} notes</span>
            </button>

            {/* RECORD HISTORY */}
            <button
              id="btn-home-record-history"
              type="button"
              onClick={() => onNavigateToProfileTab('recordings')}
              className="p-3 rounded-xl bg-white hover:bg-purple-50/40 border border-neutral-200 hover:border-purple-300 text-left transition duration-200 group cursor-pointer shadow-xs"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center mb-2 group-hover:scale-110 transition text-purple-600">
                <Film className="w-4 h-4 text-purple-600" />
              </div>
              <span className="block font-bold text-xs text-neutral-900 group-hover:text-purple-600 transition truncate">
                Recordings
              </span>
              <span className="text-[10px] text-neutral-500 truncate block">
                {recordings.filter((r) => r.isUserRecorded).length} saved
              </span>
            </button>
          </div>
        </div>

        {/* SECTION 3: LIVE ACTIVE MEETINGS */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
              <span>Live Meetings ({rooms.length})</span>
            </h3>
          </div>

          <div className="space-y-2.5">
            {rooms.map((room) => (
              <div
                key={room.id}
                onClick={() => onJoinMeeting(room.token)}
                className="p-3 bg-white hover:bg-purple-50/40 border border-neutral-200 hover:border-purple-300 rounded-xl transition cursor-pointer flex items-center justify-between group shadow-xs"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0 text-purple-600 group-hover:scale-105 transition">
                    <Video className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="truncate">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.2 rounded">
                        {room.token}
                      </span>
                      <span className="text-xs font-semibold text-neutral-900 truncate max-w-[170px]">
                        {room.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-neutral-500 mt-1">
                      <span>Host: {room.host}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-purple-600" />
                        {room.participants.length}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold flex items-center gap-1 transition shrink-0 group-hover:scale-105 shadow-xs cursor-pointer"
                >
                  <span>Join</span>
                  <ArrowRight className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 4: TODAY'S SCHEDULE SUMMARY */}
        <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-purple-600" />
              <span>Today's Schedule</span>
            </h4>
            <button
              type="button"
              onClick={() => setIsScheduleModalOpen(true)}
              className="text-[11px] text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-0.5 cursor-pointer"
            >
              <span>Calendar</span>
              <ChevronRight className="w-3.5 h-3.5 text-purple-600" />
            </button>
          </div>

          {/* Quick preview of today's items */}
          <div className="space-y-2">
            {selectedDateScheduled.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="p-2.5 rounded-xl bg-white border border-neutral-200 flex items-center justify-between text-xs shadow-xs"
              >
                <div>
                  <span className="font-semibold text-neutral-900 block">{item.title}</span>
                  <span className="text-[11px] text-neutral-500 flex items-center gap-1 mt-0.5 font-mono">
                    <Clock className="w-3 h-3 text-purple-600" />
                    {item.time} ({item.duration}) • {item.token}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onJoinMeeting(item.token)}
                  className="px-3 py-1 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-[11px] font-bold text-white transition cursor-pointer shadow-xs"
                >
                  Start
                </button>
              </div>
            ))}

            {selectedDateScheduled.length === 0 && (
              <p className="text-xs text-neutral-500 text-center py-2">
                No meetings scheduled for today. Tap Schedule to add!
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={() => setIsNewMeetingModalOpen(false)}
        >
          <div
            id="new-meeting-modal-container"
            className="w-full max-w-sm bg-white border border-neutral-200 rounded-2xl p-5 text-neutral-900 shadow-2xl animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center">
                  <Video className="w-4 h-4 text-purple-600" />
                </div>
                <h3 className="font-bold text-sm text-neutral-900">Start Meeting</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewMeetingModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded-full hover:bg-neutral-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmStartNew} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1 flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-purple-600" />
                  <span>Meeting Title</span>
                </label>
                <input
                  type="text"
                  required
                  value={newMeetingTitle}
                  onChange={(e) => setNewMeetingTitle(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-xs text-neutral-900 focus:bg-white focus:border-purple-600 outline-none transition shadow-2xs"
                  placeholder="Enter meeting name (e.g. Weekly Strategy Sync)..."
                />
                {/* Suggestions chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1.5">
                  <span className="text-[10px] text-neutral-400 shrink-0">Presets:</span>
                  {['Weekly Sync', 'Project Review', 'Team Catchup', 'Brainstorming'].map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setNewMeetingTitle(suggestion)}
                      className="text-[10px] bg-neutral-100 hover:bg-purple-50 hover:text-purple-700 text-neutral-600 px-2 py-0.5 rounded-full transition shrink-0 cursor-pointer"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-neutral-600 mb-1">Generated Meeting Token</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={generatedNewToken}
                    className="flex-1 bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-xs text-purple-700 font-mono font-bold outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setGeneratedNewToken(`#MEET-${Math.floor(1000 + Math.random() * 9000)}`)}
                    className="px-2.5 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-xs text-neutral-700 transition font-medium"
                    title="Generate new code"
                  >
                    🎲 New
                  </button>
                </div>
              </div>

              {/* Ready check info */}
              <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-[11px] text-neutral-600 space-y-1">
                <div className="flex items-center justify-between text-neutral-700">
                  <span className="flex items-center gap-1.5">
                    <Camera className="w-3 h-3 text-purple-600" />
                    Video Camera
                  </span>
                  <span className="text-purple-600 font-semibold">Enabled</span>
                </div>
                <div className="flex items-center justify-between text-neutral-700">
                  <span className="flex items-center gap-1.5">
                    <Mic className="w-3 h-3 text-purple-600" />
                    Microphone
                  </span>
                  <span className="text-purple-600 font-semibold">Ready</span>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewMeetingModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  id="btn-confirm-start-meeting"
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold transition shadow-md shadow-indigo-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Video className="w-4 h-4 text-white" />
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={() => setIsJoinModalOpen(false)}
        >
          <div
            id="join-meeting-modal-container"
            className="w-full max-w-sm bg-white border border-neutral-200 rounded-2xl p-5 text-neutral-900 shadow-2xl animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center">
                  <UserPlus className="w-4 h-4 text-purple-600" />
                </div>
                <h3 className="font-bold text-sm text-neutral-900">Join a Meeting</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsJoinModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded-full hover:bg-neutral-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmJoin} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs text-neutral-600 mb-1">Meeting Token or Code</label>
                <input
                  type="text"
                  required
                  value={joinTokenInput}
                  onChange={(e) => {
                    setJoinTokenInput(e.target.value);
                    setJoinError(null);
                  }}
                  placeholder="e.g. #MEET-9021"
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-xs text-neutral-900 focus:bg-white focus:border-purple-600 outline-none font-mono"
                />
                {joinError && <p className="text-[11px] text-red-600 mt-1">{joinError}</p>}
              </div>

              {/* Quick Select from Active Rooms */}
              {rooms.length > 0 && (
                <div>
                  <label className="block text-[11px] text-neutral-500 mb-1.5">Active rooms:</label>
                  <div className="flex flex-wrap gap-1.5">
                    {rooms.map((r) => (
                      <button
                        key={r.token}
                        type="button"
                        onClick={() => setJoinTokenInput(r.token)}
                        className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-purple-50 border border-neutral-200 text-[11px] font-mono text-purple-700 transition cursor-pointer"
                      >
                        {r.token}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsJoinModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  id="btn-confirm-join-meeting"
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold transition shadow-md shadow-indigo-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4 text-white" />
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={() => setIsShareModalOpen(false)}
        >
          <div
            id="share-room-modal-container"
            className="w-full max-w-sm bg-white border border-neutral-200 rounded-2xl p-5 text-neutral-900 shadow-2xl animate-in zoom-in-95 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center">
                  <Share2 className="w-4 h-4 text-purple-600" />
                </div>
                <h3 className="font-bold text-sm text-neutral-900">Share Room</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded-full hover:bg-neutral-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Generated Room Token & Refresh */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-neutral-600">Meeting Token</label>
                <button
                  type="button"
                  onClick={regenerateToken}
                  className="text-[10px] text-purple-600 hover:underline font-semibold"
                >
                  Generate New
                </button>
              </div>
              <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-300 rounded-xl p-2.5">
                <span className="flex-1 font-mono font-bold text-sm text-purple-700">{shareToken}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(shareToken, 'token')}
                  className="px-2.5 py-1 rounded-lg bg-neutral-200 hover:bg-neutral-300 text-xs text-neutral-800 font-semibold flex items-center gap-1 transition"
                >
                  {copiedType === 'token' ? <Check className="w-3.5 h-3.5 text-purple-600" /> : <Copy className="w-3.5 h-3.5 text-purple-600" />}
                  <span>Copy</span>
                </button>
              </div>
            </div>

            {/* Direct Web Link */}
            <div>
              <label className="block text-xs text-neutral-600 mb-1">Invitation Link</label>
              <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-300 rounded-xl p-2.5">
                <span className="flex-1 text-[11px] text-neutral-700 font-mono truncate">
                  {`${window.location.origin}/#room=${shareToken.replace('#', '')}`}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(`${window.location.origin}/#room=${shareToken.replace('#', '')}`, 'link')
                  }
                  className="px-2.5 py-1 rounded-lg bg-neutral-200 hover:bg-neutral-300 text-xs text-neutral-800 font-semibold flex items-center gap-1 transition"
                >
                  {copiedType === 'link' ? <Check className="w-3.5 h-3.5 text-purple-600" /> : <Copy className="w-3.5 h-3.5 text-purple-600" />}
                  <span>Copy</span>
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  const fullText = `${userProfile.name} is inviting you to a meeting:\nTopic: ${shareTopic}\nToken: ${shareToken}\nLink: ${window.location.origin}/#room=${shareToken.replace('#', '')}`;
                  handleCopy(fullText, 'all');
                }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-indigo-500/20"
              >
                {copiedType === 'all' ? <Check className="w-4 h-4 text-white" /> : <Share2 className="w-4 h-4 text-white" />}
                <span>Copy Invitation</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsShareModalOpen(false);
                  onStartNewMeeting(shareTopic, shareToken);
                }}
                className="w-full py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer border border-neutral-200"
              >
                <Video className="w-3.5 h-3.5 text-purple-600" />
                <span>Start Room Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. SCHEDULE & INTERACTIVE CALENDAR MODAL */}
      {isScheduleModalOpen && (
        <div
          id="schedule-calendar-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in"
          onClick={() => setIsScheduleModalOpen(false)}
        >
          <div
            id="schedule-calendar-modal-container"
            className="w-full max-w-md bg-white border border-neutral-200 rounded-2xl overflow-hidden text-neutral-900 shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 bg-white border-b border-neutral-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center">
                  <CalendarDays className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-neutral-900">Meeting Schedule</h3>
                  <p className="text-[10px] text-neutral-500">Pick a date to view and schedule meetings</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="p-1 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-4 space-y-4 overflow-y-auto flex-1 divide-y divide-neutral-100">
              {/* INTERACTIVE CALENDAR WIDGET */}
              <div>
                {/* Month Switcher */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="font-bold text-sm text-neutral-900">
                    {monthNames[currentCalendarMonth]} {currentCalendarYear}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      className="p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4 text-purple-600" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextMonth}
                      className="p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4 text-purple-600" />
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

                    return (
                      <button
                        key={dateStr}
                        type="button"
                        onClick={() => setSelectedDateStr(dateStr)}
                        className={`h-8 rounded-lg flex flex-col items-center justify-center relative text-xs font-semibold transition cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xs'
                            : isToday
                            ? 'bg-purple-50 text-purple-700 border border-purple-200 font-bold'
                            : 'hover:bg-neutral-100 text-neutral-700'
                        }`}
                      >
                        <span>{dayNum}</span>
                        {/* Status dots */}
                        <div className="flex items-center gap-0.5 mt-0.5">
                          {hasScheduled && (
                            <span className="w-1 h-1 rounded-full bg-purple-600" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECTION: SCHEDULED MEETINGS FOR SELECTED DATE */}
              <div className="pt-3 space-y-2.5">
                <h4 className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5 text-purple-600" />
                  <span>Meetings for {selectedDateStr} ({selectedDateScheduled.length})</span>
                </h4>

                {/* Scheduled list */}
                {selectedDateScheduled.length > 0 ? (
                  <div className="space-y-2">
                    {selectedDateScheduled.map((m) => (
                      <div
                        key={m.id}
                        className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold text-purple-700 bg-purple-100 px-1.5 py-0.2 rounded border border-purple-200">
                              {m.token}
                            </span>
                            <span className="font-semibold text-neutral-900 truncate max-w-[150px]">{m.title}</span>
                          </div>
                          <span className="text-[11px] text-neutral-500 flex items-center gap-1 mt-1 font-mono">
                            <Clock className="w-3 h-3 text-purple-600" />
                            {m.time} ({m.duration}) • Host: {m.host}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setIsScheduleModalOpen(false);
                            onJoinMeeting(m.token);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-xs font-bold text-white transition cursor-pointer shadow-xs"
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
                  className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 space-y-2"
                >
                  <span className="text-xs font-bold text-neutral-800 flex items-center gap-1">
                    <Plus className="w-3 h-3 text-purple-600" />
                    <span>Schedule New Meeting</span>
                  </span>
                  <input
                    type="text"
                    required
                    value={scheduleTitle}
                    onChange={(e) => setScheduleTitle(e.target.value)}
                    placeholder="Meeting Topic..."
                    className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs text-neutral-900 outline-none focus:border-purple-600"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      placeholder="e.g. 10:00 AM"
                      className="bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs text-neutral-900 outline-none focus:border-purple-600"
                    />
                    <select
                      value={scheduleDuration}
                      onChange={(e) => setScheduleDuration(e.target.value)}
                      className="bg-white border border-neutral-300 rounded-lg px-2 py-1.5 text-[11px] text-neutral-800 outline-none cursor-pointer"
                    >
                      <option value="15 mins">15 mins</option>
                      <option value="30 mins">30 mins</option>
                      <option value="45 mins">45 mins</option>
                      <option value="60 mins">60 mins</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer shadow-md shadow-indigo-500/20"
                  >
                    <CalendarDays className="w-3.5 h-3.5 text-white" />
                    <span>Add to Schedule</span>
                  </button>
                </form>
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 bg-neutral-50 border-t border-neutral-200 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-neutral-200 hover:bg-neutral-300 text-xs font-semibold text-neutral-800 transition"
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
