import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

type Theme = "dark" | "light";

export default function Home() {
  const swaggerUrl = "http://localhost:3000/api/docs";

  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("sd_theme") as Theme | null;
    return saved === "light" || saved === "dark" ? saved : "dark";
  });

  useEffect(() => {
    localStorage.setItem("sd_theme", theme);
    // ✅ CSS theme tokenlar için (index.css)
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const isDark = theme === "dark";

  const rootClass = useMemo(() => {
    return [
      "relative min-h-screen w-screen overflow-hidden",
      isDark ? "text-zinc-50" : "text-zinc-900",
    ].join(" ");
  }, [isDark]);

  return (
    <div className={rootClass}>
      {/* BACKGROUND */}
      <div className="pointer-events-none absolute inset-0">
        {isDark ? <DarkBackground /> : <LightBackground />}
        {/* vignette */}
        <div
          className={
            isDark
              ? "absolute inset-0 [background:radial-gradient(70%_60%_at_50%_18%,transparent_0%,rgba(0,0,0,0.58)_62%,rgba(0,0,0,0.84)_100%)]"
              : "absolute inset-0 [background:radial-gradient(70%_60%_at_50%_18%,transparent_0%,rgba(2,10,25,0.10)_65%,rgba(2,10,25,0.14)_100%)]"
          }
        />
      </div>

      {/* TOPBAR (FULL WIDTH, PINNED) */}
      <header className="fixed left-0 right-0 top-0 z-20">
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between px-4 py-4 sm:px-6">
          {/* LEFT: Swagger pinned */}
          <div className="flex items-center gap-3">
            <a
              href={swaggerUrl}
              target="_blank"
              rel="noreferrer"
              className={[
                "rounded-full px-4 py-2 text-xs font-extrabold tracking-wide transition",
                isDark
                  ? "border border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10"
                  : "border border-zinc-900/10 bg-white/70 text-zinc-900 hover:bg-white",
              ].join(" ")}
              title="Backend Swagger"
            >
              Swagger
            </a>
          </div>

          {/* RIGHT: Theme + Auth pinned */}
          <div className="flex items-center gap-2">
            <ThemeSwitch theme={theme} setTheme={setTheme} />

            <Link
              to="/login"
              className={[
                "rounded-full px-4 py-2 text-xs font-extrabold transition",
                isDark
                  ? "border border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10"
                  : "border border-zinc-900/10 bg-white/70 text-zinc-900 hover:bg-white",
              ].join(" ")}
            >
              Giriş Yap
            </Link>

            <Link
              to="/register"
              className={[
                "rounded-full px-4 py-2 text-xs font-extrabold transition",
                isDark
                  ? "bg-emerald-500 text-zinc-950 hover:brightness-110 shadow-[0_18px_55px_rgba(16,185,129,0.20)]"
                  : "bg-emerald-600 text-white hover:brightness-110 shadow-[0_18px_55px_rgba(16,185,129,0.16)]",
              ].join(" ")}
            >
              Kayıt Ol
            </Link>
          </div>
        </div>
      </header>

      {/* MAIN (FULL SCREEN FEEL) */}
      <main className="relative z-10 mx-auto w-full max-w-[1400px] px-4 pb-14 pt-[92px] sm:px-6">
        {/* HERO GRID: bigger + fills */}
        <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          {/* LEFT */}
          <section className="animate-inUp">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <div
                className={[
                  "grid h-11 w-11 place-items-center rounded-2xl ring-1",
                  isDark
                    ? "bg-emerald-500/15 ring-emerald-400/25 shadow-[0_0_0_1px_rgba(16,185,129,0.18)_inset,0_20px_70px_rgba(16,185,129,0.10)]"
                    : "bg-emerald-600/12 ring-emerald-700/25 shadow-[0_0_0_1px_rgba(6,182,212,0.20)_inset,0_22px_70px_rgba(6,182,212,0.12)]",
                ].join(" ")}
              >
                <span className={["text-sm font-black", isDark ? "text-emerald-200" : "text-emerald-800"].join(" ")}>
                  SD
                </span>
              </div>
              <div className="leading-tight">
                <div className="text-sm font-extrabold">SmartDiet</div>
                <div className={isDark ? "text-xs text-zinc-400" : "text-xs text-zinc-600"}>
                  Klinik & Diyet Yönetimi
                </div>
              </div>
            </div>

            {/* Chip */}
            <div
              className={[
                "mt-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold",
                isDark
                  ? "border border-emerald-400/20 bg-emerald-500/10 text-emerald-100"
                  : "border border-emerald-700/20 bg-emerald-600/10 text-emerald-900",
              ].join(" ")}
            >
              <span className={["h-2 w-2 rounded-full", isDark ? "bg-emerald-400" : "bg-emerald-600"].join(" ")} />
              Diyetisyen ve danışan için tek panel deneyimi
            </div>

            {/* Title: Bigger */}
            <h1 className="mt-5 font-black tracking-tight leading-[1.03] text-[46px] sm:text-[64px] lg:text-[78px]">
              Danışan takibini{" "}
              <span
                className={[
                  "bg-gradient-to-r bg-clip-text text-transparent",
                  isDark ? "from-emerald-300 to-teal-200" : "from-emerald-700 to-cyan-600",
                ].join(" ")}
              >
                tek ekranda
              </span>{" "}
              yönetin.
            </h1>

            <p className={["mt-4 max-w-2xl text-[15px] sm:text-[17px] leading-7", isDark ? "text-zinc-300" : "text-zinc-700"].join(" ")}>
              Plan oluşturma, tüketim işaretleme, ölçüm tarihçesi ve anlık mesajlaşma — hepsi tek bir akışta.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/register"
                className={[
                  "group relative overflow-hidden rounded-2xl px-8 py-4 text-sm font-black transition",
                  isDark
                    ? "bg-emerald-500 text-zinc-950 shadow-[0_26px_85px_rgba(16,185,129,0.22)] hover:brightness-110"
                    : "bg-emerald-600 text-white shadow-[0_26px_85px_rgba(16,185,129,0.18)] hover:brightness-110",
                ].join(" ")}
              >
                <span className="relative z-10">Hemen Başla</span>
                <span className="absolute inset-0 -translate-x-[120%] bg-white/25 transition-transform duration-700 group-hover:translate-x-[120%] [clip-path:polygon(0_0,35%_0,15%_100%,0_100%)]" />
              </Link>

              <Link
                to="/login"
                className={[
                  "rounded-2xl px-8 py-4 text-sm font-black transition",
                  isDark ? "border border-white/10 bg-white/5 hover:bg-white/10" : "border border-zinc-900/10 bg-white/70 hover:bg-white",
                ].join(" ")}
              >
                Hesabım Var
              </Link>

              <div className={["ml-1 text-xs", isDark ? "text-zinc-400" : "text-zinc-600"].join(" ")}>
                Güvenli giriş · Ölçüm tarihçesi · Sohbet
              </div>
            </div>

            {/* Feature Cards: bigger + less text */}
            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              <FeatureCard isDark={isDark} icon="🍽️" title="Planlama" text="Gün / Öğün bazlı hızlı plan." />
              <FeatureCard isDark={isDark} icon="✅" title="Takip" text="Yedim / Yemedim tek tık." />
              <FeatureCard isDark={isDark} icon="📈" title="Ölçüm" text="Kilo & ölçüm grafikleri." />
            </div>
          </section>

          {/* RIGHT: Preview */}
          <aside className="animate-inUp [animation-delay:120ms]">
            <div
              className={[
                "relative mx-auto w-full max-w-[620px] rounded-[34px] p-5 sm:p-6 backdrop-blur",
                isDark
                  ? "border border-white/10 bg-white/5 shadow-[0_55px_170px_rgba(0,0,0,0.70)]"
                  : "border border-zinc-900/10 bg-white/75 shadow-[0_55px_170px_rgba(2,10,25,0.14)]",
              ].join(" ")}
            >
              {/* internal glow */}
              <div
                className={[
                  "pointer-events-none absolute -inset-24 opacity-70 blur-[80px]",
                  isDark
                    ? "[background:radial-gradient(circle_at_25%_20%,rgba(16,185,129,0.22),transparent_55%),radial-gradient(circle_at_80%_40%,rgba(20,184,166,0.12),transparent_55%)]"
                    : "[background:radial-gradient(circle_at_25%_20%,rgba(6,182,212,0.20),transparent_55%),radial-gradient(circle_at_80%_40%,rgba(16,185,129,0.14),transparent_55%)]",
                ].join(" ")}
              />

              <div className="relative">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-extrabold">Bugün</div>
                    <div className={["text-xs", isDark ? "text-zinc-400" : "text-zinc-600"].join(" ")}>
                      Hızlı özet
                    </div>
                  </div>
                  <span
                    className={[
                      "rounded-full px-3 py-1 text-xs font-extrabold ring-1",
                      isDark ? "bg-emerald-500/15 text-emerald-100 ring-emerald-400/20" : "bg-cyan-500/10 text-cyan-900 ring-cyan-700/20",
                    ].join(" ")}
                  >
                    Canlı
                  </span>
                </div>

                <div className="mt-4 grid gap-2">
                  <MetricRow isDark={isDark} label="Aktif danışan" value="12" />
                  <MetricRow isDark={isDark} label="Günlük plan" value="34" />
                  <MetricRow isDark={isDark} label="Mesaj" value="5" />
                </div>

                <div className={["mt-4 rounded-2xl p-4", isDark ? "border border-white/10 bg-black/20" : "border border-zinc-900/10 bg-white"].join(" ")}>
                  <div className="flex items-center justify-between text-xs">
                    <span className={isDark ? "text-zinc-300" : "text-zinc-700"}>Uyum</span>
                    <span className={["font-extrabold", isDark ? "text-zinc-50" : "text-zinc-900"].join(" ")}>78%</span>
                  </div>
                  <div className={["mt-2 h-2 w-full overflow-hidden rounded-full", isDark ? "bg-white/10" : "bg-zinc-200"].join(" ")}>
                    <div className={["h-2 w-[78%] rounded-full animate-progress", isDark ? "bg-emerald-400" : "bg-cyan-600"].join(" ")} />
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <TinyStat isDark={isDark} title="İşaretlenen" value="22" />
                    <TinyStat isDark={isDark} title="Eksik" value="6" />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <MiniModule isDark={isDark} title="Ölçüm" desc="Tarihçeli takip" />
                  <MiniModule isDark={isDark} title="Sohbet" desc="Fotoğraf & görüldü" />
                </div>

                <div className={["mt-4 flex items-center justify-between rounded-2xl px-4 py-3", isDark ? "border border-white/10 bg-black/20" : "border border-zinc-900/10 bg-white"].join(" ")}>
                  <div>
                    <div className="text-xs font-extrabold">Demo Panel</div>
                    <div className={["text-[11px]", isDark ? "text-zinc-400" : "text-zinc-600"].join(" ")}>
                      Gerçek kullanımda daha fazlası
                    </div>
                  </div>
                  <Link
                    to="/login"
                    className={[
                      "rounded-xl px-3 py-2 text-xs font-black transition",
                      isDark ? "bg-white/5 hover:bg-white/10" : "bg-zinc-900/5 hover:bg-zinc-900/10",
                    ].join(" ")}
                  >
                    Panele Git →
                  </Link>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Bottom strip: fills empty space but not messy */}
        <section className="mt-10 animate-inUp [animation-delay:180ms]">
          <div className="grid gap-3 md:grid-cols-3">
            <BigStrip isDark={isDark} title="Diyetisyen için hız" text="Klinik süreçlerini tek panelde yönet." />
            <BigStrip isDark={isDark} title="Danışan için düzen" text="Takip + ölçüm + hatırlatma akışı." />
            <BigStrip isDark={isDark} title="İletişimde netlik" text="Anlık sohbet, fotoğraf ve görüldü." />
          </div>

          <div className={["mt-6 flex items-center justify-between text-xs", isDark ? "text-zinc-500" : "text-zinc-600"].join(" ")}>
            <span>© {new Date().getFullYear()} SmartDiet</span>
            <span className="hidden sm:inline">Responsive · Modern UI</span>
          </div>
        </section>
      </main>

      {/* Animations */}
      <style>{`
        @keyframes inUp { 0% { opacity: 0; transform: translateY(14px);} 100% { opacity: 1; transform: translateY(0);} }
        @keyframes progress { 0% { transform: translateX(-6%); filter: brightness(1);} 50% { transform: translateX(0%); filter: brightness(1.07);} 100% { transform: translateX(-6%); filter: brightness(1);} }
        @keyframes floatSlow { 0% { transform: translate(0,0) scale(1);} 50% { transform: translate(18px, 14px) scale(1.03);} 100% { transform: translate(0,0) scale(1);} }
        @keyframes floatSlow2 { 0% { transform: translate(0,0) scale(1);} 50% { transform: translate(-16px, -10px) scale(1.03);} 100% { transform: translate(0,0) scale(1);} }
        @keyframes themeWipe { 0% { clip-path: circle(0% at 92% 10%); opacity: 0.22; } 100% { clip-path: circle(140% at 92% 10%); opacity: 0; } }

        .animate-inUp { animation: inUp 520ms ease-out both; }
        .animate-progress { animation: progress 2.8s ease-in-out infinite; }
        .animate-floatSlow { animation: floatSlow 11s ease-in-out infinite; }
        .animate-floatSlow2 { animation: floatSlow2 13s ease-in-out infinite; }
        .theme-wipe { animation: themeWipe 520ms ease-out both; }
      `}</style>
    </div>
  );
}

