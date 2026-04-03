import { useState, useEffect } from 'react';
import { v4 as uuid } from 'uuid';
import { Plus, Settings2, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { getColumnsByCategory, createColumn, updateColumn, deleteColumn } from '../../db/columnsDb';
import { removeFieldKeyFromAllPeople } from '../../db/peopleDb';
import { ColumnItem } from '../config/ColumnItem';
import { ColumnFormModal } from '../config/ColumnFormModal';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import clsx from 'clsx';

export function ColumnConfigTab({ eventId, categoryId, category }) {
  const { user } = useAuthStore();
  const { addToast } = useUIStore();
  const [isToolbarVisible, setIsToolbarVisible] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [columns, setColumns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingColumn, setEditingColumn] = useState(null);
  const [deletingColumn, setDeletingColumn] = useState(null);

  useEffect(() => { load(); }, [categoryId]);

  async function load() {
    setIsLoading(true);
    try {
      let dbCols = await getColumnsByCategory(categoryId);
      
      // Check if system name column exists in DB
      let systemNameCol = dbCols.find(c => c.fieldKey === 'name' || c.id === 'system-name');
      if (!systemNameCol) {
        systemNameCol = {
          id: `system-name-${categoryId}`,
          categoryId,
          eventId,
          userId: user.id,
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
        await createColumn(systemNameCol);
        dbCols.push(systemNameCol);
      }

      // Check if system actions column exists in DB
      let systemActionsCol = dbCols.find(c => c.id === `system-actions-${categoryId}`);
      if (!systemActionsCol) {
        systemActionsCol = {
          id: `system-actions-${categoryId}`,
          categoryId,
          eventId,
          userId: user.id,
          label: 'Action Column',
          type: 'text',
          isSystem: true,
          isFrozen: false, 
          isVisible: true,
          fieldKey: 'actions',
          sortOrder: 1000, // Always last
          width: 120,
          createdAt: new Date().toISOString(),
        };
        await createColumn(systemActionsCol);
        dbCols.push(systemActionsCol);
      }
      
      setColumns(dbCols.sort((a, b) => a.sortOrder - b.sortOrder));
    } catch (err) {
      console.error('Column load error:', err);
      addToast('Failed to load columns', 'error');
    } finally {
      setIsLoading(false);
    }
  }

  async function moveColumn(columnId, direction) {
    const index = columns.findIndex(c => c.id === columnId);
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= columns.length) return;
    
    const updated = [...columns];
    const tempOrder = updated[index].sortOrder;
    updated[index] = { ...updated[index], sortOrder: updated[swapIndex].sortOrder };
    updated[swapIndex] = { ...updated[swapIndex], sortOrder: tempOrder };
    
    // Sort locally for immediate feedback
    const sorted = [...updated].sort((a, b) => a.sortOrder - b.sortOrder);
    setColumns(sorted);

    try {
      await Promise.all([
        updateColumn(updated[index]),
        updateColumn(updated[swapIndex])
      ]);
    } catch {
      addToast('Failed to save new order', 'error');
      load();
    }
  }

  async function handleSave(formData) {
    try {
      if (editingColumn) {
        const updated = { ...editingColumn, ...formData };
        await updateColumn(updated);
        setColumns(prev => prev.map(c => c.id === updated.id ? updated : c).sort((a, b) => a.sortOrder - b.sortOrder));
        addToast('Column updated');
      } else {
        const maxOrder = columns.length > 0 ? Math.max(...columns.map(c => c.sortOrder)) : -1;
        const newCol = {
          id: uuid(),
          categoryId,
          eventId,
          userId: user.id,
          ...formData,
          isSystem: false,
          sortOrder: maxOrder + 1,
          createdAt: new Date().toISOString(),
        };
        await createColumn(newCol);
        setColumns(prev => [...prev, newCol].sort((a, b) => a.sortOrder - b.sortOrder));
        addToast('Column added');
      }
      setShowModal(false);
      setEditingColumn(null);
    } catch {
      addToast('Failed to save column', 'error');
    }
  }

  async function handleDelete() {
    if (!deletingColumn) return;
    try {
      await deleteColumn(deletingColumn.id);
      await removeFieldKeyFromAllPeople(categoryId, deletingColumn.fieldKey);
      setColumns(prev => prev.filter(c => c.id !== deletingColumn.id));
      addToast('Column deleted');
    } catch {
      addToast('Failed to delete column', 'error');
    } finally {
      setDeletingColumn(null);
    }
  }

  const filteredColumns = columns.filter(col => 
    col.label?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    col.fieldKey?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return <div className="flex justify-center py-12"><Spinner /></div>;

  return (
    <div className="flex flex-col">
      {/* Header Row */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight">Field Configuration</h2>
          <p className="text-xs font-bold text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-widest leading-none">
            {columns.length} total fields
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

      {/* Action and Search Row */}
      <div className={clsx(
        "transition-all duration-300 overflow-hidden",
        isToolbarVisible ? "opacity-100 mb-8 max-h-[500px]" : "max-h-0 opacity-0 pointer-events-none"
      )}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative max-w-sm w-full group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-600 group-hover:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder="Search fields..."
              className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl text-sm font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all shadow-sm"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Button 
            icon={Plus} 
            size="sm" 
            onClick={() => { setEditingColumn(null); setShowModal(true); }}
            className="h-10 text-[10px] md:text-xs shadow-lg shadow-indigo-500/20"
          >
            Add Field
          </Button>
        </div>
      </div>

      {/* Grid Area */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-40 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
            <tr>
              <th className="w-16 px-4 py-5 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center">Order</th>
              <th className="px-6 py-5 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-left">Field Name & Type</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-left hidden md:table-cell">Field ID</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-left hidden lg:table-cell">Status</th>
              <th className="w-28 px-6 py-5 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredColumns.map((col, i) => (
              <ColumnItem
                key={col.id}
                column={col}
                isFirst={i === 0}
                isLast={i === filteredColumns.length - 1}
                onMoveUp={() => moveColumn(col.id, 'up')}
                onMoveDown={() => moveColumn(col.id, 'down')}
                onEdit={c => { setEditingColumn(c); setShowModal(true); }}
                onDelete={c => setDeletingColumn(c)}
              />
            ))}
          </tbody>
        </table>

        {columns.length === 0 && (
          <div className="text-center py-20 bg-white dark:bg-gray-950 flex flex-col items-center justify-center">
            <div className="w-20 h-20 rounded-[2.5rem] bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 flex items-center justify-center mb-6 shadow-inner">
              <Settings2 className="w-10 h-10 text-gray-200 dark:text-gray-700" />
            </div>
            <p className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">No custom fields yet</p>
            <p className="text-xs font-bold text-gray-400 dark:text-gray-600 mt-2 max-w-[240px] mx-auto uppercase tracking-widest leading-loose">Click "Add Field" to start building your guest list columns.</p>
          </div>
        )}
      </div>

      <ColumnFormModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingColumn(null); }}
        onSave={handleSave}
        editingColumn={editingColumn}
        existingColumns={columns}
      />

      <ConfirmDialog
        isOpen={!!deletingColumn}
        onClose={() => setDeletingColumn(null)}
        onConfirm={handleDelete}
        title="Delete Field?"
        message={`Deleting "${deletingColumn?.label}" will permanently remove all data stored in this field for all guests in this category.`}
        confirmLabel="Yes, Delete Field"
      />
    </div>
  );
}
