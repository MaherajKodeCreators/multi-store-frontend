import axios, { isAxiosError } from "axios";
import { clearSession, tokenStore } from "@/lib/auth";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api",
});

apiClient.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? tokenStore.get() : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    const isLoginCall = error.config?.url?.startsWith("/auth/login");
    if (isAxiosError(error) && error.response?.status === 401 && !isLoginCall && typeof window !== "undefined") {
      clearSession();
    }
    return Promise.reject(error);
  },
);

export function getErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (isAxiosError(error)) {
    if (!error.response) return "Cannot reach the server. Is the backend running?";
    return (error.response.data as { error?: string })?.error ?? fallback;
  }
  return fallback;
}
