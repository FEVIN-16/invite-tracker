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

export function ColumnConfigTab({ eventId, categoryId }) {
  const { user } = useAuthStore();
  const { addToast } = useUIStore();
  const [columns, setColumns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingColumn, setEditingColumn] = useState(null);
  const [deletingColumn, setDeletingColumn] = useState(null);

  useEffect(() => { load(); }, [categoryId]);

  async function load() {
    setIsLoading(true);
    try {
      const dbCols = await getColumnsByCategory(categoryId);
      // Prepend system column "Name" as per requirements
      const systemNameCol = {
        id: 'system-name',
        label: 'Name',
        type: 'text',
        isSystem: true,
        fieldKey: 'name',
        sortOrder: -1,
        width: 200
      };
      setColumns([systemNameCol, ...dbCols]);
    } catch {
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
    <div className="max-w-2xl mx-auto p-4 md:p-6 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Field Configuration</h2>
          <p className="text-sm text-gray-500 mt-1">Customize the data you track for this category</p>
        </div>
        <Button icon={Plus} onClick={() => { setEditingColumn(null); setShowModal(true); }}>Add Field</Button>
      </div>

      <div className="space-y-3">
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
        {columns.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
            <Settings2 className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-sm text-gray-400 font-medium">No custom fields yet.</p>
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
