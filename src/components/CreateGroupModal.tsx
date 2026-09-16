import React, { useState } from 'react';
import { FacebookGroup, MeetingRoom, UserProfile } from '../types';
import { X, Users, Globe, Lock, ShieldCheck, Sparkles, Image as ImageIcon } from 'lucide-react';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserProfile;
  rooms?: MeetingRoom[];
  onCreateGroup: (groupData: Omit<FacebookGroup, 'id' | 'createdAt' | 'members' | 'pendingRequests' | 'admin'>) => void;
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
}) => {
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">Create Group</h2>
              <p className="text-xs text-neutral-500">Connect with posts, discussions & group chat</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-neutral-100 text-neutral-500 hover:text-neutral-800 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Group Name */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              Group Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Myanmar WebRTC Developers 🚀"
              className="w-full px-3.5 py-2.5 text-sm bg-neutral-50 border border-neutral-300 rounded-xl text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-blue-500 focus:bg-white transition"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              About this Group
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the purpose, topics, and community rules..."
              className="w-full px-3.5 py-2 text-sm bg-neutral-50 border border-neutral-300 rounded-xl text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-blue-500 focus:bg-white transition resize-none"
            />
          </div>

          {/* Category & Privacy Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-xl text-neutral-800 font-medium focus:outline-none focus:border-blue-500"
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
              <label className="block text-xs font-bold text-neutral-700 mb-1">Privacy Level</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPrivacy('public')}
                  className={`flex-1 py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    privacy === 'public'
                      ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-2xs'
                      : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100'
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
                      ? 'bg-purple-50 border-purple-300 text-purple-700 shadow-2xs'
                      : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Private</span>
                </button>
              </div>
            </div>
          </div>

          {/* Member Approval Setting */}
          <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-neutral-900">Admin Approval Required</p>
                <p className="text-[11px] text-neutral-500">New join requests must be approved by admin</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={requiresApproval}
                onChange={(e) => setRequiresApproval(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
            </label>
          </div>

          {/* Cover Photo Preset */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1.5 flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5 text-neutral-500" />
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
                      ? 'border-blue-600 ring-2 ring-blue-300'
                      : 'border-transparent opacity-80 hover:opacity-100'
                  }`}
                >
                  <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                  <span className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 truncate">
                    {preset.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Optional Linked Live Room */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              Link Live Meeting Room (Optional)
            </label>
            <select
              value={linkedMeetingToken}
              onChange={(e) => setLinkedMeetingToken(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-xl text-neutral-800 font-medium focus:outline-none focus:border-blue-500"
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
            <label className="block text-xs font-bold text-neutral-700 mb-1.5">
              Group Chat Theme
            </label>
            <div className="flex gap-2">
              {[
                { id: 'ocean', label: 'Ocean', color: 'bg-blue-600' },
                { id: 'berry', label: 'Berry', color: 'bg-purple-600' },
                { id: 'sunset', label: 'Sunset', color: 'bg-orange-500' },
                { id: 'emerald', label: 'Emerald', color: 'bg-emerald-600' },
              ].map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setChatTheme(theme.id as any)}
                  className={`flex-1 py-1.5 px-2 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    chatTheme === theme.id
                      ? 'border-neutral-900 bg-neutral-100 font-bold'
                      : 'border-neutral-200 hover:bg-neutral-50 text-neutral-600'
                  }`}
                >
                  <span className={`w-3 h-3 rounded-full ${theme.color}`} />
                  <span>{theme.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 rounded-xl hover:bg-neutral-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-5 py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-xl transition shadow-md shadow-purple-200 cursor-pointer flex items-center gap-1.5"
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
