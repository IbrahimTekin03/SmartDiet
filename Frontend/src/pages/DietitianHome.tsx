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

  const summaryCards = [
    { label: t.statClients, value: summary.activeClients, tone: "from-emerald-400/20 to-teal-300/10" },
    { label: t.statPlans, value: summary.plans, tone: "from-sky-400/20 to-cyan-300/10" },
    { label: t.statMessages, value: summary.messages, tone: "from-fuchsia-400/20 to-pink-300/10" },
    { label: t.statAdherence, value: `${summary.adherence}%`, tone: "from-amber-400/20 to-orange-300/10" },
  ];

  const actionCards = [
    { title: t.a1, text: t.a1d, to: "/profile" },
    { title: t.a2, text: t.a2d, to: "/" },
    { title: t.a3, text: t.a3d, to: "/profile" },
  ];
  const workspaceItems: WorkspaceItem[] = [
    { id: "review", title: t.w1, description: t.w1d },
    { id: "plans", title: t.w2, description: t.w2d },
    { id: "measurements", title: t.w3, description: t.w3d },
    { id: "communication", title: t.w4, description: t.w4d },
  ];

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
          <DashboardSectionHeader isDark={isDark} title={t.actions} subtitle={t.actionsSub} />
          <div className="grid gap-4">
            {actionCards.map((action) => (
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
            <DashboardSectionHeader isDark={isDark} title={t.today} subtitle={t.todaySub} />
            <div className="space-y-3">
              {[t.t1, t.t2, t.t3].map((item, index) => (
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
            <DashboardSectionHeader isDark={isDark} title={t.account} subtitle={t.accountSub} />
            <div className="space-y-3">
              <InfoRow isDark={isDark} label={t.mail} value={profile.email || t.empty} />
              <InfoRow isDark={isDark} label={t.clinic} value={profile.clinic_name || t.empty} />
              <InfoRow isDark={isDark} label={t.status} value={t.statusValue} />
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
          storageKey={`sd-dietitian-workspace:${profile.email || profile.clinic_name || displayName}`}
        />
      </section>

      <section>
        <DashboardPanel isDark={isDark}>
          <DashboardSectionHeader isDark={isDark} title={t.assignedTitle} subtitle={t.assignedSub} />
          {network.clients?.length ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {network.clients.map((client) => (
                <div
                  key={client.user_id}
                  className={["rounded-[22px] border p-4", isDark ? "border-white/10 bg-black/20" : "border-[#2f6154]/15 bg-[#f7faf8]"].join(" ")}
                >
                  <div className="text-sm font-extrabold">{client.name || t.empty}</div>
                  <div className={["mt-1 text-sm", isDark ? "text-zinc-300" : "text-[#4d6b62]"].join(" ")}>
                    {client.email || t.empty}
                  </div>
                  <div className={["mt-1 text-sm", isDark ? "text-zinc-400" : "text-[#5e776e]"].join(" ")}>
                    {client.phone_number || t.empty}
                  </div>
                  {client.notes ? (
                    <div className={["mt-3 rounded-2xl px-3 py-2 text-xs", isDark ? "bg-white/5 text-zinc-200" : "bg-white text-[#36544c]"].join(" ")}>
                      <span className="font-extrabold">{t.assignedNote}: </span>
                      {client.notes}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className={isDark ? "text-sm text-zinc-400" : "text-sm text-[#4d6b62]"}>{t.assignedNone}</div>
          )}
        </DashboardPanel>
      </section>
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
