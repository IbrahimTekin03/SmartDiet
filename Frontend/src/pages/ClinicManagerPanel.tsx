import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  DashboardLoadingScreen,
  DashboardPanel,
  DashboardSectionHeader,
  DashboardShell,
  DashboardStatCard,
  dashboardButtonClass,
  labelTextClass,
  mutedTextClass,
} from "../components/DashboardShell";
import { useAppSettings } from "../context/AppSettingsContext";
import { clearAuthSession, setAuthSession } from "../lib/authSession";

type SortMode = "newest" | "oldest";
type StatusFilter = "all" | "active" | "inactive";

type SessionUser = {
  first_name?: string;
  last_name?: string;
  full_name?: string;
  display_name?: string;
  email?: string;
  roles?: Array<{ name?: string }>;
};

type DietitianItem = {
  user_id: string;
  first_name?: string;
  last_name?: string;
  email?: string | null;
  phone_number?: string | null;
  roles?: string[];
  clinic_name?: string | null;
  clinic_city?: string | null;
  clinic_address?: string | null;
  verification_note?: string | null;
  reviewed_at?: string | null;
  is_active?: boolean;
  is_verified?: boolean;
  last_login?: string | null;
};

type PagedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const API_BASE = "https://smart-diet06.vercel.app";

const COPY = {
  tr: {
    load: "Panel hazırlanıyor",
    tag: "Klinik Yönetimi",
    title: "Onaylı diyetisyen operasyonu",
    subtitle:
      "Kliniğe bağlı diyetisyenleri tek ekrandan izle, filtrele ve aktiflik durumlarını güvenli biçimde yönet.",
    welcome: "Hoş geldin",
    profile: "Profil",
    logout: "Çıkış Yap",
    refresh: "Yenile",
    total: "Toplam Onaylı",
    active: "Aktif Hesap",
    inactive: "Pasif Hesap",
    visible: "Görünen Kayıt",
    listTitle: "Diyetisyen Listesi",
    listSub: "Arama, filtre ve seçim akışını tek bölümde topladık.",
    search: "Diyetisyen Ara",
    searchPh: "isim, e-posta veya klinik",
    city: "Şehir",
    allCities: "Tüm şehirler",
    sort: "Sıralama",
    newest: "Yeni > Eski",
    oldest: "Eski > Yeni",
    status: "Durum",
    all: "Tüm Kayıtlar",
    activeOnly: "Sadece Aktif",
    inactiveOnly: "Sadece Pasif",
    listEmpty: "Bu filtrelerle gösterilecek diyetisyen bulunamadı.",
    detailTitle: "Seçili Diyetisyen",
    detailSub: "Detay, iletişim ve operasyon notları",
    detailEmpty: "Soldaki listeden bir diyetisyen seç.",
    clinic: "Klinik",
    email: "E-posta",
    phone: "Telefon",
    cityLabel: "Şehir",
    address: "Adres",
    note: "Başvuru Notu",
    reviewedAt: "Onay Tarihi",
    lastLogin: "Son Giriş",
    activity: "Hesap Durumu",
    activeState: "Aktif",
    inactiveState: "Pasif",
    verified: "Doğrulanmış",
    unverified: "Doğrulanmamış",
    activate: "Hesabı Aktifleştir",
    deactivate: "Hesabı Pasifleştir",
    updating: "Güncelleniyor...",
    listErr: "Diyetisyen listesi alınamadı.",
    updateErr: "Aktiflik durumu güncellenemedi.",
    noData: "Belirtilmedi",
    page: "Sayfa",
    prev: "Önceki",
    next: "Sonraki",
    opsTitle: "Operasyon Merkezi",
    opsSub: "Bugünkü tarama akışını hızlandıran özet alan",
    opsA: "Seçili kişinin iletişim bilgisini tek tıkla kopyalayabilirsin.",
    opsB: "Filtreler görünen listeye uygulanır; üst kartlar mevcut sayfayı yansıtır.",
    opsC: "Sayfa açık kaldığında liste 30 saniyede bir yenilenir.",
    copyMail: "E-postayı Kopyala",
    copyPhone: "Telefonu Kopyala",
    copied: "Bilgi panoya kopyalandı.",
    fallbackManager: "Klinik Yöneticisi",
  },
  en: {
    load: "Preparing panel",
    tag: "Clinic Management",
    title: "Approved dietitian operations",
    subtitle:
      "Monitor, filter and manage clinic dietitians from one focused dashboard.",
    welcome: "Welcome",
    profile: "Profile",
    logout: "Log Out",
    refresh: "Refresh",
    total: "Total Approved",
    active: "Active Accounts",
    inactive: "Inactive Accounts",
    visible: "Visible Records",
    listTitle: "Dietitian Directory",
    listSub: "Search, filter and selection flow in one place.",
    search: "Search Dietitian",
    searchPh: "name, email or clinic",
    city: "City",
    allCities: "All cities",
    sort: "Sort",
    newest: "Newest > Oldest",
    oldest: "Oldest > Newest",
    status: "Status",
    all: "All Records",
    activeOnly: "Active Only",
    inactiveOnly: "Inactive Only",
    listEmpty: "No dietitians match the current filters.",
    detailTitle: "Selected Dietitian",
    detailSub: "Detail, contact and operation notes",
    detailEmpty: "Select a dietitian from the list on the left.",
    clinic: "Clinic",
    email: "Email",
    phone: "Phone",
    cityLabel: "City",
    address: "Address",
    note: "Application Note",
    reviewedAt: "Approved At",
    lastLogin: "Last Login",
    activity: "Account State",
    activeState: "Active",
    inactiveState: "Inactive",
    verified: "Verified",
    unverified: "Unverified",
    activate: "Activate Account",
    deactivate: "Deactivate Account",
    updating: "Updating...",
    listErr: "Failed to load dietitians.",
    updateErr: "Failed to update activity state.",
    noData: "Not provided",
    page: "Page",
    prev: "Previous",
    next: "Next",
    opsTitle: "Operations Center",
    opsSub: "A compact area that speeds up daily review flow",
    opsA: "Copy contact details for the selected person with one click.",
    opsB: "Filters apply to the visible list; the top cards reflect the current page.",
    opsC: "The list refreshes every 30 seconds while the page stays open.",
    copyMail: "Copy Email",
    copyPhone: "Copy Phone",
    copied: "Copied to clipboard.",
    fallbackManager: "Clinic Manager",
  },
} as const;

