import axios from "axios";

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

  return config;
});

export { API_BASE };
export default http;