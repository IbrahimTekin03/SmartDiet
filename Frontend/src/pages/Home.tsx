import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAppSettings } from "../context/AppSettingsContext";
import { clearAuthSession, parseStoredUser, useAuthSession } from "../lib/authSession";

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

type LandingStats = {
  totalDietitians: number;
  approvedDietitians: number;
  totalUsers: number;
  activeUsers: number;
  totalPlans: number;
  totalMeasurements: number;
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
    brandSub: "Klinik ve Beslenme Yönetimi",
    signIn: "Giriş Yap",
    signUp: "Kayıt Ol",
    welcome: "Hoş geldin",
    profile: "Profil",
    logout: "Çıkış Yap",
    chip: "Bilimsel takip, uzman desteği ve sürdürülebilir sonuçlar",
    titleA: "Sağlıklı yaşamı",
    titleB: "uzmanlarla",
    titleC: "planlayın.",
    subtitle:
      "SmartDiet, diyetisyenlerle danışanları tek platformda buluşturur. Kişiselleştirilmiş planlar, ölçüm takibi ve güvenli iletişim ile süreci daha düzenli ve verimli hale getirir.",
    ctaStart: "Hemen Başla",
    ctaAccount: "Hesabım Var",
    trust: "Gerçek kullanıcı verisi · Onaylı uzmanlar · Güvenli altyapı",
    stat1: "onaylı diyetisyen",
    stat2: "kayıtlı kullanıcı",
    stat3: "oluşturulan plan",
    stat4: "ölçüm kaydı",
    today: "Bugün",
    quick: "Hızlı özet",
    live: "Canlı",
    activeClients: "Toplam diyetisyen",
    dailyPlans: "Toplam kullanıcı",
    messages: "Onaylı diyetisyen",
    adherence: "Aktif kullanıcı oranı",
    marked: "Aktif kullanıcı",
    missing: "Pasif kullanıcı",
    measurement: "Ölçüm",
    chat: "Sohbet",
    historyTracking: "Geçmiş takibi",
    photoSeen: "Fotoğraf ve görüldü durumu",
    demoPanel: "Neden SmartDiet?",
    demoSub: "Uzman eşleşmesi, düzenli takip ve sürdürülebilir gelişim tek yerde.",
    goPanel: "Panele Geç",
    featureA: "Uzman Eşleşmesi",
    featureAText: "Hedeflerine uygun diyetisyenle güvenle çalış.",
    featureB: "Süreç Takibi",
    featureBText: "Günlük planlarını adım adım uygula ve düzenli takip et.",
    featureC: "Ölçüm Geçmişi",
    featureCText: "Gelişimini raporlarla düzenli olarak izle.",
    responsiveTag: "Responsive · Modern arayüz",
  },
  en: {
    brandSub: "Clinic and Nutrition Management",
    signIn: "Sign In",
    signUp: "Sign Up",
    welcome: "Welcome",
    profile: "Profile",
    logout: "Log Out",
    chip: "Evidence-based tracking with expert guidance",
    titleA: "Build healthier habits",
    titleB: "with verified",
    titleC: "dietitians.",
    subtitle:
      "SmartDiet brings dietitians and clients together in one platform with personalized plans, progress tracking and secure communication.",
    ctaStart: "Get Started",
    ctaAccount: "I Have an Account",
    trust: "Live platform stats · Verified experts · Secure flow",
    stat1: "verified dietitians",
    stat2: "registered users",
    stat3: "plans created",
    stat4: "measurement records",
    today: "Today",
    quick: "Quick overview",
    live: "Live",
    activeClients: "Total dietitians",
    dailyPlans: "Total users",
    messages: "Verified dietitians",
    adherence: "Active user ratio",
    marked: "Active users",
    missing: "Inactive users",
    measurement: "Measurement",
    chat: "Chat",
    historyTracking: "Historical tracking",
    photoSeen: "Photo and seen status",
    demoPanel: "Why SmartDiet?",
    demoSub: "Expert matching, tracking and sustainable progress in one place",
    goPanel: "Open Panel",
    featureA: "Expert Matching",
    featureAText: "Work with the right dietitian for your goals.",
    featureB: "Process Tracking",
    featureBText: "Follow your daily plan with clear steps.",
    featureC: "Progress History",
    featureCText: "Review outcomes with measurement timelines.",
    responsiveTag: "Responsive · Modern UI",
  },
};

