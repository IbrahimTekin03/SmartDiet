import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DashboardMessagesLink, DashboardPanel, DashboardSectionHeader, DashboardShell, DashboardStatCard, dashboardButtonClass } from "../components/DashboardShell";
import { useAppSettings } from "../context/AppSettingsContext";
import { useSocket } from "../context/SocketContext";
import { clearAuthSession, useAuthSession } from "../lib/authSession";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from "recharts";

type Profile = {
  first_name?: string;
  last_name?: string;
  display_name?: string;
  full_name?: string;
  email?: string;
  clinic_name?: string | null;
};

type Summary = {
  activeClients: number;
  plans: number;
  messages: number;
  adherence: number;
};

type WorkspaceNetwork = {
  clients?: Array<{
    user_id: string;
    name?: string | null;
    email?: string | null;
    phone_number?: string | null;
    notes?: string | null;
  }>;
};

const API_BASE = "http://localhost:3000";

const COPY = {
  tr: {
    subtitle: "Danışan sürecini, plan yönetimini ve günlük klinik akışını tek ekranda takip et.",
    welcome: "Hoş geldin",
    clinic: "Klinik",
    fallbackUser: "Diyetisyen",
    profile: "Profil",
    admin: "Yönetim Paneli",
    logout: "Çıkış Yap",
    overview: "Klinik Özeti",
    overviewSub: "Bugünkü çalışma akışını destekleyen temel kartlar",
    summaryErr: "Özet verileri şu anda alınamıyor.",
    statClients: "Aktif Danışanlar",
    statPlans: "Planlar",
    statMessages: "Mesajlar",
    statAdherence: "Uyum",
    careQueue: "Çalışma Sırası",
    careQueueSub: "Bağlı danışanlarını tek akışta gör, planları aç ve yeni plan oluştur.",
    searchClient: "Danışan ara",
    noSearchResults: "Aramaya uygun danışan bulunamadı.",
    contactReady: "İletişim Hazır",
    notedClients: "Notlu Eşleşme",
    clinicalRhythm: "Klinik Ritmi",
    clinicalRhythmSub: "Bugünkü iş yükünü sade bir görünümle takip et.",
    rhythmA: "Plan gerektiren danışanları çalışma sırasında öne al.",
    rhythmB: "Mesajları gün içinde toplu kontrol ederek akışı hızlandır.",
    rhythmC: "Profil ve klinik bilgilerini görünürlük için güncel tut.",
    rhythmPrimary: "Öncelik",
    rhythmSecondary: "Takip",
    rhythmTertiary: "Güncelleme",
    openPlans: "Planları Gör",
    createPlan: "Plan Oluştur",
    viewPlan: "Planı İncele",
    newPlan: "Yeni Plan Hazırla",
    clientPlansTitle: "Danışanın Diyet Planları",
    noPlans: "Henüz plan bulunmuyor",
    noPlansSub: "Bu danışana henüz bir diyet planı atanmamış.",
    createdAt: "Oluşturulma",
    active: "Aktif",
    assignedLater: "Yeni danışanlar atandığında burada görünecektir.",
    noContact: "İletişim yok",
    a1: "Profil ve klinik bilgilerini düzenle",
    a1d: "Görünürlük ve iletişim alanlarını güncel tut.",
    a2: "Danışan sürecini takip et",
    a2d: "Plan, ilerleme ve iletişim akışını tek yerden yönet.",
    a3: "Günlük çalışma notları",
    a3d: "Bugün öncelik vermen gereken adımları hızlıca gözden geçir.",
    today: "Bugün İçin",
    todaySub: "Pratik günlük odak listesi",
    t1: "Yeni danışan ve plan ihtiyaçlarını kısa bir ön değerlendirme ile belirle.",
    t2: "Mesaj alanlarını gün içinde toplu kontrol ederek akışı hızlandır.",
    t3: "Klinik bilgilerini ve profesyonel profilini güvenli şekilde güncel tut.",
    account: "Profesyonel Kart",
    accountSub: "Oturum ve hesap özetin",
    notesTitle: "Günlük Klinik Notu",
    notesSub: "Yalnızca bu cihazda saklanan kısa çalışma notları.",
    notesPlaceholder: "Bugün hangi danışanları ya da işleri önceliklendireceksin?",
    assignedTitle: "Bağlı Danışanlar",
    assignedSub: "Bu liste, admin tarafından tanımlanan aktif eşleşmelerden oluşur.",
    assignedNone: "Henüz sana bağlı aktif danışan bulunmuyor.",
    assignedNote: "Eşleşme Notu",
    workspaceTitle: "Diyetisyen Akışı",
    workspaceSub: "Uygulama içinde yönettiğin temel profesyonel çalışma akışı.",
    w1: "Yeni danışanları değerlendir",
    w1d: "Özet kartlar, notlar ve günlük odak listesi ile hangi danışana önce dönüş yapacağını belirle.",
    w2: "Plan ve takip yönetimi",
    w2d: "Plan, uyum ve ilerleme akışını tek merkezden yönetmeye hazır bir alan kullan.",
    w3: "Ölçüm yorumlama",
    w3d: "Danışan ölçümlerini izleyerek değişim noktalarını klinik karara dönüştür.",
    w4: "İletişim ve tempo",
    w4d: "Mesaj, not ve günlük çalışma temposunu birlikte yönet.",
    mail: "E-posta",
    status: "Durum",
    statusValue: "Onaylı diyetisyen hesabı",
    ready: "Danışan kabulüne hazır",
    empty: "Belirtilmedi",
  },
  en: {
    subtitle: "A focused dashboard for client flow, plans and clinic rhythm in one place.",
    welcome: "Welcome",
    clinic: "Clinic",
    fallbackUser: "Dietitian",
    profile: "Profile",
    admin: "Admin Panel",
    logout: "Log Out",
    overview: "Clinic Overview",
    overviewSub: "Core cards that support your working flow today",
    summaryErr: "Summary data is unavailable right now.",
    statClients: "Active Clients",
    statPlans: "Plans",
    statMessages: "Messages",
    statAdherence: "Adherence",
    careQueue: "Work Queue",
    careQueueSub: "Review assigned clients in one flow, open plans and create new ones.",
    searchClient: "Search clients",
    noSearchResults: "No clients match your search.",
    contactReady: "Contact Ready",
    notedClients: "With Notes",
    clinicalRhythm: "Clinic Rhythm",
    clinicalRhythmSub: "Follow today's workload in a clean operational view.",
    rhythmA: "Move clients needing plans to the front of the queue.",
    rhythmB: "Batch-check messages during the day to keep flow fast.",
    rhythmC: "Keep profile and clinic details updated for visibility.",
    rhythmPrimary: "Priority",
    rhythmSecondary: "Follow-up",
    rhythmTertiary: "Update",
    openPlans: "View Plans",
    createPlan: "Create Plan",
    viewPlan: "View Plan",
    newPlan: "Create New Plan",
    clientPlansTitle: "Client Diet Plans",
    noPlans: "No plans found",
    noPlansSub: "No diet plan has been assigned to this client yet.",
    createdAt: "Created",
    active: "Active",
    assignedLater: "New clients will appear here once assigned.",
    noContact: "No contact",
    a1: "Update profile and clinic details",
    a1d: "Keep your visibility and contact areas current.",
    a2: "Track client flow",
    a2d: "Review plan, progress and communication flow from one place.",
    a3: "Daily rhythm notes",
    a3d: "Review the key steps you want to prioritize today.",
    today: "For Today",
    todaySub: "Practical daily focus list",
    t1: "Scan new client and planning needs quickly before starting.",
    t2: "Batch-check messaging areas during the day to keep flow efficient.",
    t3: "Keep clinic information and professional profile updated securely.",
    account: "Professional Card",
    accountSub: "Session and account snapshot",
    notesTitle: "Daily Clinic Note",
    notesSub: "Short working notes stored only on this device.",
    notesPlaceholder: "Which clients or tasks do you want to prioritize today?",
    assignedTitle: "Assigned Clients",
    assignedSub: "This list comes from active connections assigned by admin.",
    assignedNone: "There are no active clients assigned to you yet.",
    assignedNote: "Assignment Note",
    workspaceTitle: "Dietitian System",
    workspaceSub: "The core professional workflow a dietitian manages inside the app.",
    w1: "Review new clients",
    w1d: "Use summary cards, notes and focus list to decide which client needs attention first.",
    w2: "Plan and follow-up management",
    w2d: "Work from one area prepared for plan, adherence and progress flow.",
    w3: "Interpret measurements",
    w3d: "Track client measurements and turn change points into clinical decisions.",
    w4: "Communication and rhythm",
    w4d: "Run messages, notes and daily clinic rhythm together.",
    mail: "Email",
    status: "Status",
    statusValue: "Approved dietitian account",
    ready: "Ready to accept clients",
    empty: "Not provided",
  },
} as const;

