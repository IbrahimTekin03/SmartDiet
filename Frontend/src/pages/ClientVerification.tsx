import { useState } from "react";
import { useAppSettings } from "../context/AppSettingsContext";
import { clearAuthSession } from "../lib/authSession";

const API_BASE = "http://localhost:3000";

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
    <div className={["relative min-h-screen w-screen flex items-center justify-center overflow-hidden p-4", isDark ? "bg-[#050608] text-zinc-50" : "bg-[#f7f1e7] text-[#2f2b22]"].join(" ")}>
      <div className="pointer-events-none absolute inset-0">
        <div
          className={
            isDark
              ? "absolute inset-0 [background:radial-gradient(1000px_600px_at_50%_30%,rgba(16,185,129,0.15),transparent_60%)]"
              : "absolute inset-0 bg-[#f7f1e7]"
          }
        />
      </div>

      <div className={["relative z-10 w-full max-w-md border p-8 shadow-2xl text-center transition-all duration-500", isDark ? "rounded-3xl border-white/10 bg-white/5 shadow-emerald-500/5" : "rounded-2xl border-[#dfd0b9] bg-[#fffaf0] shadow-sm"].join(" ")}>
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 text-amber-400">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        <h1 className="mt-6 text-xl font-black">
          {lang === "tr" ? "Hesap Onay Bekliyor" : "Account Pending Approval"}
        </h1>

        <p className={["mt-4 text-sm leading-relaxed", isDark ? "text-zinc-400" : "text-[#7b6d58]"].join(" ")}>
          {lang === "tr"
            ? "Akıllı Diyetisyenlik Sistemine hoş geldiniz! Hizmetlerimiz üyelik modeline tabi olduğu için hesabınız yönetici onayından sonra aktif edilecektir. Onay sürecinin ardından tam erişim sağlayabileceksiniz."
            : "Welcome to the Smart Dietitian System! As our services require a membership model, your account will be activated after administrator approval. You will have full access after verification."}
        </p>

        {error && (
          <div className={["mt-4 rounded-xl border px-3 py-2.5 text-xs font-semibold leading-relaxed", isDark ? "border-rose-500/30 bg-rose-500/10 text-rose-200" : "border-rose-300 bg-rose-50 text-rose-700"].join(" ")}>
            {error}
          </div>
        )}

        <div className="mt-8 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={checking}
            className={["w-full rounded-2xl px-4 py-3 text-sm font-black transition hover:scale-[1.01] disabled:opacity-60",
              isDark
                ? "bg-gradient-to-r from-emerald-400 to-teal-300 text-zinc-950 shadow-[0_12px_40px_rgba(16,185,129,0.15)] hover:brightness-110"
                : "bg-[#8a6a3f] text-white hover:bg-[#765932]"
            ].join(" ")}
          >
            {checking ? (lang === "tr" ? "Kontrol Ediliyor..." : "Checking...") : (lang === "tr" ? "Durumu Kontrol Et" : "Check Approval Status")}
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className={["w-full rounded-full border px-4 py-2 text-xs font-bold transition hover:bg-white/5",
              isDark ? "border-white/10 bg-white/5 text-zinc-300" : "border-[#dfd0b9] bg-[#fffaf0] text-[#6d5433]"
            ].join(" ")}
          >
            {lang === "tr" ? "Çıkış Yap" : "Log Out"}
          </button>
        </div>
      </div>
    </div>
  );
}
