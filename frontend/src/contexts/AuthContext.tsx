"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User, getStoredUser, getToken, logout as apiLogout } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isOwner: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing auth on mount
    const token = getToken();
    const storedUser = getStoredUser();

    if (token && storedUser) {
      setUser(storedUser);
    }

    setIsLoading(false);
  }, []);

  const logout = () => {
    setUser(null);
    apiLogout();
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isOwner: user?.role === "owner",
    setUser,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
