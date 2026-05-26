import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  DashboardLoadingScreen,
  DashboardMessagesLink,
  DashboardPanel,
  DashboardSectionHeader,
  DashboardShell,
  DashboardStatCard,
  dashboardButtonClass,
  mutedTextClass,
} from "../components/DashboardShell";
import { useAppSettings } from "../context/AppSettingsContext";
import { useSocket } from "../context/SocketContext";
import { clearAuthSession } from "../lib/authSession";

type ClientItem = {
  user_id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  gender: string | null;
  birth_date: string | null;
};

const API_BASE = "http://localhost:3000";

const COPY = {
  tr: {
    title: "Diyetisyen Paneli",
    subtitle: "Atanmış danışanlarınızı yönetin ve beslenme planlarını oluşturun.",
    welcome: "Hoş geldin",
    clientsTitle: "Danışanlarım",
    clientsSub: "Size atanmış danışanların listesi",
    noClients: "Henüz size atanmış bir danışan bulunmuyor.",
    preparePlan: "Plan Hazırla",
    viewProfile: "Profil",
    logout: "Çıkış Yap",
    totalClients: "Toplam Danışan",
    activePlans: "Aktif Planlar",
    age: "Yaş",
    gender: "Cinsiyet",
    male: "Erkek",
    female: "Kadın",
  },
  en: {
    title: "Dietitian Panel",
    subtitle: "Manage your assigned clients and create nutrition plans.",
    welcome: "Welcome",
    clientsTitle: "My Clients",
    clientsSub: "List of clients assigned to you",
    noClients: "No clients assigned to you yet.",
    preparePlan: "Create Plan",
    viewProfile: "Profile",
    logout: "Log Out",
    totalClients: "Total Clients",
    activePlans: "Active Plans",
    age: "Age",
    gender: "Gender",
    male: "Male",
    female: "Female",
  },
};

