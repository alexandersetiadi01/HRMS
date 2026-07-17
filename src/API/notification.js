import http from "./http";

function unwrapResponseData(response) {
  return response?.data?.data ?? response?.data ?? null;
}

export async function fetchNotifications(params = {}) {
  const response = await http.get("/notifications", {
    params,
  });

  return unwrapResponseData(response);
}

export async function fetchNotificationSummary() {
  const response = await http.get("/notifications/summary");

  return unwrapResponseData(response);
}

export async function fetchUnreadNotificationSources() {
  const response = await http.get(
    "/notifications/unread-sources",
  );

  return unwrapResponseData(response);
}

export async function markNotificationRead(notificationId) {
  const response = await http.post(
    `/notifications/${notificationId}/read`,
  );

  return unwrapResponseData(response);
}

export async function markNotificationTypesRead(
  notificationTypes,
) {
  const response = await http.post(
    "/notifications/read-by-types",
    {
      notification_types: notificationTypes,
    },
  );

  return unwrapResponseData(response);
}

export async function markNotificationSourceRead(
  sourceType,
  sourceId,
) {
  const response = await http.post(
    "/notifications/read-by-source",
    {
      source_type: sourceType,
      source_id: sourceId,
    },
  );

  return unwrapResponseData(response);
}

export async function dismissNotification(notificationId) {
  const response = await http.delete(
    `/notifications/${notificationId}`,
  );

  return unwrapResponseData(response);
}

export async function fetchNotificationPreferences() {
  const response = await http.get("/notifications/preferences");

  return unwrapResponseData(response);
}

export async function updateNotificationPreferences(preferences) {
  const response = await http.put(
    "/notifications/preferences",
    preferences,
  );

  return unwrapResponseData(response);
}

export async function savePushSubscription(subscription) {
  const response = await http.post(
    "/notifications/push-subscription",
    subscription,
  );

  return unwrapResponseData(response);
}

export async function deletePushSubscription(endpoint) {
  const response = await http.delete(
    "/notifications/push-subscription",
    {
      data: {
        endpoint,
      },
    },
  );

  return unwrapResponseData(response);
}