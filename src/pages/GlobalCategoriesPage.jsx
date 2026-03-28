import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Grid3x3, Users, Search, Tag } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { getEventsByUser } from '../db/eventsDb';
import { initDB } from '../db/index';
import { EmptyState } from '../components/ui/EmptyState';
import { Spinner } from '../components/ui/Spinner';

export default function GlobalCategoriesPage() {
  const user = useAuthStore(s => s.user);
  const navigate = useNavigate();
  const [items, setItems] = useState([]); // { category + event + peopleCount }
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const db = await initDB();
      const events = await getEventsByUser(user.id);
      const allItems = [];
      for (const ev of events) {
        const cats = await db.getAllFromIndex('categories', 'eventId', ev.id);
        for (const cat of cats) {
          const people = await db.getAllFromIndex('people', 'categoryId', cat.id);
          allItems.push({ ...cat, eventTitle: ev.title, eventId: ev.id, peopleCount: people.length });
        }
      }
      setItems(allItems.sort((a, b) => a.eventTitle.localeCompare(b.eventTitle)));
      setIsLoading(false);
    }
    load();
  }, [user.id]);

  const filtered = items.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.eventTitle.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <div className="mb-8">
        <h1 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">All Categories</h1>
        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-widest">Manage guest lists across all your events</p>
      </div>
      
      {/* Search */}
      <div className="relative mb-8 max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search categories or events..."
          className="w-full pl-11 pr-4 py-3 text-sm border border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm transition-all dark:placeholder:text-gray-600"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Grid3x3} heading="No categories found" subtext="Create categories inside an event first." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(cat => (
            <button
              key={cat.id}
              onClick={() => navigate(`/events/${cat.eventId}/categories/${cat.id}/detail`)}
              className="text-left bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 hover:border-indigo-200 dark:hover:border-indigo-900 hover:shadow-xl hover:shadow-indigo-500/10 transition-all group relative overflow-hidden"
            >

              
              <div className="flex items-center gap-4 mb-4">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-600 group-hover:bg-indigo-600 dark:group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-inner"
                >
                  <Tag className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-gray-900 dark:text-white truncate text-base uppercase tracking-tight">{cat.name}</p>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 truncate mt-0.5 uppercase tracking-widest">{cat.eventTitle}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-gray-800">
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest">
                  <Users className="w-3.5 h-3.5 text-gray-400 dark:text-gray-700" />
                  <span>{cat.peopleCount} guests</span>
                </div>
                <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest group-hover:gap-2 transition-all">
                  Manage Guests →
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
