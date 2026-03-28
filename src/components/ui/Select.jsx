import clsx from 'clsx';

export function Select({
  label,
  error,
  options = [],
  value,
  onChange,
  placeholder,
  required,
  id,
  ...props
}) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={selectId} className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <select
        id={selectId}
        value={value}
        onChange={onChange}
        className={clsx(
          'w-full rounded-xl border px-4 py-2 text-sm transition-all',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
          'min-h-[44px]',
          'bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
          error ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(opt => (
          <option key={opt.value} value={opt.value} className="dark:bg-gray-800">{opt.label}</option>
        ))}
      </select>
      {error && <p className="text-red-500 dark:text-red-400 text-xs pl-1 font-bold">{error}</p>}
    </div>
  );
}
