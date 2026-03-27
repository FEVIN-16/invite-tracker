import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Grid3x3, Search, ChevronRight, ArrowLeft, Calendar, Tag, Users, Edit2 } from 'lucide-react';
import { getCategoriesByEvent } from '../db/categoriesDb';
import { getEventById } from '../db/eventsDb';
import { getPeopleByCategory } from '../db/peopleDb';
import { useUIStore } from '../store/uiStore';
import { useEventStore } from '../store/eventStore';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { CategoryModal } from '../components/categories/CategoryModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Spinner } from '../components/ui/Spinner';
import { deleteCategory } from '../db/categoriesDb';
import clsx from 'clsx';

export default function CategoriesPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useUIStore();
  const { currentEvent, setCurrentEvent, setCurrentCategory } = useEventStore();

  const [event, setEvent] = useState(null);
  const [categories, setCategories] = useState([]);
  const [enriched, setEnriched] = useState([]); // with peopleCount
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deletingCategory, setDeletingCategory] = useState(null);

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
      setCategories(sorted);

      // Enrich with guest counts
      const counts = await Promise.all(sorted.map(c => getPeopleByCategory(c.id)));
      setEnriched(sorted.map((c, i) => ({ ...c, peopleCount: counts[i].length })));
    } catch {
      addToast('Error loading categories', 'error');
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
        {/* Breadcrumb */}
        <button
          onClick={() => navigate('/events')}
          className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-widest mb-5 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to My Events
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-200">
              <Calendar className="w-8 h-8 text-white" />
            </div>
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
            <Button
              variant="secondary"
              size="sm"
              icon={Edit2}
              onClick={() => navigate(`/events/${eventId}/edit`)}
            >
              Edit Event
            </Button>
            <Button icon={Plus} onClick={() => { setEditingCategory(null); setIsModalOpen(true); }}>
              Add Category
            </Button>
          </div>
        </div>
      </div>

      {/* Categories Section */}
      <div className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-black text-gray-900">Guest Categories</h2>
            <p className="text-sm text-gray-400 mt-0.5">{enriched.length} categories · {enriched.reduce((s, c) => s + c.peopleCount, 0)} total guests</p>
          </div>
        </div>

        {/* Search */}
        {enriched.length > 0 && (
          <div className="relative mb-6 max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search categories..."
              className="w-full pl-11 pr-4 py-2.5 text-sm border border-gray-200 rounded-2xl bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
        )}

        {/* Category Cards Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(cat => (
              <div
                key={cat.id}
                className="group bg-white border border-gray-200 rounded-3xl p-5 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50 transition-all relative overflow-hidden cursor-pointer"
                onClick={() => handleOpen(cat)}
              >
                {/* Color accent */}
                <div
                  className="absolute top-0 right-0 w-28 h-28 -mr-10 -mt-10 rounded-full opacity-5 group-hover:opacity-10 transition-opacity"
                  style={{ backgroundColor: cat.color }}
                />

                <div className="flex items-start justify-between mb-5">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                  >
                    <Tag className="w-6 h-6" />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={e => { e.stopPropagation(); setEditingCategory(cat); setIsModalOpen(true); }}
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setDeletingCategory(cat); }}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-black text-gray-900 mb-1 truncate">{cat.name}</h3>
                {cat.description && (
                  <p className="text-sm text-gray-400 mb-3 line-clamp-1">{cat.description}</p>
                )}

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-gray-500">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span>{cat.peopleCount} guests</span>
                  </div>
                  <span className="flex items-center gap-1 text-xs font-black text-indigo-600 group-hover:gap-2 transition-all">
                    Manage <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}

            {/* Add Category Card */}
            <button
              onClick={() => { setEditingCategory(null); setIsModalOpen(true); }}
              className="border-2 border-dashed border-gray-200 rounded-3xl p-5 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all flex flex-col items-center justify-center gap-3 min-h-[160px] group"
            >
              <div className="w-12 h-12 rounded-2xl bg-gray-100 group-hover:bg-indigo-100 flex items-center justify-center transition-colors">
                <Plus className="w-6 h-6 text-gray-400 group-hover:text-indigo-600 transition-colors" />
              </div>
              <span className="text-sm font-bold text-gray-400 group-hover:text-indigo-600 transition-colors">Add Category</span>
            </button>
          </div>
        ) : (
          <EmptyState
            icon={Grid3x3}
            heading={searchTerm ? "No categories matched" : "No categories yet"}
            subtext="Create your first guest category like 'Family', 'Friends', or 'Colleagues' to start organizing your invites."
            actions={!searchTerm && (
              <Button icon={Plus} onClick={() => { setEditingCategory(null); setIsModalOpen(true); }}>
                Add First Category
              </Button>
            )}
          />
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
        message={`Delete "${deletingCategory?.name}"? This will remove all guests in this category.`}
        confirmLabel="Yes, Delete"
      />
    </div>
  );
}
