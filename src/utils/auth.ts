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
  localStorage.removeItem('unifix_web_fcm_token');
}

export function saveUser(user: any): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function loadUser(): any | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

let _refreshPromise: Promise<string | null> | null = null;

async function _doRefresh(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    _refreshPromise = null;
    return null;
  }
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (res.status === 401 || res.status === 403) {
      clearAuthTokens();
      _refreshPromise = null;
      return null;
    }
    if (!res.ok) {
      _refreshPromise = null;
      return null;
    }
    const data = await res.json();
    const newToken = data?.token;
    const newRefresh = data?.refreshToken;
    if (!newToken) {
      clearAuthTokens();
      _refreshPromise = null;
      return null;
    }
    setAccessToken(newToken);
    if (newRefresh) setRefreshToken(newRefresh);
    _refreshPromise = null;
    return newToken;
  } catch {
    _refreshPromise = null;
    return null;
  }
}

export async function getValidAccessToken(): Promise<string | null> {
  const token = getAccessToken();
  if (!token) {
    if (!getRefreshToken()) return null;
    if (!_refreshPromise) _refreshPromise = _doRefresh();
    return _refreshPromise;
  }
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      if (!_refreshPromise) _refreshPromise = _doRefresh();
      return _refreshPromise;
    }
    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp && payload.exp - Math.floor(Date.now() / 1000) > 60) return token;
  } catch {
    return token;
  }
  if (!_refreshPromise) _refreshPromise = _doRefresh();
  return _refreshPromise;
}