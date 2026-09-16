export interface FieldError {
  field: string;
  message: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly errors: FieldError[];

  constructor(status: number, message: string, errors: FieldError[] = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }

  fieldMessage(field: string): string | undefined {
    return this.errors.find((e) => e.field === field)?.message;
  }
}

export interface ApiResult<T> {
  data: T;
  message?: string;
}

function requiredApiUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL ?? (process.env.NODE_ENV === 'production' ? undefined : 'http://localhost:5000/api');
  if (!url) {
    throw new Error('NEXT_PUBLIC_API_URL is required in production');
  }
  return url;
}

export const API_URL = requiredApiUrl();
export const TOKEN_KEY = 'lms_token';
export const USER_KEY = 'lms_user';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  method?: Method;
  body?: unknown;
  formData?: FormData;
}

let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

const inflightGets = new Map<string, Promise<ApiResult<unknown>>>();
let meCache: { token: string; result: ApiResult<unknown>; expires: number } | null = null;
const ME_CACHE_MS = 2500;

function clearVolatileCache(): void {
  meCache = null;
}

async function executeRequest<T>(path: string, options: RequestOptions = {}): Promise<ApiResult<T>> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let body: BodyInit | undefined;
  if (options.formData) {
    body = options.formData;
  } else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { method: options.method ?? 'GET', headers, body });
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Is the backend running?');
  }

  const payload = (await response.json().catch(() => null)) as
    | { success: true; data: T; message?: string }
    | { success: false; message: string; errors?: FieldError[] }
    | null;

  if (!response.ok || !payload || !payload.success) {
    if (response.status === 401 && token) {
      clearVolatileCache();
      onUnauthorized?.();
    }
    const message = payload && !payload.success ? payload.message : `Request failed (${response.status})`;
    const errors = payload && !payload.success ? payload.errors ?? [] : [];
    throw new ApiError(response.status, message, errors);
  }

  return { data: payload.data, message: payload.message };
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<ApiResult<T>> {
  const method = options.method ?? 'GET';
  if (method !== 'GET') clearVolatileCache();

  if (method === 'GET' && !options.body && !options.formData) {
    const token = getToken() ?? '';
    if (path === '/auth/me' && meCache && meCache.token === token && meCache.expires > Date.now()) {
      return meCache.result as ApiResult<T>;
    }

    const key = `${token}:${path}`;
    const existing = inflightGets.get(key);
    if (existing) return existing as Promise<ApiResult<T>>;

    const pending = executeRequest<T>(path, options).then((result) => {
      if (path === '/auth/me') {
        meCache = { token, result, expires: Date.now() + ME_CACHE_MS };
      }
      return result;
    });
    inflightGets.set(key, pending as Promise<ApiResult<unknown>>);
    void pending.finally(() => inflightGets.delete(key));
    return pending;
  }

  return executeRequest<T>(path, options);
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  upload: <T>(path: string, formData: FormData) => request<T>(path, { method: 'POST', formData }),
};

export async function fetchBlob(path: string): Promise<Blob> {
  const token = getToken();
  const response = await fetch(`${API_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new ApiError(response.status, payload?.message ?? 'Could not download file');
  }
  return response.blob();
}

export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return 'Something went wrong';
}
