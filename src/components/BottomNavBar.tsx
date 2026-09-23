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
      className={`shrink-0 w-full px-1 sm:px-4 py-1.5 z-40 select-none shadow-xs transition-colors duration-300 ${
        isDark
          ? 'bg-[#090414]/95 border-t border-purple-500/20 backdrop-blur-xl text-slate-400'
          : 'bg-white border-t border-neutral-200 text-neutral-500'
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
              className={`flex-1 max-w-[90px] flex flex-col items-center justify-center py-1 transition-all relative cursor-pointer ${
                isActive
                  ? isDark
                    ? 'text-purple-300 font-bold drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]'
                    : 'text-purple-600 font-bold'
                  : isDark
                  ? 'text-slate-400 hover:text-purple-200'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <div className="relative">
                {tab.icon}
                {tab.id === 'chat' && unreadChatsCount > 0 && (
                  <span className="absolute -top-1 -right-2 px-1 rounded-full bg-purple-600 text-white text-[9px] font-bold">
                    {unreadChatsCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] sm:text-[11px] mt-1 tracking-tight truncate">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
