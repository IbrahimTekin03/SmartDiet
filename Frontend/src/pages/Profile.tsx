import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSettings } from "../context/AppSettingsContext";
import { API_BASE_URL as API_BASE } from "../lib/api";
import { clearAuthSession, setAuthSession } from "../lib/authSession";
import { DashboardPanel, DashboardShell } from "../components/DashboardShell";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Building2, Camera, Save } from "lucide-react";

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
  account_type?: string | null;
  role?: string | null;
  clinic_name?: string | null;
  clinic_city?: string | null;
  dietitian_verification_status?: string | null;
  created_at?: string | null;
  height?: number | null;
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
  height?: number | null;
};

type WorkspaceNetwork = {
  assignedDietitian?: {
    user_id?: string;
    name?: string | null;
    email?: string | null;
    clinic_name?: string | null;
    clinic_city?: string | null;
    notes?: string | null;
  } | null;
};

const COPY = {
  tr: {
    title: "Profil & Hesap",
    subtitle: "Hesap yönetimi, kişisel bilgiler ve biyometrik ölçüm analizi.",
    back: "Ana Sayfa",
    logout: "Çıkış Yap",
    loadingProfile: "Profil yükleniyor...",
    uploadPhoto: "Fotoğraf Yükle",
    save: "Değişiklikleri Kaydet",
    saving: "Kaydediliyor...",
    saveOk: "Profil başarıyla güncellendi.",
    saveErr: "Profil güncellenemedi.",
    firstName: "İsim",
    lastName: "Soyisim",
    email: "E-posta Adresi",
    phone: "Telefon Numarası",
    birthDate: "Doğum Tarihi",
    gender: "Cinsiyet",
    male: "Erkek",
    female: "Kadın",
    accountCard: "Hesap Özeti",
    accountCardSub: "Kimlik ve iletişim bilgileri",
    metricsCard: "Ölçüm & Biyometrik Analiz",
    metricsSub: "Zaman içerisindeki kilo ve vücut kompozisyonu gelişimi",
    addMeasurement: "Ölçüm Kaydet",
    measurementSaved: "Ölçüm başarıyla kaydedildi.",
    measurementFailed: "Ölçüm kaydedilemedi.",
    measurementEmpty: "Lütfen en az bir değer girin (Kilo veya Yağ Oranı).",
    noMeasurements: "Bu aralıkta kayıtlı ölçüm bulunmuyor.",
    rangeLabel: "Zaman Aralığı",
    latestWeight: "Güncel Kilo",
    latestFat: "Yağ Oranı",
    trend: "Genel Değişim",
    recentRecords: "Son Ölçüm Geçmişi",
    date: "Tarih",
    weight: "Kilo (kg)",
    bodyFat: "Yağ Oranı (%)",
    quickStats: "Profil Doluluk",
    contact: "İletişim",
    role: "Hesap Rolü",
    systemInfo: "Profesyonel & Sistem Bilgileri",
    systemInfoSub: "Yetkiler ve platform durumu.",
    connectionPanelTitle: "Atanmış Diyetisyen & Klinik",
    connectionPanelSub: "Bağlı olduğunuz uzman ve klinik iletişim notları.",
    noAssignedDietitian: "Henüz atanmış bir diyetisyeniniz bulunmuyor.",
    accountType: "Hesap Tipi",
    accountStatus: "Hesap Durumu",
    activeAccount: "Aktif / Doğrulanmış",
    createdAt: "Kayıt Tarihi",
    verificationStatus: "Onay Durumu",
    assignedDietitian: "Diyetisyen",
    assignedClinic: "Klinik",
    connectionNote: "Klinik / Uzman Notu",
    noConnectionNote: "Ekstra bir diyetisyen notu eklenmemiş.",
    clientOnlyMeasurements: "Bu alan yalnızca danışan hesaplarında görünür.",
    profileDetails: "Kişisel Bilgileri Düzenle",
    notProvided: "Belirtilmedi",
    roleAdmin: "Sistem Yöneticisi",
    roleDietitian: "Uzman Diyetisyen",
    roleClient: "Danışan",
    roleUser: "Kullanıcı",
    requestFailed: "İşlem sırasında bir hata oluştu.",
    unauthorized: "Oturum süresi doldu. Lütfen tekrar giriş yapın.",
    avatarUpdated: "Profil fotoğrafı başarıyla güncellendi.",
    avatarResponseInvalid: "Profil verisi güncellenemedi.",
    avatarUploadFailed: "Profil fotoğrafı yüklenemedi.",
  },
  en: {
    title: "Profile & Account",
    subtitle: "Account management, personal settings, and biometric analytics.",
    back: "Dashboard",
    logout: "Log Out",
    loadingProfile: "Loading profile...",
    uploadPhoto: "Upload Photo",
    save: "Save Changes",
    saving: "Saving...",
    saveOk: "Profile updated successfully.",
    saveErr: "Update failed.",
    firstName: "First Name",
    lastName: "Last Name",
    email: "Email Address",
    phone: "Phone Number",
    birthDate: "Birth Date",
    gender: "Gender",
    male: "Male",
    female: "Female",
    accountCard: "Account Overview",
    accountCardSub: "Identity and contact details",
    metricsCard: "Biometric & Body Analytics",
    metricsSub: "Weight and body composition tracking over time",
    addMeasurement: "Add Measurement",
    measurementSaved: "Measurement saved successfully.",
    measurementFailed: "Failed to save measurement.",
    measurementEmpty: "Please enter at least one value (Weight or Body Fat).",
    noMeasurements: "No measurements recorded in this range.",
    rangeLabel: "Time Range",
    latestWeight: "Current Weight",
    latestFat: "Body Fat",
    trend: "Total Change",
    recentRecords: "Recent Measurement Records",
    date: "Date",
    weight: "Weight (kg)",
    bodyFat: "Body Fat (%)",
    quickStats: "Profile Completion",
    contact: "Contact",
    role: "Role",
    systemInfo: "Professional & System Info",
    systemInfoSub: "Permissions and verification credentials.",
    connectionPanelTitle: "Assigned Dietitian & Clinic",
    connectionPanelSub: "Your primary care nutrition specialist details.",
    noAssignedDietitian: "No dietitian has been assigned yet.",
    accountType: "Account Type",
    accountStatus: "Account Status",
    activeAccount: "Active / Verified",
    createdAt: "Member Since",
    verificationStatus: "Verification",
    assignedDietitian: "Dietitian",
    assignedClinic: "Clinic",
    connectionNote: "Clinical Notes",
    noConnectionNote: "No clinical notes provided yet.",
    clientOnlyMeasurements: "This section is exclusive to client profiles.",
    profileDetails: "Edit Personal Details",
    notProvided: "Not provided",
    roleAdmin: "System Administrator",
    roleDietitian: "Clinical Dietitian",
    roleClient: "Client",
    roleUser: "User",
    requestFailed: "Request failed.",
    unauthorized: "Session expired. Please sign in again.",
    avatarUpdated: "Profile photo updated successfully.",
    avatarResponseInvalid: "Could not read profile response.",
    avatarUploadFailed: "Profile photo upload failed.",
  },
} as const;

