import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Settings2, GripVertical, AlertTriangle } from 'lucide-react';
import { getColumnsByEvent, updateColumnsOrder } from '../db/columnsDb';
import { getEventById } from '../db/eventsDb';
import { useUIStore } from '../store/uiStore';
import { useEventStore } from '../store/eventStore';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { ColumnItem } from '../components/columns/ColumnItem';
import { ColumnModal } from '../components/columns/ColumnModal';
import { Spinner } from '../components/ui/Spinner';

export default function ColumnConfigPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useUIStore();
  const { currentEvent, setCurrentEvent } = useEventStore();

  const [columns, setColumns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState(null);

  async function fetchData() {
    try {
      if (!currentEvent || currentEvent.id !== eventId) {
        const event = await getEventById(eventId);
        if (!event) { navigate('/events'); return; }
        setCurrentEvent(event);
      }
      const data = await getColumnsByEvent(eventId);
      setColumns(data.sort((a, b) => a.order - b.order));
    } catch {
      addToast('Error loading columns', 'error');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [eventId]);

  function handleEdit(column) {
    setEditingColumn(column);
    setIsModalOpen(true);
  }

  function handleCloseModal() {
    setIsModalOpen(false);
    setEditingColumn(null);
  }

  async function moveColumn(index, direction) {
    const newColumns = [...columns];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newColumns.length) return;

    const [moved] = newColumns.splice(index, 1);
    newColumns.splice(targetIndex, 0, moved);

    // Update order property
    const updated = newColumns.map((col, i) => ({ ...col, order: i }));
    setColumns(updated);
    
    try {
      await updateColumnsOrder(updated);
    } catch {
      addToast('Error saving order', 'error');
      fetchData();
    }
  }

  if (isLoading && !currentEvent) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Custom Columns</h1>
          <p className="text-sm text-gray-500 mt-1">
            Define guest data fields for <span className="font-semibold text-indigo-600">{currentEvent?.title}</span>
          </p>
        </div>
        <Button icon={Plus} onClick={() => setIsModalOpen(true)}>Add Column</Button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
        <p className="text-sm text-amber-800">
          Changing column types after adding guests may cause existing data for that column to be hidden or misinterpreted.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : columns.length > 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-100">
            {columns.map((col, index) => (
              <ColumnItem 
                key={col.id} 
                column={col} 
                index={index}
                isFirst={index === 0}
                isLast={index === columns.length - 1}
                onEdit={() => handleEdit(col)}
                onMove={moveColumn}
                onRefresh={fetchData} 
              />
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          icon={Settings2}
          heading="No custom columns"
          subtext="Add columns like 'Phone', 'RSVP Status', 'Food Preference', or 'Travel Details' to track more info."
          actions={
            <Button icon={Plus} onClick={() => setIsModalOpen(true)}>Create First Column</Button>
          }
        />
      )}

      <ColumnModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onSuccess={fetchData}
        column={editingColumn}
        eventId={eventId}
        nextOrder={columns.length}
      />
    </div>
  );
}
