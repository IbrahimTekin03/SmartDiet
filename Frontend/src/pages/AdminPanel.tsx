import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

type Theme = "dark" | "light";
type Lang = "tr" | "en";
type ViewMode = "queue" | "ops";
type SortMode = "newest" | "oldest";

type SessionUser = {
  first_name?: string;
  last_name?: string;
  full_name?: string;
  display_name?: string;
  email?: string;
  roles?: Array<{ name?: string }>;
};

type Summary = {
  activeClients: number;
  plans: number;
  messages: number;
  adherence: number;
};

type LandingStats = {
  totalDietitians: number;
  approvedDietitians: number;
  totalUsers: number;
  activeUsers: number;
};

type DietitianApplication = {
  user_id: string;
  first_name?: string;
  last_name?: string;
  email?: string | null;
  phone_number?: string | null;
  clinic_name?: string | null;
  clinic_city?: string | null;
  clinic_address?: string | null;
  clinic_license_no?: string | null;
  submitted_at?: string | null;
};

const API_BASE = "http://localhost:3000";

const COPY = {
  tr: {
    tag: "Yönetim Paneli",
    title: "Platform yönetimi",
    subtitle: "Başvuru onayı, sistem izlemesi ve operasyon kararlarını tek ekranda yönet.",
    welcome: "Hoş geldin",
    updated: "Son güncelleme",
    refresh: "Yenile",
    profile: "Profil",
    logout: "Çıkış",
    queueTab: "Başvuru Merkezi",
    opsTab: "Operasyon",
    queueTitle: "Diyetisyen Başvuru Listesi",
    queueSub: "Başvuruyu seç, detayını incele ve tek adımla onayla.",
    search: "Başvuru ara",
    searchPh: "isim, e-posta, klinik",
    city: "Şehir",
    allCities: "Tüm şehirler",
    sort: "Sıralama",
    newest: "Yeni > Eski",
    oldest: "Eski > Yeni",
    noResult: "Filtreye uygun başvuru yok.",
    selectedTitle: "Seçili Başvuru",
    noSelection: "Detay için soldan bir başvuru seç.",
    approve: "Onayla",
    approving: "Onaylanıyor...",
    summaryTitle: "Canlı Özet",
    metricPending: "Bekleyen Başvuru",
    metricApproved: "Onaylı Diyetisyen",
    metricUsers: "Toplam Kullanıcı",
    metricActiveUsers: "Aktif Kullanıcı",
    metricDietitians: "Toplam Diyetisyen",
    activityRate: "Aktiflik Oranı",
    approvalRate: "Onay Oranı",
    queuePressure: "Kuyruk Yoğunluğu",
    systemTitle: "Sistem Sağlığı",
    stepApi: "API",
    stepOtp: "OTP",
    stepRoles: "Roller",
    stepQueue: "Onay Kuyruğu",
    healthy: "Stabil",
    check: "Kontrol",
    opsSummary: "Operasyon Özeti",
    sClients: "Aktif Danışan",
    sPlans: "Plan",
    sMessages: "Mesaj",
    sAdherence: "Uyum",
    feedTitle: "Son Aktivite",
    feedEmpty: "Henüz aktivite yok.",
    cityTitle: "Kuyruk Dağılımı",
    cityEmpty: "Şehir bazlı veri yok.",
    managementTitle: "Yönetsel Notlar",
    managementA: "Başvuru Standardı",
    managementADesc: "Lisans, klinik ve iletişim alanları tam olunca onay süreci hızlanır.",
    managementB: "Güvenlik Akışı",
    managementBDesc: "OTP, rol ve oturum kontrolleri birlikte izlenmeli.",
    managementC: "Takip Rutini",
    managementCDesc: "Panel otomatik yenilendiği için sürekli operasyon takibi sağlar.",
    detailName: "İsim",
    detailEmail: "E-posta",
    detailPhone: "Telefon",
    detailClinic: "Klinik",
    detailCity: "Şehir",
    detailLicense: "Lisans",
    detailAddress: "Adres",
    unknownCity: "Belirsiz",
    fallbackAdmin: "Yönetici",
    summaryErr: "Özet verisi alınamadı.",
    appErr: "Başvurular alınamadı.",
    approveErr: "Onay başarısız.",
    load: "Yükleniyor...",
  },
  en: {
    tag: "Admin Panel",
    title: "Platform control",
    subtitle: "Manage approvals, monitor health and run operations in one screen.",
    welcome: "Welcome",
    updated: "Last updated",
    refresh: "Refresh",
    profile: "Profile",
    logout: "Logout",
    queueTab: "Application Hub",
    opsTab: "Operations",
    queueTitle: "Dietitian Applications",
    queueSub: "Pick an application, inspect details and approve in one step.",
    search: "Search applications",
    searchPh: "name, email, clinic",
    city: "City",
    allCities: "All cities",
    sort: "Sort",
    newest: "Newest > Oldest",
    oldest: "Oldest > Newest",
    noResult: "No matching applications.",
    selectedTitle: "Selected Application",
    noSelection: "Select an application from the left list.",
    approve: "Approve",
    approving: "Approving...",
    summaryTitle: "Live Summary",
    metricPending: "Pending Applications",
    metricApproved: "Approved Dietitians",
    metricUsers: "Total Users",
    metricActiveUsers: "Active Users",
    metricDietitians: "Total Dietitians",
    activityRate: "Activity Rate",
    approvalRate: "Approval Rate",
    queuePressure: "Queue Pressure",
    systemTitle: "System Health",
    stepApi: "API",
    stepOtp: "OTP",
    stepRoles: "Roles",
    stepQueue: "Approval Queue",
    healthy: "Healthy",
    check: "Check",
    opsSummary: "Operations Summary",
    sClients: "Active Clients",
    sPlans: "Plans",
    sMessages: "Messages",
    sAdherence: "Adherence",
    feedTitle: "Recent Activity",
    feedEmpty: "No activity yet.",
    cityTitle: "Queue Distribution",
    cityEmpty: "No city data available.",
    managementTitle: "Management Notes",
    managementA: "Application Standard",
    managementADesc: "Approvals are faster when license, clinic and contact fields are complete.",
    managementB: "Security Flow",
    managementBDesc: "OTP, roles and session controls should be monitored together.",
    managementC: "Monitoring Routine",
    managementCDesc: "Auto refresh keeps this screen actionable without manual checks.",
    detailName: "Name",
    detailEmail: "Email",
    detailPhone: "Phone",
    detailClinic: "Clinic",
    detailCity: "City",
    detailLicense: "License",
    detailAddress: "Address",
    unknownCity: "Unknown",
    fallbackAdmin: "Admin",
    summaryErr: "Failed to load summary.",
    appErr: "Failed to load applications.",
    approveErr: "Approval failed.",
    load: "Loading...",
  },
} as const;

