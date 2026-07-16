// Service Worker pour les notifications push natives d'UrsUle
self.addEventListener('push', function(event) {
  if (!event.data) {
    console.log('Push event received with no data');
    return;
  }

  try {
    const payload = event.data.json();
    const title = payload.title || 'UrsUle 📅';
    const options = {
      body: payload.body || 'Nouveau rappel de productivité !',
      icon: payload.icon || '/icon-192.svg',
      badge: payload.badge || '/badge-72.svg',
      vibrate: payload.vibrate || [200, 100, 200],
      sound: payload.sound || '/sounds/notification.mp3', // supporté par certains navigateurs mobiles
      data: {
        url: payload.url || '/'
      }
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (e) {
    console.error('Error parsing push event data:', e);
    // En cas d'erreur de parsing JSON, afficher le texte brut
    const text = event.data.text();
    event.waitUntil(
      self.registration.showNotification('UrsUle 📅', {
        body: text,
        icon: '/icon-192.png',
        badge: '/badge-72.png'
      })
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  // URL cible lors du clic
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Chercher si un onglet est déjà ouvert sur l'application
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(location.origin) && 'focus' in client) {
          return client.navigate(targetUrl).then(c => c.focus());
        }
      }
      // Sinon, ouvrir un nouvel onglet
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Écouter les messages émis par le client pour forcer l'activation d'une nouvelle version (SKIP_WAITING)
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('⚡ [Service Worker] SKIP_WAITING reçu, activation immédiate de la nouvelle version...');
    self.skipWaiting();
  }
});

self.addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim());
});
