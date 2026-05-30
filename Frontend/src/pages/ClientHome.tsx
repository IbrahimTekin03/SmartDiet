import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DashboardMessagesLink, DashboardPanel, DashboardSectionHeader, DashboardShell, DashboardStatCard, dashboardButtonClass } from "../components/DashboardShell";
import { useAppSettings } from "../context/AppSettingsContext";
import { useSocket } from "../context/SocketContext";
import { clearAuthSession, useAuthSession } from "../lib/authSession";

type Profile = {
  first_name?: string;
  last_name?: string;
  display_name?: string;
  full_name?: string;
  email?: string;
  phone_number?: string;
  clinic_id?: string | null;
  clinic_name?: string | null;
};

type Summary = {
  activeClients: number;
  plans: number;
  messages: number;
  adherence: number;
};

type MeasurementItem = {
  id: string;
  date: string;
  weight?: number | string | null;
  body_fat?: number | string | null;
};

type WorkspaceNetwork = {
  assignedDietitian?: {
    user_id: string;
    name?: string | null;
    email?: string | null;
    clinic_name?: string | null;
    clinic_city?: string | null;
    notes?: string | null;
  } | null;
};

const API_BASE = "http://localhost:3000";

const COPY = {
  tr: {
    title: "Kullanıcı Ana Sayfası",
    subtitle: "Günlük takibini, planlarını ve hesap özetini tek ekranda yönet.",
    welcome: "Tekrar hoş geldin",
    fallbackUser: "Kullanıcı",
    profile: "Profil",
    logout: "Çıkış Yap",
    overview: "Genel Bakış",
    overviewSub: "Hesabına bağlı güncel özet kartları",
    summaryErr: "Özet verileri şu anda alınamıyor.",
    statPlans: "Planlar",
    statMessages: "Mesajlar",
    statAdherence: "Uyum",
    statExperts: "Aktif Uzmanlar",
    quickTitle: "Hızlı İşlemler",
    quickSub: "En sık kullanılan alanlara hızlı erişim",
    quickProfile: "Profilini Güncelle",
    quickProfileText: "Kişisel bilgilerini ve iletişim alanlarını düzenle.",
    quickStart: "Süreç Özetini İncele",
    quickStartText: "Kayıt sonrası sürecini tek bakışta gözden geçir.",
    quickSupport: "Destek ve İletişim",
    quickSupportText: "Diyetisyenin ve uygulama akışıyla ilgili yönlendirme al.",
    activityTitle: "Bugün İçin",
    activitySub: "Platformu verimli kullanmak için önerilen günlük akış",
    activityA: "Profil alanlarını tamamla ve hesabını güncel tut.",
    activityB: "Planların geldikçe günlük takibini aynı ekrandan izleyebilirsin.",
    activityC: "Ölçümlerini düzenli girerek ilerleme geçmişini güçlendir.",
    accountTitle: "Hesap Bilgileri",
    accountSub: "Giriş yaptığın hesaba ait özet bilgiler",
    mail: "E-posta",
    phone: "Telefon",
    status: "Durum",
    statusActive: "Aktif kullanıcı hesabı",
    statusReady: "Kullanıma hazır",
    measurements: "Ölçüm Geçmişi",
    measurementsSub: "Son 30 günlük kayıtlara ait kısa bir görünüm",
    latestWeight: "Güncel Kilo",
    latestFat: "Güncel Yağ Oranı",
    recentRecords: "Son Kayıtlar",
    notesTitle: "Günlük Notlar",
    notesSub: "Bu alan yalnızca sana özeldir ve tarayıcında saklanır.",
    notesPlaceholder: "Bugün neye odaklanmak istiyorsun?",
    workspaceTitle: "Kullanıcı Akışı",
    workspaceSub: "Uygulamada izleyeceğin temel kullanıcı adımları.",
    assignedTitle: "Atanmış Diyetisyen",
    assignedSub: "Bu eşleşme admin tarafından yönetilir ve kullanıcı tarafından doğrudan değiştirilemez.",
    assignedNone: "Henüz sana atanmış bir diyetisyen bulunmuyor.",
    assignedClinic: "Klinik",
    assignedCity: "Şehir",
    assignedNote: "Bağlantı Notu",
    assignedBadge: "Diyetisyen",
    openMessages: "Mesaj",
    planSection: "Diyetisyen Öğün Listesi",
    planSectionSub: "Atanan planların ve öğün içeriklerin burada görünür.",
    planOpen: "Öğünleri Gör",
    noPlans: "Henüz atanmış bir öğün listesi yok.",
    w1: "Profilini ve hedeflerini tamamla",
    w1d: "Kişisel bilgilerini, iletişim alanlarını ve temel hedeflerini güncel tut.",
    w2: "Ölçümlerini kaydet",
    w2d: "Kilo ve yağ oranı gibi verileri düzenli girerek ilerlemeni takip et.",
    w3: "Planını takip et",
    w3d: "Diyetisyenden gelen plan, uyum ve günlük akış kartlarını buradan izle.",
    w4: "Destek al ve not tut",
    w4d: "Sorularını toparla, günlük not alanını kullan ve profil ekranı üzerinden süreci destekle.",
    noMeasurements: "Henüz ölçüm kaydı bulunmuyor.",
    measurementErr: "Ölçüm verileri şu anda alınamıyor.",
    clinicRequiredTitle: "Klinik seçimi gerekli",
    clinicRequiredText: "Sistemi kullanmaya devam edebilmeniz ve bir diyetisyene atanabilmeniz için hizmet aldığınız kliniği seçin.",
    clinicSelectPlaceholder: "Klinik seç",
    saveClinic: "Kliniği Kaydet ve Devam Et",
    savingClinic: "Kaydediliyor...",
    skipClinic: "Deneysel: Şimdilik Geç",
    empty: "Belirtilmedi",
  },
  en: {
    title: "User Home",
    subtitle: "A focused home page for registered users to track account activity, plans and progress.",
    welcome: "Welcome back",
    fallbackUser: "User",
    profile: "Profile",
    logout: "Log Out",
    overview: "Overview",
    overviewSub: "Latest account cards connected to your session",
    summaryErr: "Summary data is unavailable right now.",
    statPlans: "Plans",
    statMessages: "Messages",
    statAdherence: "Adherence",
    statExperts: "Active Experts",
    quickTitle: "Quick Actions",
    quickSub: "Shortcuts to the most useful areas",
    quickProfile: "Update profile",
    quickProfileText: "Edit your personal and contact details.",
    quickStart: "Review your goals",
    quickStartText: "Keep your post-registration flow organized at a glance.",
    quickSupport: "Support and contact",
    quickSupportText: "Get guided through your dietitian and app flow.",
    activityTitle: "For Today",
    activitySub: "Suggested flow to get started inside the platform",
    activityA: "Complete your profile fields and keep your account up to date.",
    activityB: "As plans arrive, you can follow your daily flow from one screen.",
    activityC: "Enter measurements regularly to strengthen your progress history.",
    accountTitle: "Account Info",
    accountSub: "Signed-in registered user snapshot",
    mail: "Email",
    phone: "Phone",
    status: "Status",
    statusActive: "Active registered user",
    statusReady: "Ready to use",
    measurements: "Measurement History",
    measurementsSub: "A quick look at records from the last 30 days",
    latestWeight: "Latest Weight",
    latestFat: "Latest Body Fat",
    recentRecords: "Recent Records",
    notesTitle: "Daily Notes",
    notesSub: "This area is private to you and stored in your browser.",
    notesPlaceholder: "What do you want to focus on today?",
    workspaceTitle: "User System",
    workspaceSub: "The core workflow a regular user follows inside the app.",
    assignedTitle: "Assigned Dietitian",
    assignedSub: "This connection is managed by admin and cannot be changed directly by the user.",
    assignedNone: "No dietitian has been assigned yet.",
    assignedClinic: "Clinic",
    assignedCity: "City",
    assignedNote: "Connection Note",
    assignedBadge: "Dietitian",
    openMessages: "Message",
    planSection: "Dietitian Meal List",
    planSectionSub: "Assigned plans and meal contents appear here.",
    planOpen: "View Meals",
    noPlans: "No meal list has been assigned yet.",
    w1: "Complete profile and goals",
    w1d: "Keep personal details, contact fields and basic goals up to date.",
    w2: "Record measurements",
    w2d: "Enter weight and body-fat style metrics regularly to track progress.",
    w3: "Follow your plan",
    w3d: "Use this area to follow plan, adherence and daily flow cards coming from the dietitian.",
    w4: "Get support and keep notes",
    w4d: "Collect questions, use daily notes and support your journey from the profile side.",
    noMeasurements: "No measurement records yet.",
    measurementErr: "Measurement data is unavailable right now.",
    clinicRequiredTitle: "Clinic selection required",
    clinicRequiredText: "Choose your clinic to continue using the system and be assigned to a dietitian.",
    clinicSelectPlaceholder: "Select clinic",
    saveClinic: "Save Clinic and Continue",
    savingClinic: "Saving...",
    skipClinic: "Experimental: Skip for now",
    empty: "Not provided",
  },
} as const;

