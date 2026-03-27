import { useOffline } from '../../hooks/useOffline';
import { WifiOff } from 'lucide-react';

export function OfflineBanner() {
  const isOffline = useOffline();
  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-400 text-amber-900 text-center text-sm py-2 px-4 flex items-center justify-center gap-2">
      <WifiOff className="w-4 h-4" />
      <span>You are offline. All changes are saved locally.</span>
    </div>
  );
}
