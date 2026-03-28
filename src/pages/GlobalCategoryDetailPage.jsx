import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, ArrowLeft, Plus, Trash2, Search, Edit2, Phone, Mail, StickyNote, X, Upload } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { getGroupsByUser, getContactsByGroup, createContact, updateContact, deleteContact, bulkDeleteContacts } from '../db/contactsDb';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Spinner } from '../components/ui/Spinner';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { GlobalExcelImportModal } from '../components/people/GlobalExcelImportModal';
import { v4 as uuid } from 'uuid';
import clsx from 'clsx';

// ── Contact Form Modal ─────────────────────────────────────────────────────
function ContactModal({ isOpen, onClose, onSuccess, contact, groupId }) {
  const { addToast } = useUIStore();
  const user = useAuthStore(s => s.user);
  const [form, setForm] = useState({ name: '', phone: '', email: '', identifier: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (contact) {
      setForm({ name: contact.name || '', phone: contact.phone || '', email: contact.email || '', identifier: contact.identifier || '' });
    } else {
      setForm({ name: '', phone: '', email: '', identifier: '' });
    }
  }, [contact, isOpen]);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  async function handleSave(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const data = {
        ...form,
        name: form.name.trim(),
        id: contact?.id || uuid(),
        groupId,
        userId: user.id,
        createdAt: contact?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      if (contact) {
        await updateContact(data);
        addToast('Contact updated');
      } else {
        await createContact(data);
        addToast('Contact added');
      }
      onSuccess();
      onClose();
    } catch {
      addToast('Error saving contact', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={contact ? 'Edit Contact' : 'Add Contact'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}>{contact ? 'Save Changes' : 'Add Contact'}</Button>
        </>
      }
    >
      <form onSubmit={handleSave} className="space-y-5 py-2">
        <Input label="Full Name *" placeholder="e.g. Rahul Sharma" value={form.name} onChange={set('name')} required autoFocus />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Phone" type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={set('phone')} />
          <Input label="Email" type="email" placeholder="name@example.com" value={form.email} onChange={set('email')} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Identifier Note <span className="text-gray-400">(optional)</span></label>
          <textarea
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none min-h-[72px] resize-none"
            placeholder="A short note to identify this person, e.g. 'Priya's brother from Chennai'"
            value={form.identifier}
            onChange={set('identifier')}
          />
        </div>
      </form>
    </Modal>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function GlobalCategoryDetailPage() {
  const { categoryId: groupId } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const { addToast } = useUIStore();

  const [group, setGroup] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [deletingContact, setDeletingContact] = useState(null);
  const [showBulkDelete, setShowBulkDelete] = useState(false);

  async function loadData() {
    if (!user) return;
    try {
      const groups = await getGroupsByUser(user.id);
      const g = groups.find(x => x.id === groupId);
      if (!g) { navigate('/people'); return; }
      setGroup(g);
      const cs = await getContactsByGroup(groupId);
      setContacts(cs.sort((a, b) => a.name.localeCompare(b.name)));
    } catch {
      addToast('Error loading contacts', 'error');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { loadData(); }, [groupId]);

  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase())
  );

  function toggleSelect(id) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }
  function toggleAll() {
    setSelectedIds(prev => prev.length === filtered.length ? [] : filtered.map(c => c.id));
  }

  async function handleDelete() {
    try {
      await deleteContact(deletingContact.id);
      addToast('Contact deleted');
      setContacts(prev => prev.filter(c => c.id !== deletingContact.id));
    } catch { addToast('Error deleting contact', 'error'); }
    finally { setDeletingContact(null); }
  }

  async function handleBulkDelete() {
    try {
      await bulkDeleteContacts(selectedIds);
      addToast(`Deleted ${selectedIds.length} contacts`);
      setSelectedIds([]);
      loadData();
    } catch { addToast('Bulk delete failed', 'error'); }
    finally { setShowBulkDelete(false); }
  }

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Header */}
      <div className="px-4 md:px-6 py-4 border-b border-gray-100">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
          <button onClick={() => navigate('/people')} className="hover:text-indigo-600 transition-colors">People</button>
          <span>/</span>
          <span className="font-semibold text-gray-800">{group?.name}</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/people')}
              className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{group?.name}</h1>
              <p className="text-xs text-gray-500">{contacts.length} contacts</p>
            </div>
          </div>
          <div className="flex gap-2">
            {selectedIds.length > 0 && (
              <Button variant="danger" icon={Trash2} onClick={() => setShowBulkDelete(true)}>
                Delete ({selectedIds.length})
              </Button>
            )}
            <Button variant="secondary" icon={Upload} onClick={() => setIsImportModalOpen(true)}>Import</Button>
            <Button icon={Plus} onClick={() => { setEditingContact(null); setIsModalOpen(true); }}>Add Contact</Button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-4 md:px-6 py-3 bg-gray-50 border-b border-gray-100">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, phone or email..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto pb-24">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            heading={search ? 'No matching contacts' : 'No contacts yet'}
            subtext={search ? 'Try a different name, phone, or email' : `Add your first person to the "${group?.name}" group.`}
            actions={!search && (
              <Button icon={Plus} onClick={() => { setEditingContact(null); setIsModalOpen(true); }}>Add First Contact</Button>
            )}
          />
        ) : (
          <div className="divide-y divide-gray-50">
            {/* Table header */}
            <div className="hidden md:grid grid-cols-[2rem_1fr_1fr_1fr_2fr_2.5rem] gap-4 px-6 py-2 bg-gray-50 text-[11px] font-black text-gray-400 uppercase tracking-widest sticky top-0 border-b border-gray-100 z-10">
              <div>
                <button onClick={toggleAll} className={clsx('p-0.5', selectedIds.length === filtered.length ? 'text-indigo-600' : 'text-gray-300')}>
                  {selectedIds.length === filtered.length && filtered.length > 0 ? '☑' : '☐'}
                </button>
              </div>
              <div>Name</div>
              <div>Phone</div>
              <div>Email</div>
              <div>Identifier Note</div>
              <div />
            </div>

            {filtered.map(c => (
              <div
                key={c.id}
                className={clsx(
                  'group grid grid-cols-1 md:grid-cols-[2rem_1fr_1fr_1fr_2fr_2.5rem] gap-x-4 gap-y-1 px-4 md:px-6 py-3 md:py-2.5 items-center transition-colors',
                  selectedIds.includes(c.id) ? 'bg-indigo-50/40' : 'hover:bg-gray-50'
                )}
              >
                {/* Checkbox */}
                <div className="hidden md:block">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(c.id)}
                    onChange={() => toggleSelect(c.id)}
                    className="accent-indigo-600"
                  />
                </div>

                {/* Name */}
                <div className="font-semibold text-gray-900">{c.name}</div>

                {/* Phone */}
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  {c.phone ? (
                    <><Phone className="w-3.5 h-3.5 text-gray-300 shrink-0 hidden md:block" /><a href={`tel:${c.phone}`} className="hover:text-indigo-600">{c.phone}</a></>
                  ) : <span className="text-gray-300">—</span>}
                </div>

                {/* Email */}
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  {c.email ? (
                    <><Mail className="w-3.5 h-3.5 text-gray-300 shrink-0 hidden md:block" /><a href={`mailto:${c.email}`} className="hover:text-indigo-600 truncate">{c.email}</a></>
                  ) : <span className="text-gray-300">—</span>}
                </div>

                {/* Identifier */}
                <div className="flex items-start gap-1.5 text-sm text-gray-500 italic">
                  {c.identifier ? (
                    <><StickyNote className="w-3.5 h-3.5 text-gray-300 shrink-0 mt-0.5 hidden md:block" /><span className="line-clamp-2">{c.identifier}</span></>
                  ) : <span className="text-gray-300">—</span>}
                </div>

                {/* Actions */}
                <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity justify-end">
                  <button
                    onClick={() => { setEditingContact(c); setIsModalOpen(true); }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingContact(c)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ContactModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingContact(null); }}
        onSuccess={loadData}
        contact={editingContact}
        groupId={groupId}
      />

      <ConfirmDialog
        isOpen={!!deletingContact}
        onClose={() => setDeletingContact(null)}
        onConfirm={handleDelete}
        title="Delete Contact?"
        message={`Remove "${deletingContact?.name}" from this group?`}
        confirmLabel="Delete"
      />

      <ConfirmDialog
        isOpen={showBulkDelete}
        onClose={() => setShowBulkDelete(false)}
        onConfirm={handleBulkDelete}
        title="Delete Selected?"
        message={`Delete ${selectedIds.length} selected contacts? This cannot be undone.`}
        confirmLabel="Delete All"
      />

      <GlobalExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={loadData}
        groupId={groupId}
      />
    </div>
  );
}
