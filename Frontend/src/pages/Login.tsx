import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

type Theme = "dark" | "light";
type Lang = "tr" | "en";
type OtpChannel = "email" | "sms";
type CopyText = {
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
  identifier: string;
  identifierPh: string;
  password: string;
  hide: string;
  show: string;
  nextStep: string;
  nextStepBusy: string;
  noAccount: string;
  toRegister: string;
  idReq: string;
  idInvalid: string;
  passwordReq: string;
  loginFail: string;
  genericErr: string;
  otpTitle: string;
  otpSub: string;
  otpByEmail: string;
  otpBySms: string;
  sendCode: string;
  sendingCode: string;
  codeLabel: string;
  codePh: string;
  verifyCode: string;
  verifyingCode: string;
  resendCode: string;
  resendIn: string;
  cancelOtp: string;
  otpHint: string;
  otpInvalid: string;
  otpSentTo: string;
  otpExpiresIn: string;
  otpExpired: string;
  missingOtpEmail: string;
  missingOtpPhone: string;
  smsNotConfigured: string;
  otpExpiry: string;
  errOtpInvalidCode: string;
  errOtpExpired: string;
  errOtpUsed: string;
  errOtpLocked: string;
  errOtpRateLimit: string;
  errOtpCooldown: string;
  errOtpDeviceRate: string;
  errUserNotFound: string;
  errNetwork: string;
};

type LoginPayload = {
  email?: string;
  phone_number?: string;
  password: string;
};

type SessionUser = {
  email?: string;
  phone_number?: string;
};

const LAST_IDENTIFIER_KEY = "sd_last_login_identifier";
const LAST_OTP_CHANNEL_KEY = "sd_last_otp_channel";
const DEVICE_ID_KEY = "sd_device_id";
const OTP_TTL_SECONDS = 300;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9\s()-]{10,}$/;

