import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Home, MoreHorizontal, LogOut, CalendarHeart, Users } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import clsx from 'clsx';

export function BottomNav() {
  const navigate = useNavigate();
  const { clearUser, user } = useAuthStore();
  const [showSignOut, setShowSignOut] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const tabs = [
    { to: '/people', icon: Users, label: 'People' },
    { to: '/events', icon: Home, label: 'My Events' },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-40 md:hidden">
        {tabs.map(tab => (
          <NavLink
            key={tab.label}
            to={tab.to}
            end
            className={({ isActive }) =>
              clsx(
                'flex-1 flex flex-col items-center justify-center py-3 gap-0.5 text-xs font-bold transition-colors',
                isActive ? 'text-indigo-600' : 'text-gray-400'
              )
            }
          >
            <tab.icon className="w-5 h-5" />
            <span>{tab.label}</span>
          </NavLink>
        ))}
        <button
          onClick={() => setShowMore(true)}
          className="flex-1 flex flex-col items-center justify-center py-3 gap-0.5 text-xs font-bold text-gray-400"
        >
          <MoreHorizontal className="w-5 h-5" />
          <span>More</span>
        </button>
      </nav>

      {showMore && (
        <div className="fixed inset-0 z-50 flex items-end md:hidden" onClick={() => setShowMore(false)}>
          <div className="w-full bg-white rounded-t-2xl p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-200 rounded mx-auto mb-4" />
            <div className="mb-4">
              <p className="text-xs text-gray-400 font-medium">Signed in as</p>
              <p className="font-bold text-gray-800">{user?.displayName}</p>
            </div>
            <button
              className="w-full text-left text-sm text-red-500 font-bold py-3 border-t border-gray-100 flex items-center gap-2"
              onClick={() => { setShowMore(false); setShowSignOut(true); }}
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showSignOut}
        onClose={() => setShowSignOut(false)}
        onConfirm={() => { clearUser(); navigate('/login'); }}
        title="Sign Out"
        message="Sign out? Your data will remain on this device."
        confirmLabel="Sign Out"
      />
    </>
  );
}
