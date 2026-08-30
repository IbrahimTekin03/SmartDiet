import { useCallback, useEffect, useState } from "react";
import { useAppSettings } from "../context/AppSettingsContext";
import type { Lang, Theme } from "../context/AppSettingsContext";
import { Settings, X, Moon, Sun, Globe, Check } from "lucide-react";

export default function SettingsDrawer() {
  const { theme, lang, applySettings, isDark } = useAppSettings();
  const [open, setOpen] = useState(false);
  const [draftTheme, setDraftTheme] = useState<Theme>(theme);
  const [draftLang, setDraftLang] = useState<Lang>(lang);

  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open]);

  const openDrawerWithCurrentSettings = useCallback(() => {
    setDraftTheme(theme);
    setDraftLang(lang);
    setOpen(true);
  }, [lang, theme]);

  useEffect(() => {
    const openDrawer = () => openDrawerWithCurrentSettings();
    window.addEventListener("sd:open-settings", openDrawer);
    return () => window.removeEventListener("sd:open-settings", openDrawer);
  }, [openDrawerWithCurrentSettings]);

  const saveSettings = () => {
    applySettings(draftTheme, draftLang);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={openDrawerWithCurrentSettings}
        title={lang === "tr" ? "Görünüm ve Dil Ayarları" : "Appearance & Language Settings"}
        aria-label={lang === "tr" ? "Ayarlar" : "Settings"}
        className={`fixed bottom-6 right-6 z-[80] flex h-12 w-12 items-center justify-center rounded-2xl border backdrop-blur-xl transition-all duration-300 hover:scale-110 active:scale-95 ${
          isDark
            ? "border-emerald-500/30 bg-slate-900/80 text-emerald-400 shadow-[0_10px_30px_rgba(0,0,0,0.6)] shadow-emerald-500/10 hover:border-emerald-400"
            : "border-slate-200/90 bg-white/90 text-emerald-700 shadow-xl shadow-slate-300/40 hover:border-emerald-300"
        }`}
      >
        <Settings className="h-5 w-5 animate-spin-slow" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-fadeInUp">
          <div
            className={`relative w-full max-w-md overflow-hidden rounded-3xl border p-6 sm:p-7 shadow-2xl backdrop-blur-2xl transition-all ${
              isDark
                ? "border-white/15 bg-slate-900/95 text-white shadow-black"
                : "border-slate-200 bg-white/95 text-slate-900 shadow-slate-400/30"
            }`}
          >
            {/* Header */}
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                    <Settings className="h-4 w-4" />
                  </div>
                  <h3 className="font-display text-lg font-black tracking-tight">
                    {draftLang === "tr" ? "Tercihler ve Görünüm" : "Preferences & Appearance"}
                  </h3>
                </div>
                <p className={`mt-1.5 text-xs leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  {draftLang === "tr" 
                    ? "Kişisel çalışma alanı deneyiminizi özelleştirin." 
                    : "Customize your personalized workspace experience."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className={`rounded-xl p-2 transition ${
                  isDark ? "text-slate-400 hover:bg-white/10 hover:text-white" : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Theme Selector */}
              <div>
                <div className="mb-3 flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-emerald-400">
                  <Moon className="h-3.5 w-3.5" />
                  {draftLang === "tr" ? "Görünüm Teması" : "Theme Mode"}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDraftTheme("green")}
                    className={`flex flex-col rounded-2xl border p-4 text-left transition-all ${
                      draftTheme === "green"
                        ? "border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500"
                        : isDark ? "border-white/10 bg-white/5 hover:border-white/20" : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Moon className="h-4 w-4 text-emerald-400" />
                        <span className="text-xs font-black">{draftLang === "tr" ? "Karanlık (Neon)" : "Dark Mode"}</span>
                      </div>
                      {draftTheme === "green" && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                    </div>
                    <p className={`mt-2 text-[11px] leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      {draftLang === "tr" ? "SaaS odaklı koyu tonlar ve neon yeşil." : "Dark sleek background with emerald neon accents."}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDraftTheme("cream")}
                    className={`flex flex-col rounded-2xl border p-4 text-left transition-all ${
                      draftTheme === "cream"
                        ? "border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500"
                        : isDark ? "border-white/10 bg-white/5 hover:border-white/20" : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4 text-amber-500" />
                        <span className="text-xs font-black">{draftLang === "tr" ? "Aydınlık (Sade)" : "Light Mode"}</span>
                      </div>
                      {draftTheme === "cream" && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                    </div>
                    <p className={`mt-2 text-[11px] leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      {draftLang === "tr" ? "Ferah, temiz ve yüksek kontrastlı görünüm." : "Clean, bright, high-contrast daylight aesthetic."}
                    </p>
                  </button>
                </div>
              </div>

              {/* Language Selector */}
              <div>
                <div className="mb-3 flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-emerald-400">
                  <Globe className="h-3.5 w-3.5" />
                  {draftLang === "tr" ? "Dil / Language" : "Language"}
                </div>
                <div className={`grid grid-cols-2 rounded-2xl border p-1.5 ${
                  isDark ? "border-white/10 bg-black/40" : "border-slate-200 bg-slate-100"
                }`}>
                  <button
                    type="button"
                    onClick={() => setDraftLang("tr")}
                    className={`rounded-xl py-2.5 text-xs font-bold transition-all ${
                      draftLang === "tr"
                        ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30"
                        : isDark ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    🇹🇷 Türkçe
                  </button>
                  <button
                    type="button"
                    onClick={() => setDraftLang("en")}
                    className={`rounded-xl py-2.5 text-xs font-bold transition-all ${
                      draftLang === "en"
                        ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30"
                        : isDark ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    🇬🇧 English
                  </button>
                </div>
              </div>
            </div>

            {/* Save Action */}
            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className={`flex-1 rounded-2xl border py-3 text-xs font-bold transition ${
                  isDark ? "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10" : "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {draftLang === "tr" ? "Vazgeç" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={saveSettings}
                className="flex-1 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 py-3 text-xs font-black text-slate-950 shadow-lg shadow-emerald-500/30 transition hover:brightness-110 active:scale-[0.98]"
              >
                {draftLang === "tr" ? "Kaydet ve Uygula" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