const COPY: Record<Lang, CopyText> = {
  tr: {
    brandSub: "Klinik ve Diyet Yönetimi",
    signUp: "Kayıt Ol",
    secureLogin: "Güvenli giriş",
    titleA: "Hesabına",
    titleB: "giriş yap",
    subtitle: "Danışanların, planların, ölçüm raporların ve sohbetlerin tek panelde.",
    pillA: "Tek Panel",
    pillAText: "Akış tek yerde",
    pillB: "Takip",
    pillBText: "Ölçüm ve uyum",
    pillC: "Mesaj",
    pillCText: "Anlık iletişim",
    cardTitle: "Giriş Yap",
    cardSub: "Mail veya telefon ve şifreni gir. Son adımda OTP ile doğrula.",
    identifier: "Mail",
    identifierPh: "Mail veya telefon girin",
    password: "Şifre",
    hide: "Gizle",
    show: "Göster",
    nextStep: "Devam Et",
    nextStepBusy: "Kontrol ediliyor...",
    noAccount: "Hesabın yok mu?",
    toRegister: "Kayıt ol",
    idReq: "Mail veya telefon zorunlu.",
    idInvalid: "Geçerli bir mail ya da telefon gir.",
    passwordReq: "Şifre zorunlu.",
    loginFail: "Giriş başarısız. Bilgileri kontrol et.",
    genericErr: "Bir hata oluştu.",
    otpTitle: "Doğrulama Yöntemi",
    otpSub: "Hesaba girmeden önce kod gönderim türünü seç.",
    otpByEmail: "Mail ile doğrula",
    otpBySms: "SMS gönder",
    sendCode: "Kodu Gönder",
    sendingCode: "Kod gönderiliyor...",
    codeLabel: "Doğrulama Kodu",
    codePh: "123456",
    verifyCode: "Kodu Doğrula ve Gir",
    verifyingCode: "Doğrulanıyor...",
    resendCode: "Kodu Tekrar Gönder",
    resendIn: "Tekrar gönderim",
    cancelOtp: "İptal",
    otpHint: "Kod gönderildi. Gelen 6 haneli kodu gir.",
    otpInvalid: "Kod 6 haneli olmalıdır.",
    otpSentTo: "Kod gönderildi:",
    otpExpiresIn: "Kodun geçerlilik süresi",
    otpExpired: "Kod süresi doldu. Lütfen yeniden kod isteyin.",
    missingOtpEmail: "Bu hesapta OTP için e-posta bulunamadı.",
    missingOtpPhone: "Bu hesapta OTP için telefon bulunamadı.",
    smsNotConfigured: "SMS servisi aktif değil. Mail seçimi ile devam et.",
    otpExpiry: "Kod geçerlilik süresi: 5 dakika",
    errOtpInvalidCode: "Hatalı kod girdiniz.",
    errOtpExpired: "Kod geçersiz veya süresi dolmuş.",
    errOtpUsed: "Bu kod kullanılmış. Lütfen yeni kod isteyin.",
    errOtpLocked: "Çok fazla hatalı deneme yapıldı. Lütfen daha sonra tekrar deneyin.",
    errOtpRateLimit: "Çok sık kod istediniz. Biraz bekleyip tekrar deneyin.",
    errOtpCooldown: "Tekrar kod istemek için biraz bekleyin.",
    errOtpDeviceRate: "Bu cihazdan çok fazla kod istendi. Lütfen daha sonra tekrar deneyin.",
    errUserNotFound: "Kullanıcı bulunamadı.",
    errNetwork: "Sunucuya ulaşılamıyor. Bağlantıyı kontrol edip tekrar deneyin.",
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
    cardSub: "Enter email/phone and password. Complete OTP before entering account.",
    identifier: "Email",
    identifierPh: "Enter email or phone",
    password: "Password",
    hide: "Hide",
    show: "Show",
    nextStep: "Continue",
    nextStepBusy: "Checking...",
    noAccount: "Don't have an account?",
    toRegister: "Sign up",
    idReq: "Email or phone is required.",
    idInvalid: "Enter a valid email or phone.",
    passwordReq: "Password is required.",
    loginFail: "Login failed. Check your credentials.",
    genericErr: "An error occurred.",
    otpTitle: "Verification Method",
    otpSub: "Choose how to receive the code before entering account.",
    otpByEmail: "Verify by email",
    otpBySms: "Send SMS",
    sendCode: "Send Code",
    sendingCode: "Sending code...",
    codeLabel: "Verification Code",
    codePh: "123456",
    verifyCode: "Verify Code and Sign In",
    verifyingCode: "Verifying...",
    resendCode: "Resend Code",
    resendIn: "Resend in",
    cancelOtp: "Cancel",
    otpHint: "Code sent. Enter the 6-digit code.",
    otpInvalid: "Code must be 6 digits.",
    otpSentTo: "Code sent to:",
    otpExpiresIn: "Code validity",
    otpExpired: "Code expired. Please request a new one.",
    missingOtpEmail: "No email found for OTP delivery.",
    missingOtpPhone: "No phone found for OTP delivery.",
    smsNotConfigured: "SMS service is not configured. Continue with email.",
    otpExpiry: "Code validity: 5 minutes",
    errOtpInvalidCode: "The verification code is incorrect.",
    errOtpExpired: "The code is invalid or expired.",
    errOtpUsed: "This code was already used. Please request a new one.",
    errOtpLocked: "Too many incorrect attempts. Please try again later.",
    errOtpRateLimit: "Too many code requests. Please wait and try again.",
    errOtpCooldown: "Please wait before requesting a new code.",
    errOtpDeviceRate: "Too many requests from this device. Please try again later.",
    errUserNotFound: "User not found.",
    errNetwork: "Server is unreachable. Check your connection and try again.",
  },
};

function guessIdentifierType(identifier: string): "email" | "phone" | "invalid" {
  const v = identifier.trim();
  if (!v) return "invalid";
  if (EMAIL_REGEX.test(v)) return "email";
  if (PHONE_REGEX.test(v)) return "phone";
  return "invalid";
}

function readLastIdentifier(): string {
  return localStorage.getItem(LAST_IDENTIFIER_KEY) || "";
}

function readLastChannel(): OtpChannel {
  return localStorage.getItem(LAST_OTP_CHANNEL_KEY) === "sms" ? "sms" : "email";
}

