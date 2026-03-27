import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuid } from 'uuid';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { createEvent } from '../db/eventsDb';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { EVENT_TYPES } from '../utils/constants';
import { ArrowLeft } from 'lucide-react';

export default function CreateEventPage() {
  const user = useAuthStore(state => state.user);
  const { addToast } = useUIStore();
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
      addToast('Event created successfully');
      navigate(`/events/${event.id}/dashboard`);
    } catch {
      addToast('Error creating event', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6 group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Create New Event</h1>
        <p className="text-sm text-gray-500 mb-8">Set up your event's basic information</p>

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

          <div className="flex flex-col gap-1">
             <label className="text-sm font-medium text-gray-700">Description (Optional)</label>
             <textarea
               name="description"
               rows={3}
               className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
