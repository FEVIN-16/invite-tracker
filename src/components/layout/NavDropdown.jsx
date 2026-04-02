import { useState, useRef, useEffect, Fragment } from 'react';
import { createPortal } from 'react-dom';
import { Search, ChevronRight, Users, Calendar, MoreHorizontal, X, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Transition, Dialog, DialogPanel, TransitionChild } from '@headlessui/react';
import { useNavDropdownData } from '../../hooks/useNavDropdownData';
import { Spinner } from '../ui/Spinner';
import clsx from 'clsx';

export function NavDropdown({ 
  type, 
  isOpen, 
  onClose, 
  anchorRef, 
  userId, 
  placement = 'right', 
  title 
}) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const { items, isLoading } = useNavDropdownData(type, isOpen, userId);
  const inputRef = useRef(null);

  // Focus search input on open
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 150);
    }
  }, [isOpen]);

  const filteredItems = items.filter(item => 
    (item.name || item.title).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayItems = filteredItems.slice(0, 50); // Hard limit for performance

  const handleNavigate = (path) => {
    navigate(path);
    onClose();
  };

  if (placement === 'bottom-sheet') {
    return (
      <Transition show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-[60] md:hidden" onClose={onClose}>
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px]" />
          </TransitionChild>

          <div className="fixed inset-0 flex items-end justify-center pointer-events-none">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300 transform"
              enterFrom="translate-y-full"
              enterTo="translate-y-0"
              leave="ease-in duration-200 transform"
              leaveFrom="translate-y-0"
              leaveTo="translate-y-full"
            >
              <DialogPanel className="w-full max-w-xl bg-white dark:bg-gray-950 rounded-t-[32px] shadow-2xl pointer-events-auto border-t border-gray-100 dark:border-gray-800 flex flex-col max-h-[85vh]">
                <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full mx-auto mt-4 mb-2 shrink-0" />
                
                <div className="px-6 py-4 flex items-center justify-between border-b border-gray-50 dark:border-gray-900 shrink-0">
                  <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">{title}</h3>
                  <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-4 shrink-0 px-6">
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-600" />
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder={`Search ${type === 'people' ? 'groups' : 'events'}...`}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-gray-900/50 border-none rounded-2xl text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 placeholder:text-gray-400 dark:placeholder:text-gray-600 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 pb-6 min-h-0 custom-scrollbar">
                  {isLoading ? (
                    <div className="flex justify-center py-12"><Spinner /></div>
                  ) : displayItems.length > 0 ? (
                    <div className="space-y-1">
                      {displayItems.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleNavigate(type === 'people' ? `/people/${item.id}` : `/events/${item.id}/categories`)}
                          className="w-full flex items-center gap-4 p-3.5 hover:bg-gray-50 dark:hover:bg-indigo-900/10 rounded-2xl transition-all text-left group"
                        >
                          <div className={clsx(
                            "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-gray-100 dark:border-gray-800 group-hover:scale-105 transition-transform",
                            type === 'people' ? "bg-white dark:bg-gray-900" : "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                          )}>
                            {type === 'people' ? (
                              <div className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                            ) : (
                              <Calendar className="w-5 h-5" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-[13px] font-black text-gray-900 dark:text-white uppercase tracking-tight truncate">
                              {item.name || item.title}
                            </h4>
                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest mt-0.5 truncate">
                              {type === 'people' 
                                ? `${item.count} people in group` 
                                : `${item.date || 'No date'} · ${item.peopleCount} guests`}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-700 group-hover:text-indigo-500 transition-colors" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No results found</p>
                    </div>
                  )}
                </div>

                <div className="px-6 py-4 border-t border-gray-50 dark:border-gray-900 shrink-0">
                  <button
                    onClick={() => handleNavigate(type === 'people' ? '/people' : '/events')}
                    className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 transition-all font-bold"
                  >
                    View All {type === 'people' ? 'Groups' : 'Events'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>
    );
  }

  // Desktop Flyout
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isOpen && anchorRef?.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setCoords({
        top: Math.min(rect.top - 20, window.innerHeight - 500), // Keep in view
        left: rect.right + 12
      });
    }
  }, [isOpen, anchorRef]);

  // Handle clicks outside the dropdown to close it (Desktop)
  useEffect(() => {
    if (!isOpen || placement === 'bottom-sheet') return;
    
    const handleEvents = (e) => {
      // Close on ESC
      if (e.key === 'Escape') onClose();
      // Close on click outside (this is a bit simpler than traditional ref checks
      // because we're using a portal and fixed positioning)
      // Actually, we'll use a direct event check
    };
    
    window.addEventListener('keydown', handleEvents);
    return () => window.removeEventListener('keydown', handleEvents);
  }, [isOpen, placement, onClose]);

  return createPortal(
    <>
      <Transition
        show={isOpen}
        as={Fragment}
        enter="transition-opacity ease-out duration-200"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity ease-in duration-150"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="fixed inset-0 z-[90] bg-transparent" onClick={onClose} />
      </Transition>

      <Transition
        show={isOpen}
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 translate-x-[-10px]"
        enterTo="opacity-100 translate-x-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-x-0"
        leaveTo="opacity-0 translate-x-[-10px]"
      >
        <div 
          className="fixed z-[100] w-[340px] bg-white dark:bg-gray-950 rounded-3xl shadow-2xl shadow-indigo-500/10 border border-gray-100 dark:border-gray-800 flex flex-col overflow-hidden max-h-[520px]"
          style={{ top: Math.max(12, coords.top), left: coords.left }}
        >
        <div className="p-4 border-b border-gray-50 dark:border-gray-900 bg-gray-50/30 dark:bg-gray-900/20">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-600 transition-colors group-focus-within:text-indigo-500" />
            <input
              ref={inputRef}
              type="text"
              placeholder={`Search ${type === 'people' ? 'groups' : 'events'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl text-xs font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-gray-400"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar min-h-0">
          {isLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : displayItems.length > 0 ? (
            <div className="space-y-0.5">
              {displayItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(type === 'people' ? `/people/${item.id}` : `/events/${item.id}/categories`)}
                  className="w-full flex items-center gap-3 p-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 rounded-2xl transition-all text-left group"
                >
                  <div className={clsx(
                    "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-gray-100 dark:border-gray-800 group-hover:scale-105 transition-transform shadow-sm",
                    type === 'people' ? "bg-white dark:bg-gray-900" : "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                  )}>
                    {type === 'people' ? (
                      <div className="w-3.5 h-3.5 rounded-full shadow-inner" style={{ backgroundColor: item.color }} />
                    ) : (
                      <Calendar className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[12px] font-black text-gray-900 dark:text-white uppercase tracking-tight truncate leading-tight">
                      {item.name || item.title}
                    </h4>
                    <p className="text-[9px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest mt-0.5 truncate">
                      {type === 'people' 
                        ? `${item.count} people` 
                        : `${item.date || 'No date'} · ${item.peopleCount} guests`}
                    </p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-700 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No results found</p>
            </div>
          )}
        </div>

        <button
          onClick={() => handleNavigate(type === 'people' ? '/people' : '/events')}
          className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors flex items-center justify-between text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest group"
        >
          View All {type === 'people' ? 'Groups' : 'Events'}
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </Transition>
    </>,
    document.body
  );
}
