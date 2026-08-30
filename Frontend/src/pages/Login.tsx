import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppSettings } from "../context/AppSettingsContext";
import { setAuthSession, useAuthSession } from "../lib/authSession";
import { API_BASE_URL as API_BASE } from "../lib/api";
import { 
  Activity, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Sparkles, 
  KeyRound, 
  AlertCircle,
  Moon,
  Sun,
  Globe,
  CheckCircle2,
  Stethoscope,
  UserCheck
} from "lucide-react";

type Lang = "tr" | "en";
type OtpChannel = "email" | "sms";

type LoginPayload = {
  password?: string;
  email?: string;
  phone_number?: string;
  username?: string;
};

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
  forgotPassword: string;
  forgotPasswordHint: string;
  forgotPasswordEmail: string;
  forgotPasswordEmailPh: string;
  forgotPasswordSend: string;
  forgotPasswordSending: string;
  forgotPasswordSuccess: string;
  forgotPasswordLocked: string;
  forgotPasswordAfterAttempts: string;
  demoTitle: string;
  demoDietitian: string;
  demoClient: string;
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
    forgotPassword: "Şifremi unuttum",
    forgotPasswordHint: "3 başarısız denemeden sonra e-posta adresine şifre yenileme bağlantısı gönderebiliriz.",
    forgotPasswordEmail: "E-posta Adresi",
    forgotPasswordEmailPh: "ornek@smartdiet.com",
    forgotPasswordSend: "Bağlantı Gönder",
    forgotPasswordSending: "Gönderiliyor...",
    forgotPasswordSuccess: "E-posta adresi uygunsa şifre yenileme bağlantısı gönderildi.",
    forgotPasswordLocked: "Şifre yenileme henüz aktif değil. Bu alan 3 başarısız giriş denemesinden sonra açılır.",
    forgotPasswordAfterAttempts: "Bu alan 3 başarısız giriş denemesinin ardından açıldı.",
    brandSub: "Klinik ve Beslenme Yönetimi",
    signUp: "Kayıt Ol",
    secureLogin: "Güvenli Giriş Portali",
    titleA: "SmartDiet'e",
    titleB: "Hoş Geldiniz",
    subtitle: "Kişiselleştirilmiş klinik beslenme süreçleri, danışan takibi ve analizler tek bir ekosistemde.",
    pillA: "Akıllı Makro Analizi",
    pillAText: "Ölçüm, kalori ve besin değeri hesaplamaları",
    pillB: "Gerçek Zamanlı İletişim",
    pillBText: "Diyetisyen-danışan mesajlaşması ve randevu",
    pillC: "Yapay Zeka Asistanı",
    pillCText: "Görsel tabak tarama ve akıllı öneriler",
    cardTitle: "Giriş Yap",
    cardSub: "Hesabınıza erişmek için bilgilerinizi girin.",
    identifier: "E-posta veya Telefon",
    identifierPh: "ornek@smartdiet.com veya +90...",
    password: "Şifre",
    hide: "Gizle",
    show: "Göster",
    nextStep: "Giriş Yap",
    nextStepBusy: "Kontrol ediliyor...",
    noAccount: "Henüz bir hesabınız yok mu?",
    toRegister: "Hemen Kaydolun",
    idReq: "E-posta veya telefon numarası zorunludur.",
    idInvalid: "Geçerli bir e-posta adresi ya da telefon numarası girin.",
    passwordReq: "Şifre alanı boş bırakılamaz.",
    loginFail: "Giriş başarısız. Lütfen bilgilerinizi kontrol edin.",
    genericErr: "İşlem sırasında beklenmeyen bir hata oluştu.",
    otpTitle: "İki Aşamalı Doğrulama (OTP)",
    otpSub: "Hesap güvenliğiniz için doğrulama yöntemini seçin.",
    otpByEmail: "E-posta ile Doğrula",
    otpBySms: "SMS ile Doğrula",
    sendCode: "Doğrulama Kodu Gönder",
    sendingCode: "Kod gönderiliyor...",
    codeLabel: "6 Haneli Doğrulama Kodu",
    codePh: "• • • • • •",
    verifyCode: "Doğrula ve Giriş Yap",
    verifyingCode: "Doğrulanıyor...",
    resendCode: "Kodu Yeniden Gönder",
    resendIn: "Tekrar gönderim için bekleyin",
    cancelOtp: "Geri Dön",
    otpHint: "Doğrulama kodu iletildi. Lütfen gelen 6 haneli kodu giriniz.",
    otpInvalid: "Doğrulama kodu 6 haneli olmalıdır.",
    otpSentTo: "Kod gönderilen adres:",
    otpExpiresIn: "Kalan Süre",
    otpExpired: "Kodun süresi doldu. Lütfen yeni kod talep edin.",
    missingOtpEmail: "Bu hesaba ait kayıtlı e-posta adresi bulunamadı.",
    missingOtpPhone: "Bu hesaba ait kayıtlı telefon numarası bulunamadı.",
    smsNotConfigured: "SMS servisi aktif değil. Lütfen e-posta yöntemiyle devam edin.",
    otpExpiry: "Kod geçerlilik süresi 5 dakikadır.",
    errOtpInvalidCode: "Girdiğiniz doğrulama kodu hatalıdır.",
    errOtpExpired: "Doğrulama kodunun süresi dolmuş.",
    errOtpUsed: "Bu kod daha önce kullanılmış. Yeni bir kod talep edin.",
    errOtpLocked: "Çok fazla hatalı deneme. Lütfen bir süre bekleyin.",
    errOtpRateLimit: "Çok sık kod talep edildi. Lütfen bekleyin.",
    errOtpCooldown: "Yeniden kod istemeden önce lütfen sürenin dolmasını bekleyin.",
    errOtpDeviceRate: "Cihaz istek limiti aşıldı. Lütfen daha sonra tekrar deneyin.",
    errUserNotFound: "Bu bilgilere sahip kullanıcı bulunamadı.",
    errNetwork: "Sunucu bağlantısı kurulamadı.",
    demoTitle: "Hızlı Demo Girişi",
    demoDietitian: "Diyetisyen Paneli",
    demoClient: "Danışan Paneli",
  },
  en: {
    forgotPassword: "Forgot password",
    forgotPasswordHint: "After 3 failed attempts, we can send a password reset link by email.",
    forgotPasswordEmail: "Email Address",
    forgotPasswordEmailPh: "name@example.com",
    forgotPasswordSend: "Send Reset Link",
    forgotPasswordSending: "Sending...",
    forgotPasswordSuccess: "A password reset link has been dispatched to your email.",
    forgotPasswordLocked: "Password reset unlocks after 3 consecutive failed attempts.",
    forgotPasswordAfterAttempts: "Password recovery is now unlocked.",
    brandSub: "Clinical & Nutrition Ecosystem",
    signUp: "Sign Up",
    secureLogin: "Secure Portal",
    titleA: "Welcome to",
    titleB: "SmartDiet",
    subtitle: "Tailored nutrition plans, bio-metric tracking, and dietitian communication in one place.",
    pillA: "Smart Macro Tracking",
    pillAText: "Measurements, calorie and nutrient math",
    pillB: "Real-time Messaging",
    pillBText: "Dietitian-client chats and appointments",
    pillC: "AI Plate Assistant",
    pillCText: "Computer vision plate scanning and tips",
    cardTitle: "Sign In",
    cardSub: "Enter your credentials to access your account.",
    identifier: "Email or Phone",
    identifierPh: "name@example.com or +1...",
    password: "Password",
    hide: "Hide",
    show: "Show",
    nextStep: "Sign In",
    nextStepBusy: "Verifying...",
    noAccount: "Don't have an account?",
    toRegister: "Sign up now",
    idReq: "Email or phone number is required.",
    idInvalid: "Please enter a valid email or phone number.",
    passwordReq: "Password cannot be empty.",
    loginFail: "Sign in failed. Please verify your credentials.",
    genericErr: "An unexpected error occurred.",
    otpTitle: "Two-Factor Verification (OTP)",
    otpSub: "Choose a verification method to secure your session.",
    otpByEmail: "Verify via Email",
    otpBySms: "Verify via SMS",
    sendCode: "Send Verification Code",
    sendingCode: "Sending code...",
    codeLabel: "6-Digit Verification Code",
    codePh: "• • • • • •",
    verifyCode: "Verify & Enter",
    verifyingCode: "Verifying...",
    resendCode: "Resend Code",
    resendIn: "Wait to resend",
    cancelOtp: "Go Back",
    otpHint: "Verification code has been sent. Enter the 6-digit code.",
    otpInvalid: "The verification code must be 6 digits.",
    otpSentTo: "Code sent to:",
    otpExpiresIn: "Remaining",
    otpExpired: "Code expired. Please request a new code.",
    missingOtpEmail: "No registered email found for this account.",
    missingOtpPhone: "No registered phone found for this account.",
    smsNotConfigured: "SMS gateway is unavailable. Please use email verification.",
    otpExpiry: "Code validity is 5 minutes.",
    errOtpInvalidCode: "The verification code is incorrect.",
    errOtpExpired: "The verification code has expired.",
    errOtpUsed: "This code has already been used.",
    errOtpLocked: "Too many failed attempts. Please wait.",
    errOtpRateLimit: "Too many requests. Please wait.",
    errOtpCooldown: "Please wait for cooldown before requesting another code.",
    errOtpDeviceRate: "Device request limit exceeded. Try again later.",
    errUserNotFound: "User with these credentials was not found.",
    errNetwork: "Unable to reach the server.",
    demoTitle: "Quick Demo Sandbox",
    demoDietitian: "Dietitian Dashboard",
    demoClient: "Client Portal",
  },
};

