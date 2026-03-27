import clsx from 'clsx';

export function Skeleton({ className }) {
  return (
    <div className={clsx('animate-pulse bg-gray-200 rounded', className)} />
  );
}
