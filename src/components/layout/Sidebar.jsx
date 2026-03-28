import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Home, CalendarHeart, LogOut, Users, Edit2, Moon, Sun } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { ProfileEditModal } from './ProfileEditModal';
import clsx from 'clsx';

export function Sidebar() {
  const navigate = useNavigate();
  const { user, clearUser } = useAuthStore();
  const { theme, toggleTheme } = useUIStore();
  const [showSignOut, setShowSignOut] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const navLinks = [
    { to: '/people', icon: Users, label: 'People' },
    { to: '/events', icon: Home, label: 'My Events' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-60 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 h-screen sticky top-0 z-20 transition-colors">
      <div className="flex items-center gap-2 px-5 py-5 border-b border-gray-100 dark:border-gray-800">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <CalendarHeart className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-gray-900 dark:text-white">InviteTracker</span>
      </div>

      {/* Centered User Profile Section */}
      <div className="px-5 py-8 flex flex-col items-center text-center border-b border-gray-100 dark:border-gray-800 relative group/profile">
        <div className="absolute top-4 right-4 flex flex-col gap-1">
          <button 
            onClick={() => setIsEditModalOpen(true)}
            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all opacity-0 group-hover/profile:opacity-100"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button 
            onClick={toggleTheme}
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all"
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
        </div>

        <div className="relative mb-4 group-hover/profile:scale-105 transition-transform duration-300">
          <div className="relative w-20 h-20 rounded-full bg-indigo-600 border-4 border-white dark:border-gray-800 flex items-center justify-center text-white font-black text-2xl uppercase select-none shadow-sm">
            {user?.displayName?.charAt(0) || 'U'}
          </div>
        </div>

        <div className="min-w-0 px-2">
          <h2 className="text-lg font-black text-gray-900 dark:text-white truncate leading-tight mb-0.5">{user?.displayName}</h2>
          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 tracking-widest truncate">@{user?.username}</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
        {navLinks.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.exact}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
              )
            }
          >
            <link.icon className="w-4 h-4 flex-shrink-0" />
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-gray-100 dark:border-gray-800">
        <button
          onClick={() => setShowSignOut(true)}
          className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-bold transition-colors w-full px-1"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>

      <ConfirmDialog
        isOpen={showSignOut}
        onClose={() => setShowSignOut(false)}
        onConfirm={() => { clearUser(); navigate('/login'); }}
        title="Sign Out"
        message="Sign out? Your data will remain on this device."
        confirmLabel="Sign Out"
      />

      <ProfileEditModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
      />
    </aside>
  );
}
