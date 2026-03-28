import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Home, CalendarHeart, LogOut, Users, Edit2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { ProfileEditModal } from './ProfileEditModal';
import clsx from 'clsx';

export function Sidebar() {
  const navigate = useNavigate();
  const { user, clearUser } = useAuthStore();
  const [showSignOut, setShowSignOut] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const navLinks = [
    { to: '/people', icon: Users, label: 'People' },
    { to: '/events', icon: Home, label: 'My Events' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-60 bg-white border-r border-gray-200 h-screen sticky top-0 z-20">
      <div className="flex items-center gap-2 px-5 py-5 border-b border-gray-100">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <CalendarHeart className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-gray-900">InviteTracker</span>
      </div>

      {/* Centered User Profile Section */}
      <div className="px-5 py-8 flex flex-col items-center text-center border-b border-gray-100 relative group/profile">
        <button 
          onClick={() => setIsEditModalOpen(true)}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-indigo-600 hover:bg-gray-50 rounded-lg transition-all opacity-0 group-hover/profile:opacity-100"
        >
          <Edit2 className="w-4 h-4" />
        </button>

        <div className="relative mb-4 group-hover/profile:scale-105 transition-transform duration-300">
          <div className="relative w-20 h-20 rounded-full bg-indigo-600 border-4 border-white flex items-center justify-center text-white font-black text-2xl uppercase select-none">
            {user?.displayName?.charAt(0) || 'U'}
          </div>
        </div>

        <div className="min-w-0 px-2">
          <h2 className="text-lg font-black text-gray-900 truncate leading-tight mb-0.5">{user?.displayName}</h2>
          <p className="text-[10px] font-bold text-gray-400 tracking-widest truncate">@{user?.username}</p>
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
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )
            }
          >
            <link.icon className="w-4 h-4 flex-shrink-0" />
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-gray-100">
        <button
          onClick={() => setShowSignOut(true)}
          className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 font-bold transition-colors w-full px-1"
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
