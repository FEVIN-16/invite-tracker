import { initDB } from '../db/index';

const BACKUP_FILENAME = 'invitetracker-backup.json';

/**
 * Service to handle Google Drive API operations (appDataFolder).
 */
export const driveSync = {
  /**
   * Exports all data from IndexedDB into a single JSON object.
   */
  exportAllData: async () => {
    const db = await initDB();
    const stores = ['events', 'categories', 'columns', 'people', 'contactGroups', 'contacts'];
    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      data: {}
    };

    for (const store of stores) {
      backup.data[store] = await db.getAll(store);
    }

    return backup;
  },

  /**
   * Imports data into IndexedDB from a backup object.
   */
  importData: async (backup) => {
    const db = await initDB();
    const stores = ['events', 'categories', 'columns', 'people', 'contactGroups', 'contacts'];
    
    // Use a transaction for safety
    const tx = db.transaction(stores, 'readwrite');
    for (const store of stores) {
      const data = backup.data[store] || [];
      await tx.objectStore(store).clear();
      for (const item of data) {
        await tx.objectStore(store).put(item);
      }
    }
    await tx.done;
  },

  /**
   * Finds the backup file in Google Drive's appDataFolder.
   */
  findBackupFile: async (accessToken) => {
    const res = await fetch(
      'https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name="' + BACKUP_FILENAME + '"',
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );
    const data = await res.json();
    return data.files && data.files.length > 0 ? data.files[0] : null;
  },

  /**
   * Pushes the current local data to Google Drive.
   */
  push: async (accessToken) => {
    const backup = await driveSync.exportAllData();
    const existingFile = await driveSync.findBackupFile(accessToken);
    
    const metadata = {
      name: BACKUP_FILENAME,
      // parents field cannot be updated via PATCH in Drive API v3.
      // Only include it for new file creation (POST).
      ...(existingFile ? {} : { parents: ['appDataFolder'] })
    };

    const fileContent = JSON.stringify(backup);
    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";

    const contentType = 'application/json';
    const multipartRequestBody =
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: ' + contentType + '\r\n\r\n' +
        fileContent +
        close_delim;

    const url = existingFile 
      ? `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=multipart`
      : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

    const method = existingFile ? 'PATCH' : 'POST';

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`
      },
      body: multipartRequestBody
    });

    if (!response.ok) {
      throw new Error('Drive push failed: ' + response.statusText);
    }

    return await response.json();
  },

  /**
   * Pulls the backup data from Google Drive.
   */
  pull: async (accessToken) => {
    const file = await driveSync.findBackupFile(accessToken);
    if (!file) return null;

    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!res.ok) {
      throw new Error('Drive pull failed: ' + res.statusText);
    }

    return await res.json();
  }
};
