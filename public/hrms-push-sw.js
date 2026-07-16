const DEFAULT_NOTIFICATION_TITLE = "SEHO HR 通知";

function parsePushPayload(event) {
  if (!event.data) {
    return {
      title: DEFAULT_NOTIFICATION_TITLE,
      body: "",
      tag: "hrms-notification",
      renotify: false,
      data: {
        url: "/",
      },
    };
  }

  try {
    return event.data.json();
  } catch {
    return {
      title: DEFAULT_NOTIFICATION_TITLE,
      body: event.data.text(),
      tag: "hrms-notification",
      renotify: false,
      data: {
        url: "/",
      },
    };
  }
}

self.addEventListener("push", (event) => {
  const payload = parsePushPayload(event);
  const tag = String(payload?.tag || "hrms-notification");

  const options = {
    body: String(payload?.body || ""),
    tag,
    renotify: Boolean(payload?.renotify && tag),
    data: {
      notification_id: Number(
        payload?.data?.notification_id || 0,
      ),
      notification_type: String(
        payload?.data?.notification_type || "",
      ),
      target_path: String(
        payload?.data?.target_path || "/",
      ),
      url: String(payload?.data?.url || "/"),
    },
  };

  event.waitUntil(
    self.registration.showNotification(
      String(payload?.title || DEFAULT_NOTIFICATION_TITLE),
      options,
    ),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const notificationUrl = String(
    event.notification?.data?.url || "/",
  );

  event.waitUntil(
    (async () => {
      const targetUrl = new URL(
        notificationUrl,
        self.location.origin,
      );

      const windowClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      for (const windowClient of windowClients) {
        const clientUrl = new URL(windowClient.url);

        if (clientUrl.origin !== targetUrl.origin) {
          continue;
        }

        if ("navigate" in windowClient) {
          await windowClient.navigate(targetUrl.href);
        }

        if ("focus" in windowClient) {
          return windowClient.focus();
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl.href);
      }

      return undefined;
    })(),
  );
});