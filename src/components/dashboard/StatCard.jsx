import clsx from 'clsx';

const colors = {
  indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
  emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
  amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
  blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
};

export function StatCard({ title, value, icon: Icon, color = 'indigo' }) {
  return (
    <div className="bg-white dark:bg-gray-900/50 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-4 transition-all hover:bg-white/80 dark:hover:bg-gray-900">
      <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner', colors[color])}>
        <Icon className="w-5 h-5 md:w-6 md:h-6" />
      </div>
      <div>
        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">{title}</p>
        <p className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{value}</p>
      </div>
    </div>
  );
}
