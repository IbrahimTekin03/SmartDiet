import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL as API_BASE } from "../lib/api";
import { useAppSettings } from "../context/AppSettingsContext";
import { 
  User, 
  Lock, 
  Mail, 
  Phone, 
  Calendar, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Sparkles, 
  Building2, 
  Ruler, 
  UserCheck, 
  Stethoscope,
  Activity,
  CheckCircle2,
  Moon,
  Sun,
  Globe
} from "lucide-react";

type Gender = "male" | "female";
type AccountType = "client" | "Diyetisyen";

type RegisterPayload = {
  first_name: string;
  last_name: string;
  password: string;
  birth_date: string;
  gender: Gender;
  account_type: AccountType;
  email?: string;
  phone_number?: string;
  clinic_id?: string;
  height?: string;
};

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const COPY = {
  tr: {
    brandSub: "Klinik ve Beslenme Yönetimi",
    signIn: "Giriş Yap",
    headChip: "Sağlıklı yaşam yolculuğunuza bugün başlayın",
    titleA: "SmartDiet'e",
    titleB: "Kayıt Olun",
    subtitle: "Kişiselleştirilmiş diyet programları, ölçüm takibi ve uzman danışmanlığı tek bir ekosistemde.",
    cardTitle: "Yeni Hesap Oluştur",
    cardSub: "Rolünüzü seçin ve bilgilerinizi doldurarak aramıza katılın.",
    successMsg: "Kaydınız başarıyla oluşturuldu! Şimdi giriş yapabilirsiniz.",
    toLoginBtn: "Giriş Sayfasına Git",
    firstName: "Ad",
    lastName: "Soyad",
    firstNamePh: "Ahmet",
    lastNamePh: "Yılmaz",
    emailOpt: "E-posta Adresi",
    phoneOpt: "Telefon Numarası",
    emailPh: "ahmet@smartdiet.com",
    phonePh: "+90 555 123 45 67",
    birthDate: "Doğum Tarihi",
    gender: "Cinsiyet",
    accountType: "Hesap Türü",
    clientType: "Danışan (Bireysel)",
    clientTypeDesc: "Diyetisyenimle beslenme ve ölçüm takibi yapmak istiyorum.",
    dietitianType: "Diyetisyen (Uzman)",
    dietitianTypeDesc: "Danışanlarıma özel programlar hazırlayıp klinik yönetmek istiyorum.",
    male: "Erkek",
    female: "Kadın",
    height: "Boy (cm)",
    heightPh: "175",
    password: "Şifre",
    passHint: "En az 8 karakter, büyük/küçük harf, rakam ve özel karakter.",
    hide: "Gizle",
    show: "Göster",
    submitBusy: "Hesap oluşturuluyor...",
    submit: "Kayıt İşlemini Tamamla",
    haveAccount: "Zaten bir hesabınız var mı?",
    toLogin: "Giriş Yap",
    firstReq: "Ad alanı zorunludur.",
    lastReq: "Soyad alanı zorunludur.",
    birthReq: "Doğum tarihi zorunludur.",
    birthFormat: "Geçersiz doğum tarihi.",
    ageRule: "Kayıt için en az 18 yaşında olmalısınız.",
    genderReq: "Lütfen cinsiyet seçiniz.",
    passReq: "Şifre alanı zorunludur.",
    passRule: "Şifre en az 8 karakter olmalı; büyük harf, küçük harf, rakam ve özel karakter içermelidir.",
    contactReq: "En az bir iletişim bilgisi (e-posta veya telefon) girmelisiniz.",
    invalidEmail: "Geçerli bir e-posta adresi giriniz.",
    invalidPhone: "Geçerli bir telefon numarası giriniz.",
    registerFail: "Kayıt işlemi başarısız oldu.",
    genericErr: "Beklenmeyen bir hata oluştu.",
    selectClinic: "Klinik Seçimi (Opsiyonel)",
    clinicPH: "Bağlı olduğunuz kliniği seçin...",
  },
  en: {
    brandSub: "Clinical & Nutrition Platform",
    signIn: "Sign In",
    headChip: "Start your personalized health journey today",
    titleA: "Join",
    titleB: "SmartDiet",
    subtitle: "Tailored nutrition plans, bio-metric tracking, and dietitian communication in one place.",
    cardTitle: "Create Your Account",
    cardSub: "Select your role and enter your details to get started.",
    successMsg: "Account created successfully! You can now log in.",
    toLoginBtn: "Go to Login",
    firstName: "First Name",
    lastName: "Last Name",
    firstNamePh: "John",
    lastNamePh: "Doe",
    emailOpt: "Email Address",
    phoneOpt: "Phone Number",
    emailPh: "john@smartdiet.com",
    phonePh: "+1 555 123 4567",
    birthDate: "Date of Birth",
    gender: "Gender",
    accountType: "Account Role",
    clientType: "Client (Individual)",
    clientTypeDesc: "Follow meal plans and track progress with my dietitian.",
    dietitianType: "Dietitian (Practitioner)",
    dietitianTypeDesc: "Create custom plans and manage clients and clinics.",
    male: "Male",
    female: "Female",
    height: "Height (cm)",
    heightPh: "175",
    password: "Password",
    passHint: "Min 8 chars, uppercase, lowercase, number and symbol.",
    hide: "Hide",
    show: "Show",
    submitBusy: "Creating account...",
    submit: "Complete Registration",
    haveAccount: "Already have an account?",
    toLogin: "Sign In",
    firstReq: "First name is required.",
    lastReq: "Last name is required.",
    birthReq: "Date of birth is required.",
    birthFormat: "Invalid birth date.",
    ageRule: "You must be at least 18 years old.",
    genderReq: "Please select your gender.",
    passReq: "Password is required.",
    passRule: "Password must have 8+ chars with upper, lower, number, and symbol.",
    contactReq: "At least one contact method (email or phone) is required.",
    invalidEmail: "Please enter a valid email.",
    invalidPhone: "Please enter a valid phone.",
    registerFail: "Registration failed.",
    genericErr: "An unexpected error occurred.",
    selectClinic: "Clinic Selection (Optional)",
    clinicPH: "Select your clinic...",
  }
};

