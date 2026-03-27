import { initDB } from './index';

export async function getEventsByUser(userId) {
  const db = await initDB();
  return db.getAllFromIndex('events', 'userId', userId);
}

export async function getEventById(id) {
  const db = await initDB();
  return db.get('events', id);
}

export async function createEvent(event) {
  const db = await initDB();
  return db.add('events', event);
}

export async function updateEvent(event) {
  const db = await initDB();
  return db.put('events', event);
}

/**
 * Cascading delete an event and all its related data.
 */
export async function deleteEvent(eventId) {
  const db = await initDB();
  const tx = db.transaction(['events', 'categories', 'columns', 'people'], 'readwrite');

  // 1. Delete all people in this event
  const people = await tx.objectStore('people').index('eventId').getAllKeys(eventId);
  for (const key of people) {
    await tx.objectStore('people').delete(key);
  }

  // 2. Delete all columns in this event
  const columns = await tx.objectStore('columns').index('eventId').getAllKeys(eventId);
  for (const key of columns) {
    await tx.objectStore('columns').delete(key);
  }

  // 3. Delete all categories in this event
  const categories = await tx.objectStore('categories').index('eventId').getAllKeys(eventId);
  for (const key of categories) {
    await tx.objectStore('categories').delete(key);
  }

  // 4. Delete the event itself
  await tx.objectStore('events').delete(eventId);

  await tx.done;
}
