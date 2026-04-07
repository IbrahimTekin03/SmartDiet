import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { RoleWorkspaceBoard, type WorkspaceItem } from "../components/RoleWorkspaceBoard";
import { useAppSettings } from "../context/AppSettingsContext";
import { clearAuthSession, setAuthSession } from "../lib/authSession";

type Lang = "tr" | "en";
type ViewMode = "queue" | "ops";
type SortMode = "newest" | "oldest";
type ApplicationStatus = "pending" | "rejected";

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
  verification_note?: string | null;
  review_note?: string | null;
  submitted_at?: string | null;
  reviewed_at?: string | null;
};

type PagedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type HistoryItem = {
  user_id: string;
  first_name?: string;
  last_name?: string;
  email?: string | null;
  phone_number?: string | null;
  clinic_name?: string | null;
  clinic_city?: string | null;
  action: "approved" | "rejected";
  review_note?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
};

type UserOverviewItem = {
  user_id: string;
  first_name?: string;
  last_name?: string;
  email?: string | null;
  phone_number?: string | null;
  roles?: string[];
  account_type?: "client" | "dietitian";
  dietitian_verification_status?: string;
  clinic_name?: string | null;
  clinic_city?: string | null;
  is_active?: boolean;
  assigned_dietitian_id?: string | null;
  assigned_dietitian_name?: string | null;
  assigned_clients_count?: number;
};

type ConnectionItem = {
  id: string;
  client_id: string;
  client_name: string;
  client_email?: string | null;
  dietitian_id: string;
  dietitian_name: string;
  dietitian_email?: string | null;
  clinic_name?: string | null;
  clinic_city?: string | null;
  start_date?: string | null;
  notes?: string | null;
};

const API_BASE = "http://localhost:3000";

