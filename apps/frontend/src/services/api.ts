import type { ApiResponse } from '@local-latex-editor/shared-types';

// Same-origin relative URLs: Vite proxies /api in dev, the backend serves the app in production.
const API_BASE = '';

declare global {
  interface Window {
    __TEXCRAFT_TOKEN__?: string;
  }
}

export function apiToken(): string {
  const fromWindow = typeof window !== 'undefined' ? window.__TEXCRAFT_TOKEN__ : undefined;
  if (fromWindow && fromWindow !== '__TEXCRAFT_SESSION_TOKEN__') return fromWindow;
  return import.meta.env.VITE_API_TOKEN || '';
}

export function apiAuthHeaders(extra?: Record<string, string>): Record<string, string> {
  const token = apiToken();
  return {
    ...(token ? { 'X-TexCraft-Token': token } : {}),
    ...extra,
  };
}

export function notifySessionExpired(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event('texcraft-session-expired'));
}

export class ApiError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(
    code: string,
    message: string,
    statusCode: number,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'ApiError';
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type');
  
  if (contentType?.includes('application/json')) {
    const data = await response.json() as ApiResponse<T>;
    
    if (!data.success) {
      throw new ApiError(
        data.error?.code || 'UNKNOWN_ERROR',
        data.error?.message || 'An unknown error occurred',
        response.status,
        data.error?.details
      );
    }
    
    return data.data as T;
  }
  
  // For non-JSON responses (like PDFs)
  return response as unknown as T;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  
  const hasBody = options.body !== undefined;
  
  const config: RequestInit = {
    method: options.method || 'GET',
    ...options,
  };

  // Add cache-busting headers to prevent browser caching
  config.headers = {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
    ...config.headers,
    ...apiAuthHeaders(),
  };

  const response = await fetch(url, config);

  if (response.status === 401) {
    notifySessionExpired();
  }

  if (!response.ok) {
    try {
      const errorData = await response.json() as ApiResponse<unknown>;
      throw new ApiError(
        errorData.error?.code || `HTTP_${response.status}`,
        errorData.error?.message || response.statusText,
        response.status,
        errorData.error?.details
      );
    } catch (parseError) {
      if (!(parseError instanceof ApiError)) {
        throw new ApiError(
          `HTTP_${response.status}`,
          response.statusText,
          response.status
        );
      }
      throw parseError;
    }
  }

  return parseResponse<T>(response);
}

// Convenience methods
export const api = {
  get: <T>(endpoint: string) => apiClient<T>(endpoint, { method: 'GET' }),
  
  post: <T>(endpoint: string, body: unknown) =>
    apiClient<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  
  put: <T>(endpoint: string, body: unknown) =>
    apiClient<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  
  delete: <T>(endpoint: string) =>
    apiClient<T>(endpoint, { method: 'DELETE' }),

  patch: <T>(endpoint: string, body?: unknown) =>
    apiClient<T>(endpoint, {
      method: 'PATCH',
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    }),
};
