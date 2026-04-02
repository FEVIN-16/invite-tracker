import { initDB } from './index';
import { syncManager } from '../services/syncManager';

// ── Contact Groups (like "Family", "Friends") ──────────────────────────────

export async function getGroupsByUser(userId) {
  const db = await initDB();
  return db.getAllFromIndex('contactGroups', 'userId', userId);
}

export async function createGroup(group) {
  const db = await initDB();
  const res = await db.add('contactGroups', group);
  syncManager.scheduleSync();
  return res;
}

export async function updateGroup(group) {
  const db = await initDB();
  const res = await db.put('contactGroups', group);
  syncManager.scheduleSync();
  return res;
}

export async function deleteGroup(groupId) {
  const db = await initDB();
  const tx = db.transaction(['contactGroups', 'contacts'], 'readwrite');
  // Delete all contacts in the group
  const keys = await tx.objectStore('contacts').index('groupId').getAllKeys(groupId);
  for (const k of keys) await tx.objectStore('contacts').delete(k);
  await tx.objectStore('contactGroups').delete(groupId);
  await tx.done;
  syncManager.scheduleSync();
}

// ── Contacts ───────────────────────────────────────────────────────────────

export async function getContactsByGroup(groupId) {
  const db = await initDB();
  return db.getAllFromIndex('contacts', 'groupId', groupId);
}

export async function createContact(contact) {
  const db = await initDB();
  const res = await db.add('contacts', contact);
  syncManager.scheduleSync();
  return res;
}

export async function updateContact(contact) {
  const db = await initDB();
  const res = await db.put('contacts', contact);
  syncManager.scheduleSync();
  return res;
}

export async function deleteContact(id) {
  const db = await initDB();
  const res = await db.delete('contacts', id);
  syncManager.scheduleSync();
  return res;
}

export async function bulkDeleteContacts(ids) {
  const db = await initDB();
  const tx = db.transaction('contacts', 'readwrite');
  for (const id of ids) await tx.store.delete(id);
  await tx.done;
  syncManager.scheduleSync();
}

export async function bulkCreateContacts(contacts) {
  const db = await initDB();
  const tx = db.transaction('contacts', 'readwrite');
  for (const contact of contacts) {
    await tx.store.put(contact);
  }
  await tx.done;
  syncManager.scheduleSync();
}
