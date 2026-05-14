import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from "../constants/authStorage.js";
import {
  signIn as signInRequest,
  signUp as signUpRequest,
} from "../services/authService.js";

const AuthContext = createContext(null);

function readStoredUser() {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function readStoredToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const storedToken = readStoredToken();
    const storedUser = readStoredUser();
    if (storedToken && storedUser?.id) {
      setToken(storedToken);
      setUser(storedUser);
    }
    setReady(true);
  }, []);

  const persistSession = useCallback((nextToken, nextUser) => {
    window.localStorage.setItem(AUTH_TOKEN_KEY, nextToken);
    window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const clearSession = useCallback(() => {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    window.localStorage.removeItem(AUTH_USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const login = useCallback(
    async ({ email, password }) => {
      const data = await signInRequest({ email, password });
      if (!data?.token || !data?.user) {
        throw new Error("Unexpected response from server");
      }
      persistSession(data.token, data.user);
      return data;
    },
    [persistSession]
  );

  const register = useCallback(
    async ({ username, email, password }) => {
      const data = await signUpRequest({ username, email, password });
      if (!data?.token || !data?.user) {
        throw new Error("Unexpected response from server");
      }
      persistSession(data.token, data.user);
      return data;
    },
    [persistSession]
  );

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const value = useMemo(
    () => ({
      user,
      token,
      ready,
      isAuthenticated: Boolean(token && user),
      login,
      register,
      logout,
    }),
    [user, token, ready, login, register, logout]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
