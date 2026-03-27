import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Users, Search, Filter, Download, Trash2, ArrowLeft, Upload } from 'lucide-react';
import { getPeopleByCategory, bulkDeletePeople } from '../db/peopleDb';
import { getColumnsByEvent } from '../db/columnsDb';
import { getCategoryById } from '../db/categoriesDb';
import { getEventById } from '../db/eventsDb';
import { useUIStore } from '../store/uiStore';
import { useEventStore } from '../store/eventStore';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { PersonModal } from '../components/people/PersonModal';
import { ImportModal } from '../components/people/ImportModal';
import { PeopleTable } from '../components/people/PeopleTable';
import { PeopleFilters } from '../components/people/PeopleFilters';
import { exportToExcel } from '../utils/excel';
import { Spinner } from '../components/ui/Spinner';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

export default function PeopleListPage() {
  const { eventId, categoryId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useUIStore();
  const { currentEvent, setCurrentEvent, currentCategory, setCurrentCategory } = useEventStore();

  const [people, setPeople] = useState([]);
  const [columns, setColumns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [selectedIds, setSelectedIds] = useState([]);
  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [showBulkDelete, setShowBulkDelete] = useState(false);

  async function fetchData() {
    try {
      // 1. Ensure Event context
      if (!currentEvent || currentEvent.id !== eventId) {
        const event = await getEventById(eventId);
        if (!event) { navigate('/events'); return; }
        setCurrentEvent(event);
      }
      // 2. Ensure Category context
      if (!currentCategory || currentCategory.id !== categoryId) {
        const category = await getCategoryById(categoryId);
        if (!category) { navigate(`/events/${eventId}/categories`); return; }
        setCurrentCategory(category);
      }
      // 3. Fetch Columns and People
      const [cols, gests] = await Promise.all([
        getColumnsByEvent(eventId),
        getPeopleByCategory(categoryId)
      ]);
      setColumns(cols.sort((a, b) => a.order - b.order));
      setPeople(gests.sort((a, b) => a.name.localeCompare(b.name)));
    } catch {
      addToast('Error loading data', 'error');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [eventId, categoryId]);

  const filteredPeople = people.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilters = Object.entries(filters).every(([colId, value]) => {
      if (!value) return true;
      return p.dynamicFields[colId] === value;
    });
    return matchesSearch && matchesFilters;
  });

  async function handleBulkDelete() {
    try {
      await bulkDeletePeople(selectedIds);
      addToast(`Deleted ${selectedIds.length} guests`);
      setSelectedIds([]);
      fetchData();
    } catch {
      addToast('Error during bulk delete', 'error');
    }
  }

  function handleExport() {
    try {
      const fileName = `${currentEvent?.title}_${currentCategory?.name}_Guests`.replace(/[^a-z0-9]/gi, '_');
      exportToExcel(filteredPeople, columns, fileName);
      addToast('Export started');
    } catch {
      addToast('Export failed', 'error');
    }
  }

  if (isLoading && (!currentEvent || !currentCategory)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header Area */}
      <div className="p-4 md:p-6 border-b border-gray-200">
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
           <span className="hover:text-indigo-600 cursor-pointer" onClick={() => navigate('/events')}>Events</span>
           <span>/</span>
           <span className="hover:text-indigo-600 cursor-pointer" onClick={() => navigate(`/events/${eventId}/categories`)}>{currentEvent?.title}</span>
           <span>/</span>
           <span className="font-medium text-gray-900">{currentCategory?.name}</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: currentCategory?.color + '20', color: currentCategory?.color }}>
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{currentCategory?.name}</h1>
              <p className="text-xs text-gray-500">{people.length} Guests total</p>
            </div>
          </div>
          <div className="flex gap-2">
            {selectedIds.length > 0 && (
              <Button 
                variant="danger" 
                icon={Trash2} 
                onClick={() => setShowBulkDelete(true)}
              >
                Delete ({selectedIds.length})
              </Button>
            )}
            <Button variant="secondary" icon={Upload} onClick={() => setIsImportModalOpen(true)}>Import</Button>
            <Button variant="secondary" icon={Download} onClick={handleExport} disabled={filteredPeople.length === 0}>Export</Button>
            <Button icon={Plus} onClick={() => setIsPersonModalOpen(true)}>Add Guest</Button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-4 py-3 md:px-6 bg-gray-50 border-b border-gray-200 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by name..." 
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <PeopleFilters 
          columns={columns} 
          filters={filters} 
          setFilters={setFilters} 
          people={people} 
        />
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-12 bg-gray-50 animate-pulse rounded-lg" />)}
          </div>
        ) : filteredPeople.length > 0 ? (
          <PeopleTable 
            people={filteredPeople} 
            columns={columns} 
            selectedIds={selectedIds}
            onSelect={setSelectedIds}
            onEdit={(p) => { setEditingPerson(p); setIsPersonModalOpen(true); }}
            onRefresh={fetchData}
          />
        ) : (
          <EmptyState
            icon={Users}
            heading={searchTerm || Object.values(filters).some(v => v) ? "No matching guests" : "No guests yet"}
            subtext={searchTerm || Object.values(filters).some(v => v) ? "Try clearing filters or search term" : "Start adding guests to this category."}
            actions={!searchTerm && !Object.values(filters).some(v => v) && (
              <Button icon={Plus} onClick={() => setIsPersonModalOpen(true)}>Add Guest</Button>
            )}
          />
        )}
      </div>

      <PersonModal 
        isOpen={isPersonModalOpen} 
        onClose={() => { setIsPersonModalOpen(false); setEditingPerson(null); }}
        onSuccess={fetchData}
        person={editingPerson}
        categoryId={categoryId}
        eventId={eventId}
        columns={columns}
      />

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={fetchData}
        eventId={eventId}
        categoryId={categoryId}
        columns={columns}
      />

      <ConfirmDialog
        isOpen={showBulkDelete}
        onClose={() => setShowBulkDelete(false)}
        onConfirm={handleBulkDelete}
        title="Delete Multiple Guests"
        message={`Are you sure you want to delete ${selectedIds.length} selected guests? This action cannot be undone.`}
        confirmLabel="Delete Selected"
      />
    </div>
  );
}
