import { openDB } from 'idb';

const DB_NAME = 'inviteTrackerDB';
const DB_VERSION = 7;

export const initDB = () =>
  openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // 'users' store is removed - handled by Google Auth

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

      if (!db.objectStoreNames.contains('taskGroups')) {
        const tgStore = db.createObjectStore('taskGroups', { keyPath: 'id' });
        tgStore.createIndex('eventId', 'eventId', { unique: false });
        tgStore.createIndex('userId', 'userId', { unique: false });
      }

      if (!db.objectStoreNames.contains('tasks')) {
        const tStore = db.createObjectStore('tasks', { keyPath: 'id' });
        tStore.createIndex('groupId', 'groupId', { unique: false });
        tStore.createIndex('eventId', 'eventId', { unique: false });
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

      if (!db.objectStoreNames.contains('syncQueue')) {
        db.createObjectStore('syncQueue', { keyPath: 'id' });
      }
    },
  });
