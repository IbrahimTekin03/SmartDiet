import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

type Theme = "dark" | "light";
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
  submitted_at?: string | null;
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
    fieldClinicName: "Klinik Adı",
    fieldCity: "Şehir",
    fieldAddress: "Adres",
    fieldLicense: "Lisans / Belge No",
    fieldNote: "Not (opsiyonel)",
    requiredError: "Tüm zorunlu alanları doldur.",
    submitSuccess: "Başvuru admine gönderildi.",
    submitLoading: "Gönderiliyor...",
    submitButton: "Doğrulama Başvurusu Gönder",
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
    fieldClinicName: "Clinic Name",
    fieldCity: "City",
    fieldAddress: "Address",
    fieldLicense: "License No",
    fieldNote: "Note (optional)",
    requiredError: "Fill in all required fields.",
    submitSuccess: "Application sent to admin.",
    submitLoading: "Submitting...",
    submitButton: "Submit Verification",
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
  const [theme] = useState<Theme>(() => (localStorage.getItem("sd_theme") === "dark" ? "dark" : "light"));
  const [lang] = useState<Lang>(() => (localStorage.getItem("sd_lang") === "en" ? "en" : "tr"));
  const isDark = theme === "dark";
  const t = COPY[lang];

  const [status, setStatus] = useState<Status>("not_submitted");
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState<FormState>({
    clinic_name: "",
    clinic_city: "",
    clinic_address: "",
    clinic_license_no: "",
    verification_note: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/login");
      return;
    }

    fetch(`${API_BASE}/api/auth/dietitian/verification-status`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data?.message || "status_error");
        return data?.data ?? data;
      })
      .then((data: VerificationStatusResponse) => {
        setStatus(data.status || "not_submitted");
        setForm({
          clinic_name: data.clinic_name || "",
          clinic_city: data.clinic_city || "",
          clinic_address: data.clinic_address || "",
          clinic_license_no: data.clinic_license_no || "",
          verification_note: data.verification_note || "",
        });
      })
      .catch(() => setError(t.statusFetchError))
      .finally(() => setLoadingStatus(false));
  }, [navigate, t.statusFetchError]);

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
      setMessage(t.submitSuccess);
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : "";
      setError(mapVerificationError(raw, lang));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={["min-h-screen w-screen", isDark ? "bg-[#07090b] text-white" : "bg-[#e8f0eb] text-[#0f2f29]"].join(" ")}>
      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        <header className="mb-6">
          <h1 className="text-2xl font-extrabold">{t.title}</h1>
          <p className={["mt-2 text-sm", isDark ? "text-zinc-400" : "text-[#4d6b62]"].join(" ")}>{t.subtitle}</p>
        </header>

        {loadingStatus ? <div className="text-sm">{t.loading}</div> : null}

        {!loadingStatus && status === "approved" ? (
          <StatusBox isDark={isDark} tone="success" text={t.statusApproved} />
        ) : null}

        {!loadingStatus && status === "pending" ? (
          <StatusBox isDark={isDark} tone="warning" text={t.statusPending} />
        ) : null}

        {!loadingStatus && status === "rejected" ? (
          <StatusBox isDark={isDark} tone="danger" text={t.statusRejected} />
        ) : null}

        {!loadingStatus && status !== "approved" && status !== "pending" ? (
          <form onSubmit={onSubmit} className="space-y-4">
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
              {submitting ? t.submitLoading : t.submitButton}
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
