import { Cloud, CloudOff, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { Tooltip } from './Tooltip';
import clsx from 'clsx';

export function SyncStatusBadge({ className, collapsed = false }) {
  const syncStatus = useUIStore(state => state.syncStatus);
  const pendingCount = useUIStore(state => state.pendingSyncCount);

  const statusConfig = {
    idle: {
      icon: Cloud,
      text: 'Backup Ready',
      color: 'text-gray-400',
      tooltip: 'Changes are saved locally and ready to sync'
    },
    syncing: {
      icon: RefreshCw,
      text: 'Syncing...',
      color: 'text-indigo-500 animate-spin',
      tooltip: 'Backing up to Google Drive'
    },
    synced: {
      icon: CheckCircle2,
      text: 'Synced',
      color: 'text-emerald-500',
      tooltip: 'Your data is securely backed up to Google Drive'
    },
    offline: {
      icon: CloudOff,
      text: pendingCount > 0 ? `${pendingCount} Pending` : 'Offline',
      color: 'text-amber-500',
      tooltip: pendingCount > 0 
        ? `${pendingCount} changes waiting to sync` 
        : 'App is offline. Changes will sync when back online.'
    },
    error: {
      icon: AlertCircle,
      text: 'Sync Error',
      color: 'text-red-500',
      tooltip: 'Failed to sync with Google Drive. Check connection.'
    }
  };

  const config = statusConfig[syncStatus] || statusConfig.idle;
  const Icon = config.icon;

  if (collapsed) {
    return (
      <Tooltip content={config.tooltip} position="right">
        <div className={clsx("flex items-center justify-center p-1.5 rounded-lg bg-gray-50 dark:bg-gray-800/50", className)}>
          <Icon className={clsx("w-5 h-5", config.color)} />
        </div>
      </Tooltip>
    );
  }

  return (
    <div className={clsx(
      "flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 transition-all",
      className
    )}>
      <Icon className={clsx("w-3.5 h-3.5", config.color)} />
      <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
        {config.text}
      </span>
    </div>
  );
}
