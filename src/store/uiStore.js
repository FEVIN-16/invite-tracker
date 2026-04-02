import { create } from 'zustand';
import { v4 as uuid } from 'uuid';

export const useUIStore = create((set, get) => ({
  toasts: [],
  isGlobalLoading: false,
  isToolbarVisible: true,
  isSidebarCollapsed: localStorage.getItem('isSidebarCollapsed') === 'true',
  theme: localStorage.getItem('theme') || 'light',

  toggleSidebar: () => {
    const newVal = !get().isSidebarCollapsed;
    set({ isSidebarCollapsed: newVal });
    localStorage.setItem('isSidebarCollapsed', newVal);
  },

  addToast: (message, type = 'success') => {
    const id = uuid();
    set(state => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(() => get().removeToast(id), 4000);
  },

  removeToast: (id) => set(state => ({ toasts: state.toasts.filter(t => t.id !== id) })),

  setGlobalLoading: (val) => set({ isGlobalLoading: val }),
  
  setIsToolbarVisible: (val) => set({ isToolbarVisible: val }),

  syncStatus: 'idle', // 'idle' | 'syncing' | 'synced' | 'offline' | 'error'
  setSyncStatus: (val) => set({ syncStatus: val }),

  pendingSyncCount: 0,
  setPendingSyncCount: (val) => set({ pendingSyncCount: val }),

  toggleTheme: () => {
    const newTheme = get().theme === 'light' ? 'dark' : 'light';
    set({ theme: newTheme });
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },
}));
