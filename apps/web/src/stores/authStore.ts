import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';

interface User {
  id: string;
  username: string;
  tickets: number;
  streakDays: number;
  solanaAddress: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;

  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, solanaAddress: string) => Promise<void>;
  logout: () => Promise<void>;
  updateTickets: (tickets: number) => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
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
            solanaAddress: data.solanaAddress || '',
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
            solanaAddress: data.solanaAddress || '',
          },
          isAuthenticated: true,
        });
      },

      logout: async () => {
        try {
          await api.auth.logout();
        } catch (error) {
          console.error('Logout error:', error);
        }
        set({ user: null, isAuthenticated: false });
      },

      updateTickets: (tickets) => {
        set((state) => ({
          user: state.user ? { ...state.user, tickets } : null,
        }));
      },

      checkAuth: async () => {
        try {
          const profile = await api.profile.me();
          set({
            user: {
              id: profile.profile.id,
              username: profile.profile.username,
              tickets: profile.profile.tickets,
              streakDays: profile.profile.streak_days,
              solanaAddress: profile.profile.solana_address || '',
            },
            isAuthenticated: true,
          });
        } catch (error) {
          console.error('Auth check failed:', error);
          set({ user: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
);