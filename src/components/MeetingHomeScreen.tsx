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
  User,
  MessageSquare,
  Send,
  Sun,
  Moon
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
  onSendDirectChatMessage?: (targetUserName: string, text: string) => void;
  onNavigateToChatWithUser?: (userName: string) => void;
  themeMode?: 'dark' | 'light';
  onToggleTheme?: () => void;
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
  onSendDirectChatMessage,
  onNavigateToChatWithUser,
  themeMode = 'dark',
  onToggleTheme,
}) => {
  const isDark = themeMode !== 'light';

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

  // Direct Chat Popup State (Community / Online Friends)
  const [activeDirectChatUser, setActiveDirectChatUser] = useState<SocialUser | null>(null);
  const [directChatMessageInput, setDirectChatMessageInput] = useState('');
  const [directChatFeedback, setDirectChatFeedback] = useState<string | null>(null);

  const handleSendDirectChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directChatMessageInput.trim() || !activeDirectChatUser) return;
    if (onSendDirectChatMessage) {
      onSendDirectChatMessage(activeDirectChatUser.name, directChatMessageInput.trim());
    }
    setDirectChatFeedback(`Message sent to ${activeDirectChatUser.name}! Stored in Chat History 💬`);
    setDirectChatMessageInput('');
    setTimeout(() => {
      setDirectChatFeedback(null);
    }, 2800);
  };

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
      className={`relative w-full h-full flex flex-col overflow-y-auto pb-1 select-none transition-colors duration-300 ${
        isDark ? 'bg-[#0B0F19] text-slate-100' : 'bg-[#F8FAFC] text-slate-900'
      }`}
    >
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-slate-900/95 border border-slate-700 text-white text-xs font-semibold shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-2">
          {toastMessage}
        </div>
      )}

      {/* TOP BRANDING & PROFILE BAR */}
      <div
        className={`px-3.5 py-2.5 sticky top-0 z-20 backdrop-blur-md border-b transition-colors ${
          isDark
            ? 'bg-[#0B0F19]/90 border-slate-800/80 text-slate-100'
            : 'bg-white/90 border-slate-200 text-slate-900 shadow-xs'
        }`}
      >
        <div className="max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto flex items-center justify-between gap-3">
          {/* User profile preview chip */}
          <div
            onClick={() => onNavigateToProfileTab('recordings')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="relative w-9 h-9 rounded-full p-0.5 bg-gradient-to-tr from-indigo-600 to-sky-500 group-hover:scale-105 transition shadow-xs">
              <img
                src={userProfile.avatar}
                alt={userProfile.name}
                className="w-full h-full rounded-full object-cover bg-neutral-100"
              />
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className={`font-bold text-xs sm:text-sm group-hover:text-indigo-400 transition truncate max-w-[150px] ${
                  isDark ? 'text-slate-100' : 'text-slate-900'
                }`}>
                  {userProfile.name}
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full tracking-wider border ${
                  isDark
                    ? 'bg-indigo-950/70 text-indigo-300 border-indigo-500/40'
                    : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                }`}>
                  CooM
                </span>
              </div>
              <p className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {userProfile.handle}
              </p>
            </div>
          </div>

          {/* Current Date Badge, Theme Toggle & CooM branding */}
          <div className="flex items-center gap-2">
            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
                className={`p-1.5 rounded-full transition cursor-pointer flex items-center justify-center ${
                  isDark
                    ? 'bg-slate-800/80 border border-slate-700/60 text-amber-400 hover:text-white hover:bg-slate-700/80 shadow-xs'
                    : 'bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-600" />}
              </button>
            )}
            <div className="flex flex-col items-end">
              <span className={`text-[9px] font-bold uppercase tracking-wider ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                CooM Platform
              </span>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                isDark
                  ? 'bg-slate-900/80 border-slate-700/80 text-slate-300'
                  : 'bg-slate-100 border-slate-200 text-slate-700'
              }`}>
                Sep 9, 2026
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div className={`p-3 space-y-3 max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto w-full transition-colors ${
        isDark ? 'bg-[#0B0F19]' : 'bg-[#F8FAFC]'
      }`}>
        {/* ========================================================================= */}
        {/* HORIZONTAL ELONGATED SEARCH BAR FOR @USERNAME (Directly Above Meeting Actions) */}
        {/* ========================================================================= */}
        <div ref={searchContainerRef} className="relative z-30">
          <div
            className={`w-full relative flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-200 shadow-xs ${
              isDark
                ? isSearchFocused
                  ? 'bg-[#1A253D] border-indigo-400 ring-2 ring-indigo-500/30 text-white'
                  : 'bg-[#131B2E] border-slate-700/70 hover:border-slate-600 text-white'
                : isSearchFocused
                ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-white text-slate-900'
                : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-900 shadow-2xs'
            }`}
          >
            {/* AtSign Icon Badge */}
            <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 font-bold text-[11px] font-mono select-none ${
              isDark
                ? 'bg-indigo-950/80 border-indigo-500/50 text-indigo-300'
                : 'bg-indigo-50 border-indigo-200 text-indigo-600'
            }`}>
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
                placeholder="@username search..."
                className={`w-full bg-transparent text-xs focus:outline-hidden font-medium py-0.5 ${
                  isDark ? 'text-slate-100 placeholder-slate-400' : 'text-slate-900 placeholder-slate-400'
                }`}
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
                className={`w-5 h-5 rounded-full flex items-center justify-center transition cursor-pointer shrink-0 ${
                  isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                }`}
                title="Clear"
              >
                <X className="w-3 h-3" />
              </button>
            ) : (
              <Search className={`w-3.5 h-3.5 shrink-0 mr-0.5 ${isDark ? 'text-slate-400' : 'text-slate-400'}`} />
            )}
          </div>

          {/* DROPDOWN RESULTS POPOVER */}
          {isSearchFocused && (
            <div
              id="search-username-dropdown"
              className={`absolute top-full left-0 right-0 mt-2 rounded-2xl border shadow-2xl overflow-hidden z-50 max-h-84 flex flex-col animate-in fade-in slide-in-from-top-2 duration-150 ${
                isDark
                  ? 'bg-[#131B2E] border-slate-700/80 text-slate-100 shadow-[0_15px_40px_rgba(0,0,0,0.6)]'
                  : 'bg-white border-slate-200 text-slate-900 shadow-2xl'
              }`}
            >
              {/* Header inside dropdown */}
              <div className={`px-3.5 py-2.5 border-b flex items-center justify-between text-xs ${
                isDark ? 'bg-[#1A253D] border-slate-700/60 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <span className="font-bold flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-indigo-400" />
                  {searchUserQuery.trim()
                    ? `Found Users for "${searchUserQuery}" (${filteredUsers.length})`
                    : `Registered Users & Profiles (${filteredUsers.length})`}
                </span>
                <button
                  type="button"
                  onClick={() => setIsSearchFocused(false)}
                  className={`p-1 rounded-md transition cursor-pointer ${
                    isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/50'
                  }`}
                  title="Close dropdown"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Users list */}
              <div className={`overflow-y-auto divide-y flex-1 p-1 max-h-72 ${
                isDark ? 'divide-slate-800/80' : 'divide-slate-100'
              }`}>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => {
                    const isMutual = user.isFollowedByMe && user.isFollowingMe;
                    const isOnline = Boolean(user.isOnline || user.id === 'usr_me');

                    return (
                      <div
                        key={user.id}
                        className={`w-full p-2.5 rounded-xl transition flex items-center justify-between text-left group ${
                          isDark ? 'hover:bg-[#1A253D]' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div
                          className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                          onClick={() => handleSelectUser(user)}
                        >
                          {/* Avatar with CooM Active Green Online Dot */}
                          <div className="relative w-10 h-10 rounded-full shrink-0 p-0.5 bg-gradient-to-tr from-indigo-500 to-sky-500 shadow-2xs">
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="w-full h-full rounded-full object-cover bg-neutral-100"
                            />
                            {/* CooM Active Presence Indicator */}
                            {isOnline && (
                              <span
                                className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white shadow-xs animate-pulse"
                                title="Active Now (Online)"
                              />
                            )}
                          </div>

                          {/* Name, Handle, Badges & Status */}
                          <div className="min-w-0 flex-1 pr-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`font-bold text-xs truncate transition ${
                                isDark ? 'text-slate-100 group-hover:text-indigo-300' : 'text-slate-900 group-hover:text-indigo-600'
                              }`}>
                                {user.name}
                              </span>
                              <span className={`font-mono text-[10px] px-1.5 py-0.2 rounded-md font-semibold border ${
                                isDark ? 'text-indigo-300 bg-indigo-950/70 border-indigo-500/30' : 'text-indigo-700 bg-indigo-50 border-indigo-200/60'
                              }`}>
                                {user.handle}
                              </span>

                              {/* Mutual Follow Badge */}
                              {isMutual && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold flex items-center gap-0.5">
                                  <span>🤝</span> Mutual
                                </span>
                              )}

                              {user.id === 'usr_me' && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                                  You
                                </span>
                              )}

                              {user.isFollowingMe && !isMutual && user.id !== 'usr_me' && (
                                <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-medium border ${
                                  isDark
                                    ? 'bg-indigo-950/50 text-indigo-300 border-indigo-500/30'
                                    : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                }`}>
                                  Follows you
                                </span>
                              )}

                              {user.isFollowedByMe && !isMutual && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
                                  Following
                                </span>
                              )}
                            </div>

                            {/* Status info & Bio */}
                            <div className="flex items-center gap-2 mt-0.5">
                              {isOnline ? (
                                <span className="text-[10px] font-semibold text-emerald-500 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                  <span>Active now {user.activeRoomToken ? `· In ${user.activeRoomToken}` : ''}</span>
                                </span>
                              ) : (
                                <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
                                  {user.lastActive || 'Offline'}
                                </span>
                              )}
                              <span className={isDark ? 'text-slate-700' : 'text-slate-300'}>·</span>
                              <p className={`text-[10px] truncate max-w-[140px] sm:max-w-xs ${
                                isDark ? 'text-slate-400' : 'text-slate-500'
                              }`}>
                                {user.bio}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Right Action Buttons: Chat Icon & Profile Button */}
                        <div className="flex items-center gap-1.5 shrink-0 ml-1">
                          {user.id !== 'usr_me' && (
                            <button
                              type="button"
                              onClick={() => {
                                setIsSearchFocused(false);
                                setActiveDirectChatUser(user);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] shadow-xs flex items-center gap-1 transition active:scale-95 cursor-pointer"
                              title={`Chat with ${user.name} (Direct message saved to Chat History)`}
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Chat</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleSelectUser(user)}
                            className={`px-2 py-1 rounded-lg font-medium text-[11px] border transition cursor-pointer ${
                              isDark
                                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                            }`}
                            title="View Profile"
                          >
                            Profile
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-7 px-4 text-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 border ${
                      isDark ? 'bg-indigo-950/70 text-indigo-300 border-indigo-500/30' : 'bg-indigo-50 text-indigo-600 border-indigo-200'
                    }`}>
                      <AtSign className="w-5 h-5" />
                    </div>
                    <p className={`text-xs font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      No @username found matching "{searchUserQuery}"
                    </p>
                    <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Try searching for @kyawkyaw, @susu, @thirimay, @zawmin or @aungmyint
                    </p>
                  </div>
                )}
              </div>

              {/* Bottom footer: note about future account creation */}
              <div className={`px-3.5 py-2 border-t flex items-center justify-between text-[11px] ${
                isDark ? 'bg-[#1A253D] border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-100 text-slate-600'
              }`}>
                <span className="flex items-center gap-1 font-medium truncate">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>Account Create / Sign In &amp; @username registration ready</span>
                </span>
                <span className={`font-mono text-[9px] font-semibold shrink-0 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                  User Directory
                </span>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 1: PRIMARY ACTION BUTTONS (New, Join, Schedule, Share Room) */}
        <div>
          <h3 className={`text-[11px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}>
            <Video className="w-3.5 h-3.5 text-indigo-500" />
            <span>Meeting Actions</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* 1. NEW MEETING BUTTON */}
            <button
              id="btn-home-new-meeting"
              type="button"
              onClick={() => {
                setGeneratedNewToken(`#MEET-${Math.floor(1000 + Math.random() * 9000)}`);
                setNewMeetingTitle(`${userProfile.name}'s Meeting`);
                setIsNewMeetingModalOpen(true);
              }}
              className="group relative h-20 p-2.5 rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white flex flex-col items-center justify-center text-center shadow-md shadow-amber-500/20 border border-amber-300/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-500/30 active:scale-[0.98] cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 text-white group-hover:scale-105 transition-transform duration-200 shadow-2xs mb-1.5">
                <Video className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-semibold text-white tracking-wide leading-tight text-center drop-shadow-2xs">
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
              className="group relative h-20 p-2.5 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 hover:from-indigo-500 hover:to-indigo-600 text-white flex flex-col items-center justify-center text-center shadow-md shadow-indigo-500/25 border border-indigo-300/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/35 active:scale-[0.98] cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 text-white group-hover:scale-105 transition-transform duration-200 shadow-2xs mb-1.5">
                <UserPlus className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-semibold text-white tracking-wide leading-tight text-center drop-shadow-2xs">
                Join
              </span>
            </button>

            {/* 3. SCHEDULE BUTTON */}
            <button
              id="btn-home-schedule-meeting"
              type="button"
              onClick={() => setIsScheduleModalOpen(true)}
              className="group relative h-20 p-2.5 rounded-2xl bg-gradient-to-br from-sky-600 via-blue-600 to-indigo-700 hover:from-sky-500 hover:to-blue-600 text-white flex flex-col items-center justify-center text-center shadow-md shadow-sky-500/20 border border-sky-300/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-sky-500/30 active:scale-[0.98] cursor-pointer"
            >
              {scheduledMeetings.length > 0 && (
                <span className="absolute top-1.5 right-2 px-1.5 py-0.2 rounded-full bg-white text-indigo-700 text-[9px] font-bold shadow-xs">
                  {scheduledMeetings.length}
                </span>
              )}
              <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 text-white group-hover:scale-105 transition-transform duration-200 shadow-2xs mb-1.5">
                <CalendarDays className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-semibold text-white tracking-wide leading-tight text-center drop-shadow-2xs">
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
              className="group relative h-20 p-2.5 rounded-2xl bg-gradient-to-br from-teal-600 via-emerald-600 to-teal-700 hover:from-teal-500 hover:to-emerald-600 text-white flex flex-col items-center justify-center text-center shadow-md shadow-emerald-500/20 border border-emerald-300/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/30 active:scale-[0.98] cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 text-white group-hover:scale-105 transition-transform duration-200 shadow-2xs mb-1.5">
                <Share2 className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-semibold text-white tracking-wide leading-tight text-center drop-shadow-2xs">
                Share
              </span>
            </button>
          </div>

          {/* Quick Start / Set Meeting Name directly on Initial Home Screen */}
          <div className={`mt-2.5 p-2.5 rounded-2xl transition shadow-xs border ${
            isDark
              ? 'bg-[#131B2E] hover:bg-[#162238] border-slate-800/80 text-slate-100'
              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-900 shadow-xs'
          }`}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <div className={`w-5 h-5 rounded-md flex items-center justify-center ${
                  isDark ? 'bg-indigo-950/80 text-indigo-300' : 'bg-indigo-50 text-indigo-600'
                }`}>
                  <Edit3 className="w-3 h-3 text-indigo-400" />
                </div>
                <span className={`text-[11px] font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  Meeting Title
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border shadow-2xs ${
                  isDark
                    ? 'text-indigo-300 bg-indigo-950/80 border-indigo-500/40'
                    : 'text-indigo-700 bg-indigo-50 border-indigo-200'
                }`}>
                  {generatedNewToken}
                </span>
                <button
                  type="button"
                  onClick={() => setGeneratedNewToken(`#MEET-${Math.floor(1000 + Math.random() * 9000)}`)}
                  className={`text-[10px] px-1 py-0.2 rounded border transition cursor-pointer ${
                    isDark
                      ? 'text-indigo-300 hover:text-white bg-slate-800 hover:bg-slate-700 border-slate-700'
                      : 'text-slate-500 hover:text-indigo-600 bg-slate-100 hover:bg-slate-200 border-slate-200'
                  }`}
                  title="Generate new token"
                >
                  🎲
                </button>
              </div>
            </div>

            <form onSubmit={handleConfirmStartNew} className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <input
                  id="input-home-meeting-name"
                  type="text"
                  required
                  value={newMeetingTitle}
                  onChange={(e) => setNewMeetingTitle(e.target.value)}
                  placeholder="Enter meeting name..."
                  className={`flex-1 rounded-xl px-2.5 py-1.5 text-xs outline-none transition shadow-2xs border ${
                    isDark
                      ? 'bg-[#1A253D] border-slate-700 text-slate-100 placeholder:text-slate-400 focus:border-indigo-400'
                      : 'bg-slate-50 border-slate-200 focus:border-indigo-500 focus:bg-white text-slate-900 placeholder:text-slate-400'
                  }`}
                />
                <button
                  id="btn-home-direct-start"
                  type="submit"
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-sm shadow-indigo-500/20 active:scale-95 transition flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <Video className="w-3 h-3 text-white" />
                  <span>Start</span>
                </button>
              </div>

              {/* Suggestions chips */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-0.5">
                <span className={`text-[9px] shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>Presets:</span>
                {['Weekly Sync', 'Project Review', 'Team Catchup', 'Brainstorming'].map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setNewMeetingTitle(suggestion)}
                    className={`text-[9px] px-2 py-0.5 rounded-full transition shrink-0 cursor-pointer border ${
                      isDark
                        ? 'bg-[#1A253D] hover:bg-[#223150] border-slate-700/60 text-slate-300 hover:text-white'
                        : 'bg-slate-100 hover:bg-indigo-50 border-slate-200 hover:border-indigo-200 text-slate-600 hover:text-indigo-700'
                    }`}
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
          <h3 className={`text-[11px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}>
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
            <span>History &amp; Records</span>
          </h3>

          <div className="grid grid-cols-3 gap-2">
            {/* CHAT HISTORY */}
            <button
              id="btn-home-chat-history"
              type="button"
              onClick={() => onNavigateToProfileTab('chats')}
              className={`p-2.5 rounded-2xl border text-left transition duration-200 group cursor-pointer shadow-xs ${
                isDark
                  ? 'bg-[#131B2E] hover:bg-[#18233B] border-slate-800/80 hover:border-indigo-500/30 text-slate-100'
                  : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-indigo-200 text-slate-900 shadow-xs'
              }`}
            >
              <div className={`w-7 h-7 rounded-lg border flex items-center justify-center mb-1.5 group-hover:scale-110 transition ${
                isDark
                  ? 'bg-indigo-950/70 border-indigo-500/30 text-indigo-300'
                  : 'bg-indigo-50 border-indigo-200 text-indigo-600'
              }`}>
                <MessageSquareCode className="w-3.5 h-3.5" />
              </div>
              <span className={`block font-bold text-xs truncate transition ${
                isDark ? 'text-slate-100 group-hover:text-indigo-300' : 'text-slate-900 group-hover:text-indigo-600'
              }`}>
                Chat History
              </span>
              <span className={`text-[10px] truncate block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {recordings.length} sessions
              </span>
            </button>

            {/* NOTES HISTORY */}
            <button
              id="btn-home-notes-history"
              type="button"
              onClick={() => onNavigateToProfileTab('notes')}
              className={`p-2.5 rounded-2xl border text-left transition duration-200 group cursor-pointer shadow-xs ${
                isDark
                  ? 'bg-[#131B2E] hover:bg-[#18233B] border-slate-800/80 hover:border-indigo-500/30 text-slate-100'
                  : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-indigo-200 text-slate-900 shadow-xs'
              }`}
            >
              <div className={`w-7 h-7 rounded-lg border flex items-center justify-center mb-1.5 group-hover:scale-110 transition ${
                isDark
                  ? 'bg-indigo-950/70 border-indigo-500/30 text-indigo-300'
                  : 'bg-indigo-50 border-indigo-200 text-indigo-600'
              }`}>
                <FileText className="w-3.5 h-3.5" />
              </div>
              <span className={`block font-bold text-xs truncate transition ${
                isDark ? 'text-slate-100 group-hover:text-indigo-300' : 'text-slate-900 group-hover:text-indigo-600'
              }`}>
                Meeting Notes
              </span>
              <span className={`text-[10px] truncate block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {notes.length} notes
              </span>
            </button>

            {/* RECORD HISTORY */}
            <button
              id="btn-home-record-history"
              type="button"
              onClick={() => onNavigateToProfileTab('recordings')}
              className={`p-2.5 rounded-2xl border text-left transition duration-200 group cursor-pointer shadow-xs ${
                isDark
                  ? 'bg-[#131B2E] hover:bg-[#18233B] border-slate-800/80 hover:border-indigo-500/30 text-slate-100'
                  : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-indigo-200 text-slate-900 shadow-xs'
              }`}
            >
              <div className={`w-7 h-7 rounded-lg border flex items-center justify-center mb-1.5 group-hover:scale-110 transition ${
                isDark
                  ? 'bg-indigo-950/70 border-indigo-500/30 text-indigo-300'
                  : 'bg-indigo-50 border-indigo-200 text-indigo-600'
              }`}>
                <Film className="w-3.5 h-3.5" />
              </div>
              <span className={`block font-bold text-xs truncate transition ${
                isDark ? 'text-slate-100 group-hover:text-indigo-300' : 'text-slate-900 group-hover:text-indigo-600'
              }`}>
                Recordings
              </span>
              <span className={`text-[10px] truncate block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {recordings.filter((r) => r.isUserRecorded).length} saved
              </span>
            </button>
          </div>
        </div>

        {/* SECTION 3: LIVE ACTIVE MEETINGS */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Meetings ({rooms.length})</span>
            </h3>
          </div>

          <div className="space-y-2">
            {rooms.length === 0 ? (
              <div className={`p-4 rounded-xl border text-center ${
                isDark ? 'bg-[#131B2E] border-slate-800/80 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}>
                <Video className="w-6 h-6 mx-auto mb-1 text-indigo-400/80" />
                <p className="text-xs font-semibold">No live meetings currently</p>
                <p className="text-[11px] mt-0.5">Tap "New" to start your first live audio/video meeting</p>
              </div>
            ) : (
              rooms.map((room) => (
              <div
                key={room.id}
                onClick={() => onJoinMeeting(room.token)}
                className={`p-2.5 border rounded-xl transition cursor-pointer flex items-center justify-between group shadow-xs ${
                  isDark
                    ? 'bg-[#131B2E] hover:bg-[#18233B] border-slate-800/80 hover:border-indigo-500/40 text-slate-100'
                    : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-indigo-300 text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 group-hover:scale-105 transition ${
                    isDark
                      ? 'bg-indigo-950/70 border-indigo-500/30 text-indigo-300'
                      : 'bg-indigo-50 border-indigo-100 text-indigo-600'
                  }`}>
                    <Video className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="flex items-center gap-1.5">
                      <span className={`font-mono text-[11px] font-bold px-1.5 py-0.2 rounded border ${
                        isDark
                          ? 'text-indigo-300 bg-indigo-950/80 border-indigo-500/40'
                          : 'text-indigo-700 bg-indigo-50 border-indigo-200'
                      }`}>
                        {room.token}
                      </span>
                      <span className={`text-xs font-semibold truncate max-w-[160px] ${
                        isDark ? 'text-slate-100' : 'text-slate-900'
                      }`}>
                        {room.title}
                      </span>
                    </div>
                    <div className={`flex items-center gap-2 text-[10px] mt-0.5 ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      <span>Host: {room.host}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Users className="w-2.5 h-2.5 text-indigo-400" />
                        {room.participants.length}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold flex items-center gap-1 transition shrink-0 group-hover:scale-105 shadow-xs cursor-pointer"
                >
                  <span>Join</span>
                  <ArrowRight className="w-3 h-3 text-white" />
                </button>
              </div>
            )))}
          </div>
        </div>

        {/* SECTION 4: TODAY'S SCHEDULE SUMMARY (Directly above Bottom Nav Bar) */}
        <div className={`p-3 rounded-2xl border space-y-2 mb-0 ${
          isDark
            ? 'bg-[#131B2E] border-slate-800/80 text-slate-100'
            : 'bg-slate-50 border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-center justify-between">
            <h4 className={`text-xs font-bold flex items-center gap-1.5 ${
              isDark ? 'text-slate-200' : 'text-slate-800'
            }`}>
              <CalendarIcon className="w-3.5 h-3.5 text-indigo-400" />
              <span>Today's Schedule</span>
            </h4>
            <button
              type="button"
              onClick={() => setIsScheduleModalOpen(true)}
              className={`text-[11px] font-semibold flex items-center gap-0.5 cursor-pointer ${
                isDark ? 'text-indigo-300 hover:text-indigo-200' : 'text-indigo-600 hover:text-indigo-700'
              }`}
            >
              <span>Calendar</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick preview of today's items */}
          <div className="space-y-1.5">
            {selectedDateScheduled.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className={`p-2 rounded-xl border flex items-center justify-between text-xs shadow-xs ${
                  isDark
                    ? 'bg-[#1A253D] border-slate-800 text-slate-100'
                    : 'bg-white border-slate-200 text-slate-900'
                }`}
              >
                <div>
                  <span className={`font-semibold block ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                    {item.title}
                  </span>
                  <span className={`text-[10px] flex items-center gap-1 mt-0.5 font-mono ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    <Clock className="w-3 h-3 text-indigo-400" />
                    {item.time} ({item.duration}) • {item.token}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onJoinMeeting(item.token)}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-[11px] font-bold text-white transition cursor-pointer shadow-xs"
                >
                  Start
                </button>
              </div>
            ))}

            {selectedDateScheduled.length === 0 && (
              <p className={`text-xs text-center py-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                No meetings scheduled for today. Tap Schedule to add!
              </p>
            )}
          </div>
        </div>

        {/* CooM Copyright Footer */}
        <div className={`pt-4 pb-10 text-center text-[11px] font-medium select-none ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          © 2026 CooM. All rights reserved.
        </div>
      </div>

      {/* ================= MODALS ================= */}

      {/* 1. START NEW MEETING MODAL */}
      {isNewMeetingModalOpen && (
        <div
          id="new-meeting-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={() => setIsNewMeetingModalOpen(false)}
        >
          <div
            id="new-meeting-modal-container"
            className={`w-full max-w-sm rounded-2xl p-5 shadow-2xl animate-in zoom-in-95 border ${
              isDark
                ? 'bg-[#131B2E] border-slate-700/80 text-slate-100 shadow-[0_15px_40px_rgba(0,0,0,0.7)]'
                : 'bg-white border-slate-200 text-slate-900 shadow-xl'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`flex items-center justify-between pb-3 border-b ${
              isDark ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                  isDark ? 'bg-indigo-950/70 border-indigo-500/30 text-indigo-300' : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                }`}>
                  <Video className="w-4 h-4" />
                </div>
                <h3 className={`font-bold text-sm ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Start Meeting</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewMeetingModalOpen(false)}
                className={`p-1 rounded-full transition cursor-pointer ${
                  isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmStartNew} className="mt-4 space-y-4">
              <div>
                <label className={`block text-xs font-semibold mb-1 flex items-center gap-1.5 ${
                  isDark ? 'text-slate-200' : 'text-slate-700'
                }`}>
                  <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Meeting Title</span>
                </label>
                <input
                  type="text"
                  required
                  value={newMeetingTitle}
                  onChange={(e) => setNewMeetingTitle(e.target.value)}
                  className={`w-full rounded-xl px-3 py-2 text-xs outline-none transition shadow-2xs border ${
                    isDark
                      ? 'bg-[#1A253D] border-slate-700 text-slate-100 placeholder:text-slate-400 focus:border-indigo-400'
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-indigo-600'
                  }`}
                  placeholder="Enter meeting name (e.g. Weekly Strategy Sync)..."
                />
                {/* Suggestions chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1.5">
                  <span className={`text-[10px] shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>Presets:</span>
                  {['Weekly Sync', 'Project Review', 'Team Catchup', 'Brainstorming'].map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setNewMeetingTitle(suggestion)}
                      className={`text-[10px] px-2 py-0.5 rounded-full transition shrink-0 cursor-pointer border ${
                        isDark
                          ? 'bg-[#1A253D] hover:bg-[#233152] text-slate-300 border-slate-700/60'
                          : 'bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 border-slate-200'
                      }`}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={`block text-xs mb-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  Generated Meeting Token
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={generatedNewToken}
                    className={`flex-1 rounded-xl px-3 py-2 text-xs font-mono font-bold outline-none border ${
                      isDark
                        ? 'bg-[#1A253D] border-slate-700 text-indigo-300'
                        : 'bg-slate-50 border-slate-300 text-indigo-700'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setGeneratedNewToken(`#MEET-${Math.floor(1000 + Math.random() * 9000)}`)}
                    className={`px-2.5 py-2 rounded-xl text-xs transition font-medium border ${
                      isDark
                        ? 'bg-indigo-950/60 hover:bg-indigo-900 text-indigo-200 border-indigo-500/30'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    }`}
                    title="Generate new code"
                  >
                    🎲 New
                  </button>
                </div>
              </div>

              {/* Ready check info */}
              <div className={`p-2.5 rounded-xl border text-[11px] space-y-1 ${
                isDark
                  ? 'bg-[#1A253D] border-slate-800 text-slate-300'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Camera className="w-3 h-3 text-indigo-400" />
                    Video Camera
                  </span>
                  <span className="text-emerald-400 font-semibold">Enabled</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Mic className="w-3 h-3 text-indigo-400" />
                    Microphone
                  </span>
                  <span className="text-emerald-400 font-semibold">Ready</span>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewMeetingModalOpen(false)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition border ${
                    isDark
                      ? 'bg-[#1A253D] hover:bg-[#233152] text-slate-300 border-slate-700'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border-slate-200'
                  }`}
                >
                  Cancel
                </button>
                <button
                  id="btn-confirm-start-meeting"
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md shadow-indigo-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={() => setIsJoinModalOpen(false)}
        >
          <div
            id="join-meeting-modal-container"
            className={`w-full max-w-sm rounded-2xl p-5 shadow-2xl animate-in zoom-in-95 border ${
              isDark
                ? 'bg-[#131B2E] border-slate-700/80 text-slate-100 shadow-[0_15px_40px_rgba(0,0,0,0.7)]'
                : 'bg-white border-slate-200 text-slate-900 shadow-xl'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`flex items-center justify-between pb-3 border-b ${
              isDark ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                  isDark ? 'bg-indigo-950/70 border-indigo-500/30 text-indigo-300' : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                }`}>
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className={`font-bold text-sm ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Join a Meeting</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsJoinModalOpen(false)}
                className={`p-1 rounded-full transition cursor-pointer ${
                  isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmJoin} className="mt-4 space-y-4">
              <div>
                <label className={`block text-xs mb-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  Meeting Token or Code
                </label>
                <input
                  type="text"
                  required
                  value={joinTokenInput}
                  onChange={(e) => {
                    setJoinTokenInput(e.target.value);
                    setJoinError(null);
                  }}
                  placeholder="e.g. #MEET-9021"
                  className={`w-full rounded-xl px-3 py-2 text-xs outline-none font-mono border ${
                    isDark
                      ? 'bg-[#1A253D] border-slate-700 text-slate-100 placeholder:text-slate-400 focus:border-indigo-400'
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-indigo-600'
                  }`}
                />
                {joinError && <p className="text-[11px] text-red-500 mt-1">{joinError}</p>}
              </div>

              {/* Quick Select from Active Rooms */}
              {rooms.length > 0 && (
                <div>
                  <label className={`block text-[11px] mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Active rooms:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {rooms.map((r) => (
                      <button
                        key={r.token}
                        type="button"
                        onClick={() => setJoinTokenInput(r.token)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition cursor-pointer border ${
                          isDark
                            ? 'bg-[#1A253D] hover:bg-[#233152] text-indigo-300 border-slate-700'
                            : 'bg-slate-100 hover:bg-indigo-50 border-slate-200 text-indigo-700'
                        }`}
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
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition border ${
                    isDark
                      ? 'bg-[#1A253D] hover:bg-[#233152] text-slate-300 border-slate-700'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border-slate-200'
                  }`}
                >
                  Cancel
                </button>
                <button
                  id="btn-confirm-join-meeting"
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md shadow-indigo-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={() => setIsShareModalOpen(false)}
        >
          <div
            id="share-room-modal-container"
            className={`w-full max-w-sm rounded-2xl p-5 shadow-2xl animate-in zoom-in-95 space-y-4 border ${
              isDark
                ? 'bg-[#131B2E] border-slate-700/80 text-slate-100 shadow-[0_15px_40px_rgba(0,0,0,0.7)]'
                : 'bg-white border-slate-200 text-slate-900 shadow-xl'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`flex items-center justify-between pb-3 border-b ${
              isDark ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                  isDark ? 'bg-indigo-950/70 border-indigo-500/30 text-indigo-300' : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                }`}>
                  <Share2 className="w-4 h-4" />
                </div>
                <h3 className={`font-bold text-sm ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Share Room</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className={`p-1 rounded-full transition cursor-pointer ${
                  isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Generated Room Token & Refresh */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Meeting Token</label>
                <button
                  type="button"
                  onClick={regenerateToken}
                  className={`text-[10px] font-semibold hover:underline ${
                    isDark ? 'text-indigo-400' : 'text-indigo-600'
                  }`}
                >
                  Generate New
                </button>
              </div>
              <div className={`flex items-center gap-2 rounded-xl p-2.5 border ${
                isDark ? 'bg-[#1A253D] border-slate-700' : 'bg-slate-50 border-slate-300'
              }`}>
                <span className={`flex-1 font-mono font-bold text-sm ${isDark ? 'text-indigo-300' : 'text-indigo-700'}`}>
                  {shareToken}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(shareToken, 'token')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                    isDark
                      ? 'bg-indigo-950/70 hover:bg-indigo-900 text-indigo-200'
                      : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                  }`}
                >
                  {copiedType === 'token' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-indigo-400" />}
                  <span>Copy</span>
                </button>
              </div>
            </div>

            {/* Direct Web Link */}
            <div>
              <label className={`block text-xs mb-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                Invitation Link
              </label>
              <div className={`flex items-center gap-2 rounded-xl p-2.5 border ${
                isDark ? 'bg-[#1A253D] border-slate-700' : 'bg-slate-50 border-slate-300'
              }`}>
                <span className={`flex-1 text-[11px] font-mono truncate ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {`${window.location.origin}/#room=${shareToken.replace('#', '')}`}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(`${window.location.origin}/#room=${shareToken.replace('#', '')}`, 'link')
                  }
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                    isDark
                      ? 'bg-indigo-950/70 hover:bg-indigo-900 text-indigo-200'
                      : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                  }`}
                >
                  {copiedType === 'link' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-indigo-400" />}
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
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-indigo-500/20"
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
                className={`w-full py-2 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                  isDark
                    ? 'bg-[#1A253D] hover:bg-[#233152] text-indigo-300 border-slate-700'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                }`}
              >
                <Video className="w-3.5 h-3.5 text-indigo-400" />
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in"
          onClick={() => setIsScheduleModalOpen(false)}
        >
          <div
            id="schedule-calendar-modal-container"
            className={`w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 border ${
              isDark
                ? 'bg-[#131B2E] border-slate-700/80 text-slate-100 shadow-[0_15px_40px_rgba(0,0,0,0.7)]'
                : 'bg-white border-slate-200 text-slate-900 shadow-xl'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`p-4 border-b flex items-center justify-between ${
              isDark ? 'bg-[#1A253D] border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                  isDark ? 'bg-indigo-950/70 border-indigo-500/30 text-indigo-300' : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                }`}>
                  <CalendarDays className="w-4 h-4" />
                </div>
                <div>
                  <h3 className={`font-bold text-sm ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Meeting Schedule</h3>
                  <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Pick a date to view and schedule meetings
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className={`p-1 rounded-full transition cursor-pointer ${
                  isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className={`p-4 space-y-4 overflow-y-auto flex-1 divide-y ${
              isDark ? 'divide-slate-800' : 'divide-slate-100'
            }`}>
              {/* INTERACTIVE CALENDAR WIDGET */}
              <div>
                {/* Month Switcher */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className={`font-bold text-sm ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                    {monthNames[currentCalendarMonth]} {currentCalendarYear}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      className={`p-1.5 rounded-lg transition cursor-pointer border ${
                        isDark
                          ? 'bg-[#1A253D] hover:bg-[#233152] text-slate-200 border-slate-700'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                      }`}
                    >
                      <ChevronLeft className="w-4 h-4 text-indigo-400" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextMonth}
                      className={`p-1.5 rounded-lg transition cursor-pointer border ${
                        isDark
                          ? 'bg-[#1A253D] hover:bg-[#233152] text-slate-200 border-slate-700'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                      }`}
                    >
                      <ChevronRight className="w-4 h-4 text-indigo-400" />
                    </button>
                  </div>
                </div>

                {/* Days of week */}
                <div className={`grid grid-cols-7 gap-1 text-center text-[11px] font-semibold mb-1 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>
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
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : isToday
                            ? isDark
                              ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-500/50 font-bold'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold'
                            : isDark
                            ? 'hover:bg-slate-800 text-slate-300'
                            : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <span>{dayNum}</span>
                        {/* Status dots */}
                        <div className="flex items-center gap-0.5 mt-0.5">
                          {hasScheduled && (
                            <span className="w-1 h-1 rounded-full bg-indigo-400" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECTION: SCHEDULED MEETINGS FOR SELECTED DATE */}
              <div className="pt-3 space-y-2.5">
                <h4 className={`text-xs font-bold flex items-center gap-1.5 ${
                  isDark ? 'text-slate-200' : 'text-slate-800'
                }`}>
                  <CalendarDays className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Meetings for {selectedDateStr} ({selectedDateScheduled.length})</span>
                </h4>

                {/* Scheduled list */}
                {selectedDateScheduled.length > 0 ? (
                  <div className="space-y-2">
                    {selectedDateScheduled.map((m) => (
                      <div
                        key={m.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                          isDark
                            ? 'bg-[#1A253D] border-slate-800 text-slate-100'
                            : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`font-mono text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                              isDark
                                ? 'text-indigo-300 bg-indigo-950/80 border-indigo-500/40'
                                : 'text-indigo-700 bg-indigo-50 border-indigo-200'
                            }`}>
                              {m.token}
                            </span>
                            <span className={`font-semibold truncate max-w-[150px] ${
                              isDark ? 'text-slate-100' : 'text-slate-900'
                            }`}>
                              {m.title}
                            </span>
                          </div>
                          <span className={`text-[11px] flex items-center gap-1 mt-1 font-mono ${
                            isDark ? 'text-slate-400' : 'text-slate-500'
                          }`}>
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
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition cursor-pointer shadow-xs"
                        >
                          Start
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={`text-[11px] italic ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    No meetings scheduled for this date.
                  </p>
                )}

                {/* Form to Schedule Meeting */}
                <form
                  onSubmit={handleSaveScheduledMeeting}
                  className={`rounded-xl p-3 space-y-2 border ${
                    isDark
                      ? 'bg-[#1A253D] border-slate-800'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <span className={`text-xs font-bold flex items-center gap-1 ${
                    isDark ? 'text-slate-200' : 'text-slate-800'
                  }`}>
                    <Plus className="w-3 h-3 text-indigo-400" />
                    <span>Schedule New Meeting</span>
                  </span>
                  <input
                    type="text"
                    required
                    value={scheduleTitle}
                    onChange={(e) => setScheduleTitle(e.target.value)}
                    placeholder="Meeting Topic..."
                    className={`w-full rounded-lg px-2.5 py-1.5 text-xs outline-none border ${
                      isDark
                        ? 'bg-[#131B2E] border-slate-700 text-slate-100 placeholder:text-slate-400 focus:border-indigo-400'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-indigo-600'
                    }`}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      placeholder="e.g. 10:00 AM"
                      className={`rounded-lg px-2.5 py-1.5 text-xs outline-none border ${
                        isDark
                          ? 'bg-[#131B2E] border-slate-700 text-slate-100 placeholder:text-slate-400 focus:border-indigo-400'
                          : 'bg-white border-slate-300 text-slate-900 focus:border-indigo-600'
                      }`}
                    />
                    <select
                      value={scheduleDuration}
                      onChange={(e) => setScheduleDuration(e.target.value)}
                      className={`rounded-lg px-2 py-1.5 text-[11px] outline-none cursor-pointer border ${
                        isDark
                          ? 'bg-[#131B2E] border-slate-700 text-slate-200'
                          : 'bg-white border-slate-300 text-slate-800'
                      }`}
                    >
                      <option value="15 mins">15 mins</option>
                      <option value="30 mins">30 mins</option>
                      <option value="45 mins">45 mins</option>
                      <option value="60 mins">60 mins</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer shadow-md shadow-indigo-500/20"
                  >
                    <CalendarDays className="w-3.5 h-3.5 text-white" />
                    <span>Add to Schedule</span>
                  </button>
                </form>
              </div>
            </div>

            {/* Footer */}
            <div className={`p-3 border-t flex items-center justify-end ${
              isDark ? 'bg-[#1A253D] border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition border ${
                  isDark
                    ? 'bg-indigo-950/70 hover:bg-indigo-900 text-indigo-200 border-indigo-500/30'
                    : 'bg-slate-200 hover:bg-slate-300 text-slate-800 border-slate-300'
                }`}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. DIRECT CHAT MODAL (CooM Direct Messenger with online status) */}
      {activeDirectChatUser && (
        <div
          id="direct-chat-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 animate-in fade-in duration-150"
          onClick={() => setActiveDirectChatUser(null)}
        >
          <div
            id="direct-chat-modal"
            className={`w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl text-left flex flex-col animate-in zoom-in-95 duration-150 border ${
              isDark
                ? 'bg-[#131B2E] border-slate-700/80 text-slate-100 shadow-[0_15px_40px_rgba(0,0,0,0.7)]'
                : 'bg-white border-slate-200 text-slate-900 shadow-xl'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-3.5 bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between border-b border-indigo-500/20">
              <div className="flex items-center gap-2.5">
                <div className="relative w-9 h-9 rounded-full ring-2 ring-indigo-400/50 overflow-hidden shrink-0">
                  <img
                    src={activeDirectChatUser.avatar}
                    alt={activeDirectChatUser.name}
                    className="w-full h-full object-cover"
                  />
                  {(activeDirectChatUser.isOnline || activeDirectChatUser.id === 'usr_me') && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-indigo-900" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs font-bold text-white">{activeDirectChatUser.name}</h3>
                    <span className="text-[10px] text-indigo-200 font-mono">
                      {activeDirectChatUser.handle}
                    </span>
                  </div>
                  <p className="text-[10px] text-emerald-300 flex items-center gap-1 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {activeDirectChatUser.isOnline ? 'Online now · Active' : 'Offline'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveDirectChatUser(null)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Success Toast / Feedback */}
            {directChatFeedback && (
              <div className={`m-3 p-2 rounded-xl text-xs flex items-center gap-2 animate-in fade-in border ${
                isDark
                  ? 'bg-emerald-950/50 border-emerald-500/30 text-emerald-300'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}>
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="font-semibold text-[11px]">{directChatFeedback}</span>
              </div>
            )}

            {/* Content & Input Form */}
            <form onSubmit={handleSendDirectChat} className="p-4 space-y-3">
              <div>
                <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${
                  isDark ? 'text-slate-300' : 'text-slate-500'
                }`}>
                  Send Direct Message to {activeDirectChatUser.name}
                </label>
                <textarea
                  value={directChatMessageInput}
                  onChange={(e) => setDirectChatMessageInput(e.target.value)}
                  placeholder={`Say hello or coordinate a meeting with ${activeDirectChatUser.name}...`}
                  rows={3}
                  autoFocus
                  className={`w-full rounded-2xl p-2.5 text-xs outline-hidden resize-none border ${
                    isDark
                      ? 'bg-[#1A253D] border-slate-700 text-slate-100 placeholder:text-slate-400 focus:border-indigo-400'
                      : 'bg-slate-50 border-slate-200 focus:border-indigo-600 text-slate-900'
                  }`}
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                {onNavigateToChatWithUser && (
                  <button
                    type="button"
                    onClick={() => {
                      const name = activeDirectChatUser.name;
                      setActiveDirectChatUser(null);
                      onNavigateToChatWithUser(name);
                    }}
                    className={`text-[11px] font-semibold hover:underline cursor-pointer ${
                      isDark ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-800'
                    }`}
                  >
                    Open in Chat Tab →
                  </button>
                )}

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setActiveDirectChatUser(null)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                      isDark
                        ? 'bg-[#1A253D] hover:bg-[#233152] text-slate-300 border-slate-700'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                    }`}
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={!directChatMessageInput.trim()}
                    className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Message</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
