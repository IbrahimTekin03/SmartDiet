import { useState } from "react";

type Theme = "dark" | "light";
type Lang = "tr" | "en";

export default function SettingsDrawer({
  onApply,
}: {
  onApply?: (theme: Theme, lang: Lang) => void;
}) {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(() =>
    localStorage.getItem("sd_theme") === "dark" ? "dark" : "light",
  );
  const [lang, setLang] = useState<Lang>(() =>
    localStorage.getItem("sd_lang") === "en" ? "en" : "tr",
  );

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
        className="fixed bottom-5 right-5 z-[70] rounded-full border border-white/20 bg-black/30 p-3 text-white backdrop-blur hover:bg-black/45"
        title={lang === "tr" ? "Ayarlar" : "Settings"}
        aria-label={lang === "tr" ? "Ayarlar" : "Settings"}
      >
        <span className="block text-[10px] font-bold leading-none">SET</span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-black/55 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-[#0d1114] p-5 text-white shadow-[0_30px_110px_rgba(0,0,0,0.5)]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold">{lang === "tr" ? "Ayarlar" : "Settings"}</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-white/15 px-2.5 py-1 text-xs"
              >
                {lang === "tr" ? "Kapat" : "Close"}
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="mb-2 text-xs text-zinc-300">{lang === "tr" ? "Tema" : "Theme"}</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTheme("light")}
                    className={[
                      "rounded-xl border px-3 py-2 text-sm",
                      theme === "light" ? "border-emerald-400/50 bg-emerald-500/15" : "border-white/15 bg-white/5",
                    ].join(" ")}
                  >
                    Light
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme("dark")}
                    className={[
                      "rounded-xl border px-3 py-2 text-sm",
                      theme === "dark" ? "border-emerald-400/50 bg-emerald-500/15" : "border-white/15 bg-white/5",
                    ].join(" ")}
                  >
                    Dark
                  </button>
                </div>
              </div>

              <div>
                <div className="mb-2 text-xs text-zinc-300">{lang === "tr" ? "Dil" : "Language"}</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLang("tr")}
                    className={[
                      "rounded-xl border px-3 py-2 text-sm",
                      lang === "tr" ? "border-emerald-400/50 bg-emerald-500/15" : "border-white/15 bg-white/5",
                    ].join(" ")}
                  >
                    Turkce
                  </button>
                  <button
                    type="button"
                    onClick={() => setLang("en")}
                    className={[
                      "rounded-xl border px-3 py-2 text-sm",
                      lang === "en" ? "border-emerald-400/50 bg-emerald-500/15" : "border-white/15 bg-white/5",
                    ].join(" ")}
                  >
                    English
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={applySettings}
              className="mt-5 w-full rounded-xl bg-gradient-to-r from-emerald-400 to-teal-300 px-4 py-2.5 text-sm font-bold text-zinc-950"
            >
              {lang === "tr" ? "Uygula" : "Apply"}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
