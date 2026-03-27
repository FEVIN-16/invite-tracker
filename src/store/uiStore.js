import { create } from 'zustand';
import { v4 as uuid } from 'uuid';

export const useUIStore = create((set, get) => ({
  toasts: [],
  isGlobalLoading: false,
  isToolbarVisible: true,

  addToast: (message, type = 'success') => {
    const id = uuid();
    set(state => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(() => get().removeToast(id), 4000);
  },

  removeToast: (id) => set(state => ({ toasts: state.toasts.filter(t => t.id !== id) })),

  setGlobalLoading: (val) => set({ isGlobalLoading: val }),
  
  setIsToolbarVisible: (val) => set({ isToolbarVisible: val }),
}));
