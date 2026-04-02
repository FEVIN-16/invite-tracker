import { useEffect } from 'react';
import { useUIStore } from '../store/uiStore';
import { syncManager } from '../services/syncManager';

/**
 * Hook to handle online/offline status changes and trigger synchronization.
 */
export function useOnlineSync() {
  const setSyncStatus = useUIStore(state => state.setSyncStatus);

  useEffect(() => {
    const handleOnline = () => {
      console.log('App is back online. Flushing sync queue...');
      setSyncStatus('idle');
      syncManager.syncNow();
    };

    const handleOffline = () => {
      console.log('App is offline.');
      setSyncStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (!navigator.onLine) {
      setSyncStatus('offline');
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setSyncStatus]);
}
