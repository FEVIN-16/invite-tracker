import { initDB } from './index';

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
  return db.add('categories', category);
}

export async function updateCategory(category) {
  const db = await initDB();
  return db.put('categories', category);
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
}
