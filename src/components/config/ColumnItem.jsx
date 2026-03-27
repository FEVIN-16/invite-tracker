import { 
  ChevronUp, 
  ChevronDown, 
  Edit2, 
  Trash2, 
  Lock, 
  Type, 
  Hash, 
  Calendar, 
  Phone, 
  CheckSquare, 
  ListFilter, 
  CircleDot, 
  Layers, 
  AlignLeft,
  Asterisk
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { COLUMN_TYPE_LABELS } from '../../utils/columnTypes';
import clsx from 'clsx';

const TYPE_ICONS = {
  text: Type,
  number: Hash,
  date: Calendar,
  phone: Phone,
  checkbox: CheckSquare,
  select: ListFilter,
  radio: CircleDot,
  multiselect: Layers,
  textarea: AlignLeft,
};

const TYPE_COLORS = {
  text: 'text-blue-500 bg-blue-50',
  number: 'text-amber-500 bg-amber-50',
  date: 'text-emerald-500 bg-emerald-50',
  phone: 'text-purple-500 bg-purple-50',
  checkbox: 'text-pink-500 bg-pink-50',
  select: 'text-indigo-500 bg-indigo-50',
  radio: 'text-orange-500 bg-orange-50',
  multiselect: 'text-teal-500 bg-teal-50',
  textarea: 'text-gray-500 bg-gray-50',
};

export function ColumnItem({ column, isFirst, isLast, onMoveUp, onMoveDown, onEdit, onDelete }) {
  const Icon = TYPE_ICONS[column.type] || Type;
  const colorClass = TYPE_COLORS[column.type] || 'text-gray-500 bg-gray-50';

  return (
    <tr className="group hover:bg-indigo-50/30 transition-colors">
      {/* Order */}
      <td className="px-4 py-4">
        <div className="flex flex-col items-center opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onMoveUp}
            disabled={isFirst}
            className="p-1 text-gray-400 hover:text-indigo-600 disabled:opacity-0 transition-colors"
            title="Move up"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onMoveDown}
            disabled={isLast}
            className="p-1 text-gray-400 hover:text-indigo-600 disabled:opacity-0 transition-colors"
            title="Move down"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>

      {/* Field Name & Type */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-4">
          <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm", colorClass)}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-gray-900 leading-tight">{column.label}</span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
              {COLUMN_TYPE_LABELS[column.type] || column.type}
            </span>
          </div>
        </div>
      </td>

      {/* Field ID */}
      <td className="px-6 py-4">
        <div className="flex flex-col">
          <span className="text-[11px] font-mono font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100 inline-block w-fit">
            {column.fieldKey}
          </span>
          {['select', 'multiselect', 'radio'].includes(column.type) && (
            <span className="text-[10px] font-bold text-indigo-400 mt-1 pl-1">
              {column.options?.length || 0} options configured
            </span>
          )}
        </div>
      </td>

      {/* Status */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          {column.isRequired && (
            <span className="flex items-center gap-0.5 text-[9px] font-black uppercase tracking-widest text-red-500 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
              Required
            </span>
          )}
          {column.isFrozen && (
            <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
              Frozen
            </span>
          )}
          {column.isVisible === false && (
            <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
              Hidden
            </span>
          )}
          {column.isSystem ? (
            <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
              <Lock className="w-2 h-2" /> System
            </span>
          ) : (
            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
              Custom
            </span>
          )}
        </div>
      </td>

      {/* Actions */}
      <td className="px-6 py-4 text-right">
        <div className="flex justify-end gap-1">
          <button
            onClick={() => onEdit(column)}
            className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all duration-200"
            title="Edit settings"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          {!column.isSystem && (
            <button
              onClick={() => onDelete(column)}
              className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-white rounded-xl transition-all duration-200"
              title="Delete field"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