export default function DietitianDashboard() {
  const navigate = useNavigate();
  const { lang, isDark } = useAppSettings();
  const { unreadMessageCount } = useSocket();
  const t = COPY[lang];

  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [user, setUser] = useState<any>(null);

  const [selectedClient, setSelectedClient] = useState<ClientItem | null>(null);
  const [clientPlans, setClientPlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);

  const openClientPlans = async (client: ClientItem) => {
    setSelectedClient(client);
    setLoadingPlans(true);
    setClientPlans([]);

    const token = localStorage.getItem("access_token");
    try {
      const res = await fetch(`${API_BASE}/api/diet-plans/client?clientId=${client.user_id}`, {
        headers: { Authorization: `Bearer ${token}` }
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

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const storedUser = localStorage.getItem("sd_user");
    
    if (!token) {
      navigate("/login");
      return;
    }

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    fetch(`${API_BASE}/api/auth/dietitian/clients`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch clients");
        return res.json();
      })
      .then((data) => {
        setClients(data.data || []);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const logout = () => {
    clearAuthSession();
    navigate("/login");
  };

  const calculateAge = (birthDate: string | null) => {
    if (!birthDate) return "-";
    const birth = new Date(birthDate);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return <DashboardLoadingScreen isDark={isDark} message={t.clientsSub} />;
  }

  return (
    <DashboardShell
      isDark={isDark}
      badge="Diyetisyen"
      title={`${t.welcome}, ${user?.first_name || ""}`}
      subtitle={t.subtitle}
      actions={
        <>
          <DashboardMessagesLink isDark={isDark} unreadCount={unreadMessageCount} label={lang === "tr" ? "Mesajlar" : "Messages"} />
          <Link to="/profile" className={dashboardButtonClass(isDark)}>
            {t.viewProfile}
          </Link>
          <button onClick={logout} className={dashboardButtonClass(isDark, "danger")}>
            {t.logout}
          </button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <DashboardStatCard
          isDark={isDark}
          title={t.totalClients}
          value={String(clients.length)}
          accent="from-emerald-500/20 to-teal-500/10"
        />
        <DashboardStatCard
          isDark={isDark}
          title={t.activePlans}
          value="0"
          accent="from-sky-500/20 to-indigo-500/10"
        />
      </div>

      <DashboardPanel isDark={isDark} className="mt-3">
        <DashboardSectionHeader
          isDark={isDark}
          title={t.clientsTitle}
          subtitle={t.clientsSub}
        />

        {clients.length === 0 ? (
          <div className={isDark ? "rounded-2xl border border-dashed border-white/10 bg-black/20 p-8 text-center" : "rounded-lg border border-dashed border-[#dfd0b9] bg-[#fffaf0] p-8 text-center"}>
            <p className={mutedTextClass(isDark)}>{t.noClients}</p>
          </div>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {clients.map((client) => (
              <div
                key={client.user_id}
                className={[
                  "group border px-3 py-3 transition hover:-translate-y-0.5",
                  isDark
                    ? "rounded-xl border-white/10 bg-black/20 hover:border-emerald-400/25 hover:bg-white/[0.07]"
                    : "rounded-md border-[#e4d5bf] bg-[#fdf8ee] hover:border-[#cbb48d] hover:bg-white",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-3">
                  <button type="button" className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => openClientPlans(client)}>
                    <div className={["h-10 w-10 shrink-0 overflow-hidden rounded-xl", isDark ? "bg-emerald-500/15 text-emerald-200" : "bg-[#edf6ec] text-[#285743]"].join(" ")}>
                      {client.avatar_url ? (
                        <img src={client.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm font-black uppercase">
                          {client.first_name[0]}{client.last_name[0]}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-black leading-tight">
                        {client.first_name} {client.last_name}
                      </h3>
                      <div className={["mt-1 truncate text-xs", isDark ? "text-zinc-400" : "text-[#7b6d58]"].join(" ")}>
                        {calculateAge(client.birth_date)} {t.age} • {client.gender === "male" ? t.male : t.female}
                      </div>
                    </div>
                  </button>
                  <span className={["shrink-0 rounded-full border px-2 py-1 text-[10px] font-black uppercase", isDark ? "border-emerald-300/25 bg-emerald-500/12 text-emerald-100" : "border-[#c7dbc7] bg-[#edf6ec] text-[#285743]"].join(" ")}>
                    {lang === "tr" ? "Aktif" : "Active"}
                  </span>
                </div>

                <div className={["mt-3 flex items-center justify-end border-t pt-2", isDark ? "border-white/10" : "border-[#eadcc8]"].join(" ")}>
                  <button
                    onClick={() => navigate(`/meal-planner?clientId=${client.user_id}`)}
                    className={["rounded-lg px-3 py-1.5 text-xs font-black transition", isDark ? "bg-emerald-400 text-zinc-950 hover:brightness-110" : "bg-[#8a6a3f] text-white hover:bg-[#765932]"].join(" ")}
                  >
                    {t.preparePlan}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DashboardPanel>

      {selectedClient && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
          <div className={["w-full max-w-2xl overflow-hidden border shadow-2xl transition-all", isDark ? "rounded-2xl border-white/10 bg-[#080b0a]/95" : "rounded-lg border-[#dfd0b9] bg-[#fffaf0]"].join(" ")}>
            
            <div className={["flex items-center justify-between border-b px-5 py-4", isDark ? "border-white/10" : "border-[#dfd0b9]"].join(" ")}>
              <div className="flex min-w-0 items-center gap-3">
                <div className={["flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base font-black", isDark ? "bg-emerald-500/15 text-emerald-200" : "bg-[#edf6ec] text-[#285743]"].join(" ")}>
                  {selectedClient.first_name[0]}{selectedClient.last_name[0]}
                </div>
                <div className="min-w-0">
                  <h3 className={["truncate text-base font-black", isDark ? "text-white" : "text-[#342b1d]"].join(" ")}>
                    {selectedClient.first_name} {selectedClient.last_name}
                  </h3>
                  <p className={["text-xs", isDark ? "text-zinc-400" : "text-[#7b6d58]"].join(" ")}>
                    {lang === 'tr' ? 'Danışanın Diyet Planları' : 'Client Diet Plans'}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedClient(null)} className={["rounded-lg p-2 transition", isDark ? "text-zinc-400 hover:bg-white/10 hover:text-white" : "text-[#806f57] hover:bg-[#f1e4cf] hover:text-[#342b1d]"].join(" ")}>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-5">
              {loadingPlans ? (
                <div className="flex justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
                </div>
              ) : clientPlans.length === 0 ? (
                <div className="py-10 text-center">
                  <div className={["mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl", isDark ? "bg-emerald-500/10 text-emerald-300" : "bg-[#f1e4cf] text-[#745737]"].join(" ")}>
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-sm font-black">
                    {lang === 'tr' ? 'Henüz plan bulunmuyor' : 'No plans found'}
                  </p>
                  <p className={["mt-1 text-xs", isDark ? "text-zinc-500" : "text-[#8a7a61]"].join(" ")}>
                    {lang === 'tr' ? 'Bu danışana henüz bir diyet planı atanmamış.' : 'No diet plan has been assigned to this client yet.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {clientPlans.map((plan) => (
                    <div key={plan.id} className={["flex flex-col gap-3 border p-3 transition sm:flex-row sm:items-center sm:justify-between", isDark ? "rounded-xl border-white/10 bg-black/20 hover:border-emerald-400/25" : "rounded-md border-[#e4d5bf] bg-[#fdf8ee] hover:border-[#cbb48d]"].join(" ")}>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className={["truncate text-sm font-black", isDark ? "text-white" : "text-[#342b1d]"].join(" ")}>{plan.title}</h4>
                          {plan.is_active && (
                            <span className={["rounded-full border px-2 py-0.5 text-[10px] font-black uppercase", isDark ? "border-emerald-300/25 bg-emerald-500/12 text-emerald-100" : "border-[#c7dbc7] bg-[#edf6ec] text-[#285743]"].join(" ")}>Aktif</span>
                          )}
                        </div>
                        <p className={["mt-1 text-[11px] font-black uppercase", isDark ? "text-zinc-500" : "text-[#7b6d58]"].join(" ")}>
                          {plan.plan_type === 'daily' ? 'Günlük' : plan.plan_type === 'weekly' ? 'Haftalık' : 'Aylık'} Plan
                        </p>
                        <p className={["mt-1 text-[11px]", isDark ? "text-zinc-600" : "text-[#8a7a61]"].join(" ")}>
                          Oluşturulma: {new Date(plan.created_at).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                      
                      <button 
                        onClick={() => navigate(`/plan/${plan.id}`)}
                        className={["flex h-9 shrink-0 items-center justify-center px-4 text-xs font-black transition", isDark ? "rounded-xl bg-emerald-400 text-zinc-950 hover:brightness-110" : "rounded-md bg-[#8a6a3f] text-white hover:bg-[#765932]"].join(" ")}
                      >
                        {lang === 'tr' ? 'Planı İncele' : 'View Plan'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className={["border-t px-5 py-4", isDark ? "border-white/10 bg-black/20" : "border-[#dfd0b9] bg-[#fdf8ee]"].join(" ")}>
              <button 
                onClick={() => navigate(`/meal-planner?clientId=${selectedClient.user_id}`)}
                className={["w-full py-2.5 text-sm font-black transition active:scale-[0.99]", isDark ? "rounded-xl bg-emerald-400 text-zinc-950 hover:brightness-110" : "rounded-md bg-[#8a6a3f] text-white hover:bg-[#765932]"].join(" ")}
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
