import { useState, useEffect } from 'react';
import { v4 as uuid } from 'uuid';
import { Plus, Settings2 } from 'lucide-react';
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

export function ColumnConfigTab({ eventId, categoryId }) {
  const { user } = useAuthStore();
  const { addToast, isToolbarVisible } = useUIStore();
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

  if (isLoading) return <div className="flex justify-center py-12"><Spinner /></div>;

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white">
      {/* Collapsible Toolbar */}
      <div className={clsx(
        "border-b border-gray-100 bg-white sticky top-0 z-50 transition-all duration-300 overflow-hidden",
        isToolbarVisible ? "opacity-100 py-3" : "h-0 py-0 opacity-0 pointer-events-none"
      )}>
        <div className="px-4 md:px-6 flex items-center justify-end">
          <Button icon={Plus} size="sm" onClick={() => { setEditingColumn(null); setShowModal(true); }}>Add Field</Button>
        </div>
      </div>

      {/* Grid Area */}
      <div className="flex-1 overflow-auto pb-24">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-40 bg-gray-50 border-b border-gray-200">
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="w-16 px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Order</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Field Name & Type</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Field ID</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Status</th>
              <th className="w-28 px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {columns.map((col, i) => (
              <ColumnItem
                key={col.id}
                column={col}
                isFirst={i === 0}
                isLast={i === columns.length - 1}
                onMoveUp={() => moveColumn(col.id, 'up')}
                onMoveDown={() => moveColumn(col.id, 'down')}
                onEdit={c => { setEditingColumn(c); setShowModal(true); }}
                onDelete={c => setDeletingColumn(c)}
              />
            ))}
          </tbody>
        </table>

        {columns.length === 0 && (
          <div className="text-center py-20 bg-white flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-3xl bg-gray-50 flex items-center justify-center mb-4">
              <Settings2 className="w-8 h-8 text-gray-200" />
            </div>
            <p className="text-base font-bold text-gray-400">No custom fields yet.</p>
            <p className="text-sm text-gray-300 mt-1 max-w-[200px] mx-auto">Click "Add Field" to start building your guest list columns.</p>
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
