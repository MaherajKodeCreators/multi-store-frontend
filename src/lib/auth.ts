import { createLocalStore } from "@/lib/storage";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "CUSTOMER";
  latitude: number | null;
  longitude: number | null;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export const tokenStore = createLocalStore<string | null>("token", null);
export const userStore = createLocalStore<AuthUser | null>("user", null);

export function saveSession(auth: AuthResponse) {
  tokenStore.set(auth.token);
  userStore.set(auth.user);
}

export function clearSession() {
  tokenStore.set(null);
  userStore.set(null);
}
