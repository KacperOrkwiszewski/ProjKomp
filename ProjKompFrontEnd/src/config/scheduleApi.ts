export const SCHEDULE_API_BASE_URL = (import.meta.env.VITE_SCHEDULE_API_URL || '').trim() || 'http://localhost:8080';

export function scheduleApiUrl(path: string): string {
  console.log("scheduleApiUrl", SCHEDULE_API_BASE_URL);
  return `${SCHEDULE_API_BASE_URL}${path}`;
}
