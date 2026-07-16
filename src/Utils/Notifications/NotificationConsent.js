const NOTIFICATION_CONSENT_STORAGE_PREFIX = (
  "hrms_notification_consent"
);

const ALLOWED_CONSENT_STATUSES = ["granted", "denied"];

function normalizeEmployeeId(employeeId) {
  const normalized = Number(employeeId || 0);

  return Number.isInteger(normalized) && normalized > 0
    ? normalized
    : 0;
}

export function getNotificationConsentStorageKey(employeeId) {
  const normalizedEmployeeId = normalizeEmployeeId(employeeId);

  if (!normalizedEmployeeId) {
    return "";
  }

  return `${NOTIFICATION_CONSENT_STORAGE_PREFIX}:${normalizedEmployeeId}`;
}

export function getStoredNotificationConsent(employeeId) {
  const storageKey = getNotificationConsentStorageKey(employeeId);

  if (!storageKey) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(storageKey);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    const status = String(parsed?.status || "");
    const savedAt = Number(parsed?.saved_at || 0);

    if (
      !ALLOWED_CONSENT_STATUSES.includes(status)
      || !savedAt
    ) {
      return null;
    }

    return {
      status,
      saved_at: savedAt,
    };
  } catch {
    return null;
  }
}

export function saveNotificationConsent(employeeId, status) {
  const storageKey = getNotificationConsentStorageKey(employeeId);
  const normalizedStatus = String(status || "");

  if (!storageKey) {
    throw new Error("notification_consent_employee_missing");
  }

  if (!ALLOWED_CONSENT_STATUSES.includes(normalizedStatus)) {
    throw new Error("notification_consent_status_invalid");
  }

  const consent = {
    status: normalizedStatus,
    saved_at: Date.now(),
  };

  window.localStorage.setItem(
    storageKey,
    JSON.stringify(consent),
  );

  return consent;
}

export function clearNotificationConsent(employeeId) {
  const storageKey = getNotificationConsentStorageKey(employeeId);

  if (storageKey) {
    window.localStorage.removeItem(storageKey);
  }
}