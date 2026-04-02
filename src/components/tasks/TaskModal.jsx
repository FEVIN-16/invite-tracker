import { useState, useEffect } from 'react';
import { X, CheckSquare, AlignLeft } from 'lucide-react';
import { Button } from '../ui/Button';
import { addTask, updateTask } from '../../db/tasksDb';
import { useUIStore } from '../../store/uiStore';
import { v4 as uuidv4 } from 'uuid';

export function TaskModal({ isOpen, onClose, onSuccess, task, group, eventId }) {
  const { addToast } = useUIStore();
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (task) {
      setName(task.name);
      setNotes(task.notes || '');
    } else {
      setName('');
      setNotes('');
    }
  }, [task, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const data = {
        id: task?.id || uuidv4(),
        groupId: group?.id,
        eventId,
        name: name.trim(),
        notes: notes.trim(),
        isDone: task?.isDone || false,
        createdAt: task?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (task) {
        await updateTask(data);
        addToast('Task updated');
      } else {
        await addTask(data);
        addToast('Task added to ' + group.name);
      }
      onSuccess();
      onClose();
    } catch {
      addToast('Error saving task', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden scale-in">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">
                {task ? 'Edit Task' : 'Add Task'}
              </h2>
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">
                In Group: <span className="text-indigo-600 dark:text-indigo-400">{group?.name}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest pl-1">
              Task Name
            </label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500 dark:focus:border-indigo-600 rounded-xl text-sm font-bold text-gray-900 dark:text-white transition-all outline-none"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest pl-1 flex items-center gap-1.5">
              <AlignLeft className="w-3 h-3" /> Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add more details..."
              rows={3}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500 dark:focus:border-indigo-600 rounded-xl text-sm font-bold text-gray-900 dark:text-white transition-all outline-none resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" isisLoading={isSubmitting} className="flex-1">
              {task ? 'Update' : 'Add Task'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
