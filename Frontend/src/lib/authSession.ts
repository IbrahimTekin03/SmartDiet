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
  const sessionToken = sessionStorage.getItem("access_token");
  const localToken = localStorage.getItem("access_token");

  return {
    accessToken: sessionToken || localToken,
    refreshToken: sessionStorage.getItem("refresh_token") || localStorage.getItem("refresh_token"),
    userJson: sessionStorage.getItem("sd_user") || localStorage.getItem("sd_user"),
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
  user?: any | null;
  isDemo?: boolean;
}) {
  const isDemo = next.isDemo || (next.user?.email && String(next.user.email).toLowerCase().startsWith("demo."));

  if ("accessToken" in next) {
    if (next.accessToken) {
      if (isDemo) {
        sessionStorage.setItem("access_token", next.accessToken);
        localStorage.removeItem("access_token");
      } else {
        localStorage.setItem("access_token", next.accessToken);
        sessionStorage.removeItem("access_token");
      }
    } else {
      localStorage.removeItem("access_token");
      sessionStorage.removeItem("access_token");
    }
  }

  if ("refreshToken" in next) {
    if (next.refreshToken) {
      if (isDemo) {
        sessionStorage.setItem("refresh_token", next.refreshToken);
        localStorage.removeItem("refresh_token");
      } else {
        localStorage.setItem("refresh_token", next.refreshToken);
        sessionStorage.removeItem("refresh_token");
      }
    } else {
      localStorage.removeItem("refresh_token");
      sessionStorage.removeItem("refresh_token");
    }
  }

  if ("user" in next) {
    if (next.user) {
      const userStr = JSON.stringify(next.user);
      if (isDemo) {
        sessionStorage.setItem("sd_user", userStr);
        localStorage.removeItem("sd_user");
      } else {
        localStorage.setItem("sd_user", userStr);
        sessionStorage.removeItem("sd_user");
      }
    } else {
      localStorage.removeItem("sd_user");
      sessionStorage.removeItem("sd_user");
    }
  }

  emitAuthSessionChange();
}

export function clearAuthSession() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("sd_user");
  sessionStorage.removeItem("access_token");
  sessionStorage.removeItem("refresh_token");
  sessionStorage.removeItem("sd_user");
  emitAuthSessionChange();
}
