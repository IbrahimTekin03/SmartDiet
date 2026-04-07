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
  const t = COPY[lang];

  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [user, setUser] = useState<any>(null);

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
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 overflow-hidden rounded-full ring-2 ring-emerald-500/20">
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
    </DashboardShell>
  );
}
