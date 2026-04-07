import { useEffect, useMemo, useState } from "react";
import { DashboardLoadingScreen } from "../components/DashboardShell";
import { useAppSettings } from "../context/AppSettingsContext";
import { clearAuthSession, parseStoredUser, setAuthSession, useAuthSession } from "../lib/authSession";
import AdminPanel from "./AdminPanel";
import ClinicManagerPanel from "./ClinicManagerPanel";
import ClientHome from "./ClientHome";
import DietitianHome from "./DietitianHome";
import DietitianVerification from "./DietitianVerification";
import Home from "./Home";

type Profile = {
  id?: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  full_name?: string;
  email?: string;
  phone_number?: string;
  roles?: Array<{ name?: string }>;
  account_type?: "client" | "Diyetisyen";
  dietitian_verification_status?: "not_submitted" | "pending" | "approved" | "rejected";
  clinic_name?: string | null;
};

const API_BASE = "http://localhost:3000";

export default function AppEntry() {
  const { accessToken, userJson } = useAuthSession();
  const cachedProfile = useMemo(() => parseStoredUser<Profile>(userJson), [userJson]);
  const [loading, setLoading] = useState(Boolean(accessToken));
  const { lang } = useAppSettings();
  const [profile, setProfile] = useState<Profile | null>(cachedProfile);

  useEffect(() => {
    setProfile(cachedProfile);
  }, [cachedProfile]);

  useEffect(() => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch(`${API_BASE}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${accessToken}` },
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
        if (cancelled) return;
        setProfile(p);
        setAuthSession({ user: p });
      })
      .catch((err: Error & { status?: number }) => {
        if (cancelled) return;
        if (err?.status === 401 || err?.status === 403) {
          clearAuthSession();
          setProfile(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const roleNames = useMemo(
    () => (profile?.roles || []).map((r) => String(r?.name || "").toLowerCase()).filter(Boolean),
    [profile],
  );

  if (!accessToken) return <Home />;
  if (loading) {
    return <DashboardLoadingScreen isDark={true} message={lang === "tr" ? "Hesabin hazirlaniyor" : "Preparing your workspace"} />;
  }

  if (!profile) return <Home />;

  const isAdmin = roleNames.includes("admin");
  const isClinicManager = roleNames.includes("clinic_manager");
  const isDietitian = roleNames.includes("diyetisyen") || profile.account_type === "Diyetisyen";
  const isClient = roleNames.includes("client") || roleNames.includes("user") || !isDietitian;

  if (isAdmin) return <AdminPanel />;
  if (isClinicManager) return <ClinicManagerPanel />;
  if (isDietitian) {
    if (profile.dietitian_verification_status === "approved") {
      return <DietitianHome profile={profile} isAdmin={isAdmin} />;
    }
    return <DietitianVerification />;
  }
  if (isClient) return <ClientHome profile={profile} />;

  return <Home />;
}
