import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAppSettings } from "../context/AppSettingsContext";
import { API_BASE_URL as API_BASE } from "../lib/api";
import { Lock, Eye, EyeOff, KeyRound, CheckCircle2, AlertCircle, ArrowRight, Activity } from "lucide-react";

type Lang = "tr" | "en";

const RESET_PASSWORD_URL = `${API_BASE}/api/auth/reset-password`;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const COPY = {
  tr: {
    title: "Yeni Şifre Belirle",
    subtitle: "E-postanıza gönderilen güvenli bağlantı ile şifrenizi yenileyin.",
    password: "Yeni Şifre",
    confirmPassword: "Yeni Şifre (Tekrar)",
    hint: "En az 8 karakter, büyük/küçük harf, rakam ve özel karakter içermelidir.",
    submit: "Şifreyi Güncelle",
    submitting: "Güncelleniyor...",
    success: "Şifreniz başarıyla güncellendi! Giriş sayfasına yönlendiriliyorsunuz.",
    invalidToken: "Şifre yenileme bağlantısı geçersiz veya süresi dolmuş.",
    mismatch: "Girdiğiniz şifreler birbiriyle eşleşmiyor.",
    passwordRule: "Lütfen kriterlere uygun güçlü bir şifre belirleyin.",
    goLogin: "Giriş Yap",
    backHome: "Ana Sayfa",
  },
  en: {
    title: "Set a New Password",
    subtitle: "Use the secure link from your email to update your password.",
    password: "New Password",
    confirmPassword: "Confirm Password",
    hint: "Use at least 8 characters with uppercase, lowercase, number and symbol.",
    submit: "Update Password",
    submitting: "Updating...",
    success: "Your password was updated successfully! Redirecting to login.",
    invalidToken: "This password reset token is invalid or expired.",
    mismatch: "Passwords do not match.",
    passwordRule: "Please enter a stronger password meeting all requirements.",
    goLogin: "Back to Login",
    backHome: "Home",
  },
};

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { lang, isDark } = useAppSettings();
  const t = COPY[lang as Lang] || COPY.tr;
  const token = useMemo(() => searchParams.get("token")?.trim() || "", [searchParams]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError(t.invalidToken);
      return;
    }
    if (!PASSWORD_REGEX.test(password)) {
      setError(t.passwordRule);
      return;
    }
    if (password !== confirmPassword) {
      setError(t.mismatch);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(RESET_PASSWORD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || t.invalidToken);
      }

      setSuccess(t.success);
      setPassword("");
      setConfirmPassword("");
      window.setTimeout(() => navigate("/login", { replace: true }), 1500);
    } catch (err: unknown) {
      setError((err as Error).message || t.invalidToken);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`relative min-h-screen w-full flex items-center justify-center p-4 ${
      isDark ? "bg-[#040711] text-white" : "bg-[#f8fafc] text-slate-900"
    }`}>
      {/* Glows */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-emerald-500/10 blur-[130px]" />
      </div>

      <div className={`relative z-10 w-full max-w-md rounded-[36px] border p-8 sm:p-10 shadow-2xl backdrop-blur-2xl transition-all ${
        isDark ? "border-white/10 bg-slate-900/70 shadow-black/80" : "border-slate-200 bg-white/90 shadow-slate-300/40"
      }`}>
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition">
            <Activity className="h-4 w-4 text-emerald-400" />
            <span>{t.backHome}</span>
          </Link>
          <Link to="/login" className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition">
            {t.goLogin}
          </Link>
        </div>

        <div className="mt-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 mb-3 shadow-md shadow-emerald-500/15">
            <KeyRound className="h-7 w-7" />
          </div>
          <h1 className="font-display text-2xl font-black tracking-tight">{t.title}</h1>
          <p className={`mt-2 text-xs leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            {t.subtitle}
          </p>
        </div>

        {error && (
          <div className="mt-6 flex items-start gap-2.5 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs font-semibold text-rose-300 animate-fadeInUp">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mt-6 flex items-start gap-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs font-semibold text-emerald-300 animate-fadeInUp">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1.5">{t.password}</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full rounded-2xl border pl-10 pr-12 py-3 text-xs font-semibold outline-none transition ${
                  isDark ? "border-white/10 bg-black/40 text-white focus:border-emerald-500" : "border-slate-200 bg-slate-50 text-slate-900 focus:border-emerald-500"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1.5">{t.confirmPassword}</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full rounded-2xl border pl-10 pr-12 py-3 text-xs font-semibold outline-none transition ${
                  isDark ? "border-white/10 bg-black/40 text-white focus:border-emerald-500" : "border-slate-200 bg-slate-50 text-slate-900 focus:border-emerald-500"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <p className={`text-[11px] leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            {t.hint}
          </p>

          <button
            type="submit"
            disabled={loading || !token}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 py-3.5 text-xs font-black text-slate-950 shadow-lg shadow-emerald-500/25 transition hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
          >
            <span>{loading ? t.submitting : t.submit}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

