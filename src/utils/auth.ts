const ACCESS_KEY = 'unifix_web_access_token';
const REFRESH_KEY = 'unifix_web_refresh_token';
const USER_KEY = 'unifix_web_user';
const BASE_URL = import.meta.env.VITE_BASE_URL;

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY);
}

export function setAccessToken(token: string): void {
  localStorage.setItem(ACCESS_KEY, token);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function setRefreshToken(token: string): void {
  localStorage.setItem(REFRESH_KEY, token);
}

export function clearAuthTokens(): void {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

export function saveUser(user: any): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function loadUser(): any | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export async function getValidAccessToken(): Promise<string | null> {
  const token = getAccessToken();
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp && payload.exp - Math.floor(Date.now() / 1000) > 60) return token;
  } catch {
    return token;
  }
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) { clearAuthTokens(); return null; }
    const data = await res.json();
    const newToken = data?.token;
    const newRefresh = data?.refreshToken;
    if (!newToken) { clearAuthTokens(); return null; }
    setAccessToken(newToken);
    if (newRefresh) setRefreshToken(newRefresh);
    return newToken;
  } catch {
    return null;
  }
}