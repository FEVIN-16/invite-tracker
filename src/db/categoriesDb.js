import { initDB } from './index';
import { syncManager } from '../services/syncManager';

export async function getCategoriesByEvent(eventId) {
  const db = await initDB();
  return db.getAllFromIndex('categories', 'eventId', eventId);
}

export async function getCategoryById(id) {
  const db = await initDB();
  return db.get('categories', id);
}

export async function createCategory(category) {
  const db = await initDB();
  const res = await db.add('categories', category);
  syncManager.scheduleSync();
  return res;
}

export async function updateCategory(category) {
  const db = await initDB();
  const res = await db.put('categories', category);
  syncManager.scheduleSync();
  return res;
}

/**
 * Delete a category and its associated people.
 */
export async function deleteCategory(categoryId) {
  const db = await initDB();
  const tx = db.transaction(['categories', 'people'], 'readwrite');
  
  // 1. Delete all people in this category
  const people = await tx.objectStore('people').index('categoryId').getAllKeys(categoryId);
  for (const key of people) {
    await tx.objectStore('people').delete(key);
  }

  // 2. Delete the category itself
  await tx.objectStore('categories').delete(categoryId);
  
  await tx.done;
  syncManager.scheduleSync();
}
