import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SettingsDrawer from "../components/SettingsDrawer";

type Theme = "dark" | "light";
type Lang = "tr" | "en";

type SessionUser = {
  id?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  display_name?: string;
  email?: string;
  phone_number?: string;
  roles?: Array<{ name?: string }>;
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
  submitted_at?: string | null;
};

const COPY = {
  tr: {
    title: "Admin Dashboard",
    subtitle: "Sistem ozetleri ve diyetisyen basvuru onaylari.",
    home: "Ana Sayfa",
    profile: "Profil",
    logout: "Cikis Yap",
    statA: "Aktif Danisan",
    statB: "Plan",
    statC: "Mesaj",
    statD: "Uyum",
    recent: "Son Aktiviteler",
    r1: "Sistem aktif.",
    r2: "OTP ve giris akislari calisiyor.",
    r3: "Yeni basvurular asagida listelenir.",
    welcome: "Hosgeldin",
    pendingApps: "Bekleyen Diyetisyen Basvurulari",
    approve: "Onayla",
    noApps: "Bekleyen basvuru yok.",
  },
  en: {
    title: "Admin Dashboard",
    subtitle: "System summary and dietitian application approvals.",
    home: "Home",
    profile: "Profile",
    logout: "Log Out",
    statA: "Active Clients",
    statB: "Plans",
    statC: "Messages",
    statD: "Adherence",
    recent: "Recent Activity",
    r1: "System is active.",
    r2: "OTP and login flows are healthy.",
    r3: "New applications are listed below.",
    welcome: "Welcome",
    pendingApps: "Pending Dietitian Applications",
    approve: "Approve",
    noApps: "No pending applications.",
  },
} as const;

