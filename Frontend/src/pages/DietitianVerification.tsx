import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppSettings } from "../context/AppSettingsContext";
import { TURKEY_CITIES } from "../data/turkeyCities";

type Lang = "tr" | "en";
type Status = "not_submitted" | "pending" | "approved" | "rejected";

type VerificationStatusResponse = {
  account_type: "client" | "Diyetisyen";
  status: Status;
  clinic_name?: string | null;
  clinic_city?: string | null;
  clinic_address?: string | null;
  verification_note?: string | null;
  review_note?: string | null;
  submitted_at?: string | null;
  reviewed_at?: string | null;
};

type Clinic = {
  id: string;
  name: string;
  city: string;
  address: string;
};

type FormState = {
  clinic_name: string;
  clinic_city: string;
  clinic_district: string;
  clinic_address: string;
  verification_note: string;
};

const API_BASE = "http://localhost:3000";

const COPY = {
  tr: {
    tag: "Başvuru",
    title: "Diyetisyen Doğrulaması",
    subtitle: "Klinik bilgilerini gönder, başvuru durumunu sade bir ekrandan takip et.",
    loading: "Yükleniyor...",
    statusTitle: "Durum",
    formTitle: "Klinik Bilgileri",
    fileOptional: "Dosya opsiyonel",
    statusApproved: "Başvurun onaylandı. Diyetisyen ana sayfasına yönlendiriliyorsun.",
    statusPending: "Başvurun inceleme sürecinde. Admin onayından sonra diyetisyen ekranın açılacak.",
    statusRejected: "Başvurun reddedildi. Bilgilerini güncelleyerek yeniden gönderebilirsin.",
    statusFresh: "Klinik bilgilerini göndererek doğrulama sürecini başlat.",
    rejectReasonTitle: "Red Nedeni",
    statusDatesTitle: "Başvuru Detayı",
    submittedAt: "Gönderim",
    reviewedAt: "İnceleme",
    clinicSelect: "Kayıtlı Klinik",
    clinicSelectEmpty: "Manuel giriş veya seçim yap",
    fieldClinicName: "Klinik Adı",
    fieldCity: "İl",
    fieldDistrict: "İlçe",
    fieldAddress: "Adres",
    fieldNote: "Ek Not",
    fieldCertificate: "Sertifika/Diploma",
    requiredError: "Lütfen tüm zorunlu alanları doldur.",
    submitSuccess: "Başvurun admin onayına gönderildi.",
    submitLoading: "Gönderiliyor...",
    submitButton: "Doğrulama Başvurusu Gönder",
    resubmitButton: "Bilgileri Güncelle ve Yeniden Gönder",
    backProfile: "Profile Dön",
    genericError: "Beklenmeyen bir hata oluştu.",
    statusFetchError: "Doğrulama durumu alınamadı.",
    submitError: "Başvuru gönderilemedi. Lütfen tekrar dene.",
    approved: "Onaylı",
    pending: "İncelemede",
    rejected: "Reddedildi",
    fresh: "Yeni",
  },
  en: {
    tag: "Application",
    title: "Dietitian Verification",
    subtitle: "Submit clinic details and track the review status from one focused screen.",
    loading: "Loading...",
    statusTitle: "Status",
    formTitle: "Clinic Details",
    fileOptional: "File optional",
    statusApproved: "Application approved. Redirecting to dietitian home.",
    statusPending: "Application is pending. Dietitian home opens after admin approval.",
    statusRejected: "Application was rejected. You can update details and submit again.",
    statusFresh: "Submit clinic details to start verification.",
    rejectReasonTitle: "Rejection Reason",
    statusDatesTitle: "Application Details",
    submittedAt: "Submitted",
    reviewedAt: "Reviewed",
    clinicSelect: "Registered Clinic",
    clinicSelectEmpty: "Manual entry or select clinic",
    fieldClinicName: "Clinic Name",
    fieldCity: "Province",
    fieldDistrict: "District",
    fieldAddress: "Address",
    fieldNote: "Note",
    fieldCertificate: "Certificate/Diploma",
    requiredError: "Fill in all required fields.",
    submitSuccess: "Application sent to admin.",
    submitLoading: "Submitting...",
    submitButton: "Submit Verification",
    resubmitButton: "Update and Resubmit",
    backProfile: "Back to Profile",
    genericError: "An error occurred.",
    statusFetchError: "Could not fetch verification status.",
    submitError: "Could not submit application. Please try again.",
    approved: "Approved",
    pending: "Pending",
    rejected: "Rejected",
    fresh: "New",
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

function splitClinicCity(value?: string | null) {
  const raw = String(value || "").trim();
  if (!raw) return { city: "", district: "" };
  const parts = raw.split(/\s+(?:\/|-)\s+|,\s*/).map((part) => part.trim()).filter(Boolean);
  return {
    city: parts[0] || raw,
    district: parts.slice(1).join(" / "),
  };
}

function composeClinicCity(city: string, district: string) {
  const cleanCity = city.trim();
  const cleanDistrict = district.trim();
  return cleanDistrict ? `${cleanCity} / ${cleanDistrict}` : cleanCity;
}

export default function DietitianVerification() {
  const navigate = useNavigate();
  const { lang, isDark } = useAppSettings();
  const t = COPY[lang];
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [selectedClinicId, setSelectedClinicId] = useState("");
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
    clinic_district: "",
    clinic_address: "",
    verification_note: "",
  });
  const [certificateFile, setCertificateFile] = useState<File | null>(null);

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
      const location = splitClinicCity(payload.clinic_city);
      setForm({
        clinic_name: payload.clinic_name || "",
        clinic_city: location.city,
        clinic_district: location.district,
        clinic_address: payload.clinic_address || "",
        verification_note: payload.verification_note || "",
      });
      setError("");
    } catch {
      setError(t.statusFetchError);
    } finally {
      setLoadingStatus(false);
    }
  }, [navigate, t.statusFetchError]);

  const loadClinics = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/clinics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setClinics(Array.isArray(data?.data) ? data.data : []);
    } catch {
      // Clinic suggestions are optional.
    }
  }, []);

  useEffect(() => {
    void loadStatus();
    void loadClinics();
  }, [loadStatus, loadClinics]);

  useEffect(() => {
    if (status !== "pending") return;
    const timer = window.setInterval(() => {
      void loadStatus();
    }, 15000);
    return () => window.clearInterval(timer);
  }, [loadStatus, status]);

  useEffect(() => {
    if (status !== "approved") return;
    const timer = window.setTimeout(() => navigate("/"), 1200);
    return () => window.clearTimeout(timer);
  }, [navigate, status]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!form.clinic_name || !form.clinic_city || !form.clinic_district || !form.clinic_address) {
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
      const formData = new FormData();
      formData.append("clinic_name", form.clinic_name);
      formData.append("clinic_city", composeClinicCity(form.clinic_city, form.clinic_district));
      formData.append("clinic_address", form.clinic_address);
      if (form.verification_note) formData.append("verification_note", form.verification_note);
      if (selectedClinicId) formData.append("clinic_id", selectedClinicId);
      if (certificateFile) formData.append("certificate", certificateFile);

      const res = await fetch(`${API_BASE}/api/auth/dietitian/verification`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "verification_submit_error");
      setStatus("pending");
      setReviewNote("");
      setReviewedAt(null);
      setMessage(t.submitSuccess);
      void loadStatus();
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : "";
      setError(mapVerificationError(raw, lang));
    } finally {
      setSubmitting(false);
    }
  };

  const onClinicSelect = (id: string) => {
    setSelectedClinicId(id);
    const clinic = clinics.find((c) => c.id === id);
    if (clinic) {
      const location = splitClinicCity(clinic.city);
      setForm((p) => ({
        ...p,
        clinic_name: clinic.name,
        clinic_city: location.city,
        clinic_district: location.district,
        clinic_address: clinic.address,
      }));
    }
  };

  const submitLabel = status === "rejected" ? t.resubmitButton : t.submitButton;

  return (
    <div className={["relative min-h-screen w-screen overflow-x-hidden", isDark ? "text-zinc-50" : "bg-[#f7f1e7] text-[#2f2b22]"].join(" ")}>
      <div className="pointer-events-none absolute inset-0">
        <div
          className={
            isDark
              ? "absolute inset-0 [background:radial-gradient(1000px_620px_at_18%_6%,rgba(16,185,129,0.20),transparent_58%),radial-gradient(760px_540px_at_92%_12%,rgba(20,184,166,0.12),transparent_60%),linear-gradient(180deg,#050608,#07090b_56%,#050608)]"
              : "absolute inset-0 bg-[#f7f1e7]"
          }
        />
        {isDark ? <div className="absolute inset-0 opacity-[0.08] [background-image:radial-gradient(rgba(255,255,255,0.14)_1px,transparent_1px)] [background-size:18px_18px]" /> : null}
      </div>

      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-10 pt-5 sm:px-5 lg:px-6">
        <header className={panelClass(isDark, "mb-3 px-4 py-3.5")}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className={badgeClass(isDark)}>{t.tag}</div>
              <h1 className="mt-2 text-2xl font-black leading-tight">{t.title}</h1>
              <p className={["mt-1 max-w-2xl text-xs leading-5", isDark ? "text-zinc-400" : "text-[#7b6d58]"].join(" ")}>
                {t.subtitle}
              </p>
            </div>
            <Link to="/profile" className={secondaryButtonClass(isDark)}>{t.backProfile}</Link>
          </div>
        </header>

        {loadingStatus ? (
          <div className={panelClass(isDark, "px-4 py-4 text-sm")}>{t.loading}</div>
        ) : (
          <section className="grid gap-3 lg:grid-cols-[320px_minmax(0,1fr)]">
            <aside className={panelClass(isDark, "px-4 py-4")}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-sm font-black">{t.statusTitle}</h2>
                <span className={statusPillClass(isDark, status)}>{statusLabel(status, lang)}</span>
              </div>

              {status === "approved" ? <StatusBox isDark={isDark} tone="success" text={t.statusApproved} /> : null}
              {status === "pending" ? <StatusBox isDark={isDark} tone="warning" text={t.statusPending} /> : null}
              {status === "rejected" ? <StatusBox isDark={isDark} tone="danger" text={t.statusRejected} /> : null}
              {status === "not_submitted" ? <StatusBox isDark={isDark} tone="neutral" text={t.statusFresh} /> : null}

              {status === "rejected" && reviewNote ? (
                <div className={["mt-3 rounded-xl border px-3 py-3 text-xs", isDark ? "border-rose-400/25 bg-rose-500/10 text-rose-100" : "border-rose-200 bg-rose-50 text-rose-800"].join(" ")}>
                  <div className="mb-1 font-black">{t.rejectReasonTitle}</div>
                  <div className="leading-5">{reviewNote}</div>
                </div>
              ) : null}

              <div className={["mt-4 border-t pt-4", isDark ? "border-emerald-400/10" : "border-[#dfd0b9]"].join(" ")}>
                <div className="mb-2 text-xs font-black">{t.statusDatesTitle}</div>
                <DetailRow isDark={isDark} label={t.submittedAt} value={formatDateTime(submittedAt)} />
                <DetailRow isDark={isDark} label={t.reviewedAt} value={formatDateTime(reviewedAt)} />
              </div>
            </aside>

            <section className={panelClass(isDark, "px-4 py-4")}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-sm font-black">{t.formTitle}</h2>
                <span className={["text-[11px] font-bold", isDark ? "text-zinc-500" : "text-[#8a7a61]"].join(" ")}>
                  {certificateFile?.name || t.fileOptional}
                </span>
              </div>

              {status !== "approved" && status !== "pending" ? (
                <form onSubmit={onSubmit} className="space-y-3">
                  <div>
                    <label className={labelClass(isDark)}>{t.clinicSelect}</label>
                    <select value={selectedClinicId} onChange={(e) => onClinicSelect(e.target.value)} className={inputClass(isDark)}>
                      <option value="">{t.clinicSelectEmpty}</option>
                      {clinics.map((c) => (
                        <option key={c.id} value={c.id}>{c.name} ({c.city})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Field isDark={isDark} label={t.fieldClinicName} value={form.clinic_name} onChange={(v) => setForm((p) => ({ ...p, clinic_name: v }))} />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className={labelClass(isDark)}>{t.fieldCity}</label>
                      <select
                        value={form.clinic_city}
                        onChange={(e) => {
                          const newCity = e.target.value;
                          setForm((p) => ({
                            ...p,
                            clinic_city: newCity,
                            clinic_district: "",
                          }));
                        }}
                        className={inputClass(isDark)}
                        required
                      >
                        <option value="">-- {lang === "tr" ? "İl Seçin" : "Select Province"} --</option>
                        {Object.keys(TURKEY_CITIES).sort((a, b) => a.localeCompare(b, "tr")).map((city) => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={labelClass(isDark)}>{t.fieldDistrict}</label>
                      <select
                        value={form.clinic_district}
                        onChange={(e) => {
                          const newDistrict = e.target.value;
                          setForm((p) => ({
                            ...p,
                            clinic_district: newDistrict,
                          }));
                        }}
                        className={inputClass(isDark)}
                        required
                        disabled={!form.clinic_city}
                      >
                        <option value="">-- {lang === "tr" ? "İlçe Seçin" : "Select District"} --</option>
                        {(TURKEY_CITIES[form.clinic_city] || []).map((district) => (
                          <option key={district} value={district}>{district}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <Field isDark={isDark} label={t.fieldAddress} value={form.clinic_address} onChange={(v) => setForm((p) => ({ ...p, clinic_address: v }))} multiline />
                  <Field isDark={isDark} label={t.fieldNote} value={form.verification_note} onChange={(v) => setForm((p) => ({ ...p, verification_note: v }))} multiline />

                  <div>
                    <label className={labelClass(isDark)}>{t.fieldCertificate}</label>
                    <input
                      type="file"
                      accept=".pdf,image/png,image/jpeg,image/jpg"
                      onChange={(e) => setCertificateFile(e.target.files?.[0] || null)}
                      className={[
                        inputClass(isDark),
                        isDark ? "file:text-emerald-200" : "file:text-[#745737]",
                        "file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-500/10 file:px-3 file:py-1 file:text-xs file:font-black hover:file:bg-emerald-500/20",
                      ].join(" ")}
                    />
                  </div>

                  {error ? <MessageBox isDark={isDark} tone="danger" text={error} /> : null}
                  {message ? <MessageBox isDark={isDark} tone="success" text={message} /> : null}

                  <button type="submit" disabled={submitting} className={primaryButtonClass(isDark)}>
                    {submitting ? t.submitLoading : submitLabel}
                  </button>
                </form>
              ) : (
                <div className={["rounded-xl border px-4 py-8 text-center text-sm", isDark ? "border-transparent bg-black/20 text-zinc-300 shadow-[inset_0_1px_0_rgba(16,185,129,0.08)]" : "border-[#dfd0b9] bg-[#fdf8ee] text-[#756449]"].join(" ")}>
                  {status === "approved" ? t.statusApproved : t.statusPending}
                </div>
              )}
            </section>
          </section>
        )}
      </main>
    </div>
  );
}

function StatusBox({ isDark, tone, text }: { isDark: boolean; tone: "success" | "warning" | "danger" | "neutral"; text: string }) {
  const palette =
    tone === "success"
      ? isDark
        ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
        : "border-[#c7dbc7] bg-[#edf6ec] text-[#285743]"
      : tone === "warning"
        ? isDark
          ? "border-amber-400/30 bg-amber-500/10 text-amber-100"
          : "border-amber-200 bg-amber-50 text-amber-800"
        : tone === "neutral"
          ? isDark
            ? "border-transparent bg-black/20 text-zinc-300 shadow-[inset_0_1px_0_rgba(16,185,129,0.08)]"
            : "border-[#dfd0b9] bg-[#fdf8ee] text-[#756449]"
          : isDark
            ? "border-rose-400/30 bg-rose-500/10 text-rose-100"
            : "border-rose-200 bg-rose-50 text-rose-800";

  return <div className={["rounded-xl border px-3 py-3 text-xs leading-5", palette].join(" ")}>{text}</div>;
}

function Field({
  isDark,
  label,
  value,
  onChange,
  multiline = false,
}: {
  isDark: boolean;
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <div>
      <label className={labelClass(isDark)}>{label}</label>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className={inputClass(isDark)} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} className={inputClass(isDark)} />
      )}
    </div>
  );
}

function panelClass(isDark: boolean, extra = "") {
  return [
    "border",
    isDark
      ? "rounded-2xl border-transparent bg-white/5 shadow-[inset_0_1px_0_rgba(16,185,129,0.08),0_24px_90px_rgba(0,0,0,0.42)]"
      : "rounded-lg border-[#dfd0b9] bg-[#fffaf0] shadow-sm",
    extra,
  ].join(" ");
}

function badgeClass(isDark: boolean) {
  return [
    "inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase",
    isDark ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-100" : "border-[#dfd0b9] bg-[#f1e4cf] text-[#745737]",
  ].join(" ");
}

function labelClass(isDark: boolean) {
  return ["mb-1 block text-xs font-bold", isDark ? "text-zinc-300" : "text-[#806f57]"].join(" ");
}

function inputClass(isDark: boolean) {
  return [
    "w-full border px-3 py-2 text-sm outline-none transition",
    isDark
      ? "rounded-xl border-transparent bg-black/20 text-white placeholder:text-zinc-500 focus:border-emerald-400/40 focus:ring-4 focus:ring-emerald-500/10"
      : "rounded-md border-[#dfd0b9] bg-[#fffdf7] text-[#342b1d] focus:border-[#8a6a3f]/55 focus:ring-2 focus:ring-[#8a6a3f]/12",
  ].join(" ");
}

function primaryButtonClass(isDark: boolean) {
  return [
    "w-full px-4 py-2.5 text-sm font-black shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60",
    isDark
      ? "rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-300 text-zinc-950 shadow-[0_18px_60px_rgba(16,185,129,0.20)] hover:brightness-110"
      : "rounded-md bg-[#8a6a3f] text-white hover:bg-[#765932]",
  ].join(" ");
}

function secondaryButtonClass(isDark: boolean) {
  return [
    "border px-3 py-1.5 text-xs font-bold shadow-sm transition",
    isDark ? "rounded-full border-transparent bg-white/5 text-zinc-100 hover:bg-white/10" : "rounded-md border-[#dfd0b9] bg-[#fffaf0] text-[#6d5433] hover:bg-white",
  ].join(" ");
}

function statusLabel(status: Status, lang: Lang) {
  if (status === "approved") return lang === "tr" ? "Onaylı" : "Approved";
  if (status === "pending") return lang === "tr" ? "İncelemede" : "Pending";
  if (status === "rejected") return lang === "tr" ? "Reddedildi" : "Rejected";
  return lang === "tr" ? "Yeni" : "New";
}

function statusPillClass(isDark: boolean, status: Status) {
  const tone = status === "approved" ? "success" : status === "pending" ? "warning" : status === "rejected" ? "danger" : "neutral";
  return [
    "rounded-full border px-2.5 py-1 text-[10px] font-black uppercase",
    tone === "success"
      ? (isDark ? "border-emerald-300/25 bg-emerald-500/12 text-emerald-100" : "border-[#c7dbc7] bg-[#edf6ec] text-[#285743]")
      : tone === "warning"
        ? (isDark ? "border-amber-300/25 bg-amber-500/12 text-amber-100" : "border-amber-200 bg-amber-50 text-amber-800")
        : tone === "danger"
          ? (isDark ? "border-rose-300/25 bg-rose-500/12 text-rose-100" : "border-rose-200 bg-rose-50 text-rose-800")
          : (isDark ? "border-transparent bg-white/5 text-zinc-200" : "border-[#dfd0b9] bg-[#f7eedf] text-[#745737]"),
  ].join(" ");
}

function DetailRow({ isDark, label, value }: { isDark: boolean; label: string; value: string }) {
  return (
    <div className={["mt-2 flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-xs", isDark ? "bg-black/25" : "bg-[#f4efe4]"].join(" ")}>
      <span className={isDark ? "text-zinc-400" : "text-[#806f57]"}>{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}

function MessageBox({ isDark, tone, text }: { isDark: boolean; tone: "success" | "danger"; text: string }) {
  return (
    <div className={["rounded-xl border px-3 py-2 text-xs", tone === "success" ? (isDark ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100" : "border-[#dfd0b9] bg-[#f5ead7] text-[#745737]") : (isDark ? "border-rose-500/30 bg-rose-500/10 text-rose-200" : "border-rose-300 bg-rose-50 text-rose-700")].join(" ")}>
      {text}
    </div>
  );
}
