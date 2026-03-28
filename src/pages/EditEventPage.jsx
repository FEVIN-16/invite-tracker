import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUIStore } from '../store/uiStore';
import { getEventById, updateEvent } from '../db/eventsDb';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { EVENT_TYPES } from '../utils/constants';
import { ArrowLeft } from 'lucide-react';
import { Spinner } from '../components/ui/Spinner';

export default function EditEventPage() {
  const { eventId } = useParams();
  const { addToast } = useUIStore();
  const navigate = useNavigate();

  const [form, setForm] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadEvent() {
      try {
        const data = await getEventById(eventId);
        if (!data) navigate('/events');
        setForm(data);
      } catch {
        addToast('Error loading event', 'error');
        navigate('/events');
      } finally {
        setIsLoading(false);
      }
    }
    loadEvent();
  }, [eventId]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) { addToast('Title is required', 'warning'); return; }

    setIsSubmitting(true);
    try {
      await updateEvent(form);
      addToast('Event updated successfully');
      navigate(`/events/${eventId}/dashboard`);
    } catch {
      addToast('Error updating event', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading || !form) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto transition-colors">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white mb-8 group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back
      </button>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg dark:shadow-2xl border border-gray-100 dark:border-gray-800 p-6 md:p-10">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-1">Edit Event Info</h1>
        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 mb-10 uppercase tracking-widest">Update your event's details</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Event Title"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Select
              label="Event Type"
              name="type"
              options={EVENT_TYPES}
              value={form.type}
              onChange={handleChange}
            />
            <Input
              label="Event Date"
              name="date"
              type="date"
              value={form.date}
              onChange={handleChange}
            />
          </div>

          <Input
            label="Location"
            name="location"
            value={form.location}
            onChange={handleChange}
          />

          <div className="flex flex-col gap-1.5">
             <label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-1">Description (Optional)</label>
             <textarea
               name="description"
               rows={4}
               className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600"
               value={form.description}
               onChange={handleChange}
             />
          </div>

          <div className="flex gap-4 pt-4">
            <Button variant="secondary" className="flex-1" onClick={() => navigate('/events')}>Cancel</Button>
            <Button type="submit" loading={isSubmitting} className="flex-1">Save Changes</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
