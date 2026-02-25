/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Theme = "dark" | "light";
export type Lang = "tr" | "en";

type AppSettingsContextValue = {
  theme: Theme;
  lang: Lang;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  setLang: (lang: Lang) => void;
  applySettings: (theme: Theme, lang: Lang) => void;
};

const AppSettingsContext = createContext<AppSettingsContextValue | null>(null);

function readInitialTheme(): Theme {
  return localStorage.getItem("sd_theme") === "dark" ? "dark" : "light";
}

function readInitialLang(): Lang {
  return localStorage.getItem("sd_lang") === "en" ? "en" : "tr";
}

export function AppSettingsProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(readInitialTheme);
  const [lang, setLang] = useState<Lang>(readInitialLang);

  useEffect(() => {
    localStorage.setItem("sd_theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("sd_lang", lang);
    document.documentElement.setAttribute("lang", lang);
  }, [lang]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === "sd_theme") {
        setTheme(readInitialTheme());
      }
      if (event.key === "sd_lang") {
        setLang(readInitialLang());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const value = useMemo<AppSettingsContextValue>(
    () => ({
      theme,
      lang,
      isDark: theme === "dark",
      setTheme,
      setLang,
      applySettings: (nextTheme: Theme, nextLang: Lang) => {
        setTheme(nextTheme);
        setLang(nextLang);
      },
    }),
    [lang, theme],
  );

  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>;
}

export function useAppSettings() {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error("useAppSettings must be used within AppSettingsProvider");
  }
  return context;
}
