import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Home, CalendarHeart, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import clsx from 'clsx';

export function Sidebar() {
  const navigate = useNavigate();
  const { user, clearUser } = useAuthStore();
  const [showSignOut, setShowSignOut] = useState(false);

  const navLinks = [
    { to: '/events', icon: Home, label: 'My Events' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-60 bg-white border-r border-gray-200 h-screen sticky top-0">
      <div className="flex items-center gap-2 px-5 py-5 border-b border-gray-100">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <CalendarHeart className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-gray-900">InviteTracker</span>
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
        <p className="text-xs text-gray-500 mb-1">Signed in as</p>
        <p className="text-sm font-medium text-gray-800 mb-3 truncate">{user?.displayName}</p>
        <button
          onClick={() => setShowSignOut(true)}
          className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 font-medium"
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
    </aside>
  );
}
