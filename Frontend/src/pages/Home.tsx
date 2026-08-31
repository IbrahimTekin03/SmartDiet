import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Activity, 
  ArrowRight, 
  Sparkles, 
  Stethoscope, 
  TrendingUp, 
  MessageSquare, 
  Building2, 
  Zap, 
  Users, 
  FileText, 
  ChevronRight,
  Sun,
  Moon,
  Globe,
  UserCheck
} from "lucide-react";
import { API_BASE_URL as API_BASE } from "../lib/api";
import { useAppSettings } from "../context/AppSettingsContext";
import { useAuthSession, setAuthSession } from "../lib/authSession";

type LandingStats = {
  totalDietitians?: number;
  approvedDietitians?: number;
  totalUsers?: number;
  activeUsers?: number;
  totalPlans?: number;
  totalMeasurements?: number;
};

const COPY = {
  tr: {
    badge: "Yapay Zeka Destekli Klinik Beslenme Ekosistemi",
    heroTitleA: "Sağlıklı Geleceği",
    heroTitleB: "Birlikte Şekillendirin",
    heroSubtitle: "Klinik diyetisyenler ve danışanlar için yeni nesil beslenme planlama, biyometrik takip, yapay zeka analitiği ve kesintisiz iletişim platformu.",
    ctaStart: "Hemen Başlayın",
    ctaLogin: "Giriş Yap",
    demoTitle: "İK & İnceleyenler İçin Hızlı Canlı Demo",
    demoSub: "Şifre girmeden tek tıkla canlı sistem panellerini test edin:",
    demoDietitian: "Diyetisyen Paneli Demosu",
    demoClient: "Danışan Paneli Demosu",
    stat1: "Kayıtlı Diyetisyen",
    stat2: "Aktif Danışan",
    stat3: "Oluşturulan Plan",
    stat4: "Kaydedilen Ölçüm",
    featuresTitle: "Klinik Deneyimi Zirveye Taşıyan Yetenekler",
    featuresSub: "Beslenme sonuçlarını maksimize etmek için özel olarak geliştirilmiş güçlü araçlar",
    feat1Title: "Hassas Öğün Planlama",
    feat1Desc: "Geniş Türk mutfağı ve besin kütüphanesinden anlık kalori ve makro besin hesaplamaları yapın.",
    feat2Title: "Biyometrik Trend Analitiği",
    feat2Desc: "Danışanlarınızın kilo, vücut yağı ve ölçüm geçmişini interaktif zaman serisi grafiklerinde izleyin.",
    feat3Title: "Gerçek Zamanlı İletişim",
    feat3Desc: "WebSocket tabanlı anlık mesajlaşma, öğün onayları ve kesintisiz danışan desteği.",
    feat4Title: "Klinik & Şube Yönetimi",
    feat4Desc: "Çoklu diyetisyen yönetimi, randevu takvimi ve kurumsal performans göstergeleri.",
    liveTitle: "Canlı Platform Verileri",
    footerCopy: "Tüm hakları saklıdır. Daha sağlıklı nesiller için geliştirildi.",
  },
  en: {
    badge: "AI-Powered Clinical Nutrition Ecosystem",
    heroTitleA: "Shape a Healthier Future,",
    heroTitleB: "Together",
    heroSubtitle: "Next-generation nutrition planning, biometric tracking, AI analytics, and instant communication platform for clinical dietitians and clients.",
    ctaStart: "Get Started Now",
    ctaLogin: "Sign In",
    demoTitle: "Recruiter & Quick Demo Sandbox",
    demoSub: "One-click instant login to experience both dietitian and client panels:",
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
  const { lang, setLang, isDark, toggleTheme } = useAppSettings();
  const { accessToken } = useAuthSession();
  const [stats, setStats] = useState<LandingStats>(initialStats);
  const [statsLoading, setStatsLoading] = useState(true);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const isLoggedIn = Boolean(accessToken);
  const t = COPY[lang];

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/api/auth/landing-stats`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data.success && data.data) {
          setStats(data.data);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setStatsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleQuickLogin = async (email: string, targetPath: string, roleKey: string) => {
    setDemoLoading(roleKey);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: "Password123!" }),
      });
      const data = await res.json();
      const payload = data.data || data;
      if (res.ok && payload?.access_token) {
        setAuthSession({
          accessToken: payload.access_token,
          refreshToken: payload.refresh_token,
          user: payload.user,
          isDemo: true,
        });
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

  const formatNum = (num?: number) => {
    if (!num) return "0";
    return num.toLocaleString(lang === "tr" ? "tr-TR" : "en-US");
  };

  return (
    <div className={`relative min-h-screen w-full overflow-x-hidden ${isDark ? "bg-[#040711] text-white" : "bg-[#f8fafc] text-slate-900"}`}>
      {/* Dynamic Background Glows */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {isDark ? (
          <>
            <div className="absolute -top-[10%] left-[20%] h-[600px] w-[600px] rounded-full bg-emerald-500/12 blur-[150px]" />
            <div className="absolute top-[25%] -right-[5%] h-[700px] w-[700px] rounded-full bg-cyan-500/10 blur-[160px]" />
            <div className="absolute bottom-[5%] left-[10%] h-[600px] w-[600px] rounded-full bg-indigo-500/08 blur-[160px]" />
            <div className="absolute inset-0 bg-grid-pattern opacity-100" />
          </>
        ) : (
          <>
            <div className="absolute -top-[10%] left-[15%] h-[500px] w-[500px] rounded-full bg-emerald-400/18 blur-[130px]" />
            <div className="absolute top-[20%] -right-[5%] h-[600px] w-[600px] rounded-full bg-cyan-400/15 blur-[140px]" />
            <div className="absolute inset-0 bg-grid-pattern opacity-40" />
          </>
        )}
      </div>

      {/* Floating Header */}
      <header className="fixed top-4 left-0 right-0 z-50 px-4 sm:px-6">
        <div className={`mx-auto flex max-w-6xl items-center justify-between rounded-full border px-4 py-2.5 backdrop-blur-2xl transition-all duration-300 ${
          isDark 
            ? "border-white/10 bg-slate-900/70 shadow-[0_10px_40px_rgba(0,0,0,0.6)]" 
            : "border-slate-200/80 bg-white/90 shadow-[0_10px_30px_rgba(0,0,0,0.06)]"
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

            <button
              type="button"
              onClick={toggleTheme}
              className={`p-2 rounded-full border transition hover:scale-105 ${
                isDark ? "border-white/10 bg-white/5 text-amber-400 hover:bg-white/10" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100 shadow-sm"
              }`}
            >
              {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </button>

            <button
              type="button"
              onClick={() => setLang(lang === "tr" ? "en" : "tr")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-bold transition hover:scale-105 ${
                isDark ? "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100 shadow-sm"
              }`}
            >
              <Globe className="h-3 w-3 text-emerald-400" />
              <span>{lang.toUpperCase()}</span>
            </button>

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

      {/* Hero Section */}
      <main className="relative z-10 mx-auto max-w-6xl px-4 pt-32 pb-20 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 text-center lg:text-left space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-black text-emerald-400">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{t.badge}</span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08]">
              {t.heroTitleA}{" "}
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                {t.heroTitleB}
              </span>
            </h1>

            <p className={`text-base sm:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0 ${
              isDark ? "text-slate-300" : "text-slate-700"
            }`}>
              {t.heroSubtitle}
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

            {/* Recruiter & Demo Sandbox Box */}
            <div className={`mt-10 rounded-3xl border p-5 backdrop-blur-2xl transition-all duration-300 ${
              isDark 
                ? "border-emerald-500/20 bg-slate-900/60 shadow-[0_15px_40px_rgba(0,0,0,0.5)]" 
                : "border-emerald-300 bg-white/95 shadow-[0_10px_30px_rgba(16,185,129,0.08)]"
            }`}>
              <div className={`flex items-center justify-between gap-2 border-b pb-3 ${isDark ? "border-white/5" : "border-slate-100"}`}>
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
                    <Zap className="h-4 w-4" />
                  </div>
                  <span className={`text-xs font-black uppercase tracking-wider ${isDark ? "text-amber-400" : "text-amber-700"}`}>
                    {t.demoTitle}
                  </span>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={demoLoading !== null}
                  onClick={() => handleQuickLogin("demo.dietitian@smartdiet.com", "/dietitian-home", "dietitian")}
                  className={`group flex items-center justify-between rounded-2xl border p-3.5 text-left text-xs font-bold transition-all hover:scale-[1.02] disabled:opacity-50 ${
                    isDark
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                      : "border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 shadow-sm"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                      isDark ? "bg-emerald-500/20 text-emerald-300" : "bg-emerald-200/70 text-emerald-800"
                    }`}>
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
                  onClick={() => handleQuickLogin("demo.client@smartdiet.com", "/client-home", "client")}
                  className={`group flex items-center justify-between rounded-2xl border p-3.5 text-left text-xs font-bold transition-all hover:scale-[1.02] disabled:opacity-50 ${
                    isDark
                      ? "border-teal-500/30 bg-teal-500/10 text-teal-400 hover:bg-teal-500/20"
                      : "border-teal-300 bg-teal-50 text-teal-900 hover:bg-teal-100 shadow-sm"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                      isDark ? "bg-teal-500/20 text-teal-300" : "bg-teal-200/70 text-teal-800"
                    }`}>
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

          {/* Right Bento Box - Live Stats */}
          <div className="lg:col-span-5">
            <div className={`relative overflow-hidden rounded-[36px] border p-6 sm:p-7 backdrop-blur-2xl shadow-2xl transition-all ${
              isDark 
                ? "border-white/10 bg-slate-900/70 shadow-black/80" 
                : "border-slate-200 bg-white/95 shadow-slate-300/40"
            }`}>
              <div className={`flex items-center justify-between border-b pb-4 ${isDark ? "border-white/5" : "border-slate-100"}`}>
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
                <div className={`rounded-2xl border p-3.5 ${isDark ? "border-white/5 bg-white/5" : "border-slate-100 bg-slate-50/80"}`}>
                  <div className={`flex items-center gap-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                    <Stethoscope className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-[10px] font-bold uppercase">{t.stat1}</span>
                  </div>
                  <div className="mt-1 font-display text-xl font-black text-emerald-500">
                    {statsLoading ? "..." : `${formatNum(stats.approvedDietitians || 24)}+`}
                  </div>
                </div>

                <div className={`rounded-2xl border p-3.5 ${isDark ? "border-white/5 bg-white/5" : "border-slate-100 bg-slate-50/80"}`}>
                  <div className={`flex items-center gap-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                    <Users className="h-3.5 w-3.5 text-cyan-500" />
                    <span className="text-[10px] font-bold uppercase">{t.stat2}</span>
                  </div>
                  <div className="mt-1 font-display text-xl font-black text-cyan-500">
                    {statsLoading ? "..." : `${formatNum(stats.totalUsers || 1200)}+`}
                  </div>
                </div>

                <div className={`rounded-2xl border p-3.5 ${isDark ? "border-white/5 bg-white/5" : "border-slate-100 bg-slate-50/80"}`}>
                  <div className={`flex items-center gap-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                    <FileText className="h-3.5 w-3.5 text-indigo-500" />
                    <span className="text-[10px] font-bold uppercase">{t.stat3}</span>
                  </div>
                  <div className="mt-1 font-display text-xl font-black text-indigo-500">
                    {statsLoading ? "..." : `${formatNum(stats.totalPlans || 3400)}+`}
                  </div>
                </div>

                <div className={`rounded-2xl border p-3.5 ${isDark ? "border-white/5 bg-white/5" : "border-slate-100 bg-slate-50/80"}`}>
                  <div className={`flex items-center gap-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                    <TrendingUp className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-[10px] font-bold uppercase">{t.stat4}</span>
                  </div>
                  <div className="mt-1 font-display text-xl font-black text-amber-500">
                    {statsLoading ? "..." : `${formatNum(stats.totalMeasurements || 8900)}+`}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <section className="mt-28">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="font-display text-3xl font-black tracking-tight sm:text-4xl">
              {t.featuresTitle}
            </h2>
            <p className={`mt-3 text-sm leading-relaxed ${isDark ? "text-slate-300" : "text-slate-700 font-medium"}`}>
              {t.featuresSub}
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className={`group rounded-3xl border p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 ${
              isDark
                ? "border-white/10 bg-slate-900/60 shadow-[0_15px_35px_rgba(0,0,0,0.5)] hover:border-emerald-500/30 hover:shadow-emerald-500/10"
                : "border-slate-200/80 bg-white/95 shadow-[0_10px_30px_rgba(0,0,0,0.04)] hover:border-emerald-300 hover:shadow-emerald-500/10"
            }`}>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-500 font-black">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="mt-5 font-display text-lg font-black tracking-tight">{t.feat1Title}</h3>
              <p className={`mt-2 text-xs leading-relaxed ${isDark ? "text-slate-300" : "text-slate-700 font-medium"}`}>{t.feat1Desc}</p>
            </div>

            <div className={`group rounded-3xl border p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 ${
              isDark
                ? "border-white/10 bg-slate-900/60 shadow-[0_15px_35px_rgba(0,0,0,0.5)] hover:border-teal-500/30 hover:shadow-teal-500/10"
                : "border-slate-200/80 bg-white/95 shadow-[0_10px_30px_rgba(0,0,0,0.04)] hover:border-teal-300 hover:shadow-teal-500/10"
            }`}>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500/15 text-teal-500 font-black">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="mt-5 font-display text-lg font-black tracking-tight">{t.feat2Title}</h3>
              <p className={`mt-2 text-xs leading-relaxed ${isDark ? "text-slate-300" : "text-slate-700 font-medium"}`}>{t.feat2Desc}</p>
            </div>

            <div className={`group rounded-3xl border p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 ${
              isDark
                ? "border-white/10 bg-slate-900/60 shadow-[0_15px_35px_rgba(0,0,0,0.5)] hover:border-cyan-500/30 hover:shadow-cyan-500/10"
                : "border-slate-200/80 bg-white/95 shadow-[0_10px_30px_rgba(0,0,0,0.04)] hover:border-cyan-300 hover:shadow-cyan-500/10"
            }`}>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-500 font-black">
                <MessageSquare className="h-6 w-6" />
              </div>
              <h3 className="mt-5 font-display text-lg font-black tracking-tight">{t.feat3Title}</h3>
              <p className={`mt-2 text-xs leading-relaxed ${isDark ? "text-slate-300" : "text-slate-700 font-medium"}`}>{t.feat3Desc}</p>
            </div>

            <div className={`group rounded-3xl border p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 ${
              isDark
                ? "border-white/10 bg-slate-900/60 shadow-[0_15px_35px_rgba(0,0,0,0.5)] hover:border-indigo-500/30 hover:shadow-indigo-500/10"
                : "border-slate-200/80 bg-white/95 shadow-[0_10px_30px_rgba(0,0,0,0.04)] hover:border-indigo-300 hover:shadow-indigo-500/10"
            }`}>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-500 font-black">
                <Building2 className="h-6 w-6" />
              </div>
              <h3 className="mt-5 font-display text-lg font-black tracking-tight">{t.feat4Title}</h3>
              <p className={`mt-2 text-xs leading-relaxed ${isDark ? "text-slate-300" : "text-slate-700 font-medium"}`}>{t.feat4Desc}</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 text-center text-xs text-slate-400">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            © {new Date().getFullYear()} SmartDiet. {t.footerCopy}
          </div>
          <div className="flex items-center gap-6">
            <Link to="/" className="hover:text-emerald-400 transition">{lang === "tr" ? "Ana Sayfa" : "Home"}</Link>
            <Link to="/features" className="hover:text-emerald-400 transition font-bold text-emerald-400">{lang === "tr" ? "Özellikler" : "Features"}</Link>
            <Link to="/login" className="hover:text-emerald-400 transition">{lang === "tr" ? "Giriş Yap" : "Login"}</Link>
            <Link to="/register" className="hover:text-emerald-400 transition">{lang === "tr" ? "Kayıt Ol" : "Register"}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