export default function AdminPanel() {
  const navigate = useNavigate();
  const [theme] = useState<Theme>(() => (localStorage.getItem("sd_theme") === "dark" ? "dark" : "light"));
  const [lang] = useState<Lang>(() => (localStorage.getItem("sd_lang") === "en" ? "en" : "tr"));
  const [user, setUser] = useState<SessionUser | null>(() => {
    try {
      const raw = localStorage.getItem("sd_user");
      return raw ? (JSON.parse(raw) as SessionUser) : null;
    } catch {
      return null;
    }
  });
  const [loadingProfile, setLoadingProfile] = useState(Boolean(localStorage.getItem("access_token")));
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingApps, setLoadingApps] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary>({ activeClients: 0, plans: 0, messages: 0, adherence: 0 });
  const [stats, setStats] = useState<LandingStats>({ totalDietitians: 0, approvedDietitians: 0, totalUsers: 0, activeUsers: 0 });
  const [applications, setApplications] = useState<DietitianApplication[]>([]);
  const [summaryError, setSummaryError] = useState("");
  const [appError, setAppError] = useState("");
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("queue");
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [selectedId, setSelectedId] = useState("");

  const t = COPY[lang];
  const isDark = theme === "dark";

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }
    fetch(`${API_BASE}/api/auth/profile`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || "profile_error");
        return data?.data ?? data;
      })
      .then((profile: SessionUser) => {
        setUser(profile);
        localStorage.setItem("sd_user", JSON.stringify(profile));
      })
      .catch(() => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("sd_user");
        navigate("/login", { replace: true });
      })
      .finally(() => setLoadingProfile(false));
  }, [navigate]);

  const isAdmin = useMemo(() => (user?.roles || []).some((r) => String(r?.name || "").toLowerCase() === "admin"), [user]);
  useEffect(() => {
    if (!loadingProfile && user && !isAdmin) navigate("/", { replace: true });
  }, [isAdmin, loadingProfile, navigate, user]);

  const displayName = useMemo(() => {
    if (!user) return t.fallbackAdmin;
    const full = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
    return full || user.full_name || user.display_name || user.email || t.fallbackAdmin;
  }, [t.fallbackAdmin, user]);

  const fetchSummary = useCallback(async (token: string) => {
    setSummaryError("");
    setLoadingSummary(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/dashboard/summary`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error();
      const payload = data?.data ?? data;
      setSummary({
        activeClients: Number(payload?.activeClients ?? 0),
        plans: Number(payload?.plans ?? 0),
        messages: Number(payload?.messages ?? 0),
        adherence: Number(payload?.adherence ?? 0),
      });
    } catch {
      setSummaryError(t.summaryErr);
    } finally {
      setLoadingSummary(false);
    }
  }, [t.summaryErr]);

  const fetchApps = useCallback(async (token: string) => {
    setAppError("");
    setLoadingApps(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/admin/dietitian-applications`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error();
      const payload = data?.data ?? data;
      setApplications(Array.isArray(payload) ? payload : []);
    } catch {
      setAppError(t.appErr);
    } finally {
      setLoadingApps(false);
    }
  }, [t.appErr]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/public/landing-stats`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return;
      const payload = data?.data ?? data;
      setStats({
        totalDietitians: Number(payload?.totalDietitians ?? 0),
        approvedDietitians: Number(payload?.approvedDietitians ?? 0),
        totalUsers: Number(payload?.totalUsers ?? 0),
        activeUsers: Number(payload?.activeUsers ?? 0),
      });
    } catch {
      // no-op
    }
  }, []);

  const refreshAll = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token || !isAdmin) return;
    await Promise.all([fetchSummary(token), fetchApps(token), fetchStats()]);
    setLastUpdatedAt(Date.now());
  }, [fetchApps, fetchStats, fetchSummary, isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    refreshAll();
    const timer = window.setInterval(refreshAll, 20000);
    return () => window.clearInterval(timer);
  }, [isAdmin, refreshAll]);

  const cities = useMemo(() => {
    const values = new Set<string>();
    for (const app of applications) {
      const city = String(app.clinic_city || "").trim();
      if (city) values.add(city);
    }
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [applications]);

  const filteredApps = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = applications.filter((app) => {
      const text = [app.first_name, app.last_name, app.email, app.phone_number, app.clinic_name, app.clinic_city].map((v) => String(v || "").toLowerCase()).join(" ");
      return (cityFilter ? String(app.clinic_city || "") === cityFilter : true) && (q ? text.includes(q) : true);
    });
    list.sort((a, b) => {
      const aTime = new Date(a.submitted_at || 0).getTime();
      const bTime = new Date(b.submitted_at || 0).getTime();
      return sortMode === "newest" ? bTime - aTime : aTime - bTime;
    });
    return list;
  }, [applications, cityFilter, search, sortMode]);

  useEffect(() => {
    if (!filteredApps.length) return setSelectedId("");
    if (!selectedId || !filteredApps.some((app) => app.user_id === selectedId)) setSelectedId(filteredApps[0].user_id);
  }, [filteredApps, selectedId]);

  const selected = useMemo(() => filteredApps.find((app) => app.user_id === selectedId) || null, [filteredApps, selectedId]);
  const approvalRate = stats.totalDietitians > 0 ? Math.round((stats.approvedDietitians / stats.totalDietitians) * 100) : 0;
  const activeRate = stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0;
  const queuePressure = Math.min(100, Math.round((applications.length / Math.max(stats.approvedDietitians, 1)) * 100));

  const cityDistribution = useMemo(() => {
    const map = new Map<string, number>();
    for (const app of applications) {
      const city = String(app.clinic_city || t.unknownCity).trim() || t.unknownCity;
      map.set(city, (map.get(city) || 0) + 1);
    }
    return Array.from(map.entries()).map(([city, count]) => ({ city, count })).sort((a, b) => b.count - a.count).slice(0, 6);
  }, [applications, t.unknownCity]);

  const recentFeed = useMemo(() => filteredApps.slice(0, 6), [filteredApps]);

  const approveSelected = async () => {
    if (!selected) return;
    const token = localStorage.getItem("access_token");
    if (!token) return;
    setApprovingId(selected.user_id);
    setAppError("");
    try {
      const res = await fetch(`${API_BASE}/api/auth/admin/dietitian-applications/${selected.user_id}/approve`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error();
      setApplications((prev) => prev.filter((row) => row.user_id !== selected.user_id));
      fetchStats();
      setLastUpdatedAt(Date.now());
    } catch {
      setAppError(t.approveErr);
    } finally {
      setApprovingId(null);
    }
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("sd_user");
    navigate("/login", { replace: true });
  };

  const updatedText = lastUpdatedAt ? new Date(lastUpdatedAt).toLocaleTimeString(lang === "tr" ? "tr-TR" : "en-US") : "-";
  const n = (value: number) => Number(value || 0).toLocaleString(lang === "tr" ? "tr-TR" : "en-US");

  if (loadingProfile || !isAdmin) return <div className="grid min-h-screen place-items-center bg-[#07090b] text-sm text-zinc-300">{t.load}</div>;

  return (
    <div className={["relative min-h-screen w-screen overflow-x-hidden", isDark ? "text-zinc-50" : "text-[#103930]"].join(" ")}>
      <div className="pointer-events-none absolute inset-0">
        <div className={isDark ? "absolute inset-0 [background:radial-gradient(1200px_720px_at_72%_-10%,rgba(16,185,129,0.24),transparent_55%),radial-gradient(980px_640px_at_10%_105%,rgba(20,184,166,0.16),transparent_58%),linear-gradient(180deg,#050608,#07090b_45%,#050608)]" : "absolute inset-0 [background:radial-gradient(1180px_740px_at_10%_0%,rgba(22,128,101,0.23),transparent_58%),radial-gradient(980px_640px_at_92%_8%,rgba(20,120,133,0.16),transparent_56%),linear-gradient(180deg,#edf5f1,#e2ede8_56%,#dce8e2)]"} />
      </div>

      <main className="relative z-10 mx-auto w-full max-w-[1450px] px-4 pb-10 pt-6 sm:px-6">
        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className={["inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-bold ring-1", isDark ? "bg-emerald-500/12 text-emerald-100 ring-emerald-300/25" : "bg-white/90 text-[#145443] ring-[#2f6154]/26"].join(" ")}>{t.tag}</div>
            <h1 className="mt-4 text-[34px] font-black leading-[1.03] tracking-tight sm:text-[48px]">{t.title}</h1>
            <p className={["mt-2 max-w-2xl text-sm", isDark ? "text-zinc-300" : "text-[#45695f]"].join(" ")}>{t.subtitle}</p>
            <p className={["mt-2 text-xs", isDark ? "text-zinc-400" : "text-[#547a6f]"].join(" ")}>{t.welcome} {displayName} - {t.updated}: {updatedText}</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={refreshAll} className={btnClass(isDark)}>{t.refresh}</button>
            <Link to="/profile" className={btnClass(isDark)}>{t.profile}</Link>
            <button type="button" onClick={logout} className={[btnClass(isDark), isDark ? "!bg-rose-500/18 !text-rose-100" : "!bg-rose-100 !text-rose-700"].join(" ")}>{t.logout}</button>
          </div>
        </header>

        <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <div className={panelClass(isDark)}>
            <div className="mb-4 flex items-center gap-2">
              <button type="button" onClick={() => setViewMode("queue")} className={tabClass(isDark, viewMode === "queue")}>{t.queueTab}</button>
              <button type="button" onClick={() => setViewMode("ops")} className={tabClass(isDark, viewMode === "ops")}>{t.opsTab}</button>
            </div>

            {viewMode === "queue" ? (
              <>
                <h2 className="text-sm font-black">{t.queueTitle}</h2>
                <p className={["mt-1 text-xs", isDark ? "text-zinc-400" : "text-[#567b70]"].join(" ")}>{t.queueSub}</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <label><span className={labelClass(isDark)}>{t.search}</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.searchPh} className={inputClass(isDark)} /></label>
                  <label><span className={labelClass(isDark)}>{t.city}</span><select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className={inputClass(isDark)}><option value="">{t.allCities}</option>{cities.map((city) => <option key={city} value={city}>{city}</option>)}</select></label>
                  <label><span className={labelClass(isDark)}>{t.sort}</span><select value={sortMode} onChange={(e) => setSortMode(e.target.value as SortMode)} className={inputClass(isDark)}><option value="newest">{t.newest}</option><option value="oldest">{t.oldest}</option></select></label>
                </div>
                {appError ? <ErrorBox isDark={isDark}>{appError}</ErrorBox> : null}
                <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
                  <div className={innerPanel(isDark)}>
                    <div className="mb-2 text-xs font-bold">{t.metricPending}: {applications.length}</div>
                    <div className="max-h-[420px] space-y-2 overflow-auto pr-1">
                      {loadingApps ? <div className={hintClass(isDark)}>{t.load}</div> : null}
                      {!loadingApps && filteredApps.length === 0 ? <div className={hintClass(isDark)}>{t.noResult}</div> : null}
                      {filteredApps.map((app) => (
                        <button key={app.user_id} type="button" onClick={() => setSelectedId(app.user_id)} className={["w-full rounded-xl border px-3 py-3 text-left transition", app.user_id === selectedId ? (isDark ? "border-emerald-300/45 bg-emerald-500/14" : "border-[#2f6154]/35 bg-[#e9f5ef]") : (isDark ? "border-white/10 bg-black/25 hover:bg-white/5" : "border-[#2f6154]/18 bg-white/92 hover:bg-[#f4faf7]")].join(" ")}>
                          <div className="text-sm font-black">{[app.first_name, app.last_name].filter(Boolean).join(" ").trim() || app.email || app.phone_number || app.user_id}</div>
                          <div className={["mt-1 text-xs", isDark ? "text-zinc-300" : "text-[#496c62]"].join(" ")}>{(app.clinic_name || "-") + " - " + (app.clinic_city || "-")}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className={innerPanel(isDark)}>
                    <div className="text-sm font-black">{t.selectedTitle}</div>
                    {!selected ? <div className={["mt-2 text-sm", isDark ? "text-zinc-400" : "text-[#5d7f74]"].join(" ")}>{t.noSelection}</div> : (
                      <div className="mt-2 space-y-1.5 text-xs">
                        <DetailRow isDark={isDark} k={t.detailName} v={[selected.first_name, selected.last_name].filter(Boolean).join(" ").trim() || "-"} />
                        <DetailRow isDark={isDark} k={t.detailEmail} v={selected.email || "-"} />
                        <DetailRow isDark={isDark} k={t.detailPhone} v={selected.phone_number || "-"} />
                        <DetailRow isDark={isDark} k={t.detailClinic} v={selected.clinic_name || "-"} />
                        <DetailRow isDark={isDark} k={t.detailCity} v={selected.clinic_city || "-"} />
                        <DetailRow isDark={isDark} k={t.detailLicense} v={selected.clinic_license_no || "-"} />
                        <DetailRow isDark={isDark} k={t.detailAddress} v={selected.clinic_address || "-"} />
                        <button type="button" disabled={approvingId === selected.user_id} onClick={approveSelected} className="mt-2 w-full rounded-xl bg-gradient-to-r from-emerald-400 to-teal-300 px-3 py-2 text-xs font-black text-zinc-950 transition hover:brightness-110 disabled:opacity-60">{approvingId === selected.user_id ? t.approving : t.approve}</button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                {summaryError ? <ErrorBox isDark={isDark}>{summaryError}</ErrorBox> : null}
                <h2 className="mb-3 text-sm font-black">{t.opsSummary}</h2>
                <div className="grid gap-2 sm:grid-cols-2">
                  <StatCard isDark={isDark} label={t.sClients} value={loadingSummary ? "..." : String(summary.activeClients)} />
                  <StatCard isDark={isDark} label={t.sPlans} value={loadingSummary ? "..." : String(summary.plans)} />
                  <StatCard isDark={isDark} label={t.sMessages} value={loadingSummary ? "..." : String(summary.messages)} />
                  <StatCard isDark={isDark} label={t.sAdherence} value={loadingSummary ? "..." : `${summary.adherence}%`} />
                </div>
                <div className="mt-3 rounded-xl border border-emerald-300/20 p-3">
                  <div className="text-xs font-black">{t.systemTitle}</div>
                  <HealthRow isDark={isDark} label={t.stepApi} ok={!summaryError} okText={t.healthy} badText={t.check} />
                  <HealthRow isDark={isDark} label={t.stepOtp} ok={!appError} okText={t.healthy} badText={t.check} />
                  <HealthRow isDark={isDark} label={t.stepRoles} ok={isAdmin} okText={t.healthy} badText={t.check} />
                  <HealthRow isDark={isDark} label={t.stepQueue} ok={applications.length < 10} okText={t.healthy} badText={t.check} />
                </div>
              </>
            )}
          </div>

          <div className={panelClass(isDark)}>
            <h2 className="mb-3 text-sm font-black">{t.summaryTitle}</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              <StatCard isDark={isDark} label={t.metricPending} value={String(applications.length)} />
              <StatCard isDark={isDark} label={t.metricApproved} value={n(stats.approvedDietitians)} />
              <StatCard isDark={isDark} label={t.metricUsers} value={n(stats.totalUsers)} />
              <StatCard isDark={isDark} label={t.metricActiveUsers} value={n(stats.activeUsers)} />
              <StatCard isDark={isDark} label={t.metricDietitians} value={n(stats.totalDietitians)} />
            </div>
            <div className="mt-4 space-y-3">
              <RateRow isDark={isDark} label={t.activityRate} value={activeRate} tone="emerald" />
              <RateRow isDark={isDark} label={t.approvalRate} value={approvalRate} tone="teal" />
              <RateRow isDark={isDark} label={t.queuePressure} value={queuePressure} tone="amber" />
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-3">
          <div className={panelClass(isDark)}>
            <h3 className="mb-3 text-sm font-black">{t.feedTitle}</h3>
            {recentFeed.length === 0 ? <div className={hintClass(isDark)}>{t.feedEmpty}</div> : null}
            <div className="space-y-2">
              {recentFeed.map((app) => (
                <div key={app.user_id} className={innerPanel(isDark)}>
                  <div className="text-xs font-black">{[app.first_name, app.last_name].filter(Boolean).join(" ").trim() || app.email || app.phone_number || app.user_id}</div>
                  <div className={hintClass(isDark)}>{(app.clinic_name || "-") + " - " + (app.clinic_city || "-")}</div>
                  <div className={["mt-1 text-[11px]", isDark ? "text-zinc-500" : "text-[#6f8e84]"].join(" ")}>{formatDate(app.submitted_at, lang)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className={panelClass(isDark)}>
            <h3 className="mb-3 text-sm font-black">{t.cityTitle}</h3>
            {cityDistribution.length === 0 ? <div className={hintClass(isDark)}>{t.cityEmpty}</div> : null}
            <div className="space-y-2">
              {cityDistribution.map((item) => {
                const percent = applications.length > 0 ? Math.round((item.count / applications.length) * 100) : 0;
                return (
                  <div key={item.city} className={innerPanel(isDark)}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{item.city}</span>
                      <span className="text-xs font-black">{item.count}</span>
                    </div>
                    <div className={["mt-2 h-1.5 w-full overflow-hidden rounded-full", isDark ? "bg-white/10" : "bg-[#d7e6df]"].join(" ")}>
                      <div className="h-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-teal-300" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={panelClass(isDark)}>
            <h3 className="mb-3 text-sm font-black">{t.managementTitle}</h3>
            <NoteCard isDark={isDark} title={t.managementA} text={t.managementADesc} />
            <NoteCard isDark={isDark} title={t.managementB} text={t.managementBDesc} />
            <NoteCard isDark={isDark} title={t.managementC} text={t.managementCDesc} />
          </div>
        </section>
      </main>
    </div>
  );
}

function formatDate(value?: string | null, lang: Lang = "tr") {
  if (!value) return "-";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US");
}

function btnClass(isDark: boolean) {
  return ["rounded-xl px-4 py-2 text-xs font-extrabold transition", isDark ? "border border-white/10 bg-white/5 hover:bg-white/10" : "border border-[#2f6154]/22 bg-white/90 hover:bg-white"].join(" ");
}
function tabClass(isDark: boolean, active: boolean) {
  return ["rounded-lg px-3 py-2 text-xs font-bold transition", active ? (isDark ? "bg-emerald-500/18 text-emerald-100" : "bg-[#dff0e8] text-[#12473d]") : (isDark ? "text-zinc-300 hover:bg-white/10" : "text-[#3e6057] hover:bg-[#eef6f2]")].join(" ");
}
function panelClass(isDark: boolean) {
  return ["rounded-[26px] border p-5 backdrop-blur", isDark ? "border-white/10 bg-white/5 shadow-[0_28px_120px_rgba(0,0,0,0.45)]" : "border-[#2f6154]/22 bg-white/82 shadow-[0_20px_75px_rgba(8,23,20,0.10)]"].join(" ");
}
function innerPanel(isDark: boolean) {
  return ["rounded-xl border px-3 py-3", isDark ? "border-white/10 bg-black/20" : "border-[#2f6154]/18 bg-white"].join(" ");
}
function inputClass(isDark: boolean) {
  return ["w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition", isDark ? "border-white/10 bg-black/25 text-zinc-100 focus:border-emerald-300/35 focus:ring-2 focus:ring-emerald-300/20" : "border-[#2f6154]/20 bg-white text-[#123a32] focus:border-[#2f6154]/40 focus:ring-2 focus:ring-[#2f6154]/12"].join(" ");
}
function labelClass(isDark: boolean) {
  return ["mb-1 block text-xs font-bold", isDark ? "text-zinc-300" : "text-[#486b61]"].join(" ");
}
function hintClass(isDark: boolean) {
  return ["text-sm", isDark ? "text-zinc-400" : "text-[#587a70]"].join(" ");
}

function StatCard({ isDark, label, value }: { isDark: boolean; label: string; value: string }) {
  return <div className={innerPanel(isDark)}><div className={["text-[11px] font-semibold", isDark ? "text-zinc-400" : "text-[#5a7b71]"].join(" ")}>{label}</div><div className="mt-1 text-xl font-black">{value}</div></div>;
}
function HealthRow({ isDark, label, ok, okText, badText }: { isDark: boolean; label: string; ok: boolean; okText: string; badText: string }) {
  return <div className={["mt-2 flex items-center justify-between rounded-lg px-2 py-2", isDark ? "bg-black/25" : "bg-[#f3faf6]"].join(" ")}><span className={["text-xs font-semibold", isDark ? "text-zinc-300" : "text-[#3f6459]"].join(" ")}>{label}</span><span className={["rounded-full px-2 py-1 text-[10px] font-bold", ok ? (isDark ? "bg-emerald-500/16 text-emerald-100" : "bg-[#dff0e8] text-[#134a3f]") : (isDark ? "bg-amber-500/16 text-amber-100" : "bg-amber-100 text-amber-800")].join(" ")}>{ok ? okText : badText}</span></div>;
}
function DetailRow({ isDark, k, v }: { isDark: boolean; k: string; v: string }) {
  return <div className={["grid grid-cols-[86px_1fr] gap-2 rounded-lg px-2 py-1.5", isDark ? "bg-black/20" : "bg-[#f4faf7]"].join(" ")}><div className={["text-[11px] font-bold", isDark ? "text-zinc-400" : "text-[#5e7f74]"].join(" ")}>{k}</div><div className={["break-words text-xs font-semibold", isDark ? "text-zinc-200" : "text-[#2f564a]"].join(" ")}>{v}</div></div>;
}
function RateRow({ isDark, label, value, tone }: { isDark: boolean; label: string; value: number; tone: "emerald" | "teal" | "amber" }) {
  const safe = Math.max(0, Math.min(100, value));
  const fill = tone === "teal" ? "from-teal-300 to-emerald-300" : tone === "amber" ? "from-amber-300 to-orange-300" : "from-emerald-400 to-teal-300";
  return <div><div className="flex items-center justify-between text-xs"><span className={isDark ? "text-zinc-300" : "text-[#3f6459]"}>{label}</span><span className="font-black">{safe}%</span></div><div className={["mt-1 h-2 w-full overflow-hidden rounded-full", isDark ? "bg-white/10" : "bg-[#d7e6df]"].join(" ")}><div className={`h-2 rounded-full bg-gradient-to-r ${fill}`} style={{ width: `${safe}%` }} /></div></div>;
}
function NoteCard({ isDark, title, text }: { isDark: boolean; title: string; text: string }) {
  return <div className={[innerPanel(isDark), "mb-2"].join(" ")}><div className="text-xs font-black">{title}</div><div className={["mt-1 text-xs leading-5", isDark ? "text-zinc-300" : "text-[#4c6f65]"].join(" ")}>{text}</div></div>;
}
function ErrorBox({ isDark, children }: { isDark: boolean; children: string }) {
  return <div className={["mt-3 rounded-xl border px-3 py-2 text-xs", isDark ? "border-rose-500/30 bg-rose-500/10 text-rose-200" : "border-rose-400/40 bg-rose-100 text-rose-700"].join(" ")}>{children}</div>;
}
