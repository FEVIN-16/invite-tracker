import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, ArrowLeft, Plus, Trash2, Search, Edit2, Phone, Mail, StickyNote, X, Upload, CheckSquare, Square } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { getGroupsByUser, getContactsByGroup, createContact, updateContact, deleteContact, bulkDeleteContacts } from '../db/contactsDb';
import { validateEmail, validatePhone } from '../utils/validation';
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
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (contact) {
      setForm({ name: contact.name || '', phone: contact.phone || '', email: contact.email || '', identifier: contact.identifier || '' });
    } else {
      setForm({ name: '', phone: '', email: '', identifier: '' });
    }
    setErrors({});
  }, [contact, isOpen]);

  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  async function handleSave(e) {
    e.preventDefault();
    if (!form.name.trim()) return;

    // Validation
    const newErrors = {};
    const emailRes = validateEmail(form.email);
    const phoneRes = validatePhone(form.phone);

    if (!emailRes.isValid) newErrors.email = emailRes.error;
    if (!phoneRes.isValid) newErrors.phone = phoneRes.error;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      addToast('Please fix the errors before saving', 'warning');
      return;
    }

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
        <Input label="Full Name" placeholder="e.g. Rahul Sharma" value={form.name} onChange={set('name')} required autoFocus />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Phone" type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={set('phone')} error={errors.phone} />
          <Input label="Email" type="email" placeholder="name@example.com" value={form.email} onChange={set('email')} error={errors.email} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest pl-1">Identifier Note <span className="text-gray-300 dark:text-gray-800">(optional)</span></label>
          <textarea
            className="w-full rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 px-4 py-3 text-sm font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none min-h-[100px] resize-none transition-all"
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
    <div className="flex flex-col h-full bg-white dark:bg-gray-950 overflow-hidden transition-colors">
      {/* Header */}
      <div className="px-4 md:px-6 py-6 border-b border-gray-100 dark:border-gray-800">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 dark:text-gray-600 mb-4 uppercase tracking-widest leading-none">
          <button onClick={() => navigate('/people')} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">People</button>
          <span className="text-gray-200 dark:text-gray-800">/</span>
          <span className="text-gray-800 dark:text-gray-200">{group?.name}</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/people')}
              className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm group"
            >
              <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{group?.name}</h1>
              <p className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest mt-1">{contacts.length} Total contacts</p>
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
      <div className="px-4 md:px-6 py-4 bg-gray-50/50 dark:bg-gray-900/40 border-b border-gray-100 dark:border-gray-800 flex items-center">
        <div className="relative max-w-sm w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-600 group-hover:text-indigo-500 transition-colors" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search contacts..."
            className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl text-sm font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all shadow-sm"
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
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {/* Table header */}
            {/* Table header */}
            <div className="hidden md:grid grid-cols-[3rem_1.5fr_1.2fr_1.5fr_2fr_3rem] gap-4 px-6 py-2.5 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-md text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest sticky top-0 border-b border-gray-100 dark:border-gray-800 z-10 transition-colors">
              <div className="flex justify-center">
                <button 
                  onClick={toggleAll} 
                  className={clsx(
                    'transition-colors p-1', 
                    selectedIds.length === filtered.length && filtered.length > 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-300 dark:text-gray-700 hover:text-indigo-600'
                  )}
                >
                  {selectedIds.length === filtered.length && filtered.length > 0 ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                </button>
              </div>
              <div className="flex items-center">Name</div>
              <div className="flex items-center">Phone</div>
              <div className="flex items-center">Email</div>
              <div className="flex items-center">Identifier Note</div>
              <div />
            </div>

            {filtered.map(c => (
              <div
                key={c.id}
                className={clsx(
                  'group grid grid-cols-1 md:grid-cols-[3rem_1.5fr_1.2fr_1.5fr_2fr_3rem] gap-x-4 gap-y-1.5 px-4 md:px-6 py-4 md:py-3.5 items-center transition-all border-l-4',
                  selectedIds.includes(c.id) 
                    ? 'bg-indigo-50/40 dark:bg-indigo-900/10 border-indigo-500' 
                    : 'hover:bg-gray-50/60 dark:hover:bg-gray-900/40 border-transparent'
                )}
                onClick={() => toggleSelect(c.id)}
              >
                {/* Checkbox */}
                <div className="hidden md:flex justify-center" onClick={e => e.stopPropagation()}>
                  <button 
                    onClick={() => toggleSelect(c.id)} 
                    className={clsx(
                      "p-1 transition-all",
                      selectedIds.includes(c.id) 
                        ? "text-indigo-600 dark:text-indigo-400" 
                        : "text-gray-300 dark:text-gray-700 opacity-0 group-hover:opacity-100 hover:text-indigo-600"
                    )}
                  >
                    {selectedIds.includes(c.id) ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                  </button>
                </div>

                {/* Name */}
                <div className="font-black text-gray-900 dark:text-gray-100 truncate">{c.name}</div>

                {/* Phone */}
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 font-bold">
                  {c.phone ? (
                    <><Phone className="w-4 h-4 text-gray-300 dark:text-gray-700 shrink-0 hidden md:block" /><a href={`tel:${c.phone}`} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" onClick={e => e.stopPropagation()}>{c.phone}</a></>
                  ) : <span className="text-gray-300 dark:text-gray-800 font-medium">—</span>}
                </div>

                {/* Email */}
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 font-bold min-w-0">
                  {c.email ? (
                    <><Mail className="w-4 h-4 text-gray-300 dark:text-gray-700 shrink-0 hidden md:block" /><a href={`mailto:${c.email}`} className="hover:text-indigo-600 dark:hover:text-indigo-400 truncate transition-colors" onClick={e => e.stopPropagation()}>{c.email}</a></>
                  ) : <span className="text-gray-300 dark:text-gray-800 font-medium">—</span>}
                </div>

                {/* Identifier */}
                <div className="flex items-start gap-2 text-xs text-gray-400 dark:text-gray-600 italic font-medium leading-relaxed">
                  {c.identifier ? (
                    <><StickyNote className="w-4 h-4 text-gray-300 dark:text-gray-800 shrink-0 mt-0.5 hidden md:block" /><span className="line-clamp-2">{c.identifier}</span></>
                  ) : <span className="text-gray-300 dark:text-gray-800">—</span>}
                </div>

                {/* Actions */}
                <div className="flex gap-2.5 md:opacity-0 md:group-hover:opacity-100 transition-all justify-end" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => { setEditingContact(c); setIsModalOpen(true); }}
                    className="p-2 rounded-xl text-gray-400 dark:text-gray-600 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-gray-800 transition-all shadow-sm hover:shadow-md border border-transparent hover:border-gray-100 dark:hover:border-gray-700"
                    title="Edit Contact"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeletingContact(c)}
                    className="p-2 rounded-xl text-gray-400 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-white dark:hover:bg-gray-800 transition-all shadow-sm hover:shadow-md border border-transparent hover:border-gray-100 dark:hover:border-gray-700"
                    title="Delete Contact"
                  >
                    <Trash2 className="w-4 h-4" />
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
