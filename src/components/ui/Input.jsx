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
        <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        id={inputId}
        className={clsx(
          'w-full rounded-lg border px-3 py-2 text-sm',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
          'min-h-[40px] md:min-h-[44px]',
          error ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white',
          className
        )}
        {...props}
      />
      {error && <p className="text-red-500 text-xs">{error}</p>}
      {helperText && !error && <p className="text-gray-500 text-xs">{helperText}</p>}
    </div>
  );
}
