import React from 'react';
import { Home, Flame, Video, Layers, MessageSquare, Settings, User } from 'lucide-react';
import { TabType } from '../types';

interface BottomNavBarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  unreadChatsCount?: number;
  userAvatar?: string;
  themeMode?: 'dark' | 'light';
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  currentTab,
  onSelectTab,
  unreadChatsCount = 0,
  userAvatar,
  themeMode = 'dark',
}) => {
  const isDark = themeMode !== 'light';
  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    {
      id: 'home',
      label: 'Home',
      icon: <Home className="w-5 h-5" />,
    },
    {
      id: 'shorts',
      label: 'Shorts',
      icon: <Flame className="w-5 h-5" />,
    },
    {
      id: 'meetings',
      label: 'Meetings',
      icon: <Video className="w-5 h-5" />,
    },
    {
      id: 'posts',
      label: 'Posts',
      icon: <Layers className="w-5 h-5" />,
    },
    {
      id: 'chat',
      label: 'Chat',
      icon: <MessageSquare className="w-5 h-5" />,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-5 h-5" />,
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: userAvatar ? (
        <div className="w-5 h-5 rounded-full overflow-hidden border border-current">
          <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" />
        </div>
      ) : (
        <User className="w-5 h-5" />
      ),
    },
  ];

  return (
    <nav
      id="main-bottom-navigation"
      className={`shrink-0 w-full px-1 sm:px-4 py-1.5 z-40 select-none transition-colors duration-300 ${
        isDark
          ? 'bg-[#0B0F19]/95 border-t border-white/10 shadow-[0_-6px_25px_rgba(0,0,0,0.5)] backdrop-blur-xl text-slate-400'
          : 'bg-white/95 border-t border-white/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] backdrop-blur-xl text-slate-500'
      }`}
    >
      <div className="max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto flex items-center justify-around w-full">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`flex-1 max-w-[90px] flex flex-col items-center justify-center py-1 transition-all relative cursor-pointer active:scale-95 ${
                isActive
                  ? isDark
                    ? 'text-indigo-300 font-bold drop-shadow-[0_2px_10px_rgba(99,102,241,0.5)]'
                    : 'text-indigo-600 font-bold drop-shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className={`relative p-1 rounded-xl transition-all ${
                isActive
                  ? isDark
                    ? 'bg-gradient-to-b from-[#1C2740] to-[#121B2E] border-t border-white/20 border-b border-black/60 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_2px_6px_rgba(0,0,0,0.4)]'
                    : 'bg-gradient-to-b from-indigo-50 to-indigo-100/60 border-t border-white border-b border-indigo-200 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_2px_4px_rgba(0,0,0,0.05)]'
                  : ''
              }`}>
                {tab.icon}
                {tab.id === 'chat' && unreadChatsCount > 0 && (
                  <span className="absolute -top-1 -right-2 px-1 rounded-full bg-indigo-600 text-white text-[9px] font-bold shadow-xs">
                    {unreadChatsCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] sm:text-[11px] mt-0.5 tracking-tight truncate">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
