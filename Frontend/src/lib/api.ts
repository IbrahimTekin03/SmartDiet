export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const API_URL = `${API_BASE_URL}/api`;

export function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path.startsWith('/') ? path : '/' + path}`;
}
