import { useState } from 'react';
import clsx from 'clsx';

export function Tooltip({ children, content, position = 'top', delay = 0 }) {
  const [isVisible, setIsVisible] = useState(false);

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowPositions = {
    top: 'top-full left-1/2 -translate-x-1/2 -mt-1 border-t-gray-900',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 -mb-1 border-b-gray-900',
    left: 'left-full top-1/2 -translate-y-1/2 -ml-1 border-l-gray-900',
    right: 'right-full top-1/2 -translate-y-1/2 -mr-1 border-r-gray-900',
  };

  return (
    <div 
      className="relative inline-flex items-center group"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && content && (
        <div className={clsx(
          "absolute z-[9999] px-2.5 py-1.5 text-[10px] font-black tracking-wider text-white bg-gray-900 dark:bg-black rounded-lg whitespace-nowrap shadow-2xl pointer-events-none transition-all duration-200 uppercase",
          positions[position]
        )}>
          {content}
          <div className={clsx(
            "absolute border-4 border-transparent dark:border-transparent",
            position === 'top' && "border-t-gray-900 dark:border-t-black",
            position === 'bottom' && "border-b-gray-900 dark:border-b-black",
            position === 'left' && "border-l-gray-900 dark:border-l-black",
            position === 'right' && "border-r-gray-900 dark:border-r-black",
            arrowPositions[position]
          )} />
        </div>
      )}
    </div>
  );
}
