import { driveSync } from './driveSync';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { initDB } from '../db/index';

let syncTimeout = null;

export const syncManager = {
  /**
   * Schedules a sync after a short delay (debounce).
   * This prevents multiple uploads during rapid edits.
   */
  scheduleSync: async () => {
    if (syncTimeout) clearTimeout(syncTimeout);
    
    const db = await initDB();
    const id = 'last_change';
    await db.put('syncQueue', { id, timestamp: new Date().toISOString(), status: 'pending' });
    
    // Update pending count
    const count = await db.count('syncQueue');
    useUIStore.getState().setPendingSyncCount(count);

    // Only schedule if online
    if (!navigator.onLine) {
      useUIStore.getState().setSyncStatus('offline');
      return;
    }

    useUIStore.getState().setSyncStatus('idle');

    syncTimeout = setTimeout(async () => {
      await syncManager.syncNow();
    }, 3000); // 3 second debounce
  },

  /**
   * Performs an immediate sync to Google Drive.
   */
  syncNow: async () => {
    const { accessToken } = useAuthStore.getState();
    if (!accessToken) return;

    if (!navigator.onLine) {
      useUIStore.getState().setSyncStatus('offline');
      return;
    }

    useUIStore.getState().setSyncStatus('syncing');

    try {
      await driveSync.push(accessToken);
      
      // Clear the queue after successful sync
      const db = await initDB();
      await db.delete('syncQueue', 'last_change');
      useUIStore.getState().setPendingSyncCount(0);

      useUIStore.getState().setSyncStatus('synced');
      
      setTimeout(() => {
        if (useUIStore.getState().syncStatus === 'synced') {
          useUIStore.getState().setSyncStatus('idle');
        }
      }, 5000);
      
    } catch (error) {
      console.error('Sync failed:', error);
      useUIStore.getState().setSyncStatus('error');
    }
  }
};
