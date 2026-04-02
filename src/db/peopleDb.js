import { initDB } from './index';
import { syncManager } from '../services/syncManager';

export async function getPeopleByCategory(categoryId) {
  const db = await initDB();
  return db.getAllFromIndex('people', 'categoryId', categoryId);
}

export async function getPersonById(id) {
  const db = await initDB();
  return db.get('people', id);
}

export async function createPerson(person) {
  const db = await initDB();
  const res = await db.add('people', person);
  syncManager.scheduleSync();
  return res;
}

export async function updatePerson(person) {
  const db = await initDB();
  const res = await db.put('people', person);
  syncManager.scheduleSync();
  return res;
}

export async function deletePerson(personId) {
  const db = await initDB();
  const res = await db.delete('people', personId);
  syncManager.scheduleSync();
  return res;
}

export async function bulkDeletePeople(personIds) {
  const db = await initDB();
  const tx = db.transaction('people', 'readwrite');
  for (const id of personIds) {
    await tx.store.delete(id);
  }
  await tx.done;
  syncManager.scheduleSync();
}

export async function bulkUpdatePeople(people) {
  const db = await initDB();
  const tx = db.transaction('people', 'readwrite');
  for (const p of people) {
    await tx.store.put(p);
  }
  await tx.done;
  syncManager.scheduleSync();
}

export async function removeFieldKeyFromAllPeople(categoryId, fieldKey) {
  const db = await initDB();
  const people = await db.getAllFromIndex('people', 'categoryId', categoryId);
  let modified = false;
  for (const person of people) {
    if (fieldKey in (person.dynamicFields || {})) {
      const updated = {
        ...person,
        dynamicFields: { ...person.dynamicFields },
        updatedAt: new Date().toISOString()
      };
      delete updated.dynamicFields[fieldKey];
      await db.put('people', updated);
      modified = true;
    }
  }
  if (modified) syncManager.scheduleSync();
}
