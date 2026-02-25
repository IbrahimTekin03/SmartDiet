import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppSettings } from "../context/AppSettingsContext";

type Lang = "tr" | "en";

type SessionUser = {
  id?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  display_name?: string;
  email?: string;
  phone_number?: string;
  avatar_url?: string | null;
  birth_date?: string | null;
  gender?: "male" | "female" | null;
  roles?: Array<{ name?: string }>;
};

type ProfileForm = {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  birth_date: string;
  gender: "male" | "female";
};

type Measurement = {
  id: string;
  date: string;
  weight?: number | null;
  body_fat?: number | null;
};

const COPY = {
  tr: {
    title: "Profil",
    subtitle: "Hesap yönetimi ve ölçüm analizi",
    back: "Ana Sayfa",
    logout: "Çıkış Yap",
    loadingProfile: "Profil yükleniyor...",
    appearance: "Tema",
    themeDark: "Koyu",
    themeLight: "Açık",
    uploadPhoto: "Profil Fotosu",
    save: "Değişiklikleri Kaydet",
    saving: "Kaydediliyor...",
    saveOk: "Profil güncellendi.",
    saveErr: "Güncelleme başarısız.",
    firstName: "İsim",
    lastName: "Soyisim",
    email: "E-posta",
    phone: "Telefon",
    birthDate: "Doğum Tarihi",
    gender: "Cinsiyet",
    male: "Erkek",
    female: "Kadın",
    accountCard: "Hesap Özeti",
    accountCardSub: "Kimlik ve iletişim bilgilerin tek yerde.",
    metricsCard: "Ölçüm Analizi",
    metricsSub: "Son kayıtlarına göre trend takibi",
    addMeasurement: "Ölçüm Ekle",
    measurementSaved: "Ölçüm kaydedildi.",
    measurementFailed: "Ölçüm kaydedilemedi.",
    noMeasurements: "Bu aralıkta ölçüm bulunmuyor.",
    rangeLabel: "Aralık",
    latestWeight: "Güncel Kilo",
    latestFat: "Güncel Yağ Oranı",
    trend: "Değişim",
    recentRecords: "Son Kayıtlar",
    date: "Tarih",
    weight: "Kilo (kg)",
    bodyFat: "Yağ Oranı (%)",
    quickStats: "Profil Doluluk",
    contact: "İletişim",
    role: "Rol",
    profileDetails: "Profil Bilgileri",
    liveProfile: "Canlı Profil",
    notProvided: "Belirtilmedi",
    roleAdmin: "Yönetici",
    roleDietitian: "Diyetisyen",
    roleClient: "Danışan",
    roleUser: "Kullanıcı",
    requestFailed: "İşlem sırasında hata oluştu.",
    unauthorized: "Oturum süresi doldu. Lütfen tekrar giriş yap.",
    avatarUpdated: "Profil fotoğrafı güncellendi.",
    avatarResponseInvalid: "Profil verisi alınamadı.",
    avatarUploadFailed: "Profil fotoğrafı yüklenemedi.",
  },
  en: {
    title: "Profile",
    subtitle: "Account management and measurement analytics",
    back: "Home",
    logout: "Log Out",
    loadingProfile: "Loading profile...",
    appearance: "Theme",
    themeDark: "Dark",
    themeLight: "Light",
    uploadPhoto: "Profile Photo",
    save: "Save Changes",
    saving: "Saving...",
    saveOk: "Profile updated.",
    saveErr: "Update failed.",
    firstName: "First Name",
    lastName: "Last Name",
    email: "Email",
    phone: "Phone",
    birthDate: "Birth Date",
    gender: "Gender",
    male: "Male",
    female: "Female",
    accountCard: "Account Summary",
    accountCardSub: "Identity and contact details in one place.",
    metricsCard: "Measurement Analytics",
    metricsSub: "Track trend by your latest records",
    addMeasurement: "Add Measurement",
    measurementSaved: "Measurement saved.",
    measurementFailed: "Failed to save measurement.",
    noMeasurements: "No measurements in this range.",
    rangeLabel: "Range",
    latestWeight: "Latest Weight",
    latestFat: "Latest Body Fat",
    trend: "Change",
    recentRecords: "Recent Records",
    date: "Date",
    weight: "Weight (kg)",
    bodyFat: "Body Fat (%)",
    quickStats: "Profile Completion",
    contact: "Contact",
    role: "Role",
    profileDetails: "Profile Details",
    liveProfile: "Live Profile",
    notProvided: "Not provided",
    roleAdmin: "Admin",
    roleDietitian: "Dietitian",
    roleClient: "Client",
    roleUser: "User",
    requestFailed: "Request failed.",
    unauthorized: "Session expired. Please sign in again.",
    avatarUpdated: "Profile photo updated.",
    avatarResponseInvalid: "Could not read profile response.",
    avatarUploadFailed: "Profile photo upload failed.",
  },
} as const;

