import { initDB } from './index';

export async function getUserByUsername(username) {
  const db = await initDB();
  return db.getFromIndex('users', 'username', username.toLowerCase());
}

export async function getUserById(id) {
  const db = await initDB();
  return db.get('users', id);
}

export async function createUser(user) {
  const db = await initDB();
  return db.add('users', user);
}
