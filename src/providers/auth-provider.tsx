"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { AuthResponse, AuthUser, clearSession, saveSession, tokenStore, userStore } from "@/lib/auth";
import { useHydrated, useLocalStore } from "@/lib/storage";

interface AuthContextValue {
  user: AuthUser | null;
  ready: boolean;
  signingOut: boolean;
  signIn: (auth: AuthResponse) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const user = useLocalStore(userStore);
  const ready = useHydrated();

  useEffect(() => {
    // Revalidate the cached session once; the 401 interceptor clears it if the token is stale.
    if (!tokenStore.get()) return;
    apiClient
      .get<AuthUser>("/auth/me")
      .then(({ data }) => userStore.set(data))
      .catch(() => undefined);
  }, []);

  const [signingOut, setSigningOut] = useState(false);

  const signIn = useCallback(
    (auth: AuthResponse) => {
      queryClient.clear();
      saveSession(auth);
      setSigningOut(false);
    },
    [queryClient],
  );

  const signOut = useCallback(() => {
    setSigningOut(true);
    clearSession();
    queryClient.clear();
  }, [queryClient]);

  return (
    <AuthContext.Provider value={{ user, ready, signingOut, signIn, signOut }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
