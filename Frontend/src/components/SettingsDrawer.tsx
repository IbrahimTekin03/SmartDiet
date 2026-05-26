import { useCallback, useEffect, useState } from "react";
import { useAppSettings } from "../context/AppSettingsContext";
import type { Lang, Theme } from "../context/AppSettingsContext";

export default function SettingsDrawer() {
  const { theme, lang, applySettings } = useAppSettings();
  const [open, setOpen] = useState(false);
  const [draftTheme, setDraftTheme] = useState<Theme>(theme);
  const [draftLang, setDraftLang] = useState<Lang>(lang);
  const isGreen = theme === "green";

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
        title={lang === "tr" ? "Ayarlar" : "Settings"}
        aria-label={lang === "tr" ? "Ayarlar" : "Settings"}
        className={[
          "fixed bottom-5 right-5 z-[90] inline-flex h-12 w-12 items-center justify-center rounded-2xl border text-white shadow-lg transition hover:-translate-y-0.5",
          isGreen
            ? "border-[#7fb897] bg-[#1f6b50] shadow-[0_16px_42px_rgba(31,107,80,0.32)]"
            : "border-[#c8b18b] bg-[#8a6a3f] shadow-[0_16px_42px_rgba(138,106,63,0.28)]",
        ].join(" ")}
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
          <circle cx="12" cy="12" r="7.2" className="stroke-current" strokeWidth="1.8" />
          <circle cx="12" cy="12" r="3.2" className="stroke-current" strokeWidth="1.8" />
          <path d="M12 2.8v2.1M12 19.1v2.1M2.8 12h2.1M19.1 12h2.1M5.5 5.5l1.5 1.5M17 17l1.5 1.5M5.5 18.5L7 17M17 7l1.5-1.5" className="stroke-current" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>

      {open ? (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/45 p-4">
          <div
            className={[
              "relative w-full max-w-md overflow-hidden rounded-2xl border p-6 shadow-[0_32px_100px_rgba(0,0,0,0.30)]",
              isGreen
                ? "border-transparent bg-[#07100d] text-zinc-50"
                : "border-[#dfd0b9] bg-[#fffaf0] text-[#342b1d]",
            ].join(" ")}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-black">{draftLang === "tr" ? "Ayarlar" : "Settings"}</h3>
                <p className={["mt-1 text-sm leading-6", isGreen ? "text-zinc-400" : "text-[#7b6d58]"].join(" ")}>
                  {draftLang === "tr" ? "Arayüz temasını ve dil tercihini güncelle." : "Update interface theme and language."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className={[
                  "rounded-md border px-3 py-1.5 text-xs font-bold transition",
                  isGreen
                    ? "border-transparent bg-white/5 text-zinc-100 hover:bg-white/10"
                    : "border-[#dfd0b9] bg-white text-[#6d5433] hover:bg-[#fbf4e8]",
                ].join(" ")}
              >
                {draftLang === "tr" ? "Kapat" : "Close"}
              </button>
            </div>

            <section className="space-y-5">
              <div>
                <div className={["mb-2 text-xs font-black uppercase", isGreen ? "text-emerald-200" : "text-[#806f57]"].join(" ")}>
                  {draftLang === "tr" ? "Tema" : "Theme"}
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <ThemeButton
                    active={draftTheme === "green"}
                    title={draftLang === "tr" ? "Yeşil" : "Green"}
                    description={draftLang === "tr" ? "Daha klinik, canlı ve operasyon odaklı." : "Clinical, fresh and operational."}
                    onClick={() => setDraftTheme("green")}
                    tone="green"
                  />
                  <ThemeButton
                    active={draftTheme === "cream"}
                    title={draftLang === "tr" ? "Krem" : "Cream"}
                    description={draftLang === "tr" ? "Daha sıcak, sakin ve okunaklı." : "Warm, calm and highly readable."}
                    onClick={() => setDraftTheme("cream")}
                    tone="cream"
                  />
                </div>
              </div>

              <div>
                <div className={["mb-2 text-xs font-black uppercase", isGreen ? "text-emerald-200" : "text-[#806f57]"].join(" ")}>
                  {draftLang === "tr" ? "Dil" : "Language"}
                </div>
                <div className={["grid grid-cols-2 rounded-lg border p-1", isGreen ? "border-transparent bg-white/5" : "border-[#dfd0b9] bg-[#f7eedf]"].join(" ")}>
                  <button
                    type="button"
                    onClick={() => setDraftLang("tr")}
                    className={languageButtonClass(draftLang === "tr", draftTheme)}
                  >
                    Türkçe
                  </button>
                  <button
                    type="button"
                    onClick={() => setDraftLang("en")}
                    className={languageButtonClass(draftLang === "en", draftTheme)}
                  >
                    EN
                  </button>
                </div>
              </div>
            </section>

            <button
              type="button"
              onClick={saveSettings}
              className={[
                "mt-6 w-full rounded-lg px-4 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5",
                draftTheme === "green" ? "bg-[#1f6b50] hover:bg-[#185840]" : "bg-[#8a6a3f] hover:bg-[#765932]",
              ].join(" ")}
            >
              {draftLang === "tr" ? "Kaydet ve Uygula" : "Save and Apply"}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

function ThemeButton({
  active,
  title,
  description,
  tone,
  onClick,
}: {
  active: boolean;
  title: string;
  description: string;
  tone: Theme;
  onClick: () => void;
}) {
  const isGreen = tone === "green";
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-lg border p-3 text-left transition hover:-translate-y-0.5",
        active
          ? isGreen
            ? "border-[#1f6b50] bg-[#e2f1e6] shadow-sm"
            : "border-[#8a6a3f] bg-[#f5ead7] shadow-sm"
          : isGreen
            ? "border-[#bfd8c5] bg-white hover:bg-[#f3faf5]"
            : "border-[#dfd0b9] bg-white hover:bg-[#fbf4e8]",
      ].join(" ")}
    >
      <div className="flex items-center gap-2">
        <span className={["h-3 w-3 rounded-full", isGreen ? "bg-[#1f6b50]" : "bg-[#b28a52]"].join(" ")} />
        <span className={["text-sm font-black", isGreen ? "text-[#12372e]" : "text-[#4f3d25]"].join(" ")}>
          {title}
        </span>
      </div>
      <p className={["mt-2 text-xs leading-5", isGreen ? "text-[#527164]" : "text-[#7b6d58]"].join(" ")}>
        {description}
      </p>
    </button>
  );
}

function languageButtonClass(active: boolean, theme: Theme) {
  const isGreen = theme === "green";
  return [
    "rounded-md px-3 py-2 text-xs font-black transition",
    active
      ? isGreen
        ? "bg-[#1f6b50] text-white shadow-sm"
        : "bg-[#8a6a3f] text-white shadow-sm"
      : isGreen
        ? "text-zinc-300 hover:bg-white/10"
        : "text-[#756449] hover:bg-white",
  ].join(" ");
}
