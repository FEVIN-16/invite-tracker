import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import clsx from 'clsx';

export function Accordion({ title, children, icon: Icon, defaultOpen = false, count, actions }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm transition-all hover:border-indigo-100 dark:hover:border-indigo-900">
      <div className={clsx(
        "w-full flex items-center justify-between p-4 md:p-5 transition-colors text-left",
        isOpen ? "bg-indigo-50/30 dark:bg-indigo-900/10" : "hover:bg-gray-50 dark:hover:bg-gray-800"
      )}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex-1 flex items-center justify-between outline-none min-w-0"
        >
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            {Icon && (
              <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center shadow-sm">
                <Icon className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider truncate">{title}</h3>
              {count !== undefined && (
                <span className="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[10px] font-black px-2 py-0.5 rounded-full">
                  {count}
                </span>
              )}
            </div>
          </div>
        </button>

        <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
          {actions && (
            <div onClick={(e) => e.stopPropagation()}>
              {actions}
            </div>
          )}
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 outline-none"
          >
            <ChevronDown 
              className={clsx(
                "w-5 h-5 text-gray-400 transition-transform duration-300",
                isOpen && "rotate-180 text-indigo-500"
              )} 
            />
          </button>
        </div>
      </div>
      <div
        className={clsx(
          "transition-all duration-300 ease-in-out",
          isOpen ? "opacity-100 visible h-auto" : "opacity-0 invisible h-0 overflow-hidden"
        )}
      >
        <div className="p-4 md:p-6 border-t border-gray-50 dark:border-gray-800">
          {children}
        </div>
      </div>
    </div>
  );
}
