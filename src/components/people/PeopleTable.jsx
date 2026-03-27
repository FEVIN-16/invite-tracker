import { useState, useRef, useEffect, useCallback } from 'react';
import { Edit3, Trash2, CheckSquare, Square, Plus, Lock, Unlock, FileText, Ban, ArrowUp, ArrowDown } from 'lucide-react';
import { deletePerson } from '../../db/peopleDb';
import { useUIStore } from '../../store/uiStore';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { InlineCell } from './InlineCell';
import clsx from 'clsx';

export function PeopleTable({
  people,
  columns,
  nameWidth,
  selectedIds,
  onSelect,
  onEdit,
  onRefresh,
  onCellChange,
  onAddGuest,
  onColumnResize,
  onSort,
  sortConfig,
  onToggleRow
}) {
  const { addToast } = useUIStore();
  const [deletingId, setDeletingId] = useState(null);
  
  // Resizing state
  const [resizingColId, setResizingColId] = useState(null);
  const startX = useRef(0);
  const startWidth = useRef(0);

  async function handleDelete() {
    try {
      await deletePerson(deletingId);
      addToast('Guest removed');
      onRefresh();
    } catch {
      addToast('Error removing guest', 'error');
    } finally {
      setDeletingId(null);
    }
  }

  function toggleSelectAll() {
    if (people.length > 0 && selectedIds.length === people.length) {
      onSelect([]);
    } else {
      onSelect(people.map(p => p.id));
    }
  }

  function toggleSelect(id) {
    if (selectedIds.includes(id)) {
      onSelect(selectedIds.filter(v => v !== id));
    } else {
      onSelect([...selectedIds, id]);
    }
  }

  const allSelected = people.length > 0 && selectedIds.length === people.length;

  // ── Column Resizing Logic ───────────────────────────────────────────────
  // To avoid stale closures in useEffect-less listeners, we'll use a ref for the ID too
  const resizingIdRef = useRef(null);
  useEffect(() => {
    resizingIdRef.current = resizingColId;
  }, [resizingColId]);

  const handleMouseMoveStable = useCallback((e) => {
    if (resizingIdRef.current === null) return;
    const diff = e.pageX - startX.current;
    const newWidth = Math.max(80, startWidth.current + diff);
    onColumnResize(resizingIdRef.current, newWidth);
  }, [onColumnResize]);

  const handleMouseUpStable = useCallback(() => {
    setResizingColId(null);
    resizingIdRef.current = null;
    document.removeEventListener('mousemove', handleMouseMoveStable);
    document.removeEventListener('mouseup', handleMouseUpStable);
  }, [handleMouseMoveStable]);

  // Re-bind on mousedown
  function onStartResize(e, id, width) {
    e.preventDefault();
    e.stopPropagation();
    setResizingColId(id);
    startX.current = e.pageX;
    startWidth.current = width || 150;
    document.addEventListener('mousemove', handleMouseMoveStable);
    document.addEventListener('mouseup', handleMouseUpStable);
  }

  // ── Sorting UI Helper ──────────────────────────────────────────────────
  function SortIcon({ colKey }) {
    if (sortConfig?.key !== colKey) return null;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-3 h-3 text-indigo-600 ml-1 inline-block" />
      : <ArrowDown className="w-3 h-3 text-indigo-600 ml-1 inline-block" />;
  }

  return (
    <div className="overflow-x-auto select-none">
      <table className="w-full border-collapse table-fixed">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {/* Selection Column - Frozen */}
            <th className="w-12 px-4 py-3 sticky left-0 z-30 bg-gray-50 border-r border-gray-100">
              <button 
                onClick={toggleSelectAll} 
                className={clsx(
                  "p-1 transition-all",
                  allSelected ? "text-indigo-600" : "text-gray-300 hover:text-indigo-600"
                )}
              >
                {allSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
              </button>
            </th>

            {/* Name Column - Frozen */}
            <th 
              className="px-4 py-3 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest sticky left-12 z-30 bg-gray-50 border-r border-gray-200 relative group/h cursor-pointer hover:bg-gray-100 transition-colors"
              style={{ width: nameWidth || 180 }}
              onClick={() => onSort('name')}
            >
              <div className="flex items-center truncate">
                Name <SortIcon colKey="name" />
              </div>
              <div 
                onMouseDown={(e) => onStartResize(e, 'system-name', nameWidth || 180)}
                className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-indigo-300 transition-colors"
              />
            </th>

            {/* Dynamic Columns */}
            {columns.map(col => (
              <th
                key={col.id}
                className="px-4 py-3 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest border-r border-gray-100 last:border-r-0 relative group/h overflow-hidden cursor-pointer hover:bg-gray-100 transition-colors"
                style={{ width: col.width || 150 }}
                onClick={() => onSort(col.id)}
              >
                <div className="flex items-center truncate">
                  {col.label} <SortIcon colKey={col.id} />
                </div>
                <div 
                  onMouseDown={(e) => onStartResize(e, col.id, col.width)}
                  className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-indigo-300 transition-colors"
                />
              </th>
            ))}
            
            {/* Action Column */}
            <th className="px-4 py-3 text-right text-[11px] font-black text-gray-400 uppercase tracking-widest sticky right-0 z-30 bg-gray-50 border-l border-gray-100 w-28">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {people.map((person) => (
            <tr
              key={person.id}
              className={clsx(
                'group transition-colors',
                selectedIds.includes(person.id) ? 'bg-indigo-50/40' : 'hover:bg-indigo-50/10'
              )}
            >
              {/* Selection Checkbox - Frozen */}
              <td className="px-4 py-2.5 sticky left-0 z-20 bg-inherit group-hover:bg-indigo-50/10 border-r border-gray-50 flex items-center justify-center">
                {/* Background hack to keep it opaque during scroll */}
                <div className="absolute inset-0 bg-white -z-10" />
                <button 
                  onClick={() => toggleSelect(person.id)} 
                  className={clsx(
                    "p-1 transition-all",
                    selectedIds.includes(person.id) 
                      ? "text-indigo-600 opacity-100" 
                      : "text-gray-300 opacity-0 group-hover:opacity-100 hover:text-indigo-600"
                  )}
                >
                  {selectedIds.includes(person.id) ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                </button>
              </td>

              {/* Name - Frozen */}
              <td className="px-4 py-2 sticky left-12 z-20 group-hover:bg-indigo-50/10 border-r border-gray-100 font-bold text-gray-900 overflow-hidden">
                <div className="absolute inset-0 bg-white -z-10" />
                <InlineCell
                  col={{ id: 'name', type: 'text', label: 'Name' }}
                  value={person.name}
                  onChange={val => onCellChange(person.id, 'name', val)}
                  disabled={person.isLocked}
                />
              </td>

              {/* Dynamic Columns */}
              {columns.map(col => (
                <td key={col.id} className="px-4 py-2 border-r border-gray-50 last:border-r-0 overflow-hidden">
                  <InlineCell
                    col={col}
                    value={person.dynamicFields?.[col.id]}
                    onChange={val => onCellChange(person.id, col.id, val)}
                    disabled={person.isLocked}
                  />
                </td>
              ))}

              {/* Actions */}
              <td className="px-3 py-2 sticky right-0 z-20 bg-inherit border-l border-gray-100">
                {/* Background hack to keep it opaque during scroll */}
                <div className="absolute inset-0 bg-white -z-10" />
                <div className="flex justify-end gap-1 transition-opacity">
                  {/* Export Prevention Toggle */}
                  <button
                    onClick={() => onToggleRow(person.id, 'excludeFromExport')}
                    className={clsx(
                      "p-1.5 rounded-lg transition-all",
                      person.excludeFromExport ? "text-red-500 bg-red-50" : "text-gray-400 hover:text-indigo-600 hover:bg-white"
                    )}
                    title={person.excludeFromExport ? "Excluded from Export" : "Included in Export"}
                  >
                    {person.excludeFromExport ? <Ban className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                  </button>

                  {/* Lock Toggle */}
                  <button
                    onClick={() => onToggleRow(person.id, 'isLocked')}
                    className={clsx(
                      "p-1.5 rounded-lg transition-all",
                      person.isLocked ? "text-amber-500 bg-amber-50" : "text-gray-400 hover:text-indigo-600 hover:bg-white"
                    )}
                    title={person.isLocked ? "Locked - No Edits" : "Unlocked - Click to Edit"}
                  >
                    {person.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </td>
            </tr>
          ))}

        </tbody>
      </table>

      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Remove Guest?"
        message="This will permanently delete the guest and all their data."
        confirmLabel="Remove"
      />
    </div>
  );
}
