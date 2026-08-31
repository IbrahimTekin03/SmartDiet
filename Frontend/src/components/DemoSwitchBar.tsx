import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Stethoscope, 
  User, 
  Home, 
  RotateCcw, 
  Sparkles,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { clearAuthSession, parseStoredUser, setAuthSession, useAuthSession } from "../lib/authSession";
import { API_BASE_URL as API_BASE } from "../lib/api";

export default function DemoSwitchBar() {
  const { accessToken, userJson } = useAuthSession();
  const user = parseStoredUser<any>(userJson);
  const navigate = useNavigate();
  const [switching, setSwitching] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!accessToken || !user?.email || !String(user.email).toLowerCase().startsWith("demo.")) {
    return null;
  }

  const isDietitian = String(user.email).toLowerCase().includes("dietitian");
  const isClient = String(user.email).toLowerCase().includes("client");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSwitchTo = async (targetRole: "dietitian" | "client") => {
    if ((targetRole === "dietitian" && isDietitian) || (targetRole === "client" && isClient)) {
      return;
    }

    setSwitching(targetRole);
    const targetEmail = targetRole === "dietitian" 
      ? "demo.dietitian@smartdiet.com" 
      : "demo.client@smartdiet.com";

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, password: "Password123!" }),
      });
      const data = await res.json();
      const payload = data.data || data;

      if (res.ok && payload.access_token) {
        setAuthSession({
          accessToken: payload.access_token,
          refreshToken: payload.refresh_token,
          user: payload.user,
          isDemo: true,
        });
        showToast(targetRole === "dietitian" ? "Diyetisyen Moduna Geçildi!" : "Danışan Moduna Geçildi!");
        navigate("/");
      } else {
        alert("Demo moduna geçilemedi.");
      }
    } catch {
      alert("Bağlantı hatası oluştu.");
    } finally {
      setSwitching(null);
    }
  };

  const handleGoHome = () => {
    clearAuthSession();
    navigate("/");
  };

  const handleResetDemo = async () => {
    if (!confirm("Demo verilerini başlangıç durumuna sıfırlamak istiyor musunuz? (Tüm yeni eklenen öğün ve planlar sıfırlanacaktır)")) {
      return;
    }

    setSwitching("reset");
    try {
      const res = await fetch(`${API_BASE}/api/auth/demo/reset`, { method: "POST" });
      if (res.ok) {
        showToast("Demo verileri tertemiz sıfırlandı!");
        setTimeout(() => window.location.reload(), 1000);
      } else {
        alert("Sıfırlama başarısız oldu.");
      }
    } catch {
      alert("Sunucuya erişilemedi.");
    } finally {
      setSwitching(null);
    }
  };

  return (
    <>
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-emerald-500/30 bg-slate-950/90 backdrop-blur-xl shadow-2xl shadow-emerald-950/50 text-white animate-in fade-in slide-in-from-top-2 duration-300">
        <div className="flex items-center gap-1.5 pr-2 border-r border-white/15">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            <span className="hidden md:inline">Demo</span> Modu
          </span>
        </div>

        {/* Diyetisyen Butonu */}
        <button
          type="button"
          onClick={() => handleSwitchTo("dietitian")}
          disabled={switching !== null}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-xs font-bold transition-all ${
            isDietitian
              ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30 font-black"
              : "text-slate-300 hover:text-white hover:bg-white/10"
          }`}
          title="Demo Diyetisyen Paneline Geç"
        >
          {switching === "dietitian" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Stethoscope className="h-3.5 w-3.5" />
          )}
          <span>Diyetisyen</span>
        </button>

        {/* Danışan Butonu */}
        <button
          type="button"
          onClick={() => handleSwitchTo("client")}
          disabled={switching !== null}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-xs font-bold transition-all ${
            isClient
              ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30 font-black"
              : "text-slate-300 hover:text-white hover:bg-white/10"
          }`}
          title="Demo Danışan Paneline Geç"
        >
          {switching === "client" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <User className="h-3.5 w-3.5" />
          )}
          <span>Danışan</span>
        </button>

        <div className="h-4 w-px bg-white/15 mx-0.5" />

        {/* Sıfırla Butonu */}
        <button
          type="button"
          onClick={handleResetDemo}
          disabled={switching !== null}
          className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold text-slate-300 hover:text-amber-400 hover:bg-amber-400/10 transition"
          title="Demo Verilerini İlk Haline Sıfırla"
        >
          {switching === "reset" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />
          ) : (
            <RotateCcw className="h-3.5 w-3.5" />
          )}
          <span className="hidden lg:inline">Sıfırla</span>
        </button>

        {/* Ana Sayfa Butonu */}
        <button
          type="button"
          onClick={handleGoHome}
          disabled={switching !== null}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-slate-300 hover:text-rose-400 hover:bg-rose-500/10 transition"
          title="Demo Oturumunu Kapat ve Tanıtım Sayfasına Dön"
        >
          <Home className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Ana Sayfa</span>
        </button>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-2xl shadow-emerald-500/40 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="h-4 w-4 stroke-[2.5]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </>
  );
}
