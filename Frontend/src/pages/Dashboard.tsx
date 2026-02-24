import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

type Theme = "dark" | "light";
type Lang = "tr" | "en";
type SessionUser = {
  first_name?: string;
  last_name?: string;
  full_name?: string;
  display_name?: string;
  email?: string;
  phone_number?: string;
  roles?: Array<{ name?: string }>;
};

const COPY = {
  tr: {
    title: "Dashboard",
    subtitle: "Danisanlar, planlar, olcumler ve sohbet akislarini buradan yonet.",
    home: "Ana Sayfa",
    profile: "Profil",
    logout: "Cikis Yap",
    statA: "Aktif Danisan",
    statB: "Plan",
    statC: "Mesaj",
    statD: "Uyum",
    quickActions: "Hizli Islemler",
    recent: "Son Aktiviteler",
    a1: "Danisan Ekle",
    a2: "Plan Olustur",
    a3: "Olcum Gir",
    a4: "Mesajlara Git",
    r1: "2 danisan bugun olcum girdi",
    r2: "5 yeni mesaj",
    r3: "8 ogun isaretlemesi yapildi",
    welcome: "Hosgeldin",
  },
  en: {
    title: "Dashboard",
    subtitle: "Manage clients, plans, measurements and chat flows from here.",
    home: "Home",
    profile: "Profile",
    logout: "Log Out",
    statA: "Active Clients",
    statB: "Plans",
    statC: "Messages",
    statD: "Adherence",
    quickActions: "Quick Actions",
    recent: "Recent Activity",
    a1: "Add Client",
    a2: "Create Plan",
    a3: "Add Measurement",
    a4: "Open Messages",
    r1: "2 clients submitted measurements today",
    r2: "5 new messages",
    r3: "8 meal markings completed",
    welcome: "Welcome",
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
  const [summary, setSummary] = useState<{ activeClients: number; plans: number; messages: number; adherence: number }>({
    activeClients: 0,
    plans: 0,
    messages: 0,
    adherence: 0,
  });
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [summaryError, setSummaryError] = useState("");
  const t = COPY[lang];
  const isDark = theme === "dark";

  useEffect(() => {
    localStorage.setItem("sd_theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("sd_lang", lang);
  }, [lang]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    fetch(`${API_BASE}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error("unauthorized");
        return r.json();
      })
      .then((d) => {
        const profile = d?.data ?? d;
        if (profile?.id || profile?.email) {
          setUser(profile);
          localStorage.setItem("sd_user", JSON.stringify(profile));
        }
      })
      .catch(() => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("sd_user");
        navigate("/login");
      });
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    setLoadingSummary(true);
    setSummaryError("");
    fetch(`${API_BASE}/api/auth/dashboard/summary`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error("summary_error");
        return r.json();
      })
      .then((d) => {
        const data = d?.data ?? d;
        setSummary({
          activeClients: Number(data?.activeClients ?? 0),
          plans: Number(data?.plans ?? 0),
          messages: Number(data?.messages ?? 0),
          adherence: Number(data?.adherence ?? 0),
        });
      })
      .catch(() => {
        setSummaryError(lang === "tr" ? "Ozet verileri alinamadi." : "Failed to load summary.");
      })
      .finally(() => setLoadingSummary(false));
  }, [lang]);

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

  return (
    <div className={["relative min-h-screen w-screen overflow-hidden", isDark ? "text-zinc-50" : "text-[#123a32]"].join(" ")}>
      <div className="pointer-events-none absolute inset-0">
        <div
          className={
            isDark
              ? "absolute inset-0 [background:radial-gradient(1150px_700px_at_12%_5%,rgba(16,185,129,0.2),transparent_58%),radial-gradient(860px_620px_at_92%_12%,rgba(20,184,166,0.14),transparent_58%),linear-gradient(180deg,#050608,#07090b_52%,#050608)]"
              : "absolute inset-0 [background:radial-gradient(1180px_740px_at_10%_0%,rgba(22,128,101,0.23),transparent_58%),radial-gradient(980px_640px_at_92%_8%,rgba(20,120,133,0.16),transparent_56%),linear-gradient(180deg,#edf5f1,#e2ede8_56%,#dce8e2)]"
          }
        />
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
            <div className={["inline-flex rounded-full p-1", isDark ? "border border-white/10 bg-white/5" : "border border-[#2f6154]/25 bg-[#f3f8f5]"].join(" ")}>
              <button type="button" onClick={() => setTheme((v) => (v === "dark" ? "light" : "dark"))} className={["rounded-full px-3 py-1 text-xs font-bold", isDark ? "text-zinc-100 hover:bg-white/10" : "text-[#123a32] hover:bg-[#e8f1ec]"].join(" ")}>{theme === "dark" ? "Dark" : "Light"}</button>
            </div>
            <div className={["inline-flex rounded-full p-1", isDark ? "border border-white/10 bg-white/5" : "border border-[#2f6154]/25 bg-[#f3f8f5]"].join(" ")}>
              <button type="button" onClick={() => setLang("tr")} className={["rounded-full px-3 py-1 text-xs font-bold", lang === "tr" ? (isDark ? "bg-emerald-500/25 text-emerald-100" : "bg-[#dbece4] text-[#0f2f29]") : ""].join(" ")}>TR</button>
              <button type="button" onClick={() => setLang("en")} className={["rounded-full px-3 py-1 text-xs font-bold", lang === "en" ? (isDark ? "bg-emerald-500/25 text-emerald-100" : "bg-[#dbece4] text-[#0f2f29]") : ""].join(" ")}>EN</button>
            </div>
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
          <div className={["mt-4 rounded-xl px-4 py-3 text-sm", isDark ? "border border-rose-500/30 bg-rose-500/10 text-rose-200" : "border border-rose-400/45 bg-rose-100 text-rose-700"].join(" ")}>
            {summaryError}
          </div>
        ) : null}

        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          <Panel isDark={isDark} title={t.quickActions}>
            <div className="grid gap-3 sm:grid-cols-2">
              <ActionBtn isDark={isDark}>{t.a1}</ActionBtn>
              <ActionBtn isDark={isDark}>{t.a2}</ActionBtn>
              <ActionBtn isDark={isDark}>{t.a3}</ActionBtn>
              <ActionBtn isDark={isDark}>{t.a4}</ActionBtn>
            </div>
          </Panel>
          <Panel isDark={isDark} title={t.recent}>
            <ul className="space-y-3 text-sm">
              <li className={["rounded-xl px-3 py-2", isDark ? "border border-white/10 bg-white/5 text-zinc-300" : "border border-[#325d51]/20 bg-[#f2f8f5] text-[#36544c]"].join(" ")}>{t.r1}</li>
              <li className={["rounded-xl px-3 py-2", isDark ? "border border-white/10 bg-white/5 text-zinc-300" : "border border-[#325d51]/20 bg-[#f2f8f5] text-[#36544c]"].join(" ")}>{t.r2}</li>
              <li className={["rounded-xl px-3 py-2", isDark ? "border border-white/10 bg-white/5 text-zinc-300" : "border border-[#325d51]/20 bg-[#f2f8f5] text-[#36544c]"].join(" ")}>{t.r3}</li>
            </ul>
          </Panel>
        </section>
      </main>
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

function ActionBtn({ isDark, children }: { isDark: boolean; children: React.ReactNode }) {
  return (
    <button className={["rounded-xl px-4 py-3 text-left text-sm font-semibold transition", isDark ? "border border-white/10 bg-white/5 hover:bg-white/10" : "border border-[#325d51]/22 bg-white hover:bg-[#ebf3ee]"].join(" ")}>
      {children}
    </button>
  );
}
