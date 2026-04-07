import {
  DEFAULT_MOBILE_DRAWER_SHORTCUT_IDS,
  getMobileDrawerCandidates,
} from "./MenuRegistry";

export const MOBILE_DRAWER_SHORTCUT_STORAGE_KEY =
  "hrms.mobileDrawerShortcutIds";

export function loadMobileDrawerShortcutIds() {
  try {
    const raw = localStorage.getItem(MOBILE_DRAWER_SHORTCUT_STORAGE_KEY);

    if (!raw) return DEFAULT_MOBILE_DRAWER_SHORTCUT_IDS;

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) return DEFAULT_MOBILE_DRAWER_SHORTCUT_IDS;

    const validIds = new Set(getMobileDrawerCandidates().map((item) => item.id));

    const filtered = parsed.filter((id) => validIds.has(id));

    return filtered.length > 0
      ? filtered
      : DEFAULT_MOBILE_DRAWER_SHORTCUT_IDS;
  } catch (error) {
    return DEFAULT_MOBILE_DRAWER_SHORTCUT_IDS;
  }
}

export function saveMobileDrawerShortcutIds(ids) {
  localStorage.setItem(MOBILE_DRAWER_SHORTCUT_STORAGE_KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event("hrms-mobile-drawer-shortcuts-updated"));
}