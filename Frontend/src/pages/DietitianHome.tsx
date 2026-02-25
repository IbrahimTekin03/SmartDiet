import { Link, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";

type Theme = "dark" | "light";
type Lang = "tr" | "en";

type Profile = {
  first_name?: string;
  last_name?: string;
  display_name?: string;
  full_name?: string;
  email?: string;
  clinic_name?: string | null;
};

const COPY = {
  tr: {
    title: "Diyetisyen Ana Sayfası",
    subtitle: "Danışanlarını ve klinik akışını buradan yönetebilirsin.",
    welcome: "Hoş geldin",
    clinic: "Klinik",
    p1: "Danışan Yönetimi",
    p1d: "Danışan listesini görüntüle ve durum takibini yap.",
    p2: "Planlama",
    p2d: "Beslenme planı oluştur, düzenle ve güncelle.",
    p3: "Mesajlaşma",
    p3d: "Danışanlarınla güvenli şekilde mesajlaş.",
    profile: "Profil",
    admin: "Yönetim Paneli",
    logout: "Çıkış Yap",
    fallbackUser: "Kullanıcı",
  },
  en: {
    title: "Dietitian Home",
    subtitle: "Manage your clients and clinic workflow from here.",
    welcome: "Welcome",
    clinic: "Clinic",
    p1: "Client Management",
    p1d: "View your client list and track their status.",
    p2: "Planning",
    p2d: "Create, edit and update nutrition plans.",
    p3: "Messaging",
    p3d: "Communicate with clients securely.",
    profile: "Profile",
    admin: "Admin Panel",
    logout: "Log Out",
    fallbackUser: "User",
  },
} as const;

export default function DietitianHome({ profile, isAdmin }: { profile: Profile; isAdmin?: boolean }) {
  const navigate = useNavigate();
  const [theme] = useState<Theme>(() => (localStorage.getItem("sd_theme") === "dark" ? "dark" : "light"));
  const [lang] = useState<Lang>(() => (localStorage.getItem("sd_lang") === "en" ? "en" : "tr"));
  const isDark = theme === "dark";
  const t = COPY[lang];

  const displayName = useMemo(() => {
    const full = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim();
    return full || profile.full_name || profile.display_name || profile.email || t.fallbackUser;
  }, [profile, t.fallbackUser]);

  const onLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("sd_user");
    navigate("/login");
  };

  return (
    <div className={["min-h-screen w-screen", isDark ? "bg-[#07090b] text-white" : "bg-[#e8f0eb] text-[#0f2f29]"].join(" ")}>
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold">{t.title}</h1>
            <p className={["mt-1 text-sm", isDark ? "text-zinc-300" : "text-[#36544c]"].join(" ")}>
              {t.welcome} {displayName}
            </p>
            <p className={["mt-1 text-sm", isDark ? "text-zinc-400" : "text-[#4d6b62]"].join(" ")}>
              {t.clinic}: {profile.clinic_name || "-"}
            </p>
            <p className={["mt-2 text-sm", isDark ? "text-zinc-400" : "text-[#4d6b62]"].join(" ")}>{t.subtitle}</p>
          </div>

          <div className="flex gap-2">
            {isAdmin ? (
              <Link
                to="/admin-panel"
                className={["rounded-full px-4 py-2 text-xs font-bold", isDark ? "border border-white/10 bg-white/5" : "border border-[#2f6154]/25 bg-white"].join(" ")}
              >
                {t.admin}
              </Link>
            ) : null}
            <Link
              to="/profile"
              className={["rounded-full px-4 py-2 text-xs font-bold", isDark ? "border border-white/10 bg-white/5" : "border border-[#2f6154]/25 bg-white"].join(" ")}
            >
              {t.profile}
            </Link>
            <button
              onClick={onLogout}
              className={["rounded-full px-4 py-2 text-xs font-bold", isDark ? "bg-rose-500/20 text-rose-100" : "bg-rose-100 text-rose-700"].join(" ")}
            >
              {t.logout}
            </button>
          </div>
        </header>

        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <FeatureCard isDark={isDark} title={t.p1} desc={t.p1d} />
          <FeatureCard isDark={isDark} title={t.p2} desc={t.p2d} />
          <FeatureCard isDark={isDark} title={t.p3} desc={t.p3d} />
        </section>
      </main>
    </div>
  );
}

function FeatureCard({ isDark, title, desc }: { isDark: boolean; title: string; desc: string }) {
  return (
    <div className={["rounded-2xl border p-4", isDark ? "border-white/10 bg-white/5" : "border-[#2f6154]/20 bg-white"].join(" ")}>
      <div className="text-sm font-extrabold">{title}</div>
      <div className={["mt-1 text-sm", isDark ? "text-zinc-300" : "text-[#4d6b62]"].join(" ")}>{desc}</div>
    </div>
  );
}
