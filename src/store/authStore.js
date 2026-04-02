import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,
  isLoading: true,
  setUser: (user, accessToken) => set({ user, accessToken, isLoading: false }),
  clearUser: () => {
    localStorage.removeItem('google_user');
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('currentUserId'); // Legacy cleanup
    set({ user: null, accessToken: null, isLoading: false });
  },
  setLoading: (val) => set({ isLoading: val }),
}));
