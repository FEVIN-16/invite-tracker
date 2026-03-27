import { ChevronUp, ChevronDown, Edit2, Trash2, Lock } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { COLUMN_TYPE_LABELS } from '../../utils/columnTypes';

export function ColumnItem({ column, isFirst, isLast, onMoveUp, onMoveDown, onEdit, onDelete }) {
  return (
    <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-2xl px-4 py-3.5 hover:border-indigo-200 transition-colors group">
      {/* Reorder arrows */}
      <div className="flex flex-col gap-0.5">
        <button
          onClick={onMoveUp}
          disabled={isFirst}
          className="p-1 text-gray-300 hover:text-indigo-600 disabled:opacity-0 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
        <button
          onClick={onMoveDown}
          disabled={isLast}
          className="p-1 text-gray-300 hover:text-indigo-600 disabled:opacity-0 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Column info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold text-gray-900">{column.label}</span>
          {column.isSystem && (
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-bold border border-indigo-100">
              <Lock className="w-2.5 h-2.5" /> System
            </span>
          )}
          <Badge
            label={COLUMN_TYPE_LABELS[column.type] || column.type}
            className="bg-gray-50 text-gray-500 border-gray-100 font-medium"
          />
          {['select', 'multiselect', 'radio'].includes(column.type) && column.options?.length > 0 && (
            <span className="text-[11px] text-gray-400 font-medium bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
              {column.options.length} options
            </span>
          )}
        </div>
        <p className="text-[11px] text-gray-400 mt-1 font-medium">{column.fieldKey} · {column.width || 150}px</p>
      </div>

      {/* Actions */}
      <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(column)}
          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
          title="Edit column"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        {!column.isSystem && (
          <button
            onClick={() => onDelete(column)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
            title="Delete column"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
