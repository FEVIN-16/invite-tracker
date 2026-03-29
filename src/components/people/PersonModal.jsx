import { useState, useEffect } from 'react';
import { v4 as uuid } from 'uuid';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Checkbox } from '../ui/Checkbox';
import { createPerson, updatePerson } from '../../db/peopleDb';
import { validateEmail, validatePhone } from '../../utils/validation';
import { useUIStore } from '../../store/uiStore';
import clsx from 'clsx';

export function PersonModal({ isOpen, onClose, onSuccess, person, categoryId, eventId, columns }) {
  const { addToast } = useUIStore();
  const [form, setForm] = useState({ name: '', dynamicFields: {} });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (person) {
      setForm({ name: person.name, dynamicFields: { ...person.dynamicFields } });
    } else {
      const initialFields = {};
      columns.forEach(col => {
        if (col.type === 'checkbox') initialFields[col.id] = false;
        else if (col.type === 'multiselect') initialFields[col.id] = [];
        else initialFields[col.id] = col.defaultValue || '';
      });
      setForm({ name: '', dynamicFields: initialFields });
    }
    setErrors({});
  }, [person, isOpen, columns]);

  function handleFieldChange(colId, value) {
    setForm(prev => ({
      ...prev,
      dynamicFields: { ...prev.dynamicFields, [colId]: value }
    }));
    if (errors[colId]) setErrors(prev => ({ ...prev, [colId]: null }));
  }

  function toggleMultiSelect(colId, opt) {
    const current = form.dynamicFields[colId] || [];
    const updated = current.includes(opt) 
      ? current.filter(o => o !== opt)
      : [...current, opt];
    handleFieldChange(colId, updated);
  }

  async function handleSubmit(e) {
    if (e) e.preventDefault();
    if (!form.name.trim()) return;

    // Validation
    const newErrors = {};
    columns.forEach(col => {
      const val = form.dynamicFields[col.id];
      if (col.type === 'email') {
        const res = validateEmail(val);
        if (!res.isValid) newErrors[col.id] = res.error;
      }
      if (col.type === 'phone') {
        const res = validatePhone(val);
        if (!res.isValid) newErrors[col.id] = res.error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      addToast('Please fix the errors before saving', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const personData = {
        ...form,
        id: person?.id || uuid(),
        categoryId,
        eventId,
        createdAt: person?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      if (person) {
        await updatePerson(personData);
        addToast('Guest details updated');
      } else {
        await createPerson(personData);
        addToast('Guest added to the list');
      }
      onSuccess();
      onClose();
    } catch {
      addToast('Error saving guest', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={person ? 'Edit Guest Details' : 'Add New Guest'}
      size="lg"
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} loading={isSubmitting} disabled={person?.isLocked}>{person ? 'Save Changes' : 'Add Guest'}</Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6 py-2">
        <Input
          label="Full Name"
          placeholder="e.g. Rahul Sharma"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          required
          autoFocus
          disabled={person?.isLocked}
          className="text-lg font-bold"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
          {columns.map(col => {
            const val = form.dynamicFields[col.id];

            if (col.type === 'textarea') {
              return (
                <div key={col.id} className="md:col-span-2 space-y-1.5">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">{col.label}</label>
                  <textarea
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all min-h-[80px] bg-white dark:bg-gray-900 text-gray-900 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-950 disabled:text-gray-400 dark:disabled:text-gray-600"
                    value={val || ''}
                    onChange={e => handleFieldChange(col.id, e.target.value)}
                    placeholder={`Enter ${col.label.toLowerCase()}...`}
                    disabled={person?.isLocked}
                  />
                </div>
              );
            }

            if (col.type === 'select') {
              return (
                <Select
                  key={col.id}
                  label={col.label}
                  options={col.options.map(o => ({ value: o, label: o }))}
                  value={val || ''}
                  onChange={e => handleFieldChange(col.id, e.target.value)}
                  disabled={person?.isLocked}
                />
              );
            }

            if (col.type === 'checkbox') {
              return (
                <div key={col.id} className="flex items-center pt-6">
                  <Checkbox
                    label={col.label}
                    checked={!!val}
                    onChange={e => handleFieldChange(col.id, e.target.checked)}
                    disabled={person?.isLocked}
                  />
                </div>
              );
            }

            if (col.type === 'radio') {
              return (
                <div key={col.id} className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">{col.label}</label>
                  <div className="flex flex-wrap gap-2">
                    {col.options.map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => !person?.isLocked && handleFieldChange(col.id, opt)}
                        disabled={person?.isLocked}
                        className={clsx(
                          "px-4 py-1.5 rounded-full text-xs font-bold border transition-all",
                          val === opt 
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100 dark:shadow-none" 
                            : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:border-indigo-300 dark:hover:border-indigo-900"
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              );
            }

            if (col.type === 'multiselect') {
              const selected = val || [];
              return (
                <div key={col.id} className="md:col-span-2 space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">{col.label}</label>
                  <div className="flex flex-wrap gap-2">
                    {col.options.map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => !person?.isLocked && toggleMultiSelect(col.id, opt)}
                        disabled={person?.isLocked}
                        className={clsx(
                          "px-4 py-1.5 rounded-full text-xs font-bold border transition-all",
                          selected.includes(opt) 
                            ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-100 dark:shadow-none" 
                            : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:border-emerald-300 dark:hover:border-emerald-900"
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              );
            }

            return (
              <Input
                key={col.id}
                label={col.label}
                type={col.type === 'phone' ? 'tel' : col.type}
                value={val || ''}
                onChange={e => handleFieldChange(col.id, e.target.value)}
                disabled={person?.isLocked}
                error={errors[col.id]}
              />
            );
          })}
        </div>
      </form>
    </Modal>
  );
}
