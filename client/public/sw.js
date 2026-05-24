// public/sw.js
// ─────────────────────────────────────────────────────────────────────────────
// MedGuide AI — Service Worker for Medicine Reminder Notifications
// Place this file at:  /public/sw.js   (Vite will serve it at root)
// ─────────────────────────────────────────────────────────────────────────────

const CACHE_NAME = 'medguide-v1';

self.addEventListener('install', (event) => {
  console.log('[SW] Installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activated');
  event.waitUntil(clients.claim());
});

// ── Handle push notifications from server (if you add Web Push later) ────────
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  const title   = data.title   || 'MedGuide Reminder';
  const options = {
    body:    data.body    || 'Time to take your medicine!',
    icon:    data.icon    || '/logo192.png',
    badge:   '/logo192.png',
    tag:     data.tag     || 'medicine-reminder',
    data:    data.data    || {},
    actions: [
      { action: 'taken',  title: '✅ Maine le li' },
      { action: 'snooze', title: '⏰ 10 min baad' },
      { action: 'skip',   title: '❌ Skip' }
    ],
    requireInteraction: true,   // notification stays until user acts
    vibrate: [200, 100, 200]
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// ── Handle notification button clicks ─────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  const { action, notification } = event;
  const { reminderId, scheduledTime } = notification.data || {};

  notification.close();

  if (action === 'taken') {
    // POST dose log back to API
    event.waitUntil(
      fetch('/api/medicine-reminders/' + reminderId + '/dose', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status: 'taken', scheduledTime })
      }).catch(console.error)
    );

  } else if (action === 'snooze') {
    // Re-show notification after 10 minutes
    event.waitUntil(
      new Promise((resolve) => {
        setTimeout(() => {
          self.registration.showNotification(notification.title, {
            ...notification,
            body: '(Snoozed) ' + (notification.body || '')
          });
          resolve();
        }, 10 * 60 * 1000);
      })
    );

  } else {
    // Default click — open the app
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        return clients.openWindow('/medicine-reminder');
      })
    );
  }
});

// ── Listen for scheduled alarm messages from the main thread ─────────────────
// The main app posts messages here to schedule reminders via setTimeout
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SCHEDULE_REMINDER') {
    const { reminderId, medicineName, dosage, scheduledTime, delayMs } = event.data;

    setTimeout(() => {
      self.registration.showNotification('💊 Medicine Reminder — MedGuide', {
        body:    `${medicineName}${dosage ? ' · ' + dosage : ''} lene ka samay ho gaya!`,
        icon:    '/logo192.png',
        badge:   '/logo192.png',
        tag:     `reminder-${reminderId}`,
        data:    { reminderId, scheduledTime },
        actions: [
          { action: 'taken',  title: '✅ Maine le li' },
          { action: 'snooze', title: '⏰ 10 min baad' },
          { action: 'skip',   title: '❌ Skip' }
        ],
        requireInteraction: true,
        vibrate: [300, 100, 300, 100, 300]
      });
    }, delayMs);

    console.log(`[SW] Reminder scheduled: ${medicineName} in ${Math.round(delayMs / 60000)} min`);
  }
});