export default function ClientHome({ profile }: { profile: Profile }) {
  const navigate = useNavigate();
  const { lang, isDark } = useAppSettings();
  const { accessToken } = useAuthSession();
  const { unreadMessageCount } = useSocket();
  const t = COPY[lang];
  const [summary, setSummary] = useState<Summary>({
    activeClients: 0,
    plans: 0,
    messages: 0,
    adherence: 0,
  });
  const [measurements, setMeasurements] = useState<MeasurementItem[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(Boolean(accessToken));
  const [summaryError, setSummaryError] = useState("");
  const [measurementError, setMeasurementError] = useState("");
  const [dietPlans, setDietPlans] = useState<any[]>([]);
  const [network, setNetwork] = useState<WorkspaceNetwork>({});
  const clinicPromptSkipKey = useMemo(
    () => `sd-skip-clinic-prompt:${profile.email || profile.phone_number || profile.display_name || "default"}`,
    [profile.display_name, profile.email, profile.phone_number],
  );
  const [clinics, setClinics] = useState<any[]>([]);
  const [selectedClinic, setSelectedClinic] = useState("");
  const [savingClinic, setSavingClinic] = useState(false);
  const [clinicPromptSkipped, setClinicPromptSkipped] = useState(false);
  
  useEffect(() => {
    if (!profile.clinic_id) {
      fetch(`${API_BASE}/api/clinics`)
        .then((r) => r.json())
        .then((d) => setClinics(Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : []))
        .catch(() => {});
    }
  }, [profile.clinic_id]);

  const saveClinic = async () => {
    if (!selectedClinic) return;
    setSavingClinic(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/profile/update-clinic`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ clinic_id: selectedClinic }),
      });
      if (res.ok) {
        window.location.reload();
      }
    } finally {
      setSavingClinic(false);
    }
  };

  const displayName = useMemo(() => {
    const full = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim();
    return full || profile.full_name || profile.display_name || profile.email || profile.phone_number || t.fallbackUser;
  }, [profile, t.fallbackUser]);

  useEffect(() => {
    if (!accessToken) {
      setLoadingSummary(false);
      return;
    }

    let cancelled = false;
    setLoadingSummary(true);
    setSummaryError("");

    fetch(`${API_BASE}/api/auth/dashboard/summary`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error("summary_failed");
        const payload = data?.data ?? data;
        if (cancelled) return;
        setSummary({
          activeClients: Number(payload?.activeClients ?? 0),
          plans: Number(payload?.plans ?? 0),
          messages: Number(payload?.messages ?? 0),
          adherence: Number(payload?.adherence ?? 0),
        });
      })
      .catch(() => {
        if (!cancelled) setSummaryError(t.summaryErr);
      })
      .finally(() => {
        if (!cancelled) setLoadingSummary(false);
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken, t.summaryErr]);

  useEffect(() => {
    if (!accessToken) return;

    let cancelled = false;
    setMeasurementError("");

    fetch(`${API_BASE}/api/measurements/history?days=30`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error("measurement_failed");
        const payload = data?.data ?? data;
        if (cancelled) return;
        setMeasurements(Array.isArray(payload?.items) ? payload.items : []);
      })
      .catch(() => {
        if (!cancelled) setMeasurementError(t.measurementErr);
      });

    fetch(`${API_BASE}/api/diet-plans/client`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (res.ok && !cancelled) {
          setDietPlans(Array.isArray(data?.data) ? data.data : []);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [accessToken, t.measurementErr]);

  useEffect(() => {
    if (!accessToken) return;

    let cancelled = false;
    fetch(`${API_BASE}/api/auth/workspace/network`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error("network_failed");
        if (!cancelled) setNetwork((data?.data ?? data) as WorkspaceNetwork);
      })
      .catch(() => {
        if (!cancelled) setNetwork({});
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  useEffect(() => {
    setClinicPromptSkipped(localStorage.getItem(clinicPromptSkipKey) === "1");
  }, [clinicPromptSkipKey]);

  const onLogout = () => {
    clearAuthSession();
    navigate("/login", { replace: true });
  };

  const skipClinicPrompt = () => {
    localStorage.setItem(clinicPromptSkipKey, "1");
    setClinicPromptSkipped(true);
  };

  const summaryCards = [
    { label: t.statPlans, value: summary.plans, tone: "from-emerald-400/20 to-teal-300/10" },
    { label: t.statAdherence, value: `${summary.adherence}%`, tone: "from-lime-400/20 to-emerald-300/10" },
    { label: t.statExperts, value: summary.activeClients, tone: "from-teal-400/20 to-cyan-300/10" },
  ];

  const latestMeasurement = measurements.length ? measurements[measurements.length - 1] : null;
  const recentMeasurements = measurements.slice(-4).reverse();

  return (
    <DashboardShell
      isDark={isDark}
      badge={t.statusReady}
      title={`${t.welcome} ${displayName}`}
      subtitle={t.subtitle}
      actions={
        <>
          <DashboardMessagesLink isDark={isDark} unreadCount={unreadMessageCount} label={lang === "tr" ? "Mesajlar" : "Messages"} />
          <Link to="/profile" className={dashboardButtonClass(isDark)}>
            {t.profile}
          </Link>
          <button onClick={onLogout} className={dashboardButtonClass(isDark, "danger")}>
            {t.logout}
          </button>
        </>
      }
    >
      <section>
        <DashboardSectionHeader isDark={isDark} title={t.overview} subtitle={t.overviewSub} />
        {summaryError ? <div className="mb-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{summaryError}</div> : null}
        <div className="grid gap-3 sm:grid-cols-3">
          {summaryCards.map((card) => (
            <DashboardStatCard key={card.label} isDark={isDark} title={card.label} value={loadingSummary ? "..." : String(card.value)} accent={card.tone} />
          ))}
        </div>
      </section>

      <section>
        <DashboardPanel isDark={isDark} className="overflow-hidden">
          <DashboardSectionHeader isDark={isDark} title={t.assignedTitle} subtitle={t.assignedSub} />
          {network.assignedDietitian ? (
            <div className={["border p-4", isDark ? "rounded-2xl border-transparent bg-black/20 shadow-[inset_0_1px_0_rgba(16,185,129,0.08),0_16px_50px_rgba(0,0,0,0.20)]" : "rounded-2xl border-[#e4dbc9] bg-[#fffaf2]"].join(" ")}>
              <div className={["mb-4 h-1.5 w-20 rounded-full", isDark ? "bg-gradient-to-r from-emerald-300/70 to-teal-300/20" : "bg-gradient-to-r from-[#2f6154]/70 to-[#a8d5bd]/30"].join(" ")} />
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className={["flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-base font-black", isDark ? "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-300/20" : "bg-[#edf6ec] text-[#285743] ring-1 ring-[#dce8dc]"].join(" ")}>
                    {(network.assignedDietitian.name || "D").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-lg font-black">{network.assignedDietitian.name || t.empty}</div>
                    <div className={["mt-1 truncate text-xs", isDark ? "text-zinc-400" : "text-[#4d6b62]"].join(" ")}>
                      {network.assignedDietitian.clinic_name || t.empty}
                    </div>
                  </div>
                </div>
                <span className={["shrink-0 rounded-full border px-2 py-1 text-[10px] font-black uppercase", isDark ? "border-emerald-300/20 bg-emerald-500/10 text-emerald-100" : "border-[#dce8dc] bg-[#edf6ec] text-[#285743]"].join(" ")}>
                  {t.assignedBadge}
                </span>
              </div>

              <div className={["mt-3 grid gap-2 border-t pt-3 sm:grid-cols-2", isDark ? "border-emerald-400/10" : "border-[#d8e5d8]"].join(" ")}>
                <InfoRow isDark={isDark} label={t.mail} value={network.assignedDietitian.email || t.empty} />
                <InfoRow isDark={isDark} label={t.assignedCity} value={network.assignedDietitian.clinic_city || t.empty} />
              </div>
            </div>
          ) : (
            <div className={isDark ? "rounded-2xl border border-dashed border-transparent bg-black/20 p-6 text-center text-sm text-zinc-400 shadow-[inset_0_1px_0_rgba(16,185,129,0.08)]" : "rounded-2xl border border-dashed border-[#e4dbc9] bg-[#fffaf2] p-6 text-center text-sm text-[#5e776e]"}>{t.assignedNone}</div>
          )}
        </DashboardPanel>
      </section>

      <section>
        <DashboardPanel isDark={isDark}>
          <DashboardSectionHeader isDark={isDark} title={t.planSection} subtitle={t.planSectionSub} />
          {dietPlans.length > 0 ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {dietPlans.map((plan: any) => {
                const planTypeLabel = plan.plan_type === 'daily' ? (lang === 'tr' ? 'Günlük' : 'Daily') : plan.plan_type === 'monthly' ? (lang === 'tr' ? 'Aylık' : 'Monthly') : (lang === 'tr' ? 'Haftalık' : 'Weekly');
                
                return (
                  <Link key={plan.id} to={`/plan/${plan.id}`} className={["group flex flex-col justify-between border p-3 transition hover:-translate-y-0.5", isDark ? "rounded-2xl border-transparent bg-black/20 shadow-[inset_0_1px_0_rgba(16,185,129,0.08)] hover:border-transparent hover:bg-white/[0.07]" : "rounded-2xl border-[#e4dbc9] bg-[#fffaf2] hover:border-[#d4c9b5] hover:bg-white"].join(" ")}>
                    <div>
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div className={["inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-black uppercase", isDark ? "border-emerald-300/20 bg-emerald-500/10 text-emerald-100" : "border-[#dce8dc] bg-[#edf6ec] text-[#285743]"].join(" ")}>
                          {planTypeLabel} Plan
                        </div>
                        <div className={isDark ? "text-[11px] text-zinc-500" : "text-[11px] text-[#7a7160]"}>
                          {new Date(plan.created_at || new Date()).toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US")}
                        </div>
                      </div>
                      <h3 className={["mb-1 text-sm font-black tracking-tight", isDark ? "text-white" : "text-[#123a32]"].join(" ")}>
                        {plan.title}
                      </h3>
                      {plan.description && (
                        <p className={["line-clamp-2 text-xs leading-5", isDark ? "text-zinc-400" : "text-[#4d6b62]"].join(" ")}>
                          {plan.description}
                        </p>
                      )}
                    </div>
                    
                    <div className={["mt-3 flex items-center justify-between border-t pt-2", isDark ? "border-emerald-400/10" : "border-[#d8e5d8]"].join(" ")}>
                      <div className="flex -space-x-2">
                        <div className={["flex h-8 w-8 items-center justify-center rounded-xl text-xs font-black", isDark ? "bg-emerald-500/15 text-emerald-200" : "bg-[#edf6ec] text-[#285743]"].join(" ")}>
                          {plan.meals?.length || 0}
                        </div>
                        <div className={["flex h-8 pl-4 items-center rounded-full text-[10px] font-black uppercase", isDark ? "text-zinc-500" : "text-[#7a7160]"].join(" ")}>
                          {lang === "tr" ? "Öğün" : "Meals"}
                        </div>
                      </div>
                      <div className={["flex h-9 w-9 items-center justify-center transition", isDark ? "rounded-xl bg-emerald-400 text-zinc-950 group-hover:brightness-110" : "rounded-xl bg-[#2f6154] text-white group-hover:bg-[#244f44]"].join(" ")}>
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </div>
                    </div>
                    <div className={["mt-2 text-right text-[11px] font-black", isDark ? "text-emerald-300" : "text-[#285743]"].join(" ")}>
                      {t.planOpen}
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className={isDark ? "rounded-2xl border border-dashed border-transparent bg-black/20 p-6 text-center text-sm text-zinc-400 shadow-[inset_0_1px_0_rgba(16,185,129,0.08)]" : "rounded-2xl border border-dashed border-[#e4dbc9] bg-[#fffaf2] p-6 text-center text-sm text-[#5e776e]"}>
              {t.noPlans}
            </div>
          )}
        </DashboardPanel>
      </section>

      <div className="grid gap-3 lg:grid-cols-2">
        <WaterTracker isDark={isDark} lang={lang} accessToken={accessToken || ""} />
        <AppointmentBooking isDark={isDark} lang={lang} accessToken={accessToken || ""} />
      </div>

      <DashboardPanel isDark={isDark}>
        <DashboardSectionHeader
          isDark={isDark}
          title={t.measurements}
          subtitle={t.measurementsSub}
        />

        {measurementError ? <div className="mb-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{measurementError}</div> : null}

        <div className="grid gap-3 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <MeasurementStat isDark={isDark} label={t.latestWeight} value={latestMeasurement?.weight != null ? `${latestMeasurement.weight} kg` : t.empty} />
            <MeasurementStat isDark={isDark} label={t.latestFat} value={latestMeasurement?.body_fat != null ? `%${latestMeasurement.body_fat}` : t.empty} />
          </div>

          <div className={["border p-3", isDark ? "rounded-2xl border-transparent bg-black/20 shadow-[inset_0_1px_0_rgba(16,185,129,0.08)]" : "rounded-2xl border-[#e4dbc9] bg-[#fffaf2]"].join(" ")}>
            <div className="text-sm font-black">{t.recentRecords}</div>
            <div className="mt-3 space-y-2">
              {recentMeasurements.length ? (
                recentMeasurements.map((item) => (
                  <div key={item.id} className={["flex items-center justify-between gap-3 border px-3 py-2.5 text-xs", isDark ? "rounded-xl border-transparent bg-white/5" : "rounded-xl border-[#e4dbc9] bg-white"].join(" ")}>
                    <div>
                      <div className="font-semibold">{item.date}</div>
                      <div className={isDark ? "mt-1 text-xs text-zinc-400" : "mt-1 text-xs text-[#5e776e]"}>
                        {item.weight != null ? `${item.weight} kg` : t.empty}{" · "}
                        {item.body_fat != null ? `%${item.body_fat}` : t.empty}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className={isDark ? "text-sm text-zinc-400" : "text-sm text-[#4d6b62]"}>{t.noMeasurements}</div>
              )}
            </div>
          </div>
        </div>
      </DashboardPanel>

      {!profile.clinic_id && !clinicPromptSkipped && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className={["w-full max-w-md rounded-3xl border p-6 shadow-2xl", isDark ? "border-transparent bg-[#111]" : "border-[#e4dbc9] bg-[#fffaf2]"].join(" ")}>
            <h2 className={["mb-2 text-xl font-extrabold", isDark ? "text-white" : "text-[#123a32]"].join(" ")}>{t.clinicRequiredTitle}</h2>
            <p className={["mb-6 text-sm", isDark ? "text-gray-400" : "text-[#4d6b62]"].join(" ")}>{t.clinicRequiredText}</p>
            
            <select
              value={selectedClinic}
              onChange={(e) => setSelectedClinic(e.target.value)}
              className={[
                "w-full rounded-2xl border px-4 py-3 mb-6 text-sm outline-none transition",
                isDark ? "border-transparent bg-white/5 text-white" : "bg-gray-50 border-gray-200 text-gray-900"
              ].join(" ")}
            >
              <option value="">{t.clinicSelectPlaceholder}</option>
              {clinics.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} - {c.city}
                </option>
              ))}
            </select>
            
            <button
              onClick={saveClinic}
              disabled={!selectedClinic || savingClinic}
              className="w-full rounded-2xl bg-emerald-500 py-3 text-sm font-bold text-white transition hover:bg-emerald-600 disabled:opacity-50"
            >
              {savingClinic ? t.savingClinic : t.saveClinic}
            </button>
            <button
              type="button"
              onClick={skipClinicPrompt}
              className={["mt-2 w-full rounded-xl border px-3 py-2 text-xs font-black transition", isDark ? "border-transparent bg-white/5 text-zinc-300 hover:bg-white/10" : "border-[#e4dbc9] bg-[#fffaf2] text-[#285743] hover:bg-white"].join(" ")}
            >
              {t.skipClinic}
            </button>
            <button
              onClick={onLogout}
              className="mt-3 w-full rounded-2xl py-3 text-sm font-bold text-red-500 transition hover:bg-red-500/10"
            >
              {t.logout}
            </button>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

function InfoRow({ isDark, label, value }: { isDark: boolean; label: string; value: string }) {
  return (
    <div className={["flex items-center justify-between gap-3 border px-3 py-2.5 text-xs", isDark ? "rounded-xl border-transparent bg-black/20 shadow-[inset_0_1px_0_rgba(16,185,129,0.08)]" : "rounded-xl border-[#e4dbc9] bg-[#fffaf2]"].join(" ")}>
      <span className={isDark ? "text-zinc-400" : "text-[#5e776e]"}>{label}</span>
      <span className="text-right font-black">{value}</span>
    </div>
  );
}

function MeasurementStat({ isDark, label, value }: { isDark: boolean; label: string; value: string }) {
  return (
    <div className={["border p-3", isDark ? "rounded-xl border-transparent bg-black/20 shadow-[inset_0_1px_0_rgba(16,185,129,0.08)]" : "rounded-xl border-[#e4dbc9] bg-[#fffaf2]"].join(" ")}>
      <div className={isDark ? "text-[10px] font-bold uppercase text-zinc-400" : "text-[10px] font-bold uppercase text-[#5e776e]"}>{label}</div>
      <div className="mt-2 text-xl font-black">{value}</div>
    </div>
  );
}

function WaterTracker({ isDark, lang, accessToken }: { isDark: boolean; lang: string; accessToken: string }) {
  const [amount, setAmount] = useState(0);
  const [target] = useState(3000); // 3L
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const localTime = new Date(d.getTime() - (offset * 60 * 1000));
    return localTime.toISOString().slice(0, 10);
  });

  useEffect(() => {
    if (!accessToken) return;
    fetch(`http://localhost:3000/api/water-tracking/today?date=${selectedDate}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
      .then(res => res.json())
      .then(d => {
        const payload = d?.data ?? d;
        if (payload) {
          setAmount(Number(payload.amount) || 0);
        } else {
          setAmount(0);
        }
      })
      .catch(() => {
        setAmount(0);
      });
  }, [accessToken, selectedDate]);

  const updateWater = async (newAmount: number) => {
    if (newAmount < 0) newAmount = 0;
    setAmount(newAmount); // Optimistic Update

    try {
      await fetch("http://localhost:3000/api/water-tracking", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ amount: newAmount, date: selectedDate })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const pct = Math.min(100, Math.round((amount / target) * 100));

  return (
    <DashboardPanel isDark={isDark} className="relative overflow-hidden p-5 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4 border-b border-zinc-200/10 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className={["flex h-10 w-10 items-center justify-center rounded-2xl text-xl", isDark ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-600"].join(" ")}>
            💧
          </div>
          <div>
            <h2 className="text-sm font-black">{lang === "tr" ? "Su Tüketim Takibi" : "Water Tracker"}</h2>
            <p className={["text-[10px]", isDark ? "text-zinc-400" : "text-[#4d6b62]"].join(" ")}>
              {lang === "tr" ? "Günlük su hedefinizi izleyin" : "Track your daily hydration"}
            </p>
          </div>
        </div>

        {/* Retroactive Date Picker */}
        <div className="flex items-center gap-1.5 text-[10px] font-bold">
          <span className="opacity-60">{lang === "tr" ? "Tarih:" : "Date:"}</span>
          <input
            type="date"
            value={selectedDate}
            max={(() => {
              const d = new Date();
              const offset = d.getTimezoneOffset();
              return new Date(d.getTime() - (offset * 60 * 1000)).toISOString().slice(0, 10);
            })()}
            onChange={(e) => setSelectedDate(e.target.value)}
            className={["rounded-xl px-2.5 py-1.5 outline-none text-xs font-black shadow-inner", isDark ? "bg-black/60 border border-blue-500/20 text-white" : "bg-white border border-[#cedce4] text-blue-900"].join(" ")}
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
        {/* Animated wave cup */}
        <div className="relative w-20 h-32 border-4 border-blue-400/30 rounded-[24px] overflow-hidden bg-blue-500/5 shadow-inner flex items-center justify-center shrink-0">
          <div 
            className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-blue-600 to-blue-400 transition-all duration-700 ease-out"
            style={{ height: `${pct}%` }}
          >
            {pct > 5 && (
              <div className="absolute inset-x-0 -top-4 h-4 overflow-hidden">
                <div className="water-wave-anim w-[200%] h-8 bg-blue-400/30 rounded-[40%] absolute -left-1/2 -top-2 animate-[spin_8s_infinite_linear]" />
              </div>
            )}
          </div>
          <span className={["relative z-10 text-base font-black tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]", pct > 45 ? "text-white" : isDark ? "text-zinc-300" : "text-blue-900"].join(" ")}>
            %{pct}
          </span>
        </div>

        {/* Buttons & stats */}
        <div className="flex-1 w-full space-y-3">
          <div>
            <div className="text-xl font-black">{amount} ml <span className={["text-xs font-semibold", isDark ? "text-zinc-500" : "text-[#7a7160]"].join(" ")}> / {target} ml</span></div>
            <div className="mt-1.5 h-2 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 transition-all duration-500 rounded-full" style={{ width: `${pct}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => updateWater(amount + 250)}
              className={["py-1.5 text-[10px] font-bold rounded-xl transition-all border", isDark ? "bg-white/5 border-transparent text-white hover:bg-white/10" : "bg-[#edf3f6] border-[#cedce4] text-blue-900 hover:bg-[#dbe7ee]"].join(" ")}
            >
              +250 ml
            </button>
            <button 
              onClick={() => updateWater(amount + 500)}
              className={["py-1.5 text-[10px] font-bold rounded-xl transition-all border", isDark ? "bg-white/5 border-transparent text-white hover:bg-white/10" : "bg-[#edf3f6] border-[#cedce4] text-blue-900 hover:bg-[#dbe7ee]"].join(" ")}
            >
              +500 ml
            </button>
            <button 
              onClick={() => updateWater(amount + 1000)}
              className={["py-1.5 text-[10px] font-bold rounded-xl transition-all border", isDark ? "bg-white/5 border-transparent text-white hover:bg-white/10" : "bg-[#edf3f6] border-[#cedce4] text-blue-900 hover:bg-[#dbe7ee]"].join(" ")}
            >
              +1000 ml
            </button>
            <button 
              onClick={() => updateWater(amount - 250)}
              disabled={amount <= 0}
              className={["py-1.5 text-[10px] font-bold rounded-xl transition-all border disabled:opacity-30", isDark ? "bg-rose-500/10 border-transparent text-rose-300 hover:bg-rose-500/20" : "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100"].join(" ")}
            >
              -250 ml
            </button>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes spin-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .water-wave-anim {
          animation: spin-slow 8s infinite linear;
        }
      `}</style>
    </DashboardPanel>
  );
}

function AppointmentBooking({ isDark, lang, accessToken }: { isDark: boolean; lang: string; accessToken: string }) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1); // default tomorrow
    return d.toISOString().split('T')[0];
  });
  const [selectedSlot, setSelectedSlot] = useState("");
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchAppointments = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await fetch("http://localhost:3000/api/appointments/client", {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const d = await res.json();
      const payload = d?.data ?? d;
      if (Array.isArray(payload)) {
        setAppointments(payload);
      }
    } catch {}
  }, [accessToken]);

  const fetchBookedSlots = useCallback(async () => {
    if (!accessToken || !date) return;
    try {
      const res = await fetch(`http://localhost:3000/api/appointments/booked-slots?date=${date}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const d = await res.json();
      const payload = d?.data ?? d;
      if (Array.isArray(payload)) {
        setBookedSlots(payload);
      } else {
        setBookedSlots([]);
      }
    } catch {
      setBookedSlots([]);
    }
  }, [accessToken, date]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  useEffect(() => {
    fetchBookedSlots();
    setSelectedSlot(""); // reset selected slot when date changes
  }, [date, fetchBookedSlots]);

  const handleBook = async () => {
    if (!selectedSlot) return;
    
    // Check if weekend
    const day = new Date(date).getDay();
    if (day === 0 || day === 6) {
      setToast({
        message: lang === "tr" ? "Randevular sadece hafta içi (Pazartesi-Cuma) alınabilir." : "Appointments can only be booked on weekdays (Monday-Friday).",
        type: 'error'
      });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:3000/api/appointments/book", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          date,
          time_slot: selectedSlot,
          notes
        })
      });
      const d = await res.json();
      if (res.ok) {
        setToast({
          message: lang === "tr" ? "Randevu talebiniz başarıyla iletildi!" : "Appointment requested successfully!",
          type: 'success'
        });
        setTimeout(() => setToast(null), 3000);
        setNotes("");
        setSelectedSlot("");
        fetchAppointments();
        fetchBookedSlots();
      } else {
        setToast({
          message: d.message || (lang === "tr" ? "Randevu alınamadı." : "Booking failed."),
          type: 'error'
        });
        setTimeout(() => setToast(null), 3000);
      }
    } catch {
      setToast({
        message: lang === "tr" ? "Bağlantı hatası." : "Connection error.",
        type: 'error'
      });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const slots = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];

  const getStatusLabel = (status: string) => {
    if (status === 'approved') return lang === "tr" ? "Onaylandı" : "Approved";
    if (status === 'cancelled') return lang === "tr" ? "İptal Edildi" : "Cancelled";
    if (status === 'rescheduled') return lang === "tr" ? "Ertelendi" : "Rescheduled";
    return lang === "tr" ? "Onay Bekliyor" : "Pending";
  };

  const getStatusColor = (status: string) => {
    if (status === 'approved') return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    if (status === 'cancelled') return "bg-rose-500/10 text-rose-400 border-rose-500/20";
    if (status === 'rescheduled') return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
  };

  return (
    <DashboardPanel isDark={isDark} className="p-5 flex flex-col justify-between">
      <div className="flex items-center gap-4 mb-4">
        <div className={["flex h-10 w-10 items-center justify-center rounded-2xl text-xl", isDark ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-100 text-emerald-600"].join(" ")}>
          📅
        </div>
        <div>
          <h2 className="text-sm font-black">{lang === "tr" ? "Diyetisyen Randevusu Al" : "Book Appointment"}</h2>
          <p className={["text-[11px]", isDark ? "text-zinc-400" : "text-[#4d6b62]"].join(" ")}>
            {lang === "tr" ? "Hafta içi 09:00-17:00 arası uygun saatleri seçin" : "Select weekday slots between 09:00-17:00"}
          </p>
        </div>
      </div>

      {toast && (
        <div className={["mb-3 rounded-xl border px-3 py-1.5 text-[11px] font-bold transition-all", 
          toast.type === 'success' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300" : "bg-rose-500/10 border-rose-500/20 text-rose-300"
        ].join(" ")}>
          {toast.message}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-3">
          <div>
            <label className={["block text-[10px] font-black uppercase tracking-wider mb-1", isDark ? "text-zinc-500" : "text-[#5e776e]"].join(" ")}>
              {lang === "tr" ? "Randevu Günü" : "Booking Date"}
            </label>
            <input 
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={["w-full rounded-xl border px-3 py-1.5 text-xs font-semibold outline-none transition", isDark ? "border-white/10 bg-black/40 text-white focus:border-emerald-500" : "border-[#325d51]/10 bg-white text-[#0e2d27] focus:border-emerald-500"].join(" ")}
            />
          </div>

          <div>
            <label className={["block text-[10px] font-black uppercase tracking-wider mb-1", isDark ? "text-zinc-500" : "text-[#5e776e]"].join(" ")}>
              {lang === "tr" ? "Not (İsteğe Bağlı)" : "Notes (Optional)"}
            </label>
            <textarea
              rows={2}
              placeholder={lang === "tr" ? "Randevu notu..." : "Appointment notes..."}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={["w-full rounded-xl border px-3 py-1.5 text-xs font-semibold outline-none transition resize-none", isDark ? "border-white/10 bg-black/40 text-white focus:border-emerald-500" : "border-[#325d51]/10 bg-white text-[#0e2d27] focus:border-emerald-500"].join(" ")}
            />
          </div>
        </div>

        <div>
          <label className={["block text-[10px] font-black uppercase tracking-wider mb-1", isDark ? "text-zinc-500" : "text-[#5e776e]"].join(" ")}>
            {lang === "tr" ? "Saat Dilimi" : "Time Slot"}
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {slots.map((slot) => {
              const isBooked = bookedSlots.includes(slot);
              const isSelected = selectedSlot === slot;
              return (
                <button
                  key={slot}
                  type="button"
                  disabled={isBooked}
                  onClick={() => setSelectedSlot(slot)}
                  className={["py-1.5 text-[10px] font-bold rounded-xl transition-all border shrink-0", 
                    isBooked ? (isDark ? "bg-white/5 border-transparent text-zinc-600 cursor-not-allowed opacity-30" : "bg-zinc-100 border-transparent text-zinc-400 cursor-not-allowed") :
                    isSelected ? "bg-emerald-500 text-white border-transparent shadow-lg shadow-emerald-500/25 scale-105" :
                    isDark ? "bg-white/5 border-transparent text-white hover:bg-white/10" : "bg-[#edf6ec] border-[#c7dbc7] text-[#285743] hover:bg-[#edf6ec]/80"
                  ].join(" ")}
                >
                  {slot}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            disabled={loading || !selectedSlot}
            onClick={handleBook}
            className={["w-full mt-3 py-2 text-xs font-black rounded-xl transition-all disabled:opacity-40", isDark ? "bg-emerald-400 text-zinc-950 hover:brightness-110" : "bg-[#2f6154] text-white hover:bg-[#244f44]"].join(" ")}
          >
            {loading ? "..." : lang === "tr" ? "Talep Gönder" : "Request"}
          </button>
        </div>
      </div>

      {appointments.length > 0 && (
        <div className="mt-4 border-t border-dashed border-emerald-500/10 pt-3">
          <label className={["block text-[10px] font-black uppercase tracking-wider mb-2", isDark ? "text-zinc-500" : "text-[#5e776e]"].join(" ")}>
            {lang === "tr" ? "Son Randevu Taleplerim" : "My Appointments"}
          </label>
          <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
            {appointments.slice(0, 3).map((app) => (
              <div key={app.id} className={["flex items-center justify-between border px-2.5 py-1.5 text-[11px]", isDark ? "rounded-xl border-transparent bg-white/5" : "rounded-xl border-[#e4dbc9] bg-white"].join(" ")}>
                <div>
                  <div className="font-bold">{app.date} @ {app.time_slot}</div>
                </div>
                <span className={["rounded-full border px-1.5 py-0.5 text-[8px] font-bold", getStatusColor(app.status)].join(" ")}>
                  {getStatusLabel(app.status)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardPanel>
  );
}
