import clsx from 'clsx';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';

const config = {
  success: { icon: CheckCircle, bg: 'bg-green-50 border-green-200', text: 'text-green-800', icon_color: 'text-green-500' },
  error: { icon: AlertCircle, bg: 'bg-red-50 border-red-200', text: 'text-red-800', icon_color: 'text-red-500' },
  warning: { icon: AlertTriangle, bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800', icon_color: 'text-amber-500' },
  info: { icon: Info, bg: 'bg-blue-50 border-blue-200', text: 'text-blue-800', icon_color: 'text-blue-500' },
};

export function Toast({ toast }) {
  const { removeToast } = useUIStore();
  const c = config[toast.type] || config.info;
  const Icon = c.icon;

  return (
    <div className={clsx('flex items-start gap-3 p-3 pr-4 rounded-lg border shadow-md min-w-[280px] max-w-sm', c.bg)}>
      <Icon className={clsx('w-5 h-5 flex-shrink-0 mt-0.5', c.icon_color)} />
      <p className={clsx('text-sm flex-1', c.text)}>{toast.message}</p>
      <button onClick={() => removeToast(toast.id)} className={clsx('flex-shrink-0 hover:opacity-70', c.icon_color)}>
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
