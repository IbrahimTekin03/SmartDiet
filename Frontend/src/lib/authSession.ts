import { useSyncExternalStore } from "react";

const AUTH_SESSION_EVENT = "sd:auth-session-changed";
const AUTH_STORAGE_KEYS = ["access_token", "refresh_token", "sd_user"] as const;

export type AuthSessionSnapshot = {
  accessToken: string | null;
  refreshToken: string | null;
  userJson: string | null;
};

let cachedSnapshot: AuthSessionSnapshot | null = null;

function readRawSnapshot(): AuthSessionSnapshot {
  return {
    accessToken: localStorage.getItem("access_token"),
    refreshToken: localStorage.getItem("refresh_token"),
    userJson: localStorage.getItem("sd_user"),
  };
}

function readSnapshot(): AuthSessionSnapshot {
  const next = readRawSnapshot();

  if (
    cachedSnapshot &&
    cachedSnapshot.accessToken === next.accessToken &&
    cachedSnapshot.refreshToken === next.refreshToken &&
    cachedSnapshot.userJson === next.userJson
  ) {
    return cachedSnapshot;
  }

  cachedSnapshot = next;
  return next;
}

function emitAuthSessionChange() {
  window.dispatchEvent(new Event(AUTH_SESSION_EVENT));
}

function onStoreChange(callback: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (!event.key || AUTH_STORAGE_KEYS.includes(event.key as (typeof AUTH_STORAGE_KEYS)[number])) {
      callback();
    }
  };
  const handleCustom = () => callback();

  window.addEventListener("storage", handleStorage);
  window.addEventListener(AUTH_SESSION_EVENT, handleCustom);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(AUTH_SESSION_EVENT, handleCustom);
  };
}

export function useAuthSession() {
  return useSyncExternalStore(onStoreChange, readSnapshot, readSnapshot);
}

export function parseStoredUser<T>(userJson: string | null): T | null {
  if (!userJson) return null;

  try {
    return JSON.parse(userJson) as T;
  } catch {
    return null;
  }
}

export function setAuthSession(next: {
  accessToken?: string | null;
  refreshToken?: string | null;
  user?: unknown | null;
}) {
  if ("accessToken" in next) {
    if (next.accessToken) {
      localStorage.setItem("access_token", next.accessToken);
    } else {
      localStorage.removeItem("access_token");
    }
  }

  if ("refreshToken" in next) {
    if (next.refreshToken) {
      localStorage.setItem("refresh_token", next.refreshToken);
    } else {
      localStorage.removeItem("refresh_token");
    }
  }

  if ("user" in next) {
    if (next.user) {
      localStorage.setItem("sd_user", JSON.stringify(next.user));
    } else {
      localStorage.removeItem("sd_user");
    }
  }

  emitAuthSessionChange();
}

export function clearAuthSession() {
  setAuthSession({
    accessToken: null,
    refreshToken: null,
    user: null,
  });
}
