import { Users, Edit3, Trash2, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { deleteCategory } from '../../db/categoriesDb';
import { useUIStore } from '../../store/uiStore';
import { useEventStore } from '../../store/eventStore';

export function CategoryCard({ category, onEdit, onRefresh }) {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useUIStore();
  const { setCurrentCategory } = useEventStore();
  const [showDelete, setShowDelete] = useState(false);

  async function handleDelete() {
    try {
      await deleteCategory(category.id);
      addToast('Category deleted');
      onRefresh();
    } catch {
      addToast('Error deleting category', 'error');
    }
  }

  function handleOpen() {
    setCurrentCategory(category);
    navigate(`/events/${eventId}/categories/${category.id}/detail`);
  }

  return (
    <>
      <div className="group bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-all duration-200 flex flex-col h-full">
        <div className="flex justify-between items-start mb-4">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: category.color + '20', color: category.color }}
          >
            <Users className="w-5 h-5" />
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={onEdit} className="p-1.5 text-gray-400 hover:text-indigo-600"><Edit3 className="w-4 h-4" /></button>
            <button onClick={() => setShowDelete(true)} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>

        <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">{category.name}</h3>
        <p className="text-sm text-gray-500 mb-6 flex-1 line-clamp-2">{category.description || 'No description'}</p>

        <button
          onClick={handleOpen}
          className="flex items-center justify-between w-full text-sm font-semibold text-indigo-600 group/btn"
        >
          View Guests
          <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
        </button>
      </div>

      <ConfirmDialog
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Delete Category?"
        message={`Are you sure you want to delete "${category.name}"? This will also remove all guests assigned to this category.`}
        confirmLabel="Yes, Delete"
      />
    </>
  );
}
