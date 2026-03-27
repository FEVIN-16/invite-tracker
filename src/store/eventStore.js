import { create } from 'zustand';

export const useEventStore = create((set) => ({
  currentEvent: null,
  currentCategory: null,
  setCurrentEvent: (event) => set({ currentEvent: event }),
  setCurrentCategory: (category) => set({ currentCategory: category }),
  clearContext: () => set({ currentEvent: null, currentCategory: null }),
}));
