import { useState, useRef } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { readExcelFile, mapGlobalExcelData } from '../../utils/excel';
import { bulkCreateContacts } from '../../db/contactsDb';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { Upload, FileType, CheckCircle2, X } from 'lucide-react';
import { v4 as uuid } from 'uuid';

const TARGET_FIELDS = [
  { id: 'name', label: 'Full Name', required: true },
  { id: 'phone', label: 'Phone', required: false },
  { id: 'email', label: 'Email', required: false },
  { id: 'identifier', label: 'Identifier Note', required: false },
];

export function GlobalExcelImportModal({ isOpen, onClose, onSuccess, groupId }) {
  const { addToast } = useUIStore();
  const user = useAuthStore(s => s.user);
  const fileInputRef = useRef(null);
  
  const [step, setStep] = useState(1); // 1: Select File, 2: Map Columns, 3: Success
  const [file, setFile] = useState(null);
  const [rawRows, setRawRows] = useState([]);
  const [mapping, setMapping] = useState({ name: -1, phone: -1, email: -1, identifier: -1 });
  const [isImporting, setIsImporting] = useState(false);

  function reset() {
    setStep(1);
    setFile(null);
    setRawRows([]);
    setMapping({ name: -1, phone: -1, email: -1, identifier: -1 });
    setIsImporting(false);
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
      
      // Attempt auto-mapping
      const headers = data[0].map(h => String(h || '').toLowerCase());
      const initialMapping = {
        name: headers.indexOf('name'),
        phone: headers.findIndex(h => h.includes('phone') || h.includes('mobile') || h.includes('contact')),
        email: headers.indexOf('email'),
        identifier: headers.findIndex(h => h.includes('note') || h.includes('identifier') || h.includes('info')),
      };
      
      setMapping(initialMapping);
      setStep(2);
    } catch {
      addToast('Error reading file', 'error');
    }
  }

  async function startImport() {
    if (mapping.name === -1) {
      addToast('Please map the "Full Name" column', 'warning');
      return;
    }

    setIsImporting(true);
    try {
      const mappedContacts = mapGlobalExcelData(rawRows, mapping).map(c => ({
        ...c,
        id: uuid(),
        groupId,
        userId: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      await bulkCreateContacts(mappedContacts);
      setStep(3);
      onSuccess();
    } catch {
      addToast('Import failed', 'error');
    } finally {
      setIsImporting(false);
    }
  }

  const headers = rawRows[0] || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => { onClose(); setTimeout(reset, 300); }}
      title="Import Contacts from Excel"
      size="xl"
      footer={
        <div className="flex gap-2">
          {step === 2 && <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>}
          {step === 3 ? (
            <Button onClick={onClose}>Done</Button>
          ) : (
            <Button 
               disabled={step === 1 || mapping.name === -1} 
               loading={isImporting} 
               onClick={startImport}
            >
              Start Import
            </Button>
          )}
        </div>
      }
    >
      <div className="py-2">
        {step === 1 && (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl p-16 flex flex-col items-center justify-center gap-6 hover:border-indigo-300 dark:hover:border-indigo-900 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/10 cursor-pointer transition-all group overflow-hidden relative"
          >
            <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-2xl flex items-center justify-center group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-all shadow-inner">
              <Upload className="w-10 h-10 text-gray-400 dark:text-gray-600 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
            </div>
            <div className="text-center">
              <p className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Select People File</p>
              <p className="text-[10px] font-black text-gray-400 dark:text-gray-600 mt-2 uppercase tracking-widest leading-loose">Excel (.xlsx) or CSV files supported</p>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              hidden 
              accept=".xlsx,.xls,.csv" 
              onChange={handleFileChange} 
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-5 rounded-2xl flex gap-4 border border-indigo-100 dark:border-indigo-900/20 items-center">
              <div className="w-12 h-12 bg-white dark:bg-gray-900 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-50 dark:border-indigo-900/20 shrink-0">
                <FileType className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-black text-indigo-900 dark:text-indigo-300 truncate">{file?.name}</p>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{rawRows.length - 1} contacts detected</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-5 bg-indigo-600 rounded-full" />
                <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest">Map Columns</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                {TARGET_FIELDS.map(field => (
                  <div key={field.id} className="contents">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest px-1">Target Field</label>
                      <div className="h-10 flex items-center text-sm font-black text-gray-900 dark:text-gray-200">
                        {field.label} {field.required && <span className="text-red-500 ml-1">*</span>}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest px-1">Excel Column</label>
                      <select 
                        className="w-full h-11 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-4 text-xs font-black text-gray-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all shadow-sm"
                        value={mapping[field.id]}
                        onChange={e => setMapping({ ...mapping, [field.id]: parseInt(e.target.value) })}
                      >
                        <option value={-1}>Don't Import</option>
                        {headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mb-8 border-4 border-white dark:border-gray-800 shadow-xl">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Import Successful!</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">All contacts have been added successfully.</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
