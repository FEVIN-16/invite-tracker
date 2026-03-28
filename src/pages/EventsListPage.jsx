import { useState, useEffect } from 'react';
import { Plus, Search, Calendar, MapPin, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { getEventsByUser } from '../db/eventsDb';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';
import { EventCard } from '../components/events/EventCard';
import { Skeleton } from '../components/ui/Skeleton'; // We'll add this to UI primitives if missing

export default function EventsListPage() {
  const user = useAuthStore(state => state.user);
  const { addToast } = useUIStore();
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  async function loadEvents() {
    if (!user) return;
    try {
      const data = await getEventsByUser(user.id);
      // Sort: newest first
      setEvents(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (e) {
      addToast('Error loading events', 'error');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
  }, [user]);

  const filteredEvents = events.filter(e =>
    e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto transition-colors">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">My Events</h1>
          <p className="text-xs font-bold text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-widest">Manage all your invitation lists</p>
        </div>
        <Link to="/events/new">
          <Button icon={Plus} className="w-full md:w-auto">Create New Event</Button>
        </Link>
      </div>

      <div className="mb-6 relative group">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none transition-colors group-focus-within:text-indigo-500">
          <Search className="h-4 w-4 text-gray-400 dark:text-gray-500" />
        </div>
        <input
          type="text"
          placeholder="Search events..."
          className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all dark:text-white dark:placeholder:text-gray-600 shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-48 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />)}
        </div>
      ) : filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map(event => (
            <EventCard key={event.id} event={event} onRefresh={loadEvents} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Calendar}
          heading={searchTerm ? "No matching events found" : "No events yet"}
          subtext={searchTerm ? "Try adjusting your search term" : "Create your first event to start managing your guest lists."}
          actions={!searchTerm && (
            <Link to="/events/new"><Button icon={Plus}>Get Started</Button></Link>
          )}
        />
      )}
    </div>
  );
}
