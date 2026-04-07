import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DashboardPanel, DashboardSectionHeader, DashboardShell, DashboardStatCard, dashboardButtonClass } from "../components/DashboardShell";
import { RoleWorkspaceBoard, type WorkspaceItem } from "../components/RoleWorkspaceBoard";
import { useAppSettings } from "../context/AppSettingsContext";
import { clearAuthSession, useAuthSession } from "../lib/authSession";

type Profile = {
  first_name?: string;
  last_name?: string;
  display_name?: string;
  full_name?: string;
  email?: string;
  phone_number?: string;
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
    empty: "Not provided",
  },
} as const;

export default function ClientHome({ profile }: { profile: Profile }) {
  const navigate = useNavigate();
  const { lang, isDark } = useAppSettings();
  const { accessToken } = useAuthSession();
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
  const [network, setNetwork] = useState<WorkspaceNetwork>({});
  const notesStorageKey = useMemo(
    () => `sd-client-notes:${profile.email || profile.phone_number || profile.display_name || "default"}`,
    [profile.display_name, profile.email, profile.phone_number],
  );
  const [dailyNotes, setDailyNotes] = useState("");

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
    setDailyNotes(localStorage.getItem(notesStorageKey) || "");
  }, [notesStorageKey]);

  useEffect(() => {
    localStorage.setItem(notesStorageKey, dailyNotes);
  }, [dailyNotes, notesStorageKey]);

  const onLogout = () => {
    clearAuthSession();
    navigate("/login", { replace: true });
  };

  const summaryCards = [
    { label: t.statPlans, value: summary.plans, tone: "from-emerald-400/20 to-teal-300/10" },
    { label: t.statMessages, value: summary.messages, tone: "from-sky-400/20 to-cyan-300/10" },
    { label: t.statAdherence, value: `${summary.adherence}%`, tone: "from-amber-400/20 to-orange-300/10" },
    { label: t.statExperts, value: summary.activeClients, tone: "from-fuchsia-400/20 to-pink-300/10" },
  ];

  const quickActions = [
    { title: t.quickProfile, text: t.quickProfileText, to: "/profile" },
    { title: t.quickStart, text: t.quickStartText, to: "/" },
    { title: t.quickSupport, text: t.quickSupportText, to: "/profile" },
  ];
  const workspaceItems: WorkspaceItem[] = [
    { id: "profile", title: t.w1, description: t.w1d },
    { id: "measurements", title: t.w2, description: t.w2d },
    { id: "plan", title: t.w3, description: t.w3d },
    { id: "support", title: t.w4, description: t.w4d },
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
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <DashboardStatCard key={card.label} isDark={isDark} title={card.label} value={loadingSummary ? "..." : String(card.value)} accent={card.tone} />
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <DashboardPanel isDark={isDark}>
          <DashboardSectionHeader isDark={isDark} title={t.quickTitle} subtitle={t.quickSub} />
          <div className="grid gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.title}
                to={action.to}
                className={["group rounded-[22px] border p-4 transition", isDark ? "border-white/10 bg-black/20 hover:bg-white/5" : "border-[#2f6154]/15 bg-[#f7faf8] hover:bg-white"].join(" ")}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-extrabold">{action.title}</div>
                    <div className={["mt-1 text-sm leading-6", isDark ? "text-zinc-300" : "text-[#4d6b62]"].join(" ")}>{action.text}</div>
                  </div>
                  <span className={["rounded-full px-3 py-1 text-[11px] font-bold", isDark ? "bg-emerald-500/10 text-emerald-200" : "bg-emerald-100 text-emerald-800"].join(" ")}>Go</span>
                </div>
              </Link>
            ))}
          </div>
        </DashboardPanel>

        <div className="grid gap-6">
          <DashboardPanel isDark={isDark}>
            <DashboardSectionHeader isDark={isDark} title={t.activityTitle} subtitle={t.activitySub} />
            <div className="space-y-3">
              {[t.activityA, t.activityB, t.activityC].map((item, index) => (
                <div key={item} className="flex gap-3">
                  <div className={["mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold", isDark ? "bg-emerald-500/15 text-emerald-200" : "bg-emerald-100 text-emerald-800"].join(" ")}>
                    {index + 1}
                  </div>
                  <div className={["text-sm leading-6", isDark ? "text-zinc-300" : "text-[#36544c]"].join(" ")}>{item}</div>
                </div>
              ))}
            </div>
          </DashboardPanel>

          <DashboardPanel isDark={isDark}>
            <DashboardSectionHeader isDark={isDark} title={t.accountTitle} subtitle={t.accountSub} />
            <div className="space-y-3">
              <InfoRow isDark={isDark} label={t.mail} value={profile.email || t.empty} />
              <InfoRow isDark={isDark} label={t.phone} value={profile.phone_number || t.empty} />
              <InfoRow isDark={isDark} label={t.status} value={t.statusActive} />
            </div>
          </DashboardPanel>

          <DashboardPanel isDark={isDark}>
            <DashboardSectionHeader isDark={isDark} title={t.notesTitle} subtitle={t.notesSub} />
            <textarea
              value={dailyNotes}
              onChange={(event) => setDailyNotes(event.target.value)}
              placeholder={t.notesPlaceholder}
              rows={5}
              className={[
                "w-full resize-none rounded-[22px] border px-4 py-3 text-sm outline-none transition",
                isDark
                  ? "border-white/10 bg-black/20 text-white placeholder:text-zinc-500 focus:border-emerald-400/40"
                  : "border-[#2f6154]/15 bg-[#f7faf8] text-[#123a32] placeholder:text-[#70867f] focus:border-[#1f705a]/30",
              ].join(" ")}
            />
          </DashboardPanel>
        </div>
      </section>

      <section>
        <RoleWorkspaceBoard
          isDark={isDark}
          title={t.workspaceTitle}
          subtitle={t.workspaceSub}
          items={workspaceItems}
          storageKey={`sd-client-workspace:${profile.email || profile.phone_number || displayName}`}
        />
      </section>

      <section>
        <DashboardPanel isDark={isDark}>
          <DashboardSectionHeader isDark={isDark} title={t.assignedTitle} subtitle={t.assignedSub} />
          {network.assignedDietitian ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <InfoRow isDark={isDark} label={t.assignedTitle} value={network.assignedDietitian.name || t.empty} />
              <InfoRow isDark={isDark} label={t.mail} value={network.assignedDietitian.email || t.empty} />
              <InfoRow isDark={isDark} label={t.assignedClinic} value={network.assignedDietitian.clinic_name || t.empty} />
              <InfoRow isDark={isDark} label={t.assignedCity} value={network.assignedDietitian.clinic_city || t.empty} />
            </div>
          ) : (
            <div className={isDark ? "text-sm text-zinc-400" : "text-sm text-[#4d6b62]"}>{t.assignedNone}</div>
          )}
          {network.assignedDietitian?.notes ? (
            <div className={["mt-4 rounded-[22px] border px-4 py-3 text-sm", isDark ? "border-white/10 bg-black/20 text-zinc-200" : "border-[#2f6154]/15 bg-[#f7faf8] text-[#24483f]"].join(" ")}>
              <span className="font-extrabold">{t.assignedNote}: </span>
              {network.assignedDietitian.notes}
            </div>
          ) : null}
        </DashboardPanel>
      </section>

      <DashboardPanel isDark={isDark}>
        <DashboardSectionHeader
          isDark={isDark}
          title={t.measurements}
          subtitle={t.measurementsSub}
          aside={<Link to="/profile" className={dashboardButtonClass(isDark)}>{t.profile}</Link>}
        />

        {measurementError ? <div className="mb-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{measurementError}</div> : null}

        <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <MeasurementStat isDark={isDark} label={t.latestWeight} value={latestMeasurement?.weight != null ? `${latestMeasurement.weight} kg` : t.empty} />
            <MeasurementStat isDark={isDark} label={t.latestFat} value={latestMeasurement?.body_fat != null ? `%${latestMeasurement.body_fat}` : t.empty} />
          </div>

          <div className={["rounded-[22px] border p-4", isDark ? "border-white/10 bg-black/20" : "border-[#2f6154]/15 bg-[#f7faf8]"].join(" ")}>
            <div className="text-sm font-extrabold">{t.recentRecords}</div>
            <div className="mt-4 space-y-3">
              {recentMeasurements.length ? (
                recentMeasurements.map((item) => (
                  <div key={item.id} className={["flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm", isDark ? "border-white/10 bg-white/5" : "border-[#2f6154]/15 bg-white"].join(" ")}>
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
    </DashboardShell>
  );
}

function InfoRow({ isDark, label, value }: { isDark: boolean; label: string; value: string }) {
  return (
    <div className={["flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm", isDark ? "border-white/10 bg-black/20" : "border-[#2f6154]/15 bg-[#f7faf8]"].join(" ")}>
      <span className={isDark ? "text-zinc-400" : "text-[#5e776e]"}>{label}</span>
      <span className="text-right font-semibold">{value}</span>
    </div>
  );
}

function MeasurementStat({ isDark, label, value }: { isDark: boolean; label: string; value: string }) {
  return (
    <div className={["rounded-[22px] border p-4", isDark ? "border-white/10 bg-black/20" : "border-[#2f6154]/15 bg-[#f7faf8]"].join(" ")}>
      <div className={isDark ? "text-xs font-bold uppercase tracking-[0.18em] text-zinc-400" : "text-xs font-bold uppercase tracking-[0.18em] text-[#5f7a72]"}>{label}</div>
      <div className="mt-3 text-2xl font-extrabold">{value}</div>
    </div>
  );
}
