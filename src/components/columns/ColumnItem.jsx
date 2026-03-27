import { GripVertical, Edit3, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '../ui/Badge';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { deleteColumn } from '../../db/columnsDb';
import { useUIStore } from '../../store/uiStore';
import { COLUMN_TYPES } from '../../utils/constants';

export function ColumnItem({ column, index, isFirst, isLast, onEdit, onMove, onRefresh }) {
  const { addToast } = useUIStore();
  const [showDelete, setShowDelete] = useState(false);
  const typeLabel = COLUMN_TYPES.find(t => t.value === column.type)?.label || column.type;

  async function handleDelete() {
    try {
      await deleteColumn(column.id);
      addToast('Column deleted');
      onRefresh();
    } catch {
      addToast('Error deleting column', 'error');
    }
  }

  return (
    <>
      <div className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors group">
        <div className="flex flex-col gap-1">
          <button 
            disabled={isFirst}
            onClick={() => onMove(index, -1)}
            className="p-1 text-gray-300 hover:text-indigo-600 disabled:opacity-0"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button 
            disabled={isLast}
            onClick={() => onMove(index, 1)}
            className="p-1 text-gray-300 hover:text-indigo-600 disabled:opacity-0"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
             <span className="font-semibold text-gray-900 truncate">{column.label}</span>
             <Badge label={typeLabel} className="bg-gray-100 text-gray-600 px-1.5 py-0 scale-90" />
          </div>
          {column.options && column.options.length > 0 && (
            <p className="text-xs text-gray-500 truncate">
              Options: {column.options.join(', ')}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="p-2 text-gray-400 hover:text-indigo-600">
            <Edit3 className="w-4 h-4" />
          </button>
          <button onClick={() => setShowDelete(true)} className="p-2 text-gray-400 hover:text-red-500">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Delete Column?"
        message={`Delete "${column.label}"? All guest data stored in this column for this event will be permanently lost.`}
        confirmLabel="Yes, Delete"
      />
    </>
  );
}
