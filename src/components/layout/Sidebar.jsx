import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Home, CalendarHeart, LogOut, Users, Settings, Moon, Sun, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { ProfileEditModal } from './ProfileEditModal';
import { Tooltip } from '../ui/Tooltip';
import clsx from 'clsx';

export function Sidebar() {
  const navigate = useNavigate();
  const { user, clearUser } = useAuthStore();
  const { theme, toggleTheme, isSidebarCollapsed, toggleSidebar } = useUIStore();
  const [showSignOut, setShowSignOut] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const navLinks = [
    { to: '/people', icon: Users, label: 'People' },
    { to: '/events', icon: Home, label: 'My Events' },
  ];

  return (
    <aside className={clsx(
      "hidden md:flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 h-screen sticky top-0 z-20 transition-all duration-300 ease-in-out group/sidebar",
      isSidebarCollapsed ? "w-20" : "w-64"
    )}>
      {/* Header */}
      <div className={clsx(
        "flex items-center px-5 py-5 border-b border-gray-100 dark:border-gray-800 min-h-[73px] transition-all",
        isSidebarCollapsed ? "justify-center" : "justify-between"
      )}>
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/20">
            <CalendarHeart className="w-5 h-5 text-white" />
          </div>
          {!isSidebarCollapsed && (
            <span className="font-bold text-gray-900 dark:text-white truncate">InviteTracker</span>
          )}
        </div>
        
        {!isSidebarCollapsed && (
          <button 
            onClick={toggleTheme}
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all ml-1"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
        )}
      </div>



      {/* Centered User Profile Section */}
      <div className={clsx(
        "py-5 flex flex-col items-center text-center border-b border-gray-100 dark:border-gray-800 relative group/profile transition-all",
        isSidebarCollapsed ? "px-2" : "px-5"
      )}>
          <div className={clsx(
            "absolute top-4 transition-all flex flex-col gap-1 z-30",
            isSidebarCollapsed ? "left-0 right-0 items-center" : "right-4"
          )}>
            <Tooltip content={isSidebarCollapsed ? 'Expand Sidebar' : ''} position={isSidebarCollapsed ? 'right' : 'left'}>
              <button
                onClick={toggleSidebar}
                className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all"
              >
                {isSidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
              </button>
            </Tooltip>
          </div>

          <div className={clsx(
            "relative mb-3 group-hover/profile:scale-105 transition-transform duration-300",
            isSidebarCollapsed ? "mt-11" : "mt-0"
          )}>
            <div className={clsx(
              "relative rounded-full bg-indigo-600 border-4 border-white dark:border-gray-800 flex items-center justify-center text-white font-black uppercase select-none shadow-sm transition-all",
              isSidebarCollapsed ? "w-10 h-10 text-xs" : "w-16 h-16 text-xl"
            )}>
              {user?.displayName?.charAt(0) || 'U'}
            </div>
          </div>

          {!isSidebarCollapsed && (
            <div className="min-w-0 px-2">
              <h2 className="text-base font-black text-gray-900 dark:text-white truncate leading-tight mb-0.5">{user?.displayName}</h2>
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 tracking-widest truncate uppercase">@{user?.username}</p>
            </div>
          )}

          <div className={clsx(
            "w-full flex justify-center transition-all",
            isSidebarCollapsed ? "mt-1" : "mt-3"
          )}>
            <Tooltip content={isSidebarCollapsed ? 'Edit Profile' : ''} position={isSidebarCollapsed ? 'right' : 'bottom'}>
              <button 
                onClick={() => setIsEditModalOpen(true)}
                className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all"
              >
                <Settings className="w-5 h-5 transition-all" />
              </button>
            </Tooltip>
          </div>
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto overflow-x-hidden">
        {navLinks.map(link => (
          <Tooltip 
            key={link.to} 
            content={isSidebarCollapsed ? link.label : ''} 
            position="right"
            className="w-full"
          >
            <NavLink
              to={link.to}
              end={link.exact}
              className={({ isActive }) =>
                clsx(
                  'flex items-center rounded-lg text-sm font-medium transition-all duration-200 overflow-hidden w-full',
                  isSidebarCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2",
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                )
              }
            >
              <link.icon className={clsx("flex-shrink-0 transition-all", isSidebarCollapsed ? "w-5 h-5" : "w-4 h-4")} />
              {!isSidebarCollapsed && (
                <span className="truncate transition-opacity duration-300">{link.label}</span>
              )}
            </NavLink>
          </Tooltip>
        ))}
      </nav>

      <div className={clsx(
        "py-4 border-t border-gray-100 dark:border-gray-800 transition-all",
        isSidebarCollapsed ? "px-2" : "px-4"
      )}>
        <Tooltip content={isSidebarCollapsed ? 'Sign Out' : ''} position="right" className="w-full">
          <button
            onClick={() => setShowSignOut(true)}
            className={clsx(
              "flex items-center text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-bold transition-all w-full",
              isSidebarCollapsed ? "justify-center p-2.5" : "gap-2 px-1"
            )}
          >
            <LogOut className={clsx("flex-shrink-0 transition-all", isSidebarCollapsed ? "w-5 h-5" : "w-4 h-4")} />
            {!isSidebarCollapsed && <span className="text-sm">Sign Out</span>}
          </button>
        </Tooltip>
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
