import { Filter, X, ChevronDown } from 'lucide-react';
import { Menu, MenuButton, MenuItem, MenuItems, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { Tooltip } from '../ui/Tooltip';
import clsx from 'clsx';

export function PeopleFilters({ columns, filters, setFilters, people }) {
  const activeFiltersCount = Object.values(filters).filter(v => v).length;
  
  // Support select, multiselect, and radio for filtering
  const filterableColumns = columns.filter(c => ['select', 'multiselect', 'radio'].includes(c.type));

  function updateFilter(colId, value) {
    setFilters(prev => ({ ...prev, [colId]: value }));
  }

  function clearFilters() {
    setFilters({});
  }

  if (filterableColumns.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <Menu as="div" className="relative">
        <Tooltip content={activeFiltersCount > 0 ? `${activeFiltersCount} filters active` : "Filter List"} position="bottom">
          <MenuButton className={clsx(
            "flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-bold border transition-all truncate",
            activeFiltersCount > 0 
              ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100" 
              : "bg-white border-gray-200 text-gray-600 hover:border-indigo-300"
          )}>
            <Filter className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Filters</span>
            {activeFiltersCount > 0 && <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px]">{activeFiltersCount}</span>}
            <ChevronDown className="w-3.5 h-3.5 opacity-50 shrink-0" />
          </MenuButton>
        </Tooltip>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95"
        >
          <MenuItems className="absolute right-0 mt-3 w-72 origin-top-right bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 focus:outline-none p-2 space-y-4">
            <div className="max-h-[400px] overflow-auto p-2 space-y-5">
              {filterableColumns.map(col => (
                <div key={col.id} className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{col.label}</label>
                  <select 
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 focus:bg-white transition-all appearance-none"
                    value={filters[col.id] || ''}
                    onChange={e => updateFilter(col.id, e.target.value)}
                  >
                    <option value="">All {col.label}s</option>
                    {col.options?.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            
            <div className="p-2 border-t border-gray-50 flex justify-between items-center">
              <span className="text-[10px] font-bold text-gray-400">{activeFiltersCount} active</span>
              <button 
                onClick={clearFilters}
                className="text-xs text-red-500 font-bold hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                Reset All
              </button>
            </div>
          </MenuItems>
        </Transition>
      </Menu>

      {activeFiltersCount > 0 && (
        <Tooltip content="Clear All Filters" position="bottom">
          <button 
            onClick={clearFilters}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </Tooltip>
      )}
    </div>
  );
}
