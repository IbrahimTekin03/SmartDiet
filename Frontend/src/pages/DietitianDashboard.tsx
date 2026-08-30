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
import { API_BASE_URL as API_BASE } from "../lib/api";
import { 
  Users, 
  FileText, 
  Plus, 
  User, 
  ExternalLink, 
  X
} from "lucide-react";


type ClientItem = {
  user_id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  gender: string | null;
  birth_date: string | null;
};

const COPY = {
  tr: {
    title: "Diyetisyen Paneli",
    subtitle: "Atanmış danışanlarınızı yönetin ve beslenme planlarını oluşturun.",
    welcome: "Hoş Geldiniz,",
    clientsTitle: "Danışan Portföyüm",
    clientsSub: "Klinik takibiniz altındaki aktif danışanlar",
    noClients: "Henüz size atanmış bir danışan bulunmuyor.",
    preparePlan: "Plan Hazırla",
    viewProfile: "Profil",
    logout: "Çıkış Yap",
    totalClients: "Kayıtlı Danışanlar",
    activePlans: "Aktif Diyet Programları",
    age: "Yaş",
    gender: "Cinsiyet",
    male: "Erkek",
    female: "Kadın",
  },
  en: {
    title: "Dietitian Dashboard",
    subtitle: "Manage your assigned clients and create nutrition plans.",
    welcome: "Welcome,",
    clientsTitle: "My Client Roster",
    clientsSub: "Active clients under your clinical supervision",
    noClients: "No clients assigned to you yet.",
    preparePlan: "Create Plan",
    viewProfile: "Profile",
    logout: "Log Out",
    totalClients: "Total Clients",
    activePlans: "Active Diet Programs",
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
  const t = COPY[lang] || COPY.tr;

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
        headers: { Authorization: `Bearer ${token}` },
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
      title={`${t.welcome} ${user?.first_name || ""}`}
      subtitle={t.subtitle}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <DashboardStatCard
          isDark={isDark}
          title={t.totalClients}
          value={String(clients.length)}
          accent="from-emerald-500/20 to-teal-500/10"
        />
        <DashboardStatCard
          isDark={isDark}
          title={t.activePlans}
          value={String(clients.length ? clients.length * 2 : 0)}
          accent="from-cyan-500/20 to-blue-500/10"
        />
      </div>

      <DashboardPanel isDark={isDark} className="mt-4">
        <DashboardSectionHeader
          isDark={isDark}
          title={t.clientsTitle}
          subtitle={t.clientsSub}
        />

        {clients.length === 0 ? (
          <div className={`p-10 text-center rounded-2xl border ${
            isDark ? "border-dashed border-white/10 text-slate-400" : "border-dashed border-slate-200 text-slate-500"
          }`}>
            <Users className="mx-auto h-8 w-8 text-emerald-400/60 mb-2" />
            <p className="font-display font-black text-sm">{t.noClients}</p>
          </div>
        ) : (
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {clients.map((client) => (
              <div
                key={client.user_id}
                className={`group relative p-5 rounded-2xl border transition-all hover:-translate-y-1 ${
                  isDark ? "border-white/10 bg-slate-900/60 hover:bg-slate-900/90 shadow-lg" : "border-slate-200 bg-white hover:shadow-xl"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 font-display font-black text-base">
                    {client.first_name?.[0] || "D"}{client.last_name?.[0] || ""}
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-black group-hover:text-emerald-400 transition">
                      {client.first_name} {client.last_name}
                    </h3>
                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 font-mono">
                      <span>{t.age}: {calculateAge(client.birth_date)}</span>
                      <span>•</span>
                      <span>{client.gender === "female" ? t.female : t.male}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex gap-2">
                  <button
                    type="button"
                    onClick={() => openClientPlans(client)}
                    className="flex-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition flex items-center justify-center gap-1.5"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>Planlar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/meal-planner?clientId=${client.user_id}`)}
                    className="flex-1 rounded-xl bg-emerald-500 py-2 text-xs font-black text-slate-950 hover:bg-emerald-400 transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>{t.preparePlan}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DashboardPanel>

      {/* Plan Details Modal */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className={`relative w-full max-w-lg overflow-hidden rounded-[32px] border shadow-2xl ${
            isDark ? "border-white/10 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-900"
          }`}>
            <div className="flex items-center justify-between border-b border-white/5 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 font-black">
                  {selectedClient.first_name?.[0] || "D"}
                </div>
                <div>
                  <h3 className="font-display text-sm font-black">
                    {selectedClient.first_name} {selectedClient.last_name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {lang === 'tr' ? 'Danışanın Diyet Planları' : 'Client Diet Plans'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedClient(null)}
                className="rounded-xl border border-white/10 p-2 text-slate-400 hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-6 space-y-3">
              {loadingPlans ? (
                <div className="flex justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
                </div>
              ) : clientPlans.length === 0 ? (
                <div className="py-10 text-center">
                  <FileText className="mx-auto h-8 w-8 text-slate-500 mb-2" />
                  <p className="font-display text-sm font-black">
                    {lang === 'tr' ? 'Henüz plan bulunmuyor' : 'No plans found'}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {lang === 'tr' ? 'Bu danışana henüz bir diyet planı atanmamış.' : 'No diet plan has been assigned to this client yet.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {clientPlans.map((plan) => (
                    <div
                      key={plan.id}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border ${
                        isDark ? "border-white/10 bg-black/20" : "border-slate-100 bg-slate-50"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-display text-sm font-black truncate">{plan.title}</h4>
                          {plan.is_active && (
                            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-bold text-emerald-400 uppercase">
                              Aktif
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-[10px] font-bold uppercase text-slate-400">
                          {plan.plan_type === 'daily' ? 'Günlük' : plan.plan_type === 'weekly' ? 'Haftalık' : 'Aylık'} Plan
                        </p>
                        <p className="mt-0.5 text-[10px] text-slate-500 font-mono">
                          {new Date(plan.created_at).toLocaleDateString('tr-TR')}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => navigate(`/plan/${plan.id}`)}
                        className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-black text-slate-950 hover:bg-emerald-400 transition flex items-center justify-center gap-1 shrink-0"
                      >
                        <span>{lang === 'tr' ? 'Planı İncele' : 'View Plan'}</span>
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-white/5 p-6">
              <button
                type="button"
                onClick={() => navigate(`/meal-planner?clientId=${selectedClient.user_id}`)}
                className="w-full py-3 text-xs font-black rounded-2xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" />
                <span>{lang === 'tr' ? 'Yeni Plan Hazırla' : 'Create New Plan'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

