import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_BASE || "http://localhost/hrms-wp/wp-json/hrms/v1";

const http = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

export default http;