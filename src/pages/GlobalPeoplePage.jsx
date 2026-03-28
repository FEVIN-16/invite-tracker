import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Search, Tag, ArrowRight, Edit2, Trash2, Upload } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { getGroupsByUser, createGroup, updateGroup, deleteGroup, getContactsByGroup } from '../db/contactsDb';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Spinner } from '../components/ui/Spinner';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { GlobalMultiGroupImportModal } from '../components/people/GlobalMultiGroupImportModal';
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
          <label className="text-sm font-black text-gray-700 dark:text-gray-300 block mb-3 pl-1 uppercase tracking-widest">Select Group Color</label>
          <div className="flex flex-wrap gap-3 p-1">
            {COLORS.map(c => (
              <button
                key={c} type="button"
                onClick={() => setColor(c)}
                className={clsx(
                  "w-9 h-9 rounded-full border-4 transition-all duration-300 hover:scale-110 shadow-sm",
                  color === c ? "border-gray-900 dark:border-white scale-110" : "border-transparent"
                )}
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
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
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
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 transition-colors">
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">People</h1>
          <p className="text-xs font-bold text-gray-400 dark:text-gray-500 mt-2 uppercase tracking-widest leading-loose">Your global contact book — organized by group</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={Upload} onClick={() => setIsImportModalOpen(true)}>Import Excel</Button>
          <Button icon={Plus} onClick={() => { setEditingGroup(null); setIsModalOpen(true); }}>New Group</Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-10 max-w-sm group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-600 group-hover:text-indigo-500 transition-colors" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search your groups..."
          className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl text-sm font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm group-hover:shadow-md"
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
              className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 hover:border-indigo-200 dark:hover:border-indigo-900 hover:shadow-xl hover:shadow-indigo-500/10 transition-all cursor-pointer relative overflow-hidden"
              onClick={() => navigate(`/people/${g.id}`)}
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <h3 className="text-xl font-black text-gray-900 dark:text-white truncate uppercase tracking-tight">{g.name}</h3>
                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                  <button
                    onClick={e => { e.stopPropagation(); setEditingGroup(g); setIsModalOpen(true); }}
                    className="p-2.5 text-gray-400 dark:text-gray-600 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-gray-800 rounded-xl transition-all"
                    title="Edit Group"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); setDeletingGroup(g); }}
                    className="p-2.5 text-gray-400 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-gray-800 rounded-xl transition-all"
                    title="Delete Group"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-6">People Group · {g.count} Contacts</p>

              {/* Footer */}
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-50 dark:border-gray-800 text-xs font-black text-gray-500 dark:text-gray-500 uppercase tracking-widest">
                <div className="flex items-center gap-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  <Users className="w-4.5 h-4.5 text-gray-300 dark:text-gray-700" />
                  <span>{g.count} people</span>
                </div>
                <span className="flex items-center gap-1.5 text-[10px] text-indigo-600 dark:text-indigo-400 group-hover:gap-3 transition-all">
                  Open List <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          ))}

          {/* Add card */}
          <button
            onClick={() => { setEditingGroup(null); setIsModalOpen(true); }}
            className="border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl p-5 hover:border-indigo-300 dark:hover:border-indigo-900 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-all flex flex-col items-center justify-center gap-4 min-h-[160px] group"
          >
            <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-gray-800 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 flex items-center justify-center transition-all shadow-inner">
              <Plus className="w-8 h-8 text-gray-400 dark:text-gray-600 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
            </div>
            <span className="text-xs font-black text-gray-400 dark:text-gray-700 uppercase tracking-widest group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Create New Group</span>
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

      <GlobalMultiGroupImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
}