function isAtLeast18(dateStr: string): boolean {
  const [yearRaw, monthRaw, dayRaw] = dateStr.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  if (!year || !month || !day) return false;
  const now = new Date();
  let age = now.getFullYear() - year;
  const monthDiff = now.getMonth() + 1 - month;
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < day)) age -= 1;
  return age >= 18;
}

export default function Register() {
  const navigate = useNavigate();
  const { lang, setLang, isDark, toggleTheme } = useAppSettings();
  const t = COPY[lang];

  const [form, setForm] = useState<RegisterPayload>({
    first_name: "",
    last_name: "",
    password: "",
    birth_date: "",
    gender: "male",
    account_type: "client",
    email: "",
    phone_number: "",
    height: "",
    clinic_id: "",
  });

  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState("");
  const [duplicateContact, setDuplicateContact] = useState(false);
  const [clinics, setClinics] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/clinics`)
      .then((r) => r.json())
      .then((d) => setClinics(Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.first_name.trim()) e.first_name = t.firstReq;
    if (!form.last_name.trim()) e.last_name = t.lastReq;

    if (!form.birth_date.trim()) {
      e.birth_date = t.birthReq;
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(form.birth_date)) {
      e.birth_date = t.birthFormat;
    } else if (!isAtLeast18(form.birth_date)) {
      e.birth_date = t.ageRule;
    }

    if (!form.password) {
      e.password = t.passReq;
    } else if (!PASSWORD_REGEX.test(form.password)) {
      e.password = t.passRule;
    }

    const hasEmail = Boolean(form.email?.trim());
    const hasPhone = Boolean(form.phone_number?.trim());

    if (!hasEmail && !hasPhone) {
      e.contact = t.contactReq;
    } else {
      if (hasEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email!.trim())) {
        e.email = t.invalidEmail;
      }
      if (hasPhone && !/^\+?[0-9\s\-()]{7,20}$/.test(form.phone_number!.trim())) {
        e.phone_number = t.invalidPhone;
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const setField = (k: keyof RegisterPayload, v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy[k as string];
      delete copy.contact;
      return copy;
    });
    setServerError("");
    setDuplicateContact(false);
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setServerError("");
    setSuccessMsg("");
    setDuplicateContact(false);
    if (!validate()) return;

    setLoading(true);
    try {
      const payload: any = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        password: form.password,
        birth_date: form.birth_date.trim(),
        gender: form.gender,
        account_type: form.account_type,
        email: form.email?.trim() || undefined,
        phone_number: form.phone_number?.trim() || undefined,
        clinic_id: form.clinic_id || undefined,
        height: (form.account_type === "client" && form.height) ? Number(form.height) : undefined,
      };

      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.message?.join?.(" - ") || data?.message || t.registerFail;
        const lowered = String(msg).toLowerCase();
        if (lowered.includes("already") || lowered.includes("zaten") || lowered.includes("email_exists") || lowered.includes("phone_number_exists")) {
          setDuplicateContact(true);
        }
        throw new Error(msg);
      }

      setSuccessMsg(t.successMsg);
      setForm({
        first_name: "",
        last_name: "",
        password: "",
        birth_date: "",
        gender: "male",
        account_type: "client",
        email: "",
        phone_number: "",
        height: "",
        clinic_id: "",
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      setServerError(message || t.genericErr);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`relative min-h-screen w-full overflow-x-hidden flex flex-col justify-between ${
      isDark ? "bg-[#040711] text-white" : "bg-[#f8fafc] text-slate-900"
    }`}>
      {/* Dynamic Background Glows */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {isDark ? (
          <>
            <div className="absolute top-[-10%] left-[-10%] h-[650px] w-[650px] rounded-full bg-emerald-500/15 blur-[140px]" />
            <div className="absolute bottom-[-10%] right-[-10%] h-[650px] w-[650px] rounded-full bg-cyan-500/15 blur-[140px]" />
            <div className="absolute inset-0 bg-grid-pattern opacity-100" />
          </>
        ) : (
          <>
            <div className="absolute top-[-10%] left-[-10%] h-[650px] w-[650px] rounded-full bg-emerald-500/10 blur-[130px]" />
            <div className="absolute bottom-[-10%] right-[-10%] h-[650px] w-[650px] rounded-full bg-cyan-500/10 blur-[130px]" />
            <div className="absolute inset-0 bg-grid-pattern opacity-40" />
          </>
        )}
      </div>

      {/* Global Navigation Header */}
      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 sm:px-8">
        <Link to="/" className="group flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-display font-black text-lg shadow-lg shadow-emerald-500/25 group-hover:scale-105 transition">
            SD
          </div>
          <div>
            <span className="font-display text-xl font-black tracking-tight">SmartDiet</span>
            <span className="block text-[11px] font-bold text-slate-400">{t.brandSub}</span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            to="/features"
            className={`hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border text-xs font-black transition hover:scale-105 ${
              isDark ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20" : "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 shadow-sm"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{lang === "tr" ? "Özellikler" : "Features"}</span>
          </Link>

          <button
            type="button"
            onClick={toggleTheme}
            className={`p-2.5 rounded-2xl border transition hover:scale-105 ${
              isDark ? "border-white/10 bg-slate-900/60 text-slate-300 hover:bg-slate-900" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100 shadow-sm"
            }`}
          >
            {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-700" />}
          </button>

          <button
            type="button"
            onClick={() => setLang(lang === "tr" ? "en" : "tr")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl border text-xs font-black transition hover:scale-105 ${
              isDark ? "border-white/10 bg-slate-900/60 text-slate-300 hover:bg-slate-900" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100 shadow-sm"
            }`}
          >
            <Globe className="h-3.5 w-3.5 text-emerald-400" />
            <span>{lang.toUpperCase()}</span>
          </button>

          <Link
            to="/login"
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 px-5 py-2.5 text-xs font-black text-slate-950 shadow-lg shadow-emerald-500/20 hover:brightness-110 hover:scale-105 transition"
          >
            <span>{t.signIn}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="relative z-10 mx-auto my-auto w-full max-w-7xl px-6 py-8 sm:px-8">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-black text-emerald-400">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{t.headChip}</span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08]">
              {t.titleA}{" "}
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                {t.titleB}
              </span>
            </h1>

            <p className={`text-sm sm:text-base leading-relaxed max-w-xl ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              {t.subtitle}
            </p>

            <div className="space-y-3 pt-2">
              <div className={`flex items-center gap-4 p-4 rounded-2xl border transition ${
                isDark ? "border-white/10 bg-slate-900/60" : "border-slate-200 bg-white/90 shadow-sm"
              }`}>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-500 font-black">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold font-display">Akıllı Makro Analizi</h4>
                  <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-600"}`}>Günlük hedeflerinize göre anlık besin değerleri hesaplaması.</p>
                </div>
              </div>

              <div className={`flex items-center gap-4 p-4 rounded-2xl border transition ${
                isDark ? "border-white/10 bg-slate-900/60" : "border-slate-200 bg-white/90 shadow-sm"
              }`}>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-500/15 text-teal-500 font-black">
                  <Stethoscope className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold font-display">Diyetisyen & Klinik Entegrasyonu</h4>
                  <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-600"}`}>Uzmanınızla kesintisiz iletişim ve randevu koordinasyonu.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className={`relative rounded-[36px] border p-7 sm:p-9 backdrop-blur-2xl shadow-2xl transition-all ${
              isDark ? "border-white/10 bg-slate-900/70 shadow-black/80" : "border-slate-200 bg-white/95 shadow-slate-300/40"
            }`}>
              <div className="mb-6 border-b border-white/5 pb-4">
                <h2 className="font-display text-xl font-black">{t.cardTitle}</h2>
                <p className="text-xs text-slate-400 mt-1">{t.cardSub}</p>
              </div>

              {serverError && (
                <div className="mb-6 p-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 text-xs font-bold text-rose-400">
                  {serverError}
                </div>
              )}

              {duplicateContact && (
                <div className="mb-6 p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 flex items-center justify-between gap-3 text-xs text-amber-300">
                  <span>{lang === "tr" ? "Bu e-posta/telefon zaten kayıtlı. Giriş yapmak ister misiniz?" : "Already registered. Sign in?"}</span>
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs hover:bg-amber-400 transition"
                  >
                    {t.signIn}
                  </button>
                </div>
              )}

              {successMsg && (
                <div className="mb-6 p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between gap-3 text-xs text-emerald-300">
                  <span>{successMsg}</span>
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs hover:bg-emerald-400 transition"
                  >
                    {t.toLoginBtn}
                  </button>
                </div>
              )}

              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">{t.accountType}</label>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setField("account_type", "client")}
                      className={`p-4 rounded-2xl border text-left transition ${
                        form.account_type === "client"
                          ? "border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/30 shadow-lg shadow-emerald-500/10"
                          : "border-white/5 bg-black/20 hover:border-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <UserCheck className={`h-4 w-4 ${form.account_type === "client" ? "text-emerald-400" : "text-slate-400"}`} />
                        <span className="font-display font-black text-xs">{t.clientType}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">{t.clientTypeDesc}</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setField("account_type", "Diyetisyen")}
                      className={`p-4 rounded-2xl border text-left transition ${
                        form.account_type === "Diyetisyen"
                          ? "border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/30 shadow-lg shadow-emerald-500/10"
                          : "border-white/5 bg-black/20 hover:border-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Stethoscope className={`h-4 w-4 ${form.account_type === "Diyetisyen" ? "text-emerald-400" : "text-slate-400"}`} />
                        <span className="font-display font-black text-xs">{t.dietitianType}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">{t.dietitianTypeDesc}</p>
                    </button>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">{t.firstName}</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                      <input
                        type="text"
                        placeholder={t.firstNamePh}
                        value={form.first_name}
                        onChange={(e) => setField("first_name", e.target.value)}
                        className={`w-full rounded-2xl border pl-10 pr-4 py-2.5 text-xs font-semibold outline-none ${
                          errors.first_name ? "border-rose-500/50" : isDark ? "border-white/10 bg-black/40 text-white focus:border-emerald-500" : "border-slate-200 bg-white text-slate-900 focus:border-emerald-500"
                        }`}
                      />
                    </div>
                    {errors.first_name && <p className="text-[10px] font-bold text-rose-400 mt-1">{errors.first_name}</p>}
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">{t.lastName}</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                      <input
                        type="text"
                        placeholder={t.lastNamePh}
                        value={form.last_name}
                        onChange={(e) => setField("last_name", e.target.value)}
                        className={`w-full rounded-2xl border pl-10 pr-4 py-2.5 text-xs font-semibold outline-none ${
                          errors.last_name ? "border-rose-500/50" : isDark ? "border-white/10 bg-black/40 text-white focus:border-emerald-500" : "border-slate-200 bg-white text-slate-900 focus:border-emerald-500"
                        }`}
                      />
                    </div>
                    {errors.last_name && <p className="text-[10px] font-bold text-rose-400 mt-1">{errors.last_name}</p>}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">{t.emailOpt}</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                      <input
                        type="email"
                        placeholder={t.emailPh}
                        value={form.email || ""}
                        onChange={(e) => setField("email", e.target.value)}
                        className={`w-full rounded-2xl border pl-10 pr-4 py-2.5 text-xs font-semibold outline-none ${
                          errors.email || errors.contact ? "border-rose-500/50" : isDark ? "border-white/10 bg-black/40 text-white focus:border-emerald-500" : "border-slate-200 bg-white text-slate-900 focus:border-emerald-500"
                        }`}
                      />
                    </div>
                    {errors.email && <p className="text-[10px] font-bold text-rose-400 mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">{t.phoneOpt}</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                      <input
                        type="tel"
                        placeholder={t.phonePh}
                        value={form.phone_number || ""}
                        onChange={(e) => setField("phone_number", e.target.value)}
                        className={`w-full rounded-2xl border pl-10 pr-4 py-2.5 text-xs font-semibold outline-none ${
                          errors.phone_number || errors.contact ? "border-rose-500/50" : isDark ? "border-white/10 bg-black/40 text-white focus:border-emerald-500" : "border-slate-200 bg-white text-slate-900 focus:border-emerald-500"
                        }`}
                      />
                    </div>
                    {errors.phone_number && <p className="text-[10px] font-bold text-rose-400 mt-1">{errors.phone_number}</p>}
                  </div>
                </div>
                {errors.contact && <p className="text-[10px] font-bold text-rose-400">{errors.contact}</p>}

                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">{t.birthDate}</label>
                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                      <input
                        type="date"
                        value={form.birth_date}
                        onChange={(e) => setField("birth_date", e.target.value)}
                        className={`w-full rounded-2xl border pl-10 pr-4 py-2.5 text-xs font-semibold outline-none ${
                          errors.birth_date ? "border-rose-500/50" : isDark ? "border-white/10 bg-black/40 text-white focus:border-emerald-500" : "border-slate-200 bg-white text-slate-900 focus:border-emerald-500"
                        }`}
                      />
                    </div>
                    {errors.birth_date && <p className="text-[10px] font-bold text-rose-400 mt-1">{errors.birth_date}</p>}
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">{t.gender}</label>
                    <select
                      value={form.gender}
                      onChange={(e) => setField("gender", e.target.value as Gender)}
                      className={`w-full rounded-2xl border px-3.5 py-2.5 text-xs font-semibold outline-none ${
                        isDark ? "border-white/10 bg-black/40 text-white focus:border-emerald-500" : "border-slate-200 bg-white text-slate-900 focus:border-emerald-500"
                      }`}
                    >
                      <option value="male">{t.male}</option>
                      <option value="female">{t.female}</option>
                    </select>
                  </div>

                  {form.account_type === "client" && (
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">{t.height}</label>
                      <div className="relative">
                        <Ruler className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                        <input
                          type="number"
                          placeholder={t.heightPh}
                          value={form.height || ""}
                          onChange={(e) => setField("height", e.target.value)}
                          className={`w-full rounded-2xl border pl-10 pr-4 py-2.5 text-xs font-semibold outline-none ${
                            isDark ? "border-white/10 bg-black/40 text-white focus:border-emerald-500" : "border-slate-200 bg-white text-slate-900 focus:border-emerald-500"
                          }`}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {clinics.length > 0 && (
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">{t.selectClinic}</label>
                    <div className="relative">
                      <Building2 className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                      <select
                        value={form.clinic_id || ""}
                        onChange={(e) => setField("clinic_id", e.target.value)}
                        className={`w-full rounded-2xl border pl-10 pr-4 py-2.5 text-xs font-semibold outline-none ${
                          isDark ? "border-white/10 bg-black/40 text-white focus:border-emerald-500" : "border-slate-200 bg-white text-slate-900 focus:border-emerald-500"
                        }`}
                      >
                        <option value="">{t.clinicPH}</option>
                        {clinics.map((c) => (
                          <option key={c.id} value={c.id}>{c.name} ({c.city})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">{t.password}</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                    <input
                      type={showPass ? "text" : "password"}
                      placeholder="••••••••"
                      value={form.password}
                      onChange={(e) => setField("password", e.target.value)}
                      className={`w-full rounded-2xl border pl-10 pr-10 py-2.5 text-xs font-semibold outline-none ${
                        errors.password ? "border-rose-500/50" : isDark ? "border-white/10 bg-black/40 text-white focus:border-emerald-500" : "border-slate-200 bg-white text-slate-900 focus:border-emerald-500"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3.5 top-3.5 text-slate-500 hover:text-white transition"
                    >
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password ? (
                    <p className="text-[10px] font-bold text-rose-400 mt-1">{errors.password}</p>
                  ) : (
                    <p className="text-[10px] text-slate-500 mt-1">{t.passHint}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-4 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-400 py-3.5 text-xs font-black text-slate-950 shadow-xl shadow-emerald-500/25 hover:brightness-110 active:scale-[0.99] transition disabled:opacity-50"
                >
                  <span>{loading ? t.submitBusy : t.submit}</span>
                  <CheckCircle2 className="h-4 w-4 stroke-[2.5]" />
                </button>

                <div className="pt-2 text-center text-xs text-slate-400 font-medium">
                  {t.haveAccount}{" "}
                  <Link to="/login" className="font-bold text-emerald-400 hover:underline">
                    {t.toLogin}
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/5 py-6 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} SmartDiet. All rights reserved.
      </footer>
    </div>
  );
}
