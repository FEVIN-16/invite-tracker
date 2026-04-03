import { useState, useEffect } from 'react';
import { Users, BarChart2, CheckCircle, Clock, TrendingUp, FileText, Download, MessageSquare, Paperclip } from 'lucide-react';
import { getPeopleByCategory } from '../../db/peopleDb';
import { getColumnsByCategory } from '../../db/columnsDb';
import { getCategoryById } from '../../db/categoriesDb';
import { Spinner } from '../ui/Spinner';
import { StatCard } from '../dashboard/StatCard';
import { StatusChart } from '../dashboard/StatusChart';
import { Accordion } from '../ui/Accordion';

export function CategoryDashboardTab({ categoryId, category }) {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [people, columns, dbCat] = await Promise.all([
          getPeopleByCategory(categoryId),
          getColumnsByCategory(categoryId),
          getCategoryById(categoryId)
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
          category,
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
    <div className="space-y-8">
      {/* Tab Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight">Category Dashboard</h2>
          <p className="text-xs font-bold text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-widest">
            Overview and statistics for {category?.name}
          </p>
        </div>
      </div>

      {/* Primary stats */}
      <div className="flex flex-wrap gap-4">
        <div className="bg-white dark:bg-gray-900 px-5 py-4 rounded-2xl flex items-center gap-4 border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:shadow-md">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{stats.total}</p>
            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">Total People</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 px-5 py-4 rounded-2xl flex items-center gap-4 border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:shadow-md">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{stats.confirmedCount}</p>
            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">Confirmed</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 px-5 py-4 rounded-2xl flex items-center gap-4 border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:shadow-md">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{stats.pendingCount}</p>
            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">Pending</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 px-5 py-4 rounded-2xl flex items-center gap-4 border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:shadow-md">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{stats.totalColumns}</p>
            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">Fields</p>
          </div>
        </div>
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
        <div className="space-y-6">
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

          {/* Invitation Details & Documents */}
          {(stats.category?.inviteMessage || (stats.category?.attachments && stats.category.attachments.length > 0)) && (
            <Accordion title="Invitation Details" icon={MessageSquare} defaultOpen>
              <div className="space-y-6">
                {stats.category.inviteMessage && (
                  <div>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <MessageSquare className="w-3 h-3" /> Invite Message
                    </p>
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {stats.category.inviteMessage}
                      </p>
                    </div>
                  </div>
                )}

                {stats.category.attachments && stats.category.attachments.length > 0 && (
                  <div>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <Paperclip className="w-3 h-3" /> Attached Documents
                    </p>
                    <div className="space-y-2">
                      {stats.category.attachments.map(file => (
                        <div key={file.id} className="flex flex-col bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden group/file">
                          {file.type.startsWith('image/') && (
                            <div className="w-full h-32 bg-gray-100 dark:bg-gray-900 flex items-center justify-center overflow-hidden border-b border-gray-50 dark:border-gray-800/50">
                              <img src={file.data} alt="" className="w-full h-full object-cover transition-transform group-hover/file:scale-105" />
                            </div>
                          )}
                          <div className="p-3 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                                {file.type.startsWith('image/') ? <ImageIcon className="w-4 h-4 text-indigo-500" /> : <FileText className="w-4 h-4 text-indigo-500" />}
                              </div>
                              <div className="min-w-0">
                                <p className="text-[11px] font-black text-gray-900 dark:text-white truncate">{file.name}</p>
                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{(file.size / 1024).toFixed(1)} KB</p>
                              </div>
                            </div>
                            <a
                              href={file.data}
                              download={file.name}
                              className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 rounded-lg transition-all"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Accordion>
          )}
        </div>
      </div>
    </div>
  );
}
