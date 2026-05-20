import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  DashboardLoadingScreen,
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

const API_BASE = "https://smart-diet06.vercel.app";

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
          <Link to="/messages" className={[dashboardButtonClass(isDark), "relative flex items-center gap-1.5"].join(" ")}>
            {lang === "tr" ? "Mesajlar" : "Messages"}
            {unreadMessageCount > 0 && (
              <span className="flex h-5 min-w-5 px-1.5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-lg shadow-rose-500/20">
                {unreadMessageCount}
              </span>
            )}
          </Link>
          <Link to="/profile" className={dashboardButtonClass(isDark)}>
            {t.viewProfile}
          </Link>
          <button onClick={logout} className={dashboardButtonClass(isDark, "danger")}>
            {t.logout}
          </button>
        </>
      }
    >
      <div className="grid gap-6 sm:grid-cols-2">
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

      <DashboardPanel isDark={isDark} className="mt-8">
        <DashboardSectionHeader
          isDark={isDark}
          title={t.clientsTitle}
          subtitle={t.clientsSub}
        />

        {clients.length === 0 ? (
          <div className="py-12 text-center">
            <p className={mutedTextClass(isDark)}>{t.noClients}</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {clients.map((client) => (
              <div
                key={client.user_id}
                className={[
                  "group relative overflow-hidden rounded-[24px] border p-5 transition-all duration-300",
                  isDark
                    ? "border-white/10 bg-white/5 hover:border-emerald-500/40 hover:bg-emerald-500/5"
                    : "border-emerald-900/10 bg-white hover:border-emerald-500/30 hover:shadow-xl",
                ].join(" ")}
              >
                <div className="flex items-center gap-4 cursor-pointer group/avatar" onClick={() => openClientPlans(client)}>
                  <div className="h-12 w-12 overflow-hidden rounded-full ring-2 ring-emerald-500/20 group-hover/avatar:ring-emerald-500/50 transition">
                    {client.avatar_url ? (
                      <img src={client.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-emerald-500/10 text-emerald-500 font-bold uppercase">
                        {client.first_name[0]}{client.last_name[0]}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-lg leading-tight">
                      {client.first_name} {client.last_name}
                    </h3>
                    <div className={mutedTextClass(isDark)}>
                      {calculateAge(client.birth_date)} {t.age} • {client.gender === "male" ? t.male : t.female}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex gap-2">
                  <button
                    onClick={() => navigate(`/meal-planner?clientId=${client.user_id}`)}
                    className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-2.5 text-xs font-bold text-white transition hover:brightness-110 active:scale-95"
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className={["w-full max-w-2xl overflow-hidden rounded-[32px] border shadow-2xl transition-all", isDark ? "border-white/10 bg-[#0d1114]" : "border-emerald-900/10 bg-[#f7fbf9]"].join(" ")}>
            
            <div className={["flex items-center justify-between border-b px-6 py-5", isDark ? "border-white/10" : "border-emerald-900/10"].join(" ")}>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-lg font-bold text-white shadow-lg">
                  {selectedClient.first_name[0]}{selectedClient.last_name[0]}
                </div>
                <div>
                  <h3 className={["text-xl font-extrabold", isDark ? "text-white" : "text-emerald-950"].join(" ")}>
                    {selectedClient.first_name} {selectedClient.last_name}
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
