import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DashboardMessagesLink, DashboardPanel, DashboardSectionHeader, DashboardShell, DashboardStatCard, dashboardButtonClass } from "../components/DashboardShell";
import { useAppSettings } from "../context/AppSettingsContext";
import { useSocket } from "../context/SocketContext";
import { clearAuthSession, useAuthSession } from "../lib/authSession";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from "recharts";
import { API_BASE_URL as API_BASE } from "../lib/api";
import { 
  Activity, 
  Users, 
  FileText, 
  Plus, 
  Search, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Sparkles, 
  ArrowRight, 
  TrendingUp, 
  Droplets, 
  Scale, 
  Percent, 
  MessageSquare, 
  ShieldAlert, 
  UserCheck, 
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

const COPY = {
  tr: {
    subtitle: "Danışan takibi, kişiye özel beslenme planları ve klinik randevularınızı yönetin.",
    welcome: "Hoş Geldiniz,",
    clinic: "Klinik",
    fallbackUser: "Diyetisyen",
    profile: "Profilim",
    admin: "Admin Paneli",
    logout: "Çıkış Yap",
    overview: "Klinik Özeti & Telemetri",
    overviewSub: "Aktif danışan ve klinik akışına dair genel görünüm",
    summaryErr: "Özet verileri şu anda alınamıyor.",
    statClients: "Aktif Danışanlar",
    statPlans: "Hazırlanan Planlar",
    statMessages: "Okunmamış Mesajlar",
    statAdherence: "Ortalama Uyum",
    careQueue: "Danışan Çalışma Listesi",
    careQueueSub: "Bağlı danışanlarınızı inceleyin, yeni plan oluşturun veya ölçüm geçmişine bakın.",
    searchClient: "Danışan ara (İsim, e-posta, tel)...",
    noSearchResults: "Aramaya uygun danışan bulunamadı.",
    contactReady: "İletişim Bilgisi Tam",
    notedClients: "Özel Notlu Danışanlar",
    clinicalRhythm: "Klinik Ritmi & İpuçları",
    clinicalRhythmSub: "Günlük verimliliği artırmaya yönelik adımlar",
    rhythmA: "Yeni ölçüm giren danışanların planlarını güncelleyin.",
    rhythmB: "Gelen danışan sorularını mesajlaşma ekranından toplu yanıtlayın.",
    rhythmC: "Klinik profil bilgilerinizi ve çalışma saatlerinizi güncel tutun.",
    rhythmPrimary: "Öncelik",
    rhythmSecondary: "Takip",
    rhythmTertiary: "Klinik",
    openPlans: "Planlar & Ölçüm",
    createPlan: "Plan Hazırla",
    viewPlan: "Planı Görüntüle",
    newPlan: "Yeni Plan Oluştur",
    clientPlansTitle: "Danışan Diyet Planları",
    noPlans: "Henüz plan oluşturulmamış",
    noPlansSub: "Bu danışana ait aktif bir beslenme programı bulunmamaktadır.",
    createdAt: "Tarih",
    active: "Aktif",
    assignedLater: "Sistem yöneticisi tarafından yeni danışanlar atandığında burada listelenecektir.",
    noContact: "İletişim yok",
    notesTitle: "Hızlı Klinik Notu",
    notesSub: "Yalnızca bu tarayıcıda saklanan kişisel notlar",
    notesPlaceholder: "Bugün hangi danışanlara odaklanacaksınız?",
    assignedTitle: "Bağlı Danışanlar",
    assignedSub: "Aktif danışan eşleşmeleri",
    assignedNone: "Henüz size atanmış bir danışan bulunmuyor.",
    mail: "E-posta",
    status: "Durum",
    statusValue: "Onaylı Diyetisyen",
    ready: "Danışan Kabulüne Hazır",
    empty: "Belirtilmemiş",
  },
  en: {
    subtitle: "Manage client flows, personalized nutrition plans, and clinical consultations.",
    welcome: "Welcome,",
    clinic: "Clinic",
    fallbackUser: "Dietitian",
    profile: "Profile",
    admin: "Admin Console",
    logout: "Log Out",
    overview: "Clinical Overview & Telemetry",
    overviewSub: "Real-time summary of active clients and performance metrics",
    summaryErr: "Summary data is unavailable right now.",
    statClients: "Active Clients",
    statPlans: "Prepared Plans",
    statMessages: "Unread Messages",
    statAdherence: "Average Adherence",
    careQueue: "Client Care Queue",
    careQueueSub: "Review clients, prepare meal plans, and monitor biometrics.",
    searchClient: "Search clients by name, email, phone...",
    noSearchResults: "No matching clients found.",
    contactReady: "Contact Ready",
    notedClients: "Clients with Notes",
    clinicalRhythm: "Clinical Flow & Tips",
    clinicalRhythmSub: "Best practices for daily clinic efficiency",
    rhythmA: "Review recently logged biometric updates.",
    rhythmB: "Check and respond to queued client questions.",
    rhythmC: "Keep clinic credentials and schedule updated.",
    rhythmPrimary: "Priority",
    rhythmSecondary: "Follow-up",
    rhythmTertiary: "Clinic",
    openPlans: "Plans & Stats",
    createPlan: "Build Plan",
    viewPlan: "View Plan",
    newPlan: "Create Plan",
    clientPlansTitle: "Client Meal Plans",
    noPlans: "No meal plans yet",
    noPlansSub: "No nutrition plan has been assigned to this client yet.",
    createdAt: "Date",
    active: "Active",
    assignedLater: "New clients will appear here once assigned by the clinic admin.",
    noContact: "No contact info",
    notesTitle: "Quick Clinic Note",
    notesSub: "Personal working notes stored locally on this device",
    notesPlaceholder: "What are your main clinical priorities for today?",
    assignedTitle: "Assigned Clients",
    assignedSub: "Active client connections",
    assignedNone: "No active clients assigned yet.",
    mail: "Email",
    status: "Status",
    statusValue: "Verified Dietitian",
    ready: "Ready for Consultations",
    empty: "Not provided",
  },
};

export default function DietitianHome({ profile, isAdmin }: { profile: Profile; isAdmin?: boolean }) {
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
  const [loadingSummary, setLoadingSummary] = useState(Boolean(accessToken));
  const [summaryError, setSummaryError] = useState("");
  const [network, setNetwork] = useState<WorkspaceNetwork>({});
  const [clientSearch, setClientSearch] = useState("");

  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [clientPlans, setClientPlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [showPastPlans, setShowPastPlans] = useState(false);

  const [activeTab, setActiveTab] = useState<"plans" | "tracking">("plans");
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
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const dM = await resM.json();
      const payloadM = dM?.data?.items ?? dM?.items ?? [];
      setClientMeasurements(payloadM);

      const resW = await fetch(`${API_BASE}/api/water-tracking/client/${clientId}?days=7`, {
        headers: { Authorization: `Bearer ${accessToken}` },
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
        headers: { Authorization: `Bearer ${accessToken}` },
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
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status }),
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
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          status: "rescheduled",
          date: reschedDate,
          time_slot: reschedSlot,
          notes: reschedNotes,
        }),
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
    setActiveTab("plans");
    setLoadingPlans(true);
    setClientPlans([]);
    setClientMeasurements([]);
    setClientWaterLogs([]);
    setShowPastPlans(false);

    try {
      const res = await fetch(`${API_BASE}/api/diet-plans/client?clientId=${client.user_id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
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
        isAdmin ? (
          <Link to="/admin-panel" className={dashboardButtonClass(isDark)}>
            {t.admin}
          </Link>
        ) : undefined
      }
    >
      <section>
        <DashboardSectionHeader isDark={isDark} title={t.overview} subtitle={t.overviewSub} />
        {summaryError && (
          <div className="mb-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-xs text-rose-300">
            {summaryError}
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard isDark={isDark} title={t.statClients} value={loadingSummary ? "..." : String(clients.length)} accent="from-emerald-400/20 to-teal-400/10" />
          <DashboardStatCard isDark={isDark} title={t.statPlans} value={loadingSummary ? "..." : String(summary.plans)} accent="from-cyan-400/20 to-blue-400/10" />
          <DashboardStatCard isDark={isDark} title={t.statAdherence} value={loadingSummary ? "..." : `%${summary.adherence || 94}`} accent="from-teal-400/20 to-emerald-400/10" />
          <DashboardStatCard isDark={isDark} title={t.statMessages} value={loadingSummary ? "..." : String(unreadMessageCount)} accent="from-amber-400/20 to-orange-400/10" />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-4">
          <DashboardPanel isDark={isDark}>
            <DashboardSectionHeader
              isDark={isDark}
              title={t.careQueue}
              subtitle={t.careQueueSub}
              aside={
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    placeholder={t.searchClient}
                    className={`w-full rounded-xl border pl-9 pr-3 py-2 text-xs font-semibold outline-none transition ${
                      isDark ? "border-white/10 bg-black/40 text-white placeholder:text-slate-500 focus:border-emerald-500" : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500"
                    }`}
                  />
                </div>
              }
            />

            {clients.length ? (
              <div className="space-y-2.5">
                {filteredClients.map((client) => (
                  <div
                    key={client.user_id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isDark ? "border-white/10 bg-slate-900/60 hover:bg-slate-900/90" : "border-slate-200 bg-white hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 font-display font-black text-sm">
                        {(client.name || "D").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-display text-xs font-black">{client.name || t.empty}</div>
                        <div className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                          {client.email || client.phone_number || t.noContact}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => openClientPlans(client)}
                        className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition flex items-center gap-1.5"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>{t.openPlans}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(`/meal-planner?clientId=${client.user_id}`)}
                        className="rounded-xl bg-emerald-500 px-3.5 py-1.5 text-xs font-black text-slate-950 hover:bg-emerald-400 transition flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>{t.createPlan}</span>
                      </button>
                    </div>
                  </div>
                ))}
                {filteredClients.length === 0 && (
                  <div className={`p-8 text-center text-xs font-semibold rounded-2xl border ${
                    isDark ? "border-dashed border-white/10 text-slate-500" : "border-dashed border-slate-200 text-slate-400"
                  }`}>
                    {t.noSearchResults}
                  </div>
                )}
              </div>
            ) : (
              <div className={`p-10 text-center rounded-2xl border ${
                isDark ? "border-dashed border-white/10 text-slate-400" : "border-dashed border-slate-200 text-slate-500"
              }`}>
                <Users className="mx-auto h-8 w-8 text-emerald-400/60 mb-2" />
                <p className="font-display font-black text-sm">{t.assignedNone}</p>
                <p className="mt-1 text-xs opacity-75">{t.assignedLater}</p>
              </div>
            )}
          </DashboardPanel>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <DashboardPanel isDark={isDark}>
            <DashboardSectionHeader 
              isDark={isDark} 
              title={lang === "tr" ? "Randevu Talepleri" : "Consultations"} 
              subtitle={lang === "tr" ? "Görüşme istekleri" : "Incoming requests"} 
            />

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {appointments.length === 0 ? (
                <div className={`p-6 text-center text-xs font-semibold ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                  {lang === "tr" ? "Bekleyen randevu talebi bulunmuyor." : "No pending appointments."}
                </div>
              ) : (
                appointments.map((app) => (
                  <div key={app.id} className={`p-3.5 rounded-2xl border space-y-2.5 ${
                    isDark ? "border-white/10 bg-slate-900/60" : "border-slate-200 bg-white"
                  }`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-display text-xs font-black">{app.client?.name || app.client?.first_name || (lang === "tr" ? "Danışan" : "Client")}</div>
                        <div className={`text-[10px] font-mono mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                          {app.date} • {app.time_slot}
                        </div>
                      </div>
                      <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase ${
                        app.status === "approved" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" :
                        app.status === "cancelled" ? "border-rose-500/30 bg-rose-500/10 text-rose-400" :
                        app.status === "rescheduled" ? "border-amber-500/30 bg-amber-500/10 text-amber-400" :
                        "border-cyan-500/30 bg-cyan-500/10 text-cyan-400"
                      }`}>
                        {app.status}
                      </span>
                    </div>

                    {app.notes && (
                      <div className={`p-2 rounded-xl text-[11px] font-semibold border-l-2 border-emerald-400 ${
                        isDark ? "bg-emerald-500/10 text-emerald-300" : "bg-emerald-50 text-emerald-900"
                      }`}>
                        💬 {app.notes}
                      </div>
                    )}

                    {reschedulingAppId === app.id ? (
                      <div className="space-y-2 pt-2 border-t border-dashed border-white/10">
                        <div className="grid grid-cols-2 gap-2">
                          <input 
                            type="date"
                            value={reschedDate}
                            onChange={(e) => setReschedDate(e.target.value)}
                            className={`w-full rounded-xl border px-2 py-1 text-xs outline-none ${
                              isDark ? "border-white/10 bg-black/40 text-white" : "border-slate-200 bg-slate-50 text-slate-900"
                            }`}
                          />
                          <select
                            value={reschedSlot}
                            onChange={(e) => setReschedSlot(e.target.value)}
                            className={`w-full rounded-xl border px-2 py-1 text-xs outline-none ${
                              isDark ? "border-white/10 bg-black/40 text-white" : "border-slate-200 bg-slate-50 text-slate-900"
                            }`}
                          >
                            <option value="">Saat</option>
                            {["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"].map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button 
                            type="button"
                            onClick={() => setReschedulingAppId(null)}
                            className="rounded-xl border border-white/10 px-3 py-1 text-[10px] font-bold"
                          >
                            İptal
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleRescheduleSubmit(app.id)}
                            className="rounded-xl bg-amber-500 text-slate-950 px-3 py-1 text-[10px] font-black"
                          >
                            Kaydet
                          </button>
                        </div>
                      </div>
                    ) : (
                      app.status === "pending" && (
                        <div className="flex justify-end gap-1.5 pt-2 border-t border-white/5">
                          <button
                            type="button"
                            onClick={() => {
                              setReschedulingAppId(app.id);
                              setReschedDate(app.date);
                              setReschedSlot(app.time_slot);
                            }}
                            className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold text-amber-300 hover:bg-amber-500/20 transition"
                          >
                            {lang === "tr" ? "Ertele" : "Reschedule"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(app.id, "cancelled")}
                            className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-[10px] font-bold text-rose-300 hover:bg-rose-500/20 transition"
                          >
                            {lang === "tr" ? "Reddet" : "Reject"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(app.id, "approved")}
                            className="rounded-xl bg-emerald-500 px-3 py-1 text-[10px] font-black text-slate-950 hover:bg-emerald-400 transition"
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

          <DashboardPanel isDark={isDark}>
            <DashboardSectionHeader isDark={isDark} title={t.clinicalRhythm} subtitle={t.clinicalRhythmSub} />
            <div className="space-y-2.5 text-xs">
              <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                isDark ? "border-white/5 bg-black/20" : "border-slate-100 bg-slate-50"
              }`}>
                <span className="font-black text-emerald-400">1.</span>
                <span className={isDark ? "text-slate-300" : "text-slate-700"}>{t.rhythmA}</span>
              </div>
              <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                isDark ? "border-white/5 bg-black/20" : "border-slate-100 bg-slate-50"
              }`}>
                <span className="font-black text-cyan-400">2.</span>
                <span className={isDark ? "text-slate-300" : "text-slate-700"}>{t.rhythmB}</span>
              </div>
            </div>
          </DashboardPanel>
        </div>
      </section>

      {selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeInUp">
          <div className={`w-full max-w-3xl overflow-hidden rounded-[32px] border shadow-2xl ${
            isDark ? "border-white/10 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-900"
          }`}>
            <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 font-display font-black text-sm">
                  {(selectedClient.name || "D").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-display text-sm font-black">{selectedClient.name}</h3>
                  <div className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    {selectedClient.email || selectedClient.phone_number}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className={`flex rounded-xl p-1 border ${isDark ? "border-white/10 bg-black/40" : "border-slate-200 bg-slate-100"}`}>
                  <button
                    type="button"
                    onClick={() => setActiveTab("plans")}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      activeTab === "plans" ? "bg-emerald-500 text-slate-950 font-black" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {lang === "tr" ? "Planlar" : "Plans"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("tracking")}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      activeTab === "tracking" ? "bg-emerald-500 text-slate-950 font-black" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {lang === "tr" ? "Ölçüm & Su Grafikleri" : "Biometrics"}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedClient(null)}
                  className="rounded-xl border border-white/10 p-2 text-slate-400 hover:text-white transition"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-6">
              {activeTab === "plans" ? (
                loadingPlans ? (
                  <div className="flex justify-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
                  </div>
                ) : clientPlans.length === 0 ? (
                  <div className="py-12 text-center">
                    <FileText className="mx-auto h-8 w-8 text-slate-500 mb-2" />
                    <p className="font-display font-black text-sm">{t.noPlans}</p>
                    <p className="mt-1 text-xs opacity-75">{t.noPlansSub}</p>
                    <button
                      type="button"
                      onClick={() => navigate(`/meal-planner?clientId=${selectedClient.user_id}`)}
                      className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-2.5 text-xs font-black text-slate-950 shadow-md shadow-emerald-500/20 hover:bg-emerald-400 transition"
                    >
                      <Plus className="h-4 w-4" />
                      <span>{t.newPlan}</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-bold text-slate-400">{clientPlans.length} {lang === "tr" ? "Beslenme Programı" : "Plans Available"}</span>
                      <button
                        type="button"
                        onClick={() => navigate(`/meal-planner?clientId=${selectedClient.user_id}`)}
                        className="rounded-xl bg-emerald-500 px-3.5 py-1.5 text-xs font-black text-slate-950 hover:bg-emerald-400 transition flex items-center gap-1.5"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>{t.newPlan}</span>
                      </button>
                    </div>

                    {clientPlans.map((plan) => (
                      <div
                        key={plan.id}
                        className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
                          isDark ? "border-white/10 bg-black/20" : "border-slate-100 bg-slate-50"
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className={`font-display text-sm sm:text-base font-black ${isDark ? "text-white" : "text-slate-900"}`}>{plan.title}</h4>
                            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-400 uppercase">
                              {plan.plan_type}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 font-medium mt-1">
                            {new Date(plan.created_at).toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US")} • {plan.meals?.length || 0} {lang === "tr" ? "Öğün" : "Meals"}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => navigate(`/plan/${plan.id}`)}
                          className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold hover:bg-white/5 transition flex items-center gap-1.5"
                        >
                          <span>{t.viewPlan}</span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <div className="space-y-6">
                  {loadingTracking ? (
                    <div className="py-12 text-center text-xs text-slate-400 font-bold">
                      {lang === "tr" ? "Yükleniyor..." : "Loading..."}
                    </div>
                  ) : (
                    <>
                      {/* Weight & Body Fat AreaChart */}

                      <div>
                        <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider mb-2 text-slate-300">
                          {lang === "tr" ? "Kilo ve Yağ Oranı Geçmişi" : "Weight & Body Fat History"}
                        </h4>
                        {clientMeasurements.length === 0 ? (
                          <div className="text-xs sm:text-sm font-medium text-center py-8 border border-dashed rounded-2xl border-white/10 text-slate-400">
                            {lang === "tr" ? "Ölçüm verisi bulunmamaktadır." : "No measurements found."}
                          </div>
                        ) : (
                          <div className="h-[220px] w-full text-xs font-semibold bg-black/20 p-3 rounded-2xl">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={clientMeasurements.map(m => ({ date: m.date, Kilo: m.weight != null ? Number(m.weight) : null, Yağ: m.body_fat != null ? Number(m.body_fat) : null }))} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} />
                                <XAxis dataKey="date" stroke={isDark ? "#94a3b8" : "#475569"} />
                                <YAxis yAxisId="left" stroke="#10b981" domain={['dataMin - 5', 'dataMax + 5']} />
                                <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" domain={['dataMin - 2', 'dataMax + 2']} />
                                <Tooltip contentStyle={{ backgroundColor: isDark ? '#0d1114' : '#fff', borderColor: 'rgba(16,185,129,0.2)', color: isDark ? '#fff' : '#000', borderRadius: '12px' }} />
                                <Area yAxisId="left" type="monotone" dataKey="Kilo" stroke="#10b981" strokeWidth={2} fill="rgba(16,185,129,0.1)" connectNulls />
                                <Area yAxisId="right" type="monotone" dataKey="Yağ" stroke="#f59e0b" strokeWidth={2} fill="rgba(245,158,11,0.1)" connectNulls />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </div>

                      {/* Water logs BarChart */}
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider mb-2 text-slate-300">
                          {lang === "tr" ? "Su Tüketimi (Son 7 Gün)" : "Water Consumption (7 Days)"}
                        </h4>
                        {clientWaterLogs.length === 0 ? (
                          <div className="text-xs sm:text-sm font-medium text-center py-8 border border-dashed rounded-2xl border-white/10 text-slate-400">
                            {lang === "tr" ? "Su tüketim verisi bulunmamaktadır." : "No water tracking logs found."}
                          </div>
                        ) : (
                          <div className="h-[200px] w-full text-xs font-semibold bg-black/20 p-3 rounded-2xl">

                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={clientWaterLogs.map(w => ({ date: w.date, Su: Number(w.amount) }))} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} />
                                <XAxis dataKey="date" stroke={isDark ? "#71717a" : "#4e6f65"} />
                                <YAxis stroke="#3b82f6" />
                                <Tooltip contentStyle={{ backgroundColor: isDark ? '#0d1114' : '#fff', borderColor: 'rgba(59,130,246,0.2)', color: isDark ? '#fff' : '#000', borderRadius: '12px' }} />
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
