import React, { useState, useRef } from 'react';
import {
  UserProfile,
  MeetingRecording,
  MeetingNote,
  MeetingRoom,
  LanguageOption
} from '../types';
import { languageOptions } from '../data/initialData';
import {
  Grid,
  Heart,
  Bookmark,
  MessageSquareCode,
  Edit3,
  Camera,
  Play,
  Pause,
  Clock,
  Eye,
  Share2,
  Filter,
  CheckCircle2,
  ChevronDown,
  Volume2,
  VolumeX,
  X,
  Sparkles,
  Check,
  Video,
  UserCheck,
  Send
} from 'lucide-react';

interface TikTokProfileScreenProps {
  userProfile: UserProfile;
  recordings: MeetingRecording[];
  notes: MeetingNote[];
  rooms: MeetingRoom[];
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onToggleFavoriteRecording: (recordingId: string) => void;
  onExportToPost: (content: string) => void;
  onJumpToMeeting?: (token: string) => void;
}

type ProfileTabType = 'recordings' | 'favorites' | 'notes' | 'subtitles';

export const TikTokProfileScreen: React.FC<TikTokProfileScreenProps> = ({
  userProfile,
  recordings,
  notes,
  rooms,
  onUpdateProfile,
  onToggleFavoriteRecording,
  onExportToPost,
  onJumpToMeeting,
}) => {
  // 4 TikTok Profile tabs replacing lock/repost/bookmark/favourite
  const [activeTab, setActiveTab] = useState<ProfileTabType>('recordings');

  // Edit Profile Modal
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState(userProfile.name);
  const [editHandle, setEditHandle] = useState(userProfile.handle);
  const [editBio, setEditBio] = useState(userProfile.bio);
  const [editAvatar, setEditAvatar] = useState(userProfile.avatar);

  // Hidden file input for photo upload
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Video playback player modal
  const [activePlaybackRecording, setActivePlaybackRecording] = useState<MeetingRecording | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackProgress, setPlaybackProgress] = useState(35);

  // Tab 3: Meeting filter for Notes
  const [selectedNoteMeetingFilter, setSelectedNoteMeetingFilter] = useState<string>('All');

  // Tab 4: Meeting filter & Language selector for Subtitles Chat
  const [selectedSubtitleMeetingFilter, setSelectedSubtitleMeetingFilter] = useState<string>(
    recordings[0]?.meetingToken || rooms[0]?.token || '#MEET-9021'
  );
  const [selectedLanguage, setSelectedLanguage] = useState<string>('Myanmar (MM)');
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  // Share profile feedback toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Only show meetings recorded by the user!
  const userRecordings = recordings.filter((r) => r.isUserRecorded);

  // Favorited recordings
  const favoriteRecordings = recordings.filter((r) => r.isFavorited);

  // Handle local image file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setEditAvatar(dataUrl);
        onUpdateProfile({ avatar: dataUrl });
        showToast('📸 Profile picture updated successfully!');
      }
    };
    reader.readAsDataURL(file);
  };

  // Save profile changes
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      name: editName.trim() || userProfile.name,
      handle: editHandle.trim().startsWith('@') ? editHandle.trim() : `@${editHandle.trim()}`,
      bio: editBio.trim(),
      avatar: editAvatar,
    });
    setIsEditProfileOpen(false);
    showToast('✅ Profile saved successfully!');
  };

  // Filter notes by selected meeting token
  const filteredNotes = notes.filter((n) =>
    selectedNoteMeetingFilter === 'All' ? true : n.meetingToken === selectedNoteMeetingFilter
  );

  // Current meeting recording or room for subtitle chat
  const currentSubtitleRecording =
    recordings.find((r) => r.meetingToken === selectedSubtitleMeetingFilter) || recordings[0];

  return (
    <div id="tiktok-profile-screen" className="relative w-full h-full bg-black text-white flex flex-col overflow-hidden">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-neutral-900/95 border border-red-500/60 text-white text-xs font-medium shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-2">
          {toastMessage}
        </div>
      )}

      {/* Hidden Profile Picture File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* 1. TOP BAR */}
      <div className="sticky top-0 z-20 bg-black/90 backdrop-blur-md border-b border-neutral-800/80 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-bold text-sm text-white truncate max-w-[200px]">
          <span>{userProfile.handle}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              showToast('🔗 Profile link copied to clipboard!');
            }}
            className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition cursor-pointer"
            title="Share Profile"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SCROLLABLE PROFILE CONTAINER */}
      <div className="flex-1 overflow-y-auto pb-24 divide-y divide-neutral-800/60">
        {/* 2. PROFILE HEADER & EDIT BIO */}
        <div className="p-4 flex flex-col items-center text-center">
          {/* Avatar with Camera Overlay */}
          <div className="relative mb-3 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="w-22 h-22 rounded-full p-0.5 bg-gradient-to-tr from-red-600 via-amber-500 to-cyan-500 shadow-xl">
              <img
                src={userProfile.avatar}
                alt={userProfile.name}
                className="w-full h-full rounded-full object-cover bg-neutral-900"
              />
            </div>
            <button
              type="button"
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white border-2 border-black flex items-center justify-center shadow-lg transition active:scale-95 cursor-pointer"
              title="Upload new profile picture"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Name & Handle */}
          <h2 className="font-bold text-base text-white flex items-center gap-1.5">
            {userProfile.name}
            <UserCheck className="w-4 h-4 text-red-500" />
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5 font-mono">{userProfile.handle}</p>

          {/* TikTok Stats Row */}
          <div className="flex items-center justify-center gap-6 my-3.5 text-center">
            <div>
              <span className="font-bold text-sm text-white block">{userProfile.following}</span>
              <span className="text-[11px] text-neutral-400">Following</span>
            </div>
            <div className="w-px h-6 bg-neutral-800" />
            <div>
              <span className="font-bold text-sm text-white block">{userProfile.followers}</span>
              <span className="text-[11px] text-neutral-400">Followers</span>
            </div>
            <div className="w-px h-6 bg-neutral-800" />
            <div>
              <span className="font-bold text-sm text-white block">{userProfile.likes}</span>
              <span className="text-[11px] text-neutral-400">Likes</span>
            </div>
          </div>

          {/* Action Buttons: Edit Profile & Picture Upload */}
          <div className="flex items-center gap-2 w-full max-w-xs justify-center mb-3">
            <button
              id="btn-edit-profile-open"
              type="button"
              onClick={() => {
                setEditName(userProfile.name);
                setEditHandle(userProfile.handle);
                setEditBio(userProfile.bio);
                setEditAvatar(userProfile.avatar);
                setIsEditProfileOpen(true);
              }}
              className="flex-1 py-2 px-3 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-red-400" />
              <span>Edit Profile</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="py-2 px-3 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 text-xs font-semibold text-neutral-300 hover:text-white flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
              title="Upload Profile Picture"
            >
              <Camera className="w-3.5 h-3.5 text-cyan-400" />
              <span>Photo</span>
            </button>
          </div>

          {/* Bio Display */}
          <div className="w-full max-w-sm bg-neutral-950/80 border border-neutral-900 rounded-xl p-2.5 text-xs text-neutral-300 text-left leading-relaxed">
            <p className="line-clamp-3">{userProfile.bio}</p>
          </div>
        </div>

        {/* 3. TIKTOK REPLACEMENT TAB ROW */}
        {/* Replacing lock/repost/Bookmark/Favourite with: Recordings (Grid), Favorite (Heart), Meeting Notes (Bookmark), Subtitle Chat (MessageSquareCode) */}
        <div className="sticky top-[53px] z-10 bg-black/95 backdrop-blur-md border-b border-neutral-800 flex items-center justify-around px-2">
          {/* Tab 1: Recordings */}
          <button
            id="tab-profile-recordings"
            type="button"
            onClick={() => setActiveTab('recordings')}
            className={`flex-1 py-3 flex flex-col items-center justify-center border-b-2 transition cursor-pointer relative ${
              activeTab === 'recordings'
                ? 'border-white text-white font-bold'
                : 'border-transparent text-neutral-500 hover:text-neutral-300'
            }`}
            title="My Recorded Meetings (#MEET Video Grid)"
          >
            <Grid className="w-5 h-5" />
            <span className="text-[10px] mt-1">Recordings ({userRecordings.length})</span>
          </button>

          {/* Tab 2: Favourite / Love */}
          <button
            id="tab-profile-favorites"
            type="button"
            onClick={() => setActiveTab('favorites')}
            className={`flex-1 py-3 flex flex-col items-center justify-center border-b-2 transition cursor-pointer relative ${
              activeTab === 'favorites'
                ? 'border-red-500 text-red-500 font-bold'
                : 'border-transparent text-neutral-500 hover:text-neutral-300'
            }`}
            title="Favourite / Loved Recordings"
          >
            <Heart className={`w-5 h-5 ${activeTab === 'favorites' ? 'fill-red-500' : ''}`} />
            <span className="text-[10px] mt-1">Favourites</span>
          </button>

          {/* Tab 3: Meeting Filter & Notes */}
          <button
            id="tab-profile-notes"
            type="button"
            onClick={() => setActiveTab('notes')}
            className={`flex-1 py-3 flex flex-col items-center justify-center border-b-2 transition cursor-pointer relative ${
              activeTab === 'notes'
                ? 'border-amber-400 text-amber-400 font-bold'
                : 'border-transparent text-neutral-500 hover:text-neutral-300'
            }`}
            title="Note List by Meeting Filter"
          >
            <Bookmark className="w-5 h-5" />
            <span className="text-[10px] mt-1">Notes Filter</span>
          </button>

          {/* Tab 4: Subtitles Chat Format */}
          <button
            id="tab-profile-subtitles"
            type="button"
            onClick={() => setActiveTab('subtitles')}
            className={`flex-1 py-3 flex flex-col items-center justify-center border-b-2 transition cursor-pointer relative ${
              activeTab === 'subtitles'
                ? 'border-cyan-400 text-cyan-400 font-bold'
                : 'border-transparent text-neutral-500 hover:text-neutral-300'
            }`}
            title="Subtitle Chat with Speaker & Language Selector"
          >
            <MessageSquareCode className="w-5 h-5" />
            <span className="text-[10px] mt-1">Chat Subtitles</span>
          </button>
        </div>

        {/* 4. TAB CONTENTS */}

        {/* TAB 1: USER RECORDINGS VIDEO GRID */}
        {activeTab === 'recordings' && (
          <div className="p-2 sm:p-3">
            {userRecordings.length === 0 ? (
              <div className="py-16 text-center text-neutral-500 px-4">
                <div className="w-14 h-14 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto mb-3 text-red-500/60">
                  <Video className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-semibold text-neutral-300 mb-1">No Recorded Meetings Yet</h4>
                <p className="text-xs text-neutral-500 max-w-xs mx-auto leading-relaxed">
                  To save a meeting here, join any live meeting and turn <span className="text-red-400 font-bold">ON</span> the Recording button at the top!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {userRecordings.map((rec) => (
                  <div
                    key={rec.id}
                    onClick={() => {
                      setActivePlaybackRecording(rec);
                      setIsPlaying(true);
                    }}
                    className="relative aspect-[3/4] rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800/80 group cursor-pointer shadow-md hover:border-red-500/60 transition"
                  >
                    {/* Thumbnail Image */}
                    <img
                      src={rec.thumbnailUrl}
                      alt={rec.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/60 pointer-events-none" />

                    {/* Top Badge: Meeting Token */}
                    <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-black/75 backdrop-blur-md px-2 py-0.5 rounded-md border border-neutral-700/60 text-[10px] font-mono text-red-400 font-bold">
                      <span>{rec.meetingToken}</span>
                    </div>

                    {/* Top Right: Favorite Love Pill */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavoriteRecording(rec.id);
                        showToast(rec.isFavorited ? 'Removed from favorites' : 'Added to favorites ❤️');
                      }}
                      className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-black/60 hover:bg-black text-white backdrop-blur-md transition active:scale-90"
                    >
                      <Heart className={`w-3.5 h-3.5 ${rec.isFavorited ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                    </button>

                    {/* Bottom Info: Duration & Views */}
                    <div className="absolute bottom-2 left-2 right-2 z-10">
                      <p className="text-[11px] font-semibold text-white truncate leading-tight mb-1">
                        {rec.title}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-neutral-300">
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-neutral-400" />
                          {rec.duration}
                        </span>
                        <span className="flex items-center gap-1 font-mono text-neutral-400">
                          <Play className="w-2.5 h-2.5 fill-current" />
                          {rec.views}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: FAVORITE / LOVE RECORDINGS */}
        {activeTab === 'favorites' && (
          <div className="p-2 sm:p-3">
            {favoriteRecordings.length === 0 ? (
              <div className="py-16 text-center text-neutral-500 px-4">
                <Heart className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
                <h4 className="text-sm font-semibold text-neutral-300 mb-1">No Favorite Recordings Yet</h4>
                <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                  Tap the heart icon on any recorded meeting to pin it to your favorites list.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {favoriteRecordings.map((rec) => (
                  <div
                    key={rec.id}
                    onClick={() => {
                      setActivePlaybackRecording(rec);
                      setIsPlaying(true);
                    }}
                    className="relative aspect-[3/4] rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 group cursor-pointer shadow-md hover:border-red-500/60 transition"
                  >
                    <img
                      src={rec.thumbnailUrl}
                      alt={rec.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/60 pointer-events-none" />

                    <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-black/75 backdrop-blur-md px-2 py-0.5 rounded-md border border-neutral-700/60 text-[10px] font-mono text-red-400 font-bold">
                      <span>{rec.meetingToken}</span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavoriteRecording(rec.id);
                      }}
                      className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-black/60 hover:bg-black text-red-500 backdrop-blur-md transition active:scale-90"
                    >
                      <Heart className="w-3.5 h-3.5 fill-red-500" />
                    </button>

                    <div className="absolute bottom-2 left-2 right-2 z-10">
                      <p className="text-[11px] font-semibold text-white truncate leading-tight mb-1">
                        {rec.title}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-neutral-300">
                        <span className="font-mono text-neutral-400">{rec.duration}</span>
                        <span className="flex items-center gap-1 text-red-400 font-mono">
                          <Heart className="w-2.5 h-2.5 fill-current" />
                          {rec.likes}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: NOTE LIST BY MEETING FILTER */}
        {activeTab === 'notes' && (
          <div className="p-3 space-y-3">
            {/* Filter Bar by Meeting Token */}
            <div className="flex items-center justify-between gap-2 bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
              <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                <Filter className="w-3.5 h-3.5 text-amber-400" />
                <span>Filter by Meeting:</span>
              </div>
              <div className="relative">
                <select
                  id="select-profile-notes-filter"
                  value={selectedNoteMeetingFilter}
                  onChange={(e) => setSelectedNoteMeetingFilter(e.target.value)}
                  className="bg-neutral-900 border border-neutral-700/80 rounded-lg px-3 py-1 text-xs text-amber-300 font-semibold focus:outline-none focus:border-amber-400 appearance-none pr-6 cursor-pointer"
                >
                  <option value="All">All Meetings</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.token}>
                      {r.token} · {r.title.slice(0, 20)}...
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-amber-400 absolute right-1.5 top-2 pointer-events-none" />
              </div>
            </div>

            {/* Notes List */}
            {filteredNotes.length === 0 ? (
              <div className="py-12 text-center text-neutral-500">
                <Bookmark className="w-10 h-10 text-neutral-700 mx-auto mb-2" />
                <p className="text-xs">No Granola notes found for {selectedNoteMeetingFilter}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNotes.map((note) => (
                  <div
                    key={note.id}
                    className="bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 space-y-2.5 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-red-400">
                          {note.meetingToken}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-medium">
                          {note.category}
                        </span>
                      </div>
                      <span className="text-[10px] text-neutral-500">{note.timestamp}</span>
                    </div>

                    <h4 className="text-xs font-bold text-white">{note.title}</h4>

                    {/* Key Takeaways */}
                    <div className="bg-neutral-900/70 rounded-lg p-2 space-y-1">
                      <p className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Granola Key Points:
                      </p>
                      <ul className="text-[11px] text-neutral-300 space-y-1 pl-3 list-disc">
                        {note.keyPoints.map((pt, i) => (
                          <li key={i}>{pt}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Action button to share to Post */}
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-neutral-900">
                      <button
                        type="button"
                        onClick={() => {
                          const postText = `📌 Recap from ${note.meetingToken} (${note.title}):\n• ${note.keyPoints.join('\n• ')}`;
                          onExportToPost(postText);
                        }}
                        className="px-3 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-[11px] font-medium text-neutral-300 hover:text-white flex items-center gap-1 transition"
                      >
                        <Share2 className="w-3 h-3 text-red-400" />
                        <span>Export to Post</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: SUBTITLES AS CHAT FORMAT WITH SPEAKER NAMES AND LANGUAGE SELECTOR */}
        {activeTab === 'subtitles' && (
          <div className="p-3 space-y-3">
            {/* Top Controls: Meeting Filter & Language Selector */}
            <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs text-neutral-400 font-medium flex items-center gap-1">
                  <Filter className="w-3 h-3 text-cyan-400" />
                  <span>Meeting:</span>
                </label>
                <div className="relative flex-1 max-w-[200px]">
                  <select
                    id="select-subtitles-meeting-token"
                    value={selectedSubtitleMeetingFilter}
                    onChange={(e) => setSelectedSubtitleMeetingFilter(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-700/80 rounded-lg px-2.5 py-1 text-xs text-red-400 font-semibold focus:outline-none appearance-none pr-6 cursor-pointer truncate"
                  >
                    {recordings.map((r) => (
                      <option key={r.id} value={r.meetingToken}>
                        {r.meetingToken} · {r.title.slice(0, 18)}...
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3 h-3 text-red-400 absolute right-2 top-2 pointer-events-none" />
                </div>
              </div>

              {/* Language Selector Dropdown */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-neutral-900">
                <label className="text-xs text-neutral-400 font-medium flex items-center gap-1">
                  <MessageSquareCode className="w-3 h-3 text-cyan-400" />
                  <span>Subtitle Language:</span>
                </label>
                <div className="relative">
                  <select
                    id="select-subtitles-language"
                    value={selectedLanguage}
                    onChange={(e) => {
                      setSelectedLanguage(e.target.value);
                      showToast(`Language set to ${e.target.value}`);
                    }}
                    className="bg-neutral-900 border border-cyan-500/50 rounded-lg px-3 py-1 text-xs text-cyan-300 font-semibold focus:outline-none focus:border-cyan-400 appearance-none pr-6 cursor-pointer"
                  >
                    {languageOptions.map((lang) => (
                      <option key={lang.code} value={lang.name}>
                        {lang.flag} {lang.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3 h-3 text-cyan-400 absolute right-2 top-2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Chat Style Subtitles Container */}
            <div className="space-y-3 pt-1">
              {currentSubtitleRecording?.subtitles && currentSubtitleRecording.subtitles.length > 0 ? (
                currentSubtitleRecording.subtitles.map((sub) => {
                  const translatedText =
                    sub.textByLang[selectedLanguage] ||
                    sub.textByLang['English (US)'] ||
                    Object.values(sub.textByLang)[0] ||
                    '';

                  const isPlayingAudio = playingAudioId === sub.id;

                  return (
                    <div
                      key={sub.id}
                      className={`flex gap-2.5 items-start ${sub.isMe ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      {/* Speaker Avatar */}
                      <img
                        src={sub.avatar}
                        alt={sub.speaker}
                        className="w-8 h-8 rounded-full object-cover shrink-0 border border-neutral-700/80 mt-0.5"
                      />

                      {/* Chat Bubble with Speaker Name & Timestamp */}
                      <div
                        className={`max-w-[80%] rounded-2xl p-3 shadow-md ${
                          sub.isMe
                            ? 'bg-red-950/70 border border-red-800/80 text-white rounded-tr-xs'
                            : 'bg-neutral-900/90 border border-neutral-800 text-white rounded-tl-xs'
                        }`}
                      >
                        {/* Header: Name, Tag, Time */}
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className={`text-xs font-bold ${sub.isMe ? 'text-red-300' : 'text-neutral-200'}`}>
                            {sub.speaker}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {sub.tag && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-cyan-950/80 text-cyan-300 border border-cyan-800 font-mono">
                                {sub.tag}
                              </span>
                            )}
                            <span className="text-[10px] text-neutral-400 font-mono">{sub.time}</span>
                          </div>
                        </div>

                        {/* Subtitle Text in Selected Language */}
                        <p className="text-xs text-neutral-100 leading-relaxed font-sans">
                          {translatedText}
                        </p>

                        {/* Audio Simulation Preview Button */}
                        <div className="flex items-center justify-end gap-2 mt-2 pt-1 border-t border-white/5">
                          <button
                            type="button"
                            onClick={() => {
                              if (isPlayingAudio) {
                                setPlayingAudioId(null);
                              } else {
                                setPlayingAudioId(sub.id);
                                setTimeout(() => setPlayingAudioId(null), 3000);
                              }
                            }}
                            className="flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 transition cursor-pointer"
                          >
                            {isPlayingAudio ? (
                              <>
                                <VolumeX className="w-3 h-3 text-cyan-300 animate-pulse" />
                                <span>Stop Audio</span>
                              </>
                            ) : (
                              <>
                                <Volume2 className="w-3 h-3" />
                                <span>Listen ({selectedLanguage.slice(0, 7)})</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-neutral-500">
                  <MessageSquareCode className="w-10 h-10 text-neutral-700 mx-auto mb-2" />
                  <p className="text-xs">No subtitle transcript recorded for this meeting.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 5. EDIT PROFILE MODAL */}
      {isEditProfileOpen && (
        <div
          id="edit-profile-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={() => setIsEditProfileOpen(false)}
        >
          <div
            id="edit-profile-modal-container"
            className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl p-5 text-white shadow-2xl animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-red-500" />
                <h3 className="font-bold text-sm">Edit TikTok Profile</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(false)}
                className="p-1 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="mt-4 space-y-3.5">
              {/* Profile Image Preview & Upload Button */}
              <div className="flex items-center gap-3">
                <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-red-500 shrink-0">
                  <img src={editAvatar} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 space-y-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-xs font-medium text-white flex items-center gap-1.5 transition"
                  >
                    <Camera className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Upload New Photo</span>
                  </button>
                  <p className="text-[10px] text-neutral-400">Supports PNG, JPG, or WebP</p>
                </div>
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:border-red-500 outline-none"
                />
              </div>

              {/* Username Handle */}
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Handle</label>
                <input
                  type="text"
                  required
                  value={editHandle}
                  onChange={(e) => setEditHandle(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:border-red-500 outline-none font-mono"
                />
              </div>

              {/* Bio Field */}
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Bio</label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Introduce yourself, meeting roles, or topics you host..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-white focus:border-red-500 outline-none resize-none leading-relaxed"
                />
              </div>

              {/* Buttons */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="flex-1 py-2 rounded-xl text-neutral-400 hover:text-white bg-neutral-800 text-xs font-medium transition"
                >
                  Cancel
                </button>
                <button
                  id="btn-save-profile"
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition shadow-lg shadow-red-950/50"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. INTERACTIVE VIDEO PLAYBACK MODAL */}
      {activePlaybackRecording && (
        <div
          id="video-playback-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-3 animate-in fade-in"
          onClick={() => setActivePlaybackRecording(null)}
        >
          <div
            id="video-playback-modal-container"
            className="w-full max-w-sm bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden text-white shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Playback Header */}
            <div className="p-3 bg-black/80 border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-1.5 truncate">
                <span className="font-mono text-xs font-bold text-red-400">
                  {activePlaybackRecording.meetingToken}
                </span>
                <span className="text-neutral-500">·</span>
                <span className="text-xs font-medium text-white truncate">
                  {activePlaybackRecording.title}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActivePlaybackRecording(null)}
                className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Video Canvas Simulation */}
            <div className="relative aspect-[4/3] bg-neutral-900 overflow-hidden flex items-center justify-center">
              <img
                src={activePlaybackRecording.thumbnailUrl}
                alt={activePlaybackRecording.title}
                className="w-full h-full object-cover opacity-80"
              />

              {/* Scanning WebRTC lines */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/10 to-transparent animate-pulse pointer-events-none" />

              {/* Center Play/Pause button */}
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-12 h-12 rounded-full bg-black/70 hover:bg-black/90 text-white flex items-center justify-center border border-white/20 backdrop-blur-md transition active:scale-95 shadow-2xl"
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>

              {/* Progress timeline bar */}
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/90 to-transparent">
                <div className="w-full bg-neutral-700/60 h-1.5 rounded-full overflow-hidden cursor-pointer" onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  setPlaybackProgress(Math.max(5, Math.min(95, Math.round((clickX / rect.width) * 100))));
                }}>
                  <div className="bg-red-500 h-full rounded-full transition-all" style={{ width: `${playbackProgress}%` }} />
                </div>
                <div className="flex items-center justify-between text-[9px] text-neutral-400 font-mono mt-1">
                  <span>01:34</span>
                  <span>{activePlaybackRecording.duration}</span>
                </div>
              </div>
            </div>

            {/* Playback Content Details & Actions */}
            <div className="p-3.5 space-y-3 overflow-y-auto max-h-[300px]">
              {/* Action Bar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onToggleFavoriteRecording(activePlaybackRecording.id)}
                    className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition cursor-pointer ${
                      activePlaybackRecording.isFavorited
                        ? 'bg-red-950/80 text-red-400 border-red-800'
                        : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${activePlaybackRecording.isFavorited ? 'fill-red-500 text-red-500' : ''}`} />
                    <span>{activePlaybackRecording.likes}</span>
                  </button>

                  <span className="text-[11px] text-neutral-400 flex items-center gap-1 font-mono">
                    <Eye className="w-3.5 h-3.5" /> {activePlaybackRecording.views} views
                  </span>
                </div>

                {onJumpToMeeting && (
                  <button
                    type="button"
                    onClick={() => {
                      onJumpToMeeting(activePlaybackRecording.meetingToken);
                      setActivePlaybackRecording(null);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition"
                  >
                    Jump to Live
                  </button>
                )}
              </div>

              {/* Participants */}
              <div className="space-y-1">
                <p className="text-[10px] text-neutral-400 font-medium">Participants:</p>
                <div className="flex flex-wrap gap-1">
                  {activePlaybackRecording.participants.map((p, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-300">
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              {/* Granola Notes Recap */}
              {activePlaybackRecording.notes && activePlaybackRecording.notes.length > 0 && (
                <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-2.5 space-y-1">
                  <p className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Granola AI Summary Points:
                  </p>
                  <ul className="text-[11px] text-neutral-300 space-y-1 pl-3 list-disc">
                    {activePlaybackRecording.notes.map((note, i) => (
                      <li key={i}>{note}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
