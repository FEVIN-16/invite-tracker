import clsx from 'clsx';

export function Input({
  label,
  error,
  helperText,
  required,
  className,
  id,
  ...props
}) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        id={inputId}
        className={clsx(
          'w-full rounded-xl border px-4 py-2 text-sm transition-all',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
          'min-h-[44px]',
          error 
            ? 'border-red-400 bg-red-50 dark:bg-red-900/10' 
            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600',
          className
        )}
        {...props}
      />
      {error && <p className="text-red-500 dark:text-red-400 text-xs pl-1 font-bold">{error}</p>}
      {helperText && !error && <p className="text-gray-400 dark:text-gray-500 text-[10px] pl-1 font-medium">{helperText}</p>}
    </div>
  );
}
