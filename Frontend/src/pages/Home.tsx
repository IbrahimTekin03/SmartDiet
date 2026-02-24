import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

type Theme = "dark" | "light";
type Lang = "tr" | "en";
type SessionUser = {
  id?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  display_name?: string;
  email?: string;
  phone_number?: string;
};

type HomeCopy = {
  brandSub: string;
  signIn: string;
  signUp: string;
  welcome: string;
  profile: string;
  logout: string;
  chip: string;
  titleA: string;
  titleB: string;
  titleC: string;
  subtitle: string;
  ctaStart: string;
  ctaAccount: string;
  trust: string;
  stat1: string;
  stat2: string;
  stat3: string;
  stat4: string;
  today: string;
  quick: string;
  live: string;
  activeClients: string;
  dailyPlans: string;
  messages: string;
  adherence: string;
  marked: string;
  missing: string;
  measurement: string;
  chat: string;
  historyTracking: string;
  photoSeen: string;
  demoPanel: string;
  demoSub: string;
  goPanel: string;
  featureA: string;
  featureAText: string;
  featureB: string;
  featureBText: string;
  featureC: string;
  featureCText: string;
  responsiveTag: string;
};

const COPY: Record<Lang, HomeCopy> = {
  tr: {
    brandSub: "Klinik ve Diyet Yönetimi",
    signIn: "Giriş Yap",
    signUp: "Kayıt Ol",
    welcome: "Hoşgeldin",
    profile: "Profil",
    logout: "Çıkış Yap",
    chip: "Diyetisyen ve danışan için tek panel deneyimi",
    titleA: "Danışan takibini",
    titleB: "tek ekranda",
    titleC: "yönetin.",
    subtitle:
      "Plan oluşturma, tüketim işaretleme, ölçüm geçmişi ve anlık mesajlaşma aynı akış içinde.",
    ctaStart: "Hemen Başla",
    ctaAccount: "Hesabım Var",
    trust: "Güvenli giriş · Ölçüm geçmişi · Sohbet",
    stat1: "aktif danışan",
    stat2: "günlük plan",
    stat3: "uyum oranı",
    stat4: "iletişim akışı",
    today: "Bugün",
    quick: "Hızlı özet",
    live: "Canlı",
    activeClients: "Aktif danışan",
    dailyPlans: "Günlük plan",
    messages: "Mesaj",
    adherence: "Uyum",
    marked: "İşaretlenen",
    missing: "Eksik",
    measurement: "Ölçüm",
    chat: "Sohbet",
    historyTracking: "Tarihçeli takip",
    photoSeen: "Fotoğraf ve görüldü",
    demoPanel: "Demo Panel",
    demoSub: "Gerçek kullanımda daha fazlası",
    goPanel: "Panele Git",
    featureA: "Planlama",
    featureAText: "Gün ve öğün bazlı hızlı plan.",
    featureB: "Takip",
    featureBText: "Yedim veya yemedim tek tık.",
    featureC: "Ölçüm",
    featureCText: "Kilo ve ölçüm grafik akışına hızlı erişim.",
    responsiveTag: "Responsive · Modern Arayüz",
  },
  en: {
    brandSub: "Clinic and Nutrition Management",
    signIn: "Sign In",
    signUp: "Sign Up",
    welcome: "Welcome",
    profile: "Profile",
    logout: "Log Out",
    chip: "Single panel flow for dietitians and clients",
    titleA: "Manage client tracking",
    titleB: "on one screen",
    titleC: "easily.",
    subtitle:
      "Planning, intake marking, measurement history and real-time messaging in one streamlined flow.",
    ctaStart: "Get Started",
    ctaAccount: "I Have Account",
    trust: "Secure login · Measurement history · Chat",
    stat1: "active clients",
    stat2: "daily plans",
    stat3: "adherence rate",
    stat4: "communication flow",
    today: "Today",
    quick: "Quick overview",
    live: "Live",
    activeClients: "Active clients",
    dailyPlans: "Daily plans",
    messages: "Messages",
    adherence: "Adherence",
    marked: "Marked",
    missing: "Missing",
    measurement: "Measurement",
    chat: "Chat",
    historyTracking: "Historical tracking",
    photoSeen: "Photo and seen status",
    demoPanel: "Demo Panel",
    demoSub: "More depth in real usage",
    goPanel: "Open Panel",
    featureA: "Planning",
    featureAText: "Fast day and meal planning.",
    featureB: "Tracking",
    featureBText: "One tap for consumed status.",
    featureC: "Measurement",
    featureCText: "Weight and progress timeline.",
    responsiveTag: "Responsive · Modern UI",
  },
};

