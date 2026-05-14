import { io } from "socket.io-client";

let socket;

function resolveSocketUrl() {
  const fromEnv = import.meta.env.VITE_API_BASE_URL?.trim();
  if (fromEnv) return fromEnv;
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "";
}

export function getSocket() {
  if (!socket) {
    socket = io(resolveSocketUrl(), {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      autoConnect: false,
      withCredentials: true,
    });
  }
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
  return s;
}
