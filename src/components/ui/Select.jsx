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
        <label htmlFor={selectId} className="text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <select
        id={selectId}
        value={value}
        onChange={onChange}
        className={clsx(
          'w-full rounded-lg border px-3 py-2 text-sm bg-white',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
          'min-h-[40px] md:min-h-[44px]',
          error ? 'border-red-400' : 'border-gray-300'
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  );
}
