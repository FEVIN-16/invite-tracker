import { useOffline } from '../../hooks/useOffline';
import { WifiOff } from 'lucide-react';

export function OfflineBanner() {
  const isOffline = useOffline();
  if (!isOffline) return null;

  return (
    <div className="sticky top-0 left-0 right-0 z-[60] bg-amber-400 dark:bg-amber-500 text-amber-900 dark:text-amber-950 text-center text-sm font-bold py-2.5 px-4 flex items-center justify-center gap-2 shadow-md">
      <WifiOff className="w-4 h-4" />
      <span className="uppercase tracking-widest text-[10px]">You are offline. All changes are saved locally.</span>
    </div>
  );
}
