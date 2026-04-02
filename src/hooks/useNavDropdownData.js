import { useState, useEffect } from 'react';
import { getGroupsByUser, getContactsByGroup } from '../db/contactsDb';
import { getEventsByUser } from '../db/eventsDb';
import { initDB } from '../db/index';

/**
 * Hook to fetch navigation dropdown data (People groups or Events).
 * @param {string} type - 'people' or 'events'
 * @param {boolean} isOpen - Whether the dropdown is open (to trigger fetch)
 * @param {string} userId - Current user ID
 */
export function useNavDropdownData(type, isOpen, userId) {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !userId) return;

    async function fetchData() {
      setIsLoading(true);
      try {
        if (type === 'people') {
          const groups = await getGroupsByUser(userId);
          const withCounts = await Promise.all(groups.map(async g => {
            const contacts = await getContactsByGroup(g.id);
            return { ...g, count: contacts.length };
          }));
          setItems(withCounts.sort((a, b) => a.name.localeCompare(b.name)));
        } else if (type === 'events') {
          const evts = await getEventsByUser(userId);
          const db = await initDB();
          const enriched = await Promise.all(evts.map(async ev => {
            const people = await db.getAllFromIndex('people', 'eventId', ev.id);
            return { ...ev, peopleCount: people.length };
          }));
          setItems(enriched.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        }
      } catch (error) {
        console.error(`Error fetching dropdown data for ${type}:`, error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [type, isOpen, userId]);

  return { items, isLoading };
}
