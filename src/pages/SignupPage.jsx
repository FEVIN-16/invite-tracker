import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { v4 as uuid } from 'uuid';
import { initDB } from '../db/index';
import { hashPassword } from '../utils/crypto';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { CalendarHeart, Moon, Sun } from 'lucide-react';

function validate(form) {
  const errors = {};
  if (!form.displayName.trim()) errors.displayName = 'Display name is required';
  if (!form.username.trim()) errors.username = 'Username is required';
  else if (!/^[a-z0-9_]+$/.test(form.username)) errors.username = 'Only lowercase letters, numbers, underscore';
  else if (form.username.length > 30) errors.username = 'Max 30 characters';
  if (!form.password) errors.password = 'Password is required';
  else if (form.password.length < 6) errors.password = 'Minimum 6 characters';
  if (form.confirmPassword !== form.password) errors.confirmPassword = 'Passwords do not match';
  return errors;
}

export default function SignupPage() {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const { addToast } = useUIStore();

  const [form, setForm] = useState({ displayName: '', username: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: name === 'username' ? value.toLowerCase() : value }));
    setErrors(prev => ({ ...prev, [name]: null }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return; }

    setIsSubmitting(true);
    try {
      const db = await initDB();
      const existing = await db.getFromIndex('users', 'username', form.username);
      if (existing) { setErrors({ username: 'Username already taken' }); return; }

      const passwordHash = await hashPassword(form.password);
      const user = {
        id: uuid(),
        username: form.username,
        displayName: form.displayName.trim(),
        passwordHash,
        createdAt: new Date().toISOString(),
      };
      await db.add('users', user);
      localStorage.setItem('currentUserId', user.id);
      setUser({ id: user.id, username: user.username, displayName: user.displayName });
      navigate('/events');
    } catch (e) {
      addToast('Error creating account. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4 transition-colors relative">
      <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-lg dark:shadow-2xl p-8 border border-transparent dark:border-gray-800 relative group overflow-hidden">
        {/* Theme Toggle */}
        <button 
          onClick={useUIStore.getState().toggleTheme}
          className="absolute top-4 right-4 p-2.5 text-gray-400 dark:text-gray-600 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-gray-800 rounded-xl transition-all z-10"
          title="Toggle Theme"
        >
          {useUIStore.getState().theme === 'light' ? (
            <Moon className="w-4 h-4" fill="currentColor" fillOpacity={0.1} />
          ) : (
            <Sun className="w-4 h-4" />
          )}
        </button>
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mb-3">
            <CalendarHeart className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">InviteTracker</h1>
          <p className="text-xs font-bold text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-widest">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Display Name"
            name="displayName"
            type="text"
            value={form.displayName}
            onChange={handleChange}
            error={errors.displayName}
            placeholder="Your full name"
            required
            maxLength={50}
          />
          <Input
            label="Username"
            name="username"
            type="text"
            value={form.username}
            onChange={handleChange}
            error={errors.username}
            placeholder="e.g. rajan_kumar"
            required
            maxLength={30}
            helperText="Lowercase letters, numbers, underscore only"
          />
          <Input
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
            placeholder="Min 6 characters"
            required
          />
          <Input
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            placeholder="Re-enter password"
            required
          />

          <Button type="submit" loading={isSubmitting} className="w-full mt-2">
            Create Account
          </Button>
        </form>

        <p className="text-center text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mt-8">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">Login</Link>
        </p>
      </div>
    </div>
  );
}
