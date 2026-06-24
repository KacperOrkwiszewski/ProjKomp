import { apiUrl } from '../config/api';

export type RequestOptions = RequestInit & {
  timeout?: number;
};

/**
 * Central API client with auth headers and error handling
 */
export async function apiCall(
  endpoint: string,
  options: RequestOptions = {}
): Promise<Response> {
  const { timeout = 10000, ...fetchOptions } = options;

  // Add default headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  // Always include credentials for session cookies
  const init: RequestInit = {
    ...fetchOptions,
    headers,
    credentials: 'include',
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(apiUrl(endpoint), {
      ...init,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Handle 401 Unauthorized - session expired
    if (response.status === 401) {
      console.warn('Session expired or unauthorized');
      // Frontend AuthContext will handle redirect to login
      throw new Error('Unauthorized');
    }

    // Handle 403 Forbidden
    if (response.status === 403) {
      throw new Error('Access forbidden');
    }

    // Handle 5xx errors
    if (response.status >= 500) {
      throw new Error(`Server error: ${response.status}`);
    }

    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof TypeError && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }

    throw error;
  }
}

/**
 * Convenience wrapper for GET requests
 */
export async function apiGet<T>(endpoint: string, options?: RequestOptions): Promise<T> {
  const response = await apiCall(endpoint, { method: 'GET', ...options });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Convenience wrapper for POST requests
 */
export async function apiPost<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
  const response = await apiCall(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
