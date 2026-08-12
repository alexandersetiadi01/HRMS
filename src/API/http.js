import axios from "axios";
import {
  beginGlobalLoading,
  clearGlobalDialogApiError,
  endGlobalLoading,
  hasOpenGlobalFormDialog,
  setGlobalDialogApiError,
} from "../Utils/GlobalLoading";

function getApiBase() {
  const envBase = String(import.meta.env.VITE_API_BASE || "").trim();
  if (envBase) {
    return envBase.replace(/\/+$/, "");
  }

  if (typeof window === "undefined") {
    return "http://localhost/hrms-wp/wp-json/hrms/v1";
  }

  const { protocol, hostname } = window.location;

  return `${protocol}//${hostname}/hrms-wp/wp-json/hrms/v1`;
}

function finishGlobalLoading(config) {
  if (!config?.__hrmsGlobalLoadingTracked) return;

  config.__hrmsGlobalLoadingTracked = false;
  endGlobalLoading();
}

const API_BASE = getApiBase();

const http = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("hrms_auth_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (config.globalLoading !== false) {
    if (hasOpenGlobalFormDialog()) {
      clearGlobalDialogApiError();
    }

    config.__hrmsGlobalLoadingTracked = true;
    beginGlobalLoading();
  }

  return config;
});

http.interceptors.response.use(
  (response) => {
    finishGlobalLoading(response.config);

    return response;
  },
  (error) => {
    finishGlobalLoading(error?.config);

    if (
      error?.config?.globalLoading !== false &&
      hasOpenGlobalFormDialog()
    ) {
      setGlobalDialogApiError(
        error?.response?.data?.message ||
          "操作失敗，請稍後再試。",
      );
    }

    return Promise.reject(error);
  },
);

export { API_BASE };
export default http;