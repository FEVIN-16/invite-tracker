import { useState, useRef } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { readExcelFile, mapExcelData } from '../../utils/excel';
import { bulkUpdatePeople } from '../../db/peopleDb';
import { useUIStore } from '../../store/uiStore';
import { Upload, FileType, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { v4 as uuid } from 'uuid';

export function ImportModal({ isOpen, onClose, onSuccess, eventId, categoryId, columns }) {
  const { addToast } = useUIStore();
  const fileInputRef = useRef(null);
  
  const [step, setStep] = useState(1); // 1: Select File, 2: Map Columns, 3: Success
  const [file, setFile] = useState(null);
  const [rawRows, setRawRows] = useState([]);
  const [mapping, setMapping] = useState({ name: -1 });
  const [isImporting, setIsImporting] = useState(false);

  function reset() {
    setStep(1);
    setFile(null);
    setRawRows([]);
    setMapping({ name: -1 });
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
      const headers = data[0].map(h => String(h).toLowerCase());
      const initialMapping = { name: headers.indexOf('name') };
      columns.forEach(col => {
        const idx = headers.findIndex(h => h === col.label.toLowerCase() || h === col.id.toLowerCase());
        initialMapping[col.id] = idx;
      });
      
      setMapping(initialMapping);
      setStep(2);
    } catch {
      addToast('Error reading file', 'error');
    }
  }

  async function startImport() {
    if (mapping.name === -1) {
      addToast('Please map the "Name" column', 'warning');
      return;
    }

    setIsImporting(true);
    try {
      const mappedPeople = mapExcelData(rawRows, mapping, columns).map(p => ({
        ...p,
        id: uuid(),
        eventId,
        categoryId,
        createdAt: new Date().toISOString(),
      }));

      await bulkUpdatePeople(mappedPeople);
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
      title="Import Guests from Excel"
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
            className="border-2 border-dashed border-gray-200 rounded-2xl p-12 flex flex-col items-center justify-center gap-4 hover:border-indigo-300 hover:bg-indigo-50/30 cursor-pointer transition-all group"
          >
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
              <Upload className="w-8 h-8 text-gray-400 group-hover:text-indigo-600" />
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-gray-900">Click to upload or drag & drop</p>
              <p className="text-sm text-gray-500 mt-1">Excel (.xlsx, .xls) or CSV files supported</p>
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
            <div className="bg-indigo-50 p-4 rounded-xl flex gap-3">
              <FileType className="w-5 h-5 text-indigo-600" />
              <div>
                <p className="text-sm font-semibold text-indigo-900">{file?.name}</p>
                <p className="text-xs text-indigo-700">{rawRows.length - 1} rows detected</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Map Columns</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Target Field</label>
                  <div className="h-10 flex items-center text-sm font-medium text-gray-900">Name (Required)</div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Excel Column</label>
                  <select 
                    className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                    value={mapping.name}
                    onChange={e => setMapping({ ...mapping, name: parseInt(e.target.value) })}
                  >
                    <option value={-1}>Don't Import</option>
                    {headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                  </select>
                </div>

                {columns.map(col => (
                  <div key={col.id} className="contents">
                    <div className="h-10 flex items-center text-sm text-gray-700">{col.label}</div>
                    <select 
                      className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                      value={mapping[col.id] ?? -1}
                      onChange={e => setMapping({ ...mapping, [col.id]: parseInt(e.target.value) })}
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
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Import Successful!</h3>
            <p className="text-gray-500 mt-2">All valid rows have been added to your guest list.</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
