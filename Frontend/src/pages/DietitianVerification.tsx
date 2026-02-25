import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppSettings } from "../context/AppSettingsContext";

type Lang = "tr" | "en";
type Status = "not_submitted" | "pending" | "approved" | "rejected";

type VerificationStatusResponse = {
  account_type: "client" | "dietitian";
  status: Status;
  clinic_name?: string | null;
  clinic_city?: string | null;
  clinic_address?: string | null;
  clinic_license_no?: string | null;
  verification_note?: string | null;
  review_note?: string | null;
  submitted_at?: string | null;
  reviewed_at?: string | null;
};

type FormState = {
  clinic_name: string;
  clinic_city: string;
  clinic_address: string;
  clinic_license_no: string;
  verification_note: string;
};

const API_BASE = "http://localhost:3000";

const COPY = {
  tr: {
    title: "Diyetisyen Doğrulaması",
    subtitle: "Diyetisyen paneline geçmeden önce klinik bilgilerini göndermelisin.",
    loading: "Yükleniyor...",
    statusApproved: "Başvurun onaylandı. Diyetisyen ana sayfasına yönlendiriliyorsun.",
    statusPending: "Başvurun incelemede. Admin onayından sonra diyetisyen ekranı açılacak.",
    statusRejected: "Başvurun reddedildi. Bilgileri güncelleyip tekrar gönderebilirsin.",
    rejectReasonTitle: "Red Nedeni",
    statusDatesTitle: "Başvuru Detayı",
    submittedAt: "Gönderim",
    reviewedAt: "İnceleme",
    fieldClinicName: "Klinik Adı",
    fieldCity: "Şehir",
    fieldAddress: "Adres",
    fieldLicense: "Lisans / Belge No",
    fieldNote: "Not (opsiyonel)",
    requiredError: "Tüm zorunlu alanları doldur.",
    submitSuccess: "Başvuru admine gönderildi.",
    submitLoading: "Gönderiliyor...",
    submitButton: "Doğrulama Başvurusu Gönder",
    resubmitButton: "Bilgileri Güncelle ve Tekrar Gönder",
    backProfile: "Profil'e Dön",
    genericError: "Bir hata oluştu.",
    statusFetchError: "Doğrulama durumu alınamadı.",
    submitError: "Başvuru gönderilemedi. Lütfen tekrar dene.",
  },
  en: {
    title: "Dietitian Verification",
    subtitle: "Submit clinic information before accessing the dietitian panel.",
    loading: "Loading...",
    statusApproved: "Application approved. Redirecting to dietitian home.",
    statusPending: "Application is pending. Dietitian home opens after admin approval.",
    statusRejected: "Application was rejected. You can update details and submit again.",
    rejectReasonTitle: "Rejection Reason",
    statusDatesTitle: "Application Details",
    submittedAt: "Submitted",
    reviewedAt: "Reviewed",
    fieldClinicName: "Clinic Name",
    fieldCity: "City",
    fieldAddress: "Address",
    fieldLicense: "License No",
    fieldNote: "Note (optional)",
    requiredError: "Fill in all required fields.",
    submitSuccess: "Application sent to admin.",
    submitLoading: "Submitting...",
    submitButton: "Submit Verification",
    resubmitButton: "Update and Resubmit",
    backProfile: "Back to Profile",
    genericError: "An error occurred.",
    statusFetchError: "Could not fetch verification status.",
    submitError: "Could not submit application. Please try again.",
  },
} as const;

function mapVerificationError(message: string, lang: Lang): string {
  const t = COPY[lang];
  const normalized = String(message || "").toLowerCase();
  if (!normalized) return t.genericError;
  if (normalized.includes("validation")) return t.requiredError;
  if (normalized.includes("required")) return t.requiredError;
  if (normalized.includes("forbidden")) return t.submitError;
  if (normalized.includes("unauthorized")) return t.submitError;
  if (normalized.includes("failed to fetch")) return t.submitError;
  return lang === "tr" ? t.submitError : message;
}

