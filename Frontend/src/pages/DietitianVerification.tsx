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

export default function DietitianVerification() {
  const navigate = useNavigate();
  const [theme] = useState<Theme>(() => (localStorage.getItem("sd_theme") === "dark" ? "dark" : "light"));
  const [lang] = useState<Lang>(() => (localStorage.getItem("sd_lang") === "en" ? "en" : "tr"));
  const isDark = theme === "dark";

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
      .catch(() => setError(lang === "tr" ? "Doğrulama durumu alınamadı." : "Could not fetch verification status."))
      .finally(() => setLoadingStatus(false));
  }, [lang, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!form.clinic_name || !form.clinic_city || !form.clinic_address || !form.clinic_license_no) {
      setError(lang === "tr" ? "Tüm zorunlu alanları doldur." : "Fill in all required fields.");
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
      setMessage(lang === "tr" ? "Başvuru admine gönderildi." : "Application sent to admin.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : lang === "tr" ? "Hata oluştu." : "An error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={["min-h-screen w-screen", isDark ? "bg-[#07090b] text-white" : "bg-[#e8f0eb] text-[#0f2f29]"].join(" ")}>
      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        <header className="mb-6">
          <h1 className="text-2xl font-extrabold">{lang === "tr" ? "Diyetisyen Doğrulaması" : "Dietitian Verification"}</h1>
          <p className={["mt-2 text-sm", isDark ? "text-zinc-400" : "text-[#4d6b62]"].join(" ")}>
            {lang === "tr"
              ? "Diyetisyen paneline geçmeden önce klinik bilgilerini girmelisin."
              : "Submit clinic information before accessing the dietitian home."}
          </p>
        </header>

        {loadingStatus ? <div className="text-sm">{lang === "tr" ? "Yükleniyor..." : "Loading..."}</div> : null}

        {!loadingStatus && status === "approved" ? (
          <div className={["rounded-2xl border px-4 py-3 text-sm", isDark ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100" : "border-emerald-700/30 bg-emerald-100 text-emerald-900"].join(" ")}>
            {lang === "tr" ? "Başvurun onaylandı. Diyetisyen ana sayfasına yönlendiriliyorsun." : "Application approved. Redirecting to dietitian home."}
          </div>
        ) : null}

        {!loadingStatus && status === "pending" ? (
          <div className={["rounded-2xl border px-4 py-3 text-sm", isDark ? "border-amber-400/30 bg-amber-500/10 text-amber-100" : "border-amber-700/30 bg-amber-100 text-amber-900"].join(" ")}>
            {lang === "tr"
              ? "Başvurun incelemede. Admin onayından sonra diyetisyen ana sayfası açılacak."
              : "Application is pending. Dietitian home opens after admin approval."}
          </div>
        ) : null}

        {!loadingStatus && status !== "approved" && status !== "pending" ? (
          <form onSubmit={onSubmit} className="space-y-4">
            <Field
              isDark={isDark}
              label={lang === "tr" ? "Klinik Adı" : "Clinic Name"}
              value={form.clinic_name}
              onChange={(v) => setForm((p) => ({ ...p, clinic_name: v }))}
            />
            <Field
              isDark={isDark}
              label={lang === "tr" ? "Şehir" : "City"}
              value={form.clinic_city}
              onChange={(v) => setForm((p) => ({ ...p, clinic_city: v }))}
            />
            <Field
              isDark={isDark}
              label={lang === "tr" ? "Adres" : "Address"}
              value={form.clinic_address}
              onChange={(v) => setForm((p) => ({ ...p, clinic_address: v }))}
            />
            <Field
              isDark={isDark}
              label={lang === "tr" ? "Lisans / Belge No" : "License No"}
              value={form.clinic_license_no}
              onChange={(v) => setForm((p) => ({ ...p, clinic_license_no: v }))}
            />
            <Field
              isDark={isDark}
              label={lang === "tr" ? "Not (opsiyonel)" : "Note (optional)"}
              value={form.verification_note}
              onChange={(v) => setForm((p) => ({ ...p, verification_note: v }))}
            />

            {error ? <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">{error}</div> : null}
            {message ? <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">{message}</div> : null}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-400 to-teal-300 px-4 py-3 text-sm font-extrabold text-zinc-950 disabled:opacity-60"
            >
              {submitting ? (lang === "tr" ? "Gönderiliyor..." : "Submitting...") : (lang === "tr" ? "Doğrulama Başvurusu Gönder" : "Submit Verification")}
            </button>
          </form>
        ) : null}

        <div className="mt-6">
          <Link to="/profile" className={["rounded-lg px-3 py-2 text-xs font-semibold", isDark ? "border border-white/10 bg-white/5" : "border border-[#2f6154]/20 bg-white"].join(" ")}>
            {lang === "tr" ? "Profile Dön" : "Back to Profile"}
          </Link>
        </div>
      </main>
    </div>
  );
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
