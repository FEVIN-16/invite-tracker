import { Calendar, MapPin, Users, ChevronRight, Edit3, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { format } from 'date-fns';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { deleteEvent } from '../../db/eventsDb';
import { useUIStore } from '../../store/uiStore';
import { useEventStore } from '../../store/eventStore';

export function EventCard({ event, onRefresh }) {
  const navigate = useNavigate();
  const { addToast } = useUIStore();
  const { setCurrentEvent } = useEventStore();
  const [showDelete, setShowDelete] = useState(false);

  async function handleDelete() {
    try {
      await deleteEvent(event.id);
      addToast('Event deleted successfully');
      onRefresh();
    } catch {
      addToast('Error deleting event', 'error');
    }
  }

  function handleOpen() {
    setCurrentEvent(event);
    navigate(`/events/${event.id}/categories`);
  }

  return (
    <>
      <div className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col h-full">
        <div className="p-5 flex-1 cursor-pointer" onClick={handleOpen}>
          <div className="flex justify-between items-start mb-4">
            <Badge label={event.type} className="capitalize bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400" />
            <button
               onClick={(e) => { e.stopPropagation(); setShowDelete(true); }}
               className="p-1.5 text-gray-400 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">{event.title}</h3>
          
          <div className="space-y-2 mt-4">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
              <Calendar className="w-4 h-4 flex-shrink-0 text-gray-400 dark:text-gray-600" />
              <span>{event.date ? format(new Date(event.date), 'PPP') : 'No date set'}</span>
            </div>
            {event.location && (
              <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                <MapPin className="w-4 h-4 flex-shrink-0 text-gray-400 dark:text-gray-600" />
                <span className="truncate">{event.location}</span>
              </div>
            )}
          </div>
        </div>

        <div className="px-5 py-4 bg-gray-50/50 dark:bg-gray-800/20 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <Link
            to={`/events/${event.id}/edit`}
            className="text-xs font-bold text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit
          </Link>
          <button
            onClick={handleOpen}
            className="text-sm font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-1 group/btn"
          >
            Open Event
            <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Delete Event?"
        message={`Are you sure you want to delete "${event.title}"? This will permanently delete all guest lists, categories, and data within this event.`}
        confirmLabel="Yes, Delete"
      />
    </>
  );
}