export default function DietitianHome({ profile, isAdmin }: { profile: Profile; isAdmin?: boolean }) {
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
  const [loadingSummary, setLoadingSummary] = useState(Boolean(accessToken));
  const [summaryError, setSummaryError] = useState("");
  const [network, setNetwork] = useState<WorkspaceNetwork>({});
  const [clientSearch, setClientSearch] = useState("");

  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [clientPlans, setClientPlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);

  // Tracking and appointments states
  const [activeTab, setActiveTab] = useState<'plans' | 'tracking'>('plans');
  const [clientMeasurements, setClientMeasurements] = useState<any[]>([]);
  const [clientWaterLogs, setClientWaterLogs] = useState<any[]>([]);
  const [loadingTracking, setLoadingTracking] = useState(false);

  const [appointments, setAppointments] = useState<any[]>([]);
  const [reschedulingAppId, setReschedulingAppId] = useState<string | null>(null);
  const [reschedDate, setReschedDate] = useState("");
  const [reschedSlot, setReschedSlot] = useState("");
  const [reschedNotes, setReschedNotes] = useState("");

  const fetchClientTracking = async (clientId: string) => {
    setLoadingTracking(true);
    try {
      const resM = await fetch(`${API_BASE}/api/measurements/history?days=30&clientId=${clientId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const dM = await resM.json();
      const payloadM = dM?.data?.items ?? dM?.items ?? [];
      setClientMeasurements(payloadM);

      const resW = await fetch(`${API_BASE}/api/water-tracking/client/${clientId}?days=7`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const dW = await resW.json();
      const payloadW = dW?.data?.items ?? dW?.items ?? [];
      setClientWaterLogs(payloadW);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTracking(false);
    }
  };

  const fetchAppointments = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${API_BASE}/api/appointments/dietitian`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const d = await res.json();
      const payload = d?.data ?? d;
      if (Array.isArray(payload)) {
        setAppointments(payload);
      }
    } catch {}
  }, [accessToken]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleUpdateStatus = async (appId: string, status: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/appointments/${appId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchAppointments();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRescheduleSubmit = async (appId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/appointments/${appId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          status: 'rescheduled',
          date: reschedDate,
          time_slot: reschedSlot,
          notes: reschedNotes
        })
      });
      if (res.ok) {
        setReschedulingAppId(null);
        fetchAppointments();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openClientPlans = async (client: any) => {
    setSelectedClient(client);
    setActiveTab('plans');
    setLoadingPlans(true);
    setClientPlans([]);
    setClientMeasurements([]);
    setClientWaterLogs([]);

    try {
      const res = await fetch(`${API_BASE}/api/diet-plans/client?clientId=${client.user_id}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setClientPlans(data.data || []);
      }
      await fetchClientTracking(client.user_id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPlans(false);
    }
  };

  const displayName = useMemo(() => {
    const full = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim();
    return full || profile.full_name || profile.display_name || profile.email || t.fallbackUser;
  }, [profile, t.fallbackUser]);

  const clients = useMemo(() => network.clients || [], [network.clients]);
  const filteredClients = useMemo(() => {
    const term = clientSearch.trim().toLocaleLowerCase(lang === "tr" ? "tr-TR" : "en-US");
    if (!term) return clients;
    return clients.filter((client) =>
      [client.name, client.email, client.phone_number]
        .filter(Boolean)
        .some((value) => String(value).toLocaleLowerCase(lang === "tr" ? "tr-TR" : "en-US").includes(term)),
    );
  }, [clientSearch, clients, lang]);
  const clientsWithContact = clients.filter((client) => client.email || client.phone_number).length;
  const clientsWithNotes = clients.filter((client) => client.notes).length;

  const planTypeLabel = (type?: string) => {
    if (type === "daily") return lang === "tr" ? "Günlük" : "Daily";
    if (type === "monthly") return lang === "tr" ? "Aylık" : "Monthly";
    return lang === "tr" ? "Haftalık" : "Weekly";
  };

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

  const onLogout = () => {
    clearAuthSession();
    navigate("/login", { replace: true });
  };



  return (
    <DashboardShell
      isDark={isDark}
      badge={t.ready}
      title={`${t.welcome} ${displayName}`}
      subtitle={t.subtitle}
      actions={
        <>
          {isAdmin ? (
            <Link to="/admin-panel" className={dashboardButtonClass(isDark)}>
              {t.admin}
            </Link>
          ) : null}
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
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard isDark={isDark} title={t.statClients} value={loadingSummary ? "..." : String(clients.length)} accent="from-emerald-400/20 to-teal-300/10" />
          <DashboardStatCard isDark={isDark} title={t.statPlans} value={loadingSummary ? "..." : String(summary.plans)} accent="from-sky-400/20 to-cyan-300/10" />
          <DashboardStatCard isDark={isDark} title={t.statAdherence} value={loadingSummary ? "..." : `${summary.adherence}%`} accent="from-amber-400/20 to-orange-300/10" />
          <DashboardStatCard isDark={isDark} title={t.contactReady} value={loadingSummary ? "..." : String(clientsWithContact)} accent="from-lime-400/20 to-emerald-300/10" />
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-[1.35fr_0.65fr]">
        <DashboardPanel isDark={isDark}>
          <DashboardSectionHeader
            isDark={isDark}
            title={t.careQueue}
            subtitle={`${t.careQueueSub} ${clientsWithNotes ? `${t.notedClients}: ${clientsWithNotes}` : ""}`.trim()}
            aside={
              <input
                value={clientSearch}
                onChange={(event) => setClientSearch(event.target.value)}
                placeholder={t.searchClient}
                className={[
                  "w-full min-w-[220px] rounded-xl border px-3 py-2 text-xs font-semibold outline-none transition sm:w-64",
                  isDark ? "border-transparent bg-black/25 text-white placeholder:text-zinc-500 focus:border-emerald-300/40" : "border-[#e4dbc9] bg-[#fffaf2] text-[#123a32] placeholder:text-[#7a7160] focus:border-[#2f6154]/30",
                ].join(" ")}
              />
            }
          />
          {clients.length ? (
            <div className="grid gap-2">
              {filteredClients.map((client, index) => (
                <ClientQueueRow
                  key={client.user_id}
                  isDark={isDark}
                  client={client}
                  empty={t.empty}
                  openPlans={t.openPlans}
                  createPlan={t.createPlan}
                  position={index + 1}
                  onOpenPlans={() => openClientPlans(client)}
                  onCreatePlan={() => navigate(`/meal-planner?clientId=${client.user_id}`)}
                />
              ))}
              {filteredClients.length === 0 ? (
                <div className={isDark ? "rounded-2xl border border-dashed border-transparent bg-black/20 p-6 text-center text-sm text-zinc-400 shadow-[inset_0_1px_0_rgba(16,185,129,0.08)]" : "rounded-2xl border border-dashed border-[#e4dbc9] bg-[#fffaf2] p-6 text-center text-sm text-[#4d6b62]"}>
                  {t.noSearchResults}
                </div>
              ) : null}
            </div>
          ) : (
            <div className={isDark ? "rounded-2xl border border-dashed border-transparent bg-black/20 p-8 text-center shadow-[inset_0_1px_0_rgba(16,185,129,0.08)]" : "rounded-2xl border border-dashed border-[#e4dbc9] bg-[#fffaf2] p-8 text-center"}>
              <div className={["mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl", isDark ? "bg-emerald-500/10 text-emerald-300" : "bg-[#edf6ec] text-[#285743]"].join(" ")}>
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <p className="text-sm font-black">{t.assignedNone}</p>
              <p className={["mt-1 text-xs", isDark ? "text-zinc-500" : "text-[#7a7160]"].join(" ")}>{t.assignedLater}</p>
            </div>
          )}
        </DashboardPanel>

        <DashboardPanel isDark={isDark}>
          <DashboardSectionHeader isDark={isDark} title={t.clinicalRhythm} subtitle={t.clinicalRhythmSub} />
          <div className="space-y-2">
            <RhythmItem isDark={isDark} label={t.rhythmPrimary} text={t.rhythmA} />
            <RhythmItem isDark={isDark} label={t.rhythmSecondary} text={t.rhythmB} />
            <RhythmItem isDark={isDark} label={t.rhythmTertiary} text={t.rhythmC} />
          </div>
          <div className={["mt-3 rounded-2xl border p-3", isDark ? "border-transparent bg-emerald-400/10 shadow-[inset_0_1px_0_rgba(16,185,129,0.10)]" : "border-[#dce8dc] bg-[#edf6ec]"].join(" ")}>
            <div className={["text-[10px] font-black uppercase", isDark ? "text-emerald-200" : "text-[#285743]"].join(" ")}>{t.contactReady}</div>
            <div className="mt-1 text-2xl font-black">{clientsWithContact}/{clients.length || 0}</div>
          </div>
        </DashboardPanel>

        <DashboardPanel isDark={isDark} className="mt-3">
          <DashboardSectionHeader isDark={isDark} title={lang === "tr" ? "Randevu Talepleri" : "Appointment Requests"} subtitle={lang === "tr" ? "Bekleyen danışan randevuları" : "Pending client appointments"} />
          
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {appointments.length === 0 ? (
              <div className={["text-xs font-semibold text-center py-6", isDark ? "text-zinc-500" : "text-[#7a7160]"].join(" ")}>
                {lang === "tr" ? "Bekleyen randevu talebi bulunmuyor." : "No pending appointments."}
              </div>
            ) : (
              appointments.map((app) => (
                <div key={app.id} className={["border p-3 space-y-2", isDark ? "rounded-xl border-transparent bg-black/25" : "rounded-xl border-[#e4dbc9] bg-white"].join(" ")}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-xs font-black">{app.client?.name || app.client?.first_name || (lang === "tr" ? "Danışan" : "Client")}</div>
                      <div className={["text-[10px] font-semibold mt-0.5", isDark ? "text-zinc-400" : "text-[#4d6b62]"].join(" ")}>
                        {app.date} @ {app.time_slot}
                      </div>
                    </div>
                    <span className={["rounded-full border px-1.5 py-0.5 text-[8px] font-bold uppercase", 
                      app.status === 'approved' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                      app.status === 'cancelled' ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                      app.status === 'rescheduled' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                      "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                    ].join(" ")}>
                      {app.status}
                    </span>
                  </div>

                  {app.notes && (
                    <div className={["text-[10px] font-medium leading-relaxed border-t pt-1.5", isDark ? "text-zinc-400 border-emerald-400/5" : "text-[#5e776e] border-black/5"].join(" ")}>
                      {app.notes}
                    </div>
                  )}

                  {reschedulingAppId === app.id ? (
                    <div className="space-y-2 border-t pt-2 border-dashed border-emerald-500/20">
                      <div className="grid grid-cols-2 gap-2">
                        <input 
                          type="date"
                          value={reschedDate}
                          onChange={(e) => setReschedDate(e.target.value)}
                          className={["w-full rounded-lg border px-2 py-1 text-[10px] outline-none", isDark ? "border-white/10 bg-black/40 text-white" : "border-gray-200 bg-white text-zinc-950"].join(" ")}
                        />
                        <select
                          value={reschedSlot}
                          onChange={(e) => setReschedSlot(e.target.value)}
                          className={["w-full rounded-lg border px-2 py-1 text-[10px] outline-none", isDark ? "border-white/10 bg-black/40 text-white" : "border-gray-200 bg-white text-zinc-950"].join(" ")}
                        >
                          <option value="">Saat seç</option>
                          {["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <input 
                        type="text"
                        placeholder="Erteleme sebebi..."
                        value={reschedNotes}
                        onChange={(e) => setReschedNotes(e.target.value)}
                        className={["w-full rounded-lg border px-2 py-1 text-[10px] outline-none", isDark ? "border-white/10 bg-black/40 text-white" : "border-gray-200 bg-white text-zinc-950"].join(" ")}
                      />
                      <div className="flex gap-2 justify-end">
                        <button 
                          onClick={() => setReschedulingAppId(null)}
                          className={["rounded-lg px-2 py-1 text-[9px] font-black uppercase transition", isDark ? "bg-white/5 text-zinc-300" : "border border-gray-200 text-zinc-700"].join(" ")}
                        >
                          İptal
                        </button>
                        <button 
                          onClick={() => handleRescheduleSubmit(app.id)}
                          className="rounded-lg bg-amber-500 text-white px-2 py-1 text-[9px] font-black uppercase"
                        >
                          Kaydet
                        </button>
                      </div>
                    </div>
                  ) : (
                    app.status === 'pending' && (
                      <div className="flex justify-end gap-1.5 border-t pt-2 border-dashed border-emerald-500/10">
                        <button
                          onClick={() => {
                            setReschedulingAppId(app.id);
                            setReschedDate(app.date);
                            setReschedSlot(app.time_slot);
                            setReschedNotes("");
                          }}
                          className={["rounded-lg border px-2 py-1 text-[9px] font-black uppercase transition", isDark ? "border-amber-400/25 bg-amber-500/10 text-amber-300 hover:bg-amber-500/15" : "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"].join(" ")}
                        >
                          {lang === "tr" ? "Ertele" : "Reschedule"}
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(app.id, 'cancelled')}
                          className={["rounded-lg border px-2 py-1 text-[9px] font-black uppercase transition", isDark ? "border-rose-400/25 bg-rose-500/10 text-rose-300 hover:bg-rose-500/15" : "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"].join(" ")}
                        >
                          {lang === "tr" ? "Reddet" : "Reject"}
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(app.id, 'approved')}
                          className="rounded-lg bg-emerald-500 hover:brightness-110 text-white px-2 py-1 text-[9px] font-black uppercase"
                        >
                          {lang === "tr" ? "Onayla" : "Approve"}
                        </button>
                      </div>
                    )
                  )}
                </div>
              ))
            )}
          </div>
        </DashboardPanel>
      </section>

      {selectedClient && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
          <div className={["w-full max-w-2xl overflow-hidden border shadow-2xl transition-all", isDark ? "rounded-2xl border-transparent bg-[#080b0a]/95" : "rounded-2xl border-[#e4dbc9] bg-[#fffaf2]"].join(" ")}>
            
            <div className={["flex items-center justify-between border-b px-5", isDark ? "border-emerald-400/10" : "border-[#e4dbc9]"].join(" ")}>
              <div className="flex">
                <button
                  onClick={() => setActiveTab('plans')}
                  className={["px-4 py-3 text-xs font-black border-b-2 transition-all outline-none", 
                    activeTab === 'plans' ? "border-emerald-500 text-emerald-400" : isDark ? "border-transparent text-zinc-400 hover:text-white" : "border-transparent text-[#5e776e] hover:text-[#123a32]"
                  ].join(" ")}
                >
                  {lang === "tr" ? "Öğün Programları" : "Meal Plans"}
                </button>
                <button
                  onClick={() => setActiveTab('tracking')}
                  className={["px-4 py-3 text-xs font-black border-b-2 transition-all outline-none", 
                    activeTab === 'tracking' ? "border-emerald-500 text-emerald-400" : isDark ? "border-transparent text-zinc-400 hover:text-white" : "border-transparent text-[#5e776e] hover:text-[#123a32]"
                  ].join(" ")}
                >
                  {lang === "tr" ? "Danışan Takibi" : "Client Tracking"}
                </button>
              </div>
              <button
                onClick={() => setSelectedClient(null)}
                className={["rounded-xl border px-3 py-1 text-xs font-black hover:scale-105 transition outline-none", isDark ? "border-transparent bg-white/5 text-zinc-200 hover:bg-white/10" : "border-[#e4dbc9] bg-white text-[#2b574b] hover:bg-gray-100"].join(" ")}
              >
                {lang === "tr" ? "Kapat" : "Close"}
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-5">
              {activeTab === 'plans' && (
                <>
                  {loadingPlans ? (
                    <div className="flex justify-center py-12">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
                    </div>
                  ) : clientPlans.length === 0 ? (
                    <div className="py-10 text-center">
                      <div className={["mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl", isDark ? "bg-emerald-500/10 text-emerald-300" : "bg-[#edf6ec] text-[#285743]"].join(" ")}>
                        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <p className="text-sm font-black">
                        {t.noPlans}
                      </p>
                      <p className={["mt-1 text-xs", isDark ? "text-zinc-500" : "text-[#7a7160]"].join(" ")}>
                        {t.noPlansSub}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {clientPlans.map((plan) => (
                        <div key={plan.id} className={["flex flex-col gap-3 border p-3 transition sm:flex-row sm:items-center sm:justify-between", isDark ? "rounded-2xl border-transparent bg-black/20 shadow-[inset_0_1px_0_rgba(16,185,129,0.08)] hover:border-transparent" : "rounded-2xl border-[#e4dbc9] bg-[#fffaf2] hover:border-[#d4c9b5]"].join(" ")}>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className={["truncate text-sm font-black", isDark ? "text-white" : "text-[#123a32]"].join(" ")}>{plan.title}</h4>
                              {plan.is_active && (
                                <span className={["rounded-full border px-2 py-0.5 text-[10px] font-black uppercase", isDark ? "border-emerald-300/20 bg-emerald-500/10 text-emerald-100" : "border-[#dce8dc] bg-[#edf6ec] text-[#285743]"].join(" ")}>{t.active}</span>
                              )}
                            </div>
                            <p className={["mt-1 text-[11px] font-black uppercase", isDark ? "text-zinc-500" : "text-[#4d6b62]"].join(" ")}>
                              {planTypeLabel(plan.plan_type)} Plan
                            </p>
                            <p className={["mt-1 text-[11px]", isDark ? "text-zinc-600" : "text-[#7a7160]"].join(" ")}>
                              {t.createdAt}: {new Date(plan.created_at).toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US")}
                            </p>
                          </div>
                          
                          <button 
                            onClick={() => navigate(`/plan/${plan.id}`)}
                            className={["flex h-9 shrink-0 items-center justify-center px-4 text-xs font-black transition", isDark ? "rounded-xl bg-emerald-400 text-zinc-950 hover:brightness-110" : "rounded-xl bg-[#2f6154] text-white hover:bg-[#244f44]"].join(" ")}
                          >
                            {t.viewPlan}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {activeTab === 'tracking' && (
                <div className="space-y-6">
                  {loadingTracking ? (
                    <div className="flex justify-center py-12">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
                    </div>
                  ) : (
                    <>
                      {/* Measurements AreaChart */}
                      <div>
                        <h4 className={["text-xs font-black uppercase tracking-wider mb-2", isDark ? "text-zinc-400" : "text-[#4d6b62]"].join(" ")}>
                          {lang === "tr" ? "Ölçüm Geçmişi (Son 30 Gün)" : "Measurement History (30 Days)"}
                        </h4>
                        {clientMeasurements.length === 0 ? (
                          <div className={["text-xs font-semibold text-center py-6 border border-dashed rounded-2xl", isDark ? "border-zinc-800 text-zinc-500" : "border-gray-200 text-[#7a7160]"].join(" ")}>
                            {lang === "tr" ? "Ölçüm verisi bulunmamaktadır." : "No measurements found."}
                          </div>
                        ) : (
                          <div className="h-[200px] w-full text-[10px] font-semibold bg-black/10 p-2 rounded-2xl">
                            {(() => {
                              const strokeColor1 = isDark ? "#34d399" : "#10b981";
                              const strokeColor2 = isDark ? "#f59e0b" : "#d97706";
                              return (
                                <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart data={clientMeasurements.map(m => ({ date: m.date, Kilo: m.weight != null ? Number(m.weight) : null, Yağ: m.body_fat != null ? Number(m.body_fat) : null }))} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} />
                                    <XAxis dataKey="date" stroke={isDark ? "#71717a" : "#4e6f65"} />
                                    <YAxis yAxisId="left" stroke={strokeColor1} domain={['dataMin - 5', 'dataMax + 5']} />
                                    <YAxis yAxisId="right" orientation="right" stroke={strokeColor2} domain={['dataMin - 2', 'dataMax + 2']} />
                                    <Tooltip contentStyle={{ backgroundColor: isDark ? '#0d1114' : '#fff', borderColor: 'rgba(16,185,129,0.2)', color: isDark ? '#fff' : '#000' }} />
                                    <Area yAxisId="left" type="monotone" dataKey="Kilo" stroke={strokeColor1} strokeWidth={2} fill={isDark ? "rgba(52,211,153,0.05)" : "rgba(16,185,129,0.05)"} connectNulls />
                                    <Area yAxisId="right" type="monotone" dataKey="Yağ" stroke={strokeColor2} strokeWidth={2} fill={isDark ? "rgba(245,158,11,0.05)" : "rgba(217,119,6,0.05)"} connectNulls />
                                  </AreaChart>
                                </ResponsiveContainer>
                              );
                            })()}
                          </div>
                        )}
                      </div>

                      {/* Water logs BarChart */}
                      <div>
                        <h4 className={["text-xs font-black uppercase tracking-wider mb-2", isDark ? "text-zinc-400" : "text-[#4d6b62]"].join(" ")}>
                          {lang === "tr" ? "Su Tüketimi (Son 7 Gün)" : "Water Consumption (7 Days)"}
                        </h4>
                        {clientWaterLogs.length === 0 ? (
                          <div className={["text-xs font-semibold text-center py-6 border border-dashed rounded-2xl", isDark ? "border-zinc-800 text-zinc-500" : "border-gray-200 text-[#7a7160]"].join(" ")}>
                            {lang === "tr" ? "Su tüketim verisi bulunmamaktadır." : "No water tracking logs found."}
                          </div>
                        ) : (
                          <div className="h-[180px] w-full text-[10px] font-semibold bg-black/10 p-2 rounded-2xl">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={clientWaterLogs.map(w => ({ date: w.date, Su: Number(w.amount) }))} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} />
                                <XAxis dataKey="date" stroke={isDark ? "#71717a" : "#4e6f65"} />
                                <YAxis stroke="#3b82f6" />
                                <Tooltip contentStyle={{ backgroundColor: isDark ? '#0d1114' : '#fff', borderColor: 'rgba(59,130,246,0.2)', color: isDark ? '#fff' : '#000' }} />
                                <Bar dataKey="Su" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
            
            {activeTab === 'plans' && (
              <div className={["border-t px-5 py-4", isDark ? "border-emerald-400/10 bg-black/20" : "border-[#e4dbc9] bg-[#f9f6ec]"].join(" ")}>
                <button 
                  onClick={() => navigate(`/meal-planner?clientId=${selectedClient.user_id}`)}
                  className={["w-full py-2.5 text-sm font-black transition active:scale-[0.99]", isDark ? "rounded-xl bg-emerald-400 text-zinc-950 hover:brightness-110" : "rounded-xl bg-[#2f6154] text-white hover:bg-[#244f44]"].join(" ")}
                >
                  + {t.newPlan}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </DashboardShell>
  );
}

function ClientQueueRow({
  isDark,
  client,
  empty,
  openPlans,
  createPlan,
  position,
  onOpenPlans,
  onCreatePlan,
}: {
  isDark: boolean;
  client: NonNullable<WorkspaceNetwork["clients"]>[number];
  empty: string;
  openPlans: string;
  createPlan: string;
  position: number;
  onOpenPlans: () => void;
  onCreatePlan: () => void;
}) {
  return (
    <div className={["flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-3 py-3", isDark ? "border-transparent bg-black/20 shadow-[inset_0_1px_0_rgba(16,185,129,0.08)] hover:border-transparent hover:bg-white/[0.05]" : "border-[#e4dbc9] bg-[#fffaf2] hover:border-[#d4c9b5]"].join(" ")}>
      <button type="button" onClick={onOpenPlans} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <span className={["grid h-9 w-9 shrink-0 place-items-center rounded-xl text-xs font-black", isDark ? "bg-emerald-400/12 text-emerald-200" : "bg-[#edf6ec] text-[#285743]"].join(" ")}>
          {String(position).padStart(2, "0")}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-black">{client.name || empty}</span>
          <span className={["mt-0.5 block truncate text-[11px]", isDark ? "text-zinc-500" : "text-[#6c7c70]"].join(" ")}>
            {client.email || client.phone_number || empty}
          </span>
        </span>
      </button>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenPlans}
          className={["rounded-xl border px-3 py-1.5 text-xs font-black transition", isDark ? "border-transparent bg-white/5 text-zinc-100 hover:bg-white/10" : "border-[#e4dbc9] bg-white text-[#285743] hover:bg-[#f9f6ec]"].join(" ")}
        >
          {openPlans}
        </button>
        <button
          type="button"
          onClick={onCreatePlan}
          className={["rounded-xl px-3 py-1.5 text-xs font-black transition", isDark ? "bg-emerald-400 text-zinc-950 hover:brightness-110" : "bg-[#2f6154] text-white hover:bg-[#244f44]"].join(" ")}
        >
          {createPlan}
        </button>
      </div>
    </div>
  );
}

function RhythmItem({ isDark, label, text }: { isDark: boolean; label: string; text: string }) {
  return (
    <div className={["rounded-2xl border p-3", isDark ? "border-transparent bg-black/20 shadow-[inset_0_1px_0_rgba(16,185,129,0.08)]" : "border-[#e4dbc9] bg-[#fffaf2]"].join(" ")}>
      <div className={["text-[10px] font-black uppercase", isDark ? "text-emerald-200" : "text-[#285743]"].join(" ")}>{label}</div>
      <div className={["mt-1 text-xs leading-5", isDark ? "text-zinc-400" : "text-[#4d6b62]"].join(" ")}>{text}</div>
    </div>
  );
}
