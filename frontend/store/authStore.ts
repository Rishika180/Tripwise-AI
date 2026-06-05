import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  setAuth: (user, token) => {
    localStorage.setItem('tripwise_token', token);
    localStorage.setItem('tripwise_user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('tripwise_token');
    localStorage.removeItem('tripwise_user');
    set({ user: null, token: null, isAuthenticated: false });
  },
}));

// Initialize from localStorage on app load
export const initAuth = () => {
  const token = localStorage.getItem('tripwise_token');
  const userStr = localStorage.getItem('tripwise_user');
  if (token && userStr) {
    const user = JSON.parse(userStr);
    useAuthStore.getState().setAuth(user, token);
  }
};