import axios from "axios";
import { AUTH_TOKEN_KEY } from "../constants/authStorage.js";

const baseURL =
  import.meta.env.VITE_API_BASE_URL?.trim() || "";

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export async function fetchHealth() {
  const { data } = await api.get("/api/health");
  return data;
}

