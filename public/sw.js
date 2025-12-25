
self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Zamaverse';
  const options = {
    body: data.body || 'New update available!',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: data.url || '/',
    tag: data.tag || 'zamaverse-notification',
    requireInteraction: false,
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data)
  );
});
