import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import type { User } from '@jscraft/types';
import { api } from '@lib/api';
import { xpService } from '@lib/xp';

interface RegisterPayload {
  email: string;
  username: string;
  password: string;
  displayName?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isHydrating: boolean;

  login:         (email: string, password: string) => Promise<void>;
  register:      (data: RegisterPayload) => Promise<void>;
  logout:        () => Promise<void>;
  refreshToken:  () => Promise<boolean>;
  updateUser:    (patch: Partial<User>) => void;
  addXP:         (amount: number) => void;
  hydrateComplete: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isHydrating: true,

        hydrateComplete: () => set({ isHydrating: false }),

        login: async (email, password) => {
          const { data } = await api.post<{ user: User; accessToken: string }>(
            '/auth/login', { email, password }
          );
          set({ user: data.user, accessToken: data.accessToken, isAuthenticated: true });
        },

        register: async (payload) => {
          const { data } = await api.post<{ user: User; accessToken: string }>(
            '/auth/register', payload
          );
          set({ user: data.user, accessToken: data.accessToken, isAuthenticated: true });
        },

        logout: async () => {
          try { await api.post('/auth/logout'); } catch { /* ignore */ }
          finally { set({ user: null, accessToken: null, isAuthenticated: false }); }
        },

        refreshToken: async () => {
          try {
            const { data } = await api.post<{ user: User; accessToken: string }>('/auth/refresh');
            set({ user: data.user, accessToken: data.accessToken, isAuthenticated: true });
            return true;
          } catch {
            set({ user: null, accessToken: null, isAuthenticated: false });
            return false;
          }
        },

        updateUser: (patch) =>
          set((s) => ({ user: s.user ? { ...s.user, ...patch } : null })),

        addXP: (amount) =>
          set((s) => {
            if (!s.user) return s;
            const xpTotal = s.user.xpTotal + amount;
            const { level } = xpService.levelFromXP(xpTotal);
            return { user: { ...s.user, xpTotal, level } };
          }),
      }),
      {
        name: 'jscraft-auth',
        partialize: (s) => ({
          user:            s.user,
          accessToken:     s.accessToken,
          isAuthenticated: s.isAuthenticated,
        }),
        onRehydrateStorage: () => (state) => {
          state?.hydrateComplete();
        },
      }
    ),
    { name: 'AuthStore' }
  )
);
