import clsx from 'clsx';

export function Badge({ label, color, size = 'md', className }) {
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1';
  const isHex = color && color.startsWith('#');

  return (
    <span
      className={clsx('inline-flex items-center rounded-full font-medium', sizeClass, className)}
      style={isHex ? { backgroundColor: color + '20', color: color } : undefined}
    >
      {label}
    </span>
  );
}