const COPY = {
  tr: {
    tag: "Y?netim Paneli",
    title: "Platform Y?netimi",
    subtitle: "Ba?vuru onay?, sistem g?r?n?rl??? ve operasyon kararlar?n? tek ekrandan y?net.",
    welcome: "Ho? geldin",
    updated: "Son g?ncelleme",
    refresh: "Yenile",
    profile: "Profil",
    logout: "??k?? Yap",
    queueTab: "Ba?vuru Merkezi",
    opsTab: "Operasyon",
    pendingTab: "Bekleyenler",
    rejectedTab: "Reddedilenler",
    queueTitle: "Diyetisyen Ba?vurular?",
    queueSub: "Ba?vuruyu se?, detaylar? incele ve gerekli aksiyonu al.",
    search: "Ba?vuru Ara",
    searchPh: "isim, e-posta, klinik",
    city: "?ehir",
    allCities: "T?m ?ehirler",
    sort: "S?ralama",
    newest: "Yeni > Eski",
    oldest: "Eski > Yeni",
    noResult: "Filtrelere uygun ba?vuru bulunamad?.",
    selectedTitle: "Se?ili Ba?vuru",
    noSelection: "Detay g?r?nt?lemek i?in soldan bir ba?vuru se?.",
    approve: "Onayla",
    approving: "Onaylan?yor...",
    reject: "Reddet",
    rejecting: "Reddediliyor...",
    rejectReason: "Red Nedeni",
    rejectReasonPh: "Ba?vurunun neden reddedildi?ini kullan?c?ya g?sterilecek ?ekilde a??klay?n.",
    rejectValidation: "Red nedeni en az 5 karakter olmal?d?r.",
    applicantNote: "Ba?vuru Notu",
    reviewNote: "?nceleme Notu",
    summaryTitle: "Canl? ?zet",
    metricPending: "Bekleyen Ba?vuru",
    metricRejected: "Reddedilen Ba?vuru",
    metricApproved: "Onayl? Diyetisyen",
    metricUsers: "Toplam Kullan?c?",
    metricActiveUsers: "Aktif Kullan?c?",
    metricDietitians: "Toplam Diyetisyen",
    activityRate: "Aktiflik Oran?",
    approvalRate: "Onay Oran?",
    queuePressure: "Kuyruk Yo?unlu?u",
    systemTitle: "Sistem Sa?l???",
    stepApi: "API",
    stepOtp: "OTP",
    stepRoles: "Roller",
    stepQueue: "Onay Kuyru?u",
    healthy: "Stabil",
    check: "Kontrol",
    opsSummary: "Operasyon ?zeti",
    sClients: "Aktif Dan??an",
    sPlans: "Plan",
    sMessages: "Mesaj",
    sAdherence: "Uyum",
    feedTitle: "Son Aktivite",
    feedEmpty: "Hen?z aktivite bulunmuyor.",
    cityTitle: "Kuyruk Da??l?m?",
    cityEmpty: "?ehir bazl? veri bulunmuyor.",
    managementTitle: "Y?netsel Notlar",
    managementA: "Ba?vuru Standard?",
    managementADesc: "Lisans, klinik ve ileti?im alanlar? eksiksiz oldu?unda onay s?reci h?zlan?r.",
    managementB: "G?venlik Ak???",
    managementBDesc: "OTP, rol ve oturum kontrolleri birlikte izlenmelidir.",
    managementC: "Takip Rutini",
    managementCDesc: "Panelin d?zenli yenilenmesi operasyon takibini kolayla?t?r?r.",
    detailName: "?sim",
    detailEmail: "E-posta",
    detailPhone: "Telefon",
    detailClinic: "Klinik",
    detailCity: "?ehir",
    detailLicense: "Lisans",
    detailAddress: "Adres",
    unknownCity: "Belirsiz",
    fallbackAdmin: "Y?netici",
    summaryErr: "?zet verisi al?namad?.",
    appErr: "Ba?vurular al?namad?.",
    approveErr: "Onay i?lemi tamamlanamad?.",
    rejectErr: "Red i?lemi tamamlanamad?.",
    load: "Y?kleniyor...",
    pagination: "Sayfa",
    prev: "?nceki",
    next: "Sonraki",
    historyTitle: "??lem Ge?mi?i",
    historyEmpty: "Hen?z i?lem ge?mi?i bulunmuyor.",
    historyLoadError: "??lem ge?mi?i al?namad?.",
    actionApproved: "Onayland?",
    actionRejected: "Reddedildi",
    visibilityTitle: "Rol G?r?n?rl???",
    visibilitySub: "Admin olarak kullan?c?, diyetisyen, klinik y?neticisi ve kendi operasyon ak???n? ayn? panelde izlersin.",
    userSystem: "Kullan?c? Ak???",
    userSystemSub: "Kullan?c? profilini tamamlar, ?l??m girer, plan?n? takip eder ve not tutar.",
    dietitianSystem: "Diyetisyen Ak???",
    dietitianSystemSub: "Diyetisyen dan??an, plan, ?l??m ve ileti?im ak???n? y?netir.",
    managerSystem: "Klinik Y?netici Ak???",
    managerSystemSub: "Klinik y?neticisi ba?l? diyetisyenleri filtreler, detay g?r?r ve aktiflik y?netir.",
    adminSystem: "Admin Ak???",
    adminSystemSub: "T?m rol ak??lar?, onay s?re?leri ve sistem sa?l??? tek panelde toplan?r.",
    userA: "Profil ve hedefler",
    userB: "?l??m takibi",
    userC: "Plan uyumu",
    userD: "Destek ve notlar",
    dietA: "Dan??an tarama",
    dietB: "Plan y?netimi",
    dietC: "?l??m yorumlama",
    dietD: "Mesaj ritmi",
    managerA: "Diyetisyen listesi",
    managerB: "Filtre ve detay",
    managerC: "Aktiflik kontrol?",
    managerD: "H?zl? ileti?im i?lemleri",
    adminA: "Ba?vuru onay?",
    adminB: "Rol g?r?n?rl???",
    adminC: "Sistem sa?l???",
    adminD: "??lem ge?mi?i",
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
    pendingTab: "Pending",
    rejectedTab: "Rejected",
    queueTitle: "Dietitian Applications",
    queueSub: "Pick an application, inspect details and take action.",
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
    reject: "Reject",
    rejecting: "Rejecting...",
    rejectReason: "Rejection Reason",
    rejectReasonPh: "Why is this application rejected? This text will be shown to the user.",
    rejectValidation: "Rejection reason must be at least 5 characters.",
    applicantNote: "Application Note",
    reviewNote: "Review Note",
    summaryTitle: "Live Summary",
    metricPending: "Pending Applications",
    metricRejected: "Rejected Applications",
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
    rejectErr: "Rejection failed.",
    load: "Loading...",
    pagination: "Page",
    prev: "Previous",
    next: "Next",
    historyTitle: "Action History",
    historyEmpty: "No action history yet.",
    historyLoadError: "Failed to load action history.",
    actionApproved: "Approved",
    actionRejected: "Rejected",
    visibilityTitle: "Role Visibility",
    visibilitySub: "As admin, you can inspect the user, dietitian, clinic manager and your own operations flow from one screen.",
    userSystem: "Regular User System",
    userSystemSub: "The user completes profile, records measurements, follows plans and keeps notes.",
    dietitianSystem: "Dietitian System",
    dietitianSystemSub: "The dietitian focuses on client, plan, measurement and communication flow.",
    managerSystem: "Clinic Manager System",
    managerSystemSub: "The clinic manager filters approved dietitians, opens details and manages activation.",
    adminSystem: "Admin System",
    adminSystemSub: "All role flows, approval work and system health are gathered in one panel.",
    userA: "Profile and goals",
    userB: "Measurement tracking",
    userC: "Plan adherence",
    userD: "Support and notes",
    dietA: "Client review",
    dietB: "Plan management",
    dietC: "Measurement interpretation",
    dietD: "Message rhythm",
    managerA: "Dietitian directory",
    managerB: "Filters and details",
    managerC: "Activation control",
    managerD: "Quick contact actions",
    adminA: "Application approval",
    adminB: "Role visibility",
    adminC: "System health",
    adminD: "Action history",
  },
} as const;

