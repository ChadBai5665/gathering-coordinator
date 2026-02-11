import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile } from '@ontheway/shared';
import * as api from '@/services/api';

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthActions {
  login: (nickname: string) => Promise<void>;
  logout: () => void;
  setUser: (user: UserProfile) => void;
  setAuth: (user: UserProfile, token: string) => void;
  loadFromStorage: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,

      login: async (nickname: string) => {
        set({ isLoading: true });
        try {
          const res = await api.guestLogin(nickname);
          set({
            user: res.user,
            token: res.access_token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch {
          set({ isLoading: false });
          throw new Error('登录失败');
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      setUser: (user) => set({ user }),

      setAuth: (user, token) =>
        set({ user, token, isAuthenticated: true }),

      loadFromStorage: () => {
        // persist middleware handles this automatically
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
