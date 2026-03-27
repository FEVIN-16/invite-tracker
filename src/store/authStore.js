import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user, isLoading: false }),
  clearUser: () => {
    localStorage.removeItem('currentUserId');
    set({ user: null, isLoading: false });
  },
  setLoading: (val) => set({ isLoading: val }),
}));