export default function Home() {
  const API_BASE = "http://localhost:3000";
  const swaggerUrl = "http://localhost:3000/api/docs";
  const initialStats: LandingStats = {
    totalDietitians: 0,
    approvedDietitians: 0,
    totalUsers: 0,
    activeUsers: 0,
    totalPlans: 0,
    totalMeasurements: 0,
  };
  const { lang, isDark } = useAppSettings();
  const { accessToken, userJson } = useAuthSession();
  const sessionUser = useMemo(() => parseStoredUser<SessionUser>(userJson), [userJson]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [stats, setStats] = useState<LandingStats>(initialStats);
  const [statsLoading, setStatsLoading] = useState(true);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const statsRequestInFlightRef = useRef(false);
  const statsAbortRef = useRef<AbortController | null>(null);
  const isLoggedIn = Boolean(accessToken);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (isLoggedIn) return;

    let cancelled = false;

    const fetchStats = async () => {
      if (statsRequestInFlightRef.current) return;
      statsRequestInFlightRef.current = true;
      statsAbortRef.current?.abort();
      const controller = new AbortController();
      statsAbortRef.current = controller;
      try {
        const res = await fetch(`${API_BASE}/api/auth/public/landing-stats`, { signal: controller.signal });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error("stats_fetch_failed");
        const payload = data?.data ?? data;
        if (cancelled) return;
        setStats({
          totalDietitians: Number(payload?.totalDietitians ?? 0),
          approvedDietitians: Number(payload?.approvedDietitians ?? 0),
          totalUsers: Number(payload?.totalUsers ?? 0),
          activeUsers: Number(payload?.activeUsers ?? 0),
          totalPlans: Number(payload?.totalPlans ?? 0),
          totalMeasurements: Number(payload?.totalMeasurements ?? 0),
        });
        setLastUpdatedAt(Date.now());
      } catch {
        if (cancelled) return;
      } finally {
        statsRequestInFlightRef.current = false;
        if (!cancelled) setStatsLoading(false);
      }
    };

    const run = () => {
      if (document.visibilityState !== "visible") return;
      void fetchStats();
    };

    run();
    const timer = window.setInterval(run, 30000);
    document.addEventListener("visibilitychange", run);

    return () => {
      cancelled = true;
      statsAbortRef.current?.abort();
      document.removeEventListener("visibilitychange", run);
      window.clearInterval(timer);
    };
  }, [isLoggedIn]);
  const t = COPY[lang];
  const panelPath = "/";
  const numberLocale = lang === "tr" ? "tr-TR" : "en-US";
  const timeLocale = lang === "tr" ? "tr-TR" : "en-US";
  const formatNum = (value: number) => Number(value || 0).toLocaleString(numberLocale);
  const inactiveUsers = Math.max(0, Number(stats.totalUsers || 0) - Number(stats.activeUsers || 0));
  const activeRate = stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0;
  const updatedAtText = lastUpdatedAt
    ? new Date(lastUpdatedAt).toLocaleTimeString(timeLocale, { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : statsLoading
      ? "..."
      : "-";
  const displayName = useMemo(() => {
    if (!sessionUser) return "";
    const full = [sessionUser.first_name, sessionUser.last_name].filter(Boolean).join(" ").trim();
    return full || sessionUser.full_name || sessionUser.display_name || sessionUser.email || sessionUser.phone_number || "";
  }, [sessionUser]);

  const handleLogout = () => {
    clearAuthSession();
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
          <div className="w-[72px] sm:w-[154px]" aria-hidden="true" />

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
                    "absolute right-0 mt-2 w-[180px] overflow-hidden rounded-2xl border",
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
          <div className="home-main-grid grid min-h-0 flex-1 items-start gap-8 lg:grid-cols-[1.12fr_0.88fr]">
            <section className="animate-inUp lg:pr-4">
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
                  to={isLoggedIn ? panelPath : "/register"}
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
                  to={isLoggedIn ? panelPath : "/login"}
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

            </section>

            <aside className="animate-inUp [animation-delay:120ms]">
              <div
                className={[
                  "relative mx-auto w-full max-w-[640px] rounded-[34px] p-5 sm:p-6",
                  isDark
                    ? "border border-white/10 bg-white/5 shadow-[0_55px_170px_rgba(0,0,0,0.70)]"
                    : "border border-[#3c6b5e]/36 bg-[#ecf4f0]/78 shadow-[0_0_0_1px_rgba(17,67,55,0.17)_inset,0_0_0_1px_rgba(246,250,248,0.92),0_55px_170px_rgba(6,24,20,0.18)]",
                ].join(" ")}
              >
                <div
                  className={[
                    "pointer-events-none absolute -inset-24 opacity-35",
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
                      <div className={["mt-1 text-[10px]", isDark ? "text-zinc-500" : "text-[#5a776d]"].join(" ")}>
                        {lang === "tr" ? `Son güncelleme: ${updatedAtText}` : `Updated: ${updatedAtText}`}
                      </div>
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
                    <MetricRow
                      isDark={isDark}
                      label={t.activeClients}
                      value={statsLoading ? "..." : formatNum(stats.totalDietitians)}
                    />
                    <MetricRow
                      isDark={isDark}
                      label={t.dailyPlans}
                      value={statsLoading ? "..." : formatNum(stats.totalUsers)}
                    />
                    <MetricRow
                      isDark={isDark}
                      label={t.messages}
                      value={statsLoading ? "..." : `${formatNum(stats.approvedDietitians)}+`}
                    />
                  </div>

                  <div
                    className={[
                      "mt-4 rounded-2xl p-4",
                      isDark ? "border border-white/10 bg-black/20" : "border border-[#355f53]/26 bg-[#f1f8f4]/86",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className={isDark ? "text-zinc-300" : "text-[#36544c]"}>{t.adherence}</span>
                      <span className={["font-extrabold", isDark ? "text-zinc-50" : "text-zinc-900"].join(" ")}>
                        {statsLoading ? "..." : `${activeRate}%`}
                      </span>
                    </div>
                    <div className={["mt-2 h-2 w-full overflow-hidden rounded-full", isDark ? "bg-white/10" : "bg-[#d3e2da]"].join(" ")}>
                      <div
                        className={[
                          "h-2 rounded-full",
                          isDark ? "bg-emerald-400" : "bg-gradient-to-r from-[#1a7f5b] to-[#167f72]",
                        ].join(" ")}
                        style={{ width: `${activeRate}%` }}
                      />
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <TinyStat isDark={isDark} title={t.marked} value={statsLoading ? "..." : formatNum(stats.activeUsers)} />
                      <TinyStat isDark={isDark} title={t.missing} value={statsLoading ? "..." : formatNum(inactiveUsers)} />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <MiniModule isDark={isDark} title={t.featureA} desc={t.featureAText} />
                    <MiniModule isDark={isDark} title={t.featureB} desc={t.featureBText} />
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
                      to={isLoggedIn ? panelPath : "/login"}
                      className={[
                        "rounded-xl px-3 py-2 text-xs font-black transition",
                        isDark
                          ? "bg-white/5 hover:bg-white/10"
                          : "bg-[#dcebe4] text-[#123a32] hover:bg-[#d2e2db]",
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

        .animate-inUp { animation: inUp 520ms ease-out both; }
        .animate-progress,
        .animate-floatSlow,
        .animate-floatSlow2 { animation: none; }

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
    </div>
  );
}

function LightBackground() {
  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0 opacity-[1] [background:radial-gradient(1180px_740px_at_10%_0%,rgba(22,128,101,0.23),transparent_58%),radial-gradient(980px_640px_at_92%_8%,rgba(20,120,133,0.18),transparent_56%),radial-gradient(980px_680px_at_52%_108%,rgba(34,117,91,0.14),transparent_62%),linear-gradient(180deg,#edf5f1,#e2ede8_56%,#dce8e2)]" />
      <div className="absolute inset-0 opacity-[0.12] [background-image:radial-gradient(rgba(8,37,31,0.11)_1px,transparent_1px)] [background-size:22px_22px]" />
      <div className="absolute inset-0 opacity-[0.34] [background:linear-gradient(90deg,rgba(248,252,250,0.35),transparent_32%,transparent_68%,rgba(248,252,250,0.30))]" />
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
        "rounded-2xl p-4 transition hover:-translate-y-0.5",
        isDark ? "border border-white/10 bg-black/20" : "border border-[#325d51]/25 bg-[#f0f7f3]/88",
      ].join(" ")}
    >
      <div className="text-xs font-black">{title}</div>
      <div className={["mt-1 text-[11px]", isDark ? "text-zinc-400" : "text-[#4d6b62]"].join(" ")}>{desc}</div>
    </div>
  );
}

