import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, Settings2, ChevronRight, Home, Calendar } from 'lucide-react';
import { getCategoryById } from '../db/categoriesDb';
import { getEventById } from '../db/eventsDb';
import { useEventStore } from '../store/eventStore';
import { useUIStore } from '../store/uiStore';
import { Spinner } from '../components/ui/Spinner';
import { PeopleListTab } from '../components/categoryDetail/PeopleListTab';
import { ColumnConfigTab } from '../components/categoryDetail/ColumnConfigTab';
import clsx from 'clsx';

const TABS = [
  { id: 'people', label: 'People List', icon: Users },
  { id: 'config', label: 'Field Configuration', icon: Settings2 },
];

export default function CategoryDetailPage() {
  const { eventId, categoryId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useUIStore();
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
          navigate('/categories'); 
          return; 
        }
        setEvent(ev);
        setCategory(cat);
        setCurrentEvent(ev);
        setCurrentCategory(cat);
      } catch {
        addToast('Error loading category data', 'error');
        navigate('/categories');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [eventId, categoryId]);

  if (isLoading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header & Tabs */}
      <div className="px-4 md:px-6 pt-6 border-b border-gray-100 bg-white sticky top-0 z-30">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">
          <button onClick={() => navigate('/events')} className="hover:text-indigo-600 transition-colors flex items-center gap-1">
            <Home className="w-3 h-3" /> Events
          </button>
          <ChevronRight className="w-3 h-3" />
          <button onClick={() => navigate(`/events/${eventId}/dashboard`)} className="hover:text-indigo-600 transition-colors">
            {event?.title}
          </button>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-900">{category?.name}</span>
        </div>

        {/* Title Section */}
        <div className="flex items-center gap-4 mb-8">
          <div
            className="w-14 h-14 rounded-3xl flex items-center justify-center flex-shrink-0 shadow-sm border"
            style={{ backgroundColor: `${category?.color}10`, color: category?.color, borderColor: `${category?.color}20` }}
          >
            <Users className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">{category?.name}</h1>
            <div className="flex items-center gap-2 mt-1 text-sm font-medium text-gray-400">
               <Calendar className="w-3.5 h-3.5" />
               <span>{event?.title}</span>
            </div>
          </div>
        </div>

        {/* Modern Tabs */}
        <div className="flex gap-1 p-1.5 bg-gray-50 rounded-2xl w-fit mb-[-2px]">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-xl transition-all',
                activeTab === tab.id
                  ? 'bg-white text-indigo-700 shadow-xl shadow-indigo-100/50 scale-105 z-10'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'
              )}
            >
              <tab.icon className={clsx("w-4 h-4", activeTab === tab.id ? "text-indigo-600" : "text-gray-400")} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0 bg-white">
        {activeTab === 'people' ? (
          <PeopleListTab eventId={eventId} categoryId={categoryId} />
        ) : (
          <div className="bg-gray-50/30 h-full overflow-auto">
            <ColumnConfigTab eventId={eventId} categoryId={categoryId} />
          </div>
        )}
      </div>
    </div>
  );
}
