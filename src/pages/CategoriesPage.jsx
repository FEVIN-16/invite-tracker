import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Plus, Grid3x3, Search, ChevronRight, ArrowLeft, Calendar,
  Tag, Users, Edit2, BarChart2, CheckCircle, Clock, LayoutGrid, MessageSquare, Paperclip, Eye, BookOpen, ExternalLink,
  CheckSquare
} from 'lucide-react';
import { getCategoriesByEvent, deleteCategory } from '../db/categoriesDb';
import { getEventById } from '../db/eventsDb';
import { getPeopleByCategory } from '../db/peopleDb';
import { getColumnsByEvent } from '../db/columnsDb';
import { getTaskGroupsByEvent } from '../db/tasksDb';
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
import { TasksTab } from '../components/tasks/TasksTab';
import clsx from 'clsx';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
  { id: 'categories', label: 'Invite Categories', icon: Grid3x3 },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
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
  const [expandedMessages, setExpandedMessages] = useState({});
  const [taskGroupCount, setTaskGroupCount] = useState(0);

  const tabsRef = useRef([]);

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

      const [cats, taskGroups] = await Promise.all([
        getCategoriesByEvent(eventId),
        getTaskGroupsByEvent(eventId)
      ]);
      
      setTaskGroupCount(taskGroups.length);

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
        categoryCount: enrichedCats.length,
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

  const handleTabClick = (tabId, index) => {
    setActiveTab(tabId);
    if (tabsRef.current[index]) {
      tabsRef.current[index].scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest'
      });
    }
  };

  const handlePreview = (attachment) => {
    try {
      const arr = attachment.data.split(',');
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch {
      addToast('Preview failed', 'error');
    }
  };

  const toggleExpand = (e, id) => {
    e.stopPropagation();
    setExpandedMessages(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50/30 dark:bg-gray-950/20 transition-colors">
      <div className="bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-900 px-4 md:px-8 py-5">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 dark:text-gray-600 mb-5 uppercase tracking-widest leading-none">
          <button onClick={() => navigate('/events')} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Events</button>
          <span className="text-gray-200 dark:text-gray-800">/</span>
          <span className="text-gray-900 dark:text-white">{event.title}</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 flex-1 min-w-0">
            <button 
              onClick={() => navigate('/events')}
              className="p-2 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm hover:shadow-md shrink-0 focus:ring-2 focus:ring-indigo-500/20 outline-none"
              title="Back to Events"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <div className="min-w-0 pr-4">
              <h1 className="text-lg md:text-xl font-black text-gray-900 dark:text-white truncate tracking-tight flex items-center gap-2">
                {event.title}
              </h1>
              <div className="flex items-center gap-2 mt-0.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                <span className="text-indigo-600 dark:text-indigo-400 truncate max-w-[120px] md:max-w-none">{event.location}</span>
                {event.date && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-gray-200 dark:bg-gray-800" />
                    <span className="truncate">{event.date}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto shrink-0 border-t md:border-t-0 border-gray-50 dark:border-gray-900 pt-3 md:pt-0">
            <Button 
              variant="secondary" 
              size="sm" 
              icon={Edit2} 
              onClick={() => navigate(`/events/${eventId}/edit`)}
              className="flex-1 md:flex-none justify-center h-9 md:h-10 text-[10px] md:text-xs"
            >
              <span className="font-bold">Edit</span>
            </Button>
            {activeTab === 'categories' && (
              <Button 
                icon={Plus} 
                onClick={() => { setEditingCategory(null); setIsModalOpen(true); }}
                className="flex-1 md:flex-none justify-center shadow-lg shadow-indigo-500/20 h-9 md:h-10 text-[10px] md:text-xs"
              >
                <span className="font-bold">Add Category</span>
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-6 border-b border-gray-100 dark:border-gray-900 mt-5 relative overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 scroll-smooth">
          {TABS.map((tab, idx) => (
            <button
              key={tab.id}
              ref={el => tabsRef.current[idx] = el}
              onClick={() => handleTabClick(tab.id, idx)}
              className={clsx(
                'flex items-center gap-2 pb-4 text-[11px] md:text-xs uppercase tracking-widest transition-all relative outline-none whitespace-nowrap',
                activeTab === tab.id
                  ? 'text-indigo-600 dark:text-indigo-400 font-black'
                  : 'text-gray-400 dark:text-gray-600 font-bold hover:text-gray-600 dark:hover:text-gray-400'
              )}
            >
              <Tooltip content={tab.label} position="bottom">
                <tab.icon className={clsx('w-4 h-4', activeTab === tab.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-600')} />
              </Tooltip>
              <span>{tab.label}</span>
              {tab.id === 'categories' && enriched.length > 0 && (
                <span className={clsx(
                  "ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-black leading-none transition-colors",
                  activeTab === tab.id ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400" : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                )}>
                  {enriched.length}
                </span>
              )}
              {tab.id === 'tasks' && taskGroupCount > 0 && (
                <span className={clsx(
                  "ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-black leading-none transition-colors",
                  activeTab === tab.id ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400" : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                )}>
                  {taskGroupCount}
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
      <div className="flex-1 overflow-auto">
        {activeTab === 'dashboard' && (
          <div className="p-4 md:px-8 md:py-8 max-w-7xl mx-auto w-full space-y-8">
            {stats ? (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight">Event Dashboard</h2>
                    <p className="text-xs font-bold text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-widest">Snapshot of your event progress</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  <div className="bg-white dark:bg-gray-900 px-5 py-4 rounded-2xl flex items-center gap-4 border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:shadow-md">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{stats.totalGuests}</p>
                      <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">Total Guests</p>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-900 px-5 py-4 rounded-2xl flex items-center gap-4 border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:shadow-md">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <LayoutGrid className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{stats.categoryCount}</p>
                      <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">Categories</p>
                    </div>
                  </div>
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
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-black mb-1.5 uppercase tracking-widest pl-1">Type</p>
                          <p className="text-sm font-bold text-gray-800 dark:text-white capitalize bg-gray-50 dark:bg-gray-800/50 px-3 py-2 rounded-lg border border-gray-100 dark:border-gray-800">{event?.type}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-black mb-1.5 uppercase tracking-widest pl-1">Date</p>
                          <p className="text-sm font-bold text-gray-800 dark:text-white bg-gray-50 dark:bg-gray-800/50 px-3 py-2 rounded-lg border border-gray-100 dark:border-gray-800">{event?.date || 'Not set'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-black mb-1.5 uppercase tracking-widest pl-1">Location</p>
                          <p className="text-sm font-bold text-gray-800 dark:text-white bg-gray-50 dark:bg-gray-800/50 px-3 py-2 rounded-lg border border-gray-100 dark:border-gray-800">{event?.location || 'Not set'}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/events/${eventId}/edit`)}
                        className="w-full mt-6 text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 py-3 border-t border-gray-50 dark:border-gray-800 text-center transition-colors"
                      >
                        Edit Event Info
                      </button>
                    </Accordion>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState
                icon={BarChart2}
                heading="No data yet"
                subtext="Add invite categories and people to see the dashboard."
                actions={<Button icon={Plus} onClick={() => setActiveTab('categories')}>Go to Categories</Button>}
              />
            )}
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="p-4 md:px-8 md:py-8 max-w-7xl mx-auto w-full space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight">Invite Categories</h2>
                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-widest">
                  {enriched.length} categories · {enriched.reduce((s, c) => s + c.peopleCount, 0)} total people
                </p>
              </div>
            </div>

            {enriched.length > 0 && (
              <div className="relative mb-6 max-w-sm group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 transition-colors group-focus-within:text-indigo-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search categories..."
                  className="w-full pl-11 pr-4 py-2.5 text-xs font-bold border border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all dark:placeholder:text-gray-700 shadow-sm group-hover:shadow-md"
                />
              </div>
            )}

            {filtered.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map(cat => (
                  <div
                    key={cat.id}
                    className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 hover:border-indigo-200 dark:hover:border-indigo-900 hover:shadow-xl hover:shadow-indigo-500/10 transition-all relative overflow-hidden cursor-pointer"
                    onClick={() => handleOpen(cat)}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="text-base font-black text-gray-900 dark:text-white truncate">{cat.name}</h3>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          onClick={e => { e.stopPropagation(); setEditingCategory(cat); setIsModalOpen(true); }}
                          className="flex items-center gap-1.5 px-3 py-2 text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-black uppercase tracking-widest leading-none">Edit</span>
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); setDeletingCategory(cat); }}
                          className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    {cat.description && (
                      <p className="text-xs font-bold text-gray-400 dark:text-gray-500 mb-4 line-clamp-2 uppercase tracking-widest">{cat.description}</p>
                    )}

                    {cat.inviteMessage && (
                      <div className="mb-4 bg-gray-50/50 dark:bg-gray-800/30 rounded-xl p-3 border border-gray-100 dark:border-gray-800/50">
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                          <MessageSquare className="w-2.5 h-2.5" /> Invite Message
                        </p>
                        <p className={clsx(
                          "text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-bold",
                          !expandedMessages[cat.id] && "line-clamp-2"
                        )}>
                          {cat.inviteMessage}
                        </p>
                        {(cat.inviteMessage.split('\n').length > 2 || cat.inviteMessage.length > 80) && (
                          <button 
                            onClick={(e) => toggleExpand(e, cat.id)}
                            className="mt-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
                          >
                            {expandedMessages[cat.id] ? 'Show Less' : 'Read More'}
                            <BookOpen className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    )}

                    {cat.attachments && cat.attachments.length > 0 && (
                      <div className="mb-4">
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2 flex items-center gap-1.5">
                          <Paperclip className="w-2.5 h-2.5" /> Attachments ({cat.attachments.length})
                        </p>
                        <div className="space-y-1.5">
                          {cat.attachments.slice(0, 3).map(att => (
                            <div key={att.id} className="flex items-center justify-between gap-2 p-1.5 bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-lg group/att">
                              <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400 truncate flex-1">{att.name}</span>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handlePreview(att); }}
                                className="p-1 px-2 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-gray-900 transition-all flex items-center gap-1 text-[9px] font-black uppercase tracking-widest border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900/50"
                              >
                                Preview <Eye className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          ))}
                          {cat.attachments.length > 3 && (
                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest ml-1">+{cat.attachments.length - 3} more files</p>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-4 pt-5 border-t border-gray-50 dark:border-gray-800">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">
                        <Users className="w-3.5 h-3.5 text-gray-400 dark:text-gray-600" />
                        <span>{cat.peopleCount} people</span>
                      </div>
                      <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 group-hover:gap-2 transition-all">
                        Manage <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))}

              </div>
            ) : (
              <EmptyState
                icon={Grid3x3}
                heading={searchTerm ? 'No categories matched' : 'No invite categories yet'}
                subtext="Create invite categories like 'Friends', 'Family', or 'Colleagues' to organise your invite list."
                actions={!searchTerm && (
                  <Button 
                    icon={Plus} 
                    size="lg"
                    onClick={() => { setEditingCategory(null); setIsModalOpen(true); }}
                    className="shadow-xl shadow-indigo-500/20 px-8 py-6 text-sm"
                  >
                    Add First Invite Category
                  </Button>
                )}
              />
            )}
          </div>
        )}

        {activeTab === 'tasks' && (
          <TasksTab eventId={eventId} />
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
