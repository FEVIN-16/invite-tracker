import { useState, useRef, useEffect, useCallback } from 'react';
import { Edit3, Trash2, CheckSquare, Square, Plus, Lock, Unlock, FileText, Ban, ArrowUp, ArrowDown } from 'lucide-react';
import { deletePerson } from '../../db/peopleDb';
import { useUIStore } from '../../store/uiStore';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { InlineCell } from './InlineCell';
import { Tooltip } from '../ui/Tooltip';
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
  onAddPerson,
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
      addToast('Person removed');
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

  // ── Sticky Stacking Logic ──────────────────────────────────────────────────
  const selectionWidth = 48; // w-12 = 3rem = 48px
  
  // Filter visible columns
  const visibleColumns = columns.filter(c => c.isVisible !== false);
  const nameCol = visibleColumns.find(c => c.fieldKey === 'name');
  const isNameFrozen = nameCol ? !!nameCol.isFrozen : true;
  const isNameVisible = nameCol ? nameCol.isVisible !== false : true;

  // Find Action config
  const actionCol = columns.find(c => c.fieldKey === 'actions');
  const showActions = actionCol ? actionCol.isVisible !== false : true;
  const freezeActions = actionCol ? !!actionCol.isFrozen : false;
  
  // Calculate offsets for frozen columns
  let currentLeft = selectionWidth;
  const columnOffsets = {};
  
  if (isNameFrozen && isNameVisible) {
    columnOffsets['name'] = currentLeft;
    currentLeft += (nameWidth || 180);
  }

  // Only freeze dynamic columns that are marked as isFrozen AND are visible
  const dynamicCols = visibleColumns.filter(c => c.fieldKey !== 'name' && c.fieldKey !== 'actions');

  dynamicCols.forEach(col => {
    if (col.isFrozen) {
      columnOffsets[col.id] = currentLeft;
      currentLeft += (col.width || 150);
    }
  });

  return (
    <div className="select-none min-w-full">
      <table className="w-full border-collapse table-fixed">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {/* Selection Column - Always Frozen */}
            <th className="w-12 px-4 py-3 sticky top-0 left-0 z-40 bg-gray-50 border-r border-gray-100">
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

            {/* Name Column - Dynamic Frozen */}
            {isNameVisible && (
              <th 
                className={clsx(
                  "px-4 py-3 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 border-r border-gray-200 relative group/h cursor-pointer hover:bg-gray-100 transition-colors sticky top-0",
                  isNameFrozen ? "z-40" : "z-30"
                )}
                style={{ 
                  width: nameWidth || 180,
                  left: isNameFrozen ? columnOffsets['name'] : undefined
                }}
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
            )}

            {/* Dynamic Columns */}
            {dynamicCols.map(col => (
              <th
                key={col.id}
                className={clsx(
                  "px-4 py-3 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 border-r border-gray-100 last:border-r-0 relative group/h overflow-hidden cursor-pointer hover:bg-gray-100 transition-colors sticky top-0",
                  col.isFrozen ? "z-40" : "z-30"
                )}
                style={{ 
                  width: col.width || 150,
                  left: col.isFrozen ? columnOffsets[col.id] : undefined
                }}
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
            
            {/* Action Column - Configurable */}
            {showActions && (
              <th className={clsx(
                "px-4 py-3 text-right text-[11px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 border-l border-gray-100 w-28 sticky top-0",
                freezeActions ? "right-0 z-40 border-l-2 shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.05)]" : "z-30"
              )}>
                Action
              </th>
            )}
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
              {/* Selection Checkbox - Always Frozen */}
              <td className="px-4 py-2.5 sticky left-0 z-20 bg-inherit group-hover:bg-indigo-50/10 border-r border-gray-50 flex items-center justify-center">
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

              {/* Name - Dynamic Frozen */}
              {isNameVisible && (
                <td 
                  className={clsx(
                    "px-4 py-2 group-hover:bg-inherit border-r border-gray-100 font-bold text-gray-900 overflow-hidden",
                    isNameFrozen && "sticky z-20"
                  )}
                  style={{ left: isNameFrozen ? columnOffsets['name'] : undefined }}
                >
                  <div className="absolute inset-0 bg-white -z-10" />
                  <InlineCell
                    col={{ id: 'name', type: 'text', label: 'Name' }}
                    value={person.name}
                    onChange={val => onCellChange(person.id, 'name', val)}
                    disabled={person.isLocked}
                  />
                </td>
              )}

              {/* Dynamic Columns */}
              {dynamicCols.map(col => (
                <td 
                  key={col.id} 
                  className={clsx(
                    "px-4 py-2 border-r border-gray-50 last:border-r-0 overflow-hidden",
                    col.isFrozen && "sticky z-20"
                  )}
                  style={{ left: col.isFrozen ? columnOffsets[col.id] : undefined }}
                >
                  <div className="absolute inset-0 bg-white -z-10" />
                  <InlineCell
                    col={col}
                    value={person.dynamicFields?.[col.id]}
                    onChange={val => onCellChange(person.id, col.id, val)}
                    disabled={person.isLocked}
                  />
                </td>
              ))}

              {/* Actions - Configurable */}
              {showActions && (
                <td className={clsx(
                  "px-3 py-2 bg-inherit border-l border-gray-100",
                  freezeActions && "sticky right-0 z-20 border-l-2 shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.05)]"
                )}>
                  <div className="absolute inset-0 bg-white -z-10" />
                  <div className="flex justify-end gap-1 transition-opacity">
                    <Tooltip content={person.excludeFromExport ? "Excluded from Export" : "Included in Export"} position="left">
                      <button
                        onClick={() => onToggleRow(person.id, 'excludeFromExport')}
                        className={clsx(
                          "p-1.5 rounded-lg transition-all",
                          person.excludeFromExport ? "text-red-500 bg-red-50" : "text-gray-400 hover:text-indigo-600 hover:bg-white"
                        )}
                      >
                        {person.excludeFromExport ? <Ban className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                      </button>
                    </Tooltip>

                    <Tooltip content={person.isLocked ? "Locked - No Edits" : "Unlocked - Click to Edit"} position="left">
                      <button
                        onClick={() => onToggleRow(person.id, 'isLocked')}
                        className={clsx(
                          "p-1.5 rounded-lg transition-all",
                          person.isLocked ? "text-amber-500 bg-amber-50" : "text-gray-400 hover:text-indigo-600 hover:bg-white"
                        )}
                      >
                        {person.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      </button>
                    </Tooltip>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Remove Person?"
        message="This will permanently delete the person and all their data."
        confirmLabel="Remove"
      />
    </div>
  );
}
