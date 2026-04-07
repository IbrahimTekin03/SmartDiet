import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAppSettings } from "../context/AppSettingsContext";

type Lang = "tr" | "en";

const API_BASE = "http://localhost:3000";
const RESET_PASSWORD_URL = `${API_BASE}/api/auth/reset-password`;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const COPY = {
  tr: {
    title: "Yeni ?ifre Belirle",
    subtitle: "E-postana g?nderilen ba?lant? ile ?ifreni g?venli ?ekilde yenile.",
    password: "Yeni ?ifre",
    confirmPassword: "?ifre Tekrar",
    hint: "?ifren en az 8 karakter olmal?; b?y?k harf, k???k harf, rakam ve ?zel karakter i?ermelidir.",
    submit: "?ifreyi G?ncelle",
    submitting: "G?ncelleniyor...",
    success: "?ifren g?ncellendi. Art?k giri? yapabilirsin.",
    invalidToken: "Ba?lant? ge?ersiz olabilir veya s?resi dolmu? olabilir.",
    mismatch: "?ifre alanlar? birbiriyle ayn? olmal?d?r.",
    passwordRule: "L?tfen daha g??l? bir ?ifre belirle.",
    goLogin: "Giri?e D?n",
    backHome: "Ana sayfa",
  },
  en: {
    title: "Set a new password",
    subtitle: "Use the link from your email to securely update your password.",
    password: "New password",
    confirmPassword: "Confirm password",
    hint: "Use at least 8 characters with upper, lower, number and special character.",
    submit: "Update password",
    submitting: "Updating...",
    success: "Your password was updated. You can sign in now.",
    invalidToken: "This link is invalid or may have expired.",
    mismatch: "Passwords must match.",
    passwordRule: "Enter a stronger password.",
    goLogin: "Back to login",
    backHome: "Home",
  },
} as const;

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { lang, isDark } = useAppSettings();
  const t = COPY[lang as Lang];
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message =
          typeof data?.message === "string" && data.message.trim()
            ? data.message
            : t.invalidToken;
        throw new Error(message);
      }

      setSuccess(t.success);
      setPassword("");
      setConfirmPassword("");
      window.setTimeout(() => navigate("/login", { replace: true }), 1200);
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : "";
      const normalized = raw.toLowerCase();
      if (normalized.includes("invalid") || normalized.includes("expired") || normalized.includes("gecersiz") || normalized.includes("suresi")) {
        setError(t.invalidToken);
      } else {
        setError(raw || t.invalidToken);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div
          className={
            isDark
              ? "absolute inset-0 [background:radial-gradient(1000px_640px_at_12%_12%,rgba(16,185,129,0.18),transparent_58%),radial-gradient(900px_620px_at_88%_15%,rgba(20,184,166,0.12),transparent_60%),linear-gradient(180deg,#050608,#07090b_55%,#050608)]"
              : "absolute inset-0 [background:radial-gradient(1080px_680px_at_10%_0%,rgba(22,128,101,0.22),transparent_58%),radial-gradient(900px_620px_at_90%_10%,rgba(20,120,133,0.16),transparent_56%),linear-gradient(180deg,#edf3ef,#dfe9e2_58%,#dbe5df)]"
          }
        />
      </div>

      <main className="relative z-10 mx-auto grid min-h-screen max-w-6xl place-items-center px-4 py-10 sm:px-6">
        <section className={isDark ? "w-full max-w-lg rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_40px_140px_rgba(0,0,0,0.65)] backdrop-blur sm:p-8" : "w-full max-w-lg rounded-[28px] border border-[#325d51]/20 bg-[#f3f7f4]/90 p-6 shadow-[0_40px_120px_rgba(8,22,20,0.12)] backdrop-blur sm:p-8"}>
          <div className="flex items-center justify-between gap-4">
            <Link to="/" className={isDark ? "text-xs font-semibold text-zinc-300 hover:text-white" : "text-xs font-semibold text-[#36544c] hover:text-[#123128]"}>
              {t.backHome}
            </Link>
            <Link to="/login" className={isDark ? "text-xs font-semibold text-emerald-200 hover:text-white" : "text-xs font-semibold text-emerald-700 hover:text-emerald-900"}>
              {t.goLogin}
            </Link>
          </div>

          <div className="mt-6">
            <h1 className={isDark ? "text-3xl font-extrabold text-white" : "text-3xl font-extrabold text-[#0e2d27]"}>
              {t.title}
            </h1>
            <p className={isDark ? "mt-2 text-sm leading-6 text-zinc-300" : "mt-2 text-sm leading-6 text-[#4d6b62]"}>
              {t.subtitle}
            </p>
          </div>

          {!token ? <div className="mt-5 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{t.invalidToken}</div> : null}
          {error ? <div className="mt-5 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</div> : null}
          {success ? <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{success}</div> : null}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <PasswordField
              isDark={isDark}
              label={t.password}
              value={password}
              onChange={(value) => {
                setPassword(value);
                setError("");
              }}
              show={showPassword}
              onToggle={() => setShowPassword((current) => !current)}
            />

            <PasswordField
              isDark={isDark}
              label={t.confirmPassword}
              value={confirmPassword}
              onChange={(value) => {
                setConfirmPassword(value);
                setError("");
              }}
              show={showConfirmPassword}
              onToggle={() => setShowConfirmPassword((current) => !current)}
            />

            <div className={isDark ? "text-xs text-zinc-400" : "text-xs text-[#4d6b62]"}>{t.hint}</div>

            <button
              type="submit"
              disabled={loading || !token}
              className="w-full rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-300 px-5 py-3 text-sm font-extrabold text-zinc-950 shadow-[0_18px_60px_rgba(16,185,129,0.20)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? t.submitting : t.submit}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}

function PasswordField({
  isDark,
  label,
  value,
  onChange,
  show,
  onToggle,
}: {
  isDark: boolean;
  label: string;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <div>
      <label className={isDark ? "mb-2 block text-xs font-semibold text-zinc-200" : "mb-2 block text-xs font-semibold text-[#36544c]"}>
        {label}
      </label>
      <div className="relative">
        <input
          value={value}
          onChange={(ev) => onChange(ev.target.value)}
          type={show ? "text" : "password"}
          className={[
            "w-full rounded-2xl border px-4 py-3 pr-12 text-sm outline-none transition",
            isDark ? "border-white/10 bg-black/20 text-white" : "border-[#325d51]/25 bg-white text-[#0e2d27]",
            "focus:border-emerald-400/40 focus:ring-4 focus:ring-emerald-500/10",
          ].join(" ")}
        />
        <button
          type="button"
          onClick={onToggle}
          className={isDark ? "absolute right-3 top-1/2 -translate-y-1/2 rounded-xl border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-semibold text-zinc-200 hover:bg-white/10" : "absolute right-3 top-1/2 -translate-y-1/2 rounded-xl border border-[#325d51]/25 bg-[#d7e4de] px-2 py-1 text-[11px] font-semibold text-[#36544c] hover:bg-[#c9dad3]"}
        >
          {show ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );
}
