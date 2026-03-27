import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BarChart2, Users, CheckCircle, Clock, PieChart as PieChartIcon } from 'lucide-react';
import { initDB } from '../db/index';
import { getEventById } from '../db/eventsDb';
import { getCategoriesByEvent } from '../db/categoriesDb';
import { getColumnsByEvent } from '../db/columnsDb';
import { useUIStore } from '../store/uiStore';
import { useEventStore } from '../store/eventStore';
import { StatCard } from '../components/dashboard/StatCard';
import { StatusChart } from '../components/dashboard/StatusChart';
import { CategorySummary } from '../components/dashboard/CategorySummary';
import { Spinner } from '../components/ui/Spinner';

export default function DashboardPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useUIStore();
  const { currentEvent, setCurrentEvent } = useEventStore();

  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  async function calculateStats() {
    try {
      if (!currentEvent || currentEvent.id !== eventId) {
        const event = await getEventById(eventId);
        if (!event) { navigate('/events'); return; }
        setCurrentEvent(event);
      }

      const db = await initDB();
      const [categories, columns, people] = await Promise.all([
        getCategoriesByEvent(eventId),
        getColumnsByEvent(eventId),
        db.getAllFromIndex('people', 'eventId', eventId)
      ]);

      // Calculate overall counts
      const totalGuests = people.length;
      
      // Find RSVP/Status columns
      const statusCols = columns.filter(c => 
        c.type === 'select' && 
        (c.label.toLowerCase().includes('status') || c.label.toLowerCase().includes('rsvp'))
      );

      const mainStatusCol = statusCols[0];
      let statusData = [];
      let confirmedCount = 0;
      let pendingCount = 0;

      if (mainStatusCol) {
        const counts = {};
        mainStatusCol.options.forEach(opt => counts[opt] = 0);
        people.forEach(p => {
          const val = p.dynamicFields[mainStatusCol.id];
          if (val && counts[val] !== undefined) {
             counts[val]++;
             if (val.toLowerCase() === 'yes' || val.toLowerCase() === 'confirmed') confirmedCount++;
             if (val.toLowerCase() === 'maybe' || val.toLowerCase() === 'pending') pendingCount++;
          } else {
             counts['Unset'] = (counts['Unset'] || 0) + 1;
             pendingCount++;
          }
        });
        statusData = Object.entries(counts).map(([name, value]) => ({ name, value }));
      }

      // Category breakdown
      const catBreakdown = categories.map(cat => {
        const count = people.filter(p => p.categoryId === cat.id).length;
        return { ...cat, count };
      });

      setStats({
        totalGuests,
        confirmedCount,
        pendingCount,
        statusData,
        mainStatusLabel: mainStatusCol?.label || 'Status',
        catBreakdown
      });

    } catch (e) {
      addToast('Error loading dashboard data', 'error');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    calculateStats();
  }, [eventId]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Event Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time overview for <span className="font-semibold text-indigo-600">{currentEvent?.title}</span></p>
        </div>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Guests" value={stats.totalGuests} icon={Users} color="indigo" />
        <StatCard title="Confirmed" value={stats.confirmedCount} icon={CheckCircle} color="emerald" />
        <StatCard title="Pending/Maybe" value={stats.pendingCount} icon={Clock} color="amber" />
        <StatCard title="Categories" value={stats.catBreakdown.length} icon={BarChart2} color="blue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charts & Breakdown */}
        <div className="lg:col-span-2 space-y-6">
           <StatusChart data={stats.statusData} title={stats.mainStatusLabel} />
           <CategorySummary data={stats.catBreakdown} />
        </div>

        {/* Info Card */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Event Details</h3>
            <div className="space-y-4">
               <div>
                 <p className="text-xs text-gray-400 font-medium mb-1 uppercase">Type</p>
                 <p className="text-sm font-semibold text-gray-800 capitalize">{currentEvent?.type}</p>
               </div>
               <div>
                 <p className="text-xs text-gray-400 font-medium mb-1 uppercase">Date</p>
                 <p className="text-sm font-semibold text-gray-800">{currentEvent?.date || 'Not set'}</p>
               </div>
               <div>
                 <p className="text-xs text-gray-400 font-medium mb-1 uppercase">Location</p>
                 <p className="text-sm font-semibold text-gray-800">{currentEvent?.location || 'Not set'}</p>
               </div>
            </div>
            <button 
              onClick={() => navigate(`/events/${eventId}/edit`)}
              className="w-full mt-6 text-sm font-semibold text-indigo-600 hover:text-indigo-700 py-2 border-t border-gray-100"
            >
              Edit Event Info
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
