const STORAGE_KEY = "hrms_location_consent";
const CONSENT_DURATION_DAYS = 30;

function getNow() {
  return Date.now();
}

function addDays(timestamp, days) {
  return timestamp + days * 24 * 60 * 60 * 1000;
}

export function getLocationConsent() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    const status = String(parsed.status || "");
    const savedAt = Number(parsed.savedAt || 0);
    const expiresAt = Number(parsed.expiresAt || 0);

    if (!status || !savedAt || !expiresAt) {
      return null;
    }

    return {
      status,
      savedAt,
      expiresAt,
      expired: getNow() > expiresAt,
    };
  } catch (error) {
    return null;
  }
}

export function shouldPromptLocationConsent() {
  const consent = getLocationConsent();

  if (!consent) {
    return true;
  }

  return consent.expired;
}

export function hasGrantedLocationConsent() {
  const consent = getLocationConsent();

  if (!consent || consent.expired) {
    return false;
  }

  return consent.status === "granted";
}

export function saveLocationConsent(status = "denied") {
  const now = getNow();

  const payload = {
    status,
    savedAt: now,
    expiresAt: addDays(now, CONSENT_DURATION_DAYS),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  return payload;
}

export function grantLocationConsent() {
  return saveLocationConsent("granted");
}

export function denyLocationConsent() {
  return saveLocationConsent("denied");
}

export function clearLocationConsent() {
  localStorage.removeItem(STORAGE_KEY);
}