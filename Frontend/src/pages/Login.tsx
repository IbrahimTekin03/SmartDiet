import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

type Theme = "dark" | "light";
type Lang = "tr" | "en";

type LoginPayload = {
  email?: string;
  phone_number?: string;
  password: string;
};

const COPY: Record<
  Lang,
  {
    brandSub: string;
    signUp: string;
    secureLogin: string;
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
    emailMode: string;
    phoneMode: string;
    email: string;
    phone: string;
    password: string;
    hide: string;
    show: string;
    loginBusy: string;
    login: string;
    noAccount: string;
    toRegister: string;
    contactReq: string;
    invalidEmail: string;
    invalidPhone: string;
    passwordReq: string;
    loginFail: string;
    genericErr: string;
    emailPh: string;
    phonePh: string;
  }
> = {
  tr: {
    brandSub: "Klinik ve Diyet Yonetimi",
    signUp: "Kayit Ol",
    secureLogin: "Guvenli giris",
    titleA: "Hesabina",
    titleB: "giris yap",
    subtitle: "Danisanlarin, planlarin, olcum raporlarin ve sohbetlerin tek panelde.",
    pillA: "Tek Panel",
    pillAText: "Akis tek yerde",
    pillB: "Takip",
    pillBText: "Olcum ve uyum",
    pillC: "Mesaj",
    pillCText: "Anlik iletisim",
    cardTitle: "Giris Yap",
    cardSub: "E-posta veya telefon ile giris yapabilirsin.",
    emailMode: "Email",
    phoneMode: "Telefon",
    email: "E-posta",
    phone: "Telefon",
    password: "Sifre",
    hide: "Gizle",
    show: "Goster",
    loginBusy: "Giris yapiliyor...",
    login: "Giris Yap",
    noAccount: "Hesabin yok mu?",
    toRegister: "Kayit ol",
    contactReq: "E-posta veya telefon alanlarindan en az birini doldurmalisin.",
    invalidEmail: "Gecerli bir e-posta gir.",
    invalidPhone: "Gecerli bir telefon gir. Ornek: +905555555555",
    passwordReq: "Sifre zorunlu.",
    loginFail: "Giris basarisiz. Bilgileri kontrol et.",
    genericErr: "Bir hata olustu.",
    emailPh: "ornek@example.com",
    phonePh: "+905555555555",
  },
  en: {
    brandSub: "Clinic and Nutrition Management",
    signUp: "Sign Up",
    secureLogin: "Secure login",
    titleA: "Sign in to",
    titleB: "your account",
    subtitle: "Clients, plans, measurements and chat in a single panel.",
    pillA: "Single Panel",
    pillAText: "One flow",
    pillB: "Tracking",
    pillBText: "Measurement and adherence",
    pillC: "Messages",
    pillCText: "Real-time communication",
    cardTitle: "Sign In",
    cardSub: "You can sign in with email or phone.",
    emailMode: "Email",
    phoneMode: "Phone",
    email: "Email",
    phone: "Phone",
    password: "Password",
    hide: "Hide",
    show: "Show",
    loginBusy: "Signing in...",
    login: "Sign In",
    noAccount: "Don't have an account?",
    toRegister: "Sign up",
    contactReq: "You must fill at least one: email or phone.",
    invalidEmail: "Enter a valid email.",
    invalidPhone: "Enter a valid phone number. Example: +905555555555",
    passwordReq: "Password is required.",
    loginFail: "Login failed. Check your information.",
    genericErr: "An error occurred.",
    emailPh: "example@email.com",
    phonePh: "+905555555555",
  },
};

