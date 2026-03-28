import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import clsx from 'clsx';

export function Accordion({ title, children, icon: Icon, defaultOpen = false, count }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm transition-all hover:border-indigo-100">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "w-full flex items-center justify-between p-5 transition-colors text-left outline-none",
          isOpen ? "bg-indigo-50/30" : "hover:bg-gray-50"
        )}
      >
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="w-8 h-8 rounded-xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
              <Icon className="w-4 h-4 text-indigo-500" />
            </div>
          )}
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">{title}</h3>
            {count !== undefined && (
              <span className="bg-gray-100 text-gray-500 text-[10px] font-black px-2 py-0.5 rounded-full">
                {count}
              </span>
            )}
          </div>
        </div>
        <ChevronDown 
          className={clsx(
            "w-5 h-5 text-gray-400 transition-transform duration-300",
            isOpen && "rotate-180 text-indigo-500"
          )} 
        />
      </button>
      <div
        className={clsx(
          "transition-all duration-300 ease-in-out",
          isOpen ? "opacity-100 visible h-auto" : "opacity-0 invisible h-0 overflow-hidden"
        )}
      >
        <div className="p-6 border-t border-gray-50">
          {children}
        </div>
      </div>
    </div>
  );
}
