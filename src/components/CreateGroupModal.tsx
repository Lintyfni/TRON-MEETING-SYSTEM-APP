import React, { useState } from 'react';
import { CooMGroup, MeetingRoom, UserProfile } from '../types';
import { X, Users, Globe, Lock, ShieldCheck, Sparkles, Image as ImageIcon } from 'lucide-react';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserProfile;
  rooms?: MeetingRoom[];
  onCreateGroup: (groupData: Omit<CooMGroup, 'id' | 'createdAt' | 'members' | 'pendingRequests' | 'admin'>) => void;
  themeMode?: 'dark' | 'light';
}

const coverPresets = [
  { id: 'tech', label: 'Tech & Code', url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&h=400&fit=crop' },
  { id: 'ai', label: 'AI & Future', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&h=400&fit=crop' },
  { id: 'creator', label: 'Video Creator', url: 'https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?w=1200&h=400&fit=crop' },
  { id: 'meeting', label: 'Live Collaboration', url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&h=400&fit=crop' },
];

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  rooms = [],
  onCreateGroup,
  themeMode = 'dark',
}) => {
  const isDark = themeMode !== 'light';
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Technology & Dev');
  const [privacy, setPrivacy] = useState<'public' | 'private'>('public');
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [selectedCover, setSelectedCover] = useState(coverPresets[0].url);
  const [linkedMeetingToken, setLinkedMeetingToken] = useState<string>('none');
  const [chatTheme, setChatTheme] = useState<'default' | 'ocean' | 'berry' | 'sunset' | 'emerald'>('ocean');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onCreateGroup({
      name: name.trim(),
      description: description.trim() || 'Welcome to our group community!',
      category,
      privacy,
      requiresApproval,
      coverImage: selectedCover,
      avatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=face',
      chatTheme,
      linkedMeetingToken: linkedMeetingToken !== 'none' ? linkedMeetingToken : undefined,
    });

    // Reset & Close
    setName('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className={`rounded-2xl w-full max-w-lg shadow-2xl border overflow-hidden flex flex-col max-h-[92vh] ${
        isDark ? 'bg-[#131B2E] border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Header */}
        <div className={`px-5 py-4 border-b flex items-center justify-between shrink-0 ${
          isDark ? 'bg-[#131B2E] border-slate-800' : 'bg-white border-slate-100'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center font-bold ${
              isDark ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-indigo-50 border-indigo-200 text-indigo-600'
            }`}>
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-base font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Create Group</h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Connect with posts, discussions & group chat</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer ${
              isDark ? 'hover:bg-[#1E293B] text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Group Name */}
          <div>
            <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Group Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Myanmar WebRTC Developers 🚀"
              className={`w-full px-3.5 py-2.5 text-sm rounded-xl border focus:outline-none transition ${
                isDark
                  ? 'bg-[#1E293B] border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-indigo-500'
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:bg-white'
              }`}
            />
          </div>

          {/* Description */}
          <div>
            <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              About this Group
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the purpose, topics, and community rules..."
              className={`w-full px-3.5 py-2 text-sm rounded-xl border focus:outline-none transition resize-none ${
                isDark
                  ? 'bg-[#1E293B] border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-indigo-500'
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:bg-white'
              }`}
            />
          </div>

          {/* Category & Privacy Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={`w-full px-3 py-2 text-xs rounded-xl border font-medium focus:outline-none transition ${
                  isDark
                    ? 'bg-[#1E293B] border-slate-700 text-slate-100 focus:border-indigo-500'
                    : 'bg-slate-50 border-slate-300 text-slate-800 focus:border-indigo-600'
                }`}
              >
                <option value="Technology & Dev">Technology & Dev 💻</option>
                <option value="Artificial Intelligence">Artificial Intelligence 🤖</option>
                <option value="Content Creation">Content Creation 📱</option>
                <option value="Design & UX">Design & UX 🎨</option>
                <option value="Live Meeting Club">Live Meeting Club 🎥</option>
                <option value="General Community">General Community 🌐</option>
              </select>
            </div>

            <div>
              <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Privacy Level</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPrivacy('public')}
                  className={`flex-1 py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    privacy === 'public'
                      ? isDark
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-xs'
                        : 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-xs'
                      : isDark
                        ? 'bg-[#1E293B] border-slate-700 text-slate-400 hover:text-slate-200'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Public</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrivacy('private')}
                  className={`flex-1 py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    privacy === 'private'
                      ? isDark
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-xs'
                        : 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-xs'
                      : isDark
                        ? 'bg-[#1E293B] border-slate-700 text-slate-400 hover:text-slate-200'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Private</span>
                </button>
              </div>
            </div>
          </div>

          {/* Member Approval Setting */}
          <div className={`p-3 rounded-xl border flex items-center justify-between ${
            isDark ? 'bg-[#1E293B] border-slate-700/60' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
              <div>
                <p className={`text-xs font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Admin Approval Required</p>
                <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>New join requests must be approved by admin</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={requiresApproval}
                onChange={(e) => setRequiresApproval(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600" />
            </label>
          </div>

          {/* Cover Photo Preset */}
          <div>
            <label className={`block text-xs font-bold mb-1.5 flex items-center gap-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <ImageIcon className={`w-3.5 h-3.5 ${isDark ? 'text-indigo-400' : 'text-slate-500'}`} />
              Group Cover Image
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {coverPresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setSelectedCover(preset.url)}
                  className={`relative rounded-xl overflow-hidden h-16 border-2 transition cursor-pointer text-left ${
                    selectedCover === preset.url
                      ? 'border-indigo-500 ring-2 ring-indigo-500/40'
                      : isDark ? 'border-slate-700 opacity-80 hover:opacity-100' : 'border-transparent opacity-80 hover:opacity-100'
                  }`}
                >
                  <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                  <span className="absolute inset-x-0 bottom-0 bg-slate-950/70 text-white text-[10px] font-bold px-1.5 py-0.5 truncate">
                    {preset.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Optional Linked Live Room */}
          <div>
            <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Link Live Meeting Room (Optional)
            </label>
            <select
              value={linkedMeetingToken}
              onChange={(e) => setLinkedMeetingToken(e.target.value)}
              className={`w-full px-3 py-2 text-xs rounded-xl border font-medium focus:outline-none transition ${
                isDark
                  ? 'bg-[#1E293B] border-slate-700 text-slate-100 focus:border-indigo-500'
                  : 'bg-slate-50 border-slate-300 text-slate-800 focus:border-indigo-600'
              }`}
            >
              <option value="none">No Meeting Linked (Standalone Group)</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.token}>
                  {r.token} - {r.title}
                </option>
              ))}
            </select>
          </div>

          {/* Group Chat Theme */}
          <div>
            <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Group Chat Theme
            </label>
            <div className="flex gap-2">
              {[
                { id: 'ocean', label: 'Indigo Slate', color: 'bg-indigo-600' },
                { id: 'berry', label: 'Berry', color: 'bg-rose-500' },
                { id: 'sunset', label: 'Sunset', color: 'bg-amber-500' },
                { id: 'emerald', label: 'Emerald', color: 'bg-emerald-600' },
              ].map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setChatTheme(theme.id as any)}
                  className={`flex-1 py-1.5 px-2 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    chatTheme === theme.id
                      ? isDark
                        ? 'border-indigo-500 bg-indigo-600/20 text-indigo-300 font-bold'
                        : 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold'
                      : isDark
                        ? 'border-slate-700 text-slate-400 hover:text-slate-200'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <span className={`w-3 h-3 rounded-full ${theme.color}`} />
                  <span>{theme.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Footer Submit */}
          <div className={`pt-2 flex items-center justify-end gap-2 border-t ${
            isDark ? 'border-slate-800' : 'border-slate-100'
          }`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition cursor-pointer ${
                isDark
                  ? 'text-slate-400 hover:text-white hover:bg-[#1E293B]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-95 disabled:opacity-50 rounded-xl transition shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Create Group</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
