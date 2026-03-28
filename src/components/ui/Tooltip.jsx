import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';

export function Tooltip({ children, content, position = 'top', delay = 0 }) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);

  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

      let top, left;

      if (position === 'top') {
        top = rect.top + scrollTop - 8;
        left = rect.left + scrollLeft + rect.width / 2;
      } else if (position === 'bottom') {
        top = rect.bottom + scrollTop + 8;
        left = rect.left + scrollLeft + rect.width / 2;
      } else if (position === 'right') {
        top = rect.top + scrollTop + rect.height / 2;
        left = rect.right + scrollLeft + 8;
      } else if (position === 'left') {
        top = rect.top + scrollTop + rect.height / 2;
        left = rect.left + scrollLeft - 8;
      }

      setCoords({ top, left });
    }
  };

  useEffect(() => {
    if (isVisible) {
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
    }
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isVisible]);

  const positions = {
    top: '-translate-x-1/2 -translate-y-full',
    bottom: '-translate-x-1/2',
    left: '-translate-x-full -translate-y-1/2',
    right: '-translate-y-1/2',
  };

  const arrowPositions = {
    top: 'top-full left-1/2 -translate-x-1/2 -mt-1 border-t-gray-900 dark:border-t-black',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 -mb-1 border-b-gray-900 dark:border-b-black',
    left: 'left-full top-1/2 -translate-y-1/2 -ml-1 border-l-gray-900 dark:border-l-black',
    right: 'right-full top-1/2 -translate-y-1/2 -mr-1 border-r-gray-900 dark:border-r-black',
  };

  return (
    <>
      <div 
        ref={triggerRef}
        className="inline-flex items-center"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>

      {isVisible && content && createPortal(
        <div 
          className={clsx(
            "fixed z-[10000] px-2.5 py-1.5 text-[10px] font-black tracking-wider text-white bg-gray-900 dark:bg-black rounded-lg whitespace-nowrap shadow-2xl pointer-events-none transition-opacity duration-200 uppercase",
            positions[position]
          )}
          style={{ top: coords.top, left: coords.left }}
        >
          {content}
          <div className={clsx(
            "absolute border-4 border-transparent",
            arrowPositions[position]
          )} />
        </div>,
        document.body
      )}
    </>
  );
}

