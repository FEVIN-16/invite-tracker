import { initDB } from './index';

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
  return db.add('people', person);
}

export async function updatePerson(person) {
  const db = await initDB();
  return db.put('people', person);
}

export async function deletePerson(personId) {
  const db = await initDB();
  return db.delete('people', personId);
}

export async function bulkDeletePeople(personIds) {
  const db = await initDB();
  const tx = db.transaction('people', 'readwrite');
  for (const id of personIds) {
    await tx.store.delete(id);
  }
  await tx.done;
}

export async function bulkUpdatePeople(people) {
  const db = await initDB();
  const tx = db.transaction('people', 'readwrite');
  for (const p of people) {
    await tx.store.put(p);
  }
  await tx.done;
}

export async function removeFieldKeyFromAllPeople(categoryId, fieldKey) {
  const db = await initDB();
  const people = await db.getAllFromIndex('people', 'categoryId', categoryId);
  for (const person of people) {
    if (fieldKey in (person.dynamicFields || {})) {
      const updated = {
        ...person,
        dynamicFields: { ...person.dynamicFields },
        updatedAt: new Date().toISOString()
      };
      delete updated.dynamicFields[fieldKey];
      await db.put('people', updated);
    }
  }
}
