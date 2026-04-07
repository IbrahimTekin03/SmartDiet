import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppSettings } from "../context/AppSettingsContext";

type Lang = "tr" | "en";
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
};

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

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

const COPY: Record<
  Lang,
  {
    brandSub: string;
    signIn: string;
    headChip: string;
    titleA: string;
    titleB: string;
    subtitle: string;
    pillA: string;
    pillAText: string;
    pillB: string;
    pillBText: string;
    pillC: string;
    pillCText: string;
    cardTitle: string;
    cardSub: string;
    successMsg: string;
    toLoginBtn: string;
    firstName: string;
    lastName: string;
    firstNamePh: string;
    lastNamePh: string;
    emailOpt: string;
    phoneOpt: string;
    emailPh: string;
    phonePh: string;
    birthDate: string;
    gender: string;
    accountType: string;
    clientType: string;
    dietitianType: string;
    male: string;
    female: string;
    password: string;
    passHint: string;
    hide: string;
    show: string;
    submitBusy: string;
    submit: string;
    haveAccount: string;
    toLogin: string;
    firstReq: string;
    lastReq: string;
    birthReq: string;
    birthFormat: string;
    ageRule: string;
    genderReq: string;
    passReq: string;
    passRule: string;
    contactReq: string;
    invalidEmail: string;
    invalidPhone: string;
    registerFail: string;
    genericErr: string;
    selectClinic: string;
    clinicPH: string;
  }
