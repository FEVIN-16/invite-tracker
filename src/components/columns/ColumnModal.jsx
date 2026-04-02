import { useState, useEffect } from 'react';
import { v4 as uuid } from 'uuid';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { createColumn, updateColumn } from '../../db/columnsDb';
import { useUIStore } from '../../store/uiStore';
import { COLUMN_TYPES } from '../../utils/constants';
import { X, Plus } from 'lucide-react';

export function ColumnModal({ isOpen, onClose, onSuccess, column, eventId, nextOrder }) {
  const { addToast } = useUIStore();
  const [form, setForm] = useState({ label: '', type: 'text', options: [] });
  const [newOption, setNewOption] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (column) {
      setForm({ label: column.label, type: column.type, options: column.options || [] });
    } else {
      setForm({ label: '', type: 'text', options: [] });
    }
    setNewOption('');
  }, [column, isOpen]);

  function addOption() {
    if (!newOption.trim()) return;
    if (form.options.includes(newOption.trim())) return;
    setForm({ ...form, options: [...form.options, newOption.trim()] });
    setNewOption('');
  }

  function removeOption(index) {
    setForm({ ...form, options: form.options.filter((_, i) => i !== index) });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.label.trim()) return;
    if (form.type === 'select' && form.options.length === 0) {
      addToast('Select columns need at least one option', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      if (column) {
        await updateColumn({ ...column, ...form });
        addToast('Column updated');
      } else {
        await createColumn({ ...form, id: uuid(), eventId, order: nextOrder, createdAt: new Date().toISOString() });
        addToast('Column created');
      }
      onSuccess();
      onClose();
    } catch {
      addToast('Error saving column', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={column ? 'Edit Column' : 'New Column'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} isLoading={isSubmitting}>{column ? 'Save Changes' : 'Add Column'}</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Column Label"
          placeholder="e.g. Phone Number, RSVP, Food Preference"
          value={form.label}
          onChange={e => setForm({ ...form, label: e.target.value })}
          required
          autoFocus
        />
        
        <Select
          label="Data Type"
          options={COLUMN_TYPES}
          value={form.type}
          onChange={e => setForm({ ...form, type: e.target.value })}
        />

        {form.type === 'select' && (
          <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <label className="text-sm font-medium text-gray-700">Dropdown Options</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Veg, Non-Veg"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                value={newOption}
                onChange={e => setNewOption(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addOption())}
              />
              <Button type="button" variant="secondary" size="sm" onClick={addOption} icon={Plus}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.options.map((opt, i) => (
                <span key={i} className="inline-flex items-center gap-1 bg-white border border-gray-200 rounded-md px-2 py-1 text-xs font-medium">
                  {opt}
                  <button type="button" onClick={() => removeOption(i)} className="text-gray-400 hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
}
