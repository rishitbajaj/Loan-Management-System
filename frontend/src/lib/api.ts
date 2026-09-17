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

export const API_URL = '/api';
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
  fresh?: boolean;
  signal?: AbortSignal;
}

let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

const inflightGets = new Map<string, Promise<ApiResult<unknown>>>();
const getCache = new Map<string, ApiResult<unknown>>();

function cacheKey(path: string): string {
  return `${getToken() ?? ''}:${path}`;
}

function clearVolatileCache(): void {
  getCache.clear();
}

export function clearApiCache(): void {
  clearVolatileCache();
}

export function peekCachedGet<T>(path: string): ApiResult<T> | null {
  return (getCache.get(cacheKey(path)) as ApiResult<T> | undefined) ?? null;
}

export function isAbortError(err: unknown): boolean {
  return (err instanceof DOMException || err instanceof Error) && err.name === 'AbortError';
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
    response = await fetch(`${API_URL}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body,
      signal: options.signal,
    });
  } catch (err) {
    if (isAbortError(err)) throw err;
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
    const key = cacheKey(path);
    if (!options.fresh) {
      const cached = getCache.get(key);
      if (cached) return cached as ApiResult<T>;
    }
    const existing = inflightGets.get(key);
    if (existing) return existing as Promise<ApiResult<T>>;

    const pending = executeRequest<T>(path, options).then((result) => {
      getCache.set(key, result);
      return result;
    });
    inflightGets.set(key, pending as Promise<ApiResult<unknown>>);
    void pending.finally(() => inflightGets.delete(key));
    return pending;
  }

  return executeRequest<T>(path, options);
}

export const api = {
  get: <T>(path: string, opts?: { fresh?: boolean; signal?: AbortSignal }) =>
    request<T>(path, { fresh: opts?.fresh, signal: opts?.signal }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  upload: <T>(path: string, formData: FormData) => request<T>(path, { method: 'POST', formData }),
};

export async function fetchBlob(path: string, signal?: AbortSignal): Promise<Blob> {
  const token = getToken();
  try {
    const response = await fetch(`${API_URL}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      signal,
    });
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      throw new ApiError(response.status, payload?.message ?? 'Could not download file');
    }
    return response.blob();
  } catch (err) {
    if (isAbortError(err)) throw err;
    if (err instanceof ApiError) throw err;
    throw new ApiError(0, 'Cannot reach the server. Is the backend running?');
  }
}

export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return 'Something went wrong';
}
