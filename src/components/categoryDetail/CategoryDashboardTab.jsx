import { useState, useEffect } from 'react';
import { Users, BarChart2, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { getPeopleByCategory } from '../../db/peopleDb';
import { getColumnsByCategory } from '../../db/columnsDb';
import { Spinner } from '../ui/Spinner';
import { StatCard } from '../dashboard/StatCard';
import { StatusChart } from '../dashboard/StatusChart';
import { Accordion } from '../ui/Accordion';

export function CategoryDashboardTab({ categoryId }) {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [people, columns] = await Promise.all([
          getPeopleByCategory(categoryId),
          getColumnsByCategory(categoryId)
        ]);

        // Find RSVP / Status select columns
        const statusCols = columns.filter(c =>
          c.type === 'select' &&
          (c.label?.toLowerCase().includes('status') || c.label?.toLowerCase().includes('rsvp'))
        );
        const mainStatusCol = statusCols[0];

        let statusData = [];
        let confirmedCount = 0;
        let pendingCount = 0;

        if (mainStatusCol) {
          const map = {};
          (mainStatusCol.options || []).forEach(opt => (map[opt] = 0));
          people.forEach(p => {
            const val = p.dynamicFields?.[mainStatusCol.id];
            if (val && map[val] !== undefined) {
              map[val]++;
              if (['yes', 'confirmed'].includes(val.toLowerCase())) confirmedCount++;
              if (['maybe', 'pending'].includes(val.toLowerCase())) pendingCount++;
            } else {
              map['Unset'] = (map['Unset'] || 0) + 1;
              pendingCount++;
            }
          });
          statusData = Object.entries(map).map(([name, value]) => ({ name, value }));
        }

        // Field completion score (% of people with at least one dynamic field filled)
        const filledRows = people.filter(p =>
          Object.values(p.dynamicFields || {}).some(v => v !== '' && v !== null && v !== undefined)
        ).length;
        const completion = people.length > 0
          ? Math.round((filledRows / people.length) * 100)
          : 0;

        // Most recent additions (last 5 by createdAt)
        const recent = [...people]
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5);

        setStats({
          total: people.length,
          confirmedCount,
          pendingCount,
          statusData,
          mainStatusLabel: mainStatusCol?.label || 'Status',
          completion,
          recent,
          totalColumns: columns.length,
        });
      } catch {
        // silently fail — stats are optional
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [categoryId]);

  if (isLoading) return <div className="flex justify-center py-20"><Spinner /></div>;

  if (!stats || stats.total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-4">
        <div className="w-16 h-16 bg-indigo-50 rounded-xl flex items-center justify-center mb-4">
          <BarChart2 className="w-8 h-8 text-indigo-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">No data yet</h3>
        <p className="text-sm text-gray-400 max-w-xs">
          Add people to this invite category to see stats and tracking information here.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 pb-24">
      {/* Primary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total People" value={stats.total} icon={Users} color="indigo" />
        <StatCard title="Confirmed" value={stats.confirmedCount} icon={CheckCircle} color="emerald" />
        <StatCard title="Pending" value={stats.pendingCount} icon={Clock} color="amber" />
        <StatCard title="Fields Configured" value={stats.totalColumns} icon={BarChart2} color="blue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status chart */}
        <div className="lg:col-span-2 space-y-4">
          <Accordion title={stats.mainStatusLabel || 'Status Breakdown'} icon={CheckCircle} defaultOpen>
            {stats.statusData.length > 0 ? (
              <StatusChart data={stats.statusData} title={stats.mainStatusLabel} hideHeader />
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">
                Add a <strong>Status</strong> or <strong>RSVP</strong> select field in Field Configuration to see a status chart here.
              </p>
            )}
          </Accordion>

          {/* Recent additions */}
          {stats.recent.length > 0 && (
            <Accordion title="Recently Added" icon={TrendingUp} defaultOpen count={stats.recent.length}>
              <div className="space-y-2">
                {stats.recent.map(p => (
                  <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="text-sm font-semibold text-gray-800">{p.name}</span>
                    <span className="text-xs text-gray-400">
                      {p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}
                    </span>
                  </div>
                ))}
              </div>
            </Accordion>
          )}
        </div>

        {/* Summary card */}
        <div className="h-fit">
          <Accordion title="Summary" icon={BarChart2} defaultOpen>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-400 font-medium mb-1 uppercase">Total People</p>
                <p className="text-2xl font-black text-indigo-600">{stats.total}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium mb-1 uppercase">Data Completion</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-indigo-500 transition-all"
                      style={{ width: `${stats.completion}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-gray-700">{stats.completion}%</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">of people have at least one field filled</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium mb-1 uppercase">Custom Fields</p>
                <p className="text-sm font-semibold text-gray-800">{stats.totalColumns} field{stats.totalColumns !== 1 ? 's' : ''} configured</p>
              </div>
            </div>
          </Accordion>
        </div>
      </div>
    </div>
  );
}
