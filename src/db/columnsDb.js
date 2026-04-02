import { initDB } from './index';
import { syncManager } from '../services/syncManager';

export async function getColumnsByEvent(eventId) {
  const db = await initDB();
  return db.getAllFromIndex('columns', 'eventId', eventId);
}

export async function getColumnsByCategory(categoryId) {
  const db = await initDB();
  const cols = await db.getAllFromIndex('columns', 'categoryId', categoryId);
  return cols.sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function createColumn(column) {
  const db = await initDB();
  const res = await db.add('columns', column);
  syncManager.scheduleSync();
  return res;
}

export async function updateColumn(column) {
  const db = await initDB();
  const res = await db.put('columns', column);
  syncManager.scheduleSync();
  return res;
}

export async function deleteColumn(columnId) {
  const db = await initDB();
  const res = await db.delete('columns', columnId);
  syncManager.scheduleSync();
  return res;
}

/**
 * Reorder columns in bulk.
 */
export async function updateColumnsOrder(columns) {
  const db = await initDB();
  const tx = db.transaction('columns', 'readwrite');
  for (const col of columns) {
    await tx.store.put(col);
  }
  await tx.done;
  syncManager.scheduleSync();
}
