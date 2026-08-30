import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAppSettings } from "../context/AppSettingsContext";
import { setAuthSession, parseStoredUser, useAuthSession } from "../lib/authSession";
import { API_BASE_URL as API_BASE } from "../lib/api";
import { 
  Activity, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Users, 
  FileText, 
  TrendingUp, 
  Zap, 
  MessageSquare, 
  Utensils, 
  ChevronRight,
  Stethoscope,
  UserCheck
} from "lucide-react";

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

const COPY = {
  tr: {
    badge: "Yapay Zeka Destekli Klinik & Beslenme Ekosistemi",
    titleMain: "Sağlıklı Bir Geleceği",
    titleGradient: "Uzman Diyetisyenlerle",
    titleEnd: "Birlikte İnşa Edin.",
    subtitle:
      "SmartDiet; diyetisyenlerle danışanları tek bir akıllı platformda buluşturur. Bireiselleştirilmiş beslenme programları, canlı vücut analizleri ve anlık iletişimle sağlıklı yaşamı zahmetsiz hale getirin.",
    ctaStart: "Hemen Ücretsiz Başla",
    ctaLogin: "Giriş Yap",
    demoTitle: "Hızlı Demo & İK İnceleme Girişi",
    demoSub: "Şifre girmeden tek tıkla canlı sistem panellerini test edin",
    demoDietitian: "Diyetisyen Paneli Demosu",
    demoClient: "Danışan Paneli Demosu",
    stat1: "Onaylı Diyetisyen",
    stat2: "Kayıtlı Danışan",
    stat3: "Oluşturulan Beslenme Planı",
    stat4: "Tamamlanan Ölçüm Kaydı",
    featuresTitle: "Gelişmiş Klinik Deneyimi",
    featuresSub: "Her adımda uzmanlığı ve teknolojiyi bir araya getiren güçlü araçlar",
    feat1Title: "Kişiselleştirilmiş Beslenme Planları",
    feat1Desc: "Kalori, makro ve mikro besin ögelerini anlık hesaplayın, danışana özel tarifler ekleyin.",
    feat2Title: "Vücut Ölçümü & Trend Analizi",
    feat2Desc: "Kilo, yağ oranı ve antropometrik ölçümleri interaktif grafiklerle anlık takip edin.",
    feat3Title: "Anlık İletişim ve Takip",
    feat3Desc: "Danışanlarınızla güvenli sohbet edin, öğün fotoğraflarını ve geri bildirimleri canlı inceleyin.",
    feat4Title: "Klinik & Ekip Yönetimi",
    feat4Desc: "Çoklu diyetisyen yönetimi, randevu takibi ve kurumsal performans göstergeleri.",
    liveTitle: "Canlı Performans Metrikleri",
    footerCopy: "Tüm hakları saklıdır. Sağlıklı bir yaşam için tasarlandı.",
  },
  en: {
    badge: "AI-Powered Clinical Nutrition Ecosystem",
    titleMain: "Build a Healthier Future",
    titleGradient: "With Verified Experts",
    titleEnd: "And Smart Insights.",
    subtitle:
      "SmartDiet seamlessly bridges the gap between dietitians and clients with personalized meal plans, dynamic bio-tracking, and secure real-time communication.",
    ctaStart: "Get Started Free",
    ctaLogin: "Sign In",
    demoTitle: "Recruiter & Quick Demo Sandbox",
    demoSub: "One-click instant login to experience both dietitian and client panels",
    demoDietitian: "Dietitian Dashboard Demo",
    demoClient: "Client Portal Demo",
    stat1: "Verified Dietitians",
    stat2: "Active Clients",
    stat3: "Nutrition Plans Generated",
    stat4: "Health Logs Recorded",
    featuresTitle: "Cutting-Edge Clinical Experience",
    featuresSub: "Powerful instruments engineered to scale nutritional outcomes",
    feat1Title: "Precision Meal Planning",
    feat1Desc: "Compute macros and calories on the fly with tailored recipe libraries.",
    feat2Title: "Progress & Bio-Metric Analytics",
    feat2Desc: "Interactive trend charting for body weight, fat percentage, and measurements.",
    feat3Title: "Real-Time Direct Messenger",
    feat3Desc: "Seamless photo-sharing, meal check-ins, and dietitian messaging.",
    feat4Title: "Clinic & Practice Operations",
    feat4Desc: "Multi-dietitian governance, appointment oversight, and KPI analytics.",
    liveTitle: "Live Platform Telemetry",
    footerCopy: "All rights reserved. Crafted for healthier generations.",
  }
};

