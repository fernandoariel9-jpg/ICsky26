// public/sw.js
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};

  const title = data.title || "Nueva tarea asignada";
  const options = {
    body: data.body || "Tienes una nueva tarea pendiente",
    icon: data.icon || "/icon-192x192.png",
    badge: data.badge || "/icon-192x192.png",
    data: data.url || "/",
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Permitir abrir la app al hacer clic en la notificación
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data));
});
