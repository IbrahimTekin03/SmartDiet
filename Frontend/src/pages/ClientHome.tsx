import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DashboardMessagesLink, DashboardPanel, DashboardSectionHeader, DashboardShell, DashboardStatCard, dashboardButtonClass } from "../components/DashboardShell";
import { useAppSettings } from "../context/AppSettingsContext";
import { useSocket } from "../context/SocketContext";
import { clearAuthSession, useAuthSession } from "../lib/authSession";
import { API_BASE_URL as API_BASE } from "../lib/api";
import { 
  Activity, 
  Utensils, 
  Droplets, 
  Calendar, 
  User, 
  Clock, 
  Sparkles, 
  ChevronRight, 
  Plus, 
  Minus, 
  CheckCircle2, 
  ShieldCheck, 
  MessageSquare, 
  TrendingUp, 
  Scale, 
  Percent, 
  Building2, 
  MapPin, 
  Mail, 
  AlertCircle,
  ExternalLink,
  ChevronDown
} from "lucide-react";

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

const COPY = {
  tr: {
    title: "Danışan Kontrol Paneli",
    subtitle: "Günlük beslenme, su tüketimi, randevular ve ölçümlerinizi tek ekranda takip edin.",
    welcome: "Tekrar Hoş Geldiniz,",
    fallbackUser: "Danışan",
    profile: "Profilim",
    logout: "Çıkış Yap",
    overview: "Genel Bakış",
    overviewSub: "Hesabınıza bağlı güncel sağlık ve uyum metrikleri",
    summaryErr: "Özet verileri şu anda alınamıyor.",
    statPlans: "Aktif Diyet Planları",
    statMessages: "Okunmamış Mesajlar",
    statAdherence: "Program Uyumu",
    statExperts: "Bağlı Uzman",
    quickTitle: "Hızlı İşlemler",
    quickSub: "En sık kullanılan alanlara hızlı erişim",
    quickProfile: "Profili Güncelle",
    activityTitle: "Günlük Rutin & Hedefler",
    activitySub: "Sağlıklı bir gün için önerilen adımlar",
    accountTitle: "Hesap Bilgileri",
    accountSub: "Aktif oturum bilgileri",
    mail: "E-posta",
    phone: "Telefon",
    status: "Durum",
    statusActive: "Aktif Danışan",
    statusReady: "Kullanıma Hazır",
    measurements: "Biyometrik Ölçüm Geçmişi",
    measurementsSub: "Kilo ve yağ oranı takipleriniz",
    latestWeight: "Güncel Ağırlık",
    latestFat: "Vücut Yağ Oranı",
    recentRecords: "Son Kaydedilen Ölçümler",
    assignedTitle: "Klinik & Sorumlu Diyetisyen",
    assignedSub: "Beslenme programınızı hazırlayan ve sizi takip eden uzmanınız",
    assignedNone: "Henüz atanmış bir diyetisyeniniz bulunmuyor.",
    assignedClinic: "Klinik",
    assignedCity: "Lokasyon",
    assignedNote: "Bağlantı Notu",
    assignedBadge: "Uzman Diyetisyen",
    openMessages: "Mesaj Gönder",
    planSection: "Aktif Beslenme & Diyet Planlarım",
    planSectionSub: "Diyetisyeniniz tarafından size özel oluşturulmuş haftalık ve günlük öğünler",
    planOpen: "Plan Detayını Aç",
    noPlans: "Henüz atanmış aktif bir beslenme programı bulunmamaktadır.",
    noMeasurements: "Henüz kaydedilmiş ölçüm verisi bulunmamaktadır.",
    measurementErr: "Ölçüm verileri şu anda alınamıyor.",
    clinicRequiredTitle: "Klinik Seçimi Zorunlu",
    clinicRequiredText: "Size uygun bir diyetisyen atanabilmesi için lütfen bağlı olduğunuz kliniği seçiniz.",
    clinicSelectPlaceholder: "Lütfen bir klinik seçiniz...",
    saveClinic: "Kliniği Kaydet ve Devam Et",
    savingClinic: "Kaydediliyor...",
    skipClinic: "Şimdilik Geç (Deneysel)",
    empty: "Belirtilmemiş",
  },
  en: {
    title: "Client Dashboard",
    subtitle: "Track your daily meals, water intake, appointments, and measurements in one hub.",
    welcome: "Welcome Back,",
    fallbackUser: "Client",
    profile: "Profile",
    logout: "Log Out",
    overview: "Overview",
    overviewSub: "Live telemetry and adherence metrics",
    summaryErr: "Summary data is unavailable right now.",
    statPlans: "Active Meal Plans",
    statMessages: "Unread Messages",
    statAdherence: "Diet Adherence",
    statExperts: "Assigned Dietitians",
    quickTitle: "Quick Actions",
    quickSub: "Direct shortcuts to important features",
    quickProfile: "Update Profile",
    activityTitle: "Daily Checklist",
    activitySub: "Recommended steps for a healthy day",
    accountTitle: "Account Profile",
    accountSub: "Signed-in account details",
    mail: "Email",
    phone: "Phone",
    status: "Status",
    statusActive: "Active Client",
    statusReady: "Ready to Use",
    measurements: "Biometric History",
    measurementsSub: "Body weight and body fat trends",
    latestWeight: "Current Weight",
    latestFat: "Body Fat %",
    recentRecords: "Recent Logs",
    assignedTitle: "Your Assigned Dietitian",
    assignedSub: "The practitioner supervising your nutrition and wellness goals",
    assignedNone: "No dietitian assigned to your account yet.",
    assignedClinic: "Clinic",
    assignedCity: "City",
    assignedNote: "Note",
    assignedBadge: "Practitioner",
    openMessages: "Direct Message",
    planSection: "My Meal & Nutrition Plans",
    planSectionSub: "Tailored nutritional guidelines assigned by your dietitian",
    planOpen: "View Diet Plan",
    noPlans: "No active nutrition plans found.",
    noMeasurements: "No measurement records found.",
    measurementErr: "Measurement data is unavailable right now.",
    clinicRequiredTitle: "Clinic Selection Required",
    clinicRequiredText: "Please select your clinic to connect with your dietitian.",
    clinicSelectPlaceholder: "Select clinic...",
    saveClinic: "Save Clinic & Continue",
    savingClinic: "Saving...",
    skipClinic: "Skip for now",
    empty: "Not provided",
  },
};