> = {
  tr: {
    brandSub: "Klinik ve Beslenme Yönetimi",
    signIn: "Giriş Yap",
    headChip: "Hesabını oluştur ve platforma güvenle başla",
    titleA: "SmartDiet'e",
    titleB: "kayıt ol",
    subtitle: "Danışan yönetimi, plan oluşturma, ölçüm takibi ve iletişim süreçlerini tek panelden yürüt.",
    pillA: "Abonelik",
    pillAText: "Aktif / dondur / iptal",
    pillB: "Ölçüm",
    pillBText: "Geçmişe dönük takip",
    pillC: "Sohbet",
    pillCText: "Fotoğraf ve görüldü bilgisi",
    cardTitle: "Kayıt Oluştur",
    cardSub: "E-posta veya telefon alanlarından en az birini doldurarak hesabını oluştur.",
    successMsg: "Kayıt başarıyla oluşturuldu. Şimdi giriş yapabilirsin.",
    toLoginBtn: "Girişe Git",
    firstName: "İsim",
    lastName: "Soyisim",
    firstNamePh: "İsim",
    lastNamePh: "Soyisim",
    emailOpt: "E-posta (opsiyonel)",
    phoneOpt: "Telefon (opsiyonel)",
    emailPh: "ornek@example.com",
    phonePh: "+905555555555",
    birthDate: "Doğum Tarihi",
    gender: "Cinsiyet",
    accountType: "Hesap Türü",
    clientType: "Kullanıcı",
    dietitianType: "Diyetisyen",
    male: "Erkek",
    female: "Kadın",
    password: "Şifre",
    passHint: "En az 8 karakter; büyük harf, küçük harf, rakam ve özel karakter içermelidir.",
    hide: "Gizle",
    show: "Göster",
    submitBusy: "Kayıt oluşturuluyor...",
    submit: "Kayıt Ol",
    haveAccount: "Zaten hesabın var mı?",
    toLogin: "Giriş yap",
    firstReq: "İsim zorunludur.",
    lastReq: "Soyisim zorunludur.",
    birthReq: "Doğum tarihi zorunludur.",
    birthFormat: "Geçerli format: YYYY-MM-DD",
    ageRule: "Kayıt olmak için en az 18 yaşında olmalısın.",
    genderReq: "Cinsiyet seçimi zorunludur.",
    passReq: "Şifre zorunludur.",
    passRule: "Şifren en az 8 karakter olmalı; büyük harf, küçük harf, rakam ve özel karakter içermelidir.",
    contactReq: "E-posta veya telefon alanlarından en az biri zorunludur.",
    invalidEmail: "Geçerli bir e-posta adresi gir.",
    invalidPhone: "Geçerli bir telefon numarası gir. Örnek: +905555555555",
    registerFail: "Kayıt oluşturulamadı. Bilgilerini kontrol ederek tekrar dene.",
    genericErr: "Beklenmeyen bir hata oluştu.",
    selectClinic: "Klinik Seçin (İsteğe Bağlı)",
    clinicPH: "Hizmet aldığınız kliniği seçin",
  },
  en: {
    brandSub: "Clinic and Nutrition Management",
    signIn: "Sign In",
    headChip: "Create your account and manage your clinic",
    titleA: "Sign up to",
    titleB: "SmartDiet",
    subtitle: "Manage clients, create plans, track measurements and run messaging from one panel.",
    pillA: "Subscription",
    pillAText: "Activate / pause / cancel",
    pillB: "Measurement",
    pillBText: "Historical tracking",
    pillC: "Chat",
    pillCText: "Photo and seen status",
    cardTitle: "Create Account",
    cardSub: "Fill at least one of email or phone.",
    successMsg: "Registration completed. Do you want to sign in now?",
    toLoginBtn: "Go to Sign In",
    firstName: "First Name",
    lastName: "Last Name",
    firstNamePh: "First Name",
    lastNamePh: "Last Name",
    emailOpt: "Email (optional)",
    phoneOpt: "Phone (optional)",
    emailPh: "example@email.com",
    phonePh: "+905555555555",
    birthDate: "Birth Date",
    gender: "Gender",
    accountType: "Account Type",
    clientType: "Client",
    dietitianType: "Dietitian",
    male: "Male",
    female: "Female",
    password: "Password",
    passHint: "At least 8 chars, 1 upper, 1 lower, 1 number, 1 special (@$!%*?&)",
    hide: "Hide",
    show: "Show",
    submitBusy: "Creating account...",
    submit: "Sign Up",
    haveAccount: "Already have an account?",
    toLogin: "Sign in",
    firstReq: "First name is required.",
    lastReq: "Last name is required.",
    birthReq: "Birth date is required.",
    birthFormat: "Valid format: YYYY-MM-DD",
    ageRule: "You must be at least 18 years old to register.",
    genderReq: "Gender is required.",
    passReq: "Password is required.",
    passRule: "Password must include 8+ chars, upper, lower, number and special character.",
    contactReq: "At least one of email or phone is required.",
    invalidEmail: "Enter a valid email.",
    invalidPhone: "Enter a valid phone number. Example: +905555555555",
    registerFail: "Registration failed. Check your details.",
    genericErr: "An error occurred.",
    selectClinic: "Select Clinic (Optional)",
    clinicPH: "Select the clinic you receive service from",
  },
};

