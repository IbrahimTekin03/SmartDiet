import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppSettings } from "../context/AppSettingsContext";
import { TURKEY_CITIES } from "../data/turkeyCities";
import { API_BASE_URL as API_BASE } from "../lib/api";
import { 
  Building2, 
  MapPin, 
  Upload, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Sparkles, 
  ArrowRight, 
  AlertCircle, 
  RefreshCw, 
  ArrowLeft
} from "lucide-react";

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

const COPY = {
  tr: {
    tag: "Uzman Doğrulama",
    title: "Diyetisyen Doğrulaması",
    subtitle: "Klinik ve lisans bilgilerinizi ileterek SmartDiet uzman ağına katılın.",
    loading: "Bilgiler alınıyor...",
    statusTitle: "Başvuru Durumu",
    formTitle: "Klinik & Lisans Bilgileri",
    fileOptional: "Diploma veya Sertifika (PDF / Görsel - Opsiyonel)",
    statusApproved: "Başvurunuz onaylandı! Diyetisyen paneline yönlendiriliyorsunuz.",
    statusPending: "Başvurunuz inceleme aşamasındadır. Yönetici onayının ardından paneliniz açılacaktır.",
    statusRejected: "Başvurunuz onaylanamadı. Bilgilerinizi revize ederek yeniden gönderebilirsiniz.",
    statusFresh: "Klinik bilgilerinizi eksiksiz doldurarak doğrulama sürecinizi başlatın.",
    rejectReasonTitle: "İnceleme Notu / Red Nedeni",
    statusDatesTitle: "Başvuru Zaman Çizelgesi",
    submittedAt: "Gönderilme Tarihi",
    reviewedAt: "Son İnceleme",
    clinicSelect: "Kayıtlı Kliniklerden Seç",
    clinicSelectEmpty: "Listeden seçin veya yeni klinik girin",
    fieldClinicName: "Klinik / Muayenehane Adı",
    fieldCity: "Şehir / İl",
    fieldDistrict: "İlçe",
    fieldAddress: "Açık Adres",
    fieldNote: "Ekstra Not / Uzmanlık Alanları",
    fieldCertificate: "Belge Yükle",
    requiredError: "Lütfen zorunlu alanları (Klinik adı, İl ve Adres) doldurunuz.",
    submitSuccess: "Başvurunuz başarıyla yönetici onayına iletildi.",
    submitLoading: "Gönderiliyor...",
    submitButton: "Doğrulama Başvurusunu Gönder",
    resubmitButton: "Bilgileri Güncelle ve Yeniden Gönder",
    backProfile: "Profilime Dön",
    genericError: "İşlem gerçekleştirilemedi.",
    statusFetchError: "Başvuru durumu yüklenirken bir sorun oluştu.",
    submitError: "Başvuru gönderilemedi. Lütfen tekrar deneyiniz.",
    approved: "Onaylandı",
    pending: "İncelemede",
    rejected: "Reddedildi",
    fresh: "Başvuru Bekliyor",
  },
  en: {
    tag: "Practitioner Verification",
    title: "Dietitian Verification",
    subtitle: "Submit clinic & license credentials to join the SmartDiet verified network.",
    loading: "Fetching details...",
    statusTitle: "Application Status",
    formTitle: "Clinic & License Credentials",
    fileOptional: "Diploma or Certificate (PDF / Image - Optional)",
    statusApproved: "Application approved! Redirecting to dietitian console.",
    statusPending: "Your application is under review. Full access unlocks upon admin approval.",
    statusRejected: "Application was not approved. Update your details and submit again.",
    statusFresh: "Provide clinic details to initiate the verification process.",
    rejectReasonTitle: "Reviewer Feedback",
    statusDatesTitle: "Timeline",
    submittedAt: "Submitted On",
    reviewedAt: "Reviewed On",
    clinicSelect: "Select from Registered Clinics",
    clinicSelectEmpty: "Select existing or create new",
    fieldClinicName: "Clinic / Practice Name",
    fieldCity: "City",
    fieldDistrict: "District",
    fieldAddress: "Full Address",
    fieldNote: "Additional Notes / Specializations",
    fieldCertificate: "Upload Document",
    requiredError: "Please fill in all required fields (Clinic Name, City, Address).",
    submitSuccess: "Application successfully submitted for admin review.",
    submitLoading: "Submitting...",
    submitButton: "Submit Verification Request",
    resubmitButton: "Update & Resubmit Application",
    backProfile: "Back to Profile",
    genericError: "An unexpected error occurred.",
    statusFetchError: "Could not fetch verification status.",
    submitError: "Could not submit application. Please retry.",
    approved: "Approved",
    pending: "Under Review",
    rejected: "Rejected",
    fresh: "Not Submitted",
  },
};

