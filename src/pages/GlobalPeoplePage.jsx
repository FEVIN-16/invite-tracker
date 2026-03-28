import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Search, Tag, ArrowRight, Edit2, Trash2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { getGroupsByUser, createGroup, updateGroup, deleteGroup, getContactsByGroup } from '../db/contactsDb';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Spinner } from '../components/ui/Spinner';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { v4 as uuid } from 'uuid';
import clsx from 'clsx';

const COLORS = ['#6366F1', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#F43F5E', '#06B6D4'];

function GroupModal({ isOpen, onClose, onSuccess, group }) {
  const { addToast } = useUIStore();
  const user = useAuthStore(s => s.user);
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (group) { setName(group.name); setColor(group.color); }
    else { setName(''); setColor(COLORS[0]); }
  }, [group, isOpen]);

  async function handleSave(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (group) {
        await updateGroup({ ...group, name: name.trim(), color });
        addToast('Group updated');
      } else {
        await createGroup({ id: uuid(), userId: user.id, name: name.trim(), color, createdAt: new Date().toISOString() });
        addToast('Group created');
      }
      onSuccess();
      onClose();
    } catch {
      addToast('Error saving group', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={group ? 'Edit Group' : 'New People Group'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}>{group ? 'Save' : 'Create Group'}</Button>
        </>
      }
    >
      <form onSubmit={handleSave} className="space-y-5">
        <Input
          label="Group Name"
          placeholder="e.g. Family, Friends, Colleagues"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          autoFocus
        />
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Color</label>
          <div className="flex flex-wrap gap-3">
            {COLORS.map(c => (
              <button
                key={c} type="button"
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full border-2 transition-transform ${color === c ? 'border-gray-900 scale-110' : 'border-transparent'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default function GlobalPeoplePage() {
  const user = useAuthStore(s => s.user);
  const navigate = useNavigate();
  const { addToast } = useUIStore();

  const [groups, setGroups] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [deletingGroup, setDeletingGroup] = useState(null);

  async function loadData() {
    if (!user) return;
    try {
      const gs = await getGroupsByUser(user.id);
      const withCounts = await Promise.all(gs.map(async g => {
        const contacts = await getContactsByGroup(g.id);
        return { ...g, count: contacts.length };
      }));
      setGroups(withCounts.sort((a, b) => a.name.localeCompare(b.name)));
    } catch {
      addToast('Error loading groups', 'error');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { loadData(); }, [user?.id]);

  async function handleDelete() {
    try {
      await deleteGroup(deletingGroup.id);
      addToast('Group deleted');
      loadData();
    } catch {
      addToast('Error deleting group', 'error');
    } finally {
      setDeletingGroup(null);
    }
  }

  const filtered = groups.filter(g => g.name.toLowerCase().includes(search.toLowerCase()));

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">People</h1>
          <p className="text-sm text-gray-500 mt-1">Your global contact book — organized by group</p>
        </div>
        <Button icon={Plus} onClick={() => { setEditingGroup(null); setIsModalOpen(true); }}>New Group</Button>
      </div>

      {/* Search */}
      <div className="relative mb-8 max-w-sm">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search groups..."
          className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          heading={search ? 'No matching groups' : 'No groups yet'}
          subtext={search ? 'Try a different search term' : "Create groups like 'Family', 'Friends', or 'Colleagues' to organise your contacts."}
          actions={!search && <Button icon={Plus} onClick={() => setIsModalOpen(true)}>Create First Group</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(g => (
            <div
              key={g.id}
              className="group relative bg-white border border-gray-100 rounded-3xl p-5 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all overflow-hidden"
            >
              {/* Colour blob */}
              <div
                className="absolute top-0 right-0 w-28 h-28 -mr-10 -mt-10 rounded-full opacity-5 group-hover:opacity-10 transition-opacity"
                style={{ backgroundColor: g.color }}
              />

              {/* Edit / Delete */}
              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button
                  onClick={() => { setEditingGroup(g); setIsModalOpen(true); }}
                  className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeletingGroup(g)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Icon + Name */}
              <div className="flex items-center gap-4 mb-6">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${g.color}15`, color: g.color }}
                >
                  <Tag className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-900 truncate">{g.name}</h3>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">{g.count} People</p>
                </div>
              </div>

              {/* Open button */}
              <button
                onClick={() => navigate(`/people/${g.id}`)}
                className="flex items-center text-sm font-semibold text-indigo-600 hover:gap-2 gap-1 transition-all"
              >
                Open List <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}

          {/* Add card */}
          <button
            onClick={() => { setEditingGroup(null); setIsModalOpen(true); }}
            className="border-2 border-dashed border-gray-200 rounded-3xl p-5 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all flex flex-col items-center justify-center gap-3 min-h-[160px] group"
          >
            <div className="w-12 h-12 rounded-2xl bg-gray-100 group-hover:bg-indigo-100 flex items-center justify-center transition-colors">
              <Plus className="w-6 h-6 text-gray-400 group-hover:text-indigo-600 transition-colors" />
            </div>
            <span className="text-sm font-bold text-gray-400 group-hover:text-indigo-600 transition-colors">New Group</span>
          </button>
        </div>
      )}

      <GroupModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingGroup(null); }}
        onSuccess={loadData}
        group={editingGroup}
      />

      <ConfirmDialog
        isOpen={!!deletingGroup}
        onClose={() => setDeletingGroup(null)}
        onConfirm={handleDelete}
        title="Delete Group?"
        message={`Delete "${deletingGroup?.name}"? This will also remove all ${deletingGroup?.count || 0} contacts inside it.`}
        confirmLabel="Yes, Delete"
      />
    </div>
  );
}
