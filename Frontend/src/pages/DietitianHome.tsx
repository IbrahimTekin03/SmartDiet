import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DashboardPanel, DashboardSectionHeader, DashboardShell, DashboardStatCard, dashboardButtonClass } from "../components/DashboardShell";
import { useAppSettings } from "../context/AppSettingsContext";
import { useSocket } from "../context/SocketContext";
import { clearAuthSession, useAuthSession } from "../lib/authSession";

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
    actions: "Hızlı Erişim",
    actionsSub: "Gün içinde en sık kullanacağın alanlar",
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
    actions: "Quick Areas",
    actionsSub: "Places you will use most often",
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
  const notesStorageKey = useMemo(
    () => `sd-dietitian-notes:${profile.email || profile.clinic_name || profile.display_name || "default"}`,
    [profile.clinic_name, profile.display_name, profile.email],
  );
  const [dailyNotes, setDailyNotes] = useState("");

  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [clientPlans, setClientPlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);

  const openClientPlans = async (client: any) => {
    setSelectedClient(client);
    setLoadingPlans(true);
    setClientPlans([]);

    try {
      const res = await fetch(`${API_BASE}/api/diet-plans/client?clientId=${client.user_id}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setClientPlans(data.data || []);
      }
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



  return (
    <DashboardShell
      isDark={isDark}
      badge={t.ready}
      title={`${t.welcome} ${displayName}`}
      subtitle={`${t.clinic}: ${profile.clinic_name || t.empty}. ${t.subtitle}`}
      actions={
        <>
          {isAdmin ? (
            <Link to="/admin-panel" className={dashboardButtonClass(isDark)}>
              {t.admin}
            </Link>
          ) : null}
          <Link to="/messages" className={[dashboardButtonClass(isDark), "relative flex items-center gap-1.5"].join(" ")}>
            {lang === "tr" ? "Mesajlar" : "Messages"}
            {unreadMessageCount > 0 && (
              <span className="flex h-5 min-w-5 px-1.5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-lg shadow-rose-500/20">
                {unreadMessageCount}
              </span>
            )}
          </Link>
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
          <DashboardStatCard isDark={isDark} title={t.statClients} value={loadingSummary ? "..." : String(network.clients?.length || 0)} accent="from-emerald-400/20 to-teal-300/10" />
          <DashboardStatCard isDark={isDark} title={t.statPlans} value={loadingSummary ? "..." : String(summary.plans)} accent="from-sky-400/20 to-cyan-300/10" />
          <DashboardStatCard isDark={isDark} title={t.statMessages} value={loadingSummary ? "..." : String(summary.messages)} accent="from-fuchsia-400/20 to-pink-300/10" />
          <DashboardStatCard isDark={isDark} title={t.statAdherence} value={loadingSummary ? "..." : `${summary.adherence}%`} accent="from-amber-400/20 to-orange-300/10" />
        </div>
      </section>

      <section className="mt-8">
        <DashboardSectionHeader isDark={isDark} title={t.assignedTitle} subtitle={t.assignedSub} />
        {network.clients?.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {network.clients.map((client) => (
              <div
                key={client.user_id}
                className={[
                  "group relative overflow-hidden rounded-[32px] border p-1 transition-all duration-500",
                  isDark 
                    ? "border-white/10 bg-white/5 hover:border-emerald-500/40 hover:bg-emerald-500/5 shadow-[0_20px_50px_rgba(0,0,0,0.3)]" 
                    : "border-emerald-900/5 bg-white hover:border-emerald-500/30 hover:shadow-[0_20px_50px_rgba(16,185,129,0.1)] shadow-sm"
                ].join(" ")}
              >
                <div className="p-6">
                  <div className="flex items-center gap-4 cursor-pointer group/avatar" onClick={() => openClientPlans(client)}>
                    <div className={["flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-bold transition-transform duration-500 group-hover:scale-110 group-hover/avatar:ring-2 group-hover/avatar:ring-emerald-500/50", isDark ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-50 text-emerald-600"].join(" ")}>
                      {client.name?.charAt(0) || "D"}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <h3 className="truncate text-lg font-extrabold tracking-tight">{client.name || t.empty}</h3>
                      <p className={["truncate text-xs font-medium", isDark ? "text-zinc-500" : "text-emerald-800/60"].join(" ")}>
                        {client.email || t.empty}
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 flex flex-col gap-3">
                    <button
                      onClick={() => navigate(`/meal-planner?clientId=${client.user_id}`)}
                      className="w-full rounded-[20px] bg-emerald-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-400 hover:-translate-y-0.5 active:translate-y-0"
                    >
                      {lang === "tr" ? "Beslenme Planı Oluştur" : "Create Nutrition Plan"}
                    </button>
                    <div className="flex items-center justify-center gap-1.5 py-1 text-[11px] font-bold uppercase tracking-widest text-zinc-500 opacity-60">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      {lang === "tr" ? "Aktif Danışan" : "Active Client"}
                    </div>
                  </div>
                </div>
                
                {/* Decorative background element */}
                <div className="absolute -right-8 -bottom-8 h-24 w-24 rounded-full bg-emerald-500/5 blur-2xl transition-all duration-500 group-hover:bg-emerald-500/10 group-hover:scale-150"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className={isDark ? "rounded-[32px] border border-dashed border-white/10 bg-white/2 p-16 text-center shadow-inner" : "rounded-[32px] border border-dashed border-emerald-900/10 bg-emerald-50/30 p-16 text-center"}>
             <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
               <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
               </svg>
             </div>
            <p className={["text-lg font-bold", isDark ? "text-white" : "text-emerald-900"].join(" ")}>{t.assignedNone}</p>
            <p className={["mt-2 text-sm", isDark ? "text-zinc-500" : "text-emerald-800/60"].join(" ")}>{lang === "tr" ? "Yeni danışanlar atandığında burada görünecektir." : "New clients will appear here once assigned."}</p>
          </div>
        )}
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <DashboardPanel isDark={isDark}>
          <DashboardSectionHeader isDark={isDark} title={t.notesTitle} subtitle={t.notesSub} />
          <textarea
            value={dailyNotes}
            onChange={(event) => setDailyNotes(event.target.value)}
            placeholder={t.notesPlaceholder}
            rows={6}
            className={[
              "w-full resize-none rounded-[24px] border px-5 py-4 text-sm outline-none transition-all duration-300",
              isDark
                ? "border-white/10 bg-black/20 text-white placeholder:text-zinc-600 focus:border-emerald-500/50 focus:bg-black/40"
                : "border-emerald-900/10 bg-emerald-50/20 text-emerald-950 placeholder:text-emerald-900/30 focus:border-emerald-500/30 focus:bg-white",
            ].join(" ")}
          />
        </DashboardPanel>

        <DashboardPanel isDark={isDark}>
          <DashboardSectionHeader isDark={isDark} title={t.account} subtitle={t.accountSub} />
          <div className="space-y-3">
            <InfoRow isDark={isDark} label={t.mail} value={profile.email || t.empty} />
            <InfoRow isDark={isDark} label={t.clinic} value={profile.clinic_name || t.empty} />
            <InfoRow isDark={isDark} label={t.status} value={t.statusValue} />
          </div>
        </DashboardPanel>
      </section>

      {selectedClient && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className={["w-full max-w-2xl overflow-hidden rounded-[32px] border shadow-2xl transition-all", isDark ? "border-white/10 bg-[#0d1114]" : "border-emerald-900/10 bg-[#f7fbf9]"].join(" ")}>
            
            <div className={["flex items-center justify-between border-b px-6 py-5", isDark ? "border-white/10" : "border-emerald-900/10"].join(" ")}>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-lg font-bold text-white shadow-lg">
                  {selectedClient.name?.charAt(0) || "D"}
                </div>
                <div>
                  <h3 className={["text-xl font-extrabold", isDark ? "text-white" : "text-emerald-950"].join(" ")}>
                    {selectedClient.name}
                  </h3>
                  <p className={["text-sm", isDark ? "text-zinc-400" : "text-emerald-800/60"].join(" ")}>
                    {lang === 'tr' ? 'Danışanın Diyet Planları' : 'Client Diet Plans'}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedClient(null)} className={["rounded-full p-2 transition hover:bg-black/10", isDark ? "text-zinc-400 hover:text-white" : "text-emerald-800/60 hover:text-emerald-950"].join(" ")}>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-6">
              {loadingPlans ? (
                <div className="flex justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
                </div>
              ) : clientPlans.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className={["text-lg font-bold", isDark ? "text-white" : "text-emerald-900"].join(" ")}>
                    {lang === 'tr' ? 'Henüz plan bulunmuyor' : 'No plans found'}
                  </p>
                  <p className={["mt-2 text-sm", isDark ? "text-zinc-500" : "text-emerald-800/60"].join(" ")}>
                    {lang === 'tr' ? 'Bu danışana henüz bir diyet planı atanmamış.' : 'No diet plan has been assigned to this client yet.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {clientPlans.map((plan) => (
                    <div key={plan.id} className={["flex items-center justify-between rounded-2xl border p-5 transition-all hover:shadow-md", isDark ? "border-white/10 bg-white/5 hover:border-emerald-500/30" : "border-emerald-900/10 bg-white hover:border-emerald-500/30"].join(" ")}>
                      <div>
                        <div className="flex items-center gap-3">
                          <h4 className={["text-lg font-bold", isDark ? "text-white" : "text-emerald-950"].join(" ")}>{plan.title}</h4>
                          {plan.is_active && (
                            <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-500">Aktif</span>
                          )}
                        </div>
                        <p className={["mt-1 text-sm font-medium uppercase tracking-wider", isDark ? "text-zinc-500" : "text-emerald-800/50"].join(" ")}>
                          {plan.plan_type === 'daily' ? 'Günlük' : plan.plan_type === 'weekly' ? 'Haftalık' : 'Aylık'} Plan
                        </p>
                        <p className={["mt-2 text-xs", isDark ? "text-zinc-600" : "text-emerald-800/40"].join(" ")}>
                          Oluşturulma: {new Date(plan.created_at).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                      
                      <button 
                        onClick={() => navigate(`/plan/${plan.id}`)}
                        className="flex h-10 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 text-sm font-bold text-white shadow-lg transition hover:scale-105 active:scale-95"
                      >
                        {lang === 'tr' ? 'Planı İncele' : 'View Plan'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className={["border-t px-6 py-4", isDark ? "border-white/10 bg-black/20" : "border-emerald-900/10 bg-emerald-50/50"].join(" ")}>
              <button 
                onClick={() => navigate(`/meal-planner?clientId=${selectedClient.user_id}`)}
                className="w-full rounded-xl bg-indigo-500 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-indigo-600 active:scale-95"
              >
                {lang === 'tr' ? '+ Yeni Plan Hazırla' : '+ Create New Plan'}
              </button>
            </div>
          </div>
        </div>
      )}

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
