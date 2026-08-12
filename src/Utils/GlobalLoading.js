const MINIMUM_LOADING_TIME = 400;

let pendingRequests = 0;
let loadingVisible = false;
let loadingStartedAt = 0;
let loadingCloseTimer = null;
let openFormDialogs = 0;
let dialogApiError = "";

const loadingListeners = new Set();
const dialogErrorListeners = new Set();

function emitLoadingChange() {
  loadingListeners.forEach((listener) => listener());
}

function emitDialogErrorChange() {
  dialogErrorListeners.forEach((listener) => listener());
}

export function beginGlobalLoading() {
  if (loadingCloseTimer) {
    clearTimeout(loadingCloseTimer);
    loadingCloseTimer = null;
  }

  pendingRequests += 1;

  if (!loadingVisible) {
    loadingVisible = true;
    loadingStartedAt = Date.now();
    emitLoadingChange();
  }
}

export function endGlobalLoading() {
  pendingRequests = Math.max(0, pendingRequests - 1);

  if (pendingRequests > 0 || !loadingVisible) {
    return;
  }

  const elapsed = Date.now() - loadingStartedAt;
  const remaining = Math.max(0, MINIMUM_LOADING_TIME - elapsed);

  loadingCloseTimer = setTimeout(() => {
    loadingCloseTimer = null;

    if (pendingRequests > 0) {
      return;
    }

    loadingVisible = false;
    emitLoadingChange();
  }, remaining);
}

export function getGlobalLoading() {
  return loadingVisible;
}

export function subscribeGlobalLoading(listener) {
  loadingListeners.add(listener);

  return () => {
    loadingListeners.delete(listener);
  };
}

export function registerGlobalFormDialog() {
  openFormDialogs += 1;
}

export function unregisterGlobalFormDialog() {
  openFormDialogs = Math.max(0, openFormDialogs - 1);

  if (openFormDialogs === 0) {
    clearGlobalDialogApiError();
  }
}

export function hasOpenGlobalFormDialog() {
  return openFormDialogs > 0;
}

export function setGlobalDialogApiError(message) {
  dialogApiError = String(message || "").trim();
  emitDialogErrorChange();
}

export function clearGlobalDialogApiError() {
  if (!dialogApiError) return;

  dialogApiError = "";
  emitDialogErrorChange();
}

export function getGlobalDialogApiError() {
  return dialogApiError;
}

export function subscribeGlobalDialogApiError(listener) {
  dialogErrorListeners.add(listener);

  return () => {
    dialogErrorListeners.delete(listener);
  };
}