import { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, X, Plus } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Checkbox } from '../ui/Checkbox';
import { COLUMN_TYPES, MIN_COLUMN_WIDTH, MAX_COLUMN_WIDTH, DEFAULT_COLUMN_WIDTH } from '../../utils/constants';
import { OPTIONS_TYPES, generateUniqueFieldKey } from '../../utils/columnTypes';

const DEFAULT_FORM = {
  label: '',
  type: 'text',
  isRequired: false,
  defaultValue: '',
  options: [],
  width: DEFAULT_COLUMN_WIDTH,
};

export function ColumnFormModal({ isOpen, onClose, onSave, editingColumn, existingColumns }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [errors, setErrors] = useState({});
  const [newOption, setNewOption] = useState('');
  const isEditing = !!editingColumn;

  useEffect(() => {
    if (isOpen) {
      if (editingColumn) {
        setForm({
          label: editingColumn.label,
          type: editingColumn.type,
          isRequired: editingColumn.isRequired || false,
          defaultValue: editingColumn.defaultValue || '',
          options: editingColumn.options ? [...editingColumn.options] : [],
          width: editingColumn.width || DEFAULT_COLUMN_WIDTH,
        });
      } else {
        setForm(DEFAULT_FORM);
      }
      setErrors({});
      setNewOption('');
    }
  }, [isOpen, editingColumn]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(prev => {
      const updated = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      };
      // Reset options if type changes and doesn't need options
      if (name === 'type' && !OPTIONS_TYPES.includes(value)) {
        updated.options = [];
      }
      return updated;
    });
    setErrors(prev => ({ ...prev, [name]: null }));
  }

  function addOption() {
    const trimmed = newOption.trim();
    if (!trimmed) return;
    if (form.options.includes(trimmed)) {
      setErrors(prev => ({ ...prev, options: 'Option already exists' }));
      return;
    }
    setForm(prev => ({ ...prev, options: [...prev.options, trimmed] }));
    setNewOption('');
    setErrors(prev => ({ ...prev, options: null }));
  }

  function removeOption(index) {
    setForm(prev => ({ ...prev, options: prev.options.filter((_, i) => i !== index) }));
  }

  function moveOption(index, dir) {
    const newOpts = [...form.options];
    const swapIdx = index + dir;
    if (swapIdx < 0 || swapIdx >= newOpts.length) return;
    [newOpts[index], newOpts[swapIdx]] = [newOpts[swapIdx], newOpts[index]];
    setForm(prev => ({ ...prev, options: newOpts }));
  }

  function validate() {
    const errs = {};
    if (!form.label.trim()) errs.label = 'Label is required';
    else {
      const isDuplicate = existingColumns.some(c => 
        c.label.toLowerCase() === form.label.trim().toLowerCase() && 
        (!isEditing || c.id !== editingColumn.id)
      );
      if (isDuplicate) errs.label = 'A column with this label already exists';
    }

    if (OPTIONS_TYPES.includes(form.type) && form.options.length === 0) {
      errs.options = 'At least one option is required';
    }
    return errs;
  }

  function handleSave() {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const fieldKey = isEditing 
      ? editingColumn.fieldKey 
      : generateUniqueFieldKey(form.label, existingColumns.map(c => c.fieldKey));

    onSave({ ...form, fieldKey });
  }

  const needsOptions = OPTIONS_TYPES.includes(form.type);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Column' : 'Add New Column'}
      size="md"
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>{isEditing ? 'Update Column' : 'Create Column'}</Button>
        </div>
      }
    >
      <div className="space-y-6 py-2">
        <Input
          label="Column Label"
          name="label"
          value={form.label}
          onChange={handleChange}
          error={errors.label}
          placeholder="e.g. Dietary Requirements"
          disabled={editingColumn?.isSystem}
          required
        />

        <Select
          label="Field Type"
          name="type"
          value={form.type}
          onChange={handleChange}
          options={COLUMN_TYPES}
          disabled={editingColumn?.isSystem}
          required
        />

        {needsOptions && (
          <div className="space-y-3">
            <label className="text-sm font-bold text-gray-700">Options</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newOption}
                onChange={e => setNewOption(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addOption())}
                placeholder="Add option..."
                className="flex-1 rounded-xl border border-gray-300 px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
              <Button type="button" variant="secondary" size="sm" onClick={addOption} icon={Plus}>Add</Button>
            </div>
            {errors.options && <p className="text-xs text-red-500 font-medium">{errors.options}</p>}
            
            <div className="space-y-2 max-h-48 overflow-auto pr-2">
              {form.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 group">
                  <div className="flex flex-col gap-0.5">
                    <button type="button" onClick={() => moveOption(i, -1)} disabled={i === 0} className="text-gray-300 hover:text-gray-600 disabled:opacity-0"><ChevronUp className="w-3.5 h-3.5" /></button>
                    <button type="button" onClick={() => moveOption(i, 1)} disabled={i === form.options.length - 1} className="text-gray-300 hover:text-gray-600 disabled:opacity-0"><ChevronDown className="w-3.5 h-3.5" /></button>
                  </div>
                  <span className="flex-1 text-sm font-medium text-gray-700">{opt}</span>
                  <button type="button" onClick={() => removeOption(i)} className="p-1 text-gray-300 hover:text-red-500 transition-colors"><X className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>
        )}


        <Checkbox
          label="This field is required"
          name="isRequired"
          checked={form.isRequired}
          onChange={handleChange}
          disabled={editingColumn?.isSystem}
        />
      </div>
    </Modal>
  );
}
