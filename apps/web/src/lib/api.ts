import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
  type AxiosResponse,
  AxiosError,
} from 'axios';

const BASE_URL = (import.meta.env['VITE_API_URL'] as string | undefined) ?? '/v1';

export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

// Lazily resolved store reference — avoids circular import at module load time
// The store module is only accessed when a request is actually made
let _getToken: (() => string | null) | null = null;
let _refreshFn: (() => Promise<boolean>) | null = null;
let _getNewToken: (() => string | null) | null = null;

export function registerAuthStore(
  getToken: () => string | null,
  refreshFn: () => Promise<boolean>,
  getNewToken: () => string | null
) {
  _getToken    = getToken;
  _refreshFn   = refreshFn;
  _getNewToken = getNewToken;
}

// ── Request: attach Bearer ────────────────────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = _getToken?.();
  if (token && config.headers) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// ── Response: 401 → refresh → retry ──────────────────────────
let isRefreshing = false;
let queue: Array<{ resolve: (t: string) => void; reject: (e: unknown) => void }> = [];

const drain = (err: unknown, token: string | null) => {
  queue.forEach((p) => (err ? p.reject(err) : p.resolve(token!)));
  queue = [];
};

api.interceptors.response.use(
  (res: AxiosResponse) => res,
  async (error: AxiosError) => {
    const cfg = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status !== 401 || cfg._retry || !_refreshFn) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        queue.push({ resolve, reject });
      }).then((token) => {
        cfg.headers['Authorization'] = `Bearer ${token}`;
        return api(cfg);
      });
    }

    cfg._retry   = true;
    isRefreshing = true;

    try {
      const ok    = await _refreshFn();
      const token = _getNewToken?.() ?? null;
      isRefreshing = false;
      drain(null, token);
      if (ok && token) {
        cfg.headers['Authorization'] = `Bearer ${token}`;
        return api(cfg);
      }
    } catch (err) {
      isRefreshing = false;
      drain(err, null);
    }

    return Promise.reject(error);
  }
);

// ── Typed helpers ─────────────────────────────────────────────
export const apiGet   = <T>(url: string) => api.get<T>(url).then((r) => r.data);
export const apiPost  = <T>(url: string, data?: unknown) => api.post<T>(url, data).then((r) => r.data);
export const apiPatch = <T>(url: string, data?: unknown) => api.patch<T>(url, data).then((r) => r.data);
export const apiDel   = <T>(url: string) => api.delete<T>(url).then((r) => r.data);
