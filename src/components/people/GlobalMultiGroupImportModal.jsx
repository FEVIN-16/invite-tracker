import { useState, useRef, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Accordion } from '../ui/Accordion';
import { readExcelFile, mapGlobalExcelData } from '../../utils/excel';
import { bulkCreateContacts, getGroupsByUser } from '../../db/contactsDb';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { Upload, FileType, CheckCircle2, Search, Filter, Group, UserPlus, Users, Phone, Mail, StickyNote, CheckSquare, Square } from 'lucide-react';
import { v4 as uuid } from 'uuid';
import clsx from 'clsx';

const TARGET_FIELDS = [
  { id: 'name', label: 'Name', required: true },
  { id: 'phone', label: 'Phone', required: false },
  { id: 'email', label: 'Email', required: false },
  { id: 'identifier', label: 'Identifier', required: false },
];

export function GlobalMultiGroupImportModal({ isOpen, onClose, onSuccess }) {
  const { addToast } = useUIStore();
  const user = useAuthStore(s => s.user);
  const fileInputRef = useRef(null);
  
  const [step, setStep] = useState(1); // 1: Select File, 2: Map Columns, 3: Assign Groups, 4: Success
  const [file, setFile] = useState(null);
  const [rawRows, setRawRows] = useState([]);
  const [mapping, setMapping] = useState({ name: -1, phone: -1, email: -1, identifier: -1 });
  const [pendingContacts, setPendingContacts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const [previewSearch, setPreviewSearch] = useState('');
  const [bulkGroupId, setBulkGroupId] = useState('');
  
  const [importMode, setImportMode] = useState('single'); // 'single' or 'multi'
  const [globalGroupId, setGlobalGroupId] = useState('');

  // History for Revert/Undo
  const [history, setHistory] = useState([]);
  const [lastAppliedSnapshot, setLastAppliedSnapshot] = useState({ groupId: '', selectedIds: [] });

  // Derived active fields based on mapping
  const activeFields = TARGET_FIELDS.filter(f => mapping[f.id] !== -1);

  useEffect(() => {
    if (isOpen && user) {
      getGroupsByUser(user.id).then(gs => {
        setGroups(gs);
        if (gs.length > 0) setGlobalGroupId(gs[0].id);
      });
    }
  }, [isOpen, user?.id]);

  function reset() {
    setStep(1);
    setFile(null);
    setRawRows([]);
    setMapping({ name: -1, phone: -1, email: -1, identifier: -1 });
    setPendingContacts([]);
    setIsImporting(false);
    setPreviewSearch('');
    setBulkGroupId('');
    setImportMode('single');
    setGlobalGroupId(groups[0]?.id || '');
    setHistory([]);
    setLastAppliedSnapshot({ groupId: '', selectedIds: [] });
  }

  async function handleFileChange(e) {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    try {
      const data = await readExcelFile(selectedFile);
      if (data.length < 2) {
        addToast('File seems empty or missing header row', 'warning');
        return;
      }
      setFile(selectedFile);
      setRawRows(data);
      
      const headers = data[0].map(h => String(h || '').toLowerCase());
      const initialMapping = {
        name: headers.indexOf('name'),
        phone: headers.findIndex(h => h.includes('phone') || h.includes('mobile') || h.includes('contact')),
        email: headers.indexOf('email'),
        identifier: headers.findIndex(h => h.includes('note') || h.includes('identifier') || h.includes('info') || h.includes('message')),
      };
      
      setMapping(initialMapping);
      setStep(2);
    } catch {
      addToast('Error reading file', 'error');
    }
  }

  function handleMapNext() {
    if (mapping.name === -1) {
      addToast('Please map the "Full Name" column', 'warning');
      return;
    }

    const mapped = mapGlobalExcelData(rawRows, mapping).map(c => ({
      ...c,
      tempId: uuid(),
      groupId: groups[0]?.id || '',
      selected: true
    }));
    setPendingContacts(mapped);
    setStep(3);
  }

  function handleApplyBulkGroup() {
    if (!bulkGroupId) return;
    const selectedIds = pendingContacts.filter(c => c.selected).map(c => c.tempId);
    if (selectedIds.length === 0) {
      addToast('No contacts selected');
      return;
    }

    setHistory(prev => [...prev, JSON.parse(JSON.stringify(pendingContacts))]);
    setPendingContacts(prev => prev.map(c => c.selected ? { ...c, groupId: bulkGroupId } : c));
    setLastAppliedSnapshot({ groupId: bulkGroupId, selectedIds });
    addToast(`Applied group to ${selectedIds.length} contacts`);
  }

  function handleUndo() {
    if (history.length === 0) return;
    const lastState = history[history.length - 1];
    setPendingContacts(lastState);
    setHistory(prev => prev.slice(0, -1));
    setLastAppliedSnapshot({ groupId: '', selectedIds: [] });
    addToast('Reverted last action');
  }

  async function startImport() {
    let contactsToSave = [];
    
    if (importMode === 'single') {
      if (!globalGroupId) {
        addToast('Please select a group', 'warning');
        return;
      }
      contactsToSave = pendingContacts.map(c => ({ ...c, groupId: globalGroupId }));
    } else {
      contactsToSave = pendingContacts.filter(c => c.selected && c.groupId);
      if (contactsToSave.length === 0) {
        addToast('Please select at least one contact and assign a group', 'warning');
        return;
      }
    }

    setIsImporting(true);
    try {
      const finalContacts = contactsToSave.map(({ tempId, selected, ...c }) => ({
        ...c,
        id: uuid(),
        userId: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      await bulkCreateContacts(finalContacts);
      setStep(4);
      onSuccess();
    } catch {
      addToast('Import failed', 'error');
    } finally {
      setIsImporting(false);
    }
  }

  const headers = rawRows[0] || [];
  const filteredPreview = pendingContacts.filter(c => 
    c.name.toLowerCase().includes(previewSearch.toLowerCase()) ||
    (c.phone || '').includes(previewSearch)
  );

  const currentSelectedIds = pendingContacts.filter(c => c.selected).map(c => c.tempId);
  const isBulkChangeApplied = bulkGroupId !== "" && 
    lastAppliedSnapshot.groupId === bulkGroupId && 
    JSON.stringify(lastAppliedSnapshot.selectedIds) === JSON.stringify(currentSelectedIds);

  const hasPendingBulkAction = bulkGroupId !== "" && !isBulkChangeApplied;
  
  const isAssignmentValid = importMode === 'single' 
    ? !!globalGroupId 
    : (!hasPendingBulkAction && pendingContacts.some(c => c.selected && c.groupId));

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => { onClose(); setTimeout(reset, 300); }}
      title="Global Excel Import"
      size={step === 3 && importMode === 'multi' ? "3xl" : "2xl"}
      footer={
        <div className="flex gap-2 w-full justify-between items-center">
          <div>
            {step === 3 && importMode === 'multi' && (
              <span className="text-xs font-bold text-gray-400">
                {pendingContacts.filter(c => c.selected).length} / {pendingContacts.length} Contacts Selected
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {step > 1 && step < 4 && <Button variant="secondary" onClick={() => setStep(step - 1)}>Back</Button>}
            {step === 4 ? (
              <Button onClick={onClose}>Done</Button>
            ) : (
              <Button 
                disabled={
                  step === 1 || 
                  (step === 2 && mapping.name === -1) ||
                  (step === 3 && !isAssignmentValid)
                } 
                loading={isImporting} 
                onClick={step === 2 ? handleMapNext : (step === 3 ? startImport : undefined)}
              >
                {step === 3 ? 'Confirm Import' : 'Next'}
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="py-2">
        {step === 1 && (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl p-16 flex flex-col items-center justify-center gap-6 hover:border-indigo-300 dark:hover:border-indigo-900 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/10 cursor-pointer transition-all group overflow-hidden relative shadow-sm hover:shadow-md"
          >
            <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-2xl flex items-center justify-center group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-all shadow-inner">
              <Upload className="w-10 h-10 text-gray-400 dark:text-gray-600 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
            </div>
            <div className="text-center">
              <p className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Upload People List</p>
              <p className="text-[10px] font-black text-gray-400 dark:text-gray-600 mt-2 uppercase tracking-widest leading-loose">Excel (.xlsx) or CSV files supported</p>
            </div>
            <input type="file" ref={fileInputRef} hidden accept=".xlsx,.xls,.csv" onChange={handleFileChange} />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 px-2">
            <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-5 rounded-2xl flex gap-4 border border-indigo-100 dark:border-indigo-900/20 items-center">
              <div className="w-12 h-12 bg-white dark:bg-gray-900 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-50 dark:border-indigo-900/20 shrink-0">
                <FileType className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-black text-indigo-900 dark:text-indigo-300 truncate">{file?.name}</p>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-tight">{rawRows.length - 1} rows detected</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-5 bg-indigo-600 rounded-full" />
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Map Columns</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                {TARGET_FIELDS.map(field => (
                  <div key={field.id} className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest px-1">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>
                    <select 
                      className="w-full h-11 rounded-xl border border-gray-200 dark:border-gray-800 px-4 text-xs font-black bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all shadow-sm"
                      value={mapping[field.id]}
                      onChange={e => setMapping({ ...mapping, [field.id]: parseInt(e.target.value) })}
                    >
                      <option value={-1}>Don't Import</option>
                      {headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            {/* Tabs */}
            <div className="flex bg-gray-100 dark:bg-gray-900 p-1.5 rounded-2xl transition-colors">
              <button 
                onClick={() => setImportMode('single')}
                className={clsx(
                  "flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all uppercase tracking-widest",
                  importMode === 'single' ? "bg-white dark:bg-gray-800 shadow-md text-indigo-600 dark:text-indigo-400" : "text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400"
                )}
              >
                Single Group
              </button>
              <button 
                onClick={() => setImportMode('multi')}
                className={clsx(
                  "flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all uppercase tracking-widest",
                  importMode === 'multi' ? "bg-white dark:bg-gray-800 shadow-md text-indigo-600 dark:text-indigo-400" : "text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400"
                )}
              >
                Multi-Group
              </button>
            </div>

            {importMode === 'single' ? (
              <div className="space-y-6 py-2 px-1">
                <div className="flex items-center gap-4 bg-indigo-50/50 dark:bg-indigo-950/20 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-900/10 shadow-sm transition-colors">
                  <div className="w-12 h-12 bg-white dark:bg-gray-900 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-50 dark:border-indigo-900/20 shrink-0">
                    <Users className="w-6 h-6" />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest px-1">Target Group</label>
                    <select 
                      className="w-full h-11 rounded-xl border border-gray-200 dark:border-gray-800 px-4 text-xs font-black bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                      value={globalGroupId}
                      onChange={e => setGlobalGroupId(e.target.value)}
                    >
                      <option value="">Select a group...</option>
                      {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                  </div>
                </div>

                <Accordion 
                  title="Review Import List" 
                  count={pendingContacts.length}
                  icon={Users}
                >
                  <div className="max-h-[350px] overflow-y-auto -m-1 pr-1 border border-gray-100 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-900 transition-colors">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-gray-50/80 dark:bg-gray-950/80 sticky top-0 z-10 border-b border-gray-100 dark:border-gray-800">
                        <tr>
                          {activeFields.map(field => (
                            <th key={field.id} className="px-5 py-3.5 text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">
                              {field.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {pendingContacts.map(c => (
                          <tr key={c.tempId} className="hover:bg-gray-50/30 dark:hover:bg-gray-800/30 transition-colors">
                            {activeFields.map(field => (
                              <td key={field.id} className="px-5 py-3">
                                <span className={clsx(
                                  "text-sm font-bold truncate block max-w-[200px] transition-colors",
                                  field.id === 'name' ? "text-gray-900 dark:text-gray-100" : "text-gray-500 dark:text-gray-400",
                                  field.id === 'identifier' && "text-indigo-600 dark:text-indigo-400 italic font-black"
                                )}>
                                  {c[field.id] || <span className="text-gray-300 dark:text-gray-700 italic font-medium">Empty</span>}
                                </span>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Accordion>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col gap-5 bg-gray-50/50 dark:bg-gray-900/40 p-5 rounded-3xl border border-gray-100 dark:border-gray-800 transition-colors">
                  {/* Row 1: Bulk Action */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest px-1">Bulk Assign Group</label>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <select 
                          className="flex-1 h-11 rounded-xl border border-gray-200 dark:border-gray-800 px-4 text-xs font-black bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 outline-none shadow-sm min-w-0 transition-all"
                          value={bulkGroupId}
                          onChange={e => {
                            setBulkGroupId(e.target.value);
                          }}
                        >
                          <option value="">Set group for all selected contacts...</option>
                          {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                        {bulkGroupId !== "" && (
                          <div className="flex gap-2 shrink-0">
                            <Button 
                              className="h-11 px-8 whitespace-nowrap" 
                              variant={isBulkChangeApplied ? "secondary" : "primary"} 
                              onClick={handleApplyBulkGroup}
                              disabled={isBulkChangeApplied}
                            >
                              {isBulkChangeApplied ? 'Applied' : 'Apply'}
                            </Button>
                            {history.length > 0 && (
                              <Button className="h-11 px-5 whitespace-nowrap" variant="secondary" onClick={handleUndo}>Revert</Button>
                            )}
                          </div>
                        )}
                    </div>
                  </div>
                  
                  {/* Row 2: Search */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest px-1">Search Imported List</label>
                    <div className="relative group">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 dark:text-gray-600 group-hover:text-indigo-500 transition-colors" />
                      <input
                        type="text"
                        placeholder="Filter by name, phone or email..."
                        className="w-full h-11 pl-12 pr-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-black text-gray-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 outline-none shadow-sm transition-all"
                        value={previewSearch}
                        onChange={e => setPreviewSearch(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden bg-white dark:bg-gray-900 max-h-[350px] overflow-y-auto transition-colors">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 dark:bg-gray-950 sticky top-0 z-10 border-b border-gray-100 dark:border-gray-800">
                      <tr>
                        <th className="px-5 py-4 text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest w-12 text-center">
                          <button 
                            onClick={(e) => setPendingContacts(prev => prev.map(c => ({ ...c, selected: !pendingContacts.every(x => x.selected) })))}
                            className={clsx(
                              "p-1 transition-all",
                              pendingContacts.length > 0 && pendingContacts.every(c => c.selected) ? "text-indigo-600 dark:text-indigo-400" : "text-gray-300 dark:text-gray-700 hover:text-indigo-600"
                            )}
                          >
                            {pendingContacts.length > 0 && pendingContacts.every(c => c.selected) ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                          </button>
                        </th>
                        {activeFields.map(field => (
                          <th key={field.id} className="px-5 py-4 text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">
                            {field.label}
                          </th>
                        ))}
                        <th className="px-5 py-4 text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">Assign to Group</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                      {filteredPreview.map(contact => (
                        <tr key={contact.tempId} className={clsx("hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors", !contact.selected && "opacity-50")}>
                          <td className="px-5 py-4 text-center">
                            <button 
                              onClick={() => setPendingContacts(prev => prev.map(c => c.tempId === contact.tempId ? { ...c, selected: !contact.selected } : c))}
                              className={clsx(
                                "p-1 transition-all",
                                contact.selected ? "text-indigo-600 dark:text-indigo-400" : "text-gray-300 dark:text-gray-700 hover:text-indigo-600"
                              )}
                            >
                              {contact.selected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                            </button>
                          </td>
                          {activeFields.map(field => (
                            <td key={field.id} className="px-5 py-4">
                              <span className={clsx(
                                "text-sm font-bold truncate block max-w-[150px] transition-colors",
                                field.id === 'name' ? "text-gray-900 dark:text-gray-100" : "text-gray-500 dark:text-gray-400",
                                field.id === 'identifier' && "text-indigo-600 dark:text-indigo-400 italic font-black"
                              )}>
                                {contact[field.id]}
                              </span>
                            </td>
                          ))}
                          <td className="px-5 py-4 text-sm font-bold">
                            {bulkGroupId === "" ? (
                              <select 
                                className="w-full h-10 rounded-xl border border-gray-200 dark:border-gray-800 px-4 text-xs font-black bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 outline-none shadow-sm transition-all"
                                value={contact.groupId}
                                onChange={(e) => setPendingContacts(prev => prev.map(c => c.tempId === contact.tempId ? { ...c, groupId: e.target.value } : c))}
                              >
                                <option value="">Select Group...</option>
                                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                              </select>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className={clsx(
                                  "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm border transition-all",
                                  contact.groupId ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30" : "bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-600 border-gray-100 dark:border-gray-700"
                                )}>
                                  {groups.find(g => g.id === contact.groupId)?.name || 'No Group'}
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-28 h-28 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mb-10 border-4 border-white dark:border-gray-800 shadow-2xl transition-colors">
              <CheckCircle2 className="w-14 h-14 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Import Successful!</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-3 font-bold max-w-sm mx-auto leading-relaxed">
              We've processed <span className="text-indigo-600 dark:text-indigo-400 font-black">{pendingContacts.filter(c => c.selected).length}</span> contacts and added them to your groups successfully.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