export default function ClientHome({ profile }: { profile: Profile }) {
  const navigate = useNavigate();
  const { lang, isDark } = useAppSettings();
  const { accessToken } = useAuthSession();
  const { unreadMessageCount } = useSocket();
  const t = COPY[lang] || COPY.tr;
  
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
  const [showPastPlans, setShowPastPlans] = useState(false);
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

  const latestMeasurement = measurements.length ? measurements[measurements.length - 1] : null;
  const recentMeasurements = measurements.slice(-4).reverse();

  return (
    <DashboardShell
      isDark={isDark}
      badge={t.statusReady}
      title={`${t.welcome} ${displayName}`}
      subtitle={t.subtitle}
    >
      <section>
        <DashboardSectionHeader isDark={isDark} title={t.overview} subtitle={t.overviewSub} />
        {summaryError && <div className="mb-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-xs text-rose-300">{summaryError}</div>}
        
        <div className="grid gap-4 sm:grid-cols-3">
          <DashboardStatCard 
            isDark={isDark} 
            title={t.statPlans} 
            value={loadingSummary ? "..." : String(dietPlans.length || summary.plans)} 
            accent="from-emerald-400/20 to-teal-400/10" 
          />
          <DashboardStatCard 
            isDark={isDark} 
            title={t.statAdherence} 
            value={loadingSummary ? "..." : `%${summary.adherence || 92}`} 
            accent="from-cyan-400/20 to-blue-400/10" 
          />
          <DashboardStatCard 
            isDark={isDark} 
            title={t.statExperts} 
            value={network.assignedDietitian ? "1" : "0"} 
            accent="from-teal-400/20 to-emerald-400/10" 
          />
        </div>
      </section>

      <section>
        <DashboardPanel isDark={isDark} className="overflow-hidden">
          <DashboardSectionHeader isDark={isDark} title={t.assignedTitle} subtitle={t.assignedSub} />
          
          {network.assignedDietitian ? (
            <div className={`p-5 rounded-2xl border transition-all ${
              isDark ? "border-white/10 bg-slate-900/60 shadow-lg shadow-black/40" : "border-slate-200 bg-white shadow-md"
            }`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-md shadow-emerald-500/20">
                    <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-[#040711] text-emerald-400 font-display font-black text-lg">
                      {(network.assignedDietitian.name || "D").slice(0, 2).toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-base font-black tracking-tight">{network.assignedDietitian.name || t.empty}</h3>
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                        <ShieldCheck className="h-3 w-3" />
                        {t.assignedBadge}
                      </span>
                    </div>
                    <div className={`mt-1 flex items-center gap-2 text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      <Building2 className="h-3.5 w-3.5 text-emerald-400" />
                      <span>{network.assignedDietitian.clinic_name || t.empty}</span>
                      {network.assignedDietitian.clinic_city && (
                        <>
                          <span>•</span>
                          <MapPin className="h-3.5 w-3.5 text-cyan-400" />
                          <span>{network.assignedDietitian.clinic_city}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Link
                    to="/messages"
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-2.5 text-xs font-black text-slate-950 shadow-md shadow-emerald-500/20 hover:bg-emerald-400 transition"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>{t.openMessages}</span>
                  </Link>
                </div>
              </div>

              {network.assignedDietitian.email && (
                <div className={`mt-4 pt-3 border-t flex items-center gap-2 text-xs ${
                  isDark ? "border-white/5 text-slate-400" : "border-slate-100 text-slate-500"
                }`}>
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  <span>{network.assignedDietitian.email}</span>
                </div>
              )}
            </div>
          ) : (
            <div className={`p-8 rounded-2xl border text-center text-xs font-semibold ${
              isDark ? "border-dashed border-white/10 bg-slate-900/40 text-slate-400" : "border-dashed border-slate-200 bg-slate-50 text-slate-500"
            }`}>
              <AlertCircle className="mx-auto h-6 w-6 text-amber-400 mb-2 opacity-80" />
              <span>{t.assignedNone}</span>
            </div>
          )}
        </DashboardPanel>
      </section>

      <section>
        <DashboardPanel isDark={isDark}>
          <DashboardSectionHeader isDark={isDark} title={t.planSection} subtitle={t.planSectionSub} />
          
          {dietPlans.length > 0 ? (
            <div className="space-y-4">
              {(() => {
                const isPastPlan = (plan: any) => {
                  let startStr = "";
                  const m = plan.description?.match(/Başlangıç Tarihi:\s*(\d{4}-\d{2}-\d{2})/);
                  if (m) startStr = m[1];
                  else startStr = plan.created_at?.split("T")[0];
                  if (!startStr) return false;

                  const startDate = new Date(startStr);
                  let days = 7;
                  if (plan.plan_type === "daily") days = 1;
                  else if (plan.plan_type === "monthly") days = 30;

                  const endDate = new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return endDate < today;
                };

                const currentPlans = dietPlans.filter((p) => !isPastPlan(p));
                const pastPlans = dietPlans.filter((p) => isPastPlan(p));

                const renderPlan = (plan: any) => {
                  const planTypeLabel = plan.plan_type === "daily" ? (lang === "tr" ? "Günlük Plan" : "Daily Plan") : plan.plan_type === "monthly" ? (lang === "tr" ? "Aylık Plan" : "Monthly Plan") : (lang === "tr" ? "Haftalık Plan" : "Weekly Plan");

                  return (
                    <Link
                      key={plan.id}
                      to={`/plan/${plan.id}`}
                      className={`group relative flex flex-col justify-between p-5 rounded-2xl border transition-all hover:-translate-y-1 ${
                        isDark ? "border-white/10 bg-slate-900/60 hover:border-emerald-500/40 hover:bg-slate-900/90 shadow-lg" : "border-slate-200 bg-white hover:border-emerald-500/40 hover:shadow-xl"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-0.5 text-xs font-black text-emerald-400 uppercase tracking-wider">
                            <Sparkles className="h-3.5 w-3.5" />
                            {planTypeLabel}
                          </span>
                          <span className="text-xs font-mono font-medium text-slate-400">
                            {new Date(plan.created_at || new Date()).toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US")}
                          </span>
                        </div>

                        <h3 className={`font-display text-base font-black tracking-tight transition ${
                          isDark ? "text-white group-hover:text-emerald-400" : "text-slate-900 group-hover:text-emerald-600"
                        }`}>
                          {plan.title}
                        </h3>

                        {plan.description && (
                          <p className={`mt-2 line-clamp-2 text-xs sm:text-sm leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                            {plan.description}
                          </p>
                        )}
                      </div>

                      <div className={`mt-5 pt-3.5 border-t flex items-center justify-between ${
                        isDark ? "border-white/10" : "border-slate-200"
                      }`}>
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 font-mono text-xs font-black">
                            {plan.meals?.length || 0}
                          </div>
                          <span className={`text-xs font-bold ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                            {lang === "tr" ? "Öğün Bulunuyor" : "Meals Included"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs font-black text-emerald-400 group-hover:translate-x-1 transition">
                          <span>{t.planOpen}</span>
                          <ChevronRight className="h-4 w-4 stroke-[2.5]" />
                        </div>
                      </div>
                    </Link>

                  );
                };

                return (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {currentPlans.length > 0 ? (
                        currentPlans.map(renderPlan)
                      ) : (
                        <div className={`col-span-full p-6 text-center rounded-2xl border text-xs font-semibold ${
                          isDark ? "border-white/5 bg-black/20 text-slate-500" : "border-slate-200 bg-slate-50 text-slate-500"
                        }`}>
                          {lang === "tr" ? "Aktif diyet programınız bulunmuyor." : "No current active meal plans."}
                        </div>
                      )}
                    </div>

                    {pastPlans.length > 0 && (
                      <div className="mt-4 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowPastPlans(!showPastPlans)}
                          className={`w-full flex items-center justify-between p-4 rounded-2xl border text-xs font-bold transition ${
                            isDark ? "border-white/10 bg-slate-900/40 text-slate-300 hover:bg-slate-900/80" : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <span>{lang === "tr" ? "Geçmiş Programlar" : "Archived Plans"} ({pastPlans.length})</span>
                          <ChevronDown className={`h-4 w-4 transition-transform ${showPastPlans ? "rotate-180" : ""}`} />
                        </button>

                        {showPastPlans && (
                          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-fadeInUp">
                            {pastPlans.map(renderPlan)}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          ) : (
            <div className={`p-8 rounded-2xl border text-center text-xs font-semibold ${
              isDark ? "border-dashed border-white/10 bg-slate-900/40 text-slate-400" : "border-dashed border-slate-200 bg-slate-50 text-slate-500"
            }`}>
              <Utensils className="mx-auto h-6 w-6 text-slate-500 mb-2" />
              <span>{t.noPlans}</span>
            </div>
          )}
        </DashboardPanel>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <WaterTracker isDark={isDark} lang={lang} accessToken={accessToken || ""} />
        <AppointmentBooking isDark={isDark} lang={lang} accessToken={accessToken || ""} />
      </div>

      <DashboardPanel isDark={isDark}>
        <DashboardSectionHeader
          isDark={isDark}
          title={t.measurements}
          subtitle={t.measurementsSub}
        />

        {measurementError && (
          <div className="mb-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-xs text-rose-300">
            {measurementError}
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-4 grid sm:grid-cols-2 lg:grid-cols-1 gap-3">
            <div className={`p-5 rounded-2xl border ${
              isDark ? "border-white/10 bg-slate-900/60" : "border-slate-200 bg-white"
            }`}>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">
                <Scale className="h-4 w-4" />
                <span>{t.latestWeight}</span>
              </div>
              <div className="font-display text-3xl font-black">
                {latestMeasurement?.weight != null ? `${latestMeasurement.weight} kg` : t.empty}
              </div>
            </div>

            <div className={`p-5 rounded-2xl border ${
              isDark ? "border-white/10 bg-slate-900/60" : "border-slate-200 bg-white"
            }`}>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400 mb-2">
                <Percent className="h-4 w-4" />
                <span>{t.latestFat}</span>
              </div>
              <div className="font-display text-3xl font-black">
                {latestMeasurement?.body_fat != null ? `%${latestMeasurement.body_fat}` : t.empty}
              </div>
            </div>
          </div>

          <div className={`lg:col-span-8 p-5 rounded-2xl border ${
            isDark ? "border-white/10 bg-slate-900/60" : "border-slate-200 bg-white"
          }`}>
            <h4 className="font-display text-sm font-black mb-3">{t.recentRecords}</h4>
            <div className="space-y-2">
              {recentMeasurements.length ? (
                recentMeasurements.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold ${
                      isDark ? "border-white/5 bg-black/20" : "border-slate-100 bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-mono">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>{item.date}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-emerald-400">{item.weight != null ? `${item.weight} kg` : t.empty}</span>
                      <span className="text-cyan-400">{item.body_fat != null ? `%${item.body_fat}` : t.empty}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className={`p-6 text-center text-xs font-semibold ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                  {t.noMeasurements}
                </div>
              )}
            </div>
          </div>
        </div>
      </DashboardPanel>

      {!profile.clinic_id && !clinicPromptSkipped && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeInUp">
          <div className={`w-full max-w-md rounded-[32px] border p-8 shadow-2xl ${
            isDark ? "border-white/10 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-900"
          }`}>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 mb-4">
              <Building2 className="h-6 w-6" />
            </div>
            <h2 className="font-display text-xl font-black">{t.clinicRequiredTitle}</h2>
            <p className={`mt-2 text-xs leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              {t.clinicRequiredText}
            </p>
            
            <select
              value={selectedClinic}
              onChange={(e) => setSelectedClinic(e.target.value)}
              className={`mt-6 w-full rounded-2xl border px-4 py-3.5 text-xs font-semibold outline-none transition ${
                isDark ? "border-white/10 bg-black/40 text-white focus:border-emerald-500" : "border-slate-200 bg-slate-50 text-slate-900 focus:border-emerald-500"
              }`}
            >
              <option value="">{t.clinicSelectPlaceholder}</option>
              {clinics.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.city})
                </option>
              ))}
            </select>
            
            <button
              onClick={saveClinic}
              disabled={!selectedClinic || savingClinic}
              className="w-full mt-4 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 py-3.5 text-xs font-black text-slate-950 shadow-lg shadow-emerald-500/25 hover:brightness-110 transition disabled:opacity-50"
            >
              <span>{savingClinic ? t.savingClinic : t.saveClinic}</span>
            </button>
            <button
              type="button"
              onClick={skipClinicPrompt}
              className={`w-full mt-2 rounded-2xl border py-2.5 text-xs font-bold transition ${
                isDark ? "border-white/10 bg-white/5 text-slate-400 hover:text-white" : "border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {t.skipClinic}
            </button>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

function WaterTracker({ isDark, lang, accessToken }: { isDark: boolean; lang: string; accessToken: string }) {
  const [amount, setAmount] = useState(0);
  const target = 3000;
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const localTime = new Date(d.getTime() - offset * 60 * 1000);
    return localTime.toISOString().slice(0, 10);
  });

  useEffect(() => {
    if (!accessToken) return;
    fetch(`${API_BASE}/api/water-tracking/today?date=${selectedDate}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => res.json())
      .then((d) => {
        const payload = d?.data ?? d;
        setAmount(payload ? Number(payload.amount) || 0 : 0);
      })
      .catch(() => setAmount(0));
  }, [accessToken, selectedDate]);

  const updateWater = async (newAmount: number) => {
    const finalVal = Math.max(0, newAmount);
    setAmount(finalVal);

    try {
      await fetch(`${API_BASE}/api/water-tracking`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ amount: finalVal, date: selectedDate }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const pct = Math.min(100, Math.round((amount / target) * 100));

  return (
    <DashboardPanel isDark={isDark} className="p-6 flex flex-col justify-between">
      <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-400 shadow-md shadow-cyan-500/15">
            <Droplets className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-sm font-black">{lang === "tr" ? "Günlük Su Tüketimi" : "Hydration Tracker"}</h3>
            <p className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              {lang === "tr" ? "Hidrasyon hedefinizi takip edin" : "Daily 3000ml Target"}
            </p>
          </div>
        </div>

        <input
          type="date"
          value={selectedDate}
          max={new Date().toISOString().slice(0, 10)}
          onChange={(e) => setSelectedDate(e.target.value)}
          className={`rounded-xl px-2.5 py-1 text-xs font-mono font-semibold outline-none border ${
            isDark ? "border-white/10 bg-black/40 text-slate-300" : "border-slate-200 bg-slate-50 text-slate-800"
          }`}
        />
      </div>

      <div className="flex items-center gap-6 py-2">
        <div className="relative h-28 w-16 rounded-2xl border-2 border-cyan-500/30 overflow-hidden bg-cyan-500/5 flex items-center justify-center shrink-0">
          <div
            className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-cyan-600 to-cyan-400 transition-all duration-500"
            style={{ height: `${pct}%` }}
          />
          <span className="relative z-10 text-xs font-black drop-shadow text-white">
            %{pct}
          </span>
        </div>

        <div className="flex-1 space-y-3">
          <div>
            <div className="font-display text-2xl font-black text-cyan-400">
              {amount} <span className="text-xs font-semibold text-slate-400">/ {target} ml</span>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            <button
              type="button"
              onClick={() => updateWater(amount + 250)}
              className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 py-1.5 text-[10px] font-black text-cyan-300 hover:bg-cyan-500/20 transition"
            >
              +250ml
            </button>
            <button
              type="button"
              onClick={() => updateWater(amount + 500)}
              className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 py-1.5 text-[10px] font-black text-cyan-300 hover:bg-cyan-500/20 transition"
            >
              +500ml
            </button>
            <button
              type="button"
              onClick={() => updateWater(amount + 1000)}
              className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 py-1.5 text-[10px] font-black text-cyan-300 hover:bg-cyan-500/20 transition"
            >
              +1L
            </button>
            <button
              type="button"
              disabled={amount <= 0}
              onClick={() => updateWater(amount - 250)}
              className="rounded-xl border border-rose-500/30 bg-rose-500/10 py-1.5 text-[10px] font-black text-rose-300 hover:bg-rose-500/20 transition disabled:opacity-40"
            >
              -250ml
            </button>
          </div>
        </div>
      </div>
    </DashboardPanel>
  );
}

function AppointmentBooking({ isDark, lang, accessToken }: { isDark: boolean; lang: string; accessToken: string }) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [selectedSlot, setSelectedSlot] = useState("");
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const fetchAppointments = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${API_BASE}/api/appointments/client`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const d = await res.json();
      const payload = d?.data ?? d;
      if (Array.isArray(payload)) setAppointments(payload);
    } catch {}
  }, [accessToken]);

  const fetchBookedSlots = useCallback(async () => {
    if (!accessToken || !date) return;
    try {
      const res = await fetch(`${API_BASE}/api/appointments/booked-slots?date=${date}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const d = await res.json();
      const payload = d?.data ?? d;
      setBookedSlots(Array.isArray(payload) ? payload : []);
    } catch {
      setBookedSlots([]);
    }
  }, [accessToken, date]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  useEffect(() => {
    fetchBookedSlots();
    setSelectedSlot("");
  }, [date, fetchBookedSlots]);

  const handleBook = async () => {
    if (!selectedSlot) return;

    const day = new Date(date).getDay();
    if (day === 0 || day === 6) {
      setToast({
        message: lang === "tr" ? "Randevular yalnızca hafta içi alınabilir." : "Appointments available weekdays only.",
        type: "error",
      });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/appointments/book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ date, time_slot: selectedSlot, notes }),
      });
      if (res.ok) {
        setToast({
          message: lang === "tr" ? "Randevu talebiniz başarıyla oluşturuldu!" : "Appointment requested successfully!",
          type: "success",
        });
        setTimeout(() => setToast(null), 3000);
        setNotes("");
        setSelectedSlot("");
        fetchAppointments();
        fetchBookedSlots();
      }
    } catch {
      setToast({ message: "Error booking appointment", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const slots = ["09:00 - 09:45", "10:00 - 10:45", "11:00 - 11:45", "14:00 - 14:45", "15:00 - 15:45", "16:00 - 16:45"];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30";
      case "rejected": return "bg-rose-500/15 text-rose-400 border border-rose-500/30";
      case "rescheduled": return "bg-amber-500/15 text-amber-400 border border-amber-500/30";
      default: return "bg-sky-500/15 text-sky-400 border border-sky-500/30";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "approved": return lang === "tr" ? "Onaylandı" : "Approved";
      case "rejected": return lang === "tr" ? "Reddedildi" : "Rejected";
      case "rescheduled": return lang === "tr" ? "Ertelendi" : "Rescheduled";
      default: return lang === "tr" ? "Beklemede" : "Pending";
    }
  };

  return (
    <DashboardPanel isDark={isDark} className="p-6 flex flex-col justify-between">
      <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 shadow-md shadow-emerald-500/15">
            <Calendar className="h-5 w-5" />
          </div>

          <div>
            <h3 className="font-display text-sm font-black">{lang === "tr" ? "Görüşme Randevusu" : "Book Appointment"}</h3>
            <p className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              {lang === "tr" ? "Diyetisyeninizle seans planlayın" : "Consultation booking"}
            </p>
          </div>
        </div>

        <input
          type="date"
          value={date}
          min={new Date().toISOString().split("T")[0]}
          onChange={(e) => setDate(e.target.value)}
          className={`rounded-xl px-2.5 py-1 text-xs font-mono font-semibold outline-none border ${
            isDark ? "border-white/10 bg-black/40 text-slate-300" : "border-slate-200 bg-slate-50 text-slate-800"
          }`}
        />
      </div>

      {toast && (
        <div className={`p-3 rounded-2xl text-xs font-bold mb-4 ${
          toast.type === "success" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
        }`}>
          {toast.message}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className={`block text-[10px] font-black uppercase tracking-wider mb-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            {lang === "tr" ? "Not (İsteğe Bağlı)" : "Notes (Optional)"}
          </label>
          <textarea
            rows={2}
            placeholder={lang === "tr" ? "Randevu notu..." : "Appointment notes..."}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={`w-full rounded-2xl border px-3 py-2 text-xs font-semibold outline-none resize-none ${
              isDark ? "border-white/10 bg-black/40 text-white focus:border-emerald-500" : "border-slate-200 bg-white text-slate-900 focus:border-emerald-500"
            }`}
          />
        </div>

        <div>
          <label className={`block text-[10px] font-black uppercase tracking-wider mb-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            {lang === "tr" ? "Saat Dilimi" : "Time Slot"}
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            {slots.map((slot) => {
              const isBooked = bookedSlots.includes(slot);
              const isSelected = selectedSlot === slot;
              return (
                <button
                  key={slot}
                  type="button"
                  disabled={isBooked}
                  onClick={() => setSelectedSlot(slot)}
                  className={`py-2 text-[10px] font-mono font-bold rounded-xl transition border text-center ${
                    isBooked
                      ? "opacity-30 border-transparent bg-white/5 cursor-not-allowed text-slate-500"
                      : isSelected
                      ? "bg-emerald-500 text-slate-950 border-transparent font-black shadow-lg shadow-emerald-500/30 scale-105"
                      : isDark
                      ? "bg-black/30 border-white/5 text-slate-300 hover:bg-white/10"
                      : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
                  }`}
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
            className="w-full mt-4 py-2.5 text-xs font-black rounded-2xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 transition disabled:opacity-40"
          >
            {loading ? "..." : lang === "tr" ? "Randevu Talebi Gönder" : "Request Appointment"}
          </button>
        </div>

        {appointments.length > 0 && (
          <div className="mt-4 border-t border-white/5 pt-3">
            <label className={`block text-[10px] font-black uppercase tracking-wider mb-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              {lang === "tr" ? "Son Randevu Taleplerim" : "My Appointments"}
            </label>
            <div className="space-y-2 max-h-28 overflow-y-auto pr-1">
              {appointments.slice(0, 3).map((app) => (
                <div key={app.id} className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${
                  isDark ? "border-white/5 bg-black/20" : "border-slate-200 bg-slate-50"
                }`}>
                  <div className="font-bold font-mono text-[11px]">{app.date} @ {app.time_slot}</div>
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${getStatusColor(app.status)}`}>
                    {getStatusLabel(app.status)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardPanel>
  );
}

