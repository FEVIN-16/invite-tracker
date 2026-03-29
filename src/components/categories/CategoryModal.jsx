import { useState, useEffect } from 'react';
import { v4 as uuid } from 'uuid';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { getCategoryById, createCategory, updateCategory } from '../../db/categoriesDb';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { X, FileText, Image as ImageIcon, Plus, Paperclip } from 'lucide-react';

const PRESET_COLORS = ['#6366F1', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#F43F5E', '#06B6D4'];

export function CategoryModal({ isOpen, onClose, onSuccess, category, eventId }) {
  const { addToast } = useUIStore();
  const [form, setForm] = useState({ 
    name: '', 
    description: '', 
    color: PRESET_COLORS[0],
    inviteMessage: '',
    attachments: [] // { id, name, type, size, data }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (category) {
      setForm({ 
        name: category.name, 
        description: category.description || '', 
        color: category.color,
        inviteMessage: category.inviteMessage || '',
        attachments: category.attachments || []
      });
    } else {
      setForm({ 
        name: '', 
        description: '', 
        color: PRESET_COLORS[0],
        inviteMessage: '',
        attachments: []
      });
    }
  }, [category, isOpen]);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    const newAttachments = [];

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        addToast(`File ${file.name} is too large (>5MB)`, 'error');
        continue;
      }

      const reader = new FileReader();
      const promise = new Promise((resolve) => {
        reader.onload = (event) => {
          resolve({
            id: uuid(),
            name: file.name,
            type: file.type,
            size: file.size,
            data: event.target.result
          });
        };
      });
      reader.readAsDataURL(file);
      newAttachments.push(await promise);
    }

    setForm(prev => ({ 
      ...prev, 
      attachments: [...prev.attachments, ...newAttachments] 
    }));
  };

  const removeAttachment = (id) => {
    setForm(prev => ({ 
      ...prev, 
      attachments: prev.attachments.filter(a => a.id !== id) 
    }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;

    setIsSubmitting(true);
    try {
      if (category) {
        await updateCategory({ ...category, ...form });
        addToast('Category updated');
      } else {
        const userId = useAuthStore.getState().user.id;
        await createCategory({ 
          ...form, 
          id: uuid(), 
          eventId: eventId || null, 
          userId, 
          createdAt: new Date().toISOString() 
        });
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

        <div className="pt-4 border-t border-gray-100">
          <label className="text-xs font-black text-gray-500 uppercase tracking-widest pl-1 mb-2 block">Invitation Details</label>
          <div className="flex flex-col gap-1.5 mb-4">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Invite Message</label>
            <textarea
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-gray-400"
              rows={4}
              placeholder="Enter the invitation message for this group..."
              value={form.inviteMessage}
              onChange={e => setForm({ ...form, inviteMessage: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Attachments (Images, GIFs, PDFs)</label>
            
            <div className="grid grid-cols-2 gap-3">
              {form.attachments.map(file => (
                <div key={file.id} className="relative group bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-2 pr-10 overflow-hidden">
                  <div className="flex items-center gap-2">
                    {file.type.startsWith('image/') ? (
                      <div className="w-8 h-8 rounded bg-gray-100 overflow-hidden flex-shrink-0">
                        <img src={file.data} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-indigo-500" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-gray-900 dark:text-white truncate">{file.name}</p>
                      <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttachment(file.id)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              
              <label className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-3 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-indigo-50/30 transition-all group/up">
                <input 
                  type="file" 
                  className="hidden" 
                  multiple 
                  accept="image/*,.pdf" 
                  onChange={handleFileChange} 
                />
                <Paperclip className="w-4 h-4 text-gray-400 group-hover/up:text-indigo-500" />
                <span className="text-[10px] font-black text-gray-400 group-hover/up:text-indigo-500 uppercase tracking-widest">Attach Docs</span>
              </label>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}
