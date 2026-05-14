import { api } from "./api.js";

export async function signUp({ username, email, password }) {
  const { data } = await api.post("/api/auth/signup", {
    username,
    email,
    password,
  });
  return data;
}

export async function signIn({ email, password }) {
  const { data } = await api.post("/api/auth/signin", {
    email,
    password,
  });
  return data;
}

export function getAuthErrorMessage(error) {
  const msg = error?.response?.data?.message;
  if (typeof msg === "string" && msg.trim()) return msg;
  if (error?.message) return error.message;
  return "Something went wrong. Please try again.";
}
