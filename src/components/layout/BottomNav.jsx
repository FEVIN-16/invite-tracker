import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Home, MoreHorizontal, LogOut, Users, ChevronUp } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { googleAuth } from '../../services/googleAuth';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { SyncStatusBadge } from '../ui/SyncStatusBadge';
import { NavDropdown } from './NavDropdown';
import clsx from 'clsx';

export function BottomNav() {
  const navigate = useNavigate();
  const { clearUser, user } = useAuthStore();
  const location = useLocation();
  const [showSignOut, setShowSignOut] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null); // 'people' | 'events' | null

  const tabs = [
    { id: 'people', to: '/people', icon: Users, label: 'People' },
    { id: 'events', to: '/events', icon: Home, label: 'My Events' },
  ];

  const handleSignOut = () => {
    googleAuth.signOut();
    clearUser();
    navigate('/login');
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex z-40 md:hidden transition-colors">
        {tabs.map(tab => {
          const isActive = location.pathname.startsWith(tab.to);
          const isOpen = openDropdown === tab.id;

          return (
            <div 
              key={tab.id}
              className={clsx(
                'flex-1 flex items-stretch transition-colors relative border-r border-gray-100 dark:border-gray-800/50',
                isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'
              )}
            >
              <NavLink
                to={tab.to}
                className="flex-1 flex flex-col items-center justify-center py-3 gap-0.5 text-[10px] font-black uppercase tracking-widest"
              >
                <tab.icon className="w-5 h-5" />
                <span className="truncate max-w-[60px]">{tab.label}</span>
              </NavLink>
              
              <button
                onClick={() => setOpenDropdown(isOpen ? null : tab.id)}
                className={clsx(
                  "px-2 flex items-center justify-center transition-colors",
                  isOpen ? "bg-indigo-50 dark:bg-indigo-900/20" : ""
                )}
              >
                <ChevronUp className={clsx(
                  "w-4 h-4 transition-transform duration-300",
                  isOpen ? "rotate-180" : "rotate-0"
                )} />
              </button>

              {(isActive) && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-b-full" />
              )}
            </div>
          );
        })}
        <button
          onClick={() => setShowMore(true)}
          className="flex-1 flex flex-col items-center justify-center py-3 gap-0.5 text-xs font-bold text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <MoreHorizontal className="w-5 h-5" />
          <span>More</span>
        </button>
      </nav>

      {showMore && (
        <div className="fixed inset-0 z-50 flex items-end md:hidden" onClick={() => setShowMore(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" />
          <div className="relative w-full bg-white dark:bg-gray-900 rounded-t-2xl p-6 shadow-2xl border-t border-gray-100 dark:border-gray-800" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-200 dark:bg-gray-800 rounded mx-auto mb-6" />
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-indigo-500/20 shadow-sm relative shrink-0">
                {user?.picture ? (
                  <img src={user.picture} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-white font-black uppercase text-sm">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest mb-1">Signed in as</p>
                <p className="font-black text-gray-900 dark:text-white text-lg truncate leading-tight">{user?.name}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 font-medium truncate">{user?.email}</p>
              </div>
            </div>

            <div className="mb-6 p-1 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <SyncStatusBadge collapsed={false} />
            </div>

            <button
              className="w-full text-left font-black text-sm text-red-500 dark:text-red-400 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center gap-3 transition-colors hover:text-red-600 dark:hover:text-red-300"
              onClick={() => { setShowMore(false); setShowSignOut(true); }}
            >
              <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                <LogOut className="w-4 h-4" />
              </div>
              Sign Out
            </button>
          </div>
        </div>
      )}

      <NavDropdown 
        type="people"
        isOpen={openDropdown === 'people'}
        onClose={() => setOpenDropdown(null)}
        userId={user?.id}
        title="People Groups"
        placement="bottom-sheet"
      />

      <NavDropdown 
        type="events"
        isOpen={openDropdown === 'events'}
        onClose={() => setOpenDropdown(null)}
        userId={user?.id}
        title="Event Dashboards"
        placement="bottom-sheet"
      />

      <ConfirmDialog
        isOpen={showSignOut}
        onClose={() => setShowSignOut(false)}
        onConfirm={handleSignOut}
        title="Sign Out"
        message="Sign out from Google? Your data will remain on this device."
        confirmLabel="Sign Out"
      />
    </>
  );
}
