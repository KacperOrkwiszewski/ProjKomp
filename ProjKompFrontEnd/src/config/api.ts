export const API_URL = (import.meta.env.VITE_API_URL || '').trim() || 'http://localhost:3001';

export function apiUrl(path: string): string {
  console.log("apiUrl", API_URL);
  return `${API_URL}${path}`;
}
