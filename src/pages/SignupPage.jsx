import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { v4 as uuid } from 'uuid';
import { initDB } from '../db/index';
import { hashPassword } from '../utils/crypto';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { CalendarHeart } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mb-3">
            <CalendarHeart className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">InviteTracker</h1>
          <p className="text-sm text-gray-500 mt-1">Create your account</p>
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

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 font-medium hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}
