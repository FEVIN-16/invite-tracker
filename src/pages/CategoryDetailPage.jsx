import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, Settings2, ChevronRight, Home, Calendar, ChevronUp, ChevronDown, BarChart2 } from 'lucide-react';
import { getCategoryById } from '../db/categoriesDb';
import { getEventById } from '../db/eventsDb';
import { getPeopleByCategory } from '../db/peopleDb';
import { useEventStore } from '../store/eventStore';
import { useUIStore } from '../store/uiStore';
import { Spinner } from '../components/ui/Spinner';
import { PeopleListTab } from '../components/categoryDetail/PeopleListTab';
import { ColumnConfigTab } from '../components/categoryDetail/ColumnConfigTab';
import { CategoryDashboardTab } from '../components/categoryDetail/CategoryDashboardTab';
import { Tooltip } from '../components/ui/Tooltip';
import clsx from 'clsx';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
  { id: 'people', label: 'Invite List', icon: Users },
  { id: 'config', label: 'Field Configuration', icon: Settings2 },
];

export default function CategoryDetailPage() {
  const { eventId, categoryId } = useParams();
  const navigate = useNavigate();
  const { addToast, isToolbarVisible, setIsToolbarVisible } = useUIStore();
  const { setCurrentEvent, setCurrentCategory } = useEventStore();

  const [activeTab, setActiveTab] = useState('people');
  const [event, setEvent] = useState(null);
  const [category, setCategory] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [ev, cat] = await Promise.all([getEventById(eventId), getCategoryById(categoryId)]);
        if (!ev || !cat) {
          addToast('Category not found', 'warning');
          navigate(`/events/${eventId}/categories`);
          return;
        }
        const people = await getPeopleByCategory(categoryId);
        setEvent(ev);
        setCategory({ ...cat, peopleCount: people.length });
        setCurrentEvent(ev);
        setCurrentCategory(cat);
      } catch {
        addToast('Error loading category data', 'error');
        navigate(`/events/${eventId}/categories`);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [eventId, categoryId]);

  if (isLoading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white dark:bg-gray-950 transition-colors">
      {/* Header & Tabs */}
      <div className="px-4 md:px-6 pt-4 md:pt-6 bg-white dark:bg-gray-950 sticky top-0 z-30 border-b border-transparent dark:border-gray-900 shadow-sm dark:shadow-none">
        {/* Breadcrumb */}
        <div className="hidden sm:flex items-center gap-1.5 text-[10px] md:text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4 md:mb-6">
          <button onClick={() => navigate('/events')} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1">
            <Tooltip content="All Events" position="bottom">
              <Home className="w-3 h-3" />
            </Tooltip> 
            Events
          </button>
          <ChevronRight className="w-3 h-3 text-gray-300 dark:text-gray-700" />
          <button onClick={() => navigate(`/events/${eventId}/categories`)} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate max-w-[100px] md:max-w-none">
            {event?.title}
          </button>
          <ChevronRight className="w-3 h-3 text-gray-300 dark:text-gray-700" />
          <span className="text-gray-900 dark:text-white truncate font-black">{category?.name}</span>
        </div>

        {/* Title */}
        <div className="flex items-center justify-between mb-4 md:mb-8">
          <div className="flex items-center gap-3 md:gap-4">
            <div
              className="w-10 h-10 md:w-14 md:h-14 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border"
              style={{ backgroundColor: `${category?.color}15`, color: category?.color, borderColor: `${category?.color}30` }}
            >
              <Tooltip content="Category Type">
                <Users className="w-5 h-5 md:w-7 md:h-7" />
              </Tooltip>
            </div>
            <div>
              <h1 className="text-xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">{category?.name}</h1>
              <div className="flex items-center gap-2 mt-0.5 md:mt-1 text-[11px] md:text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                <Tooltip content="Event Name">
                  <Calendar className="w-3 h-3 md:w-3.5 md:h-3.5" />
                </Tooltip>
                <span className="truncate max-w-[120px] md:max-w-none">{event?.title}</span>
              </div>
            </div>
          </div>

          {/* Show toolbar toggle for Invite List and Field Configuration tabs */}
          {['people', 'config'].includes(activeTab) && (
            <div className="flex items-center gap-2 md:gap-3">
              <button
                onClick={() => setIsToolbarVisible(!isToolbarVisible)}
                className={clsx(
                  'flex items-center gap-2 px-3 py-1.5 md:px-5 md:py-2.5 rounded-xl md:rounded-2xl border transition-all font-black text-[10px] md:text-xs uppercase tracking-widest shadow-sm',
                  isToolbarVisible
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                    : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                )}
              >
                <span>{isToolbarVisible ? 'Hide Tools' : 'Show Tools'}</span>
                {isToolbarVisible ? <ChevronUp className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <ChevronDown className="w-3.5 h-3.5 md:w-4 md:h-4" />}
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-8 border-b border-gray-100 dark:border-gray-900 mt-4 relative">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'flex items-center gap-2 pb-4 text-[10px] md:text-xs uppercase tracking-widest transition-all relative outline-none whitespace-nowrap',
                activeTab === tab.id
                  ? 'text-indigo-600 dark:text-indigo-400 font-black'
                  : 'text-gray-400 dark:text-gray-600 font-bold hover:text-gray-600 dark:hover:text-gray-400'
              )}
            >
              <Tooltip content={tab.label} position="bottom">
                <tab.icon className={clsx('w-4 h-4', activeTab === tab.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-600')} />
              </Tooltip>
              <span className="hidden sm:inline">{tab.label}</span>
              {/* Optional: Add count badge if it's the People tab */}
              {tab.id === 'people' && category?.peopleCount !== undefined && (
                <span className={clsx(
                  "ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-black leading-none transition-colors",
                  activeTab === tab.id ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400" : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                )}>
                  {category.peopleCount}
                </span>
              )}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 dark:bg-indigo-400 rounded-t-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0 pt-4 overflow-hidden bg-white dark:bg-gray-950 transition-colors">
        {activeTab === 'dashboard' && (
          <div className="h-full overflow-auto">
            <CategoryDashboardTab categoryId={categoryId} />
          </div>
        )}
        {activeTab === 'people' && <PeopleListTab eventId={eventId} categoryId={categoryId} />}
        {activeTab === 'config' && (
          <div className="h-full overflow-auto">
            <ColumnConfigTab eventId={eventId} categoryId={categoryId} />
          </div>
        )}
      </div>
    </div>
  );
}
