import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Search, 
  Plus, 
  Trash2, 
  Phone, 
  Mail, 
  StickyNote, 
  CheckSquare, 
  Square, 
  Edit2, 
  Users,
  MessageCircle,
  Send,
  Upload,
  Copy,
  Check,
  Smartphone
} from 'lucide-react';
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
import { Tooltip } from '../components/ui/Tooltip';
import { ContactsTable } from '../components/people/ContactsTable';
import { GlobalExcelImportModal } from '../components/people/GlobalExcelImportModal';
import { v4 as uuid } from 'uuid';
import { exportToExcel } from '../utils/excel';
import clsx from 'clsx';

function ContactActions({ value, type, cleanPhoneForWa }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (type === 'phone') {
    return (
      <div className="flex items-center gap-2 transition-opacity shrink-0">
        <Tooltip content="Call">
          <a href={`tel:${value}`} onClick={e => e.stopPropagation()} className="p-1 rounded-md hover:bg-emerald-50 dark:hover:bg-emerald-900/40 text-gray-400 hover:text-emerald-600 transition-colors">
            <Phone className="w-3.5 h-3.5" />
          </a>
        </Tooltip>
        <Tooltip content="WhatsApp">
          <a href={`https://wa.me/${cleanPhoneForWa(value)}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="p-1 rounded-md hover:bg-green-50 dark:hover:bg-green-900/40 text-gray-400 hover:text-green-600 transition-colors">
            <MessageCircle className="w-3.5 h-3.5" />
          </a>
        </Tooltip>
        <Tooltip content="SMS">
          <a href={`sms:${value?.replace(/\s/g, '')}`} onClick={e => e.stopPropagation()} className="p-1 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/40 text-gray-400 hover:text-blue-600 transition-colors">
            <Send className="w-3.5 h-3.5" />
          </a>
        </Tooltip>
        <Tooltip content={copied ? "Copied!" : "Copy Number"}>
          <button onClick={handleCopy} className={clsx("p-1 rounded-md transition-colors", copied ? "bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600" : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600")}>
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 transition-opacity shrink-0">
      <Tooltip content="Send Email">
        <a href={`mailto:${value?.trim()}`} onClick={e => e.stopPropagation()} className="p-1 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/40 text-gray-400 hover:text-indigo-600 transition-colors">
          <Mail className="w-3.5 h-3.5" />
        </a>
      </Tooltip>
      <Tooltip content={copied ? "Copied!" : "Copy Email"}>
        <button onClick={handleCopy} className={clsx("p-1 rounded-md transition-colors", copied ? "bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600" : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600")}>
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </Tooltip>
    </div>
  );
}

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
          <Button onClick={handleSave} isLoading={saving}>{contact ? 'Save Changes' : 'Add Contact'}</Button>
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

  // Column Configs (Persistence)
  const [columnConfigs, setColumnConfigs] = useState(() => {
    const saved = localStorage.getItem(`contacts-cols-${groupId}`);
    return saved ? JSON.parse(saved) : {
      name: { width: 220, isFrozen: true },
      phone: { width: 160, isFrozen: false },
      email: { width: 220, isFrozen: false },
      notes: { width: 250, isFrozen: false },
      createdAt: { width: 150, isFrozen: false },
      actions: { width: 120, isFrozen: false },
    };
  });

  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

  useEffect(() => {
    localStorage.setItem(`contacts-cols-${groupId}`, JSON.stringify(columnConfigs));
  }, [columnConfigs, groupId]);

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

  const sortedAndFiltered = [...filtered].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aVal = a[sortConfig.key] || '';
    const bVal = b[sortConfig.key] || '';
    
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const cleanPhoneForWa = (phone) => {
    if (!phone) return '';
    let digits = phone.replace(/\D/g, '');
    if (digits.length === 11 && digits.startsWith('0')) {
      digits = '91' + digits.slice(1);
    }
    if (digits.length === 10) {
      digits = '91' + digits;
    }
    return digits;
  };

  const handleColumnResize = (colId, newWidth) => {
    setColumnConfigs(prev => ({
      ...prev,
      [colId]: { ...prev[colId], width: newWidth }
    }));
  };

  const handleTogglePin = (colId) => {
    setColumnConfigs(prev => ({
      ...prev,
      [colId]: { ...prev[colId], isFrozen: !prev[colId]?.isFrozen }
    }));
  };

  const handleSort = (key) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        if (prev.direction === 'asc') return { key, direction: 'desc' };
        return { key: null, direction: 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const handleCellChange = async (contactId, fieldKey, newValue) => {
    // Validation for phone/email
    if (fieldKey === 'email') {
      const res = validateEmail(newValue);
      if (!res.isValid) { addToast(res.error, 'warning'); return; }
    }
    if (fieldKey === 'phone') {
      const res = validatePhone(newValue);
      if (!res.isValid) { addToast(res.error, 'warning'); return; }
    }

    // Optimistic Update
    setContacts(prev => prev.map(c => c.id === contactId ? { ...c, [fieldKey]: newValue } : c));

    try {
      const contact = contacts.find(c => c.id === contactId);
      if (contact) {
        await updateContact({ ...contact, [fieldKey]: newValue, updatedAt: new Date().toISOString() });
      }
    } catch {
      addToast('Failed to save cell change', 'error');
      loadData();
    }
  };

  const handleContactPicker = async () => {
    if (!('contacts' in navigator && 'select' in navigator.contacts)) {
      addToast('Contact picker not supported on this device', 'warning');
      return;
    }

    try {
      const props = ['name', 'tel', 'email'];
      const opts = { multiple: true };
      const selectedContacts = await navigator.contacts.select(props, opts);

      if (!selectedContacts.length) return;

      for (const contact of selectedContacts) {
        const data = {
          id: uuid(),
          groupId,
          userId: user.id,
          name: contact.name?.[0] || 'Unknown',
          phone: (contact.tel?.[0] || '').replace(/\s+/g, ''),
          email: contact.email?.[0] || '',
          identifier: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await createContact(data);
      }

      addToast(`Imported ${selectedContacts.length} contacts`);
      loadData();
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Contact picker error:', err);
        addToast('Failed to import contacts', 'error');
      }
    }
  };

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
            
            {/* Device Contacts Import */}
            <Tooltip content={!('contacts' in navigator) ? "Device contacts require a Secure Context (HTTPS) and a supported mobile browser." : "Import from device contacts"} position="bottom">
              <div className="flex">
                <Button 
                  variant="secondary" 
                  icon={Smartphone} 
                  onClick={handleContactPicker}
                  disabled={!('contacts' in navigator)}
                >
                  <span className="hidden lg:inline text-xs">Device Contacts</span>
                </Button>
              </div>
            </Tooltip>

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
        {sortedAndFiltered.length === 0 ? (
          <EmptyState
            icon={Users}
            heading={search ? 'No matching contacts' : 'No contacts yet'}
            subtext={search ? 'Try a different name, phone, or email' : `Add your first person to the "${group?.name}" group.`}
            actions={!search && (
              <Button icon={Plus} onClick={() => { setEditingContact(null); setIsModalOpen(true); }}>Add First Contact</Button>
            )}
          />
        ) : (
          <ContactsTable
            contacts={sortedAndFiltered}
            selectedIds={selectedIds}
            onSelect={setSelectedIds}
            onEdit={c => { setEditingContact(c); setIsModalOpen(true); }}
            onDelete={setDeletingContact}
            onCellChange={handleCellChange}
            columnConfigs={columnConfigs}
            onColumnResize={handleColumnResize}
            onTogglePin={handleTogglePin}
            onSort={handleSort}
            sortConfig={sortConfig}
          />
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
