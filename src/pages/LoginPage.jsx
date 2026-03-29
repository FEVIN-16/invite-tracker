import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { initDB } from '../db/index';
import { hashPassword } from '../utils/crypto';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { CalendarHeart, Moon, Sun } from 'lucide-react';

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
          <p className="text-xs font-bold text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-widest">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {errors.form && (
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 text-red-700 dark:text-red-400 text-sm rounded-lg px-3 py-2 font-bold">
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

        <p className="text-center text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mt-8">
          New here?{' '}
          <Link to="/signup" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
