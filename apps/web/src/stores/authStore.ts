import { create } from 'zustand';
import { api } from '@/lib/api';

interface User {
  id: string;
  username: string;
  tickets: number;
  streakDays: number;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;

  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, solanaAddress: string) => Promise<void>;
  logout: () => Promise<void>;
  updateTickets: (tickets: number) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  login: async (username, password) => {
    const data = await api.auth.login({ username, password });
    set({
      user: {
        id: data.userId,
        username: data.username,
        tickets: data.tickets,
        streakDays: data.streakDays,
      },
      isAuthenticated: true,
    });
  },

  register: async (username, password, solanaAddress) => {
    const data = await api.auth.register({ username, password, solanaAddress });
    set({
      user: {
        id: data.userId,
        username: data.username,
        tickets: data.tickets,
        streakDays: 0,
      },
      isAuthenticated: true,
    });
  },

  logout: async () => {
    await api.auth.logout();
    set({ user: null, isAuthenticated: false });
  },

  updateTickets: (tickets) => {
    set((state) => ({
      user: state.user ? { ...state.user, tickets } : null,
    }));
  },
}));