/* ---------------- Backgrounds ---------------- */

function DarkBackground() {
  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0 opacity-[0.90] [background:radial-gradient(1200px_720px_at_72%_-10%,rgba(16,185,129,0.22),transparent_55%),radial-gradient(980px_640px_at_10%_105%,rgba(20,184,166,0.14),transparent_58%),linear-gradient(180deg,#050608,#07090b_45%,#050608)]" />
      <div className="absolute inset-0 opacity-[0.10] [background-image:radial-gradient(rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:18px_18px]" />
      <div className="absolute -top-56 -left-56 h-[760px] w-[760px] rounded-full bg-emerald-500/16 blur-[130px] animate-floatSlow" />
      <div className="absolute -bottom-72 -right-72 h-[860px] w-[860px] rounded-full bg-teal-400/12 blur-[150px] animate-floatSlow2" />
    </div>
  );
}

function LightBackground() {
  return (
    <div className="absolute inset-0">
      {/* clinic-glass + aqua vibe, not plain white */}
      <div className="absolute inset-0 opacity-[0.96] [background:radial-gradient(900px_620px_at_22%_10%,rgba(6,182,212,0.22),transparent_60%),radial-gradient(900px_620px_at_86%_14%,rgba(22,163,74,0.16),transparent_60%),radial-gradient(1100px_760px_at_50%_100%,rgba(37,99,235,0.10),transparent_62%),linear-gradient(180deg,#f7fcff,#f0f7ff_55%,#f6fbff)]" />
      <div className="absolute inset-0 opacity-[0.18] [background-image:radial-gradient(rgba(2,6,23,0.10)_1px,transparent_1px)] [background-size:20px_20px]" />
      <div className="absolute -top-56 -left-56 h-[760px] w-[760px] rounded-full bg-cyan-500/14 blur-[125px] animate-floatSlow" />
      <div className="absolute -bottom-72 -right-72 h-[860px] w-[860px] rounded-full bg-emerald-500/12 blur-[145px] animate-floatSlow2" />
    </div>
  );
}

/* ---------------- UI Bits ---------------- */

function ThemeSwitch({ theme, setTheme }: { theme: Theme; setTheme: (t: Theme) => void }) {
  const isDark = theme === "dark";

  const onToggle = () => {
    // hızlı & akıcı wipe overlay (fps dostu)
    const el = document.createElement("div");
    el.className =
      "pointer-events-none fixed inset-0 z-[9999] theme-wipe " + (isDark ? "bg-[#f6fbff]" : "bg-[#07090b]");
    document.body.appendChild(el);

    window.setTimeout(() => {
      document.body.removeChild(el);
    }, 520);

    setTheme(isDark ? "light" : "dark");
  };

  return (
    <button
      type="button"
      onClick={onToggle}
      className={[
        "relative h-9 w-[82px] rounded-full p-1 transition",
        isDark ? "border border-white/10 bg-white/5 hover:bg-white/10" : "border border-zinc-900/10 bg-white/70 hover:bg-white",
      ].join(" ")}
      aria-label="Tema değiştir"
      title="Tema"
    >
      <div className={["absolute left-2 top-1/2 -translate-y-1/2 text-[11px]", isDark ? "opacity-85" : "opacity-40"].join(" ")}>
        🌙
      </div>
      <div className={["absolute right-2 top-1/2 -translate-y-1/2 text-[11px]", isDark ? "opacity-40" : "opacity-85"].join(" ")}>
        ☀️
      </div>

      <div
        className={[
          "h-7 w-7 rounded-full transition-transform duration-500",
          isDark ? "translate-x-0 bg-emerald-500 shadow-[0_0_0_1px_rgba(16,185,129,0.25)_inset,0_14px_40px_rgba(16,185,129,0.25)]"
                : "translate-x-[40px] bg-cyan-600 shadow-[0_0_0_1px_rgba(6,182,212,0.25)_inset,0_14px_40px_rgba(6,182,212,0.22)]",
        ].join(" ")}
      />
    </button>
  );
}

function FeatureCard({ isDark, icon, title, text }: { isDark: boolean; icon: string; title: string; text: string }) {
  return (
    <div
      className={[
        "rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1",
        isDark
          ? "border border-white/10 bg-white/5 shadow-[0_22px_65px_rgba(0,0,0,0.35)]"
          : "border border-zinc-900/10 bg-white/75 shadow-[0_22px_65px_rgba(2,10,25,0.10)]",
      ].join(" ")}
    >
      <div className="flex items-center justify-between">
        <div className="text-sm font-black">{title}</div>
        <div className="text-xl">{icon}</div>
      </div>
      <div className={["mt-2 text-sm", isDark ? "text-zinc-300" : "text-zinc-700"].join(" ")}>{text}</div>
    </div>
  );
}

function MetricRow({ isDark, label, value }: { isDark: boolean; label: string; value: string }) {
  return (
    <div
      className={[
        "flex items-center justify-between rounded-2xl px-4 py-3",
        isDark ? "border border-white/10 bg-black/20" : "border border-zinc-900/10 bg-white",
      ].join(" ")}
    >
      <span className={["text-xs font-semibold", isDark ? "text-zinc-300" : "text-zinc-700"].join(" ")}>{label}</span>
      <span className={["text-xs font-black", isDark ? "text-zinc-50" : "text-zinc-900"].join(" ")}>{value}</span>
    </div>
  );
}

function TinyStat({ isDark, title, value }: { isDark: boolean; title: string; value: string }) {
  return (
    <div className={["rounded-xl px-3 py-2", isDark ? "border border-white/10 bg-white/5" : "border border-zinc-900/10 bg-white"].join(" ")}>
      <div className={["text-[10px]", isDark ? "text-zinc-400" : "text-zinc-600"].join(" ")}>{title}</div>
      <div className="text-sm font-black">{value}</div>
    </div>
  );
}

function MiniModule({ isDark, title, desc }: { isDark: boolean; title: string; desc: string }) {
  return (
    <div
      className={[
        "rounded-2xl p-4 transition-all duration-300 hover:-translate-y-0.5",
        isDark ? "border border-white/10 bg-black/20" : "border border-zinc-900/10 bg-white",
      ].join(" ")}
    >
      <div className="text-xs font-black">{title}</div>
      <div className={["mt-1 text-[11px]", isDark ? "text-zinc-400" : "text-zinc-600"].join(" ")}>{desc}</div>
    </div>
  );
}

function BigStrip({ isDark, title, text }: { isDark: boolean; title: string; text: string }) {
  return (
    <div
      className={[
        "rounded-[26px] p-6 transition-all duration-300 hover:-translate-y-1",
        isDark
          ? "border border-white/10 bg-white/5 shadow-[0_26px_85px_rgba(0,0,0,0.35)]"
          : "border border-zinc-900/10 bg-white/75 shadow-[0_26px_85px_rgba(2,10,25,0.12)]",
      ].join(" ")}
    >
      <div className="text-sm font-black">{title}</div>
      <div className={["mt-2 text-sm", isDark ? "text-zinc-300" : "text-zinc-700"].join(" ")}>{text}</div>
    </div>
  );
}
