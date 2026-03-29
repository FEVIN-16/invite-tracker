import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuid } from 'uuid';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { useEventStore } from '../store/eventStore';
import { createEvent } from '../db/eventsDb';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { EVENT_TYPES } from '../utils/constants';
import { ArrowLeft } from 'lucide-react';

export default function CreateEventPage() {
  const { user } = useAuthStore();
  const { addToast } = useUIStore();
  const { setCurrentEvent } = useEventStore();
  const navigate = useNavigate();

  const [form, setForm] = useState({ title: '', type: 'marriage', date: '', location: '', description: '' });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: null }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) { setErrors({ title: 'Event title is required' }); return; }

    setIsSubmitting(true);
    try {
      const event = {
        ...form,
        id: uuid(),
        userId: user.id,
        createdAt: new Date().toISOString(),
      };
      await createEvent(event);
      setCurrentEvent(event);
      addToast('Event created successfully');
      navigate(`/events/${event.id}/categories`);
    } catch {
      addToast('Error creating event', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto transition-colors">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white mb-8 group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back
      </button>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg dark:shadow-2xl border border-gray-100 dark:border-gray-800 p-6 md:p-10">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-1">Create New Event</h1>
        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 mb-10 uppercase tracking-widest">Set up your event's basic information</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Event Title"
            name="title"
            placeholder="e.g. Raj & Priya's Wedding"
            value={form.title}
            onChange={handleChange}
            error={errors.title}
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
            placeholder="e.g. Grand Mercure, Bengaluru"
            value={form.location}
            onChange={handleChange}
          />

          <div className="flex flex-col gap-1.5">
             <label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-1">Description (Optional)</label>
             <textarea
               name="description"
               rows={4}
               className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600"
               placeholder="Brief notes about the event..."
               value={form.description}
               onChange={handleChange}
             />
          </div>

          <div className="flex gap-4 pt-4">
            <Button variant="secondary" className="flex-1" onClick={() => navigate('/events')}>Cancel</Button>
            <Button type="submit" loading={isSubmitting} className="flex-1">Create Event</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
