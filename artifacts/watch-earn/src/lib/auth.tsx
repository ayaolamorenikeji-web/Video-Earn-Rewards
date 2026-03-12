import React, { createContext, useContext, useState, useEffect } from "react";
import { AuthResponse } from "@workspace/api-client-react";

export type AuthSession = AuthResponse;

interface AuthContextType {
  session: AuthSession | null;
  setSession: (session: AuthSession | null) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("wve_session");
      if (stored) {
        setSessionState(JSON.parse(stored));
      }
    } catch (err) {
      console.error("Failed to restore session", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setSession = (newSession: AuthSession | null) => {
    setSessionState(newSession);
    if (newSession) {
      localStorage.setItem("wve_session", JSON.stringify(newSession));
    } else {
      localStorage.removeItem("wve_session");
    }
  };

  const logout = () => {
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ session, setSession, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