function getOrCreateDeviceId(): string {
  const existing = localStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;

  const generated =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `web-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  localStorage.setItem(DEVICE_ID_KEY, generated);
  return generated;
}

function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function maskIdentity(identity: string, identityType: 1 | 2 | null): string {
  const value = String(identity || "").trim();
  if (!value) return "";

  const isEmail = identityType === 1 || value.includes("@");
  if (isEmail) {
    const [local, domain] = value.split("@");
    if (!domain) return `${value[0] || "*"}***`;
    const first = local?.[0] || "*";
    return `${first}***@${domain}`;
  }

  if (value.length <= 4) return "***";
  const prefixLen = value.startsWith("+") ? 3 : 2;
  const prefix = value.slice(0, prefixLen);
  const suffix = value.slice(-2);
  return `${prefix}***${suffix}`;
}

function extractApiMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") return fallback;
  const raw = (data as { message?: unknown }).message;
  if (Array.isArray(raw)) return raw.join(" - ");
  if (typeof raw === "string" && raw.trim()) return raw;
  return fallback;
}

function mapApiError(message: string, t: CopyText): string {
  const raw = String(message || "").trim();
  if (!raw) return t.genericErr;

  const normalized = raw.toLowerCase();

  if (normalized.includes("invalid otp") || normalized.includes("inavlid otp")) return t.errOtpInvalidCode;
  if (normalized.includes("otp not found") || normalized.includes("expired")) return t.errOtpExpired;
  if (normalized.includes("otp already used")) return t.errOtpUsed;
  if (normalized.includes("temporarily locked")) return t.errOtpLocked;
  if (normalized.includes("otp rate limit exceeded")) return t.errOtpRateLimit;
  if (normalized.includes("otp device rate limit exceeded")) return t.errOtpDeviceRate;
  if (normalized.includes("otp resend cooldown active")) return t.errOtpCooldown;
  if (normalized.includes("please wait before requesting a new otp")) return t.errOtpCooldown;
  if (normalized.includes("too many requests")) return t.errOtpRateLimit;
  if (normalized.includes("sms service is not configured")) return t.smsNotConfigured;
  if (normalized.includes("e-posta veya telefon") || normalized.includes("email or phone")) return t.idReq;
  if (normalized.includes("user not found")) return t.errUserNotFound;
  if (normalized.includes("failed to fetch") || normalized.includes("networkerror")) return t.errNetwork;
  if (normalized.includes("unauthorized")) return t.loginFail;
  if (normalized.includes("invalid credentials")) return t.loginFail;

  return raw;
}

export default function Login() {
  const navigate = useNavigate();

  const API_BASE = "http://localhost:3000";
  const LOGIN_URL = `${API_BASE}/api/auth/login`;
  const REQUEST_OTP_URL = `${API_BASE}/api/auth/request-otp`;
  const VERIFY_OTP_URL = `${API_BASE}/api/auth/verify-otp`;

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
  const deviceId = useMemo(() => getOrCreateDeviceId(), []);

  const [identifier, setIdentifier] = useState(readLastIdentifier());
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [otpOpen, setOtpOpen] = useState(false);
  const [otpChannel, setOtpChannel] = useState<OtpChannel>(readLastChannel());
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpIdentityType, setOtpIdentityType] = useState<1 | 2 | null>(null);
  const [otpIdentity, setOtpIdentity] = useState("");
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [otpExpiresAt, setOtpExpiresAt] = useState<number | null>(null);
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(0);
  const [otpInfo, setOtpInfo] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [pendingUser, setPendingUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (localStorage.getItem("access_token")) navigate("/", { replace: true });
  }, [navigate]);

  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = window.setTimeout(() => setOtpCooldown((v) => Math.max(v - 1, 0)), 1000);
    return () => window.clearTimeout(timer);
  }, [otpCooldown]);

  useEffect(() => {
    if (!otpSent || !otpExpiresAt) {
      setOtpSecondsLeft(0);
      return;
    }

    const tick = () => {
      const seconds = Math.max(0, Math.ceil((otpExpiresAt - Date.now()) / 1000));
      setOtpSecondsLeft(seconds);
    };

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [otpSent, otpExpiresAt]);

  const availableChannels = useMemo(() => {
    const email = String(pendingUser?.email || "").trim();
    const phone = String(pendingUser?.phone_number || "").trim();
    return {
      email: EMAIL_REGEX.test(email),
      sms: PHONE_REGEX.test(phone),
    };
  }, [pendingUser]);

  const maskedOtpTarget = useMemo(() => maskIdentity(otpIdentity, otpIdentityType), [otpIdentity, otpIdentityType]);

  const buildOtpTarget = (channel: OtpChannel) => {
    if (!pendingUser) throw new Error(t.genericErr);

    if (channel === "email") {
      const candidate = String(pendingUser.email || "").trim();
      if (!EMAIL_REGEX.test(candidate)) throw new Error(t.missingOtpEmail);
      return { identityType: 1 as const, identity: candidate };
    }

    const candidate = String(pendingUser.phone_number || "").trim();
    if (!PHONE_REGEX.test(candidate)) throw new Error(t.missingOtpPhone);
    return { identityType: 2 as const, identity: candidate };
  };

  const requestOtp = async (identityType: 1 | 2, identity: string) => {
    const res = await fetch(REQUEST_OTP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-device-id": deviceId,
      },
      body: JSON.stringify({
        identityType,
        identity,
        purpose: 2,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(extractApiMessage(data, t.genericErr));
    }
  };

  const validateCredentials = () => {
    if (!identifier.trim()) return t.idReq;
    if (guessIdentifierType(identifier) === "invalid") return t.idInvalid;
    if (!password) return t.passwordReq;
    return "";
  };

  const openOtpModal = (user: SessionUser) => {
    const nextChannel: OtpChannel = EMAIL_REGEX.test(String(user.email || "")) ? "email" : "sms";
    setPendingUser(user);
    setOtpChannel(nextChannel);
    setOtpOpen(true);
    setOtpSent(false);
    setOtpCode("");
    setOtpIdentityType(null);
    setOtpIdentity("");
    setOtpCooldown(0);
    setOtpExpiresAt(null);
    setOtpSecondsLeft(0);
    setOtpInfo("");
    setOtpError("");
  };

  const handleCredentialSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setError("");

    const validationError = validateCredentials();
    if (validationError) {
      setError(validationError);
      return;
    }

    localStorage.setItem(LAST_IDENTIFIER_KEY, identifier.trim());

    const idType = guessIdentifierType(identifier);
    const payload: LoginPayload = {
      password,
      email: idType === "email" ? identifier.trim() : undefined,
      phone_number: idType === "phone" ? identifier.trim() : undefined,
    };

    setLoading(true);
    try {
      const res = await fetch(LOGIN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-device-id": deviceId,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = extractApiMessage(data, t.loginFail);
        throw new Error(msg);
      }

      const result = data?.data ?? data;
      if (result?.otpRequired === false && result?.accessToken) {
        const accessToken = result?.accessToken;
        const refreshToken = result?.refreshToken;
        const user = result?.user;

        if (accessToken) localStorage.setItem("access_token", accessToken);
        if (refreshToken) localStorage.setItem("refresh_token", refreshToken);
        if (user) localStorage.setItem("sd_user", JSON.stringify(user));

        navigate("/");
        return;
      }

      const user = (result?.user ?? {}) as SessionUser;
      openOtpModal(user);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      setError(mapApiError(message, t));
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    setOtpError("");
    setOtpInfo("");
    setOtpSending(true);
    try {
      const target = buildOtpTarget(otpChannel);
      await requestOtp(target.identityType, target.identity);

      localStorage.setItem(LAST_OTP_CHANNEL_KEY, otpChannel);
      setOtpIdentityType(target.identityType);
      setOtpIdentity(target.identity);
      setOtpSent(true);
      setOtpCooldown(60);
      setOtpExpiresAt(Date.now() + OTP_TTL_SECONDS * 1000);
      setOtpInfo(t.otpHint);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      setOtpError(mapApiError(message, t));
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtp = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setOtpError("");

    if (!otpIdentityType || !otpIdentity) {
      setOtpError(t.genericErr);
      return;
    }
    if (otpSecondsLeft <= 0) {
      setOtpError(t.otpExpired);
      return;
    }
    if (!/^\d{6}$/.test(otpCode.trim())) {
      setOtpError(t.otpInvalid);
      return;
    }

    setOtpVerifying(true);
    try {
      const res = await fetch(VERIFY_OTP_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-device-id": deviceId,
        },
        body: JSON.stringify({
          identityType: otpIdentityType,
          identity: otpIdentity,
          code: otpCode.trim(),
          purpose: 2,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = extractApiMessage(data, t.genericErr);
        throw new Error(msg);
      }

      const result = data?.data ?? data;
      const accessToken = result?.accessToken;
      const refreshToken = result?.refreshToken;
      const user = result?.user;

      if (accessToken) localStorage.setItem("access_token", accessToken);
      if (refreshToken) localStorage.setItem("refresh_token", refreshToken);
      if (user) localStorage.setItem("sd_user", JSON.stringify(user));

      setOtpOpen(false);
      navigate("/");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      setOtpError(mapApiError(message, t));
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleResend = async () => {
    if (otpCooldown > 0 || !otpIdentityType || !otpIdentity) return;
    setOtpError("");
    try {
      await requestOtp(otpIdentityType, otpIdentity);
      setOtpCooldown(60);
      setOtpExpiresAt(Date.now() + OTP_TTL_SECONDS * 1000);
      setOtpInfo(t.otpHint);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      setOtpError(mapApiError(message, t));
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
            <div className="mb-5">
              <div className={isDark ? "text-base font-extrabold text-white" : "text-base font-extrabold text-[#0e2d27]"}>{t.cardTitle}</div>
              <div className={isDark ? "mt-1 text-xs text-zinc-400" : "mt-1 text-xs text-[#4d6b62]"}>{t.cardSub}</div>
            </div>

            {error ? <div className="mb-4 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</div> : null}

            <form onSubmit={handleCredentialSubmit} className="space-y-4" autoComplete="on">
              <Field
                isDark={isDark}
                label={t.identifier}
                value={identifier}
                onChange={(v) => {
                  setIdentifier(v);
                  setError("");
                }}
                placeholder={t.identifierPh}
                autoComplete="username"
                name="identifier"
              />

              <div>
                <label className={isDark ? "mb-2 block text-xs font-semibold text-zinc-200" : "mb-2 block text-xs font-semibold text-[#36544c]"}>{t.password}</label>
                <div className="relative">
                  <input
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    type={showPass ? "text" : "password"}
                    placeholder="********"
                    autoComplete="current-password"
                    name="password"
                    className={[
                      "w-full rounded-2xl border px-4 py-3 pr-12 text-sm outline-none transition",
                      isDark ? "bg-black/20 text-white" : "bg-white text-[#0e2d27]",
                      "border-[#325d51]/25 focus:border-emerald-400/40 focus:ring-4 focus:ring-emerald-500/10",
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
              </div>

              <button
                disabled={loading}
                type="submit"
                className="mt-2 w-full rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-300 px-5 py-3 text-sm font-extrabold text-zinc-950 shadow-[0_18px_60px_rgba(16,185,129,0.20)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? t.nextStepBusy : t.nextStep}
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

      {otpOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
          <div className={isDark ? "w-full max-w-md rounded-2xl border border-white/10 bg-[#0d1114] p-5 shadow-[0_30px_120px_rgba(0,0,0,0.55)]" : "w-full max-w-md rounded-2xl border border-[#325d51]/20 bg-white p-5 shadow-[0_30px_120px_rgba(0,0,0,0.25)]"}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className={isDark ? "text-lg font-extrabold text-white" : "text-lg font-extrabold text-[#0e2d27]"}>{t.otpTitle}</h3>
                <p className={isDark ? "mt-1 text-xs text-zinc-400" : "mt-1 text-xs text-[#4d6b62]"}>{t.otpSub}</p>
              </div>
              <button
                onClick={() => {
                  setOtpOpen(false);
                  setPendingUser(null);
                }}
                className={isDark ? "rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-zinc-200" : "rounded-lg border border-[#325d51]/20 bg-[#eef5f1] px-2.5 py-1 text-xs text-[#36544c]"}
              >
                {t.cancelOtp}
              </button>
            </div>

            {!otpSent ? (
              <div className="space-y-4">
                <div className="grid gap-2">
                  <button
                    type="button"
                    disabled={!availableChannels.email || otpSending}
                    onClick={() => setOtpChannel("email")}
                    className={[
                      "w-full rounded-xl border px-4 py-3 text-left text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50",
                      otpChannel === "email"
                        ? isDark
                          ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-100"
                          : "border-emerald-700/30 bg-emerald-100 text-emerald-900"
                        : isDark
                          ? "border-white/10 bg-white/5 text-zinc-200"
                          : "border-[#325d51]/20 bg-[#f4f8f6] text-[#36544c]",
                    ].join(" ")}
                  >
                    {t.otpByEmail}
                  </button>

                  <button
                    type="button"
                    disabled={!availableChannels.sms || otpSending}
                    onClick={() => setOtpChannel("sms")}
                    className={[
                      "w-full rounded-xl border px-4 py-3 text-left text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50",
                      otpChannel === "sms"
                        ? isDark
                          ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-100"
                          : "border-emerald-700/30 bg-emerald-100 text-emerald-900"
                        : isDark
                          ? "border-white/10 bg-white/5 text-zinc-200"
                          : "border-[#325d51]/20 bg-[#f4f8f6] text-[#36544c]",
                    ].join(" ")}
                  >
                    {t.otpBySms}
                  </button>
                </div>

                {otpError ? <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">{otpError}</div> : null}

                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={otpSending}
                  className="w-full rounded-xl bg-gradient-to-r from-emerald-400 to-teal-300 px-4 py-3 text-sm font-extrabold text-zinc-950"
                >
                  {otpSending ? t.sendingCode : t.sendCode}
                </button>
              </div>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                {otpInfo ? <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">{otpInfo}</div> : null}
                {maskedOtpTarget ? (
                  <div className={isDark ? "text-xs text-zinc-300" : "text-xs text-[#36544c]"}>
                    {t.otpSentTo} <span className="font-semibold">{maskedOtpTarget}</span>
                  </div>
                ) : null}

                {otpSecondsLeft > 0 ? (
                  <div className={isDark ? "text-xs text-zinc-400" : "text-xs text-[#4d6b62]"}>
                    {t.otpExpiresIn}: <span className="font-semibold">{formatCountdown(otpSecondsLeft)}</span>
                  </div>
                ) : (
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">{t.otpExpired}</div>
                )}

                <Field
                  isDark={isDark}
                  label={t.codeLabel}
                  value={otpCode}
                  onChange={(v) => {
                    setOtpCode(v.replace(/\D/g, "").slice(0, 6));
                    setOtpError("");
                  }}
                  placeholder={t.codePh}
                  name="otp_code"
                />

                {otpError ? <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">{otpError}</div> : null}

                <button
                  disabled={otpVerifying || otpSecondsLeft <= 0}
                  type="submit"
                  className="w-full rounded-xl bg-gradient-to-r from-emerald-400 to-teal-300 px-4 py-3 text-sm font-extrabold text-zinc-950"
                >
                  {otpVerifying ? t.verifyingCode : t.verifyCode}
                </button>

                <button
                  type="button"
                  onClick={handleResend}
                  disabled={otpCooldown > 0}
                  className={isDark ? "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-zinc-100 disabled:cursor-not-allowed disabled:opacity-60" : "w-full rounded-xl border border-[#325d51]/20 bg-[#f4f8f6] px-4 py-3 text-sm font-bold text-[#36544c] disabled:cursor-not-allowed disabled:opacity-60"}
                >
                  {otpCooldown > 0 ? `${t.resendIn} ${otpCooldown}s` : t.resendCode}
                </button>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Field({
  isDark,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  autoComplete,
  name,
}: {
  isDark: boolean;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
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
          "border-[#325d51]/25 focus:border-emerald-400/40 focus:ring-4 focus:ring-emerald-500/10",
        ].join(" ")}
      />
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
