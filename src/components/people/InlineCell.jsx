import { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';

/**
 * InlineCell — renders a table cell that becomes editable on click.
 * For checkbox type, it toggles directly without entering "edit mode".
 *
 * Props:
 *   col     — the column definition { id, type, options, label }
 *   value   — current value
 *   onChange — called with new value when the user commits a change
 */
export function InlineCell({ col, value, onChange, disabled }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef(null);

  // Sync draft when external value changes
  useEffect(() => {
    if (!isEditing) setDraft(value);
  }, [value, isEditing]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current.select) inputRef.current.select();
    }
  }, [isEditing]);

  function commit(val) {
    setIsEditing(false);
    if (val !== value) onChange(val);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); commit(draft); }
    if (e.key === 'Escape') { setIsEditing(false); setDraft(value); }
  }

  // ─── CHECKBOX — always visible toggle, no edit mode ─────────────────────
  if (col.type === 'checkbox') {
    const checked = !!value;
    return (
      <div className="h-10 flex items-center px-1.5">
        <button
          onClick={() => !disabled && onChange(!checked)}
          disabled={disabled}
          className={clsx(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-all',
            checked
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-gray-50 border-gray-200 text-gray-400 hover:border-gray-300'
          )}
        >
          <span className={clsx('w-3.5 h-3.5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors', checked ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300')}>
            {checked && <svg className="w-2 h-2 text-white" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3.5 6L6.5 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          </span>
          {checked ? 'Yes' : 'No'}
        </button>
      </div>
    );
  }

  // ─── SELECT ─────────────────────────────────────────────────────────────
  if (col.type === 'select') {
    if (isEditing) {
      return (
        <div className="h-10 flex items-center px-1">
          <select
            ref={inputRef}
            value={draft || ''}
            onChange={e => { setDraft(e.target.value); commit(e.target.value); }}
            onBlur={() => commit(draft)}
            className="w-full rounded-lg border border-indigo-300 bg-white px-2 py-1 text-sm outline-none ring-2 ring-indigo-100"
            autoFocus
          >
            <option value="">— None —</option>
            {col.options?.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      );
    }
    return <DisplayCell value={value} col={col} onClick={() => !disabled && setIsEditing(true)} disabled={disabled} />;
  }

  // ─── RADIO ──────────────────────────────────────────────────────────────
  if (col.type === 'radio') {
    if (isEditing) {
      return (
        <div className="flex flex-wrap gap-1.5 py-1">
          {col.options?.map(opt => (
            <button
              key={opt}
              onClick={() => commit(opt)}
              className={clsx(
                'px-3 py-1 rounded-full text-xs font-bold border transition-all',
                value === opt
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'bg-white border-gray-200 text-gray-500 hover:border-indigo-400'
              )}
            >
              {opt}
            </button>
          ))}
          {value && (
            <button
              onClick={() => commit('')}
              className="px-2 py-1 rounded-full text-xs font-bold border border-gray-200 text-gray-400 hover:text-red-400"
            >✕</button>
          )}
        </div>
      );
    }
    return <DisplayCell value={value} col={col} onClick={() => !disabled && setIsEditing(true)} disabled={disabled} />;
  }

  // ─── MULTISELECT ─────────────────────────────────────────────────────────
  if (col.type === 'multiselect') {
    const selected = Array.isArray(value) ? value : [];
    if (isEditing) {
      function toggle(opt) {
        const next = selected.includes(opt)
          ? selected.filter(s => s !== opt)
          : [...selected, opt];
        onChange(next); // optimistic — commit on each toggle
      }
      return (
        <div className="flex flex-wrap gap-1.5 py-1">
          {col.options?.map(opt => (
            <button
              key={opt}
              onClick={() => toggle(opt)}
              className={clsx(
                'px-3 py-1 rounded-full text-xs font-bold border transition-all',
                selected.includes(opt)
                  ? 'bg-emerald-600 border-emerald-600 text-white'
                  : 'bg-white border-gray-200 text-gray-500 hover:border-emerald-400'
              )}
            >
              {opt}
            </button>
          ))}
          <button onClick={() => setIsEditing(false)} className="px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500 hover:bg-gray-200">Done</button>
        </div>
      );
    }
    return <DisplayCell value={value} col={col} onClick={() => !disabled && setIsEditing(true)} disabled={disabled} />;
  }

  // ─── TEXTAREA ──────────────────────────────────────────────────────────
  if (col.type === 'textarea') {
    if (isEditing) {
      return (
        <textarea
          ref={inputRef}
          value={draft || ''}
          onChange={e => setDraft(e.target.value)}
          onBlur={() => commit(draft)}
          onKeyDown={e => { if (e.key === 'Escape') { setIsEditing(false); setDraft(value); } }}
          rows={3}
          className="w-full rounded-lg border border-indigo-300 bg-white px-2 py-1 text-sm outline-none ring-2 ring-indigo-100 resize-none"
          style={{ minWidth: 180 }}
        />
      );
    }
    return <DisplayCell value={value} col={col} onClick={() => !disabled && setIsEditing(true)} disabled={disabled} />;
  }

  // ─── TEXT / NUMBER / PHONE / DATE ────────────────────────────────────────
  const inputType =
    col.type === 'number' ? 'number'
    : col.type === 'phone' ? 'tel'
    : col.type === 'date' ? 'date'
    : 'text';

  if (isEditing) {
    return (
      <div className="h-10 flex items-center px-1">
        <input
          ref={inputRef}
          type={inputType}
          value={draft || ''}
          onChange={e => setDraft(e.target.value)}
          onBlur={() => commit(draft)}
          onKeyDown={handleKeyDown}
          className="w-full rounded-lg border border-indigo-300 bg-white px-2 py-1 text-sm outline-none ring-2 ring-indigo-100"
          style={{ minWidth: 100 }}
        />
      </div>
    );
  }

  return <DisplayCell value={value} col={col} onClick={() => !disabled && setIsEditing(true)} disabled={disabled} />;
}

// ── DisplayCell — the non-editing view ──────────────────────────────────────
function DisplayCell({ value, col, onClick, disabled }) {
  const isEmpty = value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);

  let content;
  if (isEmpty) {
    content = (
      <span className="text-gray-300 italic text-xs select-none">click to edit</span>
    );
  } else if (col.type === 'multiselect') {
    const arr = Array.isArray(value) ? value : [];
    content = (
      <div className="flex flex-wrap gap-1">
        {arr.map(v => (
          <span key={v} className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold">{v}</span>
        ))}
      </div>
    );
  } else if (col.type === 'select' || col.type === 'radio') {
    content = (
      <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold">{value}</span>
    );
  } else if (col.type === 'date') {
    // Format date nicely
    try {
      const d = new Date(value + 'T00:00:00');
      content = <span className="text-sm text-gray-700">{d.toLocaleDateString()}</span>;
    } catch {
      content = <span className="text-sm text-gray-700">{value}</span>;
    }
  } else if (col.type === 'phone') {
    content = <span className="font-mono text-sm text-gray-700">{value}</span>;
  } else if (col.type === 'textarea') {
    content = <span className="text-sm text-gray-700 line-clamp-2">{value}</span>;
  } else {
    content = <span className="text-sm text-gray-700">{value}</span>;
  }

  return (
    <div
      onClick={onClick}
      className={clsx(
        "h-10 px-1.5 transition-colors flex items-center rounded-lg",
        disabled ? "cursor-default opacity-80" : "cursor-pointer hover:bg-indigo-50/60 group/cell"
      )}
      title={disabled ? "This row is locked" : "Click to edit"}
    >
      <div className="w-full overflow-hidden">
        {content}
      </div>
    </div>
  );
}
