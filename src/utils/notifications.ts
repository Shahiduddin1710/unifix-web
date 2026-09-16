import { getToken, onMessage } from 'firebase/messaging';
import { getFirebaseMessaging } from '../firebase';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;
const WEB_FCM_TOKEN_KEY = 'unifix_web_fcm_token';
const BASE_URL = import.meta.env.VITE_BASE_URL;

export function getStoredFcmToken(): string | null {
  return localStorage.getItem(WEB_FCM_TOKEN_KEY);
}

function setStoredFcmToken(token: string): void {
  localStorage.setItem(WEB_FCM_TOKEN_KEY, token);
}

export function clearStoredFcmToken(): void {
  localStorage.removeItem(WEB_FCM_TOKEN_KEY);
}

async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const existing = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
    if (existing) return existing;
    const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;
    return reg;
  } catch {
    return null;
  }
}

async function sendTokenToBackend(token: string, accessToken: string): Promise<void> {
  await fetch(`${BASE_URL}/auth/save-push-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'x-platform': 'web',
    },
    body: JSON.stringify({ fcmToken: token }),
  });
}

async function removeTokenFromBackend(token: string, accessToken: string): Promise<void> {
  await fetch(`${BASE_URL}/auth/remove-push-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ fcmToken: token }),
  });
}

export async function initWebNotifications(accessToken: string): Promise<void> {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'denied') return;

  const messaging = await getFirebaseMessaging();
  if (!messaging) return;

  const swReg = await registerServiceWorker();
  if (!swReg) return;

  const permission: NotificationPermission = Notification.permission === 'default'
    ? await Notification.requestPermission()
    : Notification.permission;
  if (permission !== 'granted') return;

  try {
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swReg,
    });

    if (!token) return;

    const stored = getStoredFcmToken();
    if (stored !== token) {
      await sendTokenToBackend(token, accessToken);
      setStoredFcmToken(token);
    }

    onMessage(messaging, (payload) => {
      const title = payload.notification?.title || payload.data?.title || 'UniFiX';
      const body = payload.notification?.body || payload.data?.body || '';
      if (document.visibilityState !== 'visible') {
        if (Notification.permission === 'granted') {
          new Notification(title, { body, icon: '/icon.png' });
        }
        return;
      }
      const event = new CustomEvent('unifix-foreground-notification', {
        detail: { title, body, data: payload.data || {} },
      });
      window.dispatchEvent(event);
    });
  } catch {
  }
}

export async function cleanupWebNotifications(accessToken: string): Promise<void> {
  const token = getStoredFcmToken();
  if (!token) return;
  try {
    await removeTokenFromBackend(token, accessToken);
  } catch {
  } finally {
    clearStoredFcmToken();
  }
}