export default function Login() {
  const navigate = useNavigate();

  const API_BASE = "http://localhost:3000";
  const LOGIN_URL = `${API_BASE}/api/auth/login`;

  const [theme] = useState<Theme>(() => {
    const saved = localStorage.getItem("sd_theme") as Theme | null;
    return saved === "dark" ? "dark" : "light";
  });
  const [lang] = useState<Lang>(() => {
    const saved = localStorage.getItem("sd_lang") as Lang | null;
    return saved === "en" ? "en" : "tr";
  });
  const isDark = theme === "dark";
  const t = COPY[lang];

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const [mode, setMode] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");

  const validate = () => {
    const e: Record<string, string> = {};
    const eMail = email.trim();
    const p = phone.trim();

    if (!eMail && !p) e.contact = t.contactReq;
    if (eMail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(eMail)) e.email = t.invalidEmail;
    if (p && !/^\+?[0-9\s()-]{10,}$/.test(p)) e.phone_number = t.invalidPhone;
    if (!password) e.password = t.passwordReq;

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setServerError("");
    if (!validate()) return;

    setLoading(true);
    try {
      const payload: LoginPayload = {
        password,
        email: email.trim() || undefined,
        phone_number: phone.trim() || undefined,
      };

      const res = await fetch(LOGIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.message?.join?.(" - ") || data?.message || t.loginFail;
        throw new Error(msg);
      }

      const result = data?.data ?? data;
      const accessToken = result?.accessToken;
      const refreshToken = result?.refreshToken;
      const user = result?.user;

      if (accessToken) localStorage.setItem("access_token", accessToken);
      if (refreshToken) localStorage.setItem("refresh_token", refreshToken);
      if (user) localStorage.setItem("sd_user", JSON.stringify(user));

      navigate("/");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      if (message.toLowerCase().includes("failed to fetch")) {
        setServerError(lang === "tr" ? "Sunucuya baglanilamadi. Backend calisiyor mu kontrol et." : "Could not connect to server. Check if backend is running.");
      } else {
        setServerError(message || t.genericErr);
      }
    } finally {
      setLoading(false);
    }
  };

  const clearContactErrors = () => {
    setErrors((prev) => {
      const c = { ...prev };
      delete c.contact;
      delete c.email;
      delete c.phone_number;
      return c;
    });
    setServerError("");
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
          to="/register"
          className={isDark ? "rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-zinc-950 hover:brightness-110" : "rounded-full bg-gradient-to-r from-[#1a7f5b] to-[#167f72] px-4 py-2 text-xs font-semibold text-white hover:brightness-110"}
        >
          {t.signUp}
        </Link>
      </header>

      <main className="relative z-10 mx-auto grid w-full max-w-6xl grid-cols-1 gap-10 px-4 pb-14 pt-4 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:items-center">
        <section className="lg:pr-6">
          <div className={isDark ? "inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-100" : "inline-flex items-center gap-2 rounded-full border border-emerald-700/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-900"}>
            <span className={isDark ? "h-2 w-2 rounded-full bg-emerald-400" : "h-2 w-2 rounded-full bg-emerald-600"} />
            {t.secureLogin}
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
            <InfoPill isDark={isDark} icon="PI" title={t.pillA} desc={t.pillAText} />
            <InfoPill isDark={isDark} icon="TK" title={t.pillB} desc={t.pillBText} />
            <InfoPill isDark={isDark} icon="MS" title={t.pillC} desc={t.pillCText} />
          </div>
        </section>

        <section>
          <div className={isDark ? "rounded-[26px] border border-white/10 bg-white/5 p-5 shadow-[0_40px_140px_rgba(0,0,0,0.65)] backdrop-blur sm:p-7" : "rounded-[26px] border border-[#325d51]/25 bg-[#eaf2ed]/84 p-5 shadow-[0_40px_120px_rgba(8,22,20,0.12)] backdrop-blur sm:p-7"}>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className={isDark ? "text-base font-extrabold text-white" : "text-base font-extrabold text-[#0e2d27]"}>{t.cardTitle}</div>
                <div className={isDark ? "mt-1 text-xs text-zinc-400" : "mt-1 text-xs text-[#4d6b62]"}>{t.cardSub}</div>
              </div>

              <div className={isDark ? "inline-flex rounded-2xl border border-white/10 bg-black/20 p-1" : "inline-flex rounded-2xl border border-[#325d51]/25 bg-[#eaf2ed]/84 p-1"}>
                <button
                  type="button"
                  onClick={() => {
                    setMode("email");
                    clearContactErrors();
                  }}
                  className={[
                    "rounded-xl px-3 py-2 text-xs font-extrabold transition",
                    mode === "email"
                      ? isDark
                        ? "bg-emerald-500/20 text-emerald-100"
                        : "bg-emerald-600/15 text-emerald-800"
                      : isDark
                        ? "text-zinc-300 hover:bg-white/5"
                        : "text-[#36544c] hover:bg-[#d7e4de]",
                  ].join(" ")}
                >
                  {t.emailMode}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("phone");
                    clearContactErrors();
                  }}
                  className={[
                    "rounded-xl px-3 py-2 text-xs font-extrabold transition",
                    mode === "phone"
                      ? isDark
                        ? "bg-emerald-500/20 text-emerald-100"
                        : "bg-emerald-600/15 text-emerald-800"
                      : isDark
                        ? "text-zinc-300 hover:bg-white/5"
                        : "text-[#36544c] hover:bg-[#d7e4de]",
                  ].join(" ")}
                >
                  {t.phoneMode}
                </button>
              </div>
            </div>

            {serverError ? <div className="mb-4 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{serverError}</div> : null}

            <form onSubmit={submit} className="space-y-4" autoComplete="on">
              {mode === "email" ? (
                <Field isDark={isDark} label={t.email} value={email} onChange={(v) => {
                  setEmail(v);
                  setErrors((p) => ({ ...p, email: "", contact: "" }));
                  setServerError("");
                }} placeholder={t.emailPh} error={errors.email} autoComplete="email" name="email" />
              ) : (
                <Field isDark={isDark} label={t.phone} value={phone} onChange={(v) => {
                  setPhone(v);
                  setErrors((p) => ({ ...p, phone_number: "", contact: "" }));
                  setServerError("");
                }} placeholder={t.phonePh} error={errors.phone_number} autoComplete="tel" name="phone" />
              )}

              {errors.contact ? <div className="text-xs text-rose-200">{errors.contact}</div> : null}

              <div>
                <label className={isDark ? "mb-2 block text-xs font-semibold text-zinc-200" : "mb-2 block text-xs font-semibold text-[#36544c]"}>{t.password}</label>
                <div className="relative">
                  <input
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrors((p) => ({ ...p, password: "" }));
                      setServerError("");
                    }}
                    type={showPass ? "text" : "password"}
                    placeholder="********"
                    autoComplete="current-password"
                    name="password"
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
                {errors.password ? <div className="mt-2 text-xs text-rose-200">{errors.password}</div> : null}
              </div>

              <button
                disabled={loading}
                type="submit"
                className="mt-2 w-full rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-300 px-5 py-3 text-sm font-extrabold text-zinc-950 shadow-[0_18px_60px_rgba(16,185,129,0.20)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? t.loginBusy : t.login}
              </button>

              <div className={isDark ? "pt-2 text-center text-xs text-zinc-400" : "pt-2 text-center text-xs text-[#4d6b62]"}>
                {t.noAccount}{" "}
                <Link to="/register" className={isDark ? "font-semibold text-emerald-200 hover:underline" : "font-semibold text-emerald-700 hover:underline"}>
                  {t.toRegister}
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
  autoComplete,
  name,
}: {
  isDark: boolean;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  type?: string;
  autoComplete?: string;
  name?: string;
}) {
  return (
    <div>
      <label className={isDark ? "mb-2 block text-xs font-semibold text-zinc-200" : "mb-2 block text-xs font-semibold text-[#36544c]"}>{label}</label>
      <input
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        autoComplete={autoComplete}
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

