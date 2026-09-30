import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
  type AxiosResponse,
  type AxiosError,
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
  _getToken = getToken;
  _refreshFn = refreshFn;
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

// ── Single-flight refresh promise (safe for React StrictMode and concurrent requests) ──
let activeRefreshPromise: Promise<boolean> | null = null;

export function singleFlightRefresh(): Promise<boolean> {
  if (activeRefreshPromise) {
    return activeRefreshPromise;
  }
  if (!_refreshFn) {
    return Promise.resolve(false);
  }
  activeRefreshPromise = _refreshFn().finally(() => {
    activeRefreshPromise = null;
  });
  return activeRefreshPromise;
}

// ── Response: 401 → refresh → retry ──────────────────────────
api.interceptors.response.use(
  (res: AxiosResponse) => res,
  async (error: AxiosError) => {
    const cfg = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    if (!cfg) return Promise.reject(error);

    const url = cfg.url ?? '';
    const isAuthRoute =
      url.includes('/auth/refresh') ||
      url.includes('/auth/login') ||
      url.includes('/auth/register');

    const errCode = (error.response?.data as { error?: { code?: string } })?.error?.code;

    // Never attempt to refresh for 401 on auth routes, already retried, missing refresh function, or deactivated account
    if (
      error.response?.status !== 401 ||
      cfg._retry ||
      isAuthRoute ||
      !_refreshFn ||
      errCode === 'ACCOUNT_DEACTIVATED'
    ) {
      return Promise.reject(error);
    }

    cfg._retry = true;

    try {
      const ok = await singleFlightRefresh();
      const token = _getNewToken?.() ?? null;
      if (ok && token) {
        if (cfg.headers) {
          cfg.headers['Authorization'] = `Bearer ${token}`;
        }
        return api(cfg);
      }
    } catch (err) {
      return Promise.reject(err);
    }

    return Promise.reject(error);
  }
);

// ── Typed helpers with envelope unwrapping and validation ─────
import type { AxiosRequestConfig } from 'axios';
import type { ApiResponse } from '@jscraft/types';

export class ApiClientError extends Error {
  status: number;
  code: string;
  details?: Record<string, string[]>;

  constructor(status: number, code: string, message: string, details?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function unwrapEnvelope<T>(res: AxiosResponse<unknown>): T {
  const payload = res.data as ApiResponse<T> | undefined;

  if (!payload || typeof payload !== 'object') {
    throw new ApiClientError(res.status, 'INVALID_RESPONSE', 'Format respons server tidak valid');
  }

  if (payload.success === false) {
    throw new ApiClientError(
      res.status,
      payload.error?.code ?? 'UNKNOWN_ERROR',
      payload.error?.message ?? 'Terjadi kesalahan pada server',
      payload.error?.details
    );
  }

  if (!('data' in payload)) {
    throw new ApiClientError(
      res.status,
      'MISSING_DATA',
      'Respons server tidak memiliki data yang diharapkan'
    );
  }

  return payload.data;
}

function handleAxiosError(err: unknown): never {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status ?? 0;
    const body = err.response?.data as ApiResponse<unknown> | undefined;
    if (body && body.success === false && body.error) {
      throw new ApiClientError(status, body.error.code, body.error.message, body.error.details);
    }
    throw new ApiClientError(
      status,
      err.code ?? 'NETWORK_ERROR',
      err.message || 'Gagal terhubung ke server'
    );
  }
  if (err instanceof ApiClientError) {
    throw err;
  }
  throw new ApiClientError(
    500,
    'UNEXPECTED_ERROR',
    err instanceof Error ? err.message : String(err)
  );
}

export async function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  try {
    const res = await api.get<unknown>(url, config);
    return unwrapEnvelope<T>(res);
  } catch (err) {
    handleAxiosError(err);
  }
}

export async function apiGetList<T>(url: string, config?: AxiosRequestConfig): Promise<T[]> {
  const data = await apiGet<T[]>(url, config);
  if (!Array.isArray(data)) {
    throw new ApiClientError(
      500,
      'INVALID_DATA_SHAPE',
      'Respons server bukan array data yang valid'
    );
  }
  return data;
}

export async function apiPost<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  try {
    const res = await api.post<unknown>(url, data, config);
    return unwrapEnvelope<T>(res);
  } catch (err) {
    handleAxiosError(err);
  }
}

export async function apiPatch<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  try {
    const res = await api.patch<unknown>(url, data, config);
    return unwrapEnvelope<T>(res);
  } catch (err) {
    handleAxiosError(err);
  }
}

export async function apiDel<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  try {
    const res = await api.delete<unknown>(url, config);
    return unwrapEnvelope<T>(res);
  } catch (err) {
    handleAxiosError(err);
  }
}
