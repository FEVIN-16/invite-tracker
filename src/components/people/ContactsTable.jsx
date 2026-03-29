import { useState, useRef, useEffect, useCallback } from 'react';
import { Edit3, Trash2, CheckSquare, Square, ArrowUp, ArrowDown, Pin, PinOff } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { InlineCell } from './InlineCell';
import { Tooltip } from '../ui/Tooltip';
import clsx from 'clsx';

export function ContactsTable({
  contacts,
  selectedIds,
  onSelect,
  onEdit,
  onDelete,
  onCellChange,
  columnConfigs, // { [colId]: { width, isFrozen } }
  onColumnResize,
  onTogglePin,
  onSort,
  sortConfig,
}) {
  const { addToast } = useUIStore();
  
  // Resizing state
  const [resizingColId, setResizingColId] = useState(null);
  const startX = useRef(0);
  const startWidth = useRef(0);

  function toggleSelectAll() {
    if (contacts.length > 0 && selectedIds.length === contacts.length) {
      onSelect([]);
    } else {
      onSelect(contacts.map(c => c.id));
    }
  }

  function toggleSelect(id) {
    if (selectedIds.includes(id)) {
      onSelect(selectedIds.filter(v => v !== id));
    } else {
      onSelect([...selectedIds, id]);
    }
  }

  const allSelected = contacts.length > 0 && selectedIds.length === contacts.length;

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

  // ── Column Definitions ──────────────────────────────────────────────────
  const COL_DEFS = [
    { id: 'name', label: 'Name', type: 'text' },
    { id: 'phone', label: 'Phone', type: 'phone' },
    { id: 'email', label: 'Email', type: 'email' },
    { id: 'notes', label: 'Notes', type: 'textarea' },
    { id: 'createdAt', label: 'Date Added', type: 'date', readOnly: true },
  ];

  // ── Sticky Stacking Logic ──────────────────────────────────────────────────
  const selectionWidth = 48;
  const leftOffsets = {};
  const rightOffsets = {};
  
  let currentLeft = selectionWidth;
  let currentRight = 0;

  // Combine for unified indexing
  const allCols = [
    ...COL_DEFS,
    { id: 'actions', width: 120 }
  ];
  const mid = Math.floor(allCols.length / 2);

  // Left pinning
  allCols.forEach((col, idx) => {
    const config = columnConfigs[col.id] || { isFrozen: col.id === 'name', width: col.width };
    if (config.isFrozen && idx < mid) {
      leftOffsets[col.id] = currentLeft;
      currentLeft += (config.width || (col.id === 'actions' ? 120 : 180));
    }
  });

  // Right pinning
  [...allCols].reverse().forEach((col, idx) => {
    const originalIdx = allCols.length - 1 - idx;
    const config = columnConfigs[col.id] || { isFrozen: false, width: col.width };
    if (config.isFrozen && originalIdx >= mid) {
      rightOffsets[col.id] = currentRight;
      currentRight += (config.width || (col.id === 'actions' ? 120 : 180));
    }
  });

  const actionsConfig = columnConfigs['actions'] || { width: 120, isFrozen: false };

  return (
    <div className="select-none min-w-full overflow-x-auto">
      <table className="w-full border-collapse table-fixed min-w-[800px]">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
            {/* Selection Column - Always Frozen */}
            <th className="w-12 px-4 py-4 sticky top-0 left-0 z-50 bg-gray-50 dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
              <button 
                onClick={toggleSelectAll} 
                className={clsx(
                  "p-1 transition-all",
                  allSelected ? "text-indigo-600 dark:text-indigo-400" : "text-gray-300 dark:text-gray-700 hover:text-indigo-600 dark:hover:text-indigo-400"
                )}
              >
                {allSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
              </button>
            </th>

            {/* Dynamic Columns */}
            {COL_DEFS.map(col => {
              const config = columnConfigs[col.id] || { width: 150, isFrozen: col.id === 'name' };
              const isFrozen = config.isFrozen;
              
              return (
                <th
                  key={col.id}
                  className={clsx(
                    "px-4 py-4 text-left text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest bg-gray-50 dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 relative group/h cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors sticky top-0",
                    isFrozen ? "z-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]" : "z-10",
                    isFrozen && rightOffsets[col.id] !== undefined && "shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)]"
                  )}
                  style={{ 
                    width: config.width || 150,
                    left: (isFrozen && leftOffsets[col.id] !== undefined) ? leftOffsets[col.id] : undefined,
                    right: (isFrozen && rightOffsets[col.id] !== undefined) ? rightOffsets[col.id] : undefined
                  }}
                  onClick={() => onSort(col.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center truncate mr-2">
                      {col.label} <SortIcon colKey={col.id} />
                    </div>
                    
                    {/* Pin Icon - Only visible on hover */}
                    <button
                      onClick={(e) => { e.stopPropagation(); onTogglePin(col.id); }}
                      className={clsx(
                        "p-1 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm transition-all",
                        isFrozen ? "text-indigo-600 opacity-100" : "text-gray-400 opacity-0 group-hover/h:opacity-100 hover:text-indigo-600"
                      )}
                    >
                      {isFrozen ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
                    </button>
                  </div>

                  {/* Resize Handle */}
                  <div 
                    onMouseDown={(e) => onStartResize(e, col.id, config.width)}
                    className="absolute right-0 top-0 bottom-0 w-1 px-0.5 cursor-col-resize hover:bg-indigo-300 dark:hover:bg-indigo-600 transition-colors"
                  />
                </th>
              );
            })}
            
            {/* Action Column */}
            <th 
              className={clsx(
                "px-4 py-4 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest bg-gray-50 dark:bg-gray-900 border-l border-gray-100 dark:border-gray-800 relative group/h cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors sticky top-0",
                actionsConfig.isFrozen ? "z-50 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)]" : "z-10"
              )}
              style={{ 
                width: actionsConfig.width || 120,
                left: (actionsConfig.isFrozen && leftOffsets['actions'] !== undefined) ? leftOffsets['actions'] : undefined,
                right: (actionsConfig.isFrozen && rightOffsets['actions'] !== undefined) ? rightOffsets['actions'] : undefined
              }}
            >
              <div className="flex items-center justify-between">
                <div className="truncate mr-2">Action</div>
                <button
                  onClick={(e) => { e.stopPropagation(); onTogglePin('actions'); }}
                  className={clsx(
                    "p-1 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm transition-all",
                    actionsConfig.isFrozen ? "text-indigo-600 opacity-100" : "text-gray-400 opacity-0 group-hover/h:opacity-100 hover:text-indigo-600"
                  )}
                >
                  {actionsConfig.isFrozen ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
                </button>
              </div>
              {/* Resize Handle */}
              <div 
                onMouseDown={(e) => onStartResize(e, 'actions', actionsConfig.width)}
                className="absolute right-0 top-0 bottom-0 w-1 px-0.5 cursor-col-resize hover:bg-indigo-300 dark:hover:bg-indigo-600 transition-colors"
              />
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {contacts.map((contact) => (
            <tr
              key={contact.id}
              className={clsx(
                'group transition-colors',
                selectedIds.includes(contact.id) ? 'bg-indigo-50/40 dark:bg-indigo-900/10' : 'hover:bg-gray-50/50 dark:hover:bg-gray-900/40'
              )}
            >
              {/* Selection Checkbox */}
              <td className="px-4 py-2 sticky left-0 z-30 border-r border-gray-100 dark:border-gray-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] bg-white dark:bg-gray-950">
                <div className="flex items-center justify-center">
                  <button 
                    onClick={() => toggleSelect(contact.id)} 
                    className={clsx(
                      "p-1 transition-all",
                      selectedIds.includes(contact.id) 
                        ? "text-indigo-600 dark:text-indigo-400 opacity-100" 
                        : "text-gray-300 dark:text-gray-700 opacity-0 group-hover:opacity-100 hover:text-indigo-600 dark:hover:text-indigo-400"
                    )}
                  >
                    {selectedIds.includes(contact.id) ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                  </button>
                </div>
              </td>

              {/* Dynamic Columns */}
              {COL_DEFS.map(col => {
                const config = columnConfigs[col.id] || { width: 150, isFrozen: col.id === 'name' };
                const isFrozen = config.isFrozen;

                return (
                  <td 
                    key={col.id} 
                    className={clsx(
                      "px-4 py-2 border-r border-gray-100 dark:border-gray-800 overflow-hidden transition-colors bg-white dark:bg-gray-950",
                      isFrozen && "sticky z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]",
                      isFrozen && rightOffsets[col.id] !== undefined && "shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)]"
                    )}
                    style={{ 
                      left: (isFrozen && leftOffsets[col.id] !== undefined) ? leftOffsets[col.id] : undefined,
                      right: (isFrozen && rightOffsets[col.id] !== undefined) ? rightOffsets[col.id] : undefined
                    }}
                  >
                    <InlineCell
                      col={col}
                      value={contact[col.id] || ''}
                      onChange={val => onCellChange(contact.id, col.id, val)}
                      disabled={false}
                    />
                  </td>
                );
              })}

              {/* Actions */}
              <td 
                className={clsx(
                  "px-3 py-2 border-l border-gray-100 dark:border-gray-800 text-center bg-white dark:bg-gray-950 transition-colors",
                  actionsConfig.isFrozen && "sticky z-30 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)]"
                )}
                style={{ 
                  left: (actionsConfig.isFrozen && leftOffsets['actions'] !== undefined) ? leftOffsets['actions'] : undefined,
                  right: (actionsConfig.isFrozen && rightOffsets['actions'] !== undefined) ? rightOffsets['actions'] : undefined
                }}
              >
                <div className="flex justify-center gap-1">
                  <Tooltip content="Edit Contact">
                    <button
                      onClick={() => onEdit(contact)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 transition-all"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </Tooltip>
                  <Tooltip content="Delete Contact">
                    <button
                      onClick={() => onDelete(contact)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/40 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </Tooltip>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
