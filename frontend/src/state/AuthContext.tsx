import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type AuthUser = {
  id: string;
  username: string;
  email: string;
  createdAt?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  register: (username: string, email: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "battle-ship-auth";
/* URL del backend según entorno: VITE_API_URL o localhost en dev, producción en prod */
const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? "https://battle-ship-online.onrender.com" : "http://localhost:4000");

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { user: AuthUser; token: string };
      if (parsed?.token && parsed?.user) {
        setToken(parsed.token);
        setUser(parsed.user);
      }
    } catch {
      // ignore corrupted storage
    }
  }, []);

  useEffect(() => {
    if (user && token) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, token }));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [user, token]);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { ok: false, message: data.message || "Failed to login" };
      }
      const data = (await res.json()) as { token: string; user: AuthUser };
      setToken(data.token);
      setUser(data.user);
      return { ok: true };
    } catch {
      return { ok: false, message: "Network error while logging in" };
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, email, password })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { ok: false, message: data.message || "Failed to register" };
      }
      // Registration is separate from login; user still needs to log in
      return { ok: true };
    } catch {
      return { ok: false, message: "Network error while registering" };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  const value: AuthContextValue = useMemo(
    () => ({
      user,
      token,
      login,
      register,
      logout
    }),
    [user, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

