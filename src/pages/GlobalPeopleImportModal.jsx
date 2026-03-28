import { useState, useEffect } from 'react';
import { Users, Search, ChevronRight, Check, Tag, Info } from 'lucide-react';
import { getGroupsByUser, getContactsByGroup } from '../db/contactsDb';
import { createPerson } from '../db/peopleDb';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { v4 as uuid } from 'uuid';
import clsx from 'clsx';

export function GlobalPeopleImportModal({ isOpen, onClose, onSuccess, eventId, categoryId, columns }) {
  const user = useAuthStore(s => s.user);
  const { addToast } = useUIStore();

  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [selectedContactIds, setSelectedContactIds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [search, setSearch] = useState('');

  // 1. Load Groups
  useEffect(() => {
    if (isOpen && user) {
      const loadGroups = async () => {
        setIsLoading(true);
        try {
          const gs = await getGroupsByUser(user.id);
          setGroups(gs.sort((a, b) => a.name.localeCompare(b.name)));
          if (gs.length > 0) setSelectedGroupId(gs[0].id);
        } catch {
          addToast('Error loading people groups', 'error');
        } finally {
          setIsLoading(false);
        }
      };
      loadGroups();
    }
  }, [isOpen, user?.id]);

  // 2. Load Contacts in Group
  useEffect(() => {
    if (selectedGroupId) {
      const loadContacts = async () => {
        setIsLoading(true);
        try {
          const cs = await getContactsByGroup(selectedGroupId);
          setContacts(cs.sort((a, b) => a.name.localeCompare(b.name)));
          setSelectedContactIds([]);
        } catch {
          addToast('Error loading contacts', 'error');
        } finally {
          setIsLoading(false);
        }
      };
      loadContacts();
    }
  }, [selectedGroupId]);

  const filtered = contacts.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id) => {
    setSelectedContactIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    setSelectedContactIds(prev => 
      prev.length === filtered.length ? [] : filtered.map(c => c.id)
    );
  };

  async function handleImport() {
    if (selectedContactIds.length === 0) return;
    setIsImporting(true);
    try {
      // Find target columns for auto-mapping
      const phoneCol = columns.find(c => ['phone', 'mobile', 'contact'].some(s => c.label.toLowerCase().includes(s)));
      const emailCol = columns.find(c => c.label.toLowerCase().includes('email'));
      const noteCol = columns.find(c => ['note', 'identifier', 'description', 'info'].some(s => c.label.toLowerCase().includes(s)));

      const selectedContacts = contacts.filter(c => selectedContactIds.includes(c.id));
      
      for (const c of selectedContacts) {
        const dynamicFields = {};
        if (phoneCol && c.phone) dynamicFields[phoneCol.id] = c.phone;
        if (emailCol && c.email) dynamicFields[emailCol.id] = c.email;
        if (noteCol && c.identifier) dynamicFields[noteCol.id] = c.identifier;

        await createPerson({
          id: uuid(),
          eventId,
          categoryId,
          name: c.name,
          dynamicFields,
          isLocked: false,
          isExported: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      addToast(`Successfully imported ${selectedContactIds.length} people`);
      onSuccess();
      onClose();
    } catch {
      addToast('Import failed', 'error');
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import from Global People"
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleImport} 
            loading={isImporting} 
            disabled={selectedContactIds.length === 0}
          >
            Import {selectedContactIds.length > 0 ? `(${selectedContactIds.length})` : ''}
          </Button>
        </>
      }
    >
      <div className="flex flex-col md:flex-row h-[500px] gap-6">
        {/* Sidebar: Groups */}
        <div className="w-full md:w-56 flex flex-col border-b md:border-b-0 md:border-r border-gray-100 pr-0 md:pr-4 overflow-hidden">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Your Groups</p>
          <div className="flex-1 overflow-auto space-y-1">
            {groups.map(g => (
              <button
                key={g.id}
                onClick={() => setSelectedGroupId(g.id)}
                className={clsx(
                  "w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left",
                  selectedGroupId === g.id 
                    ? "bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-100/50" 
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                )}
              >
                <div 
                  className="w-2 h-2 rounded-full shrink-0" 
                  style={{ backgroundColor: g.color || '#CBD5E1' }} 
                />
                <span className="truncate">{g.name}</span>
              </button>
            ))}
            {groups.length === 0 && !isLoading && (
              <p className="text-xs text-center py-4 text-gray-400">No groups found</p>
            )}
          </div>
        </div>

        {/* Content: People */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search bar */}
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, phone or email..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>

          <div className="flex-1 overflow-auto border border-gray-50 rounded-2xl">
            {isLoading ? (
              <div className="flex justify-center py-20"><Spinner /></div>
            ) : filtered.length === 0 ? (
              <EmptyState 
                icon={Users} 
                heading="No people found" 
                subtext={search ? "Try a different search term" : "This group is empty."} 
              />
            ) : (
              <div className="divide-y divide-gray-50">
                <div className="bg-gray-50/50 px-4 py-2 flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Showing {filtered.length} people
                  </span>
                  <button 
                    onClick={toggleAll}
                    className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-800 transition-colors"
                  >
                    {selectedContactIds.length === filtered.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                {filtered.map(c => (
                  <label 
                    key={c.id} 
                    className={clsx(
                      "flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors",
                      selectedContactIds.includes(c.id) ? "bg-indigo-50/30" : "hover:bg-gray-50/50"
                    )}
                  >
                    <div className="relative">
                      <input 
                        type="checkbox"
                        checked={selectedContactIds.includes(c.id)}
                        onChange={() => toggleSelect(c.id)}
                        className="sr-only"
                      />
                      <div className={clsx(
                        "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                        selectedContactIds.includes(c.id) ? "bg-indigo-600 border-indigo-600" : "bg-white border-gray-200"
                      )}>
                        {selectedContactIds.includes(c.id) && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-gray-900 truncate">{c.name}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        {c.phone && <span className="text-[11px] text-gray-500 truncate">{c.phone}</span>}
                        {c.email && <span className="text-[11px] text-gray-400 truncate">{c.email}</span>}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
          
          <div className="mt-3 flex items-center gap-2 px-1">
            <Info className="w-3.5 h-3.5 text-indigo-400" />
            <p className="text-[10px] text-gray-400 font-medium"> Fields like Phone and Email will be auto-mapped if columns exist in this category.</p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