function splitClinicCity(value?: string | null) {
  const raw = String(value || "").trim();
  if (!raw) return { city: "", district: "" };
  const parts = raw.split(/\s+(?:\/|-)\s+|,\s*/).map((p) => p.trim()).filter(Boolean);
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

      if (payload.status === "approved") {
        setTimeout(() => navigate("/", { replace: true }), 1200);
      }
    } catch {
      setError(t.statusFetchError);
    } finally {
      setLoadingStatus(false);
    }
  }, [navigate, t.statusFetchError]);

  useEffect(() => {
    loadStatus();
    fetch(`${API_BASE}/api/clinics`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setClinics(data.data);
        }
      })
      .catch(() => {});
  }, [loadStatus]);

  const handleClinicSelect = (clinicId: string) => {
    setSelectedClinicId(clinicId);
    if (!clinicId) return;
    const cl = clinics.find((c) => c.id === clinicId);
    if (cl) {
      const loc = splitClinicCity(cl.city);
      setForm((prev) => ({
        ...prev,
        clinic_name: cl.name,
        clinic_city: loc.city,
        clinic_district: loc.district,
        clinic_address: cl.address,
      }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!form.clinic_name.trim() || !form.clinic_city.trim() || !form.clinic_address.trim()) {
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
      formData.append("clinic_name", form.clinic_name.trim());
      formData.append("clinic_city", composeClinicCity(form.clinic_city, form.clinic_district));
      formData.append("clinic_address", form.clinic_address.trim());
      if (form.verification_note.trim()) formData.append("verification_note", form.verification_note.trim());
      if (certificateFile) formData.append("certificate", certificateFile);

      const res = await fetch(`${API_BASE}/api/auth/dietitian/verify`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || t.submitError);

      setMessage(t.submitSuccess);
      setStatus("pending");
      setSubmittedAt(new Date().toISOString());
    } catch (err: unknown) {
      setError((err as Error).message || t.submitError);
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadge = () => {
    switch (status) {
      case "approved":
        return (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            <span>{t.approved}</span>
          </div>
        );
      case "pending":
        return (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-black text-amber-400">
            <Clock className="h-4 w-4 animate-pulse" />
            <span>{t.pending}</span>
          </div>
        );
      case "rejected":
        return (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-black text-rose-400">
            <XCircle className="h-4 w-4" />
            <span>{t.rejected}</span>
          </div>
        );
      default:
        return (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-black text-slate-300">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <span>{t.fresh}</span>
          </div>
        );
    }
  };

  return (
    <div className={`relative min-h-screen w-full p-4 sm:p-6 lg:p-8 flex items-center justify-center ${
      isDark ? "bg-[#040711] text-white" : "bg-[#f8fafc] text-slate-900"
    }`}>
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-[150px]" />
      </div>

      <div className="relative z-10 w-full max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <Link to="/profile" className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition">
            <ArrowLeft className="h-4 w-4" />
            <span>{t.backProfile}</span>
          </Link>
          {statusBadge()}
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          <div className={`lg:col-span-4 rounded-[32px] border p-6 sm:p-8 backdrop-blur-2xl flex flex-col justify-between ${
            isDark ? "border-white/10 bg-slate-900/60 shadow-2xl" : "border-slate-200 bg-white/90 shadow-xl"
          }`}>
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 mb-4 shadow-md shadow-emerald-500/15">
                <Building2 className="h-6 w-6" />
              </div>
              <h2 className="font-display text-2xl font-black">{t.title}</h2>
              <p className={`mt-2 text-xs leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                {t.subtitle}
              </p>

              <div className={`mt-6 p-4 rounded-2xl border text-xs leading-relaxed ${
                status === "approved"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  : status === "pending"
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                  : status === "rejected"
                  ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
                  : isDark ? "border-white/10 bg-black/20 text-slate-400" : "border-slate-200 bg-slate-50 text-slate-600"
              }`}>
                {status === "approved" && t.statusApproved}
                {status === "pending" && t.statusPending}
                {status === "rejected" && t.statusRejected}
                {status === "not_submitted" && t.statusFresh}
              </div>

              {status === "rejected" && reviewNote && (
                <div className="mt-4 p-4 rounded-2xl border border-rose-500/30 bg-rose-500/5 text-xs text-rose-200">
                  <div className="font-bold uppercase tracking-wider text-[10px] text-rose-400 mb-1">{t.rejectReasonTitle}</div>
                  <div>{reviewNote}</div>
                </div>
              )}
            </div>
          </div>

          <div className={panelClass(isDark, "lg:col-span-8 px-6 py-6")}>
            <div className="mb-6 flex items-center justify-between gap-3 border-b border-white/5 pb-4">
              <h2 className="text-base font-black font-display">{t.formTitle}</h2>
              <span className={["text-xs font-bold", isDark ? "text-zinc-400" : "text-[#8a7a61]"].join(" ")}>
                {certificateFile?.name || t.fileOptional}
              </span>
            </div>

            {status !== "approved" && status !== "pending" ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className={labelClass(isDark)}>{t.clinicSelect}</label>
                  <select value={selectedClinicId} onChange={(e) => handleClinicSelect(e.target.value)} className={inputClass(isDark)}>
                    <option value="">{t.clinicSelectEmpty}</option>
                    {clinics.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} ({c.city})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Field isDark={isDark} label={t.fieldClinicName} value={form.clinic_name} onChange={(v) => setForm((p) => ({ ...p, clinic_name: v }))} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
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
                  {submitting ? t.submitLoading : (status === "rejected" ? t.resubmitButton : t.submitButton)}
                </button>
              </form>


            ) : (
              <div className={["rounded-2xl border p-8 text-center text-sm font-bold", isDark ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-300" : "border-[#dfd0b9] bg-[#fdf8ee] text-[#756449]"].join(" ")}>
                {status === "approved" ? t.statusApproved : t.statusPending}
              </div>
            )}
          </div>
        </div>
      </div>
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
