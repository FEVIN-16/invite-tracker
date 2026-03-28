import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Plus, Grid3x3, Search, ChevronRight, ArrowLeft, Calendar,
  Tag, Users, Edit2, BarChart2, CheckCircle, Clock
} from 'lucide-react';
import { getCategoriesByEvent, deleteCategory } from '../db/categoriesDb';
import { getEventById } from '../db/eventsDb';
import { getPeopleByCategory } from '../db/peopleDb';
import { getColumnsByEvent } from '../db/columnsDb';
import { initDB } from '../db/index';
import { useUIStore } from '../store/uiStore';
import { useEventStore } from '../store/eventStore';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { CategoryModal } from '../components/categories/CategoryModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Spinner } from '../components/ui/Spinner';
import { StatCard } from '../components/dashboard/StatCard';
import { StatusChart } from '../components/dashboard/StatusChart';
import { CategorySummary } from '../components/dashboard/CategorySummary';
import { Accordion } from '../components/ui/Accordion';
import { Tooltip } from '../components/ui/Tooltip';
import clsx from 'clsx';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
  { id: 'categories', label: 'Invite Categories', icon: Grid3x3 },
];

export default function CategoriesPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useUIStore();
  const { currentEvent, setCurrentEvent, setCurrentCategory } = useEventStore();

  const [activeTab, setActiveTab] = useState('categories');
  const [event, setEvent] = useState(null);
  const [enriched, setEnriched] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deletingCategory, setDeletingCategory] = useState(null);

  // Dashboard stats
  const [stats, setStats] = useState(null);

  async function fetchData() {
    try {
      let ev = currentEvent?.id === eventId ? currentEvent : null;
      if (!ev) {
        ev = await getEventById(eventId);
        if (!ev) { navigate('/events'); return; }
        setCurrentEvent(ev);
      }
      setEvent(ev);

      const cats = await getCategoriesByEvent(eventId);
      const sorted = cats.sort((a, b) => a.name.localeCompare(b.name));
      const counts = await Promise.all(sorted.map(c => getPeopleByCategory(c.id)));
      const enrichedCats = sorted.map((c, i) => ({ ...c, peopleCount: counts[i].length }));
      setEnriched(enrichedCats);

      // Build dashboard stats
      const db = await initDB();
      const [columns, allPeople] = await Promise.all([
        getColumnsByEvent(eventId),
        db.getAllFromIndex('people', 'eventId', eventId)
      ]);

      const statusCols = columns.filter(c =>
        c.type === 'select' &&
        (c.label.toLowerCase().includes('status') || c.label.toLowerCase().includes('rsvp'))
      );
      const mainStatusCol = statusCols[0];
      let statusData = [];
      let confirmedCount = 0;
      let pendingCount = 0;

      if (mainStatusCol) {
        const countsMap = {};
        (mainStatusCol.options || []).forEach(opt => countsMap[opt] = 0);
        allPeople.forEach(p => {
          const val = p.dynamicFields?.[mainStatusCol.id];
          if (val && countsMap[val] !== undefined) {
            countsMap[val]++;
            if (['yes', 'confirmed'].includes(val.toLowerCase())) confirmedCount++;
            if (['maybe', 'pending'].includes(val.toLowerCase())) pendingCount++;
          } else {
            countsMap['Unset'] = (countsMap['Unset'] || 0) + 1;
            pendingCount++;
          }
        });
        statusData = Object.entries(countsMap).map(([name, value]) => ({ name, value }));
      }

      setStats({
        totalGuests: allPeople.length,
        confirmedCount,
        pendingCount,
        statusData,
        mainStatusLabel: mainStatusCol?.label || 'Status',
        catBreakdown: enrichedCats.map(c => ({ ...c, count: c.peopleCount }))
      });
    } catch {
      addToast('Error loading event data', 'error');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, [eventId]);

  const filtered = enriched.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  async function handleDelete() {
    try {
      await deleteCategory(deletingCategory.id);
      addToast('Category deleted');
      fetchData();
    } catch {
      addToast('Error deleting category', 'error');
    } finally {
      setDeletingCategory(null);
    }
  }

  function handleOpen(cat) {
    setCurrentCategory(cat);
    navigate(`/events/${eventId}/categories/${cat.id}/detail`);
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50/30">
      {/* Event Header */}
      <div className="bg-white border-b border-gray-100 px-4 md:px-8 py-6">
        <button
          onClick={() => navigate('/events')}
          className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-widest mb-5 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to My Events
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <Tooltip content="Event Details">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-200">
                <Calendar className="w-8 h-8 text-white" />
              </div>
            </Tooltip>
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-tight">{event?.title}</h1>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest capitalize">{event?.type}</span>
                {event?.date && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                    <span className="text-xs font-medium text-gray-400">{event.date}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button variant="secondary" size="sm" icon={Edit2} onClick={() => navigate(`/events/${eventId}/edit`)}>
              Edit Event
            </Button>
            {activeTab === 'categories' && (
              <Button icon={Plus} onClick={() => { setEditingCategory(null); setIsModalOpen(true); }}>
                Add Invite Category
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-8 border-b border-gray-100 mt-8 relative">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'flex items-center gap-2 pb-4 text-sm transition-all relative outline-none whitespace-nowrap',
                activeTab === tab.id
                  ? 'text-indigo-600 font-black'
                  : 'text-gray-400 font-bold hover:text-gray-600'
              )}
            >
              <Tooltip content={tab.label} position="bottom">
                <tab.icon className={clsx('w-4 h-4', activeTab === tab.id ? 'text-indigo-600' : 'text-gray-400')} />
              </Tooltip>
              <span>{tab.label}</span>
              {tab.id === 'categories' && enriched.length > 0 && (
                <span className={clsx(
                  "ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black leading-none transition-colors",
                  activeTab === tab.id ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-500"
                )}>
                  {enriched.length}
                </span>
              )}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'dashboard' ? (
          // ── Dashboard Tab ──────────────────────────────────────────────────
          <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
            {stats ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard title="Total People" value={stats.totalGuests} icon={Users} color="indigo" />
                  <StatCard title="Confirmed" value={stats.confirmedCount} icon={CheckCircle} color="emerald" />
                  <StatCard title="Pending" value={stats.pendingCount} icon={Clock} color="amber" />
                  <StatCard title="Categories" value={stats.catBreakdown.length} icon={BarChart2} color="blue" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-4">
                    <Accordion title={stats.mainStatusLabel || 'Status Breakdown'} icon={CheckCircle} defaultOpen>
                      <StatusChart data={stats.statusData} title={stats.mainStatusLabel} hideHeader />
                    </Accordion>
                    
                    <Accordion title="Invite Category Breakdown" icon={BarChart2} defaultOpen={stats.catBreakdown.length > 0}>
                      <CategorySummary data={stats.catBreakdown} hideHeader />
                    </Accordion>
                  </div>
                  
                  <div className="space-y-4 h-fit">
                    <Accordion title="Event Details" icon={Calendar} defaultOpen>
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs text-gray-400 font-medium mb-1 uppercase">Type</p>
                          <p className="text-sm font-semibold text-gray-800 capitalize">{event?.type}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-medium mb-1 uppercase">Date</p>
                          <p className="text-sm font-semibold text-gray-800">{event?.date || 'Not set'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-medium mb-1 uppercase">Location</p>
                          <p className="text-sm font-semibold text-gray-800">{event?.location || 'Not set'}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/events/${eventId}/edit`)}
                        className="w-full mt-6 text-sm font-semibold text-indigo-600 hover:text-indigo-700 py-2 border-t border-gray-100 text-center"
                      >
                        Edit Event Info
                      </button>
                    </Accordion>
                  </div>
                </div>
              </>
            ) : (
              <EmptyState
                icon={BarChart2}
                heading="No data yet"
                subtext="Add invite categories and people to see the dashboard."
                actions={<Button icon={Plus} onClick={() => setActiveTab('categories')}>Go to Categories</Button>}
              />
            )}
          </div>
        ) : (
          // ── Categories Tab ─────────────────────────────────────────────────
          <div className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-black text-gray-900">Invite Categories</h2>
                <p className="text-sm text-gray-400 mt-0.5">{enriched.length} categories · {enriched.reduce((s, c) => s + c.peopleCount, 0)} total people</p>
              </div>
            </div>

            {enriched.length > 0 && (
              <div className="relative mb-6 max-w-sm">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search categories..."
                  className="w-full pl-11 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
            )}

            {filtered.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map(cat => (
                  <div
                    key={cat.id}
                    className="group bg-white border border-gray-200 rounded-xl p-5 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50 transition-all relative overflow-hidden cursor-pointer"
                    onClick={() => handleOpen(cat)}
                  >
                    <div
                      className="absolute top-0 right-0 w-28 h-28 -mr-10 -mt-10 rounded-full opacity-5 group-hover:opacity-10 transition-opacity"
                      style={{ backgroundColor: cat.color }}
                    />
                    <div className="flex items-start justify-between mb-5">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                        style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                      >
                        <Tag className="w-6 h-6" />
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Tooltip content="Edit Category">
                          <button
                            onClick={e => { e.stopPropagation(); setEditingCategory(cat); setIsModalOpen(true); }}
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </Tooltip>
                        <Tooltip content="Delete Category">
                          <button
                            onClick={e => { e.stopPropagation(); setDeletingCategory(cat); }}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          >
                            ✕
                          </button>
                        </Tooltip>
                      </div>
                    </div>
                    <h3 className="text-lg font-black text-gray-900 mb-1 truncate">{cat.name}</h3>
                    {cat.description && (
                      <p className="text-sm text-gray-400 mb-3 line-clamp-1">{cat.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                      <div className="flex items-center gap-1.5 text-sm font-medium text-gray-500">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span>{cat.peopleCount} people</span>
                      </div>
                      <span className="flex items-center gap-1 text-xs font-black text-indigo-600 group-hover:gap-2 transition-all">
                        Manage <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                ))}

                {/* Add card */}
                <button
                  onClick={() => { setEditingCategory(null); setIsModalOpen(true); }}
                  className="border-2 border-dashed border-gray-200 rounded-xl p-5 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all flex flex-col items-center justify-center gap-3 min-h-[160px] group"
                >
                  <div className="w-12 h-12 rounded-xl bg-gray-100 group-hover:bg-indigo-100 flex items-center justify-center transition-colors">
                    <Plus className="w-6 h-6 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                  </div>
                  <span className="text-sm font-bold text-gray-400 group-hover:text-indigo-600 transition-colors">Add Invite Category</span>
                </button>
              </div>
            ) : (
              <EmptyState
                icon={Grid3x3}
                heading={searchTerm ? 'No categories matched' : 'No invite categories yet'}
                subtext="Create invite categories like 'Friends', 'Family', or 'Colleagues' to organise your invite list."
                actions={!searchTerm && (
                  <Button icon={Plus} onClick={() => { setEditingCategory(null); setIsModalOpen(true); }}>
                    Add First Invite Category
                  </Button>
                )}
              />
            )}
          </div>
        )}
      </div>

      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingCategory(null); }}
        onSuccess={fetchData}
        category={editingCategory}
        eventId={eventId}
      />

      <ConfirmDialog
        isOpen={!!deletingCategory}
        onClose={() => setDeletingCategory(null)}
        onConfirm={handleDelete}
        title="Delete Category?"
        message={`Delete "${deletingCategory?.name}"? This will remove all people in this category.`}
        confirmLabel="Yes, Delete"
      />
    </div>
  );
}
