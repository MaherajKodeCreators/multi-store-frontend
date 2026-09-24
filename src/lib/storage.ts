"use client";

import { useSyncExternalStore } from "react";

export interface LocalStore<T> {
  get: () => T;
  getServer: () => T;
  set: (value: T | null) => void;
  subscribe: (listener: () => void) => () => void;
}

const storeCache = new Map<string, LocalStore<unknown>>();

// Same as createLocalStore, but returns the same instance for a given key across calls — for stores
// whose key is only known at render time (e.g. scoped to the current user id).
export function getLocalStore<T>(key: string, fallback: T): LocalStore<T> {
  const cached = storeCache.get(key);
  if (cached) return cached as LocalStore<T>;
  const store = createLocalStore(key, fallback);
  storeCache.set(key, store as LocalStore<unknown>);
  return store;
}

// localStorage-backed store for useSyncExternalStore; caches the parsed value so snapshots stay referentially stable.
export function createLocalStore<T>(key: string, fallback: T): LocalStore<T> {
  let cachedRaw: string | null | undefined;
  let cached = fallback;
  const listeners = new Set<() => void>();

  const get = () => {
    const raw = localStorage.getItem(key);
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      try {
        cached = raw ? (JSON.parse(raw) as T) : fallback;
      } catch {
        cached = fallback;
      }
    }
    return cached;
  };

  return {
    get,
    getServer: () => fallback,
    set: (value) => {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, JSON.stringify(value));
      listeners.forEach((l) => l());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      const onStorage = (e: StorageEvent) => e.key === key && listener();
      window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(listener);
        window.removeEventListener("storage", onStorage);
      };
    },
  };
}

export function useLocalStore<T>(store: LocalStore<T>): T {
  return useSyncExternalStore(store.subscribe, store.get, store.getServer);
}

const noopSubscribe = () => () => {};

export function useHydrated(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}
