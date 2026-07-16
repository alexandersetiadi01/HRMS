const HRMS_PUSH_SERVICE_WORKER_PATH = "/hrms-push-sw.js";
const HRMS_PUSH_SERVICE_WORKER_SCOPE = "/";

export function getBrowserPushSupport() {
  if (typeof window === "undefined") {
    return {
      supported: false,
      reason: "browser_unavailable",
    };
  }

  if (!window.isSecureContext) {
    return {
      supported: false,
      reason: "secure_context_required",
    };
  }

  if (!("serviceWorker" in navigator)) {
    return {
      supported: false,
      reason: "service_worker_unsupported",
    };
  }

  if (!("PushManager" in window)) {
    return {
      supported: false,
      reason: "push_manager_unsupported",
    };
  }

  if (!("Notification" in window)) {
    return {
      supported: false,
      reason: "notification_unsupported",
    };
  }

  return {
    supported: true,
    reason: "supported",
  };
}

export function getBrowserNotificationPermission() {
  if (!("Notification" in window)) {
    return "unsupported";
  }

  return window.Notification.permission;
}

export async function requestBrowserNotificationPermission() {
  const support = getBrowserPushSupport();

  if (!support.supported) {
    return "unsupported";
  }

  return window.Notification.requestPermission();
}

export async function registerHrmsPushServiceWorker() {
  const support = getBrowserPushSupport();

  if (!support.supported) {
    throw new Error(support.reason);
  }

  await navigator.serviceWorker.register(
    HRMS_PUSH_SERVICE_WORKER_PATH,
    {
      scope: HRMS_PUSH_SERVICE_WORKER_SCOPE,
      updateViaCache: "none",
    },
  );

  return navigator.serviceWorker.ready;
}

export function vapidPublicKeyToUint8Array(publicKey) {
  const normalizedKey = String(publicKey || "").trim();

  if (!normalizedKey) {
    throw new Error("vapid_public_key_missing");
  }

  const padding = "=".repeat(
    (4 - (normalizedKey.length % 4)) % 4,
  );

  const base64 = `${normalizedKey}${padding}`
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);

  return Uint8Array.from(
    rawData,
    (character) => character.charCodeAt(0),
  );
}

export async function getExistingBrowserPushSubscription() {
  const support = getBrowserPushSupport();

  if (!support.supported) {
    return null;
  }

  const registration = await navigator.serviceWorker.getRegistration(
    HRMS_PUSH_SERVICE_WORKER_SCOPE,
  );

  if (!registration) {
    return null;
  }

  return registration.pushManager.getSubscription();
}

export async function subscribeBrowserToPush(vapidPublicKey) {
  const support = getBrowserPushSupport();

  if (!support.supported) {
    throw new Error(support.reason);
  }

  if (window.Notification.permission !== "granted") {
    throw new Error("notification_permission_not_granted");
  }

  const registration = await registerHrmsPushServiceWorker();

  const existingSubscription = (
    await registration.pushManager.getSubscription()
  );

  if (existingSubscription) {
    return existingSubscription;
  }

  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: vapidPublicKeyToUint8Array(
      vapidPublicKey,
    ),
  });
}

export function getBrowserPushContentEncoding() {
  const encodings = Array.isArray(
    window.PushManager?.supportedContentEncodings,
  )
    ? window.PushManager.supportedContentEncodings
    : [];

  if (encodings.includes("aes128gcm")) {
    return "aes128gcm";
  }

  return encodings[0] || "aes128gcm";
}

export function serializeBrowserPushSubscription(subscription) {
  if (!subscription) {
    throw new Error("push_subscription_missing");
  }

  const serialized = subscription.toJSON();

  return {
    endpoint: serialized.endpoint,
    expiration_time: serialized.expirationTime ?? null,
    keys: {
      p256dh: serialized.keys?.p256dh || "",
      auth: serialized.keys?.auth || "",
    },
    content_encoding: getBrowserPushContentEncoding(),
  };
}

export async function unsubscribeBrowserFromPush() {
  const subscription = await (
    getExistingBrowserPushSubscription()
  );

  if (!subscription) {
    return {
      endpoint: "",
      unsubscribed: false,
    };
  }

  const endpoint = subscription.endpoint;
  const unsubscribed = await subscription.unsubscribe();

  return {
    endpoint,
    unsubscribed,
  };
}