export default function AdminPanel() {
  const navigate = useNavigate();
  const { lang, isDark } = useAppSettings();
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
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary>({ activeClients: 0, plans: 0, messages: 0, adherence: 0 });
  const [stats, setStats] = useState<LandingStats>({ totalDietitians: 0, approvedDietitians: 0, totalUsers: 0, activeUsers: 0 });
  const [applications, setApplications] = useState<DietitianApplication[]>([]);
  const [applicationsTotal, setApplicationsTotal] = useState(0);
  const [applicationsPage, setApplicationsPage] = useState(1);
  const [applicationsLimit] = useState(10);
  const [applicationsTotalPages, setApplicationsTotalPages] = useState(0);
  const [summaryError, setSummaryError] = useState("");
  const [appError, setAppError] = useState("");
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");
  const [usersOverview, setUsersOverview] = useState<UserOverviewItem[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [connections, setConnections] = useState<ConnectionItem[]>([]);
  const [connectionsLoading, setConnectionsLoading] = useState(true);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedDietitianId, setSelectedDietitianId] = useState("");
  const [assignmentNote, setAssignmentNote] = useState("");
  const [assigningConnection, setAssigningConnection] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState("");
  const [connectionError, setConnectionError] = useState("");
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLimit] = useState(8);
  const [historyTotalPages, setHistoryTotalPages] = useState(0);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("queue");
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus>("pending");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [selectedId, setSelectedId] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const refreshInFlightRef = useRef(false);
  const refreshAllRef = useRef<() => Promise<void>>(async () => undefined);

  const t = COPY[lang];

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput), 320);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

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
        setAuthSession({ user: profile });
      })
      .catch(() => {
        clearAuthSession();
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

  const fetchApps = useCallback(async (token: string, status: ApplicationStatus, page: number) => {
    setAppError("");
    setLoadingApps(true);
    try {
      const params = new URLSearchParams();
      params.set("status", status);
      params.set("page", String(page));
      params.set("limit", String(applicationsLimit));
      if (search.trim()) params.set("search", search.trim());
      if (cityFilter.trim()) params.set("city", cityFilter.trim());
      params.set("sort", sortMode);

      const res = await fetch(`${API_BASE}/api/auth/admin/dietitian-applications?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error();
      const payload = (data?.data ?? data) as PagedResponse<DietitianApplication>;
      setApplications(Array.isArray(payload?.items) ? payload.items : []);
      setApplicationsTotal(Number(payload?.total ?? 0));
      setApplicationsPage(Number(payload?.page ?? page));
      setApplicationsTotalPages(Number(payload?.totalPages ?? 0));
    } catch {
      setAppError(t.appErr);
      setApplications([]);
      setApplicationsTotal(0);
      setApplicationsTotalPages(0);
    } finally {
      setLoadingApps(false);
    }
  }, [applicationsLimit, cityFilter, search, sortMode, t.appErr]);

  const fetchHistory = useCallback(async (token: string, page: number) => {
    setHistoryError("");
    setHistoryLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(historyLimit));
      const res = await fetch(`${API_BASE}/api/auth/admin/dietitian-applications/history?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error();
      const payload = (data?.data ?? data) as PagedResponse<HistoryItem>;
      setHistoryItems(Array.isArray(payload?.items) ? payload.items : []);
      setHistoryPage(Number(payload?.page ?? page));
      setHistoryTotalPages(Number(payload?.totalPages ?? 0));
    } catch {
      setHistoryError(t.historyLoadError);
      setHistoryItems([]);
      setHistoryTotalPages(0);
    } finally {
      setHistoryLoading(false);
    }
  }, [historyLimit, t.historyLoadError]);

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

  const fetchUsersOverview = useCallback(async (token: string) => {
    setUsersLoading(true);
    setConnectionError("");
    try {
      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("limit", "50");
      const res = await fetch(`${API_BASE}/api/auth/admin/users-overview?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error();
      const payload = (data?.data ?? data) as PagedResponse<UserOverviewItem>;
      setUsersOverview(Array.isArray(payload?.items) ? payload.items : []);
    } catch {
      setUsersOverview([]);
      setConnectionError(lang === "tr" ? "Kullanıcı listesi alınamadı." : "Failed to load users.");
    } finally {
      setUsersLoading(false);
    }
  }, [lang]);

  const fetchConnections = useCallback(async (token: string) => {
    setConnectionsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("limit", "30");
      const res = await fetch(`${API_BASE}/api/auth/admin/connections?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error();
      const payload = (data?.data ?? data) as PagedResponse<ConnectionItem>;
      setConnections(Array.isArray(payload?.items) ? payload.items : []);
    } catch {
      setConnections([]);
      setConnectionError((prev) => prev || (lang === "tr" ? "Baglantilar alinamadi." : "Failed to load connections."));
    } finally {
      setConnectionsLoading(false);
    }
  }, [lang]);

  const refreshAll = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token || !isAdmin) return;
    if (refreshInFlightRef.current) return;
    refreshInFlightRef.current = true;
    try {
      await Promise.all([
        fetchSummary(token),
        fetchApps(token, applicationStatus, applicationsPage),
        fetchStats(),
        fetchHistory(token, historyPage),
        fetchUsersOverview(token),
        fetchConnections(token),
      ]);
      setLastUpdatedAt(Date.now());
    } finally {
      refreshInFlightRef.current = false;
    }
  }, [applicationStatus, applicationsPage, fetchApps, fetchConnections, fetchHistory, fetchStats, fetchSummary, fetchUsersOverview, historyPage, isAdmin]);

  useEffect(() => {
    refreshAllRef.current = refreshAll;
  }, [refreshAll]);

  useEffect(() => {
    if (!isAdmin) return;
    void refreshAll();
  }, [isAdmin, refreshAll]);

  useEffect(() => {
    if (!isAdmin) return;
    const run = () => {
      if (document.visibilityState !== "visible") return;
      void refreshAllRef.current();
    };

    const timer = window.setInterval(run, 30000);
    document.addEventListener("visibilitychange", run);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", run);
    };
  }, [isAdmin]);

  useEffect(() => {
    setApplicationsPage(1);
  }, [applicationStatus, cityFilter, search, sortMode]);

  const cities = useMemo(() => {
    const values = new Set<string>();
    for (const app of applications) {
      const city = String(app.clinic_city || "").trim();
      if (city) values.add(city);
    }
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [applications]);

  useEffect(() => {
    if (!applications.length) return setSelectedId("");
    if (!selectedId || !applications.some((app) => app.user_id === selectedId)) {
      setSelectedId(applications[0].user_id);
    }
  }, [applications, selectedId]);

  useEffect(() => {
    setRejectReason("");
  }, [selectedId, applicationStatus]);

  const selected = useMemo(() => applications.find((app) => app.user_id === selectedId) || null, [applications, selectedId]);
  const approvalRate = stats.totalDietitians > 0 ? Math.round((stats.approvedDietitians / stats.totalDietitians) * 100) : 0;
  const activeRate = stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0;
  const queuePressure = Math.min(100, Math.round((applicationsTotal / Math.max(stats.approvedDietitians, 1)) * 100));
  const visibilityBoards: Array<{ title: string; subtitle: string; items: WorkspaceItem[] }> = [
    {
      title: t.userSystem,
      subtitle: t.userSystemSub,
      items: [
        { id: "user-profile", title: t.userA, description: t.userSystemSub },
        { id: "user-measurements", title: t.userB, description: t.userSystemSub },
        { id: "user-plan", title: t.userC, description: t.userSystemSub },
        { id: "user-notes", title: t.userD, description: t.userSystemSub },
      ],
    },
    {
      title: t.dietitianSystem,
      subtitle: t.dietitianSystemSub,
      items: [
        { id: "diet-review", title: t.dietA, description: t.dietitianSystemSub },
        { id: "diet-plan", title: t.dietB, description: t.dietitianSystemSub },
        { id: "diet-measurements", title: t.dietC, description: t.dietitianSystemSub },
        { id: "diet-messages", title: t.dietD, description: t.dietitianSystemSub },
      ],
    },
    {
      title: t.managerSystem,
      subtitle: t.managerSystemSub,
      items: [
        { id: "manager-list", title: t.managerA, description: t.managerSystemSub },
        { id: "manager-filter", title: t.managerB, description: t.managerSystemSub },
        { id: "manager-active", title: t.managerC, description: t.managerSystemSub },
        { id: "manager-contact", title: t.managerD, description: t.managerSystemSub },
      ],
    },
    {
      title: t.adminSystem,
      subtitle: t.adminSystemSub,
      items: [
        { id: "admin-approve", title: t.adminA, description: t.adminSystemSub },
        { id: "admin-visibility", title: t.adminB, description: t.adminSystemSub },
        { id: "admin-health", title: t.adminC, description: t.adminSystemSub },
        { id: "admin-history", title: t.adminD, description: t.adminSystemSub },
      ],
    },
  ];
  const clientCandidates = useMemo(
    () => usersOverview.filter((item) => item.account_type === "client" && item.is_active),
    [usersOverview],
  );
  const dietitianCandidates = useMemo(
    () =>
      usersOverview.filter(
        (item) =>
          item.account_type === "dietitian" &&
          item.is_active &&
          item.dietitian_verification_status === "approved",
      ),
    [usersOverview],
  );
  const selectedClient = useMemo(
    () => clientCandidates.find((item) => item.user_id === selectedClientId) || null,
    [clientCandidates, selectedClientId],
  );
  const selectedDietitian = useMemo(
    () => dietitianCandidates.find((item) => item.user_id === selectedDietitianId) || null,
    [dietitianCandidates, selectedDietitianId],
  );

  useEffect(() => {
    if (!selectedClientId && clientCandidates.length) {
      setSelectedClientId(clientCandidates[0].user_id);
    }
  }, [clientCandidates, selectedClientId]);

  useEffect(() => {
    if (!selectedDietitianId && dietitianCandidates.length) {
      setSelectedDietitianId(dietitianCandidates[0].user_id);
    }
  }, [dietitianCandidates, selectedDietitianId]);

  const cityDistribution = useMemo(() => {
    const map = new Map<string, number>();
    for (const app of applications) {
      const city = String(app.clinic_city || t.unknownCity).trim() || t.unknownCity;
      map.set(city, (map.get(city) || 0) + 1);
    }
    return Array.from(map.entries()).map(([city, count]) => ({ city, count })).sort((a, b) => b.count - a.count).slice(0, 6);
  }, [applications, t.unknownCity]);

  const recentFeed = useMemo(() => applications.slice(0, 6), [applications]);

  const approveSelected = async () => {
    if (!selected) return;
    const token = localStorage.getItem("access_token");
    if (!token) return;
    setApprovingId(selected.user_id);
    setAppError("");
    try {
      const res = await fetch(`${API_BASE}/api/auth/admin/dietitian-applications/${selected.user_id}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const nextPage = applications.length === 1 && applicationsPage > 1 ? applicationsPage - 1 : applicationsPage;
      await Promise.all([
        fetchApps(token, applicationStatus, nextPage),
        fetchStats(),
        fetchHistory(token, 1),
      ]);
      setHistoryPage(1);
      setLastUpdatedAt(Date.now());
    } catch {
      setAppError(t.approveErr);
    } finally {
      setApprovingId(null);
    }
  };

  const rejectSelected = async () => {
    if (!selected) return;
    const token = localStorage.getItem("access_token");
    if (!token) return;

    const cleanReason = rejectReason.trim();
    if (cleanReason.length < 5) {
      setAppError(t.rejectValidation);
      return;
    }

    setRejectingId(selected.user_id);
    setAppError("");
    try {
      const res = await fetch(`${API_BASE}/api/auth/admin/dietitian-applications/${selected.user_id}/reject`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: cleanReason }),
      });
      if (!res.ok) throw new Error();
      setRejectReason("");
      const nextPage = applications.length === 1 && applicationsPage > 1 ? applicationsPage - 1 : applicationsPage;
      await Promise.all([
        fetchApps(token, applicationStatus, nextPage),
        fetchStats(),
        fetchHistory(token, 1),
      ]);
      setHistoryPage(1);
      setLastUpdatedAt(Date.now());
    } catch {
      setAppError(t.rejectErr);
    } finally {
      setRejectingId(null);
    }
  };

  const assignConnection = async () => {
    const token = localStorage.getItem("access_token");
    if (!token || !selectedClientId || !selectedDietitianId) return;
    setAssigningConnection(true);
    setConnectionError("");
    setConnectionMessage("");

    try {
      const res = await fetch(`${API_BASE}/api/auth/admin/assign-client`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: selectedClientId,
          dietitian_id: selectedDietitianId,
          notes: assignmentNote.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "assign_failed");
      await Promise.all([fetchUsersOverview(token), fetchConnections(token)]);
      setConnectionMessage(lang === "tr" ? "E?le?me ba?ar?yla kaydedildi." : "Assignment saved successfully.");
      setAssignmentNote("");
      setLastUpdatedAt(Date.now());
    } catch {
      setConnectionError(lang === "tr" ? "E?le?me kaydedilemedi." : "Failed to save assignment.");
    } finally {
      setAssigningConnection(false);
    }
  };

  const logout = () => {
    clearAuthSession();
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

                <div className="mt-3 flex items-center gap-2">
                  <button type="button" onClick={() => setApplicationStatus("pending")} className={tabClass(isDark, applicationStatus === "pending")}>
                    {t.pendingTab}
                  </button>
                  <button type="button" onClick={() => setApplicationStatus("rejected")} className={tabClass(isDark, applicationStatus === "rejected")}>
                    {t.rejectedTab}
                  </button>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <label><span className={labelClass(isDark)}>{t.search}</span><input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder={t.searchPh} className={inputClass(isDark)} /></label>
                  <label><span className={labelClass(isDark)}>{t.city}</span><select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className={inputClass(isDark)}><option value="">{t.allCities}</option>{cities.map((city) => <option key={city} value={city}>{city}</option>)}</select></label>
                  <label><span className={labelClass(isDark)}>{t.sort}</span><select value={sortMode} onChange={(e) => setSortMode(e.target.value as SortMode)} className={inputClass(isDark)}><option value="newest">{t.newest}</option><option value="oldest">{t.oldest}</option></select></label>
                </div>

                {appError ? <ErrorBox isDark={isDark}>{appError}</ErrorBox> : null}

                <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
                  <div className={innerPanel(isDark)}>
                    <div className="mb-2 text-xs font-bold">
                      {applicationStatus === "pending" ? t.metricPending : t.metricRejected}: {applicationsTotal}
                    </div>
                    <div className="max-h-[420px] space-y-2 overflow-auto pr-1">
                      {loadingApps ? <div className={hintClass(isDark)}>{t.load}</div> : null}
                      {!loadingApps && applications.length === 0 ? <div className={hintClass(isDark)}>{t.noResult}</div> : null}
                      {applications.map((app) => (
                        <button key={app.user_id} type="button" onClick={() => setSelectedId(app.user_id)} className={["w-full rounded-xl border px-3 py-3 text-left transition", app.user_id === selectedId ? (isDark ? "border-emerald-300/45 bg-emerald-500/14" : "border-[#2f6154]/35 bg-[#e9f5ef]") : (isDark ? "border-white/10 bg-black/25 hover:bg-white/5" : "border-[#2f6154]/18 bg-white/92 hover:bg-[#f4faf7]")].join(" ")}>
                          <div className="text-sm font-black">{[app.first_name, app.last_name].filter(Boolean).join(" ").trim() || app.email || app.phone_number || app.user_id}</div>
                          <div className={["mt-1 text-xs", isDark ? "text-zinc-300" : "text-[#496c62]"].join(" ")}>{(app.clinic_name || "-") + " - " + (app.clinic_city || "-")}</div>
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <div className={["text-xs", isDark ? "text-zinc-400" : "text-[#5f8177]"].join(" ")}>
                        {t.pagination}: {applicationsPage}/{Math.max(1, applicationsTotalPages)}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={applicationsPage <= 1 || loadingApps}
                          onClick={() => setApplicationsPage((prev) => Math.max(1, prev - 1))}
                          className={btnClass(isDark)}
                        >
                          {t.prev}
                        </button>
                        <button
                          type="button"
                          disabled={applicationsPage >= applicationsTotalPages || loadingApps || applicationsTotalPages === 0}
                          onClick={() => setApplicationsPage((prev) => Math.min(Math.max(1, applicationsTotalPages), prev + 1))}
                          className={btnClass(isDark)}
                        >
                          {t.next}
                        </button>
                      </div>
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
                        <DetailRow isDark={isDark} k={t.applicantNote} v={selected.verification_note || "-"} />
                        {selected.review_note ? <DetailRow isDark={isDark} k={t.reviewNote} v={selected.review_note} /> : null}

                        <button
                          type="button"
                          disabled={approvingId === selected.user_id || rejectingId === selected.user_id}
                          onClick={approveSelected}
                          className="mt-2 w-full rounded-xl bg-gradient-to-r from-emerald-400 to-teal-300 px-3 py-2 text-xs font-black text-zinc-950 transition hover:brightness-110 disabled:opacity-60"
                        >
                          {approvingId === selected.user_id ? t.approving : t.approve}
                        </button>

                        {applicationStatus === "pending" ? (
                          <>
                            <label className="mt-2 block">
                              <span className={labelClass(isDark)}>{t.rejectReason}</span>
                              <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                rows={3}
                                placeholder={t.rejectReasonPh}
                                className={inputClass(isDark)}
                              />
                            </label>
                            <button
                              type="button"
                              disabled={rejectingId === selected.user_id || approvingId === selected.user_id}
                              onClick={rejectSelected}
                              className={["w-full rounded-xl px-3 py-2 text-xs font-black transition disabled:opacity-60", isDark ? "bg-rose-500/18 text-rose-100 hover:bg-rose-500/26" : "bg-rose-100 text-rose-700 hover:bg-rose-200"].join(" ")}
                            >
                              {rejectingId === selected.user_id ? t.rejecting : t.reject}
                            </button>
                          </>
                        ) : null}
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
                  <HealthRow isDark={isDark} label={t.stepQueue} ok={applicationsTotal < 10} okText={t.healthy} badText={t.check} />
                </div>
              </>
            )}
          </div>

          <div className={panelClass(isDark)}>
            <h2 className="mb-3 text-sm font-black">{t.summaryTitle}</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              <StatCard isDark={isDark} label={applicationStatus === "pending" ? t.metricPending : t.metricRejected} value={String(applicationsTotal)} />
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
            <h3 className="mb-3 text-sm font-black">{t.historyTitle}</h3>
            {historyError ? <ErrorBox isDark={isDark}>{historyError}</ErrorBox> : null}
            {historyLoading ? <div className={hintClass(isDark)}>{t.load}</div> : null}
            {!historyLoading && historyItems.length === 0 ? <div className={hintClass(isDark)}>{t.historyEmpty}</div> : null}
            <div className="space-y-2">
              {historyItems.map((item) => (
                <div key={`${item.user_id}-${item.reviewed_at || ""}-${item.action}`} className={innerPanel(isDark)}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-black">
                      {[item.first_name, item.last_name].filter(Boolean).join(" ").trim() || item.email || item.phone_number || item.user_id}
                    </div>
                    <span className={["rounded-full px-2 py-1 text-[10px] font-bold", item.action === "approved" ? (isDark ? "bg-emerald-500/20 text-emerald-100" : "bg-emerald-100 text-emerald-800") : (isDark ? "bg-rose-500/20 text-rose-100" : "bg-rose-100 text-rose-800")].join(" ")}>
                      {item.action === "approved" ? t.actionApproved : t.actionRejected}
                    </span>
                  </div>
                  <div className={["mt-1 text-[11px]", isDark ? "text-zinc-400" : "text-[#67857b]"].join(" ")}>
                    {item.clinic_name || "-"} - {item.clinic_city || "-"}
                  </div>
                  <div className={["mt-1 text-[11px]", isDark ? "text-zinc-500" : "text-[#6f8e84]"].join(" ")}>
                    {formatDate(item.reviewed_at, lang)}
                  </div>
                  {item.review_note ? <div className={["mt-2 text-xs", isDark ? "text-zinc-300" : "text-[#496c62]"].join(" ")}>{item.review_note}</div> : null}
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <div className={["text-xs", isDark ? "text-zinc-400" : "text-[#5f8177]"].join(" ")}>
                {t.pagination}: {historyPage}/{Math.max(1, historyTotalPages)}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={historyPage <= 1 || historyLoading}
                  onClick={() => setHistoryPage((prev) => Math.max(1, prev - 1))}
                  className={btnClass(isDark)}
                >
                  {t.prev}
                </button>
                <button
                  type="button"
                  disabled={historyPage >= historyTotalPages || historyLoading || historyTotalPages === 0}
                  onClick={() => setHistoryPage((prev) => Math.min(Math.max(1, historyTotalPages), prev + 1))}
                  className={btnClass(isDark)}
                >
                  {t.next}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5">
          <div className={panelClass(isDark)}>
            <h2 className="text-sm font-black">{t.visibilityTitle}</h2>
            <p className={hintClass(isDark)}>{t.visibilitySub}</p>
            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              {visibilityBoards.map((board) => (
                <RoleWorkspaceBoard
                  key={board.title}
                  isDark={isDark}
                  title={board.title}
                  subtitle={board.subtitle}
                  items={board.items}
                  readOnly
                />
              ))}
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <div className={panelClass(isDark)}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-black">{lang === "tr" ? "Tüm Kullanıcılar" : "All Users"}</h2>
                <p className={hintClass(isDark)}>
                  {lang === "tr"
                    ? "Admin tum rolleri burada gorur. Normal kullanicilar sadece atanmis diyetisyenle ilerler."
                    : "Admin sees every role here. Regular users only move forward with the assigned dietitian."}
                </p>
              </div>
              <div className={["rounded-full px-3 py-1 text-xs font-black", isDark ? "bg-white/5 text-zinc-200" : "bg-[#eef6f2] text-[#23493f]"].join(" ")}>
                {usersLoading ? "..." : usersOverview.length}
              </div>
            </div>
            {connectionError ? <ErrorBox isDark={isDark}>{connectionError}</ErrorBox> : null}
            <div className="grid gap-3 md:grid-cols-2">
              {usersOverview.map((item) => (
                <div key={item.user_id} className={innerPanel(isDark)}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-black">
                        {[item.first_name, item.last_name].filter(Boolean).join(" ").trim() || item.email || item.user_id}
                      </div>
                      <div className={hintClass(isDark)}>
                        {item.account_type === "dietitian"
                          ? item.clinic_name || item.clinic_city || "-"
                          : item.assigned_dietitian_name || (lang === "tr" ? "Atama yok" : "No assignment")}
                      </div>
                    </div>
                    <span className={["rounded-full px-2 py-1 text-[10px] font-bold", item.account_type === "dietitian" ? (isDark ? "bg-cyan-500/16 text-cyan-100" : "bg-cyan-100 text-cyan-800") : (isDark ? "bg-emerald-500/16 text-emerald-100" : "bg-emerald-100 text-emerald-800")].join(" ")}>
                      {item.account_type === "dietitian" ? "Dietitian" : "User"}
                    </span>
                  </div>
                  <div className={["mt-2 text-xs", isDark ? "text-zinc-400" : "text-[#5f8177]"].join(" ")}>
                    {(item.roles || []).join(", ") || "-"}
                  </div>
                  <div className={["mt-2 text-xs", isDark ? "text-zinc-300" : "text-[#45685e]"].join(" ")}>
                    {item.account_type === "dietitian"
                      ? `${lang === "tr" ? "Bağlı danışan" : "Assigned clients"}: ${item.assigned_clients_count || 0}`
                      : `${lang === "tr" ? "Bagli diyetisyen" : "Assigned dietitian"}: ${item.assigned_dietitian_name || "-"}`}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-5">
            <div className={panelClass(isDark)}>
              <h2 className="text-sm font-black">{lang === "tr" ? "E?le?me Merkezi" : "Assignment Center"}</h2>
              <p className={hintClass(isDark)}>
                {lang === "tr"
                  ? "Bağlantı sadece admin tarafından kurulur. Kullanıcı kendi başına diyetisyen seçemez."
                  : "Connections are created only by admin. Users cannot choose a dietitian on their own."}
              </p>

              <div className="mt-4 grid gap-3">
                <label>
                  <span className={labelClass(isDark)}>{lang === "tr" ? "Kullanıcı Seç" : "Select User"}</span>
                  <select value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)} className={inputClass(isDark)}>
                    <option value="">{lang === "tr" ? "Kullanıcı seç" : "Select user"}</option>
                    {clientCandidates.map((item) => (
                      <option key={item.user_id} value={item.user_id}>
                        {[item.first_name, item.last_name].filter(Boolean).join(" ").trim() || item.email || item.user_id}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span className={labelClass(isDark)}>{lang === "tr" ? "Diyetisyen Sec" : "Select Dietitian"}</span>
                  <select value={selectedDietitianId} onChange={(e) => setSelectedDietitianId(e.target.value)} className={inputClass(isDark)}>
                    <option value="">{lang === "tr" ? "Diyetisyen sec" : "Select dietitian"}</option>
                    {dietitianCandidates.map((item) => (
                      <option key={item.user_id} value={item.user_id}>
                        {[item.first_name, item.last_name].filter(Boolean).join(" ").trim() || item.email || item.user_id}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span className={labelClass(isDark)}>{lang === "tr" ? "Admin Notu" : "Admin Note"}</span>
                  <textarea
                    value={assignmentNote}
                    onChange={(e) => setAssignmentNote(e.target.value)}
                    rows={3}
                    className={inputClass(isDark)}
                    placeholder={lang === "tr" ? "E?le?me i?in k?sa not" : "Short note for this assignment"}
                  />
                </label>
              </div>

              {selectedClient ? (
                <div className={["mt-4 rounded-xl border px-3 py-3 text-xs", isDark ? "border-white/10 bg-black/20 text-zinc-200" : "border-[#2f6154]/18 bg-white text-[#2f564a]"].join(" ")}>
                  {lang === "tr" ? "Mevcut bag: " : "Current link: "}
                  <span className="font-black">{selectedClient.assigned_dietitian_name || "-"}</span>
                </div>
              ) : null}
              {selectedDietitian ? (
                <div className={["mt-2 rounded-xl border px-3 py-3 text-xs", isDark ? "border-white/10 bg-black/20 text-zinc-200" : "border-[#2f6154]/18 bg-white text-[#2f564a]"].join(" ")}>
                  {lang === "tr" ? "Diyetisyen aktif danışan sayısı: " : "Dietitian active client count: "}
                  <span className="font-black">{selectedDietitian.assigned_clients_count || 0}</span>
                </div>
              ) : null}

              {connectionMessage ? <div className={["mt-4 rounded-xl border px-3 py-2 text-xs", isDark ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100" : "border-emerald-400/40 bg-emerald-100 text-emerald-800"].join(" ")}>{connectionMessage}</div> : null}

              <button
                type="button"
                onClick={assignConnection}
                disabled={!selectedClientId || !selectedDietitianId || assigningConnection}
                className="mt-4 w-full rounded-xl bg-gradient-to-r from-emerald-400 to-teal-300 px-4 py-3 text-sm font-black text-zinc-950 disabled:opacity-60"
              >
                {assigningConnection
                  ? (lang === "tr" ? "E?le?tiriliyor..." : "Assigning...")
                  : (lang === "tr" ? "Kullanıcıyı Diyetisyene Bağla" : "Assign User To Dietitian")}
              </button>
            </div>

            <div className={panelClass(isDark)}>
              <h2 className="text-sm font-black">{lang === "tr" ? "Aktif Baglantilar" : "Active Connections"}</h2>
              <p className={hintClass(isDark)}>
                {lang === "tr" ? "Kullanıcılar sadece bu bağlantılar üzerinden profesyonel akışa girer." : "Users enter the professional flow only through these active connections."}
              </p>
              {connectionsLoading ? <div className={hintClass(isDark)}>{t.load}</div> : null}
              <div className="mt-4 space-y-2">
                {connections.map((item) => (
                  <div key={item.id} className={innerPanel(isDark)}>
                    <div className="text-xs font-black">{item.client_name}</div>
                    <div className={hintClass(isDark)}>
                      {item.dietitian_name} {item.clinic_name ? `- ${item.clinic_name}` : ""}
                    </div>
                    <div className={["mt-1 text-[11px]", isDark ? "text-zinc-500" : "text-[#6f8e84]"].join(" ")}>
                      {formatDate(item.start_date, lang)}
                    </div>
                    {item.notes ? <div className={["mt-2 text-xs", isDark ? "text-zinc-300" : "text-[#496c62]"].join(" ")}>{item.notes}</div> : null}
                  </div>
                ))}
                {!connectionsLoading && !connections.length ? (
                  <div className={hintClass(isDark)}>{lang === "tr" ? "Aktif ba?lant? yok." : "No active connections."}</div>
                ) : null}
              </div>
            </div>
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
  return <div className={["grid grid-cols-[96px_1fr] gap-2 rounded-lg px-2 py-1.5", isDark ? "bg-black/20" : "bg-[#f4faf7]"].join(" ")}><div className={["text-[11px] font-bold", isDark ? "text-zinc-400" : "text-[#5e7f74]"].join(" ")}>{k}</div><div className={["break-words text-xs font-semibold", isDark ? "text-zinc-200" : "text-[#2f564a]"].join(" ")}>{v}</div></div>;
}
function RateRow({ isDark, label, value, tone }: { isDark: boolean; label: string; value: number; tone: "emerald" | "teal" | "amber" }) {
  const safe = Math.max(0, Math.min(100, value));
  const fill = tone === "teal" ? "from-teal-300 to-emerald-300" : tone === "amber" ? "from-amber-300 to-orange-300" : "from-emerald-400 to-teal-300";
  return <div><div className="flex items-center justify-between text-xs"><span className={isDark ? "text-zinc-300" : "text-[#3f6459]"}>{label}</span><span className="font-black">{safe}%</span></div><div className={["mt-1 h-2 w-full overflow-hidden rounded-full", isDark ? "bg-white/10" : "bg-[#d7e6df]"].join(" ")}><div className={`h-2 rounded-full bg-gradient-to-r ${fill}`} style={{ width: `${safe}%` }} /></div></div>;
}
function ErrorBox({ isDark, children }: { isDark: boolean; children: string }) {
  return <div className={["mt-3 rounded-xl border px-3 py-2 text-xs", isDark ? "border-rose-500/30 bg-rose-500/10 text-rose-200" : "border-rose-400/40 bg-rose-100 text-rose-700"].join(" ")}>{children}</div>;
}
