import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Moon, Sun } from 'lucide-react';
import { useEventStore } from '../../store/eventStore';
import { useUIStore } from '../../store/uiStore';

const routeTitles = {
  '/events': 'My Events',
  '/events/new': 'New Event',
};

function getTitle(pathname, currentEvent, currentCategory) {
  if (routeTitles[pathname]) return routeTitles[pathname];
  if (pathname.includes('/dashboard')) return currentEvent?.title || 'Dashboard';
  if (pathname.includes('/categories') && pathname.includes('/config')) return 'Configure Columns';
  if (pathname.includes('/categories') && pathname.includes('/people')) return currentCategory?.name || 'People';
  if (pathname.includes('/categories')) return 'Categories';
  if (pathname.includes('/edit')) return 'Edit Event';
  return 'InviteTracker';
}

export function TopNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentEvent, currentCategory } = useEventStore();
  const { theme, toggleTheme } = useUIStore();
  const canGoBack = location.pathname !== '/events';
  const title = getTitle(location.pathname, currentEvent, currentCategory);

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30 md:hidden transition-colors">
      <div className="flex items-center h-14 px-3">
        {canGoBack ? (
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
            <ChevronLeft className="w-5 h-5" />
          </button>
        ) : (
          <div className="w-9" />
        )}
        <h1 className="flex-1 text-center text-base font-bold text-gray-900 dark:text-white truncate px-2">{title}</h1>
        <div className="w-9 flex justify-end">
          <button onClick={toggleTheme} className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </header>
  );
}
