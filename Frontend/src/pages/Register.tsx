import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

type Gender = "male" | "female"; // Backend enum'un böyleyse. Eğer "MALE/FEMALE" ise aşağıda düzelt.

type RegisterPayload = {
  first_name: string;
  last_name: string;
  password: string;
  birth_date: string; // YYYY-MM-DD
  gender: Gender;
  email?: string;
  phone_number?: string;
};

const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export default function Register() {
  const navigate = useNavigate();

  // ✅ Endpoint’i senin backend’e göre güncelle
  const API_BASE = "http://localhost:3000";
  const REGISTER_URL = `${API_BASE}/api/auth/register`;

  const [form, setForm] = useState<RegisterPayload>({
    first_name: "",
    last_name: "",
    password: "",
    birth_date: "",
    gender: "male",
    email: "",
    phone_number: "",
  });

  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string>("");

  const contactMode = useMemo(() => {
    // kullanıcı ikisini de yazabilir; ama UI’da daha net olsun diye tercih seçtiriyoruz
    // dolu olana göre otomatik seçelim
    if (form.phone_number?.trim()) return "phone";
    return "email";
  }, [form.phone_number]);

  const validate = () => {
    const e: Record<string, string> = {};

    if (!form.first_name.trim()) e.first_name = "İsim zorunlu.";
    if (!form.last_name.trim()) e.last_name = "Soyisim zorunlu.";

    if (!form.birth_date.trim()) {
      e.birth_date = "Doğum tarihi zorunlu.";
    } else {
      // basit format kontrolü (YYYY-MM-DD)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(form.birth_date)) {
        e.birth_date = "Geçerli format: YYYY-MM-DD";
      }
    }

    if (!form.gender) e.gender = "Cinsiyet zorunlu.";

    if (!form.password) e.password = "Şifre zorunlu.";
    else {
      if (form.password.length < 8) e.password = "Şifre en az 8 karakter olmalı.";
      if (!PASSWORD_REGEX.test(form.password)) {
        e.password =
          "Şifre: en az 1 büyük, 1 küçük, 1 rakam ve 1 özel karakter (@$!%*?&) içermeli.";
      }
    }

    const email = form.email?.trim();
    const phone = form.phone_number?.trim();

    if (!email && !phone) {
      e.contact = "E-posta veya telefon alanlarından en az biri zorunlu.";
    } else {
      if (email) {
        const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        if (!ok) e.email = "Geçerli bir e-posta gir.";
      }
      if (phone) {
        // Çok katı yapmıyorum; +90... gibi
        const ok = /^\+?[0-9\s()-]{10,}$/.test(phone);
        if (!ok) e.phone_number = "Geçerli bir telefon gir. Örn: +905555555555";
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const setField = (k: keyof RegisterPayload, v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((prev) => {
      const copy = { ...prev };
      // ilgili alanı temizle
      delete copy[k as string];
      delete copy.contact;
      return copy;
    });
    setServerError("");
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setServerError("");

    if (!validate()) return;

    setLoading(true);
    try {
      const payload: RegisterPayload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        password: form.password,
        birth_date: form.birth_date.trim(),
        gender: form.gender,
        email: form.email?.trim() ? form.email.trim() : undefined,
        phone_number: form.phone_number?.trim() ? form.phone_number.trim() : undefined,
      };

      const res = await fetch(REGISTER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // backend hata formatına göre iyileştirilebilir
        const msg =
          data?.message?.join?.(" • ") ||
          data?.message ||
          "Kayıt başarısız. Bilgileri kontrol et.";
        throw new Error(msg);
      }

      // başarılı → login sayfasına yönlendir
      navigate("/login");
    } catch (err: any) {
      setServerError(err?.message || "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
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

      {/* Top mini bar */}
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
          to="/login"
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-zinc-100 hover:bg-white/10"
        >
          Giriş Yap
        </Link>
      </header>

      {/* Content */}
      <main className="relative z-10 mx-auto grid w-full max-w-6xl grid-cols-1 gap-10 px-4 pb-14 pt-4 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:items-center">
        {/* Left info */}
        <section className="lg:pr-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-100">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Hesabını oluştur ve kliniğini yönet
          </div>

          <h1 className="mt-5 text-[40px] font-extrabold leading-[1.05] tracking-tight text-white sm:text-[52px]">
            SmartDiet’e{" "}
            <span className="bg-gradient-to-r from-emerald-300 to-teal-200 bg-clip-text text-transparent">
              kayıt ol
            </span>
            .
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-300 sm:text-base">
            Danışanlarını yönet, planlarını oluştur, ölçüm tarihçelerini takip et ve mesajlaşmayı tek panelden yürüt.
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <InfoPill icon="🧾" title="Abonelik" desc="Aktif / dondur / iptal" />
            <InfoPill icon="📊" title="Ölçüm" desc="Tarihçeli takip" />
            <InfoPill icon="💬" title="Sohbet" desc="Fotoğraf & görüldü" />
          </div>
        </section>

        {/* Right form */}
        <section>
          <div className="rounded-[26px] border border-white/10 bg-white/5 p-5 shadow-[0_40px_140px_rgba(0,0,0,0.65)] backdrop-blur sm:p-7">
            <div className="mb-5">
              <div className="text-base font-extrabold text-white">Kayıt Oluştur</div>
              <div className="mt-1 text-xs text-zinc-400">
                Email veya telefon alanlarından en az birini doldur.
              </div>
            </div>

            {serverError ? (
              <div className="mb-4 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                {serverError}
              </div>
            ) : null}

            <form onSubmit={submit} className="space-y-4">
              {/* Names */}
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="İsim"
                  value={form.first_name}
                  onChange={(v) => setField("first_name", v)}
                  placeholder="İbrahim"
                  error={errors.first_name}
                />
                <Field
                  label="Soyisim"
                  value={form.last_name}
                  onChange={(v) => setField("last_name", v)}
                  placeholder="Tekin"
                  error={errors.last_name}
                />
              </div>

              {/* Contact */}
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="E-posta (opsiyonel)"
                  value={form.email ?? ""}
                  onChange={(v) => setField("email", v)}
                  placeholder="john.doe@example.com"
                  error={errors.email}
                />
                <Field
                  label="Telefon (opsiyonel)"
                  value={form.phone_number ?? ""}
                  onChange={(v) => setField("phone_number", v)}
                  placeholder="+905555555555"
                  error={errors.phone_number}
                />
              </div>
              {errors.contact ? (
                <div className="text-xs text-rose-200">{errors.contact}</div>
              ) : null}

              {/* Birth + Gender */}
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="Doğum Tarihi"
                  value={form.birth_date}
                  onChange={(v) => setField("birth_date", v)}
                  placeholder="YYYY-MM-DD"
                  error={errors.birth_date}
                  type="date"
                />

                <div>
                  <label className="mb-2 block text-xs font-semibold text-zinc-200">
                    Cinsiyet
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setField("gender", "male")}
                      className={[
                        "rounded-2xl border px-4 py-3 text-sm font-extrabold transition",
                        form.gender === "male"
                          ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-100 shadow-[0_0_0_1px_rgba(16,185,129,0.18)_inset]"
                          : "border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10",
                      ].join(" ")}
                    >
                      Erkek
                    </button>
                    <button
                      type="button"
                      onClick={() => setField("gender", "female")}
                      className={[
                        "rounded-2xl border px-4 py-3 text-sm font-extrabold transition",
                        form.gender === "female"
                          ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-100 shadow-[0_0_0_1px_rgba(16,185,129,0.18)_inset]"
                          : "border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10",
                      ].join(" ")}
                    >
                      Kadın
                    </button>
                  </div>
                  {errors.gender ? (
                    <div className="mt-2 text-xs text-rose-200">{errors.gender}</div>
                  ) : null}
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="mb-2 block text-xs font-semibold text-zinc-200">
                  Şifre
                </label>
                <div className="relative">
                  <input
                    value={form.password}
                    onChange={(e) => setField("password", e.target.value)}
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
                ) : (
                  <div className="mt-2 text-[11px] text-zinc-400">
                    En az 8 karakter · 1 büyük · 1 küçük · 1 rakam · 1 özel (@$!%*?&)
                  </div>
                )}
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
                {loading ? "Kayıt oluşturuluyor..." : "Kayıt Ol"}
              </button>

              <div className="pt-2 text-center text-xs text-zinc-400">
                Zaten hesabın var mı?{" "}
                <Link to="/login" className="font-semibold text-emerald-200 hover:underline">
                  Giriş yap
                </Link>
              </div>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}

/* ---------- small ui components ---------- */

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