export default function Home() {
  const swaggerUrl = "http://localhost:3000/api/docs";

  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("sd_theme") as Theme | null;
    return saved === "dark" ? "dark" : "light";
  });
  const [lang, setLang] = useState<Lang>(() => {
    const saved = localStorage.getItem("sd_lang") as Lang | null;
    return saved === "en" ? "en" : "tr";
  });
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(() => {
    try {
      const raw = localStorage.getItem("sd_user");
      return raw ? (JSON.parse(raw) as SessionUser) : null;
    } catch {
      return null;
    }
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    localStorage.setItem("sd_theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("sd_lang", lang);
  }, [lang]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const isDark = theme === "dark";
  const t = COPY[lang];
  const isLoggedIn = Boolean(localStorage.getItem("access_token"));
  const dashboardPath = "/dashboard";
  const displayName = useMemo(() => {
    if (!sessionUser) return "";
    const full = [sessionUser.first_name, sessionUser.last_name].filter(Boolean).join(" ").trim();
    return full || sessionUser.full_name || sessionUser.display_name || sessionUser.email || sessionUser.phone_number || "";
  }, [sessionUser]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("sd_user");
    setSessionUser(null);
    setMenuOpen(false);
  };

  const rootClass = useMemo(
    () =>
      [
        "relative h-[100dvh] min-h-[100dvh] w-full overflow-hidden",
        "font-['Manrope','Segoe_UI',sans-serif]",
        isDark ? "text-zinc-50" : "text-[#0f2f29]",
      ].join(" "),
    [isDark],
  );

  return (
    <div className={rootClass}>
      <div className="pointer-events-none absolute inset-0">
        {isDark ? <DarkBackground /> : <LightBackground />}
        <div
          className={
            isDark
              ? "absolute inset-0 [background:radial-gradient(72%_64%_at_50%_22%,transparent_0%,rgba(0,0,0,0.56)_62%,rgba(0,0,0,0.86)_100%)]"
              : "absolute inset-0 [background:radial-gradient(78%_64%_at_50%_22%,transparent_0%,rgba(14,37,31,0.07)_74%,rgba(14,37,31,0.10)_100%)]"
          }
        />
      </div>

      <header className="fixed left-0 right-0 top-0 z-30">
        <div className="relative mx-auto flex w-full max-w-[1500px] items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <ThemeSwitch theme={theme} setTheme={setTheme} isDark={isDark} />
            <LanguageSwitch lang={lang} setLang={setLang} isDark={isDark} />
          </div>

          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <a
              href={swaggerUrl}
              target="_blank"
              rel="noreferrer"
              className={[
                "rounded-full px-5 py-2 text-xs font-extrabold tracking-[0.02em] transition",
                isDark
                  ? "border border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10"
                  : "border border-[#2f6154]/28 bg-[#f3f8f5]/90 text-[#123a32] shadow-[0_14px_40px_rgba(8,23,20,0.12)] hover:bg-white",
              ].join(" ")}
            >
              Swagger
            </a>
          </div>

          {!isLoggedIn ? (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className={[
                  "rounded-full px-4 py-2 text-xs font-extrabold transition",
                  isDark
                    ? "border border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10"
                    : "border border-[#2f6154]/28 bg-[#f3f8f5]/88 text-[#123a32] shadow-[0_14px_40px_rgba(8,23,20,0.12)] hover:bg-white",
                ].join(" ")}
              >
                {t.signIn}
              </Link>
              <Link
                to="/register"
                className={[
                  "rounded-full px-4 py-2 text-xs font-extrabold transition",
                  isDark
                    ? "bg-emerald-500 text-zinc-950 shadow-[0_18px_55px_rgba(16,185,129,0.20)] hover:brightness-110"
                    : "bg-gradient-to-r from-[#1a7f5b] to-[#167f72] text-white shadow-[0_20px_58px_rgba(8,79,63,0.28)] hover:brightness-110",
                ].join(" ")}
              >
                {t.signUp}
              </Link>
            </div>
          ) : (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className={[
                  "rounded-full px-4 py-2 text-xs font-extrabold transition",
                  isDark
                    ? "border border-emerald-400/25 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/15"
                    : "border border-[#2f6154]/30 bg-[#e8f2ed] text-[#11473d] shadow-[0_14px_40px_rgba(8,23,20,0.12)] hover:bg-[#eef6f1]",
                ].join(" ")}
              >
                {t.welcome} {displayName || (lang === "tr" ? "Kullanıcı" : "User")}
              </button>

              {menuOpen ? (
                <div
                  className={[
                    "absolute right-0 mt-2 w-[180px] overflow-hidden rounded-2xl border backdrop-blur",
                    isDark ? "border-white/10 bg-[#0a0d0f]/90" : "border-[#2f6154]/25 bg-[#f7fbf9]/95",
                  ].join(" ")}
                >
                  <Link
                    to="/profile"
                    onClick={() => setMenuOpen(false)}
                    className={[
                      "block px-4 py-3 text-xs font-semibold transition",
                      isDark ? "text-zinc-100 hover:bg-white/10" : "text-[#123a32] hover:bg-[#e9f2ed]",
                    ].join(" ")}
                  >
                    {t.profile}
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className={[
                      "block w-full px-4 py-3 text-left text-xs font-semibold transition",
                      isDark ? "text-rose-200 hover:bg-white/10" : "text-rose-700 hover:bg-[#f4e8e8]",
                    ].join(" ")}
                  >
                    {t.logout}
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </header>

      <main className="relative z-10 mx-auto h-[100dvh] w-full max-w-[1500px] overflow-hidden px-4 pt-[72px] sm:px-6">
        <div className="flex h-full min-h-0 flex-col gap-5 pb-4">
          <div className="home-main-grid grid min-h-0 flex-1 items-start gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <section className="animate-inUp">
              <div className="flex items-center gap-3">
                <div
                  className={[
                    "grid h-11 w-11 place-items-center rounded-2xl ring-1",
                    isDark
                      ? "bg-emerald-500/15 ring-emerald-400/25 shadow-[0_0_0_1px_rgba(16,185,129,0.18)_inset,0_20px_70px_rgba(16,185,129,0.10)]"
                      : "bg-[#eff6f2]/92 ring-[#2f6154]/26 shadow-[0_0_0_1px_rgba(22,94,76,0.16)_inset,0_26px_75px_rgba(8,23,20,0.12)]",
                  ].join(" ")}
                >
                  <span className={["text-sm font-black", isDark ? "text-emerald-200" : "text-[#145443]"].join(" ")}>
                    SD
                  </span>
                </div>
                <div className="leading-tight">
                  <div className="text-sm font-extrabold">SmartDiet</div>
                  <div className={isDark ? "text-xs text-zinc-400" : "text-xs text-[#47675d]"}>{t.brandSub}</div>
                </div>
              </div>

              <div
                className={[
                  "mt-5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold",
                  isDark
                    ? "border border-emerald-400/20 bg-emerald-500/10 text-emerald-100"
                    : "border border-[#2f6154]/25 bg-[#eaf3ee]/86 text-[#145443] shadow-[0_8px_30px_rgba(8,23,20,0.08)]",
                ].join(" ")}
              >
                <span className={["h-2 w-2 rounded-full", isDark ? "bg-emerald-400" : "bg-emerald-600"].join(" ")} />
                {t.chip}
              </div>

              <h1 className="home-title mt-4 leading-[1.03] text-[40px] font-black tracking-tight sm:text-[56px] lg:text-[66px] xl:text-[74px]">
                {t.titleA}{" "}
                <span
                  className={[
                    "bg-gradient-to-r bg-clip-text text-transparent",
                    isDark ? "from-emerald-300 to-teal-200" : "from-[#145443] via-[#0f6a61] to-[#157b64]",
                  ].join(" ")}
                >
                  {t.titleB}
                </span>{" "}
                {t.titleC}
              </h1>

              <p
                className={[
                  "home-subcopy mt-3 max-w-2xl text-[14px] leading-6 sm:text-[16px] sm:leading-7",
                  isDark ? "text-zinc-300" : "text-[#47675d]",
                ].join(" ")}
              >
                {t.subtitle}
              </p>

              <div className="home-cta mt-6 flex flex-wrap items-center gap-3">
                <Link
                  to={isLoggedIn ? dashboardPath : "/register"}
                  className={[
                    "group relative overflow-hidden rounded-2xl px-8 py-4 text-sm font-black transition",
                    isDark
                      ? "bg-emerald-500 text-zinc-950 shadow-[0_26px_85px_rgba(16,185,129,0.22)] hover:brightness-110"
                      : "bg-gradient-to-r from-[#1a7f5b] to-[#167f72] text-white shadow-[0_26px_85px_rgba(8,79,63,0.30)] hover:brightness-110",
                  ].join(" ")}
                >
                  <span className="relative z-10">{t.ctaStart}</span>
                  <span className="absolute inset-0 -translate-x-[120%] bg-white/25 transition-transform duration-700 group-hover:translate-x-[120%] [clip-path:polygon(0_0,35%_0,15%_100%,0_100%)]" />
                </Link>

                <Link
                  to={isLoggedIn ? dashboardPath : "/login"}
                  className={[
                    "rounded-2xl px-8 py-4 text-sm font-black transition",
                    isDark
                      ? "border border-white/10 bg-white/5 hover:bg-white/10"
                      : "border border-[#2f6154]/25 bg-[#f2f8f4]/88 text-[#0e2d27] shadow-[0_12px_35px_rgba(8,23,20,0.10)] hover:bg-white",
                  ].join(" ")}
                >
                  {t.ctaAccount}
                </Link>

                <div className={["ml-1 hidden text-xs sm:block", isDark ? "text-zinc-400" : "text-[#4d6b62]"].join(" ")}>
                  {t.trust}
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatBadge isDark={isDark} value="12+" label={t.stat1} />
                <StatBadge isDark={isDark} value="34" label={t.stat2} />
                <StatBadge isDark={isDark} value="78%" label={t.stat3} />
                <StatBadge isDark={isDark} value="7/24" label={t.stat4} />
              </div>

              <div className="home-features mt-6 hidden gap-3 sm:grid sm:grid-cols-3">
                <FeatureCard isDark={isDark} title={t.featureA} text={t.featureAText} />
                <FeatureCard isDark={isDark} title={t.featureB} text={t.featureBText} />
                <FeatureCard isDark={isDark} title={t.featureC} text={t.featureCText} />
              </div>
            </section>

            <aside className="hidden animate-inUp lg:block [animation-delay:120ms]">
              <div
                className={[
                  "relative mx-auto w-full max-w-[640px] rounded-[34px] p-5 sm:p-6 backdrop-blur",
                  isDark
                    ? "border border-white/10 bg-white/5 shadow-[0_55px_170px_rgba(0,0,0,0.70)]"
                    : "border border-[#3c6b5e]/36 bg-[#ecf4f0]/78 shadow-[0_0_0_1px_rgba(17,67,55,0.17)_inset,0_0_0_1px_rgba(246,250,248,0.92),0_55px_170px_rgba(6,24,20,0.18)]",
                ].join(" ")}
              >
                <div
                  className={[
                    "pointer-events-none absolute -inset-24 opacity-70 blur-[80px]",
                    isDark
                      ? "[background:radial-gradient(circle_at_25%_20%,rgba(16,185,129,0.22),transparent_55%),radial-gradient(circle_at_80%_40%,rgba(20,184,166,0.12),transparent_55%)]"
                      : "[background:radial-gradient(circle_at_25%_20%,rgba(22,111,88,0.20),transparent_55%),radial-gradient(circle_at_80%_40%,rgba(19,104,118,0.15),transparent_55%)]",
                  ].join(" ")}
                />

                <div className="relative">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-extrabold">{t.today}</div>
                      <div className={["text-xs", isDark ? "text-zinc-400" : "text-[#4d6b62]"].join(" ")}>{t.quick}</div>
                    </div>
                    <span
                      className={[
                        "rounded-full px-3 py-1 text-xs font-extrabold ring-1",
                        isDark
                          ? "bg-emerald-500/15 text-emerald-100 ring-emerald-400/20"
                          : "bg-[#eef6f2] text-[#155543] ring-[#2f6154]/30",
                      ].join(" ")}
                    >
                      {t.live}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-2">
                    <MetricRow isDark={isDark} label={t.activeClients} value="12" />
                    <MetricRow isDark={isDark} label={t.dailyPlans} value="34" />
                    <MetricRow isDark={isDark} label={t.messages} value="5" />
                  </div>

                  <div
                    className={[
                      "mt-4 rounded-2xl p-4",
                      isDark ? "border border-white/10 bg-black/20" : "border border-[#355f53]/26 bg-[#f1f8f4]/86",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className={isDark ? "text-zinc-300" : "text-[#36544c]"}>{t.adherence}</span>
                      <span className={["font-extrabold", isDark ? "text-zinc-50" : "text-zinc-900"].join(" ")}>78%</span>
                    </div>
                    <div className={["mt-2 h-2 w-full overflow-hidden rounded-full", isDark ? "bg-white/10" : "bg-[#d3e2da]"].join(" ")}>
                      <div
                        className={[
                          "h-2 w-[78%] rounded-full animate-progress",
                          isDark ? "bg-emerald-400" : "bg-gradient-to-r from-[#1a7f5b] to-[#167f72]",
                        ].join(" ")}
                      />
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <TinyStat isDark={isDark} title={t.marked} value="22" />
                      <TinyStat isDark={isDark} title={t.missing} value="6" />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <MiniModule isDark={isDark} title={t.measurement} desc={t.historyTracking} />
                    <MiniModule isDark={isDark} title={t.chat} desc={t.photoSeen} />
                  </div>

                  <div
                    className={[
                      "mt-4 flex items-center justify-between rounded-2xl px-4 py-3",
                      isDark ? "border border-white/10 bg-black/20" : "border border-[#355f53]/26 bg-[#f1f8f4]/86",
                    ].join(" ")}
                  >
                    <div>
                      <div className="text-xs font-extrabold">{t.demoPanel}</div>
                      <div className={["text-[11px]", isDark ? "text-zinc-400" : "text-[#4d6b62]"].join(" ")}>{t.demoSub}</div>
                    </div>
                    <Link
                      to={isLoggedIn ? dashboardPath : "/login"}
                      className={[
                        "rounded-xl px-3 py-2 text-xs font-black transition",
                        isDark ? "bg-white/5 hover:bg-white/10" : "bg-[#dcebe4] text-[#123a32] hover:bg-[#d2e2db]",
                      ].join(" ")}
                    >
                      {t.goPanel} ›
                    </Link>
                  </div>
                </div>
              </div>
            </aside>
          </div>

          <footer className={["home-footer mt-1 flex items-center justify-between text-xs", isDark ? "text-zinc-500" : "text-[#5b766e]"].join(" ")}>
            <span>© {new Date().getFullYear()} SmartDiet</span>
            <span className="hidden sm:inline">{t.responsiveTag}</span>
          </footer>
        </div>
      </main>

      <style>{`
        @keyframes inUp { 0% { opacity: 0; transform: translateY(14px);} 100% { opacity: 1; transform: translateY(0);} }
        @keyframes progress { 0% { transform: translateX(-6%); filter: brightness(1);} 50% { transform: translateX(0%); filter: brightness(1.08);} 100% { transform: translateX(-6%); filter: brightness(1);} }
        @keyframes floatSlow { 0% { transform: translate(0,0) scale(1);} 50% { transform: translate(18px, 14px) scale(1.03);} 100% { transform: translate(0,0) scale(1);} }
        @keyframes floatSlow2 { 0% { transform: translate(0,0) scale(1);} 50% { transform: translate(-16px, -10px) scale(1.03);} 100% { transform: translate(0,0) scale(1);} }
        @keyframes themeWipe {
          0% { clip-path: circle(0% at 10% 8%); opacity: 0.35; transform: scale(0.98); filter: blur(0px); }
          100% { clip-path: circle(150% at 10% 8%); opacity: 0; transform: scale(1.02); filter: blur(8px); }
        }
        @keyframes themeSheen {
          0% { opacity: 0; transform: translateX(-24%) skewX(-10deg); }
          35% { opacity: 0.28; }
          100% { opacity: 0; transform: translateX(24%) skewX(-10deg); }
        }

        .animate-inUp { animation: inUp 520ms ease-out both; }
        .animate-progress { animation: progress 2.8s ease-in-out infinite; }
        .animate-floatSlow { animation: floatSlow 11s ease-in-out infinite; }
        .animate-floatSlow2 { animation: floatSlow2 13s ease-in-out infinite; }
        .theme-wipe { animation: themeWipe 640ms cubic-bezier(0.2, 0.8, 0.2, 1) both; }
        .theme-sheen { animation: themeSheen 640ms ease-out both; }

        @media (max-width: 860px) {
          .home-main-grid {
            grid-template-columns: 1fr;
            align-items: start;
            gap: 20px;
          }
        }

        @media (max-height: 840px) {
          .home-features,
          .home-footer {
            display: none;
          }
        }

        @media (max-height: 760px) {
          .home-subcopy {
            display: none;
          }
          .home-cta {
            margin-top: 12px;
          }
          .home-title {
            margin-top: 10px;
            font-size: clamp(2rem, 5vw, 3.15rem);
            line-height: 1.04;
          }
        }
      `}</style>
    </div>
  );
}

function DarkBackground() {
  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0 opacity-[0.90] [background:radial-gradient(1200px_720px_at_72%_-10%,rgba(16,185,129,0.22),transparent_55%),radial-gradient(980px_640px_at_10%_105%,rgba(20,184,166,0.14),transparent_58%),linear-gradient(180deg,#050608,#07090b_45%,#050608)]" />
      <div className="absolute inset-0 opacity-[0.10] [background-image:radial-gradient(rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:18px_18px]" />
      <div className="absolute -left-56 -top-56 h-[760px] w-[760px] rounded-full bg-emerald-500/16 blur-[130px] animate-floatSlow" />
      <div className="absolute -bottom-72 -right-72 h-[860px] w-[860px] rounded-full bg-teal-400/12 blur-[150px] animate-floatSlow2" />
    </div>
  );
}

function LightBackground() {
  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0 opacity-[1] [background:radial-gradient(1180px_740px_at_10%_0%,rgba(22,128,101,0.23),transparent_58%),radial-gradient(980px_640px_at_92%_8%,rgba(20,120,133,0.18),transparent_56%),radial-gradient(980px_680px_at_52%_108%,rgba(34,117,91,0.14),transparent_62%),linear-gradient(180deg,#edf5f1,#e2ede8_56%,#dce8e2)]" />
      <div className="absolute inset-0 opacity-[0.12] [background-image:radial-gradient(rgba(8,37,31,0.11)_1px,transparent_1px)] [background-size:22px_22px]" />
      <div className="absolute inset-0 opacity-[0.34] [background:linear-gradient(90deg,rgba(248,252,250,0.35),transparent_32%,transparent_68%,rgba(248,252,250,0.30))]" />
      <div className="absolute -left-56 -top-52 h-[760px] w-[760px] rounded-full bg-emerald-600/16 blur-[125px] animate-floatSlow" />
      <div className="absolute -bottom-72 -right-72 h-[880px] w-[880px] rounded-full bg-teal-400/12 blur-[150px] animate-floatSlow2" />
    </div>
  );
}

function ThemeSwitch({
  theme,
  setTheme,
  isDark,
}: {
  theme: Theme;
  setTheme: (t: Theme) => void;
  isDark: boolean;
}) {
  const onToggle = () => {
    const wipe = document.createElement("div");
    wipe.className = "pointer-events-none fixed inset-0 z-[9999] theme-wipe";
    wipe.style.background = isDark
      ? "radial-gradient(900px_520px_at_10%_6%,rgba(70,255,178,0.18),transparent_60%),linear-gradient(180deg,#f8fdf9,#eef8f2_62%,#f4fbf7)"
      : "radial-gradient(900px_520px_at_10%_6%,rgba(16,185,129,0.22),transparent_60%),linear-gradient(180deg,#050608,#07090b_55%,#050608)";

    const sheen = document.createElement("div");
    sheen.className = "pointer-events-none fixed inset-0 z-[10000] theme-sheen";
    sheen.style.background = "linear-gradient(108deg,transparent_22%,rgba(255,255,255,0.18)_50%,transparent_78%)";

    document.body.appendChild(wipe);
    document.body.appendChild(sheen);

    window.setTimeout(() => {
      document.body.removeChild(wipe);
      document.body.removeChild(sheen);
    }, 640);

    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <button
      type="button"
      onClick={onToggle}
      className={[
        "relative h-9 w-[82px] rounded-full p-1 transition",
        isDark
          ? "border border-white/10 bg-white/5 hover:bg-white/10"
          : "border border-[#2e5c4f]/25 bg-[#eef4f0]/90 shadow-[0_10px_30px_rgba(8,23,20,0.12)] hover:bg-[#f3f7f4]",
      ].join(" ")}
      aria-label="Theme"
      title="Theme"
    >
      <div
        className={[
          "absolute left-2 top-1/2 -translate-y-1/2 transition",
          isDark ? "text-zinc-500/70" : "text-amber-400",
        ].join(" ")}
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      </div>
      <div
        className={[
          "absolute right-2 top-1/2 -translate-y-1/2 transition",
          isDark ? "text-indigo-200" : "text-zinc-500/70",
        ].join(" ")}
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
          <path d="M21 14.5A8.5 8.5 0 1 1 9.5 3a7 7 0 1 0 11.5 11.5z" />
        </svg>
      </div>
      <div
        className={[
          "h-7 w-7 rounded-full transition-transform duration-500",
          isDark
            ? "translate-x-[40px] bg-emerald-500 shadow-[0_0_0_1px_rgba(16,185,129,0.25)_inset,0_14px_40px_rgba(16,185,129,0.25)]"
            : "translate-x-0 bg-[#1a7f5b] shadow-[0_0_0_1px_rgba(8,79,63,0.30)_inset,0_14px_40px_rgba(8,79,63,0.26)]",
        ].join(" ")}
      />
    </button>
  );
}

function LanguageSwitch({
  lang,
  setLang,
  isDark,
}: {
  lang: Lang;
  setLang: (l: Lang) => void;
  isDark: boolean;
}) {
  return (
    <div
      className={[
        "inline-flex h-9 items-center gap-1 rounded-full p-1",
        isDark
          ? "border border-white/10 bg-white/5"
          : "border border-[#2e5c4f]/25 bg-[#eef4f0]/90 shadow-[0_10px_30px_rgba(8,23,20,0.12)]",
      ].join(" ")}
      aria-label="Language"
      title="Language"
    >
      <button
        type="button"
        onClick={() => setLang("tr")}
        className={[
          "rounded-full px-3 py-1 text-[11px] font-black transition",
          lang === "tr"
            ? isDark
              ? "bg-emerald-500/25 text-emerald-100"
              : "bg-[#dbece4] text-[#0f2f29]"
            : isDark
              ? "text-zinc-300 hover:bg-white/10"
              : "text-[#3e6057] hover:bg-[#e5efea]",
        ].join(" ")}
      >
        TR
      </button>
      <button
        type="button"
        onClick={() => setLang("en")}
        className={[
          "rounded-full px-3 py-1 text-[11px] font-black transition",
          lang === "en"
            ? isDark
              ? "bg-emerald-500/25 text-emerald-100"
              : "bg-[#dbece4] text-[#0f2f29]"
            : isDark
              ? "text-zinc-300 hover:bg-white/10"
              : "text-[#3e6057] hover:bg-[#e5efea]",
        ].join(" ")}
      >
        EN
      </button>
    </div>
  );
}

function StatBadge({ isDark, value, label }: { isDark: boolean; value: string; label: string }) {
  return (
    <div
      className={[
        "rounded-2xl px-4 py-3 text-xs",
        isDark
          ? "border border-white/10 bg-white/5 text-zinc-300"
          : "border border-[#325d51]/24 bg-[#ecf4ef]/86 text-[#36544c]",
      ].join(" ")}
    >
      <span className="text-sm font-black">{value}</span> {label}
    </div>
  );
}

function FeatureCard({ isDark, title, text }: { isDark: boolean; title: string; text: string }) {
  return (
    <div
      className={[
        "rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1",
        isDark
          ? "border border-white/10 bg-white/5 shadow-[0_22px_65px_rgba(0,0,0,0.35)]"
          : "border border-[#325d51]/25 bg-[#ecf4ef]/86 shadow-[0_22px_65px_rgba(8,23,20,0.12)]",
      ].join(" ")}
    >
      <div className="text-sm font-black">{title}</div>
      <div className={["mt-2 text-sm", isDark ? "text-zinc-300" : "text-[#4d6b62]"].join(" ")}>{text}</div>
    </div>
  );
}

function MetricRow({ isDark, label, value }: { isDark: boolean; label: string; value: string }) {
  return (
    <div
      className={[
        "flex items-center justify-between rounded-2xl px-4 py-3",
        isDark ? "border border-white/10 bg-black/20" : "border border-[#325d51]/25 bg-[#f0f7f3]/88",
      ].join(" ")}
    >
      <span className={["text-xs font-semibold", isDark ? "text-zinc-300" : "text-[#36544c]"].join(" ")}>{label}</span>
      <span className={["text-xs font-black", isDark ? "text-zinc-50" : "text-zinc-900"].join(" ")}>{value}</span>
    </div>
  );
}

function TinyStat({ isDark, title, value }: { isDark: boolean; title: string; value: string }) {
  return (
    <div className={["rounded-xl px-3 py-2", isDark ? "border border-white/10 bg-white/5" : "border border-[#325d51]/24 bg-[#f0f7f3]/88"].join(" ")}>
      <div className={["text-[10px]", isDark ? "text-zinc-400" : "text-[#4d6b62]"].join(" ")}>{title}</div>
      <div className="text-sm font-black">{value}</div>
    </div>
  );
}

function MiniModule({ isDark, title, desc }: { isDark: boolean; title: string; desc: string }) {
  return (
    <div
      className={[
        "rounded-2xl p-4 transition-all duration-300 hover:-translate-y-0.5",
        isDark ? "border border-white/10 bg-black/20" : "border border-[#325d51]/25 bg-[#f0f7f3]/88",
      ].join(" ")}
    >
      <div className="text-xs font-black">{title}</div>
      <div className={["mt-1 text-[11px]", isDark ? "text-zinc-400" : "text-[#4d6b62]"].join(" ")}>{desc}</div>
    </div>
  );
}




