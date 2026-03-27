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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Dashboards</h1>
          <p className="text-sm text-gray-500 mt-1">Select an event to view its detailed analytics</p>
        </div>
        <Button icon={Plus} onClick={() => navigate('/events/new')}>Create First Event</Button>
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
              className="text-left bg-white border border-gray-200 rounded-2xl p-6 hover:border-indigo-300 hover:shadow-xl hover:-translate-y-1 transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <BarChart2 className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-2.5 py-1 bg-gray-50 rounded-full border border-gray-100">
                  {ev.eventType}
                </span>
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-1 truncate">{ev.title}</h3>
              <p className="text-xs text-gray-400 mb-6">{ev.eventDate || 'No date set'}</p>
              <div className="flex items-center gap-6 pt-4 border-t border-gray-50 text-xs text-gray-500 font-medium">
                <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-gray-400" />{ev.peopleCount} guests</span>
                <span className="flex items-center gap-1.5"><Grid3x3 className="w-4 h-4 text-gray-400" />{ev.categoryCount} categories</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
