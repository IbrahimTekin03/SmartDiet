import { useEffect, useState } from "react";

type Theme = "dark" | "light";
type Lang = "tr" | "en";

export default function SettingsDrawer({
  onApply,
}: {
  onApply?: (theme: Theme, lang: Lang) => void;
}) {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem("sd_theme") === "dark" ? "dark" : "light"));
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem("sd_lang") === "en" ? "en" : "tr"));

  const isDark = theme === "dark";

  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open]);

  useEffect(() => {
    const openDrawer = () => setOpen(true);
    window.addEventListener("sd:open-settings", openDrawer);
    return () => window.removeEventListener("sd:open-settings", openDrawer);
  }, []);

  const applySettings = () => {
    localStorage.setItem("sd_theme", theme);
    localStorage.setItem("sd_lang", lang);
    document.documentElement.setAttribute("data-theme", theme);

    if (onApply) {
      onApply(theme, lang);
    } else {
      window.location.reload();
    }
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={lang === "tr" ? "Ayarlar" : "Settings"}
        aria-label={lang === "tr" ? "Ayarlar" : "Settings"}
        className="fixed bottom-5 right-5 z-[90] inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-300/30 bg-gradient-to-r from-emerald-400 to-teal-300 text-zinc-950 shadow-[0_16px_50px_rgba(16,185,129,0.45)] transition hover:brightness-110"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
          <circle cx="12" cy="12" r="7.2" className="stroke-zinc-900" strokeWidth="1.8" />
          <circle cx="12" cy="12" r="3.2" className="stroke-zinc-900" strokeWidth="1.8" />
          <path d="M12 2.8v2.1M12 19.1v2.1M2.8 12h2.1M19.1 12h2.1M5.5 5.5l1.5 1.5M17 17l1.5 1.5M5.5 18.5L7 17M17 7l1.5-1.5" className="stroke-zinc-900" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>

      {open ? (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/55 p-4 backdrop-blur-[2px]">
          <div
            className={[
              "relative w-full max-w-md overflow-hidden rounded-3xl border p-6 shadow-[0_32px_120px_rgba(0,0,0,0.45)]",
              isDark
                ? "border-white/15 bg-[#0d1114] text-white"
                : "border-[#2f6154]/20 bg-[#f7fbf9] text-[#123a32]",
            ].join(" ")}
          >
            <div className="pointer-events-none absolute inset-0">
              <div className={isDark ? "absolute -left-20 -top-24 h-52 w-52 rounded-full bg-emerald-400/16 blur-3xl" : "absolute -left-20 -top-24 h-52 w-52 rounded-full bg-emerald-500/14 blur-3xl"} />
              <div className={isDark ? "absolute -right-24 -bottom-24 h-56 w-56 rounded-full bg-teal-300/14 blur-3xl" : "absolute -right-24 -bottom-24 h-56 w-56 rounded-full bg-teal-400/12 blur-3xl"} />
              <div className={isDark ? "absolute left-6 right-6 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/70 to-transparent" : "absolute left-6 right-6 top-0 h-px bg-gradient-to-r from-transparent via-emerald-700/45 to-transparent"} />
            </div>

            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold">{lang === "tr" ? "Ayarlar" : "Settings"}</h3>
                <p className={["mt-1 text-xs", isDark ? "text-zinc-400" : "text-[#4d6b62]"].join(" ")}>
                  {lang === "tr" ? "Tema ve dil tercihlerini guncelle." : "Update your theme and language preferences."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className={[
                  "rounded-xl border px-3 py-1.5 text-xs font-semibold",
                  isDark ? "border-white/15 bg-white/5 text-zinc-200" : "border-[#2f6154]/20 bg-white text-[#2b574b]",
                ].join(" ")}
              >
                {lang === "tr" ? "Kapat" : "Close"}
              </button>
            </div>

            <section className="space-y-4">
              <div>
                <div className={["mb-2 text-xs font-bold", isDark ? "text-zinc-300" : "text-[#4d6b62]"].join(" ")}>
                  {lang === "tr" ? "Tema" : "Theme"}
                </div>
                <div
                  className={[
                    "inline-flex h-10 w-full items-center rounded-full p-1 shadow-[0_0_0_1px_rgba(16,185,129,0.18)_inset,0_0_24px_rgba(16,185,129,0.12)]",
                    isDark ? "border border-white/15 bg-white/5" : "border border-[#2f6154]/20 bg-white",
                  ].join(" ")}
                >
                  <button
                    type="button"
                    onClick={() => setTheme("light")}
                    className={[
                      "h-8 flex-1 rounded-full text-xs font-black transition",
                      theme === "light"
                        ? isDark
                          ? "bg-emerald-500/20 text-emerald-100 shadow-[0_0_18px_rgba(16,185,129,0.35)]"
                          : "bg-[#dbece4] text-[#0f2f29]"
                        : isDark
                          ? "text-zinc-300 hover:bg-white/10"
                          : "text-[#3e6057] hover:bg-[#eef5f1]",
                    ].join(" ")}
                  >
                    {lang === "tr" ? "Acik" : "Light"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme("dark")}
                    className={[
                      "h-8 flex-1 rounded-full text-xs font-black transition",
                      theme === "dark"
                        ? isDark
                          ? "bg-emerald-500/20 text-emerald-100 shadow-[0_0_18px_rgba(16,185,129,0.35)]"
                          : "bg-[#dbece4] text-[#0f2f29]"
                        : isDark
                          ? "text-zinc-300 hover:bg-white/10"
                          : "text-[#3e6057] hover:bg-[#eef5f1]",
                    ].join(" ")}
                  >
                    {lang === "tr" ? "Koyu" : "Dark"}
                  </button>
                </div>
              </div>

              <div>
                <div className={["mb-2 text-xs font-bold", isDark ? "text-zinc-300" : "text-[#4d6b62]"].join(" ")}>
                  {lang === "tr" ? "Dil" : "Language"}
                </div>
                <div
                  className={[
                    "inline-flex h-10 w-full items-center rounded-full p-1 shadow-[0_0_0_1px_rgba(16,185,129,0.18)_inset,0_0_24px_rgba(16,185,129,0.12)]",
                    isDark ? "border border-white/15 bg-white/5" : "border border-[#2f6154]/20 bg-white",
                  ].join(" ")}
                >
                  <button
                    type="button"
                    onClick={() => setLang("tr")}
                    className={[
                      "h-8 flex-1 rounded-full text-xs font-black transition",
                      lang === "tr"
                        ? isDark
                          ? "bg-emerald-500/20 text-emerald-100 shadow-[0_0_18px_rgba(16,185,129,0.35)]"
                          : "bg-[#dbece4] text-[#0f2f29]"
                        : isDark
                          ? "text-zinc-300 hover:bg-white/10"
                          : "text-[#3e6057] hover:bg-[#eef5f1]",
                    ].join(" ")}
                  >
                    Turkce
                  </button>
                  <button
                    type="button"
                    onClick={() => setLang("en")}
                    className={[
                      "h-8 flex-1 rounded-full text-xs font-black transition",
                      lang === "en"
                        ? isDark
                          ? "bg-emerald-500/20 text-emerald-100 shadow-[0_0_18px_rgba(16,185,129,0.35)]"
                          : "bg-[#dbece4] text-[#0f2f29]"
                        : isDark
                          ? "text-zinc-300 hover:bg-white/10"
                          : "text-[#3e6057] hover:bg-[#eef5f1]",
                    ].join(" ")}
                  >
                    EN
                  </button>
                </div>
              </div>
            </section>

            <button
              type="button"
              onClick={applySettings}
              className="mt-6 w-full rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-300 px-4 py-3 text-sm font-extrabold text-zinc-950 shadow-[0_14px_40px_rgba(16,185,129,0.35)] transition hover:brightness-110"
            >
              {lang === "tr" ? "Kaydet ve Uygula" : "Save and Apply"}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
