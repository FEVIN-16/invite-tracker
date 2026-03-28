import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { initDB } from '../../db/index';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { User, ShieldCheck } from 'lucide-react';

export function ProfileEditModal({ isOpen, onClose }) {
  const { user, setUser } = useAuthStore();
  const { addToast } = useUIStore();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave(e) {
    e.preventDefault();
    if (!displayName.trim()) return;

    setIsSaving(true);
    try {
      const db = await initDB();
      const updatedUser = { ...user, displayName: displayName.trim() };
      await db.put('users', updatedUser);
      setUser(updatedUser);
      addToast('Profile updated successfully');
      onClose();
    } catch (error) {
      addToast('Error updating profile', 'error');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Profile">
      <form onSubmit={handleSave} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Display Name</label>
            <div className="relative group">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-bold text-gray-900"
                placeholder="Your Name"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Username (Read Only)</label>
            <div className="relative opacity-60">
              <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={user?.username}
                disabled
                className="w-full pl-10 pr-4 py-3 bg-gray-100 border border-gray-200 rounded-xl font-bold text-gray-500 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1" type="button">
            Cancel
          </Button>
          <Button type="submit" isLoading={isSaving} className="flex-1">
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
