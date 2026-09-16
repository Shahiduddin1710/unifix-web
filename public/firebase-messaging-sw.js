importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAGyW1xLnu1OXfXQdckEuTQ5M3Oahop4h8",
  authDomain: "unifix-ac990.firebaseapp.com",
  projectId: "unifix-ac990",
  storageBucket: "unifix-ac990.appspot.com",
  messagingSenderId: "855341107379",
  appId: "1:855341107379:web:49e604efd43fa93d5188c6",
});


const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || payload.data?.title || 'UniFiX';
  const body = payload.notification?.body || payload.data?.body || '';
  const data = payload.data || {};

  self.registration.showNotification(title, {
    body,
    icon: '/icon.png',
    badge: '/icon.png',
    data,
    tag: data.type || 'unifix-notification',
    renotify: true,
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const route = resolveRoute(data);
  const urlToOpen = new URL(route, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        const clientUrl = new URL(client.url);
        if (clientUrl.origin === self.location.origin && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

function resolveRoute(data) {
  const type = data.type || '';
  const complaintTypes = [
    'new_complaint', 'complaint_accepted', 'complaint_in_progress',
    'complaint_completed', 'complaint_rejected', 'new_rating',
  ];
  const lostFoundTypes = [
    'new_lost_found', 'item_handed_over', 'new_lost_report', 'lost_report_found',
  ];
  if (complaintTypes.includes(type)) return '/dashboard?tab=complaints';
  if (lostFoundTypes.includes(type)) return '/dashboard?tab=lostfound';
  return '/dashboard';
}