const LOGIN_URL = API_BASE + "/api/auth/login";
const REQUEST_OTP_URL = API_BASE + "/api/auth/request-otp";
const VERIFY_OTP_URL = API_BASE + "/api/auth/verify-otp";
const FORGOT_PASSWORD_URL = API_BASE + "/api/auth/forgot-password";

function guessIdentifierType(val: string): "email" | "phone" | "unknown" {
  const t = val.trim();
  if (EMAIL_REGEX.test(t)) return "email";
  if (PHONE_REGEX.test(t)) return "phone";
  return "unknown";
}

function getOrCreateDeviceId(): string {
  try {
    const existing = localStorage.getItem(DEVICE_ID_KEY);
    if (existing) return existing;
    const generated = "dev_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(DEVICE_ID_KEY, generated);
    return generated;
  } catch {
    return "dev_fallback";
  }
}

function extractApiMessage(data: any, fallback: string): string {
  if (!data) return fallback;
  if (Array.isArray(data.message)) return data.message.join(" - ");
  if (typeof data.message === "string") return data.message;
  if (typeof data.error === "string") return data.error;
  return fallback;
}

function mapApiError(raw: string, t: CopyText): string {
  const msg = raw.toLowerCase();
  if (msg.includes("user_not_found") || msg.includes("not found") || msg.includes("bulunamadi") || msg.includes("bulunamadı")) return t.errUserNotFound;
  if (msg.includes("invalid_credentials") || msg.includes("unauthorized") || msg.includes("hatali") || msg.includes("hatalı")) return t.loginFail;
  if (msg.includes("otp_invalid_code") || msg.includes("invalid code")) return t.errOtpInvalidCode;
  if (msg.includes("otp_expired") || msg.includes("expired")) return t.errOtpExpired;
  if (msg.includes("otp_used")) return t.errOtpUsed;
  if (msg.includes("otp_locked")) return t.errOtpLocked;
  if (msg.includes("otp_rate_limit")) return t.errOtpRateLimit;
  if (msg.includes("otp_cooldown")) return t.errOtpCooldown;
  if (msg.includes("otp_device_rate_limit")) return t.errOtpDeviceRate;
  if (msg.includes("network") || msg.includes("fetch") || msg.includes("failed to fetch")) return t.errNetwork;
  return raw || t.genericErr;
}