export default function DietitianVerification() {
  const navigate = useNavigate();
  const { lang, isDark } = useAppSettings();
  const t = COPY[lang];

  const [status, setStatus] = useState<Status>("not_submitted");
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [reviewNote, setReviewNote] = useState("");
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [reviewedAt, setReviewedAt] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    clinic_name: "",
    clinic_city: "",
    clinic_address: "",
    clinic_license_no: "",
    verification_note: "",
  });

  const formatDateTime = useCallback((value?: string | null) => {
    if (!value) return "-";
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return "-";
    return dt.toLocaleString(lang === "tr" ? "tr-TR" : "en-US");
  }, [lang]);

  const loadStatus = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/dietitian/verification-status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "status_error");
      const payload = (data?.data ?? data) as VerificationStatusResponse;
      setStatus(payload.status || "not_submitted");
      setReviewNote(String(payload.review_note || "").trim());
      setSubmittedAt(payload.submitted_at || null);
      setReviewedAt(payload.reviewed_at || null);
      setForm({
        clinic_name: payload.clinic_name || "",
        clinic_city: payload.clinic_city || "",
        clinic_address: payload.clinic_address || "",
        clinic_license_no: payload.clinic_license_no || "",
        verification_note: payload.verification_note || "",
      });
      setError("");
    } catch {
      setError(t.statusFetchError);
    } finally {
      setLoadingStatus(false);
    }
  }, [navigate, t.statusFetchError]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    if (status !== "pending") return;
    const timer = window.setInterval(() => {
      loadStatus();
    }, 15000);
    return () => window.clearInterval(timer);
  }, [loadStatus, status]);

  useEffect(() => {
    if (status !== "approved") return;
    const timer = window.setTimeout(() => navigate("/"), 1200);
    return () => window.clearTimeout(timer);
  }, [navigate, status]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!form.clinic_name || !form.clinic_city || !form.clinic_address || !form.clinic_license_no) {
      setError(t.requiredError);
      return;
    }

    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/login");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/dietitian/verification`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "verification_submit_error");
      setStatus("pending");
      setReviewNote("");
      setReviewedAt(null);
      setMessage(t.submitSuccess);
      loadStatus();
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : "";
      setError(mapVerificationError(raw, lang));
    } finally {
      setSubmitting(false);
    }
  };

  const submitLabel = status === "rejected" ? t.resubmitButton : t.submitButton;

  return (
    <div className={["min-h-screen w-screen", isDark ? "bg-[#07090b] text-white" : "bg-[#e8f0eb] text-[#0f2f29]"].join(" ")}>
      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        <header className="mb-6">
          <h1 className="text-2xl font-extrabold">{t.title}</h1>
          <p className={["mt-2 text-sm", isDark ? "text-zinc-400" : "text-[#4d6b62]"].join(" ")}>{t.subtitle}</p>
        </header>

        {loadingStatus ? <div className="text-sm">{t.loading}</div> : null}

        {!loadingStatus && status === "approved" ? <StatusBox isDark={isDark} tone="success" text={t.statusApproved} /> : null}
        {!loadingStatus && status === "pending" ? <StatusBox isDark={isDark} tone="warning" text={t.statusPending} /> : null}
        {!loadingStatus && status === "rejected" ? <StatusBox isDark={isDark} tone="danger" text={t.statusRejected} /> : null}

        {!loadingStatus && status === "rejected" && reviewNote ? (
          <div className={["mt-3 rounded-2xl border px-4 py-3 text-sm", isDark ? "border-rose-400/30 bg-rose-500/10 text-rose-100" : "border-rose-700/30 bg-rose-100 text-rose-900"].join(" ")}>
            <div className="mb-1 font-extrabold">{t.rejectReasonTitle}</div>
            <div>{reviewNote}</div>
          </div>
        ) : null}

        {!loadingStatus && (submittedAt || reviewedAt) ? (
          <div className={["mt-3 rounded-2xl border px-4 py-3 text-sm", isDark ? "border-white/10 bg-white/5 text-zinc-200" : "border-[#2f6154]/20 bg-white text-[#1f4a3f]"].join(" ")}>
            <div className="mb-2 font-extrabold">{t.statusDatesTitle}</div>
            <div className="grid gap-1 text-xs sm:grid-cols-2">
              <div><span className="font-semibold">{t.submittedAt}:</span> {formatDateTime(submittedAt)}</div>
              <div><span className="font-semibold">{t.reviewedAt}:</span> {formatDateTime(reviewedAt)}</div>
            </div>
          </div>
        ) : null}

        {!loadingStatus && status !== "approved" && status !== "pending" ? (
          <form onSubmit={onSubmit} className="mt-4 space-y-4">
            <Field isDark={isDark} label={t.fieldClinicName} value={form.clinic_name} onChange={(v) => setForm((p) => ({ ...p, clinic_name: v }))} />
            <Field isDark={isDark} label={t.fieldCity} value={form.clinic_city} onChange={(v) => setForm((p) => ({ ...p, clinic_city: v }))} />
            <Field isDark={isDark} label={t.fieldAddress} value={form.clinic_address} onChange={(v) => setForm((p) => ({ ...p, clinic_address: v }))} />
            <Field isDark={isDark} label={t.fieldLicense} value={form.clinic_license_no} onChange={(v) => setForm((p) => ({ ...p, clinic_license_no: v }))} />
            <Field isDark={isDark} label={t.fieldNote} value={form.verification_note} onChange={(v) => setForm((p) => ({ ...p, verification_note: v }))} />

            {error ? <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">{error}</div> : null}
            {message ? <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">{message}</div> : null}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-400 to-teal-300 px-4 py-3 text-sm font-extrabold text-zinc-950 disabled:opacity-60"
            >
              {submitting ? t.submitLoading : submitLabel}
            </button>
          </form>
        ) : null}

        <div className="mt-6">
          <Link
            to="/profile"
            className={["rounded-lg px-3 py-2 text-xs font-semibold", isDark ? "border border-white/10 bg-white/5" : "border border-[#2f6154]/20 bg-white"].join(" ")}
          >
            {t.backProfile}
          </Link>
        </div>
      </main>
    </div>
  );
}

function StatusBox({ isDark, tone, text }: { isDark: boolean; tone: "success" | "warning" | "danger"; text: string }) {
  const palette =
    tone === "success"
      ? isDark
        ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
        : "border-emerald-700/30 bg-emerald-100 text-emerald-900"
      : tone === "warning"
        ? isDark
          ? "border-amber-400/30 bg-amber-500/10 text-amber-100"
          : "border-amber-700/30 bg-amber-100 text-amber-900"
        : isDark
          ? "border-rose-400/30 bg-rose-500/10 text-rose-100"
          : "border-rose-700/30 bg-rose-100 text-rose-900";

  return <div className={["rounded-2xl border px-4 py-3 text-sm", palette].join(" ")}>{text}</div>;
}

function Field({
  isDark,
  label,
  value,
  onChange,
}: {
  isDark: boolean;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className={isDark ? "mb-1 block text-xs text-zinc-300" : "mb-1 block text-xs text-[#4d6b62]"}>{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={[
          "w-full rounded-xl border px-3 py-2 text-sm outline-none",
          isDark ? "border-white/10 bg-white/5 text-white" : "border-[#2f6154]/20 bg-white text-[#123a32]",
        ].join(" ")}
      />
    </div>
  );
}