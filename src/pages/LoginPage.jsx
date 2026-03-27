import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { initDB } from '../db/index';
import { hashPassword } from '../utils/crypto';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { CalendarHeart } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const { addToast } = useUIStore();

  const [form, setForm] = useState({ username: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: null, form: null }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const newErrors = {};
    if (!form.username) newErrors.username = 'Required';
    if (!form.password) newErrors.password = 'Required';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setIsSubmitting(true);
    try {
      const db = await initDB();
      const user = await db.getFromIndex('users', 'username', form.username.toLowerCase());
      if (!user) { setErrors({ form: 'Invalid username or password' }); return; }

      const hash = await hashPassword(form.password);
      if (hash !== user.passwordHash) { setErrors({ form: 'Invalid username or password' }); return; }

      localStorage.setItem('currentUserId', user.id);
      setUser({ id: user.id, username: user.username, displayName: user.displayName });
      navigate('/events');
    } catch (e) {
      addToast('Login failed. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mb-3">
            <CalendarHeart className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">InviteTracker</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {errors.form && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
              {errors.form}
            </div>
          )}
          <Input
            label="Username"
            name="username"
            type="text"
            value={form.username}
            onChange={handleChange}
            error={errors.username}
            placeholder="Your username"
            required
          />
          <Input
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
            placeholder="Your password"
            required
          />

          <Button type="submit" loading={isSubmitting} className="w-full mt-2">
            Sign In
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          New here?{' '}
          <Link to="/signup" className="text-indigo-600 font-medium hover:underline">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