export default function Dashboard() {
  const API_BASE = "http://localhost:3000";
  const navigate = useNavigate();
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem("sd_theme") === "dark" ? "dark" : "light"));
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem("sd_lang") === "en" ? "en" : "tr"));
  const [user, setUser] = useState<SessionUser | null>(() => {
    try {
      const raw = localStorage.getItem("sd_user");
      return raw ? (JSON.parse(raw) as SessionUser) : null;
    } catch {
      return null;
    }
  });
  const [summary, setSummary] = useState({ activeClients: 0, plans: 0, messages: 0, adherence: 0 });
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [summaryError, setSummaryError] = useState("");
  const [applications, setApplications] = useState<DietitianApplication[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [applicationsError, setApplicationsError] = useState("");
  const t = COPY[lang];
  const isDark = theme === "dark";

  useEffect(() => {
    localStorage.setItem("sd_theme", theme);
    localStorage.setItem("sd_lang", lang);
    document.documentElement.setAttribute("data-theme", theme);
  }, [lang, theme]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/login");
      return;
    }

    fetch(`${API_BASE}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) {
          const err = new Error(data?.message || "request_failed") as Error & { status?: number };
          err.status = r.status;
          throw err;
        }
        return data?.data ?? data;
      })
      .then((profile: SessionUser) => {
        setUser(profile);
        localStorage.setItem("sd_user", JSON.stringify(profile));
      })
      .catch((err: Error & { status?: number }) => {
        if (err?.status === 401 || err?.status === 403) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          localStorage.removeItem("sd_user");
          navigate("/login");
        }
      });
  }, [navigate]);

  const isAdmin = useMemo(
    () => (user?.roles || []).some((r) => String(r?.name || "").toLowerCase() === "admin"),
    [user],
  );

  useEffect(() => {
    if (user && !isAdmin) {
      navigate("/");
    }
  }, [isAdmin, navigate, user]);

  useEffect(() => {
    if (!isAdmin) return;
    const token = localStorage.getItem("access_token");
    if (!token) return;

    setLoadingSummary(true);
    setSummaryError("");
    fetch(`${API_BASE}/api/auth/dashboard/summary`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data?.message || "summary_error");
        return data?.data ?? data;
      })
      .then((data) =>
        setSummary({
          activeClients: Number(data?.activeClients ?? 0),
          plans: Number(data?.plans ?? 0),
          messages: Number(data?.messages ?? 0),
          adherence: Number(data?.adherence ?? 0),
        }),
      )
      .catch(() => setSummaryError(lang === "tr" ? "Ozet verileri alinamadi." : "Failed to load summary."))
      .finally(() => setLoadingSummary(false));
  }, [isAdmin, lang]);

  useEffect(() => {
    if (!isAdmin) return;
    const token = localStorage.getItem("access_token");
    if (!token) return;

    setLoadingApplications(true);
    setApplicationsError("");
    fetch(`${API_BASE}/api/auth/admin/dietitian-applications`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data?.message || "applications_error");
        return data?.data ?? data;
      })
      .then((rows: DietitianApplication[]) => setApplications(Array.isArray(rows) ? rows : []))
      .catch(() => setApplicationsError(lang === "tr" ? "Basvurular alinamadi." : "Failed to load applications."))
      .finally(() => setLoadingApplications(false));
  }, [isAdmin, lang]);

  const displayName = useMemo(() => {
    if (!user) return lang === "tr" ? "Kullanici" : "User";
    const n = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
    return n || user.full_name || user.display_name || user.email || user.phone_number || (lang === "tr" ? "Kullanici" : "User");
  }, [lang, user]);

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("sd_user");
    navigate("/login");
  };

  const approveApplication = async (userId: string) => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/auth/admin/dietitian-applications/${userId}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("approve_error");
      setApplications((prev) => prev.filter((a) => a.user_id !== userId));
    } catch {
      setApplicationsError(lang === "tr" ? "Onay islemi basarisiz." : "Approval failed.");
    }
  };

  if (!isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#07090b] text-zinc-300">
        Yukleniyor...
      </div>
    );
  }

  return (
    <div className={["relative min-h-screen w-screen overflow-hidden", isDark ? "text-zinc-50" : "text-[#123a32]"].join(" ")}>
      <div className="pointer-events-none absolute inset-0">
        <div className={isDark ? "absolute inset-0 [background:linear-gradient(180deg,#050608,#07090b_52%,#050608)]" : "absolute inset-0 [background:linear-gradient(180deg,#edf5f1,#e2ede8_56%,#dce8e2)]"} />
      </div>

      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black">{t.title}</h1>
            <p className={["mt-2 text-sm", isDark ? "text-zinc-400" : "text-[#4d6b62]"].join(" ")}>
              {t.welcome} {displayName}
            </p>
            <p className={["mt-1 text-xs", isDark ? "text-zinc-500" : "text-[#5a776d]"].join(" ")}>{t.subtitle}</p>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/" className={["rounded-full px-4 py-2 text-xs font-bold", isDark ? "border border-white/10 bg-white/5 hover:bg-white/10" : "border border-[#2f6154]/25 bg-[#f3f8f5] hover:bg-white"].join(" ")}>{t.home}</Link>
            <Link to="/profile" className={["rounded-full px-4 py-2 text-xs font-bold", isDark ? "border border-white/10 bg-white/5 hover:bg-white/10" : "border border-[#2f6154]/25 bg-[#f3f8f5] hover:bg-white"].join(" ")}>{t.profile}</Link>
            <button onClick={logout} className={["rounded-full px-4 py-2 text-xs font-bold", isDark ? "bg-rose-500/20 text-rose-100 hover:bg-rose-500/30" : "bg-rose-100 text-rose-700 hover:bg-rose-200"].join(" ")}>{t.logout}</button>
          </div>
        </header>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard isDark={isDark} title={t.statA} value={loadingSummary ? "..." : String(summary.activeClients)} />
          <StatCard isDark={isDark} title={t.statB} value={loadingSummary ? "..." : String(summary.plans)} />
          <StatCard isDark={isDark} title={t.statC} value={loadingSummary ? "..." : String(summary.messages)} />
          <StatCard isDark={isDark} title={t.statD} value={loadingSummary ? "..." : `${summary.adherence}%`} />
        </section>
        {summaryError ? (
          <div className={["mt-4 rounded-xl px-4 py-3 text-sm", isDark ? "border border-rose-500/30 bg-rose-500/10 text-rose-200" : "border border-rose-400/45 bg-rose-100 text-rose-700"].join(" ")}>{summaryError}</div>
        ) : null}

        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          <Panel isDark={isDark} title={t.recent}>
            <ul className="space-y-3 text-sm">
              <li className={["rounded-xl px-3 py-2", isDark ? "border border-white/10 bg-white/5 text-zinc-300" : "border border-[#325d51]/20 bg-[#f2f8f5] text-[#36544c]"].join(" ")}>{t.r1}</li>
              <li className={["rounded-xl px-3 py-2", isDark ? "border border-white/10 bg-white/5 text-zinc-300" : "border border-[#325d51]/20 bg-[#f2f8f5] text-[#36544c]"].join(" ")}>{t.r2}</li>
              <li className={["rounded-xl px-3 py-2", isDark ? "border border-white/10 bg-white/5 text-zinc-300" : "border border-[#325d51]/20 bg-[#f2f8f5] text-[#36544c]"].join(" ")}>{t.r3}</li>
            </ul>
          </Panel>

          <Panel isDark={isDark} title={t.pendingApps}>
            {loadingApplications ? <div className="text-sm">...</div> : null}
            {applicationsError ? <div className={["rounded-xl px-3 py-2 text-sm", isDark ? "border border-rose-500/30 bg-rose-500/10 text-rose-200" : "border border-rose-400/45 bg-rose-100 text-rose-700"].join(" ")}>{applicationsError}</div> : null}
            {!loadingApplications && applications.length === 0 ? (
              <div className={["text-sm", isDark ? "text-zinc-400" : "text-[#4d6b62]"].join(" ")}>{t.noApps}</div>
            ) : null}

            <div className="space-y-3">
              {applications.map((app) => (
                <div key={app.user_id} className={["rounded-xl border p-3 text-sm", isDark ? "border-white/10 bg-white/5" : "border-[#325d51]/20 bg-white"].join(" ")}>
                  <div className="font-bold">{[app.first_name, app.last_name].filter(Boolean).join(" ").trim() || app.email || app.phone_number || app.user_id}</div>
                  <div className={["mt-1 text-xs", isDark ? "text-zinc-300" : "text-[#4d6b62]"].join(" ")}>{app.clinic_name} - {app.clinic_city}</div>
                  <div className={["mt-1 text-xs", isDark ? "text-zinc-400" : "text-[#5a776d]"].join(" ")}>{app.clinic_address}</div>
                  <div className={["mt-1 text-xs", isDark ? "text-zinc-400" : "text-[#5a776d]"].join(" ")}>
                    {lang === "tr" ? "Belge No" : "License"}: {app.clinic_license_no}
                  </div>
                  <button
                    type="button"
                    onClick={() => approveApplication(app.user_id)}
                    className="mt-2 rounded-lg bg-gradient-to-r from-emerald-400 to-teal-300 px-3 py-2 text-xs font-bold text-zinc-950"
                  >
                    {t.approve}
                  </button>
                </div>
              ))}
            </div>
          </Panel>
        </section>
      </main>

      <SettingsDrawer
        onApply={(nextTheme, nextLang) => {
          setTheme(nextTheme);
          setLang(nextLang);
        }}
      />
    </div>
  );
}

function StatCard({ isDark, title, value }: { isDark: boolean; title: string; value: string }) {
  return (
    <div className={["rounded-2xl border p-4 backdrop-blur", isDark ? "border-white/10 bg-white/5" : "border-[#325d51]/22 bg-[#f2f8f5]"].join(" ")}>
      <div className={["text-xs", isDark ? "text-zinc-400" : "text-[#4d6b62]"].join(" ")}>{title}</div>
      <div className="mt-2 text-2xl font-black">{value}</div>
    </div>
  );
}

function Panel({ isDark, title, children }: { isDark: boolean; title: string; children: React.ReactNode }) {
  return (
    <div className={["rounded-2xl border p-5 backdrop-blur", isDark ? "border-white/10 bg-white/5" : "border-[#325d51]/22 bg-[#f2f8f5]"].join(" ")}>
      <div className="text-sm font-black">{title}</div>
      <div className="mt-4">{children}</div>
    </div>
  );
}
