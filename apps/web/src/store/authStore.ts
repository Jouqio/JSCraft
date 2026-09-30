import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import type { User } from '@jscraft/types';
import toast from 'react-hot-toast';
import { apiPost, ApiClientError } from '@lib/api';
import { xpService } from '@lib/xp';

interface RegisterPayload {
  email: string;
  username: string;
  password: string;
  displayName?: string;
}

export type AuthStatus = 'restoring' | 'authenticated' | 'anonymous';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  isHydrating: boolean;
  restorationError: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: (retryOnRotated?: boolean) => Promise<boolean>;
  updateUser: (patch: Partial<User>) => void;
  addXP: (amount: number) => void;
  hydrateComplete: () => void;
}

let activeRefreshPromise: Promise<boolean> | null = null;

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, _get) => ({
        user: null,
        accessToken: null,
        status: 'restoring',
        isAuthenticated: false,
        isHydrating: true,
        restorationError: null,

        hydrateComplete: () =>
          set((s) => ({
            isHydrating: false,
            status:
              s.status === 'restoring'
                ? s.user && s.accessToken
                  ? 'authenticated'
                  : 'anonymous'
                : s.status,
            isAuthenticated:
              s.status === 'authenticated' || (!!s.user && !!s.accessToken),
          })),

        login: async (email, password) => {
          const data = await apiPost<{ user: User; accessToken: string }>('/auth/login', {
            email,
            password,
          });
          if (!data?.user || !data?.accessToken) {
            throw new ApiClientError(500, 'INVALID_AUTH_DATA', 'Data otentikasi tidak lengkap');
          }
          set({
            user: data.user,
            accessToken: data.accessToken,
            status: 'authenticated',
            isAuthenticated: true,
            isHydrating: false,
            restorationError: null,
          });
        },

        register: async (payload) => {
          const data = await apiPost<{ user: User; accessToken: string }>(
            '/auth/register',
            payload
          );
          if (!data?.user || !data?.accessToken) {
            throw new ApiClientError(500, 'INVALID_AUTH_DATA', 'Data pendaftaran tidak lengkap');
          }
          set({
            user: data.user,
            accessToken: data.accessToken,
            status: 'authenticated',
            isAuthenticated: true,
            isHydrating: false,
            restorationError: null,
          });
        },

        logout: async () => {
          try {
            await apiPost('/auth/logout');
          } catch {
            /* ignore server error during logout */
          } finally {
            set({
              user: null,
              accessToken: null,
              status: 'anonymous',
              isAuthenticated: false,
              isHydrating: false,
              restorationError: null,
            });
          }
        },

        refreshToken: async (retryOnRotated = true): Promise<boolean> => {
          if (activeRefreshPromise) {
            return activeRefreshPromise;
          }

          activeRefreshPromise = (async () => {
            try {
              const data = await apiPost<{ user: User; accessToken: string }>('/auth/refresh');
              if (!data?.user || !data?.accessToken) {
                throw new ApiClientError(500, 'INVALID_AUTH_DATA', 'Sesi tidak lengkap');
              }
              set({
                user: data.user,
                accessToken: data.accessToken,
                status: 'authenticated',
                isAuthenticated: true,
                isHydrating: false,
                restorationError: null,
              });
              return true;
            } catch (err: unknown) {
              let errorCode = '';
              let errorMessage = '';
              let status = 0;

              if (err instanceof ApiClientError) {
                errorCode = err.code;
                errorMessage = err.message;
                status = err.status;
              }

              // If another tab rotated the token concurrently within the grace window, wait 400ms and retry ONCE
              if (errorCode === 'SESSION_ROTATED' && retryOnRotated) {
                activeRefreshPromise = null;
                await new Promise((resolve) => setTimeout(resolve, 400));
                return useAuthStore.getState().refreshToken(false);
              }

              if (errorCode === 'ACCOUNT_DEACTIVATED') {
                toast.error(errorMessage || 'Akun telah dinonaktifkan. Silakan hubungi administrator.', {
                  id: 'account-deactivated',
                });
                set({
                  user: null,
                  accessToken: null,
                  status: 'anonymous',
                  isAuthenticated: false,
                  isHydrating: false,
                  restorationError: errorMessage,
                });
                return false;
              }

              const isNetworkOrServer = status >= 500 || errorCode === 'NETWORK_ERROR';
              set({
                user: null,
                accessToken: null,
                status: 'anonymous',
                isAuthenticated: false,
                isHydrating: false,
                restorationError: isNetworkOrServer
                  ? errorMessage || 'Gagal memulihkan sesi karena kendala jaringan'
                  : null,
              });
              return false;
            } finally {
              activeRefreshPromise = null;
            }
          })();

          return activeRefreshPromise;
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
          user: s.user,
          // isAuthenticated and accessToken are NEVER persisted
        }),
      }
    ),
    { name: 'AuthStore' }
  )
);
