export function Checkbox({ label, name, checked, onChange, disabled, id }) {
  const checkId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <label htmlFor={checkId} className="flex items-center gap-2 cursor-pointer select-none">
      <input
        id={checkId}
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="w-4 h-4 rounded text-indigo-600 border-gray-300 focus:ring-indigo-500 cursor-pointer"
      />
      {label && <span className="text-sm text-gray-700">{label}</span>}
    </label>
  );
}