export default function Register() {
  const navigate = useNavigate();

  const API_BASE = "http://localhost:3000";
  const REGISTER_URL = `${API_BASE}/api/auth/register`;
  const { lang, isDark } = useAppSettings();
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
      .then((d) => setClinics(Array.isArray(d) ? d : []))
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

    if (!form.gender) e.gender = t.genderReq;

    if (!form.password) {
      e.password = t.passReq;
    } else if (!PASSWORD_REGEX.test(form.password)) {
      e.password = t.passRule;
    }

    const email = form.email?.trim();
    const phone = form.phone_number?.trim();

    if (!email && !phone) {
      e.contact = t.contactReq;
    } else {
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = t.invalidEmail;
      if (phone && !/^\+?[0-9\s()-]{10,}$/.test(phone)) e.phone_number = t.invalidPhone;
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
      const payload: RegisterPayload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        password: form.password,
        birth_date: form.birth_date.trim(),
        gender: form.gender,
        account_type: form.account_type,
        email: form.email?.trim() || undefined,
        phone_number: form.phone_number?.trim() || undefined,
        clinic_id: form.clinic_id || undefined,
      };

      const res = await fetch(REGISTER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.message?.join?.(" - ") || data?.message || t.registerFail;
        const lowered = String(msg).toLowerCase();
        if (
          lowered.includes("already") ||
          lowered.includes("zaten") ||
          lowered.includes("email_exists") ||
          lowered.includes("phone_number_exists")
        ) {
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
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      setServerError(message || t.genericErr);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div
          className={
            isDark
              ? "absolute inset-0 opacity-100 [background:radial-gradient(1100px_700px_at_18%_15%,rgba(16,185,129,0.18),transparent_60%),radial-gradient(900px_700px_at_90%_20%,rgba(20,184,166,0.12),transparent_60%),radial-gradient(900px_700px_at_60%_95%,rgba(56,189,248,0.10),transparent_60%),linear-gradient(180deg,#050608,#07090b_55%,#050608)]"
              : "absolute inset-0 opacity-[0.99] [background:radial-gradient(1180px_740px_at_12%_0%,rgba(22,128,101,0.23),transparent_58%),radial-gradient(980px_640px_at_92%_8%,rgba(20,120,133,0.16),transparent_56%),radial-gradient(980px_680px_at_52%_108%,rgba(34,117,91,0.14),transparent_62%),linear-gradient(180deg,#e8f0eb,#dee8e2_56%,#dbe5df)]"
          }
        />
        <div
          className={
            isDark
              ? "absolute inset-0 opacity-[0.10] [background-image:radial-gradient(rgba(255,255,255,0.14)_1px,transparent_1px)] [background-size:18px_18px]"
              : "absolute inset-0 opacity-[0.12] [background-image:radial-gradient(rgba(8,37,31,0.11)_1px,transparent_1px)] [background-size:22px_22px]"
          }
        />
        <div className={isDark ? "absolute -top-56 -left-56 h-[720px] w-[720px] rounded-full bg-emerald-500/15 blur-[120px]" : "absolute -top-56 -left-56 h-[720px] w-[720px] rounded-full bg-emerald-600/16 blur-[120px]"} />
        <div className={isDark ? "absolute -bottom-72 -right-72 h-[820px] w-[820px] rounded-full bg-teal-400/12 blur-[140px]" : "absolute -bottom-72 -right-72 h-[820px] w-[820px] rounded-full bg-teal-400/12 blur-[140px]"} />
      </div>

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Link to="/" className="flex items-center gap-3">
          <div className={isDark ? "grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/15 ring-1 ring-emerald-400/20" : "grid h-10 w-10 place-items-center rounded-xl bg-emerald-600/15 ring-1 ring-emerald-700/20"}>
            <span className={isDark ? "text-sm font-extrabold text-emerald-200" : "text-sm font-extrabold text-emerald-800"}>SD</span>
          </div>
          <div className="leading-tight">
            <div className={isDark ? "text-sm font-semibold text-white" : "text-sm font-semibold text-[#0e2d27]"}>SmartDiet</div>
            <div className={isDark ? "text-xs text-zinc-400" : "text-xs text-[#4d6b62]"}>{t.brandSub}</div>
          </div>
        </Link>

        <Link
          to="/login"
          className={isDark ? "rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-zinc-100 hover:bg-white/10" : "rounded-full border border-[#325d51]/25 bg-[#eaf2ed]/82 px-4 py-2 text-xs font-semibold text-[#1a4037] hover:bg-[#f3f7f4]"}
        >
          {t.signIn}
        </Link>
      </header>

      <main className="relative z-10 mx-auto grid w-full max-w-6xl grid-cols-1 gap-10 px-4 pb-14 pt-4 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:items-center">
        <section className="lg:pr-6">
          <div className={isDark ? "inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-100" : "inline-flex items-center gap-2 rounded-full border border-emerald-700/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-900"}>
            <span className={isDark ? "h-2 w-2 rounded-full bg-emerald-400" : "h-2 w-2 rounded-full bg-emerald-600"} />
            {t.headChip}
          </div>

          <h1 className={isDark ? "mt-5 text-[40px] font-extrabold leading-[1.05] tracking-tight text-white sm:text-[52px]" : "mt-5 text-[40px] font-extrabold leading-[1.05] tracking-tight text-[#0e2d27] sm:text-[52px]"}>
            {t.titleA}{" "}
            <span className={isDark ? "bg-gradient-to-r from-emerald-300 to-teal-200 bg-clip-text text-transparent" : "bg-gradient-to-r from-[#135241] to-[#0f6b66] bg-clip-text text-transparent"}>
              {t.titleB}
            </span>
            .
          </h1>

          <p className={isDark ? "mt-4 max-w-xl text-sm leading-7 text-zinc-300 sm:text-base" : "mt-4 max-w-xl text-sm leading-7 text-[#36544c] sm:text-base"}>
            {t.subtitle}
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <InfoPill isDark={isDark} icon="AB" title={t.pillA} desc={t.pillAText} />
            <InfoPill isDark={isDark} icon="OL" title={t.pillB} desc={t.pillBText} />
            <InfoPill isDark={isDark} icon="SB" title={t.pillC} desc={t.pillCText} />
          </div>
        </section>

        <section>
          <div className={isDark ? "rounded-[26px] border border-white/10 bg-white/5 p-5 shadow-[0_40px_140px_rgba(0,0,0,0.65)] backdrop-blur sm:p-7" : "rounded-[26px] border border-[#325d51]/25 bg-[#eaf2ed]/84 p-5 shadow-[0_40px_120px_rgba(8,22,20,0.12)] backdrop-blur sm:p-7"}>
            <div className="mb-5">
              <div className={isDark ? "text-base font-extrabold text-white" : "text-base font-extrabold text-[#0e2d27]"}>{t.cardTitle}</div>
              <div className={isDark ? "mt-1 text-xs text-zinc-400" : "mt-1 text-xs text-[#4d6b62]"}>{t.cardSub}</div>
            </div>

            {serverError ? <div className="mb-4 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{serverError}</div> : null}
            {duplicateContact ? (
              <div className={isDark ? "mb-4 flex items-center justify-between gap-3 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100" : "mb-4 flex items-center justify-between gap-3 rounded-xl border border-amber-700/35 bg-amber-100 px-4 py-3 text-sm text-amber-900"}>
                <span>{lang === "tr" ? "Bu e-posta/telefon zaten kayıtlı. Giriş yapmak ister misin?" : "This email/phone is already registered. Do you want to sign in?"}</span>
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className={isDark ? "rounded-lg bg-amber-300 px-3 py-1.5 text-xs font-bold text-zinc-900 hover:brightness-110" : "rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white hover:brightness-110"}
                >
                  {lang === "tr" ? "Girişe Git" : "Go to Sign In"}
                </button>
              </div>
            ) : null}
            {successMsg ? (
              <div className={isDark ? "mb-4 flex items-center justify-between gap-3 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100" : "mb-4 flex items-center justify-between gap-3 rounded-xl border border-[#1b7358]/35 bg-[#dff0e8] px-4 py-3 text-sm text-[#145443]"}>
                <span>{successMsg}</span>
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className={isDark ? "rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-zinc-950 hover:brightness-110" : "rounded-lg bg-gradient-to-r from-[#1a7f5b] to-[#167f72] px-3 py-1.5 text-xs font-bold text-white hover:brightness-110"}
                >
                  {t.toLoginBtn}
                </button>
              </div>
            ) : null}

            <form onSubmit={submit} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field isDark={isDark} label={t.firstName} value={form.first_name} onChange={(v) => setField("first_name", v)} placeholder={t.firstNamePh} error={errors.first_name} />
                <Field isDark={isDark} label={t.lastName} value={form.last_name} onChange={(v) => setField("last_name", v)} placeholder={t.lastNamePh} error={errors.last_name} />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field isDark={isDark} label={t.emailOpt} value={form.email ?? ""} onChange={(v) => setField("email", v)} placeholder={t.emailPh} error={errors.email} />
                <Field isDark={isDark} label={t.phoneOpt} value={form.phone_number ?? ""} onChange={(v) => setField("phone_number", v)} placeholder={t.phonePh} error={errors.phone_number} />
              </div>
              {errors.contact ? <div className="text-xs text-rose-200">{errors.contact}</div> : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <Field isDark={isDark} label={t.birthDate} value={form.birth_date} onChange={(v) => setField("birth_date", v)} placeholder="YYYY-MM-DD" error={errors.birth_date} type="date" />

                <div>
                  <label className={isDark ? "mb-2 block text-xs font-semibold text-zinc-200" : "mb-2 block text-xs font-semibold text-[#36544c]"}>{t.gender}</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setField("gender", "male")}
                      className={[
                        "rounded-2xl border px-4 py-3 text-sm font-extrabold transition",
                        form.gender === "male"
                          ? isDark
                            ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-100 shadow-[0_0_0_1px_rgba(16,185,129,0.18)_inset]"
                            : "border-[#1b7358]/35 bg-[#dff0e8] text-[#145443] shadow-[0_0_0_1px_rgba(26,127,91,0.18)_inset]"
                          : isDark
                            ? "border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10"
                            : "border-[#325d51]/25 bg-white text-[#36544c] hover:bg-[#d7e4de]",
                      ].join(" ")}
                    >
                      {t.male}
                    </button>
                    <button
                      type="button"
                      onClick={() => setField("gender", "female")}
                      className={[
                        "rounded-2xl border px-4 py-3 text-sm font-extrabold transition",
                        form.gender === "female"
                          ? isDark
                            ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-100 shadow-[0_0_0_1px_rgba(16,185,129,0.18)_inset]"
                            : "border-[#1b7358]/35 bg-[#dff0e8] text-[#145443] shadow-[0_0_0_1px_rgba(26,127,91,0.18)_inset]"
                          : isDark
                            ? "border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10"
                            : "border-[#325d51]/25 bg-white text-[#36544c] hover:bg-[#d7e4de]",
                      ].join(" ")}
                    >
                      {t.female}
                    </button>
                  </div>
                  {errors.gender ? <div className="mt-2 text-xs text-rose-200">{errors.gender}</div> : null}
                </div>
              </div>

              <div>
                <label className={isDark ? "mb-2 block text-xs font-semibold text-zinc-200" : "mb-2 block text-xs font-semibold text-[#36544c]"}>{t.accountType}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setField("account_type", "client")}
                    className={[
                      "rounded-2xl border px-4 py-3 text-sm font-extrabold transition",
                      form.account_type === "client"
                        ? isDark
                          ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-100"
                          : "border-[#1b7358]/35 bg-[#dff0e8] text-[#145443]"
                        : isDark
                          ? "border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10"
                          : "border-[#325d51]/25 bg-white text-[#36544c] hover:bg-[#d7e4de]",
                    ].join(" ")}
                  >
                    {t.clientType}
                  </button>
                  <button
                    type="button"
                    onClick={() => setField("account_type", "Diyetisyen")}
                    className={[
                      "rounded-2xl border px-4 py-3 text-sm font-extrabold transition",
                      form.account_type === "Diyetisyen"
                        ? isDark
                          ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-100"
                          : "border-[#1b7358]/35 bg-[#dff0e8] text-[#145443]"
                        : isDark
                          ? "border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10"
                          : "border-[#325d51]/25 bg-white text-[#36544c] hover:bg-[#d7e4de]",
                    ].join(" ")}
                  >
                    {t.dietitianType}
                  </button>
                </div>
              </div>

              {form.account_type === "client" && clinics.length > 0 && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className={isDark ? "mb-2 block text-xs font-semibold text-zinc-200" : "mb-2 block text-xs font-semibold text-[#36544c]"}>
                    {t.selectClinic}
                  </label>
                  <select
                    value={form.clinic_id || ""}
                    onChange={(e) => setField("clinic_id", e.target.value)}
                    className={[
                      "w-full rounded-2xl border px-4 py-3 text-sm outline-none transition",
                      isDark ? "bg-black/20 text-white" : "bg-white text-[#0e2d27]",
                      isDark ? "border-white/10" : "border-[#325d51]/25",
                      "focus:border-emerald-400/40 focus:ring-4 focus:ring-emerald-500/10",
                    ].join(" ")}
                  >
                    <option value="">{t.clinicPH}</option>
                    {clinics.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} - {c.city}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className={isDark ? "mb-2 block text-xs font-semibold text-zinc-200" : "mb-2 block text-xs font-semibold text-[#36544c]"}>{t.password}</label>
                <div className="relative">
                  <input
                    value={form.password}
                    onChange={(e) => setField("password", e.target.value)}
                    type={showPass ? "text" : "password"}
                    placeholder="StrongP@ssw0rd"
                    className={[
                      "w-full rounded-2xl border px-4 py-3 pr-12 text-sm outline-none transition",
                      isDark ? "bg-black/20 text-white" : "bg-white text-[#0e2d27]",
                      errors.password ? "border-rose-500/40" : isDark ? "border-white/10" : "border-[#325d51]/25",
                      "focus:border-emerald-400/40 focus:ring-4 focus:ring-emerald-500/10",
                    ].join(" ")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((p) => !p)}
                    className={isDark ? "absolute right-3 top-1/2 -translate-y-1/2 rounded-xl border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-semibold text-zinc-200 hover:bg-white/10" : "absolute right-3 top-1/2 -translate-y-1/2 rounded-xl border border-[#325d51]/25 bg-[#d7e4de] px-2 py-1 text-[11px] font-semibold text-[#36544c] hover:bg-[#c9dad3]"}
                  >
                    {showPass ? t.hide : t.show}
                  </button>
                </div>
                {errors.password ? (
                  <div className="mt-2 text-xs text-rose-200">{errors.password}</div>
                ) : (
                  <div className={isDark ? "mt-2 text-[11px] text-zinc-400" : "mt-2 text-[11px] text-[#4d6b62]"}>
                    {t.passHint}
                  </div>
                )}
              </div>

              <button
                disabled={loading}
                type="submit"
                className="mt-2 w-full rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-300 px-5 py-3 text-sm font-extrabold text-zinc-950 shadow-[0_18px_60px_rgba(16,185,129,0.20)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? t.submitBusy : t.submit}
              </button>

              <div className={isDark ? "pt-2 text-center text-xs text-zinc-400" : "pt-2 text-center text-xs text-[#4d6b62]"}>
                {t.haveAccount}{" "}
                <Link to="/login" className={isDark ? "font-semibold text-emerald-200 hover:underline" : "font-semibold text-emerald-700 hover:underline"}>
                  {t.toLogin}
                </Link>
              </div>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}

function Field({
  isDark,
  label,
  value,
  onChange,
  placeholder,
  error,
  type = "text",
}: {
  isDark: boolean;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  type?: string;
}) {
  return (
    <div>
      <label className={isDark ? "mb-2 block text-xs font-semibold text-zinc-200" : "mb-2 block text-xs font-semibold text-[#36544c]"}>{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        className={[
          "w-full rounded-2xl border px-4 py-3 text-sm outline-none transition",
          isDark ? "bg-black/20 text-white" : "bg-white text-[#0e2d27]",
          error ? "border-rose-500/40" : isDark ? "border-white/10" : "border-[#325d51]/25",
          "focus:border-emerald-400/40 focus:ring-4 focus:ring-emerald-500/10",
        ].join(" ")}
      />
      {error ? <div className="mt-2 text-xs text-rose-200">{error}</div> : null}
    </div>
  );
}

function InfoPill({ isDark, icon, title, desc }: { isDark: boolean; icon: string; title: string; desc: string }) {
  return (
    <div className={isDark ? "rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur" : "rounded-2xl border border-[#325d51]/25 bg-[#eaf2ed]/84 p-4 backdrop-blur"}>
      <div className="flex items-center justify-between">
        <div className={isDark ? "text-sm font-extrabold text-white" : "text-sm font-extrabold text-[#0e2d27]"}>{title}</div>
        <div className={isDark ? "text-sm text-zinc-300" : "text-sm text-[#36544c]"}>{icon}</div>
      </div>
      <div className={isDark ? "mt-1 text-xs text-zinc-400" : "mt-1 text-xs text-[#4d6b62]"}>{desc}</div>
    </div>
  );
}