export default function Home() {
  const initialStats: LandingStats = {
    totalDietitians: 0,
    approvedDietitians: 0,
    totalUsers: 0,
    activeUsers: 0,
    totalPlans: 0,
    totalMeasurements: 0,
  };
  const { lang, isDark } = useAppSettings();
  const { accessToken } = useAuthSession();
  const [stats, setStats] = useState<LandingStats>(initialStats);
  const [statsLoading, setStatsLoading] = useState(true);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const isLoggedIn = Boolean(accessToken);
  const t = COPY[lang];

  useEffect(() => {
    let cancelled = false;
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/public/landing-stats`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return;
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
      } catch {
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    };

    fetchStats();
    const timer = window.setInterval(fetchStats, 30000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const handleQuickLogin = async (email: string, targetPath: string, roleKey: string) => {
    setDemoLoading(roleKey);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: "admin123" }),
      });
      const data = await res.json();
      if (data.success && data.data?.access_token) {
        setAuthSession({ accessToken: data.data.access_token, user: data.data.user });
        window.location.href = targetPath;
      } else {
        alert(lang === "tr" ? "Demo hesaba giriş yapılamadı." : "Failed to log in to demo account.");
      }
    } catch {
      alert(lang === "tr" ? "Bağlantı hatası oluştu." : "Network connection error.");
    } finally {
      setDemoLoading(null);
    }
  };

  const formatNum = (val: number) => Number(val || 0).toLocaleString(lang === "tr" ? "tr-TR" : "en-US");

  return (
    <div className={`relative min-h-screen w-full overflow-x-hidden ${isDark ? "bg-[#040711] text-white" : "bg-[#f8fafc] text-slate-900"}`}>
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {isDark ? (
          <>
            <div className="absolute -top-[10%] left-[20%] h-[600px] w-[600px] rounded-full bg-emerald-500/12 blur-[150px]" />
            <div className="absolute top-[25%] -right-[5%] h-[700px] w-[700px] rounded-full bg-cyan-500/10 blur-[160px]" />
            <div className="absolute bottom-[5%] left-[10%] h-[600px] w-[600px] rounded-full bg-indigo-500/08 blur-[160px]" />
          </>
        ) : (
          <>
            <div className="absolute -top-[10%] left-[15%] h-[500px] w-[500px] rounded-full bg-emerald-400/18 blur-[130px]" />
            <div className="absolute top-[20%] -right-[5%] h-[600px] w-[600px] rounded-full bg-cyan-400/15 blur-[140px]" />
          </>
        )}
      </div>

      <header className="fixed top-4 left-0 right-0 z-50 px-4 sm:px-6">
        <div className={`mx-auto flex max-w-6xl items-center justify-between rounded-full border px-4 py-2.5 backdrop-blur-2xl transition-all duration-300 ${
          isDark 
            ? "border-white/10 bg-slate-900/70 shadow-[0_10px_40px_rgba(0,0,0,0.6)]" 
            : "border-slate-200/80 bg-white/80 shadow-[0_10px_30px_rgba(0,0,0,0.06)]"
        }`}>
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-md shadow-emerald-500/25">
              <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-[#040711] text-white">
                <Activity className="h-5 w-5 text-emerald-400" />
              </div>
            </div>
            <span className="font-display text-lg font-black tracking-tight">SmartDiet</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/features"
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all hover:scale-105 ${
                isDark ? "text-emerald-400 hover:text-emerald-300 hover:bg-white/5" : "text-emerald-700 hover:text-emerald-800 hover:bg-slate-100"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{lang === "tr" ? "Özellikler" : "Features"}</span>
            </Link>

            {!isLoggedIn ? (
              <>
                <Link
                  to="/login"
                  className={`rounded-full px-4 py-2 text-xs font-bold transition-all hover:scale-105 ${
                    isDark ? "text-slate-300 hover:text-white" : "text-slate-700 hover:text-slate-900"
                  }`}
                >
                  {t.ctaLogin}
                </Link>
                <Link
                  to="/register"
                  className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 px-5 py-2 text-xs font-black text-slate-950 shadow-md shadow-emerald-500/25 transition-all hover:scale-105 hover:brightness-110"
                >
                  {t.ctaStart}
                </Link>
              </>
            ) : (
              <Link
                to="/"
                className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-400 transition hover:bg-emerald-500/20"
              >
                <span>{lang === "tr" ? "Panele Git" : "Go to Dashboard"}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-4 pt-32 pb-24 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-12">
          <div className="text-center lg:col-span-7 lg:text-left">
            <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold transition-all ${
              isDark 
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.15)]" 
                : "border-emerald-200 bg-emerald-50 text-emerald-800 shadow-sm"
            }`}>
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              <span>{t.badge}</span>
            </div>

            <h1 className="mt-6 font-display text-4xl font-black leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
              {t.titleMain} <br />
              <span className="text-emerald-500">{t.titleGradient}</span> <br />
              {t.titleEnd}
            </h1>

            <p className={`mt-6 max-w-2xl text-base leading-relaxed sm:text-lg lg:mx-0 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
              {t.subtitle}
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3.5 sm:flex-row lg:justify-start">
              <Link
                to={isLoggedIn ? "/" : "/register"}
                className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-8 py-4 text-sm font-black text-slate-950 shadow-xl shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95 sm:w-auto"
              >
                <span>{t.ctaStart}</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to={isLoggedIn ? "/" : "/login"}
                className={`flex w-full items-center justify-center gap-2 rounded-2xl border px-8 py-4 text-sm font-bold backdrop-blur-xl transition-all hover:scale-105 sm:w-auto ${
                  isDark
                    ? "border-white/10 bg-white/5 text-white hover:bg-white/10"
                    : "border-slate-300 bg-white/80 text-slate-800 shadow-sm hover:bg-white"
                }`}
              >
                <span>{t.ctaLogin}</span>
              </Link>
            </div>

            <div className={`mt-10 rounded-3xl border p-5 backdrop-blur-2xl transition-all duration-300 ${
              isDark 
                ? "border-emerald-500/20 bg-slate-900/60 shadow-[0_15px_40px_rgba(0,0,0,0.5)]" 
                : "border-emerald-200/90 bg-white/90 shadow-[0_10px_30px_rgba(16,185,129,0.06)]"
            }`}>
              <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
                    <Zap className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-wider text-amber-500">
                    {t.demoTitle}
                  </span>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={demoLoading !== null}
                  onClick={() => handleQuickLogin("ibrahim_tkn033@hotmail.com", "/dietitian-home", "dietitian")}
                  className="group flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-left text-xs font-bold text-emerald-400 transition-all hover:bg-emerald-500/20 hover:scale-[1.02] disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
                      <Stethoscope className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-black">{t.demoDietitian}</div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>

                <button
                  type="button"
                  disabled={demoLoading !== null}
                  onClick={() => handleQuickLogin("ibrahim_tkn03@hotmail.com", "/client-home", "client")}
                  className="group flex items-center justify-between rounded-2xl border border-teal-500/30 bg-teal-500/10 p-3.5 text-left text-xs font-bold text-teal-400 transition-all hover:bg-teal-500/20 hover:scale-[1.02] disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-500/20 text-teal-300">
                      <UserCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-black">{t.demoClient}</div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className={`relative overflow-hidden rounded-[36px] border p-6 sm:p-7 backdrop-blur-2xl shadow-2xl transition-all ${
              isDark 
                ? "border-white/10 bg-slate-900/70 shadow-black/80" 
                : "border-slate-200 bg-white/90 shadow-slate-300/40"
            }`}>
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                  <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                </div>
                <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  {t.liveTitle}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/5 bg-white/5 p-3.5">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Stethoscope className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-[10px] font-bold uppercase">{t.stat1}</span>
                  </div>
                  <div className="mt-1 font-display text-xl font-black text-emerald-400">
                    {statsLoading ? "..." : `${formatNum(stats.approvedDietitians || 24)}+`}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/5 bg-white/5 p-3.5">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Users className="h-3.5 w-3.5 text-cyan-400" />
                    <span className="text-[10px] font-bold uppercase">{t.stat2}</span>
                  </div>
                  <div className="mt-1 font-display text-xl font-black text-cyan-400">
                    {statsLoading ? "..." : `${formatNum(stats.totalUsers || 1200)}+`}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/5 bg-white/5 p-3.5">
                  <div className="flex items-center gap-2 text-slate-400">
                    <FileText className="h-3.5 w-3.5 text-indigo-400" />
                    <span className="text-[10px] font-bold uppercase">{t.stat3}</span>
                  </div>
                  <div className="mt-1 font-display text-xl font-black text-indigo-400">
                    {statsLoading ? "..." : `${formatNum(stats.totalPlans || 3400)}+`}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/5 bg-white/5 p-3.5">
                  <div className="flex items-center gap-2 text-slate-400">
                    <TrendingUp className="h-3.5 w-3.5 text-amber-400" />
                    <span className="text-[10px] font-bold uppercase">{t.stat4}</span>
                  </div>
                  <div className="mt-1 font-display text-xl font-black text-amber-400">
                    {statsLoading ? "..." : `${formatNum(stats.totalMeasurements || 8900)}+`}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="mt-28">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="font-display text-3xl font-black tracking-tight sm:text-4xl">
              {t.featuresTitle}
            </h2>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[ { icon: Utensils, title: t.feat1Title, desc: t.feat1Desc }, { icon: TrendingUp, title: t.feat2Title, desc: t.feat2Desc }, { icon: MessageSquare, title: t.feat3Title, desc: t.feat3Desc }, { icon: ShieldCheck, title: t.feat4Title, desc: t.feat4Desc } ].map((f, i) => (
              <div key={i} className={`group rounded-3xl border p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 ${isDark ? "border-white/10 bg-slate-900/60" : "border-slate-200 bg-white/90"}`}>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 transition-transform">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 font-display text-lg font-black">{f.title}</h3>
                <p className={`mt-2 text-xs leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        <footer className={`mt-28 flex flex-col items-center justify-between gap-4 border-t py-8 text-xs sm:flex-row ${
          isDark ? "border-white/10 text-slate-500" : "border-slate-200 text-slate-500"
        }`}>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-400" />
            <span className="font-bold">SmartDiet © {new Date().getFullYear()}</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
