import { useState, useEffect } from 'react';
import { v4 as uuid } from 'uuid';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { createCategory, updateCategory } from '../../db/categoriesDb';
import { useUIStore } from '../../store/uiStore';

const PRESET_COLORS = ['#6366F1', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#F43F5E', '#06B6D4'];

export function CategoryModal({ isOpen, onClose, onSuccess, category, eventId }) {
  const { addToast } = useUIStore();
  const [form, setForm] = useState({ name: '', description: '', color: PRESET_COLORS[0] });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (category) {
      setForm({ name: category.name, description: category.description || '', color: category.color });
    } else {
      setForm({ name: '', description: '', color: PRESET_COLORS[0] });
    }
  }, [category, isOpen]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;

    setIsSubmitting(true);
    try {
      if (category) {
        await updateCategory({ ...category, ...form });
        addToast('Category updated');
      } else {
        await createCategory({ ...form, id: uuid(), eventId, createdAt: new Date().toISOString() });
        addToast('Category created');
      }
      onSuccess();
      onClose();
    } catch {
      addToast('Error saving category', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={category ? 'Edit Category' : 'New Category'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} loading={isSubmitting}>{category ? 'Save Changes' : 'Create Category'}</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Category Name"
          placeholder="e.g. Groom Side Friends"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          required
          autoFocus
        />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Description (Optional)</label>
          <textarea
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            rows={2}
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Category Color</label>
          <div className="flex flex-wrap gap-3">
            {PRESET_COLORS.map(color => (
              <button
                key={color}
                type="button"
                onClick={() => setForm({ ...form, color })}
                className={`w-8 h-8 rounded-full border-2 transition-transform ${form.color === color ? 'border-gray-900 scale-110' : 'border-transparent'}`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      </form>
    </Modal>
  );
}