export default function Login() {
  const navigate = useNavigate();
  const { lang, setLang, isDark, toggleTheme } = useAppSettings();
  const t = COPY[lang];
  const { accessToken } = useAuthSession();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [failedAttempts, setFailedAttempts] = useState(0);
  const [forgotPasswordEnabled, setForgotPasswordEnabled] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState("");
  const [forgotError, setForgotError] = useState("");

  const [otpOpen, setOtpOpen] = useState(false);
  const [otpUser, setOtpUser] = useState<SessionUser | null>(null);
  const [otpChannel, setOtpChannel] = useState<OtpChannel>("email");
  const [otpSent, setOtpSent] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpInfo, setOtpInfo] = useState("");
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [otpExpiresAt, setOtpExpiresAt] = useState<number | null>(null);
  const [otpNow, setOtpNow] = useState(Date.now());
  const [otpIdentityType, setOtpIdentityType] = useState<"email" | "phone" | null>(null);
  const [otpIdentity, setOtpIdentity] = useState<string | null>(null);

  const deviceId = useMemo(() => getOrCreateDeviceId(), []);

  useEffect(() => {
    if (accessToken) {
      navigate("/", { replace: true });
    }
  }, [accessToken, navigate]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LAST_IDENTIFIER_KEY);
      if (saved) setIdentifier(saved);
      const savedChannel = localStorage.getItem(LAST_OTP_CHANNEL_KEY) as OtpChannel | null;
      if (savedChannel === "email" || savedChannel === "sms") setOtpChannel(savedChannel);
    } catch {}
  }, []);

  useEffect(() => {
    if (!otpOpen || !otpExpiresAt) return;
    const interval = setInterval(() => {
      setOtpNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [otpOpen, otpExpiresAt]);

  useEffect(() => {
    if (!otpOpen || otpCooldown <= 0) return;
    const interval = setInterval(() => {
      setOtpCooldown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [otpOpen, otpCooldown]);

  const otpSecondsLeft = useMemo(() => {
    if (!otpExpiresAt) return 0;
    return Math.max(0, Math.ceil((otpExpiresAt - otpNow) / 1000));
  }, [otpExpiresAt, otpNow]);

  const validateCredentials = (): string | null => {
    const raw = identifier.trim();
    if (!raw) return t.idReq;
    const kind = guessIdentifierType(raw);
    if (kind === "unknown") return t.idInvalid;
    if (!password) return t.passwordReq;
    return null;
  };

  const openOtpModal = (userData: SessionUser) => {
    setOtpUser(userData);
    setOtpError("");
    setOtpInfo("");
    setOtpCode("");
    setOtpSent(false);
    setOtpCooldown(0);
    setOtpExpiresAt(null);
    setOtpOpen(true);
  };

  const buildOtpTarget = (channel: OtpChannel): { identityType: "email" | "phone"; identity: string } => {
    if (channel === "email") {
      const email = otpUser?.email || (guessIdentifierType(identifier) === "email" ? identifier.trim() : "");
      if (!email) throw new Error(t.missingOtpEmail);
      return { identityType: "email", identity: email };
    } else {
      const phone = otpUser?.phone_number || (guessIdentifierType(identifier) === "phone" ? identifier.trim() : "");
      if (!phone) throw new Error(t.missingOtpPhone);
      return { identityType: "phone", identity: phone };
    }
  };

  const requestOtp = async (identityType: "email" | "phone", identity: string) => {
    const numericType = identityType === "email" ? 1 : 2;
    const res = await fetch(REQUEST_OTP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-device-id": deviceId,
      },
      body: JSON.stringify({
        identityType: numericType,
        identity,
        purpose: 2,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = extractApiMessage(data, t.genericErr);
      throw new Error(msg);
    }
    return data;
  };

  const handleCredentialSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setError("");
    setForgotError("");
    setForgotSuccess("");

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
        const rawMsg = extractApiMessage(data, t.loginFail);
        const mapped = mapApiError(rawMsg, t);
        setError(mapped);

        setFailedAttempts((prev) => {
          const next = prev + 1;
          if (next >= 3) {
            setForgotPasswordEnabled(true);
            if (idType === "email") setForgotEmail(identifier.trim());
          }
          return next;
        });
        return;
      }

      const result = data?.data ?? data;
      if (result?.otpRequired === false && (result?.access_token || result?.accessToken)) {
        const accessToken = result?.access_token || result?.accessToken;
        const refreshToken = result?.refresh_token || result?.refreshToken;
        const userObj = result?.user;

        setAuthSession({
          accessToken,
          refreshToken,
          user: userObj,
        });

        setFailedAttempts(0);
        setForgotPasswordEnabled(false);
        navigate("/", { replace: true });
        return;
      }

      const userData = (result?.user ?? {}) as SessionUser;
      setFailedAttempts(0);
      setForgotPasswordEnabled(false);
      openOtpModal(userData);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      setError(mapApiError(message, t));
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (email: string, targetPath: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(LOGIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: "admin123" }),
      });
      const data = await res.json();
      if (data.success && data.data?.access_token) {
        setAuthSession({ accessToken: data.data.access_token, user: data.data.user });
        window.location.href = targetPath;
      } else {
        setError(lang === "tr" ? "Demo hesaba giriş yapılamadı." : "Failed to log in to demo account.");
      }
    } catch {
      setError(lang === "tr" ? "Bağlantı hatası oluştu." : "Network connection error.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setForgotError("");
    setForgotSuccess("");

    const email = forgotEmail.trim().toLowerCase();
    if (!EMAIL_REGEX.test(email)) {
      setForgotError(t.idInvalid);
      return;
    }

    setForgotLoading(true);
    try {
      const res = await fetch(FORGOT_PASSWORD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(extractApiMessage(data, t.genericErr));

      setForgotSuccess(t.forgotPasswordSuccess);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      setForgotError(mapApiError(message, t));
    } finally {
      setForgotLoading(false);
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
    if (!/^d{6}$/.test(otpCode.trim())) {
      setOtpError(t.otpInvalid);
      return;
    }

    setOtpVerifying(true);
    try {
      const numericType = otpIdentityType === "email" ? 1 : 2;
      const res = await fetch(VERIFY_OTP_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-device-id": deviceId,
        },
        body: JSON.stringify({
          identityType: numericType,
          identity: otpIdentity,
          code: otpCode.trim(),
          purpose: 2,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(extractApiMessage(data, t.genericErr));

      const result = data?.data ?? data;
      const accessToken = result?.access_token || result?.accessToken;
      const refreshToken = result?.refresh_token || result?.refreshToken;
      const userObj = result?.user;

      setAuthSession({
        accessToken,
        refreshToken,
        user: userObj,
      });

      setOtpOpen(false);
      navigate("/", { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      setOtpError(mapApiError(message, t));
    } finally {
      setOtpVerifying(false);
    }
  };

  return (
    <div className={"relative min-h-screen w-full overflow-x-hidden flex flex-col justify-between " + (isDark ? "bg-[#040711] text-white" : "bg-[#f8fafc] text-slate-900")}>
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
            className={"hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border text-xs font-black transition hover:scale-105 " + (isDark ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20" : "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 shadow-sm")}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{lang === "tr" ? "Özellikler" : "Features"}</span>
          </Link>

          <button
            type="button"
            onClick={toggleTheme}
            className={"p-2.5 rounded-2xl border transition hover:scale-105 " + (isDark ? "border-white/10 bg-slate-900/60 text-slate-300 hover:bg-slate-900" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100 shadow-sm")}
          >
            {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-700" />}
          </button>

          <button
            type="button"
            onClick={() => setLang(lang === "tr" ? "en" : "tr")}
            className={"flex items-center gap-1.5 px-3 py-2 rounded-2xl border text-xs font-black transition hover:scale-105 " + (isDark ? "border-white/10 bg-slate-900/60 text-slate-300 hover:bg-slate-900" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100 shadow-sm")}
          >
            <Globe className="h-3.5 w-3.5 text-emerald-400" />
            <span>{lang.toUpperCase()}</span>
          </button>

          <Link
            to="/register"
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 px-5 py-2.5 text-xs font-black text-slate-950 shadow-lg shadow-emerald-500/20 hover:brightness-110 hover:scale-105 transition"
          >
            <span>{t.signUp}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="relative z-10 mx-auto my-auto w-full max-w-7xl px-6 py-8 sm:px-8">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          {/* Left Pitch Column */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-black text-emerald-400">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{t.secureLogin}</span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08]">
              {t.titleA}{" "}
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                {t.titleB}
              </span>
            </h1>

            <p className={"text-sm sm:text-base leading-relaxed max-w-xl " + (isDark ? "text-slate-300" : "text-slate-700")}>
              {t.subtitle}
            </p>

            {/* Feature Bento Pills */}
            <div className="space-y-3 pt-2">
              <div className={"flex items-center gap-4 p-4 rounded-2xl border transition " + (isDark ? "border-white/10 bg-slate-900/60" : "border-slate-200 bg-white/90 shadow-sm")}>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-500 font-black">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold font-display">{t.pillA}</h4>
                  <p className={"text-xs mt-0.5 " + (isDark ? "text-slate-400" : "text-slate-600")}>{t.pillAText}</p>
                </div>
              </div>

              <div className={"flex items-center gap-4 p-4 rounded-2xl border transition " + (isDark ? "border-white/10 bg-slate-900/60" : "border-slate-200 bg-white/90 shadow-sm")}>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-500/15 text-teal-500 font-black">
                  <Stethoscope className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold font-display">{t.pillB}</h4>
                  <p className={"text-xs mt-0.5 " + (isDark ? "text-slate-400" : "text-slate-600")}>{t.pillBText}</p>
                </div>
              </div>
            </div>

            {/* Fast Demo Sandbox Picker */}
            <div className="pt-2">
              <span className={"text-xs font-black uppercase tracking-wider block mb-2.5 " + (isDark ? "text-slate-400" : "text-emerald-800")}>
                {t.demoTitle}
              </span>
              <div className="grid sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuickDemo("demo.dietitian@smartdiet.com", "/dietitian-home")}
                  className={"flex items-center justify-between p-3.5 rounded-2xl border text-xs font-black hover:scale-[1.02] transition disabled:opacity-50 " + (isDark ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20" : "border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 shadow-sm")}
                >
                  <div className="flex items-center gap-2.5">
                    <Stethoscope className="h-4 w-4" />
                    <span>{t.demoDietitian}</span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuickDemo("demo.client@smartdiet.com", "/client-home")}
                  className={"flex items-center justify-between p-3.5 rounded-2xl border text-xs font-black hover:scale-[1.02] transition disabled:opacity-50 " + (isDark ? "border-teal-500/30 bg-teal-500/10 text-teal-400 hover:bg-teal-500/20" : "border-teal-300 bg-teal-50 text-teal-900 hover:bg-teal-100 shadow-sm")}
                >
                  <div className="flex items-center gap-2.5">
                    <UserCheck className="h-4 w-4" />
                    <span>{t.demoClient}</span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Login Card Column */}
          <div className="lg:col-span-6">
            <div className={"relative rounded-[36px] border p-7 sm:p-9 backdrop-blur-2xl shadow-2xl transition-all " + (isDark ? "border-white/10 bg-slate-900/70 shadow-black/80" : "border-slate-200 bg-white/95 shadow-slate-300/40")}>
              <div className="mb-6 border-b border-white/5 pb-4">
                <h2 className="font-display text-2xl font-black">{t.cardTitle}</h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">{t.cardSub}</p>
              </div>

              {error && (
                <div className="mb-6 p-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 text-xs font-bold text-rose-400 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleCredentialSubmit} className="space-y-4">
                {/* Identifier Input */}
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-slate-300 block mb-1.5">
                    {t.identifier}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder={t.identifierPh}
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className={"w-full rounded-2xl border pl-11 pr-4 py-3.5 text-xs sm:text-sm font-medium outline-none transition " + (isDark ? "border-white/10 bg-black/40 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:bg-black/60" : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white")}
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-300 block">
                      {t.password}
                    </label>
                    {forgotPasswordEnabled && (
                      <button
                        type="button"
                        onClick={() => setForgotOpen(true)}
                        className="text-xs font-bold text-emerald-400 hover:underline"
                      >
                        {t.forgotPassword}
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={"w-full rounded-2xl border pl-11 pr-11 py-3.5 text-xs sm:text-sm font-medium outline-none transition " + (isDark ? "border-white/10 bg-black/40 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:bg-black/60" : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-3.5 text-slate-400 hover:text-white transition"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-4 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-400 py-4 text-sm font-black text-slate-950 shadow-xl shadow-emerald-500/25 hover:brightness-110 active:scale-[0.99] transition disabled:opacity-50"
                >
                  <span>{loading ? t.nextStepBusy : t.nextStep}</span>
                  <CheckCircle2 className="h-4 w-4 stroke-[2.5]" />
                </button>

                <div className="pt-3 text-center text-xs sm:text-sm text-slate-400 font-medium">
                  {t.noAccount}{" "}
                  <Link to="/register" className="font-bold text-emerald-400 hover:underline">
                    {t.toRegister}
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Forgot Password Modal */}
      {forgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className={"w-full max-w-md p-7 rounded-[32px] border " + (isDark ? "border-white/10 bg-slate-900" : "border-slate-200 bg-white")}>
            <h3 className="font-display text-lg font-black">{t.forgotPassword}</h3>
            <p className="text-xs text-slate-400 mt-1">{t.forgotPasswordHint}</p>

            {forgotError && <div className="mt-4 p-3 rounded-xl bg-rose-500/10 text-rose-400 text-xs font-bold">{forgotError}</div>}
            {forgotSuccess && <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 text-emerald-400 text-xs font-bold">{forgotSuccess}</div>}

            <div className="mt-4 space-y-3">
              <input
                type="email"
                placeholder={t.forgotPasswordEmailPh}
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className={"w-full rounded-2xl border px-4 py-3 text-xs outline-none " + (isDark ? "border-white/10 bg-black/40 text-white" : "border-slate-200 bg-slate-50 text-slate-900")}
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setForgotOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-xs font-bold text-slate-300 hover:bg-white/5"
                >
                  {t.cancelOtp}
                </button>
                <button
                  type="button"
                  disabled={forgotLoading}
                  onClick={handleForgotPassword}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-black hover:bg-emerald-400"
                >
                  {forgotLoading ? t.forgotPasswordSending : t.forgotPasswordSend}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OTP Modal */}
      {otpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className={"w-full max-w-md p-7 rounded-[32px] border " + (isDark ? "border-white/10 bg-slate-900" : "border-slate-200 bg-white")}>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-lg font-black">{t.otpTitle}</h3>
                <p className="text-xs text-slate-400">{t.otpSub}</p>
              </div>
            </div>

            {otpError && <div className="mb-4 p-3 rounded-xl bg-rose-500/10 text-rose-400 text-xs font-bold">{otpError}</div>}
            {otpInfo && <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 text-emerald-400 text-xs font-bold">{otpInfo}</div>}

            {!otpSent ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setOtpChannel("email")}
                    className={"p-3 rounded-2xl border text-xs font-bold transition " + (otpChannel === "email" ? "border-emerald-500 bg-emerald-500/10 text-emerald-400" : "border-white/5 bg-black/20 text-slate-400")}
                  >
                    {t.otpByEmail}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOtpChannel("sms")}
                    className={"p-3 rounded-2xl border text-xs font-bold transition " + (otpChannel === "sms" ? "border-emerald-500 bg-emerald-500/10 text-emerald-400" : "border-white/5 bg-black/20 text-slate-400")}
                  >
                    {t.otpBySms}
                  </button>
                </div>

                <button
                  type="button"
                  disabled={otpSending}
                  onClick={handleSendOtp}
                  className="w-full py-3 rounded-2xl bg-emerald-500 text-slate-950 text-xs font-black hover:bg-emerald-400 transition"
                >
                  {otpSending ? t.sendingCode : t.sendCode}
                </button>
              </div>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1.5">{t.codeLabel}</label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder={t.codePh}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/40 py-3 text-center font-mono text-xl font-bold tracking-widest outline-none focus:border-emerald-500 text-white"
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{t.otpExpiresIn}: {otpSecondsLeft}s</span>
                  <button
                    type="button"
                    disabled={otpCooldown > 0}
                    onClick={handleSendOtp}
                    className="font-bold text-emerald-400 disabled:opacity-40"
                  >
                    {t.resendCode}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={otpVerifying}
                  className="w-full py-3.5 rounded-2xl bg-emerald-500 text-slate-950 text-xs font-black hover:bg-emerald-400 transition"
                >
                  {otpVerifying ? t.verifyingCode : t.verifyCode}
                </button>
              </form>
            )}

            <button
              type="button"
              onClick={() => setOtpOpen(false)}
              className="w-full mt-3 py-2 text-xs font-bold text-slate-500 hover:text-white transition"
            >
              {t.cancelOtp}
            </button>
          </div>
        </div>
      )}

      {/* Modern Global Footer */}
      <footer className="relative z-10 border-t border-white/5 py-6 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} SmartDiet. All rights reserved.
      </footer>
    </div>
  );
}
