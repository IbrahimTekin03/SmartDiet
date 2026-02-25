import { useEffect, useMemo, useState } from "react";
import Home from "./Home";
import AdminPanel from "./AdminPanel";
import ClientHome from "./ClientHome";
import DietitianHome from "./DietitianHome";
import DietitianVerification from "./DietitianVerification";
import { useAppSettings } from "../context/AppSettingsContext";

type Profile = {
  id?: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  full_name?: string;
  email?: string;
  phone_number?: string;
  roles?: Array<{ name?: string }>;
  account_type?: "client" | "dietitian";
  dietitian_verification_status?: "not_submitted" | "pending" | "approved" | "rejected";
  clinic_name?: string | null;
};

const API_BASE = "http://localhost:3000";

export default function AppEntry() {
  const [loading, setLoading] = useState(Boolean(localStorage.getItem("access_token")));
  const { lang } = useAppSettings();
  const [profile, setProfile] = useState<Profile | null>(() => {
    try {
      const raw = localStorage.getItem("sd_user");
      return raw ? (JSON.parse(raw) as Profile) : null;
    } catch {
      return null;
    }
  });
  const token = localStorage.getItem("access_token");

  useEffect(() => {
    if (!token) {
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
      .then((p: Profile) => {
        setProfile(p);
        localStorage.setItem("sd_user", JSON.stringify(p));
      })
      .catch((err: Error & { status?: number }) => {
        if (err?.status === 401 || err?.status === 403) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          localStorage.removeItem("sd_user");
          setProfile(null);
        }
      })
      .finally(() => setLoading(false));
  }, [token]);

  const roleNames = useMemo(
    () => (profile?.roles || []).map((r) => String(r?.name || "").toLowerCase()).filter(Boolean),
    [profile],
  );

  if (!token) return <Home />;
  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#07090b] text-sm text-zinc-300">
        {lang === "tr" ? "Yükleniyor..." : "Loading..."}
      </div>
    );
  }

  if (!profile) return <Home />;

  const isAdmin = roleNames.includes("admin");
  const isDietitian = roleNames.includes("dietitian") || profile.account_type === "dietitian";
  const isClient = roleNames.includes("client") || roleNames.includes("user") || !isDietitian;

  if (isAdmin) return <AdminPanel />;
  if (isDietitian) {
    if (profile.dietitian_verification_status === "approved") {
      return <DietitianHome profile={profile} isAdmin={isAdmin} />;
    }
    return <DietitianVerification />;
  }
  if (isClient) return <ClientHome profile={profile} />;

  return <Home />;
}