function mapRoleName(roleName: string, lang: Lang, t: (typeof COPY)[Lang]): string {
  const normalized = String(roleName || "").trim().toLowerCase();
  if (!normalized) return t.roleUser;
  if (normalized === "admin") return t.roleAdmin;
  if (normalized === "dietitian") return t.roleDietitian;
  if (normalized === "client") return t.roleClient;
  if (normalized === "user") return t.roleUser;
  return lang === "tr" ? normalized : roleName;
}

function mapProfileError(message: string, lang: Lang, t: (typeof COPY)[Lang], fallback: string): string {
  const normalized = String(message || "").toLowerCase();
  if (!normalized) return fallback;
  if (normalized.includes("unauthorized") || normalized.includes("forbidden")) return t.unauthorized;
  if (normalized.includes("request_failed")) return t.requestFailed;
  if (normalized.includes("avatar upload failed")) return t.avatarUploadFailed;
  if (normalized.includes("profile response invalid")) return t.avatarResponseInvalid;
  if (normalized.includes("failed to fetch")) return fallback;
  return lang === "tr" ? fallback : message;
}

export default function Profile() {
  const API_BASE = "http://localhost:3000";
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const { theme, lang, isDark, setTheme, setLang } = useAppSettings();
  const [user, setUser] = useState<SessionUser | null>(() => {
    try {
      const raw = localStorage.getItem("sd_user");
      return raw ? (JSON.parse(raw) as SessionUser) : null;
    } catch {
      return null;
    }
  });

  const [form, setForm] = useState<ProfileForm>({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    birth_date: "",
    gender: "male",
  });

  const [measurementForm, setMeasurementForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    weight: "",
    body_fat: "",
  });

  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [rangeDays, setRangeDays] = useState<7 | 30 | 90>(30);

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [measurementSaving, setMeasurementSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [saveErr, setSaveErr] = useState("");
  const [measurementMsg, setMeasurementMsg] = useState("");
  const [avatarMsg, setAvatarMsg] = useState("");
  const [avatarErr, setAvatarErr] = useState("");

  const t = COPY[lang];

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/login");
      return;
    }

    setLoadingProfile(true);
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
        return data;
      })
      .then((d) => {
        const profile = d?.data ?? d;
        if (profile?.id) {
          setUser(profile);
          localStorage.setItem("sd_user", JSON.stringify(profile));
          setForm({
            first_name: profile.first_name || "",
            last_name: profile.last_name || "",
            email: profile.email || "",
            phone_number: profile.phone_number || "",
            birth_date: profile.birth_date ? String(profile.birth_date).slice(0, 10) : "",
            gender: profile.gender === "female" ? "female" : "male",
          });
        }
      })
      .catch((err: Error & { status?: number }) => {
        if (err?.status === 401 || err?.status === 403) {
          navigate("/login");
        }
      })
      .finally(() => setLoadingProfile(false));
  }, [navigate]);

  const loadMeasurements = (days: number) => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    fetch(`${API_BASE}/api/measurements/history?days=${days}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        const items = (d?.data?.items ?? d?.items ?? []) as Measurement[];
        setMeasurements(items);
      })
      .catch(() => setMeasurements([]));
  };

  useEffect(() => {
    loadMeasurements(rangeDays);
  }, [rangeDays]);

  const fullName = useMemo(() => {
    if (!user) return "...";
    const fromParts = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
    return fromParts || user.full_name || user.display_name || "...";
  }, [user]);

  const roleText = useMemo(() => {
    const roles = (user?.roles || []).map((r) => String(r?.name || "").trim()).filter(Boolean);
    if (!roles.length) return t.roleUser;
    return roles.map((name) => mapRoleName(name, lang, t)).join(", ");
  }, [lang, t, user]);
  const contactEmail = form.email || t.notProvided;
  const contactPhone = form.phone_number || t.notProvided;

  const initials = useMemo(() => {
    const parts = fullName.split(" ").filter(Boolean);
    return (
      parts
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase() || "")
        .join("") || "SD"
    );
  }, [fullName]);

  const avatarSrc = user?.avatar_url ? `${API_BASE}${user.avatar_url}` : null;

  const weightPoints = useMemo(
    () =>
      measurements
        .filter((m) => typeof m.weight === "number")
        .map((m) => ({ x: m.date, y: Number(m.weight) })),
    [measurements],
  );

  const fatPoints = useMemo(
    () =>
      measurements
        .filter((m) => typeof m.body_fat === "number")
        .map((m) => ({ x: m.date, y: Number(m.body_fat) })),
    [measurements],
  );

  const latestWeight = weightPoints.length ? weightPoints[weightPoints.length - 1].y : null;
  const latestFat = fatPoints.length ? fatPoints[fatPoints.length - 1].y : null;
  const firstWeight = weightPoints.length ? weightPoints[0].y : null;
  const trendWeight = latestWeight != null && firstWeight != null ? latestWeight - firstWeight : null;

  const completion = useMemo(() => {
    const checks = [form.first_name, form.last_name, form.email, form.phone_number, form.birth_date];
    const done = checks.filter((x) => String(x || "").trim().length > 0).length;
    return Math.round((done / checks.length) * 100);
  }, [form]);

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("sd_user");
    navigate("/login");
  };

  const uploadAvatar = async (file?: File | null) => {
    const token = localStorage.getItem("access_token");
    if (!token || !file) return;

    setAvatarMsg("");
    setAvatarErr("");

    const body = new FormData();
    body.append("avatar", file);

    setUploading(true);
    try {
      const endpoints = [`${API_BASE}/api/auth/profile/avatar`, `${API_BASE}/auth/profile/avatar`];
      let lastError = "";

      for (const endpoint of endpoints) {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body,
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          lastError = data?.message || t.avatarUploadFailed;
          if (res.status === 404) continue;
          throw new Error(lastError);
        }

        const profile = data?.data ?? data;
        if (profile?.id) {
          setUser(profile);
          localStorage.setItem("sd_user", JSON.stringify(profile));
          setAvatarMsg(t.avatarUpdated);
          return;
        }
      }

      throw new Error(lastError || t.avatarResponseInvalid);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "";
      setAvatarErr(mapProfileError(message, lang, t, t.avatarUploadFailed));
    } finally {
      setUploading(false);
    }
  };

  const saveProfile = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    setSaving(true);
    setSaveMsg("");
    setSaveErr("");

    try {
      const res = await fetch(`${API_BASE}/api/auth/profile/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || t.saveErr);

      const profile = data?.data ?? data;
      if (profile?.id) {
        setUser(profile);
        localStorage.setItem("sd_user", JSON.stringify(profile));
      }
      setSaveMsg(t.saveOk);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "";
      setSaveErr(mapProfileError(message, lang, t, t.saveErr));
    } finally {
      setSaving(false);
    }
  };

  const addMeasurement = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    setMeasurementSaving(true);
    setMeasurementMsg("");
    try {
      const res = await fetch(`${API_BASE}/api/measurements/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: measurementForm.date,
          weight: measurementForm.weight ? Number(measurementForm.weight) : undefined,
          body_fat: measurementForm.body_fat ? Number(measurementForm.body_fat) : undefined,
        }),
      });

      if (!res.ok) throw new Error();
      setMeasurementMsg(t.measurementSaved);
      loadMeasurements(rangeDays);
    } catch {
      setMeasurementMsg(t.measurementFailed);
    } finally {
      setMeasurementSaving(false);
    }
  };

  return (
    <div className={["relative min-h-screen w-screen overflow-x-hidden", isDark ? "text-zinc-100" : "text-[#0e2a23]"].join(" ")}>
      {/* Renkli premium background */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className={
            isDark
              ? "absolute inset-0 [background:radial-gradient(1200px_760px_at_10%_-10%,rgba(16,185,129,0.30),transparent_60%),radial-gradient(980px_700px_at_100%_0%,rgba(34,197,94,0.20),transparent_58%),radial-gradient(900px_700px_at_40%_120%,rgba(22,163,74,0.10),transparent_62%),linear-gradient(180deg,#050708,#070a0b_45%,#050708)]"
              : "absolute inset-0 [background:radial-gradient(1200px_760px_at_0%_0%,rgba(25,154,118,0.20),transparent_56%),radial-gradient(980px_620px_at_100%_6%,rgba(34,197,94,0.16),transparent_50%),linear-gradient(180deg,#edf7f2,#e7f4ee_55%,#deefe7)]"
          }
        />
        {isDark ? (
          <div className="absolute inset-0 opacity-[0.18] [background:radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.14),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(34,197,94,0.12),transparent_45%)]" />
        ) : null}
      </div>

      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-12 pt-6 sm:px-6">
        {/* Top controls */}
        <header className="mb-5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ToolbarPill isDark={isDark}>
                <button
                  type="button"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className={["rounded-full px-3 py-1 text-xs font-extrabold tracking-tight transition", isDark ? "hover:bg-emerald-900/35" : "hover:bg-white"].join(" ")}
                >
                {t.appearance}: {theme === "dark" ? t.themeDark : t.themeLight}
              </button>
            </ToolbarPill>

            <ToolbarPill isDark={isDark}>
              <button
                type="button"
                onClick={() => setLang("tr")}
                className={[
                  "rounded-full px-3 py-1 text-xs font-extrabold tracking-tight transition",
                  lang === "tr" ? (isDark ? "bg-emerald-400/15 text-emerald-100 ring-1 ring-emerald-400/25" : "bg-[#dbece4]") : "",
                ].join(" ")}
              >
                TR
              </button>
              <button
                type="button"
                onClick={() => setLang("en")}
                className={[
                  "rounded-full px-3 py-1 text-xs font-extrabold tracking-tight transition",
                  lang === "en" ? (isDark ? "bg-emerald-400/15 text-emerald-100 ring-1 ring-emerald-400/25" : "bg-[#dbece4]") : "",
                ].join(" ")}
              >
                EN
              </button>
            </ToolbarPill>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/"
              className={[
                "rounded-full px-4 py-2 text-xs font-extrabold tracking-tight transition",
                isDark
                  ? "border border-emerald-300/30 bg-emerald-950/25 hover:bg-emerald-900/25 shadow-[0_18px_70px_rgba(0,0,0,0.40)]"
                  : "border border-[#2f6154]/25 bg-[#f3f8f5] hover:bg-white",
              ].join(" ")}
            >
              {t.back}
            </Link>
            <button
              onClick={logout}
              className={[
                "rounded-full px-4 py-2 text-xs font-extrabold tracking-tight transition",
                isDark ? "bg-rose-500/15 text-rose-100 hover:bg-rose-500/25" : "bg-rose-100 text-rose-700 hover:bg-rose-200",
              ].join(" ")}
            >
              {t.logout}
            </button>
          </div>
        </header>

        {/* Avatar top center */}
        <section
          className={[
            "mb-6 rounded-[32px] px-4 py-8 backdrop-blur-xl sm:min-h-[420px] sm:px-7 sm:py-10",
            isDark ? "bg-black/22 shadow-[0_26px_110px_rgba(0,0,0,0.40)]" : "bg-white/70 shadow-[0_18px_70px_rgba(15,47,41,0.12)]",
          ].join(" ")}
        >
          <div className="mx-auto flex w-full max-w-2xl flex-col items-center justify-center text-center">
            <div className="relative">
              <div className={["h-40 w-40 overflow-hidden rounded-[38px] sm:h-52 sm:w-52", isDark ? "ring-1 ring-emerald-300/50 shadow-[0_0_26px_rgba(52,211,153,0.24)]" : "ring-1 ring-[#2f6154]/18"].join(" ")}>
                {avatarSrc ? (
                  <img src={avatarSrc} alt="avatar" className="h-full w-full object-cover" />
                ) : (
                  <div
                    className={[
                      "grid h-full w-full place-items-center text-5xl font-black sm:text-6xl",
                      isDark
                        ? "bg-emerald-400/12 text-emerald-50 shadow-[0_22px_90px_rgba(16,185,129,0.20)]"
                        : "bg-[#dff0e8] text-[#145443]",
                    ].join(" ")}
                  >
                    {initials}
                  </div>
                )}
              </div>
              {isDark ? <div className="pointer-events-none absolute -inset-12 rounded-[54px] [background:radial-gradient(circle,rgba(16,185,129,0.24),transparent_60%)]" /> : null}
            </div>

            <div className="mt-6">
              <div className={["text-3xl font-black tracking-tight sm:text-4xl", isDark ? "text-white" : "text-[#0f2f29]"].join(" ")}>
                {loadingProfile ? t.loadingProfile : fullName}
              </div>
              <div className={["mt-2 text-lg font-semibold", isDark ? "text-zinc-300" : "text-[#4e6f65]"].join(" ")}>
                {t.role}: {roleText}
              </div>
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                uploadAvatar(file);
                e.currentTarget.value = "";
              }}
            />

            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className={[
                "mt-6 inline-flex min-w-[220px] items-center justify-center whitespace-nowrap rounded-2xl px-8 py-3.5 text-base font-black transition disabled:opacity-60",
                "bg-gradient-to-r from-emerald-300 via-emerald-400 to-green-300 text-zinc-900 shadow-[0_26px_110px_rgba(16,185,129,0.24)] hover:brightness-110",
              ].join(" ")}
            >
              {uploading ? "..." : t.uploadPhoto}
            </button>

            {avatarErr ? <div className="mt-3 text-sm font-semibold text-rose-300">{avatarErr}</div> : null}
            {avatarMsg ? <div className="mt-3 text-sm font-semibold text-emerald-200">{avatarMsg}</div> : null}
          </div>
        </section>

        {/* Account Summary + Form */}
        <section className="grid gap-6 lg:grid-cols-[1fr_420px]">
          {/* Summary compact */}
          <section className={Panel(isDark, "p-5 sm:p-7")}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className={["text-xl font-black tracking-tight", isDark ? "text-white" : "text-[#0f2f29]"].join(" ")}>
                  {t.accountCard}
                </h2>
                <p className={["mt-1 text-sm", isDark ? "text-zinc-300" : "text-[#4e6f65]"].join(" ")}>
                  {t.accountCardSub}
                </p>
              </div>

              <div className={["shrink-0 rounded-2xl px-4 py-3 text-right", isDark ? "bg-black/35 ring-1 ring-emerald-300/45 shadow-[0_0_16px_rgba(52,211,153,0.16)]" : "bg-white ring-1 ring-[#2f6154]/14"].join(" ")}>
                <div className={["text-xs font-semibold", isDark ? "text-zinc-200" : "text-[#5a776d]"].join(" ")}>
                  {t.quickStats}
                </div>
                <div className={["mt-1 text-2xl font-black", isDark ? "text-emerald-200" : "text-[#0f2f29]"].join(" ")}>
                  {completion}%
                </div>
                <div className={["mt-2 h-1.5 w-28 rounded-full", isDark ? "bg-emerald-950/45" : "bg-[#dbece4]"].join(" ")}>
                  <div className="h-1.5 rounded-full bg-gradient-to-r from-emerald-300 to-green-300" style={{ width: `${completion}%` }} />
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <CompactInfoCard isDark={isDark} label={t.email} value={contactEmail} />
              <CompactInfoCard isDark={isDark} label={t.phone} value={contactPhone} />
              <CompactInfoCard isDark={isDark} label={t.gender} value={form.gender === "female" ? t.female : t.male} />
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className={["text-sm font-semibold", isDark ? "text-zinc-300" : "text-[#4e6f65]"].join(" ")}>
                {t.rangeLabel}: <span className={isDark ? "text-zinc-100" : "text-[#0f2f29]"}>{rangeDays}{lang === "tr" ? " gün" : "d"}</span>
              </div>
              <div className={["text-xs", isDark ? "text-zinc-400" : "text-[#5a776d]"].join(" ")}>
                {t.metricsCard}
              </div>
            </div>
          </section>

          {/* Form */}
          <section className={Panel(isDark, "p-5 sm:p-7")}>
            <div>
              <h3 className={["text-xl font-black tracking-tight", isDark ? "text-white" : "text-[#0f2f29]"].join(" ")}>
                {t.profileDetails}
              </h3>
              <p className={["mt-1 text-sm", isDark ? "text-zinc-300" : "text-[#4e6f65]"].join(" ")}>
                {t.accountCardSub}
              </p>
            </div>

            <button
              onClick={saveProfile}
              disabled={saving}
              className={[
                "mt-5 w-full rounded-2xl px-5 py-3 text-sm font-black text-zinc-900 transition hover:brightness-110 disabled:opacity-60",
                "bg-gradient-to-r from-emerald-300 via-emerald-400 to-green-300 shadow-[0_24px_90px_rgba(16,185,129,0.22)]",
              ].join(" ")}
            >
              {saving ? t.saving : t.save}
            </button>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <InputField label={t.firstName} value={form.first_name} onChange={(v) => setForm((p) => ({ ...p, first_name: v }))} isDark={isDark} />
              <InputField label={t.lastName} value={form.last_name} onChange={(v) => setForm((p) => ({ ...p, last_name: v }))} isDark={isDark} />
              <InputField label={t.email} value={form.email} onChange={(v) => setForm((p) => ({ ...p, email: v }))} isDark={isDark} />
              <InputField label={t.phone} value={form.phone_number} onChange={(v) => setForm((p) => ({ ...p, phone_number: v }))} isDark={isDark} />
              <InputField label={t.birthDate} type="date" value={form.birth_date} onChange={(v) => setForm((p) => ({ ...p, birth_date: v }))} isDark={isDark} />

              <SelectField
                label={t.gender}
                value={form.gender}
                onChange={(v) => setForm((p) => ({ ...p, gender: v as "male" | "female" }))}
                isDark={isDark}
                options={[
                  { value: "male", label: t.male },
                  { value: "female", label: t.female },
                ]}
              />
            </div>

            {saveErr ? (
              <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-100">
                {saveErr}
              </div>
            ) : null}
            {saveMsg ? (
              <div className="mt-4 rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-50">
                {saveMsg}
              </div>
            ) : null}
          </section>
        </section>

        {/* Measurements */}
        <section className={Panel(isDark, "mt-6 p-5 sm:p-7")}>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className={["text-xl font-black tracking-tight", isDark ? "text-white" : "text-[#0f2f29]"].join(" ")}>{t.metricsCard}</h2>
              <p className={["mt-1 text-sm", isDark ? "text-zinc-300" : "text-[#4e6f65]"].join(" ")}>{t.metricsSub}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className={["text-sm font-semibold", isDark ? "text-zinc-300" : "text-[#4e6f65]"].join(" ")}>{t.rangeLabel}</span>
              {[7, 30, 90].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setRangeDays(v as 7 | 30 | 90)}
                  className={[
                    "rounded-full px-4 py-2 text-xs font-extrabold tracking-tight transition",
                    rangeDays === v
                      ? "bg-emerald-400/25 text-emerald-50 ring-1 ring-emerald-300/45"
                      : isDark
                        ? "bg-black/35 text-zinc-100 ring-1 ring-emerald-300/30 hover:bg-emerald-900/30"
                        : "bg-white text-[#0f2f29] ring-1 ring-[#2f6154]/16 hover:bg-[#f3f8f5]",
                  ].join(" ")}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <InputField label={t.date} type="date" value={measurementForm.date} onChange={(v) => setMeasurementForm((p) => ({ ...p, date: v }))} isDark={isDark} />
            <InputField label={t.weight} type="number" value={measurementForm.weight} onChange={(v) => setMeasurementForm((p) => ({ ...p, weight: v }))} isDark={isDark} />
            <InputField label={t.bodyFat} type="number" value={measurementForm.body_fat} onChange={(v) => setMeasurementForm((p) => ({ ...p, body_fat: v }))} isDark={isDark} />
            <div className="flex items-end">
              <button
                onClick={addMeasurement}
                disabled={measurementSaving}
                className={[
                  "w-full rounded-2xl px-5 py-3 text-sm font-black text-zinc-900 transition hover:brightness-110 disabled:opacity-60",
                  "bg-gradient-to-r from-emerald-300 via-emerald-400 to-green-300 shadow-[0_24px_90px_rgba(16,185,129,0.22)]",
                ].join(" ")}
              >
                {measurementSaving ? "..." : t.addMeasurement}
              </button>
            </div>
          </div>

          {measurementMsg ? (
            <div className={["mt-4 rounded-2xl px-4 py-3 text-sm font-semibold", isDark ? "bg-black/35 text-zinc-100 ring-1 ring-emerald-300/30" : "bg-white text-[#123a32] ring-1 ring-[#2f6154]/14"].join(" ")}>
              {measurementMsg}
            </div>
          ) : null}

          <div className="mt-6 grid gap-5 xl:grid-cols-[1fr_320px]">
            <ChartCard
              isDark={isDark}
              weightPoints={weightPoints}
              fatPoints={fatPoints}
              weightLabel={t.weight}
              fatLabel={t.bodyFat}
              emptyLabel={t.noMeasurements}
            />

            <div className="grid gap-3">
              <MetricCard isDark={isDark} label={t.latestWeight} value={latestWeight != null ? `${latestWeight} kg` : "-"} tone="emerald" />
              <MetricCard isDark={isDark} label={t.latestFat} value={latestFat != null ? `% ${latestFat}` : "-"} tone="teal" />
              <MetricCard
                isDark={isDark}
                label={t.trend}
                value={trendWeight != null ? `${trendWeight > 0 ? "+" : ""}${trendWeight.toFixed(1)} kg` : "-"}
                tone="soft"
              />
            </div>
          </div>

          <div className={["mt-6 rounded-3xl p-4", isDark ? "bg-black/35 ring-1 ring-emerald-300/30" : "bg-white ring-1 ring-[#2f6154]/14"].join(" ")}>
            <div className="mb-3 flex items-center justify-between">
              <div className={["text-sm font-black", isDark ? "text-white" : "text-[#0f2f29]"].join(" ")}>{t.recentRecords}</div>
            </div>

            {measurements.length === 0 ? (
              <div className={["text-sm font-semibold", isDark ? "text-zinc-300" : "text-[#5a776d]"].join(" ")}>{t.noMeasurements}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className={["text-left text-[12px] font-extrabold", isDark ? "text-zinc-300" : "text-[#4e6f65]"].join(" ")}>
                      <th className="pb-3">{t.date}</th>
                      <th className="pb-3">{t.weight}</th>
                      <th className="pb-3">{t.bodyFat}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...measurements].reverse().slice(0, 10).map((m) => (
                      <tr
                        key={m.id}
                        className={[
                          "transition",
                          isDark ? "border-t border-emerald-300/20 hover:bg-emerald-900/20" : "border-t border-[#2f6154]/14 hover:bg-[#f3f8f5]",
                        ].join(" ")}
                      >
                        <td className="py-3 font-semibold">{m.date}</td>
                        <td className="py-3 font-semibold">{m.weight ?? "-"}</td>
                        <td className="py-3 font-semibold">{m.body_fat ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>
      <style>{`
        .neon-input-dark {
          background: rgba(6, 18, 12, 0.92) !important;
          color: #f4f4f5 !important;
          border-color: rgba(110, 231, 183, 0.62) !important;
          box-shadow:
            0 0 0 1px rgba(52, 211, 153, 0.28) inset,
            0 0 18px rgba(52, 211, 153, 0.24);
        }
        .neon-input-dark::placeholder {
          color: rgba(212, 212, 216, 0.66) !important;
        }
        .neon-input-dark:-webkit-autofill,
        .neon-input-dark:-webkit-autofill:hover,
        .neon-input-dark:-webkit-autofill:focus {
          -webkit-text-fill-color: #f4f4f5 !important;
          box-shadow: 0 0 0 1000px rgba(6, 18, 12, 0.96) inset !important;
          transition: background-color 9999s ease-in-out 0s;
        }
        .neon-date-dark::-webkit-calendar-picker-indicator {
          filter: invert(0.98) brightness(1.05);
          opacity: 0.9;
        }
      `}</style>
    </div>
  );
}

/* -------------------- UI components -------------------- */

function Panel(isDark: boolean, extra = "") {
  return [
    "rounded-[32px] border backdrop-blur-xl",
    isDark
      ? "border-emerald-400/45 bg-black/35 shadow-[0_26px_110px_rgba(0,0,0,0.55)]"
      : "border-[#2f6154]/20 bg-white/70 shadow-[0_18px_70px_rgba(15,47,41,0.12)]",
    extra,
  ].join(" ");
}

function CompactInfoCard({ isDark, label, value }: { isDark: boolean; label: string; value: string }) {
  return (
    <div
      className={[
        "rounded-2xl p-4 transition",
        isDark ? "bg-black/35 ring-1 ring-emerald-300/45 shadow-[0_0_16px_rgba(52,211,153,0.14)] hover:bg-emerald-950/20" : "bg-white ring-1 ring-[#2f6154]/14 hover:bg-[#f3f8f5]",
      ].join(" ")}
    >
      <div className={["text-[12px] font-extrabold tracking-tight", isDark ? "text-zinc-200" : "text-[#4e6f65]"].join(" ")}>
        {label}
      </div>
      <div className={["mt-2 break-words text-base font-black", isDark ? "text-white" : "text-[#0f2f29]"].join(" ")}>
        {value}
      </div>
    </div>
  );
}

function ToolbarPill({ isDark, children }: { isDark: boolean; children: React.ReactNode }) {
  return (
    <div
      className={[
        "inline-flex items-center gap-1 rounded-full p-1 text-xs font-bold backdrop-blur-xl",
        isDark ? "border border-emerald-300/30 bg-black/35 text-zinc-50" : "border border-[#2f6154]/20 bg-white/70 text-[#123a32]",
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  isDark,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  isDark: boolean;
  type?: string;
}) {
  const darkInputFix = isDark ? "neon-input-dark [color-scheme:dark]" : "";
  const darkDateIconFix = isDark && type === "date" ? "neon-date-dark" : "";

  return (
    <div>
      <label className={["mb-1 block text-[12px] font-extrabold tracking-[0.02em]", isDark ? "text-emerald-100 drop-shadow-[0_0_8px_rgba(52,211,153,0.35)]" : "text-[#0f2f29]"].join(" ")}>
        {label}
      </label>
      <input
        value={value}
        type={type}
        onChange={(e) => onChange(e.target.value)}
        className={[
          "w-full rounded-xl border px-3 py-2.5 text-sm font-semibold outline-none transition backdrop-blur-xl",
          isDark
            ? "focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300/30"
            : "border-[#2f6154]/22 bg-white text-[#123a32] focus:border-[#2f6154]/45 focus:ring-2 focus:ring-[#2f6154]/10",
          darkInputFix,
          darkDateIconFix,
        ].join(" ")}
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  isDark,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  isDark: boolean;
  options: Array<{ value: string; label: string }>;
}) {
  const darkInputFix = isDark ? "neon-input-dark [color-scheme:dark]" : "";
  return (
    <div>
      <label className={["mb-1 block text-[12px] font-extrabold tracking-[0.02em]", isDark ? "text-emerald-100 drop-shadow-[0_0_8px_rgba(52,211,153,0.35)]" : "text-[#0f2f29]"].join(" ")}>
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={[
          "w-full rounded-xl border px-3 py-2.5 text-sm font-semibold outline-none transition backdrop-blur-xl",
          isDark
            ? "focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300/30"
            : "border-[#2f6154]/22 bg-white text-[#123a32] focus:border-[#2f6154]/45 focus:ring-2 focus:ring-[#2f6154]/10",
          darkInputFix,
        ].join(" ")}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function MetricCard({
  isDark,
  label,
  value,
  tone,
}: {
  isDark: boolean;
  label: string;
  value: string;
  tone: "emerald" | "teal" | "soft";
}) {
  const bar =
    tone === "emerald"
      ? "from-emerald-300/35 via-emerald-400/25 to-green-300/20"
      : tone === "teal"
        ? "from-green-300/35 via-emerald-400/22 to-emerald-300/12"
        : "from-emerald-950/40 via-emerald-400/18 to-emerald-950/40";

  return (
    <div className={["rounded-3xl border p-4 backdrop-blur-xl", isDark ? "border-emerald-300/30 bg-black/35" : "border-[#2f6154]/18 bg-white"].join(" ")}>
      <div className={["text-sm font-extrabold", isDark ? "text-zinc-200" : "text-[#4e6f65]"].join(" ")}>{label}</div>
      <div className={["mt-1 text-2xl font-black tracking-tight", isDark ? "text-white" : "text-[#0f2f29]"].join(" ")}>{value}</div>
      <div className={`mt-4 h-1.5 rounded-full bg-gradient-to-r ${bar}`} />
    </div>
  );
}

function ChartCard({
  isDark,
  weightPoints,
  fatPoints,
  emptyLabel,
  weightLabel,
  fatLabel,
}: {
  isDark: boolean;
  weightPoints: Array<{ x: string; y: number }>;
  fatPoints: Array<{ x: string; y: number }>;
  emptyLabel: string;
  weightLabel: string;
  fatLabel: string;
}) {
  const width = 760;
  const height = 250;
  const pad = 24;

  const values = [...weightPoints.map((p) => p.y), ...fatPoints.map((p) => p.y)];
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 0;
  const range = max - min || 1;

  const toPath = (points: Array<{ y: number }>) => {
    if (!points.length) return "";
    return points
      .map((p, i) => {
        const x = pad + (i / Math.max(points.length - 1, 1)) * (width - pad * 2);
        const y = height - pad - ((p.y - min) / range) * (height - pad * 2);
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  };

  if (!weightPoints.length && !fatPoints.length) {
    return (
      <div className={["rounded-3xl border p-5 text-sm", isDark ? "border-emerald-300/25 bg-black/20 text-zinc-400" : "border-[#2f6154]/18 bg-white text-[#5a776d]"].join(" ")}>
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className={["rounded-3xl border p-4", isDark ? "border-emerald-300/25 bg-black/20" : "border-[#2f6154]/18 bg-white"].join(" ")}>
      <div className="mb-3 flex flex-wrap items-center gap-4 text-xs font-extrabold">
        <span className="inline-flex items-center gap-2">
          <i className="h-2 w-2 rounded-full bg-emerald-400" />
          <span className={isDark ? "text-zinc-200" : "text-[#0f2f29]"}>{weightLabel}</span>
        </span>
        <span className="inline-flex items-center gap-2">
          <i className="h-2 w-2 rounded-full bg-green-300" />
          <span className={isDark ? "text-zinc-200" : "text-[#0f2f29]"}>{fatLabel}</span>
        </span>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="h-[240px] w-full">
        <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke={isDark ? "rgba(52,211,153,0.28)" : "#c8ddd4"} strokeWidth="1" />
        <line x1={pad} y1={pad} x2={pad} y2={height - pad} stroke={isDark ? "rgba(52,211,153,0.28)" : "#c8ddd4"} strokeWidth="1" />
        <path d={toPath(weightPoints)} fill="none" stroke="#34d399" strokeWidth="3" strokeLinecap="round" />
        <path d={toPath(fatPoints)} fill="none" stroke="#86efac" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
  );
}
