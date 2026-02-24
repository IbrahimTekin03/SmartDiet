import { Link, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import SettingsDrawer from "../components/SettingsDrawer";

type Theme = "dark" | "light";
type Lang = "tr" | "en";

type Profile = {
  first_name?: string;
  last_name?: string;
  display_name?: string;
  full_name?: string;
  email?: string;
};

const COPY = {
  tr: {
    title: "Kullanici Ana Sayfasi",
    subtitle: "SmartDiet ile beslenme planini, olcumlerini ve ilerlemeni tek yerden takip et.",
    f1: "Gunun Plani",
    f1d: "Gunluk ogun plani ve saatlerini gor.",
    f2: "Olcum Takibi",
    f2d: "Kilo ve olcum gecmisini takip et.",
    f3: "Mesajlasma",
    f3d: "Diyetisyeninle guvenli sekilde iletisim kur.",
    profile: "Profil",
    logout: "Cikis Yap",
    welcome: "Hos geldin",
  },
  en: {
    title: "Client Home",
    subtitle: "Track your nutrition plan, measurements and progress in one place.",
    f1: "Daily Plan",
    f1d: "View your meals and schedule.",
    f2: "Measurement Tracking",
    f2d: "Track your weight and history.",
    f3: "Messaging",
    f3d: "Communicate securely with your dietitian.",
    profile: "Profile",
    logout: "Log Out",
    welcome: "Welcome",
  },
} as const;

export default function ClientHome({ profile }: { profile: Profile }) {
  const navigate = useNavigate();
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem("sd_theme") === "dark" ? "dark" : "light"));
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem("sd_lang") === "en" ? "en" : "tr"));
  const isDark = theme === "dark";
  const t = COPY[lang];

  const displayName = useMemo(() => {
    const n = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim();
    return n || profile.full_name || profile.display_name || profile.email || (lang === "tr" ? "Kullanici" : "User");
  }, [lang, profile]);

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
            <p className={["mt-1 text-sm", isDark ? "text-zinc-300" : "text-[#36544c]"].join(" ")}>{t.welcome} {displayName}</p>
            <p className={["mt-2 text-sm", isDark ? "text-zinc-400" : "text-[#4d6b62]"].join(" ")}>{t.subtitle}</p>
          </div>
          <div className="flex gap-2">
            <Link to="/profile" className={["rounded-full px-4 py-2 text-xs font-bold", isDark ? "border border-white/10 bg-white/5" : "border border-[#2f6154]/25 bg-white"].join(" ")}>
              {t.profile}
            </Link>
            <button onClick={onLogout} className={["rounded-full px-4 py-2 text-xs font-bold", isDark ? "bg-rose-500/20 text-rose-100" : "bg-rose-100 text-rose-700"].join(" ")}>
              {t.logout}
            </button>
          </div>
        </header>

        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <FeatureCard isDark={isDark} title={t.f1} desc={t.f1d} />
          <FeatureCard isDark={isDark} title={t.f2} desc={t.f2d} />
          <FeatureCard isDark={isDark} title={t.f3} desc={t.f3d} />
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

function FeatureCard({ isDark, title, desc }: { isDark: boolean; title: string; desc: string }) {
  return (
    <div className={["rounded-2xl border p-4", isDark ? "border-white/10 bg-white/5" : "border-[#2f6154]/20 bg-white"].join(" ")}>
      <div className="text-sm font-extrabold">{title}</div>
      <div className={["mt-1 text-sm", isDark ? "text-zinc-300" : "text-[#4d6b62]"].join(" ")}>{desc}</div>
    </div>
  );
}
