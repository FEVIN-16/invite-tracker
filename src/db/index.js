import { openDB } from 'idb';

const DB_NAME = 'inviteTrackerDB';
const DB_VERSION = 3;

export const initDB = () =>
  openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('users')) {
        const usersStore = db.createObjectStore('users', { keyPath: 'id' });
        usersStore.createIndex('username', 'username', { unique: true });
      }

      if (!db.objectStoreNames.contains('events')) {
        const eventsStore = db.createObjectStore('events', { keyPath: 'id' });
        eventsStore.createIndex('userId', 'userId', { unique: false });
      }

      if (!db.objectStoreNames.contains('categories')) {
        const catStore = db.createObjectStore('categories', { keyPath: 'id' });
        catStore.createIndex('eventId', 'eventId', { unique: false });
        catStore.createIndex('userId', 'userId', { unique: false });
      }

      if (!db.objectStoreNames.contains('columns')) {
        const colStore = db.createObjectStore('columns', { keyPath: 'id' });
        colStore.createIndex('categoryId', 'categoryId', { unique: false });
        colStore.createIndex('eventId', 'eventId', { unique: false });
      }

      if (!db.objectStoreNames.contains('people')) {
        const peopleStore = db.createObjectStore('people', { keyPath: 'id' });
        peopleStore.createIndex('categoryId', 'categoryId', { unique: false });
        peopleStore.createIndex('eventId', 'eventId', { unique: false });
      }

      // Dedicated stores for the global People section (contact book)
      if (!db.objectStoreNames.contains('contactGroups')) {
        const cgStore = db.createObjectStore('contactGroups', { keyPath: 'id' });
        cgStore.createIndex('userId', 'userId', { unique: false });
      }

      if (!db.objectStoreNames.contains('contacts')) {
        const contactsStore = db.createObjectStore('contacts', { keyPath: 'id' });
        contactsStore.createIndex('groupId', 'groupId', { unique: false });
        contactsStore.createIndex('userId', 'userId', { unique: false });
      }
    },
  });
