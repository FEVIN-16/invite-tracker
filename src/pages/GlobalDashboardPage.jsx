import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart2, Users, Grid3x3, Plus } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { getEventsByUser } from '../db/eventsDb';
import { initDB } from '../db/index';
import { EmptyState } from '../components/ui/EmptyState';
import { Spinner } from '../components/ui/Spinner';
import { Button } from '../components/ui/Button';

export default function GlobalDashboardPage() {
  const user = useAuthStore(s => s.user);
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const db = await initDB();
      const evts = await getEventsByUser(user.id);
      // Enrich with guest/category counts
      const enriched = await Promise.all(evts.map(async ev => {
        const [cats, people] = await Promise.all([
          db.getAllFromIndex('categories', 'eventId', ev.id),
          db.getAllFromIndex('people', 'eventId', ev.id),
        ]);
        return { ...ev, categoryCount: cats.length, peopleCount: people.length };
      }));
      setEvents(enriched.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      setIsLoading(false);
    }
    load();
  }, [user.id]);

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 transition-colors">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">All Dashboards</h1>
          <p className="text-xs font-black text-gray-400 dark:text-gray-600 mt-2 uppercase tracking-widest leading-loose">Select an event to view its detailed analytics</p>
        </div>
        <Button icon={Plus} onClick={() => navigate('/events/new')}>Create New Event</Button>
      </div>

      {events.length === 0 ? (
        <EmptyState
          icon={BarChart2}
          heading="No events yet"
          subtext="Create your first event to start tracking guest dashboards."
          actions={<Button icon={Plus} onClick={() => navigate('/events/new')}>Create Event</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map(ev => (
            <button
              key={ev.id}
              onClick={() => navigate(`/events/${ev.id}/dashboard`)}
              className="text-left bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 hover:border-indigo-200 dark:hover:border-indigo-900 hover:shadow-xl hover:shadow-indigo-500/10 transition-all group"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 dark:group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-inner">
                  <BarChart2 className="w-7 h-7" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-600 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-full border border-gray-100 dark:border-gray-700 transition-colors">
                  {ev.eventType}
                </span>
              </div>
              <h3 className="font-black text-gray-900 dark:text-white text-xl mb-1.5 truncate tracking-tight uppercase">{ev.title}</h3>
              <p className="text-[10px] font-black text-gray-400 dark:text-gray-700 uppercase tracking-widest">{ev.eventDate || 'No date set'}</p>
              <div className="flex items-center gap-6 pt-6 mt-6 border-t border-gray-50 dark:border-gray-800 text-[11px] text-gray-500 dark:text-gray-400 font-black uppercase tracking-wider">
                <span className="flex items-center gap-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"><Users className="w-4 h-4 text-gray-300 dark:text-gray-700" />{ev.peopleCount} guests</span>
                <span className="flex items-center gap-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"><Grid3x3 className="w-4 h-4 text-gray-300 dark:text-gray-700" />{ev.categoryCount} cat</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
