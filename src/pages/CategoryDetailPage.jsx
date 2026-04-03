import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, Settings2, ChevronRight, Home, Calendar, ChevronUp, ChevronDown, BarChart2, ArrowLeft } from 'lucide-react';
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
      <div className="px-4 md:px-8 py-5 bg-white dark:bg-gray-950 sticky top-0 z-30 border-b border-transparent dark:border-gray-900 shadow-sm dark:shadow-none">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 dark:text-gray-600 mb-5 uppercase tracking-widest leading-none overflow-x-auto no-scrollbar whitespace-nowrap">
          <button onClick={() => navigate('/events')} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1">
            Events
          </button>
          <span className="text-gray-200 dark:text-gray-800">/</span>
          <button onClick={() => navigate(`/events/${eventId}/categories`)} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate max-w-[100px] md:max-w-none">
            {event?.title}
          </button>
          <span className="text-gray-200 dark:text-gray-800">/</span>
          <span className="text-gray-900 dark:text-white truncate">{category?.name}</span>
        </div>

        {/* Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <button
              onClick={() => navigate(`/events/${eventId}/categories`)}
              className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 flex items-center justify-center text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm group shrink-0"
              title="Back to Event"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </button>
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white truncate uppercase tracking-tight">{category?.name}</h1>
              <div className="flex items-center gap-2 mt-1 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-tight">
                <span className="truncate max-w-[120px] md:max-w-none">{event?.title}</span>
                <span className="w-1 h-1 rounded-full bg-gray-200 dark:bg-gray-800" />
                <span>{category?.peopleCount} People</span>
              </div>
            </div>
          </div>

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
      <div className="flex-1 overflow-auto bg-white dark:bg-gray-950 transition-colors">
        <div className="p-4 md:px-8 md:py-8 max-w-7xl mx-auto w-full">
          {activeTab === 'dashboard' && <CategoryDashboardTab categoryId={categoryId} category={category} />}
          {activeTab === 'people' && <PeopleListTab eventId={eventId} categoryId={categoryId} category={category} />}
          {activeTab === 'config' && <ColumnConfigTab eventId={eventId} categoryId={categoryId} category={category} />}
        </div>
      </div>
    </div>
  );
}