export default function ClinicManagerPanel() {
  const navigate = useNavigate();
  const { lang, isDark } = useAppSettings();
  const t = COPY[lang];
  const [user, setUser] = useState<SessionUser | null>(() => {
    try {
      const raw = localStorage.getItem("sd_user");
      return raw ? (JSON.parse(raw) as SessionUser) : null;
    } catch {
      return null;
    }
  });
  const [loadingProfile, setLoadingProfile] = useState(Boolean(localStorage.getItem("access_token")));
  const [loadingList, setLoadingList] = useState(true);
  const [dietitians, setDietitians] = useState<DietitianItem[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState("");
  const [copiedMessage, setCopiedMessage] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const refreshRef = useRef<() => Promise<void>>(async () => undefined);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput), 250);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!copiedMessage) return;
    const timer = window.setTimeout(() => setCopiedMessage(""), 2200);
    return () => window.clearTimeout(timer);
  }, [copiedMessage]);

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

  const hasClinicManagerRole = useMemo(
    () =>
      (user?.roles || []).some((role) => {
        const normalized = String(role?.name || "").toLowerCase();
        return normalized === "clinic_manager" || normalized === "admin";
      }),
    [user],
  );

  useEffect(() => {
    if (!loadingProfile && user && !hasClinicManagerRole) {
      navigate("/", { replace: true });
    }
  }, [hasClinicManagerRole, loadingProfile, navigate, user]);

  const fetchDietitians = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token || !hasClinicManagerRole) return;

    setError("");
    setLoadingList(true);

    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "10");
      params.set("sort", sortMode);
      if (search.trim()) params.set("search", search.trim());
      if (cityFilter.trim()) params.set("city", cityFilter.trim());

      const res = await fetch(`${API_BASE}/api/auth/clinic-manager/dietitians?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "list_error");

      const payload = (data?.data ?? data) as PagedResponse<DietitianItem>;
      const nextItems = Array.isArray(payload?.items) ? payload.items : [];
      setDietitians(nextItems);
      setTotal(Number(payload?.total ?? 0));
      setPage(Number(payload?.page ?? page));
      setTotalPages(Number(payload?.totalPages ?? 0));
    } catch {
      setError(t.listErr);
      setDietitians([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setLoadingList(false);
    }
  }, [cityFilter, hasClinicManagerRole, page, search, sortMode, t.listErr]);

  useEffect(() => {
    refreshRef.current = fetchDietitians;
  }, [fetchDietitians]);

  useEffect(() => {
    if (!hasClinicManagerRole) return;
    void fetchDietitians();
  }, [fetchDietitians, hasClinicManagerRole]);

  useEffect(() => {
    const run = () => {
      if (document.visibilityState !== "visible") return;
      void refreshRef.current();
    };

    if (!hasClinicManagerRole) return;
    const timer = window.setInterval(run, 30000);
    document.addEventListener("visibilitychange", run);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", run);
    };
  }, [hasClinicManagerRole]);

  useEffect(() => {
    setPage(1);
  }, [cityFilter, search, sortMode]);

  const filteredDietitians = useMemo(() => {
    if (statusFilter === "active") return dietitians.filter((item) => Boolean(item.is_active));
    if (statusFilter === "inactive") return dietitians.filter((item) => !item.is_active);
    return dietitians;
  }, [dietitians, statusFilter]);

  useEffect(() => {
    if (!filteredDietitians.length) {
      setSelectedId("");
      return;
    }
    if (!selectedId || !filteredDietitians.some((item) => item.user_id === selectedId)) {
      setSelectedId(filteredDietitians[0].user_id);
    }
  }, [filteredDietitians, selectedId]);

  const selected = useMemo(
    () => filteredDietitians.find((item) => item.user_id === selectedId) ?? null,
    [filteredDietitians, selectedId],
  );

  const cities = useMemo(() => {
    const values = new Set<string>();
    for (const item of dietitians) {
      const city = String(item.clinic_city || "").trim();
      if (city) values.add(city);
    }
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [dietitians]);

  const activeVisibleCount = useMemo(
    () => filteredDietitians.filter((item) => item.is_active).length,
    [filteredDietitians],
  );
  const inactiveVisibleCount = Math.max(0, filteredDietitians.length - activeVisibleCount);

  const displayName = useMemo(() => {
    if (!user) return t.fallbackManager;
    const full = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
    return full || user.full_name || user.display_name || user.email || t.fallbackManager;
  }, [t.fallbackManager, user]);

  const formatDate = (value?: string | null) => {
    if (!value) return t.noData;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return t.noData;
    return date.toLocaleString(lang === "tr" ? "tr-TR" : "en-US");
  };

  const copyToClipboard = async (value?: string | null) => {
    const content = String(value || "").trim();
    if (!content || typeof navigator === "undefined" || !navigator.clipboard?.writeText) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessage(t.copied);
    } catch {
      setCopiedMessage("");
    }
  };

  const setActivation = async (target: DietitianItem, isActive: boolean) => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    setUpdatingId(target.user_id);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/auth/clinic-manager/dietitians/${target.user_id}/activation`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "update_error");

      setDietitians((prev) =>
        prev.map((item) => (item.user_id === target.user_id ? { ...item, is_active: isActive } : item)),
      );
    } catch {
      setError(t.updateErr);
    } finally {
      setUpdatingId(null);
    }
  };

  const logout = () => {
    clearAuthSession();
    navigate("/login", { replace: true });
  };

  const summaryCards = [
    { label: t.total, value: String(total), tone: "from-emerald-400/20 to-teal-300/10" },
    { label: t.active, value: String(activeVisibleCount), tone: "from-sky-400/20 to-cyan-300/10" },
    { label: t.inactive, value: String(inactiveVisibleCount), tone: "from-amber-400/20 to-orange-300/10" },
    { label: t.visible, value: String(filteredDietitians.length), tone: "from-fuchsia-400/20 to-pink-300/10" },
  ];

  const statusTabs: Array<{ key: StatusFilter; label: string }> = [
    { key: "all", label: t.all },
    { key: "active", label: t.activeOnly },
    { key: "inactive", label: t.inactiveOnly },
  ];

  if (loadingProfile || !hasClinicManagerRole) {
    return <DashboardLoadingScreen isDark={isDark} message={t.load} />;
  }

  return (
    <DashboardShell
      isDark={isDark}
      badge={t.tag}
      title={`${t.welcome} ${displayName}`}
      subtitle={t.subtitle}
      actions={
        <>
          <button type="button" onClick={() => void fetchDietitians()} className={dashboardButtonClass(isDark)}>
            {t.refresh}
          </button>
          <Link to="/profile" className={dashboardButtonClass(isDark)}>
            {t.profile}
          </Link>
          <button type="button" onClick={logout} className={dashboardButtonClass(isDark, "danger")}>
            {t.logout}
          </button>
        </>
      }
    >
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <DashboardStatCard key={card.label} isDark={isDark} title={card.label} value={loadingList ? "..." : card.value} accent={card.tone} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <DashboardPanel isDark={isDark}>
          <DashboardSectionHeader
            isDark={isDark}
            title={t.listTitle}
            subtitle={t.listSub}
            aside={
              <div className="flex flex-wrap gap-2">
                {statusTabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setStatusFilter(tab.key)}
                    className={[
                      "rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] transition",
                      statusFilter === tab.key
                        ? "bg-gradient-to-r from-emerald-400 to-teal-300 text-zinc-950"
                        : isDark
                          ? "border border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10"
                          : "border border-[#2f6154]/15 bg-[#f6faf7] text-[#24483f] hover:bg-white",
                    ].join(" ")}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            }
          />

          <div className="grid gap-3 lg:grid-cols-3">
            <label className="lg:col-span-1">
              <span className={labelTextClass(isDark)}>{t.search}</span>
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t.searchPh}
                className={inputClass(isDark)}
              />
            </label>
            <label>
              <span className={labelTextClass(isDark)}>{t.city}</span>
              <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className={inputClass(isDark)}>
                <option value="">{t.allCities}</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className={labelTextClass(isDark)}>{t.sort}</span>
              <select value={sortMode} onChange={(e) => setSortMode(e.target.value as SortMode)} className={inputClass(isDark)}>
                <option value="newest">{t.newest}</option>
                <option value="oldest">{t.oldest}</option>
              </select>
            </label>
          </div>

          {error ? <NoticeBox isDark={isDark} tone="danger" text={error} /> : null}
          {copiedMessage ? <NoticeBox isDark={isDark} tone="success" text={copiedMessage} /> : null}

          <div className="mt-5 space-y-3">
            {loadingList ? (
              <div className={mutedTextClass(isDark)}>{t.load}</div>
            ) : filteredDietitians.length ? (
              filteredDietitians.map((item) => {
                const active = Boolean(item.is_active);
                const selectedRow = item.user_id === selectedId;
                const fullName =
                  [item.first_name, item.last_name].filter(Boolean).join(" ").trim() || item.email || t.noData;

                return (
                  <button
                    key={item.user_id}
                    type="button"
                    onClick={() => setSelectedId(item.user_id)}
                    className={[
                      "w-full rounded-[24px] border p-4 text-left transition",
                      selectedRow
                        ? isDark
                          ? "border-emerald-400/35 bg-emerald-500/10"
                          : "border-[#1f705a]/25 bg-[#e9f4ef]"
                        : isDark
                          ? "border-white/10 bg-black/20 hover:bg-white/5"
                          : "border-[#2f6154]/15 bg-[#f8fbf9] hover:bg-white",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-extrabold">{fullName}</div>
                        <div className={mutedTextClass(isDark)}>{item.clinic_name || t.noData}</div>
                        <div className={mutedTextClass(isDark)}>{item.clinic_city || t.noData}</div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <StatusChip isDark={isDark} active={active}>
                          {active ? t.activeState : t.inactiveState}
                        </StatusChip>
                        <StatusChip isDark={isDark} active={Boolean(item.is_verified)} secondary>
                          {item.is_verified ? t.verified : t.unverified}
                        </StatusChip>
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className={mutedTextClass(isDark)}>{t.listEmpty}</div>
            )}
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <div className={mutedTextClass(isDark)}>
              {t.page} {page}/{Math.max(totalPages, 1)}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1}
                className={buttonWithDisabled(dashboardButtonClass(isDark))}
              >
                {t.prev}
              </button>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(Math.max(totalPages, 1), current + 1))}
                disabled={page >= Math.max(totalPages, 1)}
                className={buttonWithDisabled(dashboardButtonClass(isDark))}
              >
                {t.next}
              </button>
            </div>
          </div>
        </DashboardPanel>

        <div className="grid gap-6">
          <DashboardPanel isDark={isDark}>
            <DashboardSectionHeader isDark={isDark} title={t.detailTitle} subtitle={t.detailSub} />

            {!selected ? (
              <div className={mutedTextClass(isDark)}>{t.detailEmpty}</div>
            ) : (
              <div className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-2xl font-extrabold">
                      {[selected.first_name, selected.last_name].filter(Boolean).join(" ").trim() || t.noData}
                    </div>
                    <p className={mutedTextClass(isDark)}>{selected.clinic_name || t.noData}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusChip isDark={isDark} active={Boolean(selected.is_active)}>
                      {selected.is_active ? t.activeState : t.inactiveState}
                    </StatusChip>
                    <StatusChip isDark={isDark} active={Boolean(selected.is_verified)} secondary>
                      {selected.is_verified ? t.verified : t.unverified}
                    </StatusChip>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <DetailCard isDark={isDark} label={t.email} value={selected.email || t.noData} />
                  <DetailCard isDark={isDark} label={t.phone} value={selected.phone_number || t.noData} />
                  <DetailCard isDark={isDark} label={t.clinic} value={selected.clinic_name || t.noData} />
                  <DetailCard isDark={isDark} label={t.cityLabel} value={selected.clinic_city || t.noData} />
                  <DetailCard isDark={isDark} label={t.reviewedAt} value={formatDate(selected.reviewed_at)} />
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void copyToClipboard(selected.email)}
                    className={buttonWithDisabled(dashboardButtonClass(isDark))}
                    disabled={!selected.email}
                  >
                    {t.copyMail}
                  </button>
                  <button
                    type="button"
                    onClick={() => void copyToClipboard(selected.phone_number)}
                    className={buttonWithDisabled(dashboardButtonClass(isDark))}
                    disabled={!selected.phone_number}
                  >
                    {t.copyPhone}
                  </button>
                </div>

                <DetailBlock isDark={isDark} label={t.address} value={selected.clinic_address || t.noData} />
                <DetailBlock isDark={isDark} label={t.note} value={selected.verification_note || t.noData} />
                <DetailBlock isDark={isDark} label={t.lastLogin} value={formatDate(selected.last_login)} />
                <DetailBlock isDark={isDark} label={t.activity} value={selected.is_active ? t.activeState : t.inactiveState} />

                <button
                  type="button"
                  disabled={updatingId === selected.user_id}
                  onClick={() => void setActivation(selected, !selected.is_active)}
                  className={`${dashboardButtonClass(isDark, "primary")} w-full disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  {updatingId === selected.user_id
                    ? t.updating
                    : selected.is_active
                      ? t.deactivate
                      : t.activate}
                </button>
              </div>
            )}
          </DashboardPanel>

          <DashboardPanel isDark={isDark}>
            <DashboardSectionHeader isDark={isDark} title={t.opsTitle} subtitle={t.opsSub} />
            <div className="space-y-3">
              {[t.opsA, t.opsB, t.opsC].map((item, index) => (
                <div key={item} className="flex gap-3">
                  <div
                    className={[
                      "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold",
                      isDark ? "bg-emerald-500/15 text-emerald-200" : "bg-emerald-100 text-emerald-800",
                    ].join(" ")}
                  >
                    {index + 1}
                  </div>
                  <div className={["text-sm leading-6", isDark ? "text-zinc-300" : "text-[#36544c]"].join(" ")}>
                    {item}
                  </div>
                </div>
              ))}
            </div>
          </DashboardPanel>
        </div>
      </section>
    </DashboardShell>
  );
}

function inputClass(isDark: boolean) {
  return [
    "mt-2 w-full rounded-2xl border px-4 py-3 text-sm outline-none transition",
    isDark
      ? "border-white/10 bg-black/20 text-white placeholder:text-zinc-500 focus:border-emerald-400/40"
      : "border-[#2f6154]/15 bg-[#fbfdfc] text-[#123a32] placeholder:text-[#71867f] focus:border-[#1f705a]/30",
  ].join(" ");
}

function buttonWithDisabled(base: string) {
  return `${base} disabled:cursor-not-allowed disabled:opacity-50`;
}

function NoticeBox({
  isDark,
  tone,
  text,
}: {
  isDark: boolean;
  tone: "danger" | "success";
  text: string;
}) {
  const classes =
    tone === "danger"
      ? isDark
        ? "border-rose-500/20 bg-rose-500/10 text-rose-100"
        : "border-rose-300 bg-rose-50 text-rose-700"
      : isDark
        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-100"
        : "border-emerald-300 bg-emerald-50 text-emerald-700";

  return <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${classes}`}>{text}</div>;
}

function StatusChip({
  isDark,
  active,
  secondary = false,
  children,
}: {
  isDark: boolean;
  active: boolean;
  secondary?: boolean;
  children: string;
}) {
  const classes = secondary
    ? isDark
      ? "border-cyan-400/20 bg-cyan-500/10 text-cyan-100"
      : "border-cyan-300 bg-cyan-50 text-cyan-700"
    : active
      ? isDark
        ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-100"
        : "border-emerald-300 bg-emerald-50 text-emerald-700"
      : isDark
        ? "border-amber-400/20 bg-amber-500/10 text-amber-100"
        : "border-amber-300 bg-amber-50 text-amber-700";

  return <span className={`rounded-full border px-3 py-1 text-xs font-bold ${classes}`}>{children}</span>;
}

function DetailCard({
  isDark,
  label,
  value,
}: {
  isDark: boolean;
  label: string;
  value: string;
}) {
  return (
    <div
      className={[
        "rounded-[22px] border px-4 py-3",
        isDark ? "border-white/10 bg-black/20" : "border-[#2f6154]/15 bg-[#f8fbf9]",
      ].join(" ")}
    >
      <div className={labelTextClass(isDark)}>{label}</div>
      <div className="mt-2 break-words text-sm font-semibold">{value}</div>
    </div>
  );
}

function DetailBlock({
  isDark,
  label,
  value,
}: {
  isDark: boolean;
  label: string;
  value: string;
}) {
  return (
    <div
      className={[
        "rounded-[22px] border px-4 py-3",
        isDark ? "border-white/10 bg-black/20" : "border-[#2f6154]/15 bg-[#f8fbf9]",
      ].join(" ")}
    >
      <div className={labelTextClass(isDark)}>{label}</div>
      <div className={["mt-2 text-sm leading-6", isDark ? "text-zinc-200" : "text-[#24483f]"].join(" ")}>
        {value}
      </div>
    </div>
  );
}
