import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Plus, Upload, Download, Trash2, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { getPeopleByCategory, bulkDeletePeople, updatePerson } from '../../db/peopleDb';
import { getColumnsByCategory, updateColumn, createColumn } from '../../db/columnsDb';
import { getEventById } from '../../db/eventsDb';
import { getCategoryById } from '../../db/categoriesDb';
import { validateEmail, validatePhone } from '../../utils/validation';
import { useUIStore } from '../../store/uiStore';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { Spinner } from '../ui/Spinner';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { PeopleTable } from '../people/PeopleTable';
import { PeopleFilters } from '../people/PeopleFilters';
import { PersonModal } from '../people/PersonModal';
import { ImportModal } from '../people/ImportModal';
import { GlobalPeopleImportModal } from '../../pages/GlobalPeopleImportModal';
import { Tooltip } from '../ui/Tooltip';
import { exportToExcel } from '../../utils/excel';
import { Badge } from '../ui/Badge';
import clsx from 'clsx';

export function PeopleListTab({ eventId, categoryId, category: initialCategory }) {
  const { addToast } = useUIStore();
  const [isToolbarVisible, setIsToolbarVisible] = useState(true);
  const [people, setPeople] = useState([]);
  const [columns, setColumns] = useState([]);
  const [nameWidth, setNameWidth] = useState(180);
  const [isNameFrozen, setIsNameFrozen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [category, setCategory] = useState(initialCategory);

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [selectedIds, setSelectedIds] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isGlobalImportModalOpen, setIsGlobalImportModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [showBulkDelete, setShowBulkDelete] = useState(false);

  const fetchData = useCallback(async () => {
    if (!categoryId) return;
    setIsLoading(true);
    try {
      const [dbCols, guests, ev, cat] = await Promise.all([
        getColumnsByCategory(categoryId),
        getPeopleByCategory(categoryId),
        getEventById(eventId),
        getCategoryById(categoryId)
      ]);

      // Handle system columns sync (ensure they exist in DB)
      let updatedCols = [...dbCols];
      let needsUpdate = false;

      let nameCol = updatedCols.find(c => c.fieldKey === 'name' || c.id === `system-name-${categoryId}`);
      if (!nameCol) {
        nameCol = {
          id: `system-name-${categoryId}`,
          categoryId,
          eventId,
          userId: (await import('../../store/authStore')).useAuthStore.getState().user.id,
          label: 'Name',
          type: 'text',
          isSystem: true,
          isFrozen: true,
          isVisible: true,
          fieldKey: 'name',
          sortOrder: -100,
          width: 200,
          createdAt: new Date().toISOString(),
        };
        await createColumn(nameCol);
        updatedCols.push(nameCol);
      }

      let actionCol = updatedCols.find(c => c.fieldKey === 'actions' || c.id === `system-actions-${categoryId}`);
      if (!actionCol) {
        actionCol = {
          id: `system-actions-${categoryId}`,
          categoryId,
          eventId,
          userId: (await import('../../store/authStore')).useAuthStore.getState().user.id,
          label: 'Action Column',
          type: 'text',
          isSystem: true,
          isFrozen: false,
          isVisible: true,
          fieldKey: 'actions',
          sortOrder: 1000,
          width: 120,
          createdAt: new Date().toISOString(),
        };
        await createColumn(actionCol);
        updatedCols.push(actionCol);
      }
      
      setNameWidth(nameCol.width || 180);
      setIsNameFrozen(!!nameCol.isFrozen);

      setColumns(updatedCols);
      setPeople(guests.sort((a, b) => a.name.localeCompare(b.name)));
      setEvent(ev);
      setCategory(cat);
    } catch (err) {
      console.error('Data load error:', err);
      addToast('Error loading people list', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [categoryId, eventId, addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Inline cell auto-save ─────────────────────────────────────────────────
  const handleCellChange = useCallback(async (personId, fieldKey, newValue) => {
    // ── Validation ──────────────────────────────────────────────────────────
    const column = columns.find(c => c.id === fieldKey);
    if (column) {
      if (column.type === 'email') {
        const res = validateEmail(newValue);
        if (!res.isValid) { addToast(res.error, 'warning'); return; }
      }
      if (column.type === 'phone') {
        const res = validatePhone(newValue);
        if (!res.isValid) { addToast(res.error, 'warning'); return; }
      }
    }

    // Optimistic local update first
    setPeople(prev => prev.map(p => {
      if (p.id !== personId) return p;
      if (fieldKey === 'name') {
        return { ...p, name: newValue, updatedAt: new Date().toISOString() };
      }
      return {
        ...p,
        dynamicFields: { ...p.dynamicFields, [fieldKey]: newValue },
        updatedAt: new Date().toISOString(),
      };
    }));

    // Persist to DB
    try {
      const person = people.find(p => p.id === personId);
      if (!person) return;
      const updated = fieldKey === 'name'
        ? { ...person, name: newValue, updatedAt: new Date().toISOString() }
        : {
          ...person,
          dynamicFields: { ...person.dynamicFields, [fieldKey]: newValue },
          updatedAt: new Date().toISOString(),
        };
      await updatePerson(updated);
    } catch {
      addToast('Failed to save change', 'error');
      fetchData(); // rollback on error
    }
  }, [people, columns, addToast, fetchData]);

  // ── Row toggles (Lock/Export) ─────────────────────────────────────────────
  const handleToggleRow = useCallback(async (personId, field) => {
    setPeople(prev => prev.map(p => {
      if (p.id !== personId) return p;
      return { ...p, [field]: !p[field], updatedAt: new Date().toISOString() };
    }));

    try {
      const person = people.find(p => p.id === personId);
      if (person) {
        await updatePerson({ ...person, [field]: !person[field], updatedAt: new Date().toISOString() });
      }
    } catch {
      addToast('Failed to update status', 'error');
      fetchData();
    }
  }, [people, addToast, fetchData]);

  // ── Column resizing ────────────────────────────────────────────────────────
  const handleColumnResize = useCallback(async (colId, newWidth) => {
    const isAction = colId === 'actions' || colId === 'system-actions' || colId.startsWith('system-actions-');
    const col = columns.find(c => c.id === colId || (colId === 'system-name' && c.fieldKey === 'name') || (isAction && c.fieldKey === 'actions'));
    
    if (colId === 'system-name' || col?.fieldKey === 'name') {
      setNameWidth(newWidth);
    }

    setColumns(prev => prev.map(c => (c.id === colId || (colId === 'system-name' && c.fieldKey === 'name') || (isAction && c.fieldKey === 'actions')) ? { ...c, width: newWidth } : c));

    if (col) {
      try {
        await updateColumn({ ...col, width: newWidth });
      } catch (err) {
        console.error('Resize save error:', err);
      }
    }
  }, [columns]);

  const handleTogglePin = useCallback(async (colId) => {
    const isName = colId === 'system-name';
    const isAction = colId === 'actions' || colId === 'system-actions' || colId.startsWith('system-actions-');
    
    const col = columns.find(c => 
      c.id === colId || 
      (isName && c.fieldKey === 'name') ||
      (isAction && c.fieldKey === 'actions')
    );
    if (!col) return;

    const nextFrozen = !col.isFrozen;
    
    // Update local state
    if (col.fieldKey === 'name') {
      setIsNameFrozen(nextFrozen);
    }
    setColumns(prev => prev.map(c => c.id === col.id ? { ...c, isFrozen: nextFrozen } : c));

    try {
      await updateColumn({ ...col, isFrozen: nextFrozen });
    } catch (err) {
      addToast('Failed to toggle pin', 'error');
      fetchData();
    }
  }, [columns, fetchData, addToast]);

  // ── Filtering & Sorting ──────────────────────────────────────────────────
  const filteredAndSortedPeople = useMemo(() => {
    let result = people.filter(p => {
      const matchesSearch = (p.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilters = Object.entries(filters).every(([colId, value]) => {
        if (!value) return true;
        const personVal = p.dynamicFields?.[colId];
        if (Array.isArray(personVal)) return personVal.includes(value);
        return personVal === value;
      });
      return matchesSearch && matchesFilters;
    });

    if (sortConfig.key) {
      result.sort((a, b) => {
        let aVal, bVal;
        if (sortConfig.key === 'name') {
          aVal = a.name || '';
          bVal = b.name || '';
        } else {
          aVal = a.dynamicFields?.[sortConfig.key] || '';
          bVal = b.dynamicFields?.[sortConfig.key] || '';
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [people, searchTerm, filters, sortConfig]);

  const handleSort = useCallback((key) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        if (prev.direction === 'asc') return { key, direction: 'desc' };
        return { key: null, direction: 'asc' };
      }
      return { key, direction: 'asc' };
    });
  }, []);

  async function handleBulkDelete() {

    try {
      await bulkDeletePeople(selectedIds);
      addToast(`Deleted ${selectedIds.length} people`);
      setSelectedIds([]);
      fetchData();
    } catch {
      addToast('Deletion failed', 'error');
    } finally {
      setShowBulkDelete(false);
    }
  }

  function handleExport() {
    try {
      exportToExcel(filteredAndSortedPeople, columns, 'Guests_List');
      addToast('Export started');
    } catch {
      addToast('Export failed', 'error');
    }
  }

  if (isLoading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>;

  return (
    <div className="flex flex-col">
      {/* Header Row */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight">Invite List</h2>
          <p className="text-xs font-bold text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-widest leading-none">
            {people.length} people total
          </p>
        </div>
        <button
          onClick={() => setIsToolbarVisible(!isToolbarVisible)}
          className={clsx(
            'flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all font-black text-[10px] uppercase tracking-widest shadow-sm h-9',
            isToolbarVisible
              ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-900/30 text-indigo-700 dark:text-indigo-400'
              : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
          )}
        >
          <span>Toolbar</span>
          {isToolbarVisible ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Search and Filters Toolbar */}
      <div className={clsx(
        "transition-all duration-300 overflow-hidden",
        isToolbarVisible ? "opacity-100 mb-8 max-h-[500px]" : "max-h-0 opacity-0 pointer-events-none"
      )}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-[200px]">
            {selectedIds.length > 0 && (
              <Button
                variant="danger"
                icon={Trash2}
                size="sm"
                onClick={() => setShowBulkDelete(true)}
                className="h-10 text-[10px] md:text-xs px-4"
              >
                Delete ({selectedIds.length})
              </Button>
            )}
            <div className="relative max-w-sm w-full group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-600 group-hover:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="Search guests..."
                className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl text-sm font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all shadow-sm"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <PeopleFilters columns={columns} filters={filters} setFilters={setFilters} people={people} />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Tooltip content="Import from People" position="bottom">
              <Button variant="secondary" size="sm" icon={Users} onClick={() => setIsGlobalImportModalOpen(true)} className="h-10 text-[10px] md:text-xs">
                <span className="hidden lg:inline">Device</span>
              </Button>
            </Tooltip>
            <Tooltip content="Import CSV" position="bottom">
              <Button variant="secondary" size="sm" icon={Upload} onClick={() => setIsImportModalOpen(true)} className="h-10 text-[10px] md:text-xs">
                <span className="hidden lg:inline">Import</span>
              </Button>
            </Tooltip>
            <Tooltip content="Export to Excel" position="bottom">
              <Button variant="secondary" size="sm" icon={Download} onClick={handleExport} disabled={filteredAndSortedPeople.length === 0} className="h-10 text-[10px] md:text-xs">
                <span className="hidden lg:inline">Export</span>
              </Button>
            </Tooltip>

            <Button size="sm" icon={Plus} onClick={() => { setEditingPerson(null); setIsPersonModalOpen(true); }} className="h-10 text-[10px] md:text-xs shadow-lg shadow-indigo-500/20">
              <span>Add Person</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto pb-24">
        {filteredAndSortedPeople.length > 0 ? (
          <PeopleTable
            people={filteredAndSortedPeople}
            columns={columns}
            nameWidth={nameWidth}
            isNameFrozen={isNameFrozen}
            selectedIds={selectedIds}
            onSelect={setSelectedIds}
            onEdit={p => { setEditingPerson(p); setIsPersonModalOpen(true); }}
            onRefresh={fetchData}
            onCellChange={handleCellChange}
            onColumnResize={handleColumnResize}
            onSort={handleSort}
            sortConfig={sortConfig}
            onToggleRow={handleToggleRow}
            onTogglePin={handleTogglePin}
            onAddGuest={() => { setEditingPerson(null); setIsPersonModalOpen(true); }}
            event={event}
            category={category}
          />
        ) : (
          <EmptyState
            icon={Users}
            heading={searchTerm || Object.values(filters).some(v => v) ? "No people found" : "No people yet"}
            subtext="Add your first person to start building the list."
            actions={!searchTerm && !Object.values(filters).some(v => v) && (
              <Button icon={Plus} onClick={() => setIsPersonModalOpen(true)}>Add First Person</Button>
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

      <GlobalPeopleImportModal
        isOpen={isGlobalImportModalOpen}
        onClose={() => setIsGlobalImportModalOpen(false)}
        onSuccess={fetchData}
        eventId={eventId}
        categoryId={categoryId}
        columns={columns}
      />

      <ConfirmDialog
        isOpen={showBulkDelete}
        onClose={() => setShowBulkDelete(false)}
        onConfirm={handleBulkDelete}
        title="Delete Selected People?"
        message={`This will permanently delete ${selectedIds.length} person${selectedIds.length > 1 ? 's' : ''} and all their data.`}
        confirmLabel="Yes, Delete"
      />
    </div>
  );
}
