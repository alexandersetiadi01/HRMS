import http from "./http";

export const HRMS_AUTH_TOKEN_KEY = "hrms_auth_token";
export const HRMS_AUTH_USER_KEY = "hrms_auth_user";

export function getStoredAuthToken() {
  return localStorage.getItem(HRMS_AUTH_TOKEN_KEY) || "";
}

export function getStoredAuthUser() {
  const raw = localStorage.getItem(HRMS_AUTH_USER_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredAuth(token, user) {
  localStorage.setItem(HRMS_AUTH_TOKEN_KEY, token);
  localStorage.setItem(HRMS_AUTH_USER_KEY, JSON.stringify(user));
}

export function clearStoredAuth() {
  localStorage.removeItem(HRMS_AUTH_TOKEN_KEY);
  localStorage.removeItem(HRMS_AUTH_USER_KEY);
}

export async function loginWithPassword(username, password) {
  const response = await http.post("/auth/login", {
    username,
    password,
  });

  const payload = response?.data?.data || {};
  const token = payload.token || "";
  const user = payload.user || null;

  if (!token || !user) {
    throw new Error("登入回應格式錯誤。");
  }

  setStoredAuth(token, user);

  return payload;
}

export async function fetchCurrentUser() {
  const response = await http.get("/auth/me");
  const user = response?.data?.data || null;

  if (!user) {
    throw new Error("無法取得目前登入者資料。");
  }

  localStorage.setItem(HRMS_AUTH_USER_KEY, JSON.stringify(user));

  return user;
}

export async function logoutFromServer() {
  try {
    await http.post("/auth/logout");
  } finally {
    clearStoredAuth();
  }
}