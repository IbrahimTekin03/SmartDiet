import { useState } from "react";
import { useAppSettings } from "../context/AppSettingsContext";
import { clearAuthSession } from "../lib/authSession";
import { API_BASE_URL as API_BASE } from "../lib/api";
import { Clock, RefreshCw, LogOut, ShieldAlert, Sparkles, Activity } from "lucide-react";

export default function ClientVerification() {
  const { lang, isDark } = useAppSettings();
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  const handleLogout = () => {
    clearAuthSession();
    window.location.href = "/";
  };

  const handleRefresh = async () => {
    setChecking(true);
    setError("");
    const token = localStorage.getItem("access_token");
    if (!token) {
      window.location.href = "/";
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const profile = data?.data ?? data;
        if (profile?.client_verification_status === "approved") {
          window.location.reload();
        } else if (profile?.client_verification_status === "rejected") {
          setError(
            lang === "tr"
              ? `Hesap başvurunuz onaylanamadı. Nedeni: ${profile.verification_review_note || "Belirtilmedi"}`
              : `Your account request was not approved. Reason: ${profile.verification_review_note || "Not provided"}`
          );
        } else {
          setError(
            lang === "tr"
              ? "Hesabınız henüz onaylanmamış. Lütfen bekleyin veya yöneticinizle iletişime geçin."
              : "Your account is not approved yet. Please wait or contact your administrator."
          );
        }
      } else {
        throw new Error();
      }
    } catch {
      setError(
        lang === "tr"
          ? "Durum kontrolü başarısız oldu."
          : "Failed to check status."
      );
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className={`relative min-h-screen w-full flex items-center justify-center p-4 ${
      isDark ? "bg-[#040711] text-white" : "bg-[#f8fafc] text-slate-900"
    }`}>
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-amber-500/10 blur-[130px]" />
      </div>

      <div className={`relative z-10 w-full max-w-md rounded-[36px] border p-8 sm:p-10 text-center shadow-2xl backdrop-blur-2xl transition-all ${
        isDark ? "border-white/10 bg-slate-900/70 shadow-black/80" : "border-slate-200 bg-white/90 shadow-slate-300/40"
      }`}>
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-500/15 text-amber-400 shadow-lg shadow-amber-500/15">
          <Clock className="h-8 w-8 animate-pulse" />
        </div>

        <div className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-400">
          <Sparkles className="h-3 w-3" />
          {lang === "tr" ? "İnceleme Aşamasında" : "Under Review"}
        </div>

        <h1 className="mt-3 font-display text-2xl font-black tracking-tight">
          {lang === "tr" ? "Hesap Onayı Bekleniyor" : "Account Pending Approval"}
        </h1>

        <p className={`mt-3 text-xs leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
          {lang === "tr"
            ? "SmartDiet ekosistemine hoş geldiniz! Danışan hesabınız klinik yöneticisi onayından sonra aktif edilecektir. Onayın ardından beslenme planlarınıza ve diyetisyeninize erişebilirsiniz."
            : "Welcome to SmartDiet! Your client account will be activated after clinic administrator approval. Once verified, you will have full access to your personalized meal plans."}
        </p>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs font-semibold text-rose-300 text-left">
            <ShieldAlert className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-8 space-y-3">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={checking}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 py-3.5 text-xs font-black text-slate-950 shadow-lg shadow-emerald-500/25 transition hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${checking ? "animate-spin" : ""}`} />
            <span>{checking ? (lang === "tr" ? "Kontrol Ediliyor..." : "Checking...") : (lang === "tr" ? "Onay Durumunu Kontrol Et" : "Check Approval Status")}</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className={`w-full flex items-center justify-center gap-2 rounded-2xl border py-3 text-xs font-bold transition ${
              isDark ? "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10" : "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>{lang === "tr" ? "Çıkış Yap" : "Log Out"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