function mapRoleName(roleName: string, lang: Lang, t: (typeof COPY)[Lang]): string {
  const normalized = String(roleName || "").trim().toLowerCase();
  if (!normalized) return t.roleUser;
  if (normalized === "admin") return t.roleAdmin;
  if (normalized === "clinic_manager") return lang === "tr" ? "Klinik Yöneticisi" : "Clinic Manager";
  if (normalized === "dietitian" || normalized === "diyetisyen") return t.roleDietitian;
  if (normalized === "client") return t.roleClient;
  if (normalized === "user") return t.roleUser;
  return lang === "tr" ? normalized : roleName;
}

export default function Profile() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const { lang, isDark } = useAppSettings();
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
    height: "",
  });

  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [rangeDays, setRangeDays] = useState<7 | 30 | 90>(30);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [measurementSaving, setMeasurementSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [saveErr, setSaveErr] = useState("");
  const [measurementMsg, setMeasurementMsg] = useState("");
  const [avatarMsg, setAvatarMsg] = useState("");
  const [avatarErr, setAvatarErr] = useState("");
  const [workspaceNetwork, setWorkspaceNetwork] = useState<WorkspaceNetwork>({});

  const t = COPY[lang];
  const roleNames = useMemo(
    () => [
      ...(user?.roles || []).map((r) => String(r?.name || "").trim().toLowerCase()).filter(Boolean),
      String(user?.role || "").trim().toLowerCase(),
      String(user?.account_type || "").trim().toLowerCase(),
    ].filter(Boolean),
    [user],
  );
  const isAdmin = roleNames.includes("admin");
  const isDietitian = roleNames.includes("dietitian") || roleNames.includes("diyetisyen");
  const isClinicManager = roleNames.includes("clinic_manager");
  const isClient = Boolean(user) && !isAdmin && !isDietitian && !isClinicManager && (roleNames.includes("client") || roleNames.includes("user") || !roleNames.length);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/login");
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
        return data;
      })
      .then((d) => {
        const profile = d?.data ?? d;
        if (profile?.id) {
          setUser(profile);
          setAuthSession({ user: profile });
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
          clearAuthSession();
          navigate("/login");
        }
      });
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
    if (!isClient) {
      setMeasurements([]);
      return;
    }
    loadMeasurements(rangeDays);
  }, [rangeDays, isClient]);

  useEffect(() => {
    if (!isClient) {
      setWorkspaceNetwork({});
      return;
    }

    const token = localStorage.getItem("access_token");
    if (!token) return;

    fetch(`${API_BASE}/api/auth/workspace/network`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (res.ok) setWorkspaceNetwork((data?.data ?? data) as WorkspaceNetwork);
      })
      .catch(() => {});
  }, [isClient]);

  const fullName = useMemo(() => {
    if (!user) return "...";
    const fromParts = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
    return fromParts || user.full_name || user.display_name || "...";
  }, [user]);

  const roleText = useMemo(() => {
    if (!roleNames.length) return t.roleUser;
    if (isClient && !roleNames.includes("client")) return t.roleClient;
    return Array.from(new Set(roleNames)).map((name) => mapRoleName(name, lang, t)).join(", ");
  }, [isClient, lang, roleNames, t]);

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
        .filter((m) => m.weight !== null && m.weight !== undefined && !isNaN(Number(m.weight)))
        .map((m) => ({ x: m.date, y: Number(m.weight) })),
    [measurements],
  );

  const fatPoints = useMemo(
    () =>
      measurements
        .filter((m) => m.body_fat !== null && m.body_fat !== undefined && !isNaN(Number(m.body_fat)))
        .map((m) => ({ x: m.date, y: Number(m.body_fat) })),
    [measurements],
  );

  const latestWeight = weightPoints.length ? weightPoints[weightPoints.length - 1].y : null;
  const latestFat = fatPoints.length ? fatPoints[fatPoints.length - 1].y : null;

  const completion = useMemo(() => {
    const checks = isClient ? [form.first_name, form.last_name, form.email, form.phone_number, form.birth_date] : [form.first_name, form.last_name, form.email, form.phone_number];
    const done = checks.filter((x) => String(x || "").trim().length > 0).length;
    return Math.round((done / checks.length) * 100);
  }, [form, isClient]);


  const uploadAvatar = async (file?: File | null) => {
    const token = localStorage.getItem("access_token");
    if (!token || !file) return;

    setAvatarMsg("");
    setAvatarErr("");

    const body = new FormData();
    body.append("avatar", file);

    setUploading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/profile/avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || t.avatarUploadFailed);

      const profile = data?.data ?? data;
      if (profile?.id) {
        setUser(profile);
        setAuthSession({ user: profile });
        setAvatarMsg(t.avatarUpdated);
      }
    } catch {
      setAvatarErr(t.avatarUploadFailed);
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
      const profilePayload = isClient
        ? form
        : {
            first_name: form.first_name,
            last_name: form.last_name,
            email: form.email,
            phone_number: form.phone_number,
          };
      const res = await fetch(`${API_BASE}/api/auth/profile/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profilePayload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || t.saveErr);

      const profile = data?.data ?? data;
      if (profile?.id) {
        setUser(profile);
        setAuthSession({ user: profile });
      }
      setSaveMsg(t.saveOk);
    } catch {
      setSaveErr(t.saveErr);
    } finally {
      setSaving(false);
    }
  };

  const addMeasurement = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    if (!String(measurementForm.weight || "").trim() && !String(measurementForm.body_fat || "").trim() && !String(measurementForm.height || "").trim()) {
      setMeasurementMsg(lang === "tr" ? "Lütfen en az bir değer girin (Kilo, Yağ Oranı veya Boy)." : "Please enter at least one value (Weight, Body Fat, or Height).");
      return;
    }

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
          height: measurementForm.height ? Number(measurementForm.height) : undefined,
        }),
      });

      if (!res.ok) throw new Error();
      setMeasurementMsg(t.measurementSaved);
      if (measurementForm.height) {
        setUser((prev: any) => prev ? { ...prev, height: Number(measurementForm.height) } : null);
      }
      setMeasurementForm((p) => ({ ...p, weight: "", body_fat: "", height: "" }));
      loadMeasurements(rangeDays);
    } catch {
      setMeasurementMsg(t.measurementFailed);
    } finally {
      setMeasurementSaving(false);
    }
  };

  const latestHeight = useMemo(() => {
    const rawHeight = user?.height || [...measurements].reverse().find((m) => m.height)?.height || null;
    return rawHeight ? Number(rawHeight) : null;
  }, [user, measurements]);

  const bmi = useMemo(() => {
    if (!latestWeight || !latestHeight) return null;
    const heightInMeters = latestHeight > 3 ? latestHeight / 100 : latestHeight;
    return Number((latestWeight / (heightInMeters * heightInMeters)).toFixed(1));
  }, [latestWeight, latestHeight]);

  const bmiCategory = useMemo(() => {
    if (!bmi) return null;
    if (bmi < 18.5) {
      return {
        name: lang === "tr" ? "Zayıf" : "Underweight",
        color: "text-sky-400",
        feedback: lang === "tr" ? "Kilonuz boyunuza göre az. Dengeli beslenme programı önerilir." : "Underweight. A balanced meal plan is recommended.",
      };
    }
    if (bmi < 25) {
      return {
        name: lang === "tr" ? "Sağlıklı" : "Healthy",
        color: "text-emerald-400",
        feedback: lang === "tr" ? "Harika! Vücut kitle endeksiniz ideal aralıkta." : "Great! Your BMI is in the ideal healthy range.",
      };
    }
    if (bmi < 30) {
      return {
        name: lang === "tr" ? "Fazla Kilolu" : "Overweight",
        color: "text-amber-400",
        feedback: lang === "tr" ? "Kilonuz ideal aralığın biraz üzerinde. Aktif yaşam tarzı yardımcı olacaktır." : "Slightly above ideal. Active lifestyle helps.",
      };
    }
    return {
      name: lang === "tr" ? "Obezite" : "Obese",
      color: "text-rose-400",
      feedback: lang === "tr" ? "Diyetisyeniniz rehberliğinde hedeflenen beslenme planına sadık kalın." : "Follow your dietitian's targeted meal plan.",
    };
  }, [bmi, lang]);

  return (
    <DashboardShell isDark={isDark} title={t.title} subtitle={t.subtitle} backUrl="/">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Profile Identity Hero */}
        <div className={`relative overflow-hidden rounded-[36px] border p-8 shadow-2xl ${
          isDark ? "border-white/10 bg-slate-900/60 backdrop-blur-2xl" : "border-slate-200 bg-white"
        }`}>
          <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 relative z-10">
            <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
              <div className="relative group">
                <div className="flex h-28 w-28 items-center justify-center rounded-[32px] overflow-hidden border-2 border-emerald-500/30 bg-slate-800 shadow-2xl">
                  {avatarSrc ? (
                    <img src={avatarSrc} alt="avatar" className="h-full w-full object-cover" />
                  ) : (
                    <span className="font-display text-3xl font-black text-emerald-400">{initials}</span>
                  )}
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
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30 hover:scale-110 active:scale-95 transition"
                  title={t.uploadPhoto}
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h2 className="font-display text-2xl font-black tracking-tight">{fullName}</h2>
                  <span className="rounded-full bg-emerald-500/15 px-3 py-0.5 text-[11px] font-black text-emerald-400 font-mono">
                    {roleText}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium">{form.email}</p>
                <div className="flex items-center justify-center sm:justify-start gap-4 pt-2 text-xs font-bold text-slate-400">
                  <span>{form.phone_number || t.notProvided}</span>
                  <span>•</span>
                  <span>{isClient ? (form.gender === "female" ? t.female : t.male) : t.activeAccount}</span>
                </div>
              </div>
            </div>

            {/* Profile Completion Meter */}
            <div className={`p-4 rounded-3xl border w-full sm:w-auto min-w-[200px] text-center sm:text-right ${
              isDark ? "border-white/5 bg-black/40" : "border-slate-200 bg-slate-50"
            }`}>
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">{t.quickStats}</div>
              <div className="font-display text-2xl font-black text-emerald-400 mt-0.5">%{completion}</div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500" style={{ width: `${completion}%` }} />
              </div>
            </div>
          </div>

          {avatarErr && <div className="mt-4 text-xs font-bold text-rose-400 text-center">{avatarErr}</div>}
          {avatarMsg && <div className="mt-4 text-xs font-bold text-emerald-400 text-center">{avatarMsg}</div>}
        </div>

        {/* Profile Settings & Form Grid */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Edit Profile Form */}
          <div className="lg:col-span-8 space-y-6">
            <DashboardPanel isDark={isDark} className="p-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
                <div>
                  <h3 className="font-display text-base font-black">{t.profileDetails}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{t.accountCardSub}</p>
                </div>
                <button
                  type="button"
                  onClick={saveProfile}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-2.5 text-xs font-black text-slate-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 transition hover:scale-105"
                >
                  <Save className="h-3.5 w-3.5 stroke-[2.5]" />
                  <span>{saving ? t.saving : t.save}</span>
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 block">{t.firstName}</label>
                  <input
                    type="text"
                    value={form.first_name}
                    onChange={(e) => setForm((p) => ({ ...p, first_name: e.target.value }))}
                    className={`w-full rounded-2xl border px-3.5 py-2.5 text-xs font-semibold outline-none ${
                      isDark ? "border-white/10 bg-black/40 text-white focus:border-emerald-500" : "border-slate-200 bg-white text-slate-900 focus:border-emerald-500"
                    }`}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 block">{t.lastName}</label>
                  <input
                    type="text"
                    value={form.last_name}
                    onChange={(e) => setForm((p) => ({ ...p, last_name: e.target.value }))}
                    className={`w-full rounded-2xl border px-3.5 py-2.5 text-xs font-semibold outline-none ${
                      isDark ? "border-white/10 bg-black/40 text-white focus:border-emerald-500" : "border-slate-200 bg-white text-slate-900 focus:border-emerald-500"
                    }`}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 block">{t.email}</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    className={`w-full rounded-2xl border px-3.5 py-2.5 text-xs font-semibold outline-none ${
                      isDark ? "border-white/10 bg-black/40 text-white focus:border-emerald-500" : "border-slate-200 bg-white text-slate-900 focus:border-emerald-500"
                    }`}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 block">{t.phone}</label>
                  <input
                    type="text"
                    value={form.phone_number}
                    onChange={(e) => setForm((p) => ({ ...p, phone_number: e.target.value }))}
                    className={`w-full rounded-2xl border px-3.5 py-2.5 text-xs font-semibold outline-none ${
                      isDark ? "border-white/10 bg-black/40 text-white focus:border-emerald-500" : "border-slate-200 bg-white text-slate-900 focus:border-emerald-500"
                    }`}
                  />
                </div>

                {isClient && (
                  <>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 block">{t.birthDate}</label>
                      <input
                        type="date"
                        value={form.birth_date}
                        onChange={(e) => setForm((p) => ({ ...p, birth_date: e.target.value }))}
                        className={`w-full rounded-2xl border px-3.5 py-2.5 text-xs font-semibold outline-none ${
                          isDark ? "border-white/10 bg-black/40 text-white focus:border-emerald-500" : "border-slate-200 bg-white text-slate-900 focus:border-emerald-500"
                        }`}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 block">{t.gender}</label>
                      <select
                        value={form.gender}
                        onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value as "male" | "female" }))}
                        className={`w-full rounded-2xl border px-3.5 py-2.5 text-xs font-semibold outline-none ${
                          isDark ? "border-white/10 bg-black/40 text-white focus:border-emerald-500" : "border-slate-200 bg-white text-slate-900 focus:border-emerald-500"
                        }`}
                      >
                        <option value="male">{t.male}</option>
                        <option value="female">{t.female}</option>
                      </select>
                    </div>
                  </>
                )}
              </div>

              {saveErr && <div className="mt-4 text-xs font-bold text-rose-400">{saveErr}</div>}
              {saveMsg && <div className="mt-4 text-xs font-bold text-emerald-400">{saveMsg}</div>}
            </DashboardPanel>
          </div>

          {/* Assigned Dietitian / Clinic Card */}
          <div className="lg:col-span-4 space-y-6">
            <DashboardPanel isDark={isDark} className="p-6">
              <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-sm font-black">{isClient ? t.connectionPanelTitle : t.systemInfo}</h3>
                  <p className="text-[10px] text-slate-400">{isClient ? t.connectionPanelSub : t.systemInfoSub}</p>
                </div>
              </div>

              {isClient ? (
                workspaceNetwork.assignedDietitian ? (
                  <div className="space-y-3">
                    <div className="p-3 rounded-2xl border border-white/5 bg-black/20">
                      <span className="text-[9px] uppercase font-bold text-slate-400">{t.assignedDietitian}</span>
                      <h4 className="font-bold text-xs mt-0.5">{workspaceNetwork.assignedDietitian.name || t.notProvided}</h4>
                      <p className="text-[10px] text-slate-500">{workspaceNetwork.assignedDietitian.email}</p>
                    </div>

                    <div className="p-3 rounded-2xl border border-white/5 bg-black/20">
                      <span className="text-[9px] uppercase font-bold text-slate-400">{t.assignedClinic}</span>
                      <h4 className="font-bold text-xs mt-0.5">{workspaceNetwork.assignedDietitian.clinic_name || t.notProvided}</h4>
                    </div>

                    {workspaceNetwork.assignedDietitian.notes && (
                      <div className="p-3 rounded-2xl border border-white/5 bg-emerald-500/5 text-emerald-300 text-xs">
                        <span className="text-[9px] uppercase font-black block mb-1">{t.connectionNote}</span>
                        {workspaceNetwork.assignedDietitian.notes}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-slate-400 font-medium">
                    {t.noAssignedDietitian}
                  </div>
                )
              ) : (
                <div className="space-y-3">
                  <div className="p-3 rounded-2xl border border-white/5 bg-black/20">
                    <span className="text-[9px] uppercase font-bold text-slate-400">{t.accountStatus}</span>
                    <h4 className="font-bold text-xs text-emerald-400 mt-0.5">{t.activeAccount}</h4>
                  </div>
                  {isDietitian && (
                    <div className="p-3 rounded-2xl border border-white/5 bg-black/20">
                      <span className="text-[9px] uppercase font-bold text-slate-400">{t.assignedClinic}</span>
                      <h4 className="font-bold text-xs mt-0.5">{user?.clinic_name || t.notProvided}</h4>
                    </div>
                  )}
                </div>
              )}
            </DashboardPanel>
          </div>
        </div>

        {/* Biometrics & Measurement History (For Clients) */}
        {isClient && (
          <div className="space-y-6">
            <DashboardPanel isDark={isDark} className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4 mb-6">
                <div>
                  <h3 className="font-display text-base font-black">{t.metricsCard}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{t.metricsSub}</p>
                </div>

                {/* Range Tabs */}
                <div className="flex items-center gap-1.5 p-1 rounded-2xl border border-white/10 bg-black/30">
                  {[7, 30, 90].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setRangeDays(days as 7 | 30 | 90)}
                      className={`px-3 py-1 text-xs font-mono font-bold rounded-xl transition ${
                        rangeDays === days
                          ? "bg-emerald-500 text-slate-950 font-black"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {days}G
                    </button>
                  ))}
                </div>
              </div>

              {/* Add Measurement Input Row */}
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-5 p-4 rounded-3xl border border-white/5 bg-black/20 mb-6">
                <div>
                  <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">{t.date}</label>
                  <input
                    type="date"
                    value={measurementForm.date}
                    onChange={(e) => setMeasurementForm((p) => ({ ...p, date: e.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs font-mono font-bold text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">{t.weight}</label>
                  <input
                    type="number"
                    placeholder="kg"
                    value={measurementForm.weight}
                    onChange={(e) => setMeasurementForm((p) => ({ ...p, weight: e.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs font-mono font-bold text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">{t.bodyFat}</label>
                  <input
                    type="number"
                    placeholder="%"
                    value={measurementForm.body_fat}
                    onChange={(e) => setMeasurementForm((p) => ({ ...p, body_fat: e.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs font-mono font-bold text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">{lang === "tr" ? "Boy (cm)" : "Height (cm)"}</label>
                  <input
                    type="number"
                    placeholder="cm"
                    value={measurementForm.height}
                    onChange={(e) => setMeasurementForm((p) => ({ ...p, height: e.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs font-mono font-bold text-white outline-none"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={addMeasurement}
                    disabled={measurementSaving}
                    className="w-full rounded-xl bg-emerald-500 py-2 text-xs font-black text-slate-950 hover:bg-emerald-400 transition"
                  >
                    {measurementSaving ? "..." : t.addMeasurement}
                  </button>
                </div>
              </div>

              {measurementMsg && (
                <div className={`p-3 rounded-2xl text-xs font-bold mb-6 ${
                  measurementMsg === t.measurementSaved ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                }`}>
                  {measurementMsg}
                </div>
              )}

              {/* Chart & Telemetry Row */}
              <div className="grid gap-6 lg:grid-cols-12">
                <div className="lg:col-span-8 h-72">
                  {measurements.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-xs text-slate-500">
                      {t.noMeasurements}
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={measurements.map(m => ({ date: m.date, weight: m.weight, body_fat: m.body_fat }))}>
                        <defs>
                          <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10 }} />
                        <YAxis stroke="#10b981" tick={{ fontSize: 10 }} domain={['dataMin - 3', 'dataMax + 3']} />
                        <Tooltip contentStyle={{ backgroundColor: "#090d0b", borderColor: "rgba(255,255,255,0.1)", borderRadius: "16px" }} />
                        <Area type="monotone" dataKey="weight" name="Kilo (kg)" stroke="#10b981" strokeWidth={3} fill="url(#weightGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Telemetry Stat Cards & BMI */}
                <div className="lg:col-span-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-2xl border border-white/5 bg-black/20">
                      <span className="text-[9px] uppercase font-bold text-slate-400">{t.latestWeight}</span>
                      <div className="font-display text-xl font-black text-emerald-400 mt-1">
                        {latestWeight ? `${latestWeight} kg` : "-"}
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl border border-white/5 bg-black/20">
                      <span className="text-[9px] uppercase font-bold text-slate-400">{t.latestFat}</span>
                      <div className="font-display text-xl font-black text-cyan-400 mt-1">
                        {latestFat ? `%${latestFat}` : "-"}
                      </div>
                    </div>
                  </div>

                  {bmi && bmiCategory && (
                    <div className="p-4 rounded-2xl border border-white/5 bg-black/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] uppercase font-black text-slate-400">Vücut Kitle Endeksi (VKE)</span>
                        <span className={`text-xs font-black ${bmiCategory.color}`}>{bmiCategory.name}</span>
                      </div>
                      <div className="font-display text-2xl font-black text-white">{bmi}</div>
                      <p className="text-[10px] text-slate-400">{bmiCategory.feedback}</p>
                    </div>
                  )}
                </div>
              </div>
            </DashboardPanel>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

