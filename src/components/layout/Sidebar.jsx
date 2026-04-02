import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useState, useRef } from 'react';
import { Home, CalendarHeart, LogOut, Users, ChevronLeft, ChevronRight, Cloud, Moon, Sun, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { googleAuth } from '../../services/googleAuth';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { SyncStatusBadge } from '../ui/SyncStatusBadge';
import { Tooltip } from '../ui/Tooltip';
import { NavDropdown } from './NavDropdown';
import clsx from 'clsx';

export function Sidebar() {
  const navigate = useNavigate();
  const { user, clearUser } = useAuthStore();
  const { theme, toggleTheme, isSidebarCollapsed, toggleSidebar } = useUIStore();
  const location = useLocation();
  const [showSignOut, setShowSignOut] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null); // 'people' | 'events' | null
  const peopleRef = useRef(null);
  const eventsRef = useRef(null);

  const navLinks = [
    { id: 'people', to: '/people', icon: Users, label: 'People', ref: peopleRef },
    { id: 'events', to: '/events', icon: Home, label: 'My Events', ref: eventsRef },
  ];

  const handleSignOut = () => {
    googleAuth.signOut();
    clearUser();
    navigate('/login');
  };

  return (
    <aside className={clsx(
      "hidden md:flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 h-full sticky top-0 z-20 transition-all duration-300 ease-in-out group/sidebar",
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
            <span className="font-bold text-gray-900 dark:text-white truncate uppercase tracking-tight">InviteTracker</span>
          )}
        </div>

        {!isSidebarCollapsed && (
          <button
            onClick={toggleTheme}
            className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all"
            title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4" fill="currentColor" fillOpacity={0.1} />
            ) : (
              <Sun className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* Google User Profile Section */}
      <div className={clsx(
        "py-6 flex flex-col items-center text-center border-b border-gray-100 dark:border-gray-800 relative group/profile transition-all",
        isSidebarCollapsed ? "px-2" : "px-5"
      )}>
          <div className={clsx(
            "absolute top-4 transition-all flex flex-col gap-1 z-30",
            isSidebarCollapsed ? "left-0 right-0 items-center" : "right-4"
          )}>
            <Tooltip content={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse'} position={isSidebarCollapsed ? 'right' : 'left'}>
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
            {user?.picture ? (
              <img 
                src={user.picture} 
                alt={user.name}
                className={clsx(
                  "rounded-full border-4 border-white dark:border-gray-800 shadow-sm object-cover",
                  isSidebarCollapsed ? "w-10 h-10" : "w-16 h-16"
                )}
              />
            ) : (
              <div className={clsx(
                "relative rounded-full bg-indigo-600 border-4 border-white dark:border-gray-800 flex items-center justify-center text-white font-black uppercase shadow-sm",
                isSidebarCollapsed ? "w-10 h-10 text-xs" : "w-16 h-16 text-xl"
              )}>
                {user?.name?.charAt(0) || 'U'}
              </div>
            )}
          </div>

          {!isSidebarCollapsed && (
            <div className="min-w-0 px-2">
              <h2 className="text-sm font-black text-gray-900 dark:text-white truncate leading-tight mb-0.5">{user?.name}</h2>
              <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 tracking-tight truncate">{user?.email}</p>
            </div>
          )}

          {/* Sync Status Badge */}
          <SyncStatusBadge 
            collapsed={isSidebarCollapsed} 
            className="mt-3" 
          />
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto overflow-x-hidden">
        {navLinks.map(link => {
          const isActive = location.pathname.startsWith(link.to);
          const isOpen = openDropdown === link.id;

          return (
            <div 
              key={link.id} 
              className={clsx(
                "flex items-center rounded-xl transition-all duration-200 overflow-hidden w-full relative group",
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-indigo-600 dark:hover:text-indigo-400'
              )}
            >
              <Tooltip 
                content={isSidebarCollapsed ? link.label : ''} 
                position="right"
                className="flex-1"
              >
                <NavLink
                  to={link.to}
                  className={clsx(
                    'flex items-center gap-3 text-xs font-black uppercase tracking-widest transition-all duration-200 flex-1',
                    isSidebarCollapsed ? "justify-center p-3" : "px-4 py-3",
                  )}
                >
                  <link.icon className={clsx("flex-shrink-0 transition-all", isSidebarCollapsed ? "w-5 h-5" : "w-4 h-4")} />
                  {!isSidebarCollapsed && (
                    <span className="flex-1 text-left truncate transition-opacity duration-300">{link.label}</span>
                  )}
                </NavLink>
              </Tooltip>

              {!isSidebarCollapsed && (
                <button
                  ref={link.ref}
                  onClick={(e) => {
                    e.preventDefault();
                    setOpenDropdown(isOpen ? null : link.id);
                  }}
                  className={clsx(
                    "p-3 hover:bg-white/10 dark:hover:bg-white/5 transition-colors border-l border-white/10",
                    isOpen ? "bg-white/10" : ""
                  )}
                >
                  <ChevronDown className={clsx(
                    "w-3.5 h-3.5 transition-transform duration-300 opacity-60 group-hover:opacity-100",
                    isOpen ? "rotate-180" : "rotate-0"
                  )} />
                </button>
              )}

              {isSidebarCollapsed && (
                <button
                  ref={link.ref}
                  onClick={(e) => {
                    e.preventDefault();
                    setOpenDropdown(isOpen ? null : link.id);
                  }}
                  className="absolute inset-y-0 right-0 w-2 hover:bg-white/10 transition-colors"
                />
              )}

              {(isActive) && (
                <div className="absolute left-0 top-2 bottom-2 w-1 bg-white rounded-r-full" />
              )}
            </div>
          );
        })}
      </nav>

      <NavDropdown 
        type="people"
        isOpen={openDropdown === 'people'}
        onClose={() => setOpenDropdown(null)}
        anchorRef={peopleRef}
        userId={user?.id}
        title="People Groups"
      />

      <NavDropdown 
        type="events"
        isOpen={openDropdown === 'events'}
        onClose={() => setOpenDropdown(null)}
        anchorRef={eventsRef}
        userId={user?.id}
        title="Event Dashboards"
      />

      <div className={clsx(
        "py-4 border-t border-gray-100 dark:border-gray-800 transition-all flex flex-col items-center gap-2",
        isSidebarCollapsed ? "px-2" : "px-4"
      )}>
        {isSidebarCollapsed && (
          <Tooltip content={theme === 'light' ? 'Dark Mode' : 'Light Mode'} position="right">
            <button
              onClick={toggleTheme}
              className="p-3 text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-all"
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5" fill="currentColor" fillOpacity={0.1} />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </button>
          </Tooltip>
        )}
        
        <Tooltip content={isSidebarCollapsed ? 'Sign Out' : ''} position="right" className="w-full">
          <button
            onClick={() => setShowSignOut(true)}
            className={clsx(
              "flex items-center text-gray-400 hover:text-red-500 transition-all w-full",
              isSidebarCollapsed ? "justify-center p-3" : "gap-3 px-4 py-3"
            )}
          >
            <LogOut className={clsx("flex-shrink-0 transition-all", isSidebarCollapsed ? "w-5 h-5" : "w-4 h-4")} />
            {!isSidebarCollapsed && <span className="text-xs font-black uppercase tracking-widest">Sign Out</span>}
          </button>
        </Tooltip>
      </div>

      <ConfirmDialog
        isOpen={showSignOut}
        onClose={() => setShowSignOut(false)}
        onConfirm={handleSignOut}
        title="Sign Out?"
        message="Are you sure you want to sign out from your Google account? Your local data will be preserved."
        confirmLabel="Yes, Sign Out"
      />
    </aside>
  );
}
