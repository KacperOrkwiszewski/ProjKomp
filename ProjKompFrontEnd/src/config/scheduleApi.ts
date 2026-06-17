export const SCHEDULE_API_BASE_URL = import.meta.env.VITE_SCHEDULE_API_URL || 'http://77.237.23.131';

export function scheduleApiUrl(path: string): string {
  return `${SCHEDULE_API_BASE_URL}${path}`;
}
