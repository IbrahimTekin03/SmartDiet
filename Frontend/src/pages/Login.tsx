import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

type LoginPayload = {
  email?: string;
  phone_number?: string;
  password: string;
};

export default function Login() {
  const navigate = useNavigate();

  // ✅ Endpoint’i senin backend’e göre güncelle
  const API_BASE = "http://localhost:3000";
  const LOGIN_URL = `${API_BASE}/api/auth/login`;

  const [mode, setMode] = useState<"email" | "phone">("email");

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");

  const validate = () => {
    const e: Record<string, string> = {};

    const eMail = email.trim();
    const p = phone.trim();

    if (!eMail && !p) {
      e.contact = "E-posta veya telefon alanlarından en az birini doldurmalısın.";
    }

    if (eMail) {
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(eMail);
      if (!ok) e.email = "Geçerli bir e-posta gir.";
    }

    if (p) {
      const ok = /^\+?[0-9\s()-]{10,}$/.test(p);
      if (!ok) e.phone_number = "Geçerli bir telefon gir. Örn: +905555555555";
    }

    if (!password) e.password = "Şifre zorunlu.";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setServerError("");

    if (!validate()) return;

    setLoading(true);
    try {
      const payload: LoginPayload = {
        password,
        email: email.trim() ? email.trim() : undefined,
        phone_number: phone.trim() ? phone.trim() : undefined,
      };

      const res = await fetch(LOGIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg =
          data?.message?.join?.(" • ") ||
          data?.message ||
          "Giriş başarısız. Bilgileri kontrol et.";
        throw new Error(msg);
      }

      // ✅ Backend token döndürüyorsa burada saklayabilirsin:
      // localStorage.setItem("access_token", data.access_token);

      navigate("/"); // veya panel route'un
    } catch (err: any) {
      setServerError(err?.message || "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const clearContactErrors = () => {
    setErrors((prev) => {
      const c = { ...prev };
      delete c.contact;
      delete c.email;
      delete c.phone_number;
      return c;
    });
    setServerError("");
  };

  return (
    <div className="relative min-h-screen w-screen overflow-hidden">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 opacity-100 [background:radial-gradient(1100px_700px_at_18%_15%,rgba(16,185,129,0.18),transparent_60%),radial-gradient(900px_700px_at_90%_20%,rgba(20,184,166,0.12),transparent_60%),radial-gradient(900px_700px_at_60%_95%,rgba(56,189,248,0.10),transparent_60%),linear-gradient(180deg,#050608,#07090b_55%,#050608)]" />
        <div className="absolute inset-0 opacity-[0.10] [background-image:radial-gradient(rgba(255,255,255,0.14)_1px,transparent_1px)] [background-size:18px_18px]" />
        <div className="absolute -top-56 -left-56 h-[720px] w-[720px] rounded-full bg-emerald-500/15 blur-[120px]" />
        <div className="absolute -bottom-72 -right-72 h-[820px] w-[820px] rounded-full bg-teal-400/12 blur-[140px]" />
      </div>

      {/* Top bar */}
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Link to="/" className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/15 ring-1 ring-emerald-400/20">
            <span className="text-sm font-extrabold text-emerald-200">SD</span>
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-white">SmartDiet</div>
            <div className="text-xs text-zinc-400">Klinik & Diyet Yönetimi</div>
          </div>
        </Link>

        <Link
          to="/register"
          className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-zinc-950 hover:brightness-110"
        >
          Kayıt Ol
        </Link>
      </header>

      <main className="relative z-10 mx-auto grid w-full max-w-6xl grid-cols-1 gap-10 px-4 pb-14 pt-4 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:items-center">
        {/* Left info */}
        <section className="lg:pr-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-100">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Güvenli giriş
          </div>

          <h1 className="mt-5 text-[40px] font-extrabold leading-[1.05] tracking-tight text-white sm:text-[52px]">
            Hesabına{" "}
            <span className="bg-gradient-to-r from-emerald-300 to-teal-200 bg-clip-text text-transparent">
              giriş yap
            </span>
            .
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-300 sm:text-base">
            Danışanların, planların, ölçüm raporların ve sohbetlerin tek panelde.
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <InfoPill icon="🧩" title="Tek Panel" desc="Akış tek yerde" />
            <InfoPill icon="📈" title="Takip" desc="Ölçüm & uyum" />
            <InfoPill icon="💬" title="Mesaj" desc="Anlık iletişim" />
          </div>
        </section>

        {/* Right form */}
        <section>
          <div className="rounded-[26px] border border-white/10 bg-white/5 p-5 shadow-[0_40px_140px_rgba(0,0,0,0.65)] backdrop-blur sm:p-7">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="text-base font-extrabold text-white">Giriş Yap</div>
                <div className="mt-1 text-xs text-zinc-400">
                  E-posta veya telefon ile giriş yapabilirsin.
                </div>
              </div>

              {/* Mode switch */}
              <div className="inline-flex rounded-2xl border border-white/10 bg-black/20 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode("email");
                    clearContactErrors();
                  }}
                  className={[
                    "rounded-xl px-3 py-2 text-xs font-extrabold transition",
                    mode === "email"
                      ? "bg-emerald-500/20 text-emerald-100"
                      : "text-zinc-300 hover:bg-white/5",
                  ].join(" ")}
                >
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("phone");
                    clearContactErrors();
                  }}
                  className={[
                    "rounded-xl px-3 py-2 text-xs font-extrabold transition",
                    mode === "phone"
                      ? "bg-emerald-500/20 text-emerald-100"
                      : "text-zinc-300 hover:bg-white/5",
                  ].join(" ")}
                >
                  Telefon
                </button>
              </div>
            </div>

            {serverError ? (
              <div className="mb-4 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                {serverError}
              </div>
            ) : null}

            <form onSubmit={submit} className="space-y-4">
              {/* Contact field */}
              {mode === "email" ? (
                <Field
                  label="E-posta"
                  value={email}
                  onChange={(v) => {
                    setEmail(v);
                    setErrors((p) => ({ ...p, email: "", contact: "" }));
                    setServerError("");
                  }}
                  placeholder="tomson@example.com"
                  error={errors.email}
                />
              ) : (
                <Field
                  label="Telefon"
                  value={phone}
                  onChange={(v) => {
                    setPhone(v);
                    setErrors((p) => ({ ...p, phone_number: "", contact: "" }));
                    setServerError("");
                  }}
                  placeholder="+905555555555"
                  error={errors.phone_number}
                />
              )}

          

              {errors.contact ? (
                <div className="text-xs text-rose-200">{errors.contact}</div>
              ) : null}

              {/* Password */}
              <div>
                <label className="mb-2 block text-xs font-semibold text-zinc-200">
                  Şifre
                </label>
                <div className="relative">
                  <input
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrors((p) => ({ ...p, password: "" }));
                      setServerError("");
                    }}
                    type={showPass ? "text" : "password"}
                    placeholder="StrongP@ssw0rd"
                    className={[
                      "w-full rounded-2xl border px-4 py-3 pr-12 text-sm text-white outline-none transition",
                      "bg-black/20",
                      errors.password ? "border-rose-500/40" : "border-white/10",
                      "focus:border-emerald-400/40 focus:ring-4 focus:ring-emerald-500/10",
                    ].join(" ")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-semibold text-zinc-200 hover:bg-white/10"
                  >
                    {showPass ? "Gizle" : "Göster"}
                  </button>
                </div>
                {errors.password ? (
                  <div className="mt-2 text-xs text-rose-200">{errors.password}</div>
                ) : null}
              </div>

              {/* Submit */}
              <button
                disabled={loading}
                type="submit"
                className={[
                  "mt-2 w-full rounded-2xl px-5 py-3 text-sm font-extrabold transition",
                  "bg-gradient-to-r from-emerald-400 to-teal-300 text-zinc-950",
                  "shadow-[0_18px_60px_rgba(16,185,129,0.20)] hover:brightness-110",
                  "disabled:opacity-60 disabled:cursor-not-allowed",
                ].join(" ")}
              >
                {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
              </button>

              <div className="pt-2 text-center text-xs text-zinc-400">
                Hesabın yok mu?{" "}
                <Link
                  to="/register"
                  className="font-semibold text-emerald-200 hover:underline"
                >
                  Kayıt ol
                </Link>
              </div>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}

/* ---------- UI bits ---------- */

function Field({
  label,
  value,
  onChange,
  placeholder,
  error,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold text-zinc-200">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        className={[
          "w-full rounded-2xl border px-4 py-3 text-sm text-white outline-none transition",
          "bg-black/20",
          error ? "border-rose-500/40" : "border-white/10",
          "focus:border-emerald-400/40 focus:ring-4 focus:ring-emerald-500/10",
        ].join(" ")}
      />
      {error ? <div className="mt-2 text-xs text-rose-200">{error}</div> : null}
    </div>
  );
}

function InfoPill({
  icon,
  title,
  desc,
}: {
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
      <div className="flex items-center justify-between">
        <div className="text-sm font-extrabold text-white">{title}</div>
        <div className="text-lg">{icon}</div>
      </div>
      <div className="mt-1 text-xs text-zinc-400">{desc}</div>
    </div>
  );
}
