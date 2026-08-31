import { useState } from "react";
import { Link } from "react-router-dom";
import { useAppSettings } from "../context/AppSettingsContext";
import { setAuthSession } from "../lib/authSession";
import { API_BASE_URL as API_BASE } from "../lib/api";
import { 
  Activity, 
  Stethoscope, 
  UserCheck, 
  Sparkles, 
  Calendar, 
  MessageSquare, 
  ShieldCheck, 
  Droplets, 
  TrendingUp, 
  Utensils, 
  Bot, 
  Building2, 
  Lock, 
  CheckCircle2, 
  ArrowRight, 
  Moon, 
  Sun, 
  Globe, 
  Layers,
  ChevronRight,
  PieChart,
  ClipboardList
} from "lucide-react";

export default function Features() {
  const { lang, setLang, isDark, toggleTheme } = useAppSettings();
  const [activeTab, setActiveTab] = useState<"all" | "dietitian" | "client" | "ai" | "clinic" | "security">("all");
  const [demoLoading, setDemoLoading] = useState<string | null>(null);

  const handleQuickLogin = async (email: string, targetPath: string, roleKey: string) => {
    setDemoLoading(roleKey);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: "admin123" }),
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

  const categories = [
    { id: "all", label: lang === "tr" ? "Tüm Özellikler" : "All Capabilities", icon: Layers },
    { id: "dietitian", label: lang === "tr" ? "Diyetisyen Portali" : "Dietitian Portal", icon: Stethoscope },
    { id: "client", label: lang === "tr" ? "Danışan Portali" : "Client Experience", icon: UserCheck },
    { id: "ai", label: lang === "tr" ? "Yapay Zeka & AI" : "AI & Intelligence", icon: Bot },
    { id: "clinic", label: lang === "tr" ? "Klinik Yönetimi" : "Clinic Management", icon: Building2 },
    { id: "security", label: lang === "tr" ? "Güvenlik & Altyapı" : "Security & Auth", icon: ShieldCheck },
  ];

  const featureList = [
    // Dietitian Features
    {
      category: "dietitian",
      badge: lang === "tr" ? "Klinik Araçları" : "Clinical Tools",
      title: lang === "tr" ? "İnteraktif Öğün ve Diyet Planlayıcı" : "Interactive Meal & Diet Planner",
      desc: lang === "tr" 
        ? "Yüzlerce yerel ve evrensel besin içeren kütüphaneden anlık kalori, protein, karbonhidrat ve yağ hesaplayarak saniyeler içinde kişiye özel günlük veya haftalık diyet planları oluşturun."
        : "Build personalized daily or weekly meal plans with instant calculation of calories, protein, carbs, and fats from a comprehensive food database.",
      icon: Utensils,
      color: "from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/20",
      highlights: [
        lang === "tr" ? "Otomatik kalori ve makro besin dağılımı" : "Automated calorie and macronutrient breakdown",
        lang === "tr" ? "Geniş Türk mutfağı ve genel gıda veritabanı" : "Extensive culinary & nutrient food database",
        lang === "tr" ? "Öğün saatleri ve porsiyon gramaj ayarlama" : "Custom meal timing and portion sizing",
      ]
    },
    {
      category: "dietitian",
      badge: lang === "tr" ? "Analiz & Takip" : "Analytics & Trends",
      title: lang === "tr" ? "Biyometrik Gelişim ve Trend Grafikleri" : "Biometric Progress & Trend Analytics",
      desc: lang === "tr"
        ? "Danışanların kilo, vücut yağ oranı ve vücut kitle indeksi (VKİ) geçmişini interaktif zaman serisi grafiklerinde izleyin; hedeflerden sapmaları erken tespit edin."
        : "Track client weight, body fat percentage, and BMI trends across time-series charts to make timely, data-backed nutrition adjustments.",
      icon: TrendingUp,
      color: "from-teal-500/20 to-cyan-500/10 text-teal-400 border-teal-500/20",
      highlights: [
        lang === "tr" ? "Kilo ve yağ oranı zaman serisi çizelgeleri" : "Weight & body fat trend charts",
        lang === "tr" ? "Danışan bazında anlık sağlık karnesi" : "Client-level biometric scorecards",
        lang === "tr" ? "Ölçüm geçmişi ve hedef karşılaştırması" : "Measurement history vs. target analysis",
      ]
    },
    {
      category: "dietitian",
      badge: lang === "tr" ? "Koordinasyon" : "Coordination",
      title: lang === "tr" ? "Randevu ve Danışan Portföy Yönetimi" : "Appointment & Client Portfolio Hub",
      desc: lang === "tr"
        ? "Aktif danışanları tek ekranda listeleyin, randevu durumlarını (beklemede, onaylandı, tamamlandı) yönetin ve danışan doğrulama süreçlerini kontrol edin."
        : "Manage active clients, monitor verification workflows, and organize consultation appointments across different stages.",
      icon: Calendar,
      color: "from-cyan-500/20 to-blue-500/10 text-cyan-400 border-cyan-500/20",
      highlights: [
        lang === "tr" ? "Danışan arama, filtreleme ve detay karnesi" : "Client search, filtering, and comprehensive dossiers",
        lang === "tr" ? "Tek tıkla danışanın tüm planlarına ve ölçümlerine erişim" : "One-click access to full plan & tracking history",
        lang === "tr" ? "Randevu takvimi ve durum yönetimi" : "Appointment status workflow management",
      ]
    },

    // Client Features
    {
      category: "client",
      badge: lang === "tr" ? "Danışan Deneyimi" : "Client Experience",
      title: lang === "tr" ? "Günlük Plan Takibi & Tüketim Onay Kutuları" : "Daily Meal Compliance & Checkboxes",
      desc: lang === "tr"
        ? "Danışanlar kendilerine atanan diyet planlarını berrak bir arayüzle görür, tükettikleri besinleri işaretleyerek diyetisyenlerine anlık uyum geri bildirimi sağlar."
        : "Clients easily view their personalized daily meals and check off consumed items for transparent compliance and accountability.",
      icon: ClipboardList,
      color: "from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/20",
      highlights: [
        lang === "tr" ? "Yüksek kontrastlı, net okunabilir besin kartları" : "High-contrast, crisp meal and food item cards",
        lang === "tr" ? "Öğün bazında tüketim işaretleme ve kayıt" : "Meal-by-meal consumption checklist",
        lang === "tr" ? "Günlük toplam alınan kalori ve makro özeti" : "Daily macro & caloric totals progress",
      ]
    },
    {
      category: "client",
      badge: lang === "tr" ? "Alışkanlık Takibi" : "Habit Tracking",
      title: lang === "tr" ? "Akıllı Su Tüketimi ve Biyometrik Kayıt" : "Smart Hydration & Biometric Logger",
      desc: lang === "tr"
        ? "Hızlı su ekleme butonları ile günlük sıvı alımını kaydedin; 7 günlük tüketim bar grafiğiyle hidrasyon seviyenizi ve vücut ölçüm güncellemelerinizi takip edin."
        : "Log daily water intake with quick-tap presets and monitor 7-day hydration bars alongside periodic body measurement updates.",
      icon: Droplets,
      color: "from-blue-500/20 to-cyan-500/10 text-blue-400 border-blue-500/20",
      highlights: [
        lang === "tr" ? "Tek tıkla 250ml / 500ml su kaydı" : "One-tap +250ml / +500ml water presets",
        lang === "tr" ? "Son 7 günün su tüketim sütun grafiği" : "7-day interactive water bar chart",
        lang === "tr" ? "Kilo ve yağ oranı giriş formu ve gelişim grafiği" : "Simple weight/body fat self-logging",
      ]
    },
    {
      category: "client",
      badge: lang === "tr" ? "Canlı İletişim" : "Real-time Chat",
      title: lang === "tr" ? "WebSocket ile Gerçek Zamanlı Mesajlaşma" : "Live WebSocket Dietitian Messaging",
      desc: lang === "tr"
        ? "Diyetisyen ve danışan arasında anlık, güvenli ve kesintisiz mesajlaşma; okundu bilgileri ve okunmamış mesaj rozetleri ile hızlı koordinasyon."
        : "Direct, secure real-time messaging between dietitian and client powered by WebSocket with live unread indicators and timestamps.",
      icon: MessageSquare,
      color: "from-teal-500/20 to-emerald-500/10 text-teal-400 border-teal-500/20",
      highlights: [
        lang === "tr" ? "Sıfır gecikmeli çift yönlü mesaj iletimi" : "Zero-latency bidirectional communication",
        lang === "tr" ? "Okunmamış mesaj sayaçları ve bildirimler" : "Unread badges & instant message alerts",
        lang === "tr" ? "Diyetisyen-danışan konuşma geçmişi" : "Full conversation history retention",
      ]
    },

    // AI Features
    {
      category: "ai",
      badge: lang === "tr" ? "Yapay Zeka" : "Artificial Intelligence",
      title: lang === "tr" ? "Görsel Yemek & Tabak Tarama Asistanı" : "AI Visual Plate & Nutrition Scanner",
      desc: lang === "tr"
        ? "Yemek fotoğrafını yükleyin veya kamerayla taratın; çok modlu yapay zeka tabağınızdaki besinleri tespit edip anında kalori ve makro tahminlerini sunsun."
        : "Upload or capture a meal photo; the multimodal AI model analyzes dishes, estimates portion weights, calories, and nutrient breakdown instantly.",
      icon: Bot,
      color: "from-purple-500/20 to-indigo-500/10 text-purple-400 border-purple-500/20",
      highlights: [
        lang === "tr" ? "Görselden porsiyon ve kalori tahmini" : "Computer vision meal and portion recognition",
        lang === "tr" ? "Akıllı beslenme ve porsiyon tavsiyeleri" : "Personalized smart dietary suggestions",
        lang === "tr" ? "Soru-cevap yapabilen etkileşimli sohbet asistanı" : "Interactive conversational AI nutrition assistant",
      ]
    },
    {
      category: "ai",
      badge: lang === "tr" ? "Günün Bilgisi" : "Smart Insights",
      title: lang === "tr" ? "Dinamik Beslenme İpuçları ve Bilgi Ticker'ı" : "Dynamic Nutrition Facts & Insights",
      desc: lang === "tr"
        ? "Kanıta dayalı beslenme ipuçları panellerde dönerken, diyetisyenlerin kendi kliniklerine özel ipuçları ekleyebileceği interaktif bilgi sistemi."
        : "Evidence-based clinical nutrition insights rotate across user dashboards with custom tip authoring for dietitians.",
      icon: Sparkles,
      color: "from-amber-500/20 to-orange-500/10 text-amber-400 border-amber-500/20",
      highlights: [
        lang === "tr" ? "20+ kanıta dayalı klinik beslenme gerçeği" : "20+ evidence-backed clinical facts",
        lang === "tr" ? "Diyetisyenler için özel ipucu ekleme/silme editörü" : "Custom tip editor for authorized practitioners",
        lang === "tr" ? "Çok dilli dinamik bilgi rotasyonu" : "Multilingual rotating fact ticker",
      ]
    },

    // Clinic Management
    {
      category: "clinic",
      badge: lang === "tr" ? "Kurumsal Yönetim" : "Enterprise Hub",
      title: lang === "tr" ? "Klinik Yöneticisi ve Şube Paneli" : "Clinic Operations & Performance Dashboard",
      desc: lang === "tr"
        ? "Klinik yöneticileri için bünyelerindeki tüm diyetisyenlerin hasta sayılarını, aktif planlarını, randevu yoğunluklarını ve klinik metriklerini tek merkezden yönetme imkanı."
        : "Centralized oversight for clinic managers to audit dietitian capacity, client enrollment, active appointments, and overall performance.",
      icon: Building2,
      color: "from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/20",
      highlights: [
        lang === "tr" ? "Diyetisyen onay ve klinik yetkilendirme akışı" : "Dietitian onboarding & credential verification",
        lang === "tr" ? "Klinik geneli danışan ve randevu özetleri" : "Clinic-wide client metrics & appointment tallies",
        lang === "tr" ? "Şube bazlı performans karşılaştırmaları" : "Operational visibility across practitioners",
      ]
    },
    {
      category: "clinic",
      badge: lang === "tr" ? "Sistem Yönetimi" : "Administration",
      title: lang === "tr" ? "Kapsamlı Sistem & Kullanıcı Denetim Masası" : "Master Admin & Platform Audit Console",
      desc: lang === "tr"
        ? "Sistem yöneticileri için kullanıcı rolleri yönetimi, klinik kayıtları, platform istatistikleri ve sistem genelinde veri bütünlüğü kontrolleri."
        : "Superadmin console for platform oversight, user ACL role assignments, clinic registry management, and global system health.",
      icon: PieChart,
      color: "from-indigo-500/20 to-cyan-500/10 text-indigo-400 border-indigo-500/20",
      highlights: [
        lang === "tr" ? "Rol bazlı kullanıcı yönetimi (Admin, Dietitian, Client)" : "RBAC user management & permissions",
        lang === "tr" ? "Klinik ekleme, düzenleme ve kapatma" : "Clinic directory CRUD operations",
        lang === "tr" ? "Canlı kullanıcı ve aktivite metrikleri" : "Real-time user engagement metrics",
      ]
    },

    // Security & Auth
    {
      category: "security",
      badge: lang === "tr" ? "Hesap Güvenliği" : "Authentication",
      title: lang === "tr" ? "İki Aşamalı Doğrulama (2FA OTP) & Güvenli Oturum" : "Two-Factor Authentication (OTP) & Secure Session",
      desc: lang === "tr"
        ? "E-posta veya SMS kanallı tek kullanımlık 6 haneli şifre (OTP) doğrulaması, güvenilir cihaz hatırlama ve JWT Refresh Token rotasyonu ile banka standardında oturum güvenliği."
        : "Email/SMS one-time passcodes (OTP), trusted device caching, and JWT refresh token rotation for enterprise-grade authentication.",
      icon: Lock,
      color: "from-rose-500/20 to-red-500/10 text-rose-400 border-rose-500/20",
      highlights: [
        lang === "tr" ? "E-posta & SMS ile 2FA OTP doğrulama kanalları" : "Email & SMS 2FA OTP verification methods",
        lang === "tr" ? "Hatalı giriş kilitleme ve şifre sıfırlama güvenliği" : "Rate-limiting and secure password reset",
        lang === "tr" ? "Rol tabanlı rota koruması (ProtectedRoute)" : "Strict role-based frontend route guarding",
      ]
    },
    {
      category: "security",
      badge: lang === "tr" ? "Bildirim Merkezi" : "Notifications",
      title: lang === "tr" ? "Merkezi Bildirim ve Aktivite Akışı" : "Centralized Notification & Activity Feed",
      desc: lang === "tr"
        ? "Yeni randevular, gelen mesajlar veya plan güncellemeleri için anlık bildirim zili, okunmamış bildirim sayaçları ve tek tıkla tümünü okundu işaretleme."
        : "Live alert dropdown for appointments, incoming messages, and plan adjustments with unread badges and bulk read features.",
      icon: ShieldCheck,
      color: "from-teal-500/20 to-emerald-500/10 text-teal-400 border-teal-500/20",
      highlights: [
        lang === "tr" ? "Anlık okunmamış bildirim rozetleri" : "Real-time unread notification count badge",
        lang === "tr" ? "Açılır cam bildirim çekmecesi" : "Glassmorphic interactive notification drawer",
        lang === "tr" ? "Okundu işaretleme ve filtreleme" : "Mark-as-read & timestamp tracking",
      ]
    },
  ];

  const filteredFeatures = activeTab === "all" 
    ? featureList 
    : featureList.filter(f => f.category === activeTab);

  return (
    <div className={`relative min-h-screen w-full overflow-x-hidden flex flex-col justify-between ${
      isDark ? "bg-[#040711] text-white" : "bg-[#f8fafc] text-slate-900"
    }`}>
      {/* Background Ambient Glows */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {isDark ? (
          <>
            <div className="absolute top-[-10%] left-[-10%] h-[700px] w-[700px] rounded-full bg-emerald-500/15 blur-[150px]" />
            <div className="absolute bottom-[-10%] right-[-10%] h-[700px] w-[700px] rounded-full bg-cyan-500/15 blur-[150px]" />
            <div className="absolute top-[40%] right-[30%] h-[500px] w-[500px] rounded-full bg-teal-500/10 blur-[130px]" />
            <div className="absolute inset-0 bg-grid-pattern opacity-100" />
          </>
        ) : (
          <>
            <div className="absolute top-[-10%] left-[-10%] h-[700px] w-[700px] rounded-full bg-emerald-500/10 blur-[140px]" />
            <div className="absolute bottom-[-10%] right-[-10%] h-[700px] w-[700px] rounded-full bg-cyan-500/10 blur-[140px]" />
            <div className="absolute inset-0 bg-grid-pattern opacity-40" />
          </>
        )}
      </div>

      {/* Global Header */}
      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 sm:px-8">
        <Link to="/" className="group flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-display font-black text-lg shadow-lg shadow-emerald-500/25 group-hover:scale-105 transition">
            SD
          </div>
          <div>
            <span className="font-display text-xl font-black tracking-tight">SmartDiet</span>
            <span className="block text-[11px] font-bold text-slate-400">
              {lang === "tr" ? "Klinik & Beslenme Yönetimi" : "Clinical & Nutrition Platform"}
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            to="/features"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-black text-emerald-400"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{lang === "tr" ? "Özellikler Kataloğu" : "Feature Catalog"}</span>
          </Link>

          <button
            type="button"
            onClick={toggleTheme}
            className={`p-2.5 rounded-2xl border transition hover:scale-105 ${
              isDark ? "border-white/10 bg-slate-900/60 text-slate-300 hover:bg-slate-900" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100 shadow-sm"
            }`}
          >
            {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-700" />}
          </button>

          <button
            type="button"
            onClick={() => setLang(lang === "tr" ? "en" : "tr")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl border text-xs font-black transition hover:scale-105 ${
              isDark ? "border-white/10 bg-slate-900/60 text-slate-300 hover:bg-slate-900" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100 shadow-sm"
            }`}
          >
            <Globe className="h-3.5 w-3.5 text-emerald-400" />
            <span>{lang.toUpperCase()}</span>
          </button>

          <Link
            to="/login"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold transition hover:bg-white/10"
          >
            {lang === "tr" ? "Giriş Yap" : "Sign In"}
          </Link>

          <Link
            to="/register"
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 px-5 py-2.5 text-xs font-black text-slate-950 shadow-lg shadow-emerald-500/20 hover:brightness-110 hover:scale-105 transition"
          >
            <span>{lang === "tr" ? "Kayıt Ol" : "Register"}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 mx-auto w-full max-w-7xl px-6 py-10 sm:px-8">
        {/* Top Hero Banner */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-black text-emerald-400">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{lang === "tr" ? "Platform Yetenekleri & İşlevler Rehberi" : "Platform Capabilities & Feature Index"}</span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08]">
            {lang === "tr" ? "SmartDiet ile Neler " : "Everything You Can Do with "}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              {lang === "tr" ? "Yapabilirsiniz?" : "SmartDiet"}
            </span>
          </h1>

          <p className={`text-sm sm:text-base leading-relaxed ${isDark ? "text-slate-300" : "text-slate-700"}`}>
            {lang === "tr" 
              ? "Klinik diyetisyenler, bireysel danışanlar ve sağlık yöneticileri için uçtan uca tasarlanmış modern dijital sağlık ekosisteminin tüm fonksiyonlarını keşfedin."
              : "Explore the complete functional matrix designed end-to-end for clinical dietitians, individual clients, and healthcare managers."
            }
          </p>

          {/* Quick Demo Sandbox Banner */}
          <div className={`p-5 rounded-[28px] border text-left mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-xl ${
            isDark ? "border-emerald-500/30 bg-emerald-950/20" : "border-emerald-300/80 bg-emerald-50 shadow-sm"
          }`}>
            <div>
              <div className={`flex items-center gap-2 text-xs font-black uppercase tracking-wider ${
                isDark ? "text-emerald-400" : "text-emerald-800"
              }`}>
                <Activity className="h-4 w-4" />
                <span>{lang === "tr" ? "İK & İnceleyenler İçin Hızlı Canlı Demo" : "Fast Interactive Sandbox for Reviewers"}</span>
              </div>
              <p className={`text-xs mt-1 ${isDark ? "text-slate-300" : "text-slate-700 font-medium"}`}>
                {lang === "tr" ? "Şifre girmeden tek tıkla canlı sistem panellerini test edin:" : "Experience live panels in one click without typing passwords:"}
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                disabled={demoLoading !== null}
                onClick={() => handleQuickLogin("demo.dietitian@smartdiet.com", "/dietitian-home", "dietitian")}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 px-4 py-2.5 text-xs font-black text-slate-950 shadow-md shadow-emerald-500/20 hover:brightness-110 transition disabled:opacity-50"
              >
                <Stethoscope className="h-3.5 w-3.5" />
                <span>{lang === "tr" ? "Diyetisyen Demosu" : "Dietitian Demo"}</span>
              </button>

              <button
                type="button"
                disabled={demoLoading !== null}
                onClick={() => handleQuickLogin("demo.client@smartdiet.com", "/client-home", "client")}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-black transition disabled:opacity-50 ${
                  isDark 
                    ? "border-teal-500/30 bg-teal-500/10 text-teal-400 hover:bg-teal-500/20" 
                    : "border-teal-300 bg-teal-50 text-teal-800 hover:bg-teal-100 shadow-sm"
                }`}
              >
                <UserCheck className="h-3.5 w-3.5" />
                <span>{lang === "tr" ? "Danışan Demosu" : "Client Demo"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Category Navigation Tabs */}
        <div className="flex items-center justify-center flex-wrap gap-2 mb-10">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = activeTab === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveTab(cat.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all ${
                  isSelected 
                    ? "bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/25 scale-105" 
                    : isDark 
                      ? "border border-white/10 bg-slate-900/60 text-slate-300 hover:bg-white/10 hover:text-white" 
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 shadow-sm"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Features Bento Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFeatures.map((f, idx) => {
            const Icon = f.icon;
            return (
              <div
                key={idx}
                className={`group relative rounded-[32px] border p-7 backdrop-blur-xl flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 ${
                  isDark
                    ? "border-white/10 bg-slate-900/60 shadow-[0_20px_50px_rgba(0,0,0,0.6)] hover:border-emerald-500/30 hover:shadow-emerald-500/10"
                    : "border-slate-200/80 bg-white/95 shadow-[0_15px_40px_rgba(0,0,0,0.04)] hover:border-emerald-300 hover:shadow-emerald-500/10"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border bg-gradient-to-tr ${f.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                      isDark 
                        ? "border-white/10 bg-white/5 text-slate-400" 
                        : "border-slate-200 bg-slate-100 text-slate-700"
                    }`}>
                      {f.badge}
                    </span>
                  </div>

                  <h3 className="font-display text-lg font-black tracking-tight group-hover:text-emerald-500 transition">
                    {f.title}
                  </h3>

                  <p className={`mt-2.5 text-xs sm:text-sm leading-relaxed ${isDark ? "text-slate-300" : "text-slate-700 font-medium"}`}>
                    {f.desc}
                  </p>
                </div>

                <div className={`mt-6 pt-5 border-t space-y-2.5 ${isDark ? "border-white/5" : "border-slate-100"}`}>
                  <span className={`text-[10px] font-black uppercase tracking-wider block mb-2 ${
                    isDark ? "text-slate-400" : "text-emerald-800"
                  }`}>
                    {lang === "tr" ? "Öne Çıkan Yetenekler" : "Key Capabilities"}
                  </span>
                  {f.highlights.map((h, i) => (
                    <div key={i} className={`flex items-center gap-2 text-xs font-semibold ${
                      isDark ? "text-slate-300" : "text-slate-800"
                    }`}>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 stroke-[2.5]" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA Banner */}
        <div className={`mt-14 rounded-[36px] border p-8 sm:p-10 text-center relative overflow-hidden backdrop-blur-2xl ${
          isDark 
            ? "border-emerald-500/20 bg-gradient-to-b from-slate-900/90 to-emerald-950/40 shadow-2xl shadow-emerald-500/10" 
            : "border-emerald-300/80 bg-gradient-to-b from-white to-emerald-50 shadow-xl"
        }`}>
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="font-display text-2xl sm:text-3xl font-black tracking-tight">
              {lang === "tr" ? "Platformu Canlı Olarak Deneyimleyin" : "Experience the Platform Live"}
            </h2>
            <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? "text-slate-300" : "text-slate-700 font-medium"}`}>
              {lang === "tr" 
                ? "Diyetisyen ve danışan hesapları ile gerçek zamanlı veri akışını, plan oluşturmayı ve WebSocket mesajlaşmasını hemen test edin."
                : "Explore real-time data flows, meal plan creation, and live chat across dietitian and client portals instantly."
              }
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                disabled={demoLoading !== null}
                onClick={() => handleQuickLogin("demo.dietitian@smartdiet.com", "/dietitian-home", "dietitian")}
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-400 px-6 py-3.5 text-xs font-black text-slate-950 shadow-xl shadow-emerald-500/25 hover:brightness-110 transition disabled:opacity-50"
              >
                <span>{lang === "tr" ? "Canlı Diyetisyen Paneli" : "Live Dietitian Dashboard"}</span>
                <ChevronRight className="h-4 w-4 stroke-[2.5]" />
              </button>

              <button
                type="button"
                disabled={demoLoading !== null}
                onClick={() => handleQuickLogin("demo.client@smartdiet.com", "/client-home", "client")}
                className={`flex items-center gap-2 rounded-2xl border px-6 py-3.5 text-xs font-black transition disabled:opacity-50 ${
                  isDark 
                    ? "border-teal-500/30 bg-teal-500/10 text-teal-400 hover:bg-teal-500/20" 
                    : "border-teal-300 bg-teal-50 text-teal-800 hover:bg-teal-100 shadow-sm"
                }`}
              >
                <span>{lang === "tr" ? "Canlı Danışan Paneli" : "Live Client Portal"}</span>
                <ChevronRight className="h-4 w-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Global Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            © {new Date().getFullYear()} SmartDiet. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <Link to="/" className="hover:text-white transition">{lang === "tr" ? "Ana Sayfa" : "Home"}</Link>
            <Link to="/features" className="hover:text-white transition font-bold text-emerald-400">{lang === "tr" ? "Özellikler" : "Features"}</Link>
            <Link to="/login" className="hover:text-white transition">{lang === "tr" ? "Giriş Yap" : "Login"}</Link>
            <Link to="/register" className="hover:text-white transition">{lang === "tr" ? "Kayıt Ol" : "Register"}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
