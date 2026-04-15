import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_BASE || "http://localhost/hrms-wp/wp-json/hrms/v1";

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

export default http;