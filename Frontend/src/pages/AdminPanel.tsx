import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppSettings } from "../context/AppSettingsContext";
import { clearAuthSession, setAuthSession } from "../lib/authSession";
import { TURKEY_CITIES } from "../data/turkeyCities";

type Lang = "tr" | "en";
type ViewMode = "queue" | "ops" | "clinics" | "clients";
type SortMode = "newest" | "oldest";
type ApplicationStatus = "pending" | "rejected";
type AccountKind = "admin" | "dietitian" | "client" | "user";

type SelectOption = {
  value: string;
  label: string;
  meta?: string;
};

type SessionUser = {
  id?: string;
  user_id?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  display_name?: string;
  email?: string;
  roles?: Array<string | { name?: string }>;
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
  roles?: Array<string | { name?: string }>;
  account_type?: string;
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

type Clinic = {
  id: string;
  name: string;
  city: string;
  address: string;
  createdAt?: string;
  updatedAt?: string;
};

const API_BASE = "http://localhost:3000";

const COPY = {
  tr: {
    tag: "Admin",
    title: "Yönetim Paneli",
    subtitle: "Başvuruları, klinikleri ve kullanıcı eşleşmelerini temiz bir yönetim akışında takip et.",
    welcome: "Hoş geldin",
    updated: "Son güncelleme",
    refresh: "Yenile",
    profile: "Profil",
    logout: "Çıkış Yap",
    queueTab: "Başvurular",
    clinicsTab: "Klinikler",
    opsTab: "Özet",
    pendingTab: "Bekleyenler",
    rejectedTab: "Reddedilenler",
    queueTitle: "Başvurular",
    queueSub: "Başvuruları filtrele, klinik bilgilerini kontrol et ve sonucu net şekilde işle.",
    search: "Başvuru Ara",
    searchPh: "isim, e-posta, klinik",
    city: "Şehir",
    allCities: "Tüm şehirler",
    sort: "Sıralama",
    newest: "Yeni > Eski",
    oldest: "Eski > Yeni",
    noResult: "Filtrelere uygun başvuru bulunamadı.",
    selectedTitle: "Detay",
    noSelection: "Detay görüntülemek için soldan bir başvuru seç.",
    approve: "Onayla",
    approving: "Onaylanıyor...",
    reject: "Reddet",
    rejecting: "Reddediliyor...",
    rejectReason: "Red Nedeni",
    rejectReasonPh: "Başvurunun neden reddedildiğini kullanıcıya gösterilecek şekilde açıklayın.",
    rejectValidation: "Red nedeni en az 5 karakter olmalıdır.",
    applicantNote: "Başvuru Notu",
    reviewNote: "İnceleme Notu",
    summaryTitle: "Özet",
    metricPending: "Bekleyen Başvuru",
    metricRejected: "Reddedilen Başvuru",
    metricApproved: "Onaylı Diyetisyen",
    metricUsers: "Toplam Kullanıcı",
    metricActiveUsers: "Aktif Kullanıcı",
    metricDietitians: "Toplam Diyetisyen",
    activityRate: "Aktiflik Oranı",
    approvalRate: "Onay Oranı",
    queuePressure: "Kuyruk Yoğunluğu",
    systemTitle: "Operasyon Durumu",
    stepApi: "API",
    stepOtp: "OTP",
    stepRoles: "Roller",
    stepQueue: "Onay Kuyruğu",
    healthy: "Stabil",
    check: "Kontrol",
    opsSummary: "Operasyon",
    sClients: "Aktif Danışan",
    sPlans: "Plan",
    sMessages: "Mesaj",
    sAdherence: "Uyum",
    feedTitle: "Son Başvurular",
    feedEmpty: "Henüz aktivite bulunmuyor.",
    cityTitle: "Şehir Dağılımı",
    cityEmpty: "Şehir bazlı veri bulunmuyor.",
    managementTitle: "Yönetsel Notlar",
    managementA: "Başvuru Standardı",
    managementADesc: "Lisans, klinik ve iletişim alanları eksiksiz olduğunda onay süreci hızlanır.",
    managementB: "Güvenlik Akışı",
    managementBDesc: "OTP, rol ve oturum kontrolleri birlikte izlenmelidir.",
    managementC: "Takip Rutini",
    managementCDesc: "Panelin düzenli yenilenmesi operasyon takibini kolaylaştırır.",
    detailName: "İsim",
    detailEmail: "E-posta",
    detailPhone: "Telefon",
    detailClinic: "Klinik",
    detailCity: "Şehir",
    detailAddress: "Adres",
    unknownCity: "Belirsiz",
    fallbackAdmin: "Yönetici",
    summaryErr: "Özet verisi alınamadı.",
    appErr: "Başvurular alınamadı.",
    approveErr: "Onay işlemi tamamlanamadı.",
    rejectErr: "Red işlemi tamamlanamadı.",
    load: "Yükleniyor...",
    pagination: "Sayfa",
    prev: "Önceki",
    next: "Sonraki",
    historyTitle: "İşlem Geçmişi",
    historyEmpty: "Henüz işlem geçmişi bulunmuyor.",
    historyLoadError: "İşlem geçmişi alınamadı.",
    actionApproved: "Onaylandı",
    actionRejected: "Reddedildi",
    clinicsTitle: "Klinikler",
    clinicsSub: "Klinikleri düzenli, güncel ve atanabilir halde tutun.",
    addClinic: "Yeni Klinik Ekle",
    editClinic: "Düzenle",
    deleteClinic: "Sil",
    clinicName: "Klinik Adı",
    clinicCity: "Şehir",
    clinicAddress: "Adres",
    saveClinic: "Kaydet",
    savingClinic: "Kaydediliyor...",
    cancel: "İptal",
    deleteConfirm: "Bu kliniği silmek istediğinize emin misiniz?",
    clinicLoadErr: "Klinikler yüklenemedi.",
    clinicSaveErr: "Klinik kaydedilemedi.",
    clinicDeleteErr: "Klinik silinemedi.",
  },
  en: {
    tag: "Admin",
    title: "Management Panel",
    subtitle: "Review applications, clinics and assignments in a focused management flow.",
    welcome: "Welcome",
    updated: "Last updated",
    refresh: "Refresh",
    profile: "Profile",
    logout: "Logout",
    queueTab: "Applications",
    clinicsTab: "Clinics",
    opsTab: "Overview",
    pendingTab: "Pending",
    rejectedTab: "Rejected",
    queueTitle: "Applications",
    queueSub: "Filter applications, verify clinic details and record a clear decision.",
    search: "Search applications",
    searchPh: "name, email, clinic",
    city: "City",
    allCities: "All cities",
    sort: "Sort",
    newest: "Newest > Oldest",
    oldest: "Oldest > Newest",
    noResult: "No matching applications.",
    selectedTitle: "Detail",
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
    summaryTitle: "Summary",
    metricPending: "Pending Applications",
    metricRejected: "Rejected Applications",
    metricApproved: "Approved Dietitians",
    metricUsers: "Total Users",
    metricActiveUsers: "Active Users",
    metricDietitians: "Total Dietitians",
    activityRate: "Activity Rate",
    approvalRate: "Approval Rate",
    queuePressure: "Queue Pressure",
    systemTitle: "Operational Status",
    stepApi: "API",
    stepOtp: "OTP",
    stepRoles: "Roles",
    stepQueue: "Approval Queue",
    healthy: "Healthy",
    check: "Check",
    opsSummary: "Operations",
    sClients: "Active Clients",
    sPlans: "Plans",
    sMessages: "Messages",
    sAdherence: "Adherence",
    feedTitle: "Recent Applications",
    feedEmpty: "No activity yet.",
    cityTitle: "City Distribution",
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
    clinicsTitle: "Clinics",
    clinicsSub: "Keep clinics organized, current and ready for assignment.",
    addClinic: "Add New Clinic",
    editClinic: "Edit",
    deleteClinic: "Delete",
    clinicName: "Clinic Name",
    clinicCity: "City",
    clinicAddress: "City",
    saveClinic: "Save",
    savingClinic: "Saving...",
    cancel: "Cancel",
    deleteConfirm: "Are you sure you want to delete this clinic?",
    clinicLoadErr: "Failed to load clinics.",
    clinicSaveErr: "Failed to save clinic.",
    clinicDeleteErr: "Failed to delete clinic.",
  },
} as const;

export default function AdminPanel() {
  const navigate = useNavigate();
  const { lang, theme } = useAppSettings();
  const isDark = theme === "green";
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

  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loadingClinics, setLoadingClinics] = useState(false);
  const [clinicError, setClinicError] = useState("");
  const [editingClinic, setEditingClinic] = useState<Partial<Clinic> | null>(null);
  const [savingClinic, setSavingClinic] = useState(false);
  const [editingUser, setEditingUser] = useState<UserOverviewItem | null>(null);
  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    role: "",
    clinic_id: "",
  });
  const [savingUser, setSavingUser] = useState(false);
  const [saveUserError, setSaveUserError] = useState("");
  const [clientApplications, setClientApplications] = useState<any[]>([]);
  const [clientAppsLoading, setClientAppsLoading] = useState(false);
  const [clientAppsTotal, setClientAppsTotal] = useState(0);
  const [clientAppsPage, setClientAppsPage] = useState(1);
  const [clientAppsTotalPages, setClientAppsTotalPages] = useState(0);
  const [clientAppStatus, setClientAppStatus] = useState<ApplicationStatus>("pending");
  const [clientSearch, setClientSearch] = useState("");
  const [clientSearchInput, setClientSearchInput] = useState("");
  const [selectedClientAppId, setSelectedClientAppId] = useState("");
  const [clientRejectReason, setClientRejectReason] = useState("");
  const [clientApprovingId, setClientApprovingId] = useState<string | null>(null);
  const [clientRejectingId, setClientRejectingId] = useState<string | null>(null);
  const refreshInFlightRef = useRef(false);
  const refreshAllRef = useRef<() => Promise<void>>(async () => undefined);

  const t = COPY[lang];

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput), 320);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const timer = window.setTimeout(() => setClientSearch(clientSearchInput), 320);
    return () => window.clearTimeout(timer);
  }, [clientSearchInput]);

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

  const isAdmin = useMemo(() => roleNamesFromList(user?.roles).includes("admin"), [user]);
  useEffect(() => {
    if (!loadingProfile && user && !isAdmin) navigate("/", { replace: true });
  }, [isAdmin, loadingProfile, navigate, user]);

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

  const fetchClientApps = useCallback(async (token: string, status: ApplicationStatus, page: number) => {
    setClientAppsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("status", status);
      params.set("page", String(page));
      params.set("limit", "10");
      if (clientSearch.trim()) params.set("search", clientSearch.trim());

      const res = await fetch(`${API_BASE}/api/auth/admin/client-applications?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error();
      const payload = data?.data ?? data;
      setClientApplications(Array.isArray(payload?.items) ? payload.items : []);
      setClientAppsTotal(Number(payload?.total ?? 0));
      setClientAppsPage(Number(payload?.page ?? page));
      setClientAppsTotalPages(Number(payload?.totalPages ?? 0));
    } catch {
      setClientApplications([]);
      setClientAppsTotal(0);
      setClientAppsTotalPages(0);
    } finally {
      setClientAppsLoading(false);
    }
  }, [clientSearch]);

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
      const items = Array.isArray(payload?.items) ? payload.items : [];
      setUsersOverview(items.map((item) => mergeCurrentAdminSignal(item, user)));
    } catch {
      setUsersOverview([]);
      setConnectionError(lang === "tr" ? "Kullanıcı listesi alınamadı." : "Failed to load users.");
    } finally {
      setUsersLoading(false);
    }
  }, [lang, user]);

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
      setConnectionError((prev) => prev || (lang === "tr" ? "Bağlantılar alınamadı." : "Failed to load connections."));
    } finally {
      setConnectionsLoading(false);
    }
  }, [lang]);

  const fetchClinics = useCallback(async (token: string) => {
    setClinicError("");
    setLoadingClinics(true);
    try {
      const res = await fetch(`${API_BASE}/api/clinics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error();
      setClinics(Array.isArray(data?.data) ? data.data : []);
    } catch {
      setClinicError(t.clinicLoadErr);
    } finally {
      setLoadingClinics(false);
    }
  }, [t.clinicLoadErr]);

  const saveClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClinic?.name || !editingClinic?.city || !editingClinic?.address) return;
    const token = localStorage.getItem("access_token");
    if (!token) return;

    setSavingClinic(true);
    setClinicError("");
    try {
      const isNew = !editingClinic.id;
      const url = isNew ? `${API_BASE}/api/clinics` : `${API_BASE}/api/clinics/${editingClinic.id}`;
      const method = isNew ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editingClinic),
      });
      if (!res.ok) throw new Error();
      setEditingClinic(null);
      await fetchClinics(token);
    } catch {
      setClinicError(t.clinicSaveErr);
    } finally {
      setSavingClinic(false);
    }
  };

  const deleteClinic = async (id: string) => {
    if (!window.confirm(t.deleteConfirm)) return;
    const token = localStorage.getItem("access_token");
    if (!token) return;

    setClinicError("");
    try {
      const res = await fetch(`${API_BASE}/api/clinics/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      await fetchClinics(token);
    } catch {
      setClinicError(t.clinicDeleteErr);
    }
  };

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
        fetchClinics(token),
        fetchClientApps(token, clientAppStatus, clientAppsPage),
      ]);
      setLastUpdatedAt(Date.now());
    } finally {
      refreshInFlightRef.current = false;
    }
  }, [applicationStatus, applicationsPage, fetchApps, fetchConnections, fetchHistory, fetchStats, fetchSummary, fetchUsersOverview, historyPage, isAdmin, fetchClientApps, clientAppStatus, clientAppsPage]);

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

  useEffect(() => {
    setClientAppsPage(1);
  }, [clientAppStatus, clientSearch]);

  useEffect(() => {
    if (!clientApplications.length) return setSelectedClientAppId("");
    if (!selectedClientAppId || !clientApplications.some((app) => app.user_id === selectedClientAppId)) {
      setSelectedClientAppId(clientApplications[0].user_id);
    }
  }, [clientApplications, selectedClientAppId]);

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
  const clientCandidates = useMemo(
    () => usersOverview.filter((item) => accountKind(item) === "client" && item.is_active),
    [usersOverview],
  );
  const dietitianCandidates = useMemo(
    () =>
      usersOverview.filter(
        (item) =>
          accountKind(item) === "dietitian" &&
          item.is_active &&
          normalizeText(item.dietitian_verification_status) === "approved",
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

  const handleApproveClient = async (userId: string) => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    setClientApprovingId(userId);
    try {
      const res = await fetch(`${API_BASE}/api/auth/admin/client-applications/${userId}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const nextPage = clientApplications.length === 1 && clientAppsPage > 1 ? clientAppsPage - 1 : clientAppsPage;
      await Promise.all([
        fetchClientApps(token, clientAppStatus, nextPage),
        fetchStats(),
        fetchUsersOverview(token),
      ]);
    } catch {
      alert(lang === "tr" ? "Onaylama işlemi başarısız oldu." : "Failed to approve client.");
    } finally {
      setClientApprovingId(null);
    }
  };

  const handleRejectClient = async (userId: string, reason: string) => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    const cleanReason = reason.trim();
    if (!cleanReason) {
      alert(lang === "tr" ? "Red nedeni gereklidir." : "Rejection reason is required.");
      return;
    }
    setClientRejectingId(userId);
    try {
      const res = await fetch(`${API_BASE}/api/auth/admin/client-applications/${userId}/reject`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: cleanReason }),
      });
      if (!res.ok) throw new Error();
      setClientRejectReason("");
      const nextPage = clientApplications.length === 1 && clientAppsPage > 1 ? clientAppsPage - 1 : clientAppsPage;
      await Promise.all([
        fetchClientApps(token, clientAppStatus, nextPage),
        fetchStats(),
        fetchUsersOverview(token),
      ]);
    } catch {
      alert(lang === "tr" ? "Reddetme işlemi başarısız oldu." : "Failed to reject client.");
    } finally {
      setClientRejectingId(null);
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
      setConnectionMessage(lang === "tr" ? "Atama başarıyla kaydedildi." : "Assignment saved successfully.");
      setAssignmentNote("");
      setLastUpdatedAt(Date.now());
    } catch {
      setConnectionError(lang === "tr" ? "Atama kaydedilemedi." : "Failed to save assignment.");
    } finally {
      setAssigningConnection(false);
    }
  };

  const handleRemoveDietitianClinic = async (dietitianId: string) => {
    if (!window.confirm(lang === "tr" ? "Bu diyetisyeni klinikten çıkarmak istediğinize emin misiniz?" : "Are you sure you want to remove this dietitian from the clinic?")) return;
    const token = localStorage.getItem("access_token");
    if (!token) return;

    setConnectionError("");
    try {
      const res = await fetch(`${API_BASE}/api/auth/admin/dietitians/${dietitianId}/remove-clinic`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      await refreshAll();
    } catch {
      setConnectionError(lang === "tr" ? "Klinikten çıkarma işlemi başarısız." : "Failed to remove dietitian from clinic.");
    }
  };

  const handleAssignDietitianClinic = async (dietitianId: string, clinicId: string) => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    setConnectionError("");
    try {
      const res = await fetch(`${API_BASE}/api/auth/admin/dietitians/${dietitianId}/assign-clinic`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ clinic_id: clinicId })
      });
      if (!res.ok) throw new Error();
      await refreshAll();
    } catch {
      setConnectionError(lang === "tr" ? "Kliniğe atama işlemi başarısız." : "Failed to assign dietitian to clinic.");
    }
  };

  const handleUnassignClient = async (connectionId: string) => {
    if (!window.confirm(lang === "tr" ? "Bu danışanı diyetisyenden çıkarmak istediğinize emin misiniz?" : "Are you sure you want to unassign this client from their dietitian?")) return;
    const token = localStorage.getItem("access_token");
    if (!token) return;

    setConnectionError("");
    try {
      const res = await fetch(`${API_BASE}/api/auth/admin/connections/${connectionId}/unassign`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      await refreshAll();
    } catch {
      setConnectionError(lang === "tr" ? "Danışan çıkarma işlemi başarısız." : "Failed to unassign client.");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm(lang === "tr" ? "Bu kullanıcıyı ve tüm bağlı verilerini (üyelikler, sohbetler vb.) sistemden TAMAMEN silmek istediğinize emin misiniz? Bu işlem geri alınamaz!" : "Are you sure you want to PERMANENTLY delete this user and all related data (subscriptions, chats, etc.)? This action cannot be undone!")) return;
    
    const token = localStorage.getItem("access_token");
    if (!token) return;

    setConnectionError("");
    try {
      const res = await fetch(`${API_BASE}/api/auth/admin/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Delete failed");
      await refreshAll();
    } catch (err: any) {
      setConnectionError(lang === "tr" ? `Silme işlemi başarısız: ${err?.message || ""}` : `Failed to delete user: ${err?.message || ""}`);
    }
  };

  const openEditUserModal = (item: UserOverviewItem) => {
    const matchedClinic = clinics.find(
      (c) => c.name?.toLowerCase() === item.clinic_name?.toLowerCase()
    );

    setEditingUser(item);
    setEditForm({
      first_name: item.first_name || "",
      last_name: item.last_name || "",
      email: item.email || "",
      phone_number: item.phone_number || "",
      role: accountKind(item),
      clinic_id: matchedClinic ? matchedClinic.id : "",
    });
    setSaveUserError("");
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const token = localStorage.getItem("access_token");
    if (!token) return;

    setSavingUser(true);
    setSaveUserError("");

    try {
      const res = await fetch(`${API_BASE}/api/auth/admin/users/${editingUser.user_id}/edit`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(editForm)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Edit failed");
      
      setEditingUser(null);
      await refreshAll();
    } catch (err: any) {
      setSaveUserError(lang === "tr" ? `Güncelleme başarısız: ${err?.message || ""}` : `Update failed: ${err?.message || ""}`);
    } finally {
      setSavingUser(false);
    }
  };

  const logout = () => {
    clearAuthSession();
    navigate("/login", { replace: true });
  };

  const updatedText = lastUpdatedAt ? new Date(lastUpdatedAt).toLocaleTimeString(lang === "tr" ? "tr-TR" : "en-US") : "-";
  const n = (value: number) => Number(value || 0).toLocaleString(lang === "tr" ? "tr-TR" : "en-US");

  if (loadingProfile || !isAdmin) return <div className={["grid min-h-screen place-items-center text-sm", isDark ? "bg-[#050608] text-zinc-300" : "bg-[#f7f1e7] text-[#6f624f]"].join(" ")}>{t.load}</div>;

  return (
    <div className={["relative min-h-screen w-screen overflow-x-hidden", isDark ? "text-zinc-50" : "bg-[#f7f1e7] text-[#2f2b22]"].join(" ")}>
      <div className="pointer-events-none absolute inset-0">
        <div
          className={
            isDark
              ? "absolute inset-0 opacity-100 [background:radial-gradient(1100px_700px_at_18%_10%,rgba(16,185,129,0.20),transparent_60%),radial-gradient(900px_700px_at_92%_16%,rgba(20,184,166,0.13),transparent_60%),radial-gradient(900px_700px_at_58%_100%,rgba(56,189,248,0.08),transparent_60%),linear-gradient(180deg,#050608,#07090b_55%,#050608)]"
              : "absolute inset-0 bg-[#f7f1e7]"
          }
        />
        {isDark ? (
          <>
            <div className="absolute inset-0 opacity-[0.10] [background-image:radial-gradient(rgba(255,255,255,0.14)_1px,transparent_1px)] [background-size:18px_18px]" />
          </>
        ) : null}
      </div>

      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-10 pt-5 sm:px-5 lg:px-6">
        <header className={["mb-3 flex flex-wrap items-center justify-between gap-3 border px-4 py-3.5", isDark ? "rounded-2xl border-white/10 bg-white/5 shadow-[0_28px_100px_rgba(0,0,0,0.52)]" : "rounded-lg border-[#dfd0b9] bg-[#fffaf0] shadow-sm"].join(" ")}>
          <div>
            <div className={["inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold uppercase", isDark ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-100" : "border-[#dfd0b9] bg-[#f1e4cf] text-[#745737]"].join(" ")}>
              <span className={["h-1.5 w-1.5 rounded-full", isDark ? "bg-emerald-400" : "bg-[#b28a52]"].join(" ")} />
              {t.tag}
            </div>
            <h1 className="mt-2 text-2xl font-black leading-tight">{t.title}</h1>
            <p className={["mt-1 text-[11px]", isDark ? "text-zinc-500" : "text-[#8a7a61]"].join(" ")}>{updatedText}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={refreshAll} className={btnClass(isDark)}>{t.refresh}</button>
            <Link to="/profile" className={btnClass(isDark)}>{t.profile}</Link>
            <button type="button" onClick={logout} className={[btnClass(isDark), isDark ? "!border-rose-400/25 !bg-rose-500/10 !text-rose-100 hover:!bg-rose-500/15" : "!border-rose-200 !bg-rose-50 !text-rose-700"].join(" ")}>{t.logout}</button>
          </div>
        </header>

        <section className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className={panelClass(isDark)}>
            <div className={["mb-4 inline-flex border p-1", isDark ? "rounded-2xl border-white/10 bg-black/20" : "rounded-lg border-[#dfd0b9] bg-[#f7eedf]"].join(" ")}>
              <button type="button" onClick={() => setViewMode("queue")} className={tabClass(isDark, viewMode === "queue")}>{lang === "tr" ? "Diyetisyen Başvuruları" : "Dietitian Applications"}</button>
              <button type="button" onClick={() => setViewMode("clients")} className={tabClass(isDark, viewMode === "clients")}>{lang === "tr" ? "Danışan Başvuruları" : "Client Applications"}</button>
              <button type="button" onClick={() => setViewMode("clinics")} className={tabClass(isDark, viewMode === "clinics")}>{t.clinicsTab}</button>
              <button type="button" onClick={() => setViewMode("ops")} className={tabClass(isDark, viewMode === "ops")}>{t.opsTab}</button>
            </div>

            {viewMode === "queue" ? (
              <>
                <h2 className="text-sm font-black">{t.queueTitle}</h2>

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
                  <div>
                    <span className={labelClass(isDark)}>{t.city}</span>
                    <SmartSelect
                      isDark={isDark}
                      value={cityFilter}
                      onChange={setCityFilter}
                      options={[{ value: "", label: t.allCities }, ...cities.map((city) => ({ value: city, label: city }))]}
                    />
                  </div>
                  <div>
                    <span className={labelClass(isDark)}>{t.sort}</span>
                    <SmartSelect
                      isDark={isDark}
                      value={sortMode}
                      onChange={(value) => setSortMode(value as SortMode)}
                      options={[
                        { value: "newest", label: t.newest },
                        { value: "oldest", label: t.oldest },
                      ]}
                    />
                  </div>
                </div>

                {appError ? <ErrorBox isDark={isDark}>{appError}</ErrorBox> : null}

                <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_0.88fr]">
                  <div className={innerPanel(isDark)}>
                    <div className="mb-2 text-xs font-bold">
                      {applicationStatus === "pending" ? t.metricPending : t.metricRejected}: {applicationsTotal}
                    </div>
                    <div className="max-h-[360px] space-y-2 overflow-auto pr-1">
                      {loadingApps ? <div className={hintClass(isDark)}>{t.load}</div> : null}
                      {!loadingApps && applications.length === 0 ? <div className={hintClass(isDark)}>{t.noResult}</div> : null}
                      {applications.map((app) => (
                        <button key={app.user_id} type="button" onClick={() => setSelectedId(app.user_id)} className={["w-full border px-3 py-2.5 text-left transition", app.user_id === selectedId ? (isDark ? "rounded-xl border-emerald-400/35 bg-emerald-500/10 shadow-[0_0_0_1px_rgba(16,185,129,0.10)_inset]" : "rounded-md border-[#b28a52]/50 bg-[#f5ead7]") : (isDark ? "rounded-xl border-white/10 bg-black/20 hover:bg-white/5" : "rounded-md border-[#e4d5bf] bg-[#fffdf7] hover:bg-white")].join(" ")}>
                          <div className="text-sm font-black">{[app.first_name, app.last_name].filter(Boolean).join(" ").trim() || app.email || app.phone_number || app.user_id}</div>
                          <div className={["mt-1 text-xs", isDark ? "text-zinc-300" : "text-[#7b6d58]"].join(" ")}>{(app.clinic_name || "-") + " - " + (app.clinic_city || "-")}</div>
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <div className={["text-xs", isDark ? "text-zinc-400" : "text-[#8a7a61]"].join(" ")}>
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
                    {!selected ? <div className={["mt-2 text-sm", isDark ? "text-zinc-400" : "text-[#7b6d58]"].join(" ")}>{t.noSelection}</div> : (
                      <div className="mt-2 space-y-1.5 text-xs">
                        <DetailRow isDark={isDark} k={t.detailName} v={[selected.first_name, selected.last_name].filter(Boolean).join(" ").trim() || "-"} />
                        <DetailRow isDark={isDark} k={t.detailEmail} v={selected.email || "-"} />
                        <DetailRow isDark={isDark} k={t.detailPhone} v={selected.phone_number || "-"} />
                        <DetailRow isDark={isDark} k={t.detailClinic} v={selected.clinic_name || "-"} />
                        <DetailRow isDark={isDark} k={t.detailCity} v={selected.clinic_city || "-"} />
                        <DetailRow isDark={isDark} k={t.detailAddress} v={selected.clinic_address || "-"} />
                        <DetailRow isDark={isDark} k={t.applicantNote} v={selected.verification_note || "-"} />
                        {selected.review_note ? <DetailRow isDark={isDark} k={t.reviewNote} v={selected.review_note} /> : null}

                        <button
                          type="button"
                          disabled={approvingId === selected.user_id || rejectingId === selected.user_id}
                          onClick={approveSelected}
                          className={primaryButtonClass(isDark, "mt-2 w-full px-3 py-2 text-xs")}
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
                              className={["w-full rounded-md px-3 py-2 text-xs font-black transition disabled:opacity-60", isDark ? "bg-rose-500/18 text-rose-100 hover:bg-rose-500/26" : "bg-rose-100 text-rose-700 hover:bg-rose-200"].join(" ")}
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
            ) : viewMode === "clients" ? (
              <>
                <h2 className="text-sm font-black">{lang === "tr" ? "Danışan Başvuruları" : "Client Applications"}</h2>

                <div className="mt-3 flex items-center gap-2">
                  <button type="button" onClick={() => setClientAppStatus("pending")} className={tabClass(isDark, clientAppStatus === "pending")}>
                    {lang === "tr" ? "Bekleyenler" : "Pending"}
                  </button>
                  <button type="button" onClick={() => setClientAppStatus("rejected")} className={tabClass(isDark, clientAppStatus === "rejected")}>
                    {lang === "tr" ? "Reddedilenler" : "Rejected"}
                  </button>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <label>
                    <span className={labelClass(isDark)}>{lang === "tr" ? "Danışan Ara" : "Search Clients"}</span>
                    <input
                      value={clientSearchInput}
                      onChange={(e) => setClientSearchInput(e.target.value)}
                      placeholder={lang === "tr" ? "isim, e-posta, telefon" : "name, email, phone"}
                      className={inputClass(isDark)}
                    />
                  </label>
                </div>

                <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_0.88fr]">
                  <div className={innerPanel(isDark)}>
                    <div className="mb-2 text-xs font-bold">
                      {clientAppStatus === "pending" ? (lang === "tr" ? "Bekleyen Danışan" : "Pending Clients") : (lang === "tr" ? "Reddedilen Danışan" : "Rejected Clients")}: {clientAppsTotal}
                    </div>
                    <div className="max-h-[360px] space-y-2 overflow-auto pr-1">
                      {clientAppsLoading ? <div className={hintClass(isDark)}>{t.load}</div> : null}
                      {!clientAppsLoading && clientApplications.length === 0 ? <div className={hintClass(isDark)}>{t.noResult}</div> : null}
                      {clientApplications.map((app) => (
                        <button
                          key={app.user_id}
                          type="button"
                          onClick={() => setSelectedClientAppId(app.user_id)}
                          className={["w-full border px-3 py-2.5 text-left transition", app.user_id === selectedClientAppId ? (isDark ? "rounded-xl border-emerald-400/35 bg-emerald-500/10 shadow-[0_0_0_1px_rgba(16,185,129,0.10)_inset]" : "rounded-md border-[#b28a52]/50 bg-[#f5ead7]") : (isDark ? "rounded-xl border-white/10 bg-black/20 hover:bg-white/5" : "rounded-md border-[#e4d5bf] bg-[#fffdf7] hover:bg-white")].join(" ")}
                        >
                          <div className="text-sm font-black">
                            {[app.first_name, app.last_name].filter(Boolean).join(" ").trim() || app.email || app.phone_number || app.user_id}
                          </div>
                          <div className={["mt-1 text-xs", isDark ? "text-zinc-300" : "text-[#7b6d58]"].join(" ")}>
                            {app.email || "-"} · {app.phone_number || "-"}
                          </div>
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <div className={["text-xs", isDark ? "text-zinc-400" : "text-[#8a7a61]"].join(" ")}>
                        {t.pagination}: {clientAppsPage}/{Math.max(1, clientAppsTotalPages)}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={clientAppsPage <= 1 || clientAppsLoading}
                          onClick={() => setClientAppsPage((prev) => Math.max(1, prev - 1))}
                          className={btnClass(isDark)}
                        >
                          {t.prev}
                        </button>
                        <button
                          type="button"
                          disabled={clientAppsPage >= clientAppsTotalPages || clientAppsLoading || clientAppsTotalPages === 0}
                          onClick={() => setClientAppsPage((prev) => Math.min(Math.max(1, clientAppsTotalPages), prev + 1))}
                          className={btnClass(isDark)}
                        >
                          {t.next}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className={innerPanel(isDark)}>
                    <div className="text-sm font-black">{t.selectedTitle}</div>
                    {(() => {
                      const selectedApp = clientApplications.find((app) => app.user_id === selectedClientAppId);
                      if (!selectedApp) {
                        return <div className={["mt-2 text-sm", isDark ? "text-zinc-400" : "text-[#7b6d58]"].join(" ")}>{t.noSelection}</div>;
                      }
                      return (
                        <div className="mt-2 space-y-1.5 text-xs">
                          <DetailRow isDark={isDark} k={t.detailName} v={[selectedApp.first_name, selectedApp.last_name].filter(Boolean).join(" ").trim() || "-"} />
                          <DetailRow isDark={isDark} k={t.detailEmail} v={selectedApp.email || "-"} />
                          <DetailRow isDark={isDark} k={t.detailPhone} v={selectedApp.phone_number || "-"} />
                          <DetailRow isDark={isDark} k={lang === "tr" ? "Başvuru Tarihi" : "Application Date"} v={formatDate(selectedApp.createdAt, lang)} />
                          {selectedApp.verification_review_note ? (
                            <DetailRow isDark={isDark} k={t.reviewNote} v={selectedApp.verification_review_note} />
                          ) : null}

                          {clientAppStatus === "pending" ? (
                            <>
                              <button
                                type="button"
                                disabled={clientApprovingId === selectedApp.user_id || clientRejectingId === selectedApp.user_id}
                                onClick={() => handleApproveClient(selectedApp.user_id)}
                                className={primaryButtonClass(isDark, "mt-2 w-full px-3 py-2 text-xs")}
                              >
                                {clientApprovingId === selectedApp.user_id ? t.approving : t.approve}
                              </button>

                              <label className="mt-2 block">
                                <span className={labelClass(isDark)}>{t.rejectReason}</span>
                                <textarea
                                  value={clientRejectReason}
                                  onChange={(e) => setClientRejectReason(e.target.value)}
                                  rows={3}
                                  placeholder={t.rejectReasonPh}
                                  className={inputClass(isDark)}
                                />
                              </label>
                              <button
                                type="button"
                                disabled={clientRejectingId === selectedApp.user_id || clientApprovingId === selectedApp.user_id}
                                onClick={() => handleRejectClient(selectedApp.user_id, clientRejectReason)}
                                className={["w-full rounded-md px-3 py-2 text-xs font-black transition disabled:opacity-60", isDark ? "bg-rose-500/18 text-rose-100 hover:bg-rose-500/26" : "bg-rose-100 text-rose-700 hover:bg-rose-200"].join(" ")}
                              >
                                {clientRejectingId === selectedApp.user_id ? t.rejecting : t.reject}
                              </button>
                            </>
                          ) : (
                            <div className={["mt-2 border px-3 py-2 text-xs rounded-md", isDark ? "border-rose-500/30 bg-rose-500/10 text-rose-100" : "border-rose-200 bg-rose-50 text-rose-700"].join(" ")}>
                              {lang === "tr" ? "Bu başvuru reddedilmiştir." : "This application has been rejected."}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </>
            ) : viewMode === "clinics" ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-black">{t.clinicsTitle}</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingClinic({ name: "", city: "", address: "" })}
                    className={btnClass(isDark)}
                  >
                    {t.addClinic}
                  </button>
                </div>

                {clinicError ? <ErrorBox isDark={isDark}>{clinicError}</ErrorBox> : null}

                {editingClinic && (
                  <form onSubmit={saveClinic} className={innerPanel(isDark)}>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <label>
                        <span className={labelClass(isDark)}>{t.clinicName}</span>
                        <input
                          value={editingClinic.name || ""}
                          onChange={(e) => setEditingClinic({ ...editingClinic, name: e.target.value })}
                          className={inputClass(isDark)}
                          required
                        />
                      </label>
                      {(() => {
                        const loc = splitClinicCity(editingClinic.city);
                        const availableDistricts = TURKEY_CITIES[loc.city] || [];
                        return (
                          <>
                            <label>
                              <span className={labelClass(isDark)}>{lang === "tr" ? "İl" : "Province"}</span>
                              <select
                                value={loc.city}
                                onChange={(e) => {
                                  const newCity = e.target.value;
                                  setEditingClinic({
                                    ...editingClinic,
                                    city: composeClinicCity(newCity, ""),
                                  });
                                }}
                                className={inputClass(isDark)}
                                required
                              >
                                <option value="">-- {lang === "tr" ? "İl Seçin" : "Select Province"} --</option>
                                {Object.keys(TURKEY_CITIES).sort((a, b) => a.localeCompare(b, "tr")).map((city) => (
                                  <option key={city} value={city}>{city}</option>
                                ))}
                              </select>
                            </label>
                            <label>
                              <span className={labelClass(isDark)}>{lang === "tr" ? "İlçe" : "District"}</span>
                              <select
                                value={loc.district}
                                onChange={(e) => {
                                  const newDistrict = e.target.value;
                                  setEditingClinic({
                                    ...editingClinic,
                                    city: composeClinicCity(loc.city, newDistrict),
                                  });
                                }}
                                className={inputClass(isDark)}
                                required
                                disabled={!loc.city}
                              >
                                <option value="">-- {lang === "tr" ? "İlçe Seçin" : "Select District"} --</option>
                                {availableDistricts.map((district) => (
                                  <option key={district} value={district}>{district}</option>
                                ))}
                              </select>
                            </label>
                          </>
                        );
                      })()}
                    </div>
                    <label className="mt-3 block">
                      <span className={labelClass(isDark)}>{t.clinicAddress}</span>
                      <textarea
                        value={editingClinic.address || ""}
                        onChange={(e) => setEditingClinic({ ...editingClinic, address: e.target.value })}
                        className={inputClass(isDark)}
                        rows={2}
                        required
                      />
                    </label>
                    <div className="mt-4 flex gap-2">
                      <button
                        type="submit"
                        disabled={savingClinic}
                        className={primaryButtonClass(isDark, "px-4 py-2 text-xs")}
                      >
                        {savingClinic ? t.savingClinic : t.saveClinic}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingClinic(null)}
                        className={btnClass(isDark)}
                      >
                        {t.cancel}
                      </button>
                    </div>
                  </form>
                )}

                <div className="grid gap-2.5 sm:grid-cols-2">
                  {loadingClinics ? <div className={hintClass(isDark)}>{t.load}</div> : null}
                  {!loadingClinics && clinics.length === 0 ? <div className={hintClass(isDark)}>{t.noResult}</div> : null}
                  {clinics.map((clinic) => (
                    <div key={clinic.id} className={innerPanel(isDark)}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-black">{clinic.name}</div>
                          <div className={hintClass(isDark)}>{clinic.city}</div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingClinic(clinic)}
                            className={["text-[10px] font-bold uppercase tracking-wider", isDark ? "text-emerald-400 hover:text-emerald-300" : "text-[#236b58] hover:text-[#184a3d]"].join(" ")}
                          >
                            {t.editClinic}
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteClinic(clinic.id)}
                            className={["text-[10px] font-bold uppercase tracking-wider", isDark ? "text-rose-400 hover:text-rose-300" : "text-rose-600 hover:text-rose-800"].join(" ")}
                          >
                            {t.deleteClinic}
                          </button>
                        </div>
                      </div>
                      <div className={["mt-2 text-xs opacity-80", isDark ? "text-zinc-300" : "text-[#756449]"].join(" ")}>
                        {clinic.address}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
                <div className={["mt-3 rounded-lg border p-3", isDark ? "border-emerald-300/20" : "border-[#dfd0b9] bg-[#fdf8ee]"].join(" ")}>
                  <div className="text-xs font-black">{t.systemTitle}</div>
                  <HealthRow isDark={isDark} label={t.stepApi} ok={!summaryError} okText={t.healthy} badText={t.check} />
                  <HealthRow isDark={isDark} label={t.stepOtp} ok={!appError} okText={t.healthy} badText={t.check} />
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
            <div className={["mt-5 border-t pt-4", isDark ? "border-white/10" : "border-[#dfd0b9]"].join(" ")}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="text-xs font-black">{t.historyTitle}</h3>
                <span className={["text-[11px]", isDark ? "text-zinc-500" : "text-[#8a7a61]"].join(" ")}>
                  {historyPage}/{Math.max(1, historyTotalPages)}
                </span>
              </div>
              {historyError ? <ErrorBox isDark={isDark}>{historyError}</ErrorBox> : null}
              {historyLoading ? <div className={hintClass(isDark)}>{t.load}</div> : null}
              {!historyLoading && historyItems.length === 0 ? <div className={hintClass(isDark)}>{t.historyEmpty}</div> : null}
              <div className="space-y-2">
                {historyItems.slice(0, 3).map((item) => (
                  <div key={`${item.user_id}-${item.reviewed_at || ""}-${item.action}`} className={innerPanel(isDark)}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="truncate text-xs font-black">
                        {[item.first_name, item.last_name].filter(Boolean).join(" ").trim() || item.email || item.phone_number || item.user_id}
                      </div>
                      <span className={["shrink-0 rounded-md px-2 py-1 text-[10px] font-bold", item.action === "approved" ? (isDark ? "bg-emerald-500/20 text-emerald-100" : "bg-[#dcebdd] text-[#174d3d]") : (isDark ? "bg-rose-500/20 text-rose-100" : "bg-rose-100 text-rose-800")].join(" ")}>
                        {item.action === "approved" ? t.actionApproved : t.actionRejected}
                      </span>
                    </div>
                    <div className={["mt-1 text-[11px]", isDark ? "text-zinc-500" : "text-[#8a7a61]"].join(" ")}>
                      {formatDate(item.reviewed_at, lang)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className={panelClass(isDark)}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-black">{lang === "tr" ? "Kayıtlar" : "Records"}</h2>
              </div>
              <div className={["px-3 py-1 text-xs font-black", isDark ? "rounded-full border border-emerald-400/20 bg-emerald-500/10 text-emerald-100" : "rounded-md bg-[#f1e4cf] text-[#745737]"].join(" ")}>
                {usersLoading ? "..." : usersOverview.length}
              </div>
            </div>
            {connectionError ? <ErrorBox isDark={isDark}>{connectionError}</ErrorBox> : null}
            <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
              {usersOverview.map((item) => (
                <div key={item.user_id} className={recordCardClass(isDark)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-black">
                        {[item.first_name, item.last_name].filter(Boolean).join(" ").trim() || item.email || item.user_id}
                      </div>
                      <div className={["mt-1 truncate", hintClass(isDark)].join(" ")}>
                        {recordSubtitle(item, lang)}
                      </div>
                    </div>
                    <span className={recordBadgeClass(isDark, item)}>
                      {recordKind(item, lang)}
                    </span>
                  </div>

                  {accountKind(item) === "dietitian" && (
                    <div className="mt-2.5 border-t border-dashed border-indigo-500/15 pt-2.5 space-y-2">
                      <div className={["text-[9px] font-black tracking-widest uppercase", isDark ? "text-emerald-400" : "text-[#236b58]"].join(" ")}>
                        {lang === "tr" ? "Klinik Yönetimi" : "Clinic Management"}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {item.clinic_name && (
                          <button
                            type="button"
                            onClick={() => handleRemoveDietitianClinic(item.user_id)}
                            className="rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 px-2 py-1 text-[10px] font-bold transition"
                          >
                            {lang === "tr" ? "Klinikten Çıkar" : "Remove Clinic"}
                          </button>
                        )}
                        <div className="flex-1 min-w-[130px]">
                          <select
                            defaultValue=""
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val) handleAssignDietitianClinic(item.user_id, val);
                            }}
                            className={["w-full rounded-lg px-2 py-1 text-[10px] outline-none border focus:ring-1", 
                              isDark 
                                ? "bg-black/60 border-white/10 text-white focus:border-emerald-500/40" 
                                : "bg-white border-[#dfd0b9] text-[#2f2b22] focus:border-[#8a6a3f]/50"
                            ].join(" ")}
                          >
                            <option value="">-- {lang === "tr" ? "Kliniğe Ata" : "Assign Clinic"} --</option>
                            {clinics.map((c) => (
                              <option key={c.id} value={c.id}>{c.name} ({c.city})</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className={["mt-3 flex items-center justify-between gap-3 border-t pt-2 text-[11px]", isDark ? "border-white/10 text-zinc-400" : "border-[#eadcc8] text-[#7b6d58]"].join(" ")}>
                    <span className="inline-flex items-center gap-1.5">
                      <span className={["h-1.5 w-1.5 rounded-full", item.is_active ? "bg-emerald-400" : (isDark ? "bg-zinc-600" : "bg-[#b9a98d]")].join(" ")} />
                      {item.is_active ? (lang === "tr" ? "Aktif" : "Active") : (lang === "tr" ? "Pasif" : "Inactive")}
                    </span>
                    <span className="truncate font-bold">
                      {recordMeta(item, lang)}
                    </span>
                  </div>

                  <div className="mt-2.5 flex items-center justify-end gap-2 border-t border-dashed border-zinc-500/10 pt-2.5">
                    <button
                      type="button"
                      onClick={() => openEditUserModal(item)}
                      className={["rounded-lg px-2.5 py-1 text-[10px] font-bold transition",
                        isDark 
                          ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400" 
                          : "bg-emerald-50/80 hover:bg-emerald-100/80 text-emerald-700 border border-emerald-200/50"
                      ].join(" ")}
                    >
                      {lang === "tr" ? "Düzenle" : "Edit"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteUser(item.user_id)}
                      className={["rounded-lg px-2.5 py-1 text-[10px] font-bold transition",
                        isDark 
                          ? "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400" 
                          : "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                      ].join(" ")}
                    >
                      {lang === "tr" ? "Sil" : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3">
            <div className={panelClass(isDark)}>
              <h2 className="text-sm font-black">{lang === "tr" ? "Atama" : "Assignment"}</h2>

              <div className="mt-4 grid gap-3">
                <div>
                  <span className={labelClass(isDark)}>{lang === "tr" ? "Kullanıcı" : "User"}</span>
                  <SmartSelect
                    isDark={isDark}
                    value={selectedClientId}
                    onChange={setSelectedClientId}
                    options={[
                      { value: "", label: lang === "tr" ? "Kullanıcı seç" : "Select user" },
                      ...clientCandidates.map((item) => ({
                        value: item.user_id,
                        label: userLabel(item),
                        meta: item.assigned_dietitian_name || (lang === "tr" ? "Atama yok" : "No assignment"),
                      })),
                    ]}
                  />
                </div>

                <div>
                  <span className={labelClass(isDark)}>{lang === "tr" ? "Diyetisyen" : "Dietitian"}</span>
                  <SmartSelect
                    isDark={isDark}
                    value={selectedDietitianId}
                    onChange={setSelectedDietitianId}
                    options={[
                      { value: "", label: lang === "tr" ? "Diyetisyen seç" : "Select dietitian" },
                      ...dietitianCandidates.map((item) => ({
                        value: item.user_id,
                        label: userLabel(item),
                        meta: `${item.clinic_name || item.clinic_city || "-"} · ${lang === "tr" ? "Danışan" : "Clients"}: ${item.assigned_clients_count || 0}`,
                      })),
                    ]}
                  />
                </div>

                <label>
                  <span className={labelClass(isDark)}>{lang === "tr" ? "Not" : "Note"}</span>
                  <textarea
                    value={assignmentNote}
                    onChange={(e) => setAssignmentNote(e.target.value)}
                    rows={3}
                    className={inputClass(isDark)}
                    placeholder={lang === "tr" ? "Atama için kısa not" : "Short note for this assignment"}
                  />
                </label>
              </div>

              {selectedClient ? (
                <div className={["mt-3 border px-3 py-2.5 text-xs", isDark ? "rounded-xl border-white/10 bg-black/20 text-zinc-200" : "rounded-md border-[#e4d5bf] bg-[#fdf8ee] text-[#4f3d25]"].join(" ")}>
                  {lang === "tr" ? "Mevcut bağ: " : "Current link: "}
                  <span className="font-black">{selectedClient.assigned_dietitian_name || "-"}</span>
                </div>
              ) : null}
              {selectedDietitian ? (
                <div className={["mt-2 border px-3 py-2.5 text-xs", isDark ? "rounded-xl border-white/10 bg-black/20 text-zinc-200" : "rounded-md border-[#e4d5bf] bg-[#fdf8ee] text-[#4f3d25]"].join(" ")}>
                  {lang === "tr" ? "Aktif danışan: " : "Active clients: "}
                  <span className="font-black">{selectedDietitian.assigned_clients_count || 0}</span>
                </div>
              ) : null}

              {connectionMessage ? <div className={["mt-4 rounded-md border px-3 py-2 text-xs", isDark ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100" : "border-[#dfd0b9] bg-[#f5ead7] text-[#745737]"].join(" ")}>{connectionMessage}</div> : null}

              <button
                type="button"
                onClick={assignConnection}
                disabled={!selectedClientId || !selectedDietitianId || assigningConnection}
                className={primaryButtonClass(isDark, "mt-3 w-full px-4 py-2.5 text-sm")}
              >
                {assigningConnection
                  ? (lang === "tr" ? "Eşleştiriliyor..." : "Assigning...")
                  : (lang === "tr" ? "Bağla" : "Assign")}
              </button>
            </div>

            <div className={panelClass(isDark)}>
              <h2 className="text-sm font-black">{lang === "tr" ? "Bağlantılar" : "Connections"}</h2>
              {connectionsLoading ? <div className={hintClass(isDark)}>{t.load}</div> : null}
              <div className="mt-4 space-y-2">
                {connections.map((item) => (
                  <div key={item.id} className={innerPanel(isDark)}>
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <div className="text-xs font-black">{item.client_name}</div>
                        <div className={hintClass(isDark)}>
                          {item.dietitian_name} {item.clinic_name ? `- ${item.clinic_name}` : ""}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleUnassignClient(item.id)}
                        className="shrink-0 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 px-2 py-1 text-[10px] font-bold border border-transparent transition"
                        title={lang === "tr" ? "Danışanı diyetisyenden çıkar" : "Remove client from dietitian"}
                      >
                        {lang === "tr" ? "Çıkar" : "Remove"}
                      </button>
                    </div>
                    <div className={["mt-1 text-[11px]", isDark ? "text-zinc-500" : "text-[#8a7a61]"].join(" ")}>
                      {formatDate(item.start_date, lang)}
                    </div>
                    {item.notes ? <div className={["mt-2 text-xs", isDark ? "text-zinc-300" : "text-[#7b6d58]"].join(" ")}>{item.notes}</div> : null}
                  </div>
                ))}
                {!connectionsLoading && !connections.length ? (
                  <div className={hintClass(isDark)}>{lang === "tr" ? "Aktif bağlantı yok." : "No active connections."}</div>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      </main>

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className={["w-full max-w-lg border p-6 shadow-2xl transition-all duration-300", isDark ? "rounded-3xl border-white/10 bg-zinc-950 text-white shadow-emerald-500/5" : "rounded-2xl border-[#dfd0b9] bg-[#fbf8f3] text-[#2f2b22]"].join(" ")}>
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="text-base font-black">
                {lang === "tr" ? "Kullanıcıyı Düzenle" : "Edit User"}
              </h3>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className={["text-xl font-bold transition hover:scale-110", isDark ? "text-zinc-400 hover:text-white" : "text-[#8a7a61] hover:text-[#2f2b22]"].join(" ")}
              >
                &times;
              </button>
            </div>

            {saveUserError ? <ErrorBox isDark={isDark}>{saveUserError}</ErrorBox> : null}

            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label>
                  <span className={labelClass(isDark)}>{lang === "tr" ? "Adı" : "First Name"}</span>
                  <input
                    type="text"
                    value={editForm.first_name}
                    onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                    className={inputClass(isDark)}
                    required
                  />
                </label>
                <label>
                  <span className={labelClass(isDark)}>{lang === "tr" ? "Soyadı" : "Last Name"}</span>
                  <input
                    type="text"
                    value={editForm.last_name}
                    onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                    className={inputClass(isDark)}
                    required
                  />
                </label>
              </div>

              <label className="block">
                <span className={labelClass(isDark)}>{lang === "tr" ? "E-posta" : "Email"}</span>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className={inputClass(isDark)}
                  required
                />
              </label>

              <label className="block">
                <span className={labelClass(isDark)}>{lang === "tr" ? "Telefon Numarası" : "Phone Number"}</span>
                <input
                  type="text"
                  value={editForm.phone_number}
                  onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })}
                  className={inputClass(isDark)}
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label>
                  <span className={labelClass(isDark)}>{lang === "tr" ? "Rol" : "Role"}</span>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className={inputClass(isDark)}
                    required
                  >
                    <option value="client">{lang === "tr" ? "Danışan" : "Client"}</option>
                    <option value="dietitian">{lang === "tr" ? "Diyetisyen" : "Dietitian"}</option>
                    <option value="admin">{lang === "tr" ? "Yönetici (Admin)" : "Administrator (Admin)"}</option>
                  </select>
                </label>

                <label>
                  <span className={labelClass(isDark)}>{lang === "tr" ? "Klinik" : "Clinic"}</span>
                  <select
                    value={editForm.clinic_id}
                    onChange={(e) => setEditForm({ ...editForm, clinic_id: e.target.value })}
                    className={inputClass(isDark)}
                  >
                    <option value="">-- {lang === "tr" ? "Değişiklik Yok" : "No Change"} --</option>
                    <option value="REMOVE">{lang === "tr" ? "Kliğinini Sil / Kaldır" : "Remove / Unassign Clinic"}</option>
                    {clinics.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.city})
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className={btnClass(isDark)}
                >
                  {lang === "tr" ? "İptal" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={savingUser}
                  className={primaryButtonClass(isDark, "px-5 py-2 text-xs font-bold")}
                >
                  {savingUser ? (lang === "tr" ? "Kaydediliyor..." : "Saving...") : (lang === "tr" ? "Güncelle" : "Update")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDate(value?: string | null, lang: Lang = "tr") {
  if (!value) return "-";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US");
}

function primaryButtonClass(isDark: boolean, extra = "") {
  return [
    "font-black shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60",
    isDark
      ? "rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-300 text-zinc-950 shadow-[0_18px_60px_rgba(16,185,129,0.20)] hover:brightness-110"
      : "rounded-md bg-[#8a6a3f] text-white hover:bg-[#765932]",
    extra,
  ].join(" ");
}

function btnClass(isDark: boolean) {
  return [
    "border px-3 py-1.5 text-xs font-bold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60",
    isDark
      ? "rounded-full border-transparent bg-white/5 text-zinc-100 hover:bg-white/10"
      : "rounded-md border-[#dfd0b9] bg-[#fffaf0] text-[#6d5433] hover:border-[#c8b18b] hover:bg-white",
  ].join(" ");
}
function tabClass(isDark: boolean, active: boolean) {
  return [
    "px-2.5 py-1.5 text-xs font-bold transition",
    active
      ? (isDark ? "rounded-full bg-emerald-500/18 text-emerald-100 shadow-[0_0_18px_rgba(16,185,129,0.16)]" : "rounded-md bg-[#8a6a3f] text-white shadow-sm")
      : (isDark ? "rounded-full text-zinc-300 hover:bg-white/10" : "rounded-md text-[#756449] hover:bg-[#fffaf0]"),
  ].join(" ");
}
function panelClass(isDark: boolean) {
  return [
    "border p-3.5",
    isDark
      ? "rounded-2xl border-transparent bg-white/5 shadow-[inset_0_1px_0_rgba(16,185,129,0.08),0_24px_90px_rgba(0,0,0,0.42)]"
      : "rounded-lg border-[#dfd0b9] bg-[#fffaf0] shadow-sm",
  ].join(" ");
}
function innerPanel(isDark: boolean) {
  return [
    "border px-3 py-2.5",
    isDark ? "rounded-xl border-transparent bg-black/20 shadow-[inset_0_1px_0_rgba(16,185,129,0.08)]" : "rounded-md border-[#e4d5bf] bg-[#fdf8ee]",
  ].join(" ");
}
function recordCardClass(isDark: boolean) {
  return [
    "border px-3 py-3 transition hover:-translate-y-0.5",
    isDark
      ? "rounded-xl border-transparent bg-black/20 shadow-[inset_0_1px_0_rgba(16,185,129,0.08)] hover:border-transparent hover:bg-white/[0.07]"
      : "rounded-md border-[#e4d5bf] bg-[#fdf8ee] hover:border-[#cbb48d] hover:bg-white",
  ].join(" ");
}
function inputClass(isDark: boolean) {
  return [
    "w-full border px-3 py-2 text-sm outline-none transition",
    isDark
      ? "rounded-xl border-transparent bg-black/20 text-white placeholder-zinc-500 focus:border-emerald-400/40 focus:ring-4 focus:ring-emerald-500/10"
      : "rounded-md border-[#dfd0b9] bg-[#fffdf7] text-[#342b1d] focus:border-[#8a6a3f]/55 focus:ring-2 focus:ring-[#8a6a3f]/12",
  ].join(" ");
}
function labelClass(isDark: boolean) {
  return ["mb-1 block text-xs font-bold", isDark ? "text-zinc-300" : "text-[#806f57]"].join(" ");
}
function hintClass(isDark: boolean) {
  return ["text-xs leading-5", isDark ? "text-zinc-400" : "text-[#7b6d58]"].join(" ");
}

function SmartSelect({
  isDark,
  value,
  options,
  onChange,
}: {
  isDark: boolean;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selected = options.find((option) => option.value === value) || options[0];

  useEffect(() => {
    if (!open) return;
    const closeOnOutside = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={[
          "flex min-h-[38px] w-full items-center justify-between gap-3 border px-3 py-2 text-left text-sm outline-none transition",
          isDark
            ? "rounded-xl border-white/10 bg-black/25 text-white shadow-[0_10px_36px_rgba(0,0,0,0.22)] hover:border-emerald-400/35 hover:bg-white/[0.07] focus:border-emerald-400/45 focus:ring-4 focus:ring-emerald-500/10"
            : "rounded-md border-[#dfd0b9] bg-[#fffdf7] text-[#342b1d] shadow-sm hover:border-[#c8b18b] hover:bg-white focus:border-[#8a6a3f]/55 focus:ring-2 focus:ring-[#8a6a3f]/12",
        ].join(" ")}
      >
        <span className="min-w-0">
          <span className="block truncate font-bold">{selected?.label || "-"}</span>
          {selected?.meta ? (
            <span className={["mt-0.5 block truncate text-[11px]", isDark ? "text-zinc-500" : "text-[#8a7a61]"].join(" ")}>
              {selected.meta}
            </span>
          ) : null}
        </span>
        <span
          aria-hidden="true"
          className={[
            "h-2 w-2 shrink-0 border-b border-r transition-transform",
            open ? "rotate-[225deg]" : "rotate-45",
            isDark ? "border-emerald-300" : "border-[#8a6a3f]",
          ].join(" ")}
        />
      </button>

      {open ? (
        <div
          role="listbox"
          className={[
            "absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden border p-1 shadow-2xl",
            isDark
              ? "rounded-2xl border-emerald-400/20 bg-[#080b0a]/95 shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
              : "rounded-lg border-[#d7c3a4] bg-[#fffaf0] shadow-[0_18px_44px_rgba(95,67,31,0.16)]",
          ].join(" ")}
        >
          <div className="max-h-56 space-y-1 overflow-auto pr-1">
            {options.map((option) => {
              const active = option.value === value;
              return (
                <button
                  key={option.value || "__empty"}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={[
                    "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-xs transition",
                    active
                      ? (isDark ? "rounded-xl bg-emerald-500/15 text-emerald-100" : "rounded-md bg-[#f1e4cf] text-[#5b4126]")
                      : (isDark ? "rounded-xl text-zinc-300 hover:bg-white/[0.08] hover:text-white" : "rounded-md text-[#6d5433] hover:bg-white"),
                  ].join(" ")}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-black">{option.label}</span>
                    {option.meta ? (
                      <span className={["mt-0.5 block truncate text-[11px] font-semibold", isDark ? "text-zinc-500" : "text-[#8a7a61]"].join(" ")}>
                        {option.meta}
                      </span>
                    ) : null}
                  </span>
                  {active ? (
                    <span className={["h-2 w-2 shrink-0 rounded-full", isDark ? "bg-emerald-300" : "bg-[#8a6a3f]"].join(" ")} />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function userLabel(item: UserOverviewItem) {
  return [item.first_name, item.last_name].filter(Boolean).join(" ").trim() || item.email || item.user_id;
}

function normalizeText(value: unknown) {
  return String(value || "")
    .trim()
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function roleNamesFromList(roles?: Array<string | { name?: string }>) {
  return (roles || []).map((role) => normalizeText(typeof role === "string" ? role : role?.name));
}

function roleNames(item: UserOverviewItem) {
  return roleNamesFromList(item.roles);
}

function personName(value: Pick<UserOverviewItem, "first_name" | "last_name" | "email" | "user_id"> | SessionUser) {
  return [value.first_name, value.last_name].filter(Boolean).join(" ").trim() || value.email || ("user_id" in value ? value.user_id : "");
}

function samePerson(item: UserOverviewItem, user?: SessionUser | null) {
  if (!user) return false;
  const userId = normalizeText(user.id || user.user_id);
  const itemId = normalizeText(item.user_id);
  const userEmail = normalizeText(user.email);
  const itemEmail = normalizeText(item.email);
  const userName = normalizeText(personName(user));
  const itemName = normalizeText(personName(item));

  return Boolean(
    (userId && itemId && userId === itemId) ||
      (userEmail && itemEmail && userEmail === itemEmail) ||
      (userName && itemName && userName === itemName),
  );
}

function mergeCurrentAdminSignal(item: UserOverviewItem, user?: SessionUser | null): UserOverviewItem {
  if (!samePerson(item, user) || !roleNamesFromList(user?.roles).includes("admin")) return item;
  const roles = item.roles || [];
  return roleNamesFromList(roles).includes("admin") ? item : { ...item, roles: [...roles, "admin"] };
}

function hasAdminSignal(item: UserOverviewItem) {
  const email = normalizeText(item.email);
  const name = normalizeText(personName(item));
  const roles = roleNames(item);
  return (
    email === "mertb2627@gmail.com" ||
    name === "mert bulbul" ||
    roles.some((role) => ["admin", "administrator", "yonetici"].includes(role))
  );
}

function accountKind(item: UserOverviewItem): AccountKind {
  const roles = roleNames(item);
  const accountType = normalizeText(item.account_type);
  if (hasAdminSignal(item)) return "admin";
  if (accountType === "diyetisyen" || accountType === "dietitian" || roles.some((role) => role === "diyetisyen" || role === "dietitian")) {
    return "dietitian";
  }
  if (accountType === "client" || accountType === "danisan" || accountType === "danısan" || roles.some((role) => role === "client" || role === "danisan" || role === "danısan")) {
    return "client";
  }
  return "user";
}

function recordKind(item: UserOverviewItem, lang: Lang) {
  const kind = accountKind(item);
  if (kind === "admin") return "Admin";
  if (kind === "dietitian") return lang === "tr" ? "Diyetisyen" : "Dietitian";
  if (kind === "client") return lang === "tr" ? "Danışan" : "Client";
  return lang === "tr" ? "Kullanıcı" : "User";
}

function recordSubtitle(item: UserOverviewItem, lang: Lang) {
  const kind = accountKind(item);
  if (kind === "admin") return lang === "tr" ? "Yönetici hesabı" : "Admin account";
  if (kind === "dietitian") return item.clinic_name || item.clinic_city || (lang === "tr" ? "Klinik yok" : "No clinic");
  if (kind === "client") return item.assigned_dietitian_name || (lang === "tr" ? "Atama yok" : "No assignment");
  return item.email || item.phone_number || "-";
}

function recordMeta(item: UserOverviewItem, lang: Lang) {
  const kind = accountKind(item);
  if (kind === "admin") return lang === "tr" ? "Yönetici" : "Admin";
  if (kind === "dietitian") {
    return `${lang === "tr" ? "Danışan" : "Clients"}: ${item.assigned_clients_count || 0}`;
  }
  if (kind === "client") {
    return item.assigned_dietitian_id || item.assigned_dietitian_name
      ? (lang === "tr" ? "Atandı" : "Assigned")
      : (lang === "tr" ? "Atama yok" : "No assignment");
  }
  return lang === "tr" ? "Kayıt" : "Record";
}

function recordBadgeClass(isDark: boolean, item: UserOverviewItem) {
  const tone = accountKind(item);
  return [
    "shrink-0 rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-wide",
    tone === "admin"
      ? (isDark ? "border-sky-300/25 bg-sky-400/10 text-sky-100" : "border-[#b8c9da] bg-[#edf5fb] text-[#27556f]")
      : tone === "dietitian"
        ? (isDark ? "border-emerald-300/25 bg-emerald-500/12 text-emerald-100" : "border-[#c7dbc7] bg-[#edf6ec] text-[#285743]")
        : (isDark ? "border-white/10 bg-white/5 text-zinc-200" : "border-[#e4d5bf] bg-[#fff7e8] text-[#745737]"),
  ].join(" ");
}

function StatCard({ isDark, label, value }: { isDark: boolean; label: string; value: string }) {
  return <div className={innerPanel(isDark)}><div className={["truncate text-[10px] font-semibold uppercase", isDark ? "text-zinc-400" : "text-[#806f57]"].join(" ")}>{label}</div><div className="mt-0.5 text-xl font-black leading-none">{value}</div></div>;
}
function HealthRow({ isDark, label, ok, okText, badText }: { isDark: boolean; label: string; ok: boolean; okText: string; badText: string }) {
  return <div className={["mt-2 flex items-center justify-between px-2.5 py-2", isDark ? "rounded-xl bg-black/25" : "rounded-md bg-[#f4efe4]"].join(" ")}><span className={["text-xs font-semibold", isDark ? "text-zinc-300" : "text-[#756449]"].join(" ")}>{label}</span><span className={["px-2 py-1 text-[10px] font-bold", ok ? (isDark ? "rounded-full bg-emerald-500/15 text-emerald-100" : "rounded-md bg-[#f1e4cf] text-[#745737]") : (isDark ? "rounded-full bg-amber-500/16 text-amber-100" : "rounded-md bg-amber-100 text-amber-800")].join(" ")}>{ok ? okText : badText}</span></div>;
}
function DetailRow({ isDark, k, v }: { isDark: boolean; k: string; v: string }) {
  return <div className={["grid grid-cols-[86px_1fr] gap-2 px-2.5 py-1.5", isDark ? "rounded-lg bg-black/25" : "rounded-md bg-[#f4efe4]"].join(" ")}><div className={["text-[10px] font-bold", isDark ? "text-zinc-400" : "text-[#806f57]"].join(" ")}>{k}</div><div className={["break-words text-xs font-semibold", isDark ? "text-zinc-200" : "text-[#4f3d25]"].join(" ")}>{v}</div></div>;
}
function RateRow({ isDark, label, value, tone }: { isDark: boolean; label: string; value: number; tone: "emerald" | "teal" | "amber" }) {
  const safe = Math.max(0, Math.min(100, value));
  const fill = isDark
    ? tone === "amber" ? "bg-amber-300" : tone === "teal" ? "bg-teal-300" : "bg-emerald-400"
    : tone === "amber" ? "bg-[#c9922e]" : tone === "teal" ? "bg-[#a37e4d]" : "bg-[#8a6a3f]";
  return <div><div className="flex items-center justify-between text-xs"><span className={isDark ? "text-zinc-300" : "text-[#756449]"}>{label}</span><span className="font-black">{safe}%</span></div><div className={["mt-1 h-2 w-full overflow-hidden rounded-full", isDark ? "bg-white/10" : "bg-[#e5d9c7]"].join(" ")}><div className={`h-2 rounded-full ${fill}`} style={{ width: `${safe}%` }} /></div></div>;
}
function ErrorBox({ isDark, children }: { isDark: boolean; children: string }) {
  return <div className={["mt-3 rounded-md border px-3 py-2 text-xs", isDark ? "border-rose-500/30 bg-rose-500/10 text-rose-200" : "border-rose-300 bg-rose-50 text-rose-700"].join(" ")}>{children}</div>;
}

function splitClinicCity(value?: string | null) {
  const raw = String(value || "").trim();
  if (!raw) return { city: "", district: "" };
  const parts = raw.split(/\s+(?:\/|-)\s+|,\s*/).map((part) => part.trim()).filter(Boolean);
  return {
    city: parts[0] || raw,
    district: parts.slice(1).join(" / "),
  };
}

function composeClinicCity(city: string, district: string) {
  const cleanCity = city.trim();
  const cleanDistrict = district.trim();
  return cleanDistrict ? `${cleanCity} / ${cleanDistrict}` : cleanCity;
}
