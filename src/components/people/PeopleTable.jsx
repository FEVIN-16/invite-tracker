import { useState, useRef, useEffect, useCallback } from 'react';
import { Edit3, Trash2, CheckSquare, Square, Plus, Lock, Unlock, FileText, Ban, ArrowUp, ArrowDown, Pin, PinOff, MessageCircle, Mail, MessageSquareText, Share2 } from 'lucide-react';
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
  isNameFrozen,
  selectedIds,
  onSelect,
  onEdit,
  onRefresh,
  onCellChange,
  onAddPerson,
  onColumnResize,
  onSort,
  sortConfig,
  onToggleRow,
  onTogglePin,
  event,
  category
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

  const handleInvite = async (person, platform, overrideValue) => {
    // 1. Find Identifiers
    const phoneCol = columns.find(c => c.type === 'phone');
    const emailCol = columns.find(c => c.type === 'email');
    
    let phone = '';
    let email = '';

    if (overrideValue) {
      if (platform === 'email') email = overrideValue;
      else phone = overrideValue.replace(/\D/g, '');
    } else {
      const rawPhone = person.dynamicFields?.[phoneCol?.id] || '';
      phone = rawPhone.replace(/\D/g, '');
      email = person.dynamicFields?.[emailCol?.id] || '';
    }

    // 2. Prepare Content
    const subject = event?.title || 'Invitation';
    const message = category?.inviteMessage || `Hi ${person.name}, you are invited!`;
    const attachments = category?.attachments || [];

    // Base64 to File conversion helper
    const dataURLtoFile = (dataurl, filename) => {
      let arr = dataurl.split(','),
          mime = arr[0].match(/:(.*?);/)[1],
          bstr = atob(arr[1]), 
          n = bstr.length, 
          u8arr = new Uint8Array(n);
      while(n--){
          u8arr[n] = bstr.charCodeAt(n);
      }
      return new File([u8arr], filename, {type:mime});
    };

    try {
      // 3. System Share (Rich Content with Files)
      if (platform === 'system') {
        if (navigator.share && attachments.length > 0) {
          const files = attachments.map(a => dataURLtoFile(a.data, a.name));
          
          if (navigator.canShare && navigator.canShare({ files })) {
            await navigator.share({
              title: subject,
              text: message,
              files: files
            });
            addToast('Shared successfully');
            return;
          }
        }
        // Fallback for system share if no files or no navigator.share
        if (navigator.share) {
          await navigator.share({ title: subject, text: message });
          return;
        }
        addToast('Sharing not supported on this device', 'warning');
        return;
      }

      // 4. Direct App Sharing (Text Only - 1 Click Experience)
      if (platform === 'whatsapp') {
        if (!phone) { addToast('No phone number found', 'warning'); return; }
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
        if (attachments.length > 0) {
          addToast('Message sent! Use "Share All" icon to include files.', 'info');
        }
      } else if (platform === 'email') {
        if (!email) { addToast('No email found', 'warning'); return; }
        window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`, '_blank');
        if (attachments.length > 0) {
          addToast('Email draft opened! Use "Share All" icon to include files.', 'info');
        }
      } else if (platform === 'sms') {
        if (!phone) { addToast('No phone number found', 'warning'); return; }
        window.open(`sms:${phone}?body=${encodeURIComponent(message)}`, '_blank');
        if (attachments.length > 0) {
          addToast('SMS app opened! Use "Share All" icon to include files.', 'info');
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Share error:', err);
        addToast('Sharing failed', 'error');
      }
    }
  };

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

  // ── Column Unification & Sorting ──────────────────────────────────────────
  const allSortedCols = [...columns]
    .filter(c => c.isVisible !== false)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  const selectionWidth = 48; // w-12 = 3rem = 48px
  const leftOffsets = {};
  const rightOffsets = {};
  
  let currentLeft = selectionWidth;
  let currentRight = 0;

  const mid = Math.floor(allSortedCols.length / 2);

  // Split pins into Left and Right based on index
  allSortedCols.forEach((col, idx) => {
    if (col.isFrozen) {
      if (idx <= mid) {
        leftOffsets[col.id] = currentLeft;
        currentLeft += (col.width || (col.fieldKey === 'name' ? nameWidth : 150));
      }
    }
  });

  // Calculate right offsets from the end
  [...allSortedCols].reverse().forEach((col, idx) => {
    const originalIdx = allSortedCols.length - 1 - idx;
    if (col.isFrozen && originalIdx > mid) {
      rightOffsets[col.id] = currentRight;
      currentRight += (col.width || (col.fieldKey === 'actions' ? 120 : 150));
    }
  });

  return (
    <div className="select-none min-w-full overflow-x-auto">
      <table className="w-full border-collapse table-fixed min-w-max">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
            {/* Selection Column - Always Frozen */}
            <th className="w-12 px-4 py-3 sticky top-0 left-0 z-40 bg-gray-50 dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800">
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

            {/* Unified Dynamic Columns (including Name and Action) */}
            {allSortedCols.map((col, idx) => {
              const isName = col.fieldKey === 'name';
              const isAction = col.fieldKey === 'actions';
              const isFrozen = col.isFrozen;
              const width = isName ? nameWidth : (col.width || (isAction ? 120 : 150));
              
              const isLeftSticky = isFrozen && idx <= mid;
              const isRightSticky = isFrozen && idx > mid;

              return (
                <th
                  key={col.id}
                  className={clsx(
                    "px-4 py-3 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest bg-gray-50 dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 relative group/h cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors sticky top-0",
                    isFrozen ? "z-40 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]" : "z-30",
                    isRightSticky && "shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)]",
                    !isName && "text-left",
                    isAction && "border-l"
                  )}
                  style={{ 
                    width,
                    left: isLeftSticky ? leftOffsets[col.id] : undefined,
                    right: isRightSticky ? rightOffsets[col.id] : undefined
                  }}
                  onClick={() => !isAction && onSort(isName ? 'name' : col.id)}
                >
                  <div className={clsx(
                    "flex items-center",
                    isAction ? "justify-between" : "justify-between" // Use between to space label and pin
                  )}>
                    <div className="flex items-center truncate mr-2">
                      {isName ? 'Name' : (isAction ? 'Action' : col.label)} 
                      {!isAction && <SortIcon colKey={isName ? 'name' : col.id} />}
                    </div>
                    
                    {/* Pin Icon */}
                    <button
                      onClick={(e) => { e.stopPropagation(); onTogglePin(isName ? 'system-name' : col.id); }}
                      className={clsx(
                        "p-1 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm transition-all flex-shrink-0",
                        isFrozen ? "text-indigo-600 opacity-100" : "text-gray-400 opacity-0 group-hover/h:opacity-100 hover:text-indigo-600"
                      )}
                    >
                      {isFrozen ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
                    </button>
                  </div>

                  {/* Resize Handle */}
                  <div 
                    onMouseDown={(e) => onStartResize(e, isName ? 'system-name' : col.id, width)}
                    className="absolute right-0 top-0 bottom-0 w-1 px-0.5 cursor-col-resize hover:bg-indigo-300 dark:hover:bg-indigo-600 transition-colors"
                  />
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {people.map((person) => (
            <tr
              key={person.id}
              className={clsx(
                'group transition-colors',
                selectedIds.includes(person.id) ? 'bg-indigo-50/40 dark:bg-indigo-900/10' : 'hover:bg-gray-50/50 dark:hover:bg-gray-900/40'
              )}
            >
              {/* Selection Checkbox - Always Frozen */}
              <td className="px-4 py-2.5 sticky left-0 z-20 border-r border-gray-100 dark:border-gray-800 flex items-center justify-center">
                <div className="absolute inset-0 bg-white dark:bg-gray-950 -z-10" />
                <button 
                  onClick={() => toggleSelect(person.id)} 
                  className={clsx(
                    "p-1 transition-all",
                    selectedIds.includes(person.id) 
                      ? "text-indigo-600 dark:text-indigo-400 opacity-100" 
                      : "text-gray-300 dark:text-gray-700 opacity-0 group-hover:opacity-100 hover:text-indigo-600 dark:hover:text-indigo-400"
                  )}
                >
                  {selectedIds.includes(person.id) ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                </button>
              </td>

              {/* Unified Body Columns */}
              {allSortedCols.map((col, idx) => {
                const isName = col.fieldKey === 'name';
                const isAction = col.fieldKey === 'actions';
                const isFrozen = col.isFrozen;
                const isLeftSticky = isFrozen && idx <= mid;
                const isRightSticky = isFrozen && idx > mid;

                if (isName) {
                  return (
                    <td 
                      key="name" 
                      className={clsx(
                        "px-4 py-2 border-r border-gray-100 dark:border-gray-800 font-bold text-gray-900 dark:text-white overflow-hidden transition-colors",
                        isFrozen && "sticky z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]",
                        isRightSticky && "shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)]"
                      )}
                      style={{ 
                        left: isLeftSticky ? leftOffsets[col.id] : undefined,
                        right: isRightSticky ? rightOffsets[col.id] : undefined
                      }}
                    >
                      <div className="absolute inset-0 bg-white dark:bg-gray-950 -z-10" />
                      <InlineCell
                        col={{ id: 'name', type: 'text', label: 'Name' }}
                        value={person.name}
                        onChange={val => onCellChange(person.id, 'name', val)}
                        disabled={person.isLocked}
                        onInvite={(val, type) => handleInvite(person, type, val)}
                      />
                    </td>
                  );
                }

                if (isAction) {
                  return (
                    <td 
                      key="actions"
                      className={clsx(
                        "px-3 py-2 border-l border-gray-100 dark:border-gray-800 text-center transition-colors shadow-none",
                        isFrozen && "sticky z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]",
                        isRightSticky && "shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)]"
                      )}
                      style={{ 
                        left: isLeftSticky ? leftOffsets[col.id] : undefined,
                        right: isRightSticky ? rightOffsets[col.id] : undefined,
                        backgroundColor: 'inherit' // Ensure background matches row dark mode
                      }}
                    >
                      <div className="absolute inset-0 bg-white dark:bg-gray-950 -z-10" />
                      <div className="flex justify-center gap-1 transition-opacity">
                        <Tooltip content={person.excludeFromExport ? "Excluded from Export" : "Included in Export"} position="left">
                          <button
                            onClick={() => onToggleRow(person.id, 'excludeFromExport')}
                            className={clsx(
                              "p-1.5 rounded-lg transition-all",
                              person.excludeFromExport ? "text-red-500 bg-red-50 dark:bg-red-900/20" : "text-gray-400 dark:text-gray-600 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-gray-800"
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
                              person.isLocked ? "text-amber-500 bg-amber-50 dark:bg-amber-900/20" : "text-gray-400 dark:text-gray-600 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-gray-800"
                            )}
                          >
                            {person.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                          </button>
                        </Tooltip>
                      </div>
                    </td>
                  );
                }

                return (
                  <td 
                    key={col.id} 
                    className={clsx(
                      "px-4 py-2 border-r border-gray-100 dark:border-gray-800 last:border-r-0 overflow-hidden transition-colors",
                      isFrozen && "sticky z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]",
                      isRightSticky && "shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)]"
                    )}
                    style={{ 
                      left: isLeftSticky ? leftOffsets[col.id] : undefined,
                      right: isRightSticky ? rightOffsets[col.id] : undefined
                    }}
                  >
                    <div className="absolute inset-0 bg-white dark:bg-gray-950 -z-10" />
                    <InlineCell
                      col={col}
                      value={person.dynamicFields?.[col.id]}
                      onChange={val => onCellChange(person.id, col.id, val)}
                      disabled={person.isLocked}
                      onInvite={(val, type) => handleInvite(person, type, val)}
                    />
                  </td>
                );
              })}
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
