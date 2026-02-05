import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { User } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth token stored in localStorage as a fallback for cookie issues
const AUTH_TOKEN_KEY = "abc_auth_token";

export function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const token = getAuthToken();
      const headers: HeadersInit = {};
      if (token) {
        headers["X-Auth-Token"] = token;
      }
      
      const res = await fetch("/api/auth/me", { 
        credentials: "include",
        headers,
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        // Store token from response if provided
        if (data.token) {
          setAuthToken(data.token);
        }
      } else {
        setAuthToken(null);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setAuthToken(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(username: string, password: string) {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
      credentials: "include",
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Login failed");
    }

    const data = await res.json();
    setUser(data.user);
    // Store auth token for fallback authentication
    if (data.token) {
      setAuthToken(data.token);
    }
  }

  async function logout() {
    const token = getAuthToken();
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
      headers: token ? { "X-Auth-Token": token } : {},
    });
    setUser(null);
    setAuthToken(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
