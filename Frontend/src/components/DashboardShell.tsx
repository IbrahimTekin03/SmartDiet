import { type ReactNode, useCallback, useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppSettings } from "../context/AppSettingsContext";
import { clearAuthSession, parseStoredUser, useAuthSession } from "../lib/authSession";
import { API_BASE_URL } from "../lib/api";
import { 
  Bell, 
  ChevronLeft, 
  LogOut, 
  MessageSquare, 
  Sparkles, 
  Plus, 
  Trash2, 
  CheckCheck, 
  Activity,
  Lightbulb,
  X
} from "lucide-react";

export function DashboardShell({
  isDark,
  badge,
  title,
  subtitle,
  actions,
  children,
  backUrl,
}: {
  isDark: boolean;
  badge?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  backUrl?: string;
}) {
  const { lang } = useAppSettings();
  const navigate = useNavigate();
  const { userJson } = useAuthSession();
  const user = parseStoredUser<{ first_name?: string; last_name?: string; display_name?: string; email?: string }>(userJson);
  const userName = user?.display_name || (user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user?.email || (lang === "tr" ? "Kullanıcı" : "User"));

  const handleLogout = () => {
    clearAuthSession();
    navigate("/login");
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden transition-colors duration-300">
      {/* Background Ambient Glows & Grid */}
      <div className="pointer-events-none fixed inset-0 z-0">
        {isDark ? (
          <>
            <div className="absolute inset-0 bg-[#040711]" />
            <div className="absolute -top-[20%] left-[10%] h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-[130px]" />
            <div className="absolute top-[30%] -right-[10%] h-[600px] w-[600px] rounded-full bg-cyan-500/10 blur-[150px]" />
            <div className="absolute -bottom-[20%] left-[30%] h-[500px] w-[500px] rounded-full bg-indigo-500/08 blur-[140px]" />
            <div className="absolute inset-0 bg-grid-pattern opacity-60" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-[#f8fafc]" />
            <div className="absolute -top-[15%] left-[5%] h-[450px] w-[450px] rounded-full bg-emerald-400/15 blur-[120px]" />
            <div className="absolute top-[20%] -right-[5%] h-[550px] w-[550px] rounded-full bg-cyan-400/12 blur-[130px]" />
            <div className="absolute inset-0 bg-grid-pattern opacity-40" />
          </>
        )}
      </div>

      {/* Top Glass Navigation Bar */}
      <nav className={`sticky top-0 z-40 w-full border-b backdrop-blur-xl transition-all duration-200 ${
        isDark 
          ? "border-white/10 bg-[#040711]/80 shadow-[0_10px_30px_rgba(0,0,0,0.5)]" 
          : "border-slate-200/80 bg-white/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
      }`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* Brand Logo */}
          <Link to="/" className="group flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/25 transition-transform duration-300 group-hover:scale-105">
              <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-[#040711] text-white">
                <Activity className="h-5 w-5 text-emerald-400 transition-transform duration-300 group-hover:rotate-12" />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-display text-lg font-black tracking-tight">SmartDiet</span>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                </span>
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-emerald-400/80" : "text-emerald-700"}`}>
                {lang === "tr" ? "Sağlık & Beslenme" : "Health & Nutrition"}
              </span>
            </div>
          </Link>

          {/* Quick Right Action Controls */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <DashboardMessagesLink isDark={isDark} unreadCount={0} label={lang === "tr" ? "Mesajlar" : "Messages"} />
            <NotificationBell isDark={isDark} />

            <Link
              to="/profile"
              className={`group flex items-center gap-2.5 rounded-2xl border px-3 py-1.5 text-xs font-bold transition-all duration-200 hover:scale-[1.02] ${
                isDark 
                  ? "border-white/10 bg-white/5 text-slate-200 hover:border-emerald-500/40 hover:bg-emerald-500/10" 
                  : "border-slate-200 bg-white text-slate-800 shadow-sm hover:border-emerald-500/40 hover:bg-emerald-50/50"
              }`}
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 font-display text-xs font-black text-white shadow-sm shadow-emerald-500/30">
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="hidden max-w-[120px] truncate sm:inline">{userName}</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              title={lang === "tr" ? "Çıkış Yap" : "Logout"}
              className={`flex h-9 w-9 items-center justify-center rounded-2xl border transition-all duration-200 hover:scale-105 ${
                isDark 
                  ? "border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20" 
                  : "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
              }`}
            >
              <LogOut className="h-4 w-4 stroke-[2.2]" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-16 pt-5 sm:px-6 lg:px-8">
        <header className={panelClass(isDark, "p-4 sm:p-5 rounded-[24px]")}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="max-w-3xl">
              {backUrl ? (
                <div className="mb-2">
                  {backUrl === "back" ? (
                    <button
                      type="button"
                      onClick={() => navigate(-1)}
                      className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-bold transition-all hover:scale-[1.02] ${
                        isDark
                          ? "border-white/10 bg-white/5 text-emerald-400 hover:bg-white/10"
                          : "border-slate-200 bg-slate-50 text-emerald-700 hover:bg-white shadow-sm"
                      }`}
                    >
                      <ChevronLeft className="h-3.5 w-3.5 stroke-[2.5]" />
                      {lang === "tr" ? "Geri Dön" : "Go Back"}
                    </button>
                  ) : (
                    <Link
                      to={backUrl}
                      className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-bold transition-all hover:scale-[1.02] ${
                        isDark
                          ? "border-white/10 bg-white/5 text-emerald-400 hover:bg-white/10"
                          : "border-slate-200 bg-slate-50 text-emerald-700 hover:bg-white shadow-sm"
                      }`}
                    >
                      <ChevronLeft className="h-3.5 w-3.5 stroke-[2.5]" />
                      {lang === "tr" ? "Geri Dön" : "Go Back"}
                    </Link>
                  )}
                </div>
              ) : null}

              {badge ? (
                <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                  isDark 
                    ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.15)]" 
                    : "border border-emerald-300 bg-emerald-50 text-emerald-800"
                }`}>
                  <Sparkles className="h-3 w-3" />
                  {badge}
                </div>
              ) : null}

              <h1 className="mt-1 font-display text-xl sm:text-2xl font-black tracking-tight">
                {title}
              </h1>

              {subtitle ? (
                <p className={`mt-0.5 max-w-2xl text-xs sm:text-sm leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                  {subtitle}
                </p>
              ) : null}
            </div>

            {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
          </div>
        </header>

        <DietFactTicker isDark={isDark} />

        <div className="mt-6 space-y-6">{children}</div>
      </main>
    </div>
  );
}

const DIET_FACTS = {
  tr: [
    "Yulafın beta-glukan lifi, öğünün daha uzun süre tok hissettirmesine yardımcı olabilir.",
    "Pişmiş patates veya pirinç soğuduğunda dirençli nişasta oranı artabilir.",
    "Bütün meyve, meyve suyuna göre daha fazla çiğneme ve lif içerdiği için farklı tokluk hissi verir.",
    "Baklagiller hem protein hem lif içerdiği için öğünlerde dengeli bir temel oluşturur.",
    "C vitamini içeren besinler, bitkisel demirin emilimini destekleyebilir.",
    "Dondurulmuş sebzeler, doğru saklandığında pratik ve besin değeri güçlü bir seçenek olabilir.",
    "Protein, sindirim sırasında karbonhidrat ve yağa göre daha yüksek enerji harcatır.",
    "Renk çeşitliliği, tabakta farklı fitokimyasalların bulunma ihtimalini artırır.",
    "Kuruyemişler enerji yoğun olsa da lif ve doymamış yağ bakımından değerlidir.",
    "Etiket okurken porsiyon miktarı, kalori değerinden önce kontrol edilmesi gereken satırlardan biridir.",
    "Fermente besinlerin etkisi kişiden kişiye değişebilir; düzenli ve küçük porsiyonlar daha rahat denenir.",
    "Baharat ve otlar, sodyumu artırmadan lezzet katmanın güçlü bir yoludur.",
    "Lifli öğünlerde su tüketimi, sindirim konforu için daha önemli hale gelir.",
    "Uyku düzeni, açlık ve tokluk hormonlarının günlük ritmini etkileyebilir.",
    "Az yağlı ifadesi, bir ürünün otomatik olarak düşük kalorili olduğu anlamına gelmez.",
    "Mercimek, nohut ve fasulye gibi besinler tahıllarla birleştiğinde amino asit çeşitliliği artar.",
    "Koyu yeşil yapraklı sebzeler K vitamini açısından zengindir.",
    "Tokluk yalnızca kaloriyle değil; hacim, lif, protein ve doku ile de ilişkilidir.",
    "Yavaş yemek, tokluk sinyallerini fark etmek için daha fazla zaman sağlar.",
    "Kalsiyum metabolizmasında D vitamini durumu önemli bir destekleyici faktördür.",
  ],
  en: [
    "The beta-glucan fiber in oats can help a meal feel satisfying for longer.",
    "Cooked potatoes or rice may form more resistant starch after cooling.",
    "Whole fruit feels different from juice because it brings fiber and chewing time.",
    "Legumes provide both protein and fiber, making them a strong base for balanced meals.",
    "Vitamin C rich foods can support absorption of plant-based iron.",
    "Frozen vegetables can be practical and nutrient-rich when stored well.",
    "Protein has a higher thermic effect during digestion than carbs or fat.",
    "More color variety on a plate can mean a wider range of phytochemicals.",
    "Nuts are energy-dense, but they also bring fiber and unsaturated fats.",
    "On nutrition labels, serving size is one of the first lines worth checking.",
    "Fermented foods affect people differently; small regular portions are easier to test.",
    "Herbs and spices add flavor without needing extra sodium.",
    "With high-fiber meals, hydration becomes more important for digestive comfort.",
    "Sleep rhythm can influence daily hunger and fullness signals.",
    "Low-fat does not automatically mean low-calorie.",
    "Lentils, chickpeas and beans paired with grains increase amino acid variety.",
    "Dark leafy greens are naturally rich in vitamin K.",
    "Fullness depends on more than calories: volume, fiber, protein and texture all matter.",
    "Eating slowly gives fullness signals more time to register.",
    "Vitamin D status is an important support factor for calcium metabolism.",
  ],
} as const;

const CUSTOM_DIET_FACTS_KEY = "sd_custom_diet_facts_v1";
const CUSTOM_DIET_FACTS_EVENT = "sd:custom-diet-facts-changed";

type StoredUser = {
  account_type?: string | null;
  role?: string | null;
  roles?: Array<string | { name?: string | null }>;
};

type CustomDietFact = {
  id: string;
  text: string;
  createdAt: string;
};

function readCustomDietFacts(): CustomDietFact[] {
  try {
    const raw = localStorage.getItem(CUSTOM_DIET_FACTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => typeof item?.text === "string" && item.text.trim())
      .map((item) => ({
        id: String(item.id || crypto.randomUUID()),
        text: String(item.text).trim(),
        createdAt: String(item.createdAt || new Date().toISOString()),
      }));
  } catch {
    return [];
  }
}

function writeCustomDietFacts(items: CustomDietFact[]) {
  localStorage.setItem(CUSTOM_DIET_FACTS_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(CUSTOM_DIET_FACTS_EVENT));
}

function canManageDietFacts(user: StoredUser | null) {
  const roles = [
    ...(user?.roles || []).map((role) => String(typeof role === "string" ? role : role?.name || "").toLowerCase()),
    String(user?.role || "").toLowerCase(),
    String(user?.account_type || "").toLowerCase(),
  ];
  return roles.some((role) => role === "admin" || role === "dietitian" || role === "diyetisyen");
}

function DietFactTicker({ isDark }: { isDark: boolean }) {
  const { lang } = useAppSettings();
  const { userJson } = useAuthSession();
  const user = parseStoredUser<StoredUser>(userJson);
  const canManage = canManageDietFacts(user);
  const [customFacts, setCustomFacts] = useState<CustomDietFact[]>(() => readCustomDietFacts());
  const [factDraft, setFactDraft] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const facts = [...DIET_FACTS[lang], ...customFacts.map((item) => item.text)];
  const [factIndex, setFactIndex] = useState(0);

  useEffect(() => {
    setFactIndex(0);
  }, [lang, customFacts.length]);

  useEffect(() => {
    const sync = () => setCustomFacts(readCustomDietFacts());
    window.addEventListener("storage", sync);
    window.addEventListener(CUSTOM_DIET_FACTS_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(CUSTOM_DIET_FACTS_EVENT, sync);
    };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setFactIndex((current) => (current + 1) % facts.length);
    }, 8000);
    return () => window.clearInterval(interval);
  }, [facts.length]);

  const addCustomFact = () => {
    const text = factDraft.trim();
    if (text.length < 8) return;
    const next = [
      ...customFacts,
      {
        id: crypto.randomUUID(),
        text,
        createdAt: new Date().toISOString(),
      },
    ].slice(-20);
    writeCustomDietFacts(next);
    setFactDraft("");
    setEditorOpen(false);
  };

  const removeCustomFact = (id: string) => {
    writeCustomDietFacts(customFacts.filter((item) => item.id !== id));
  };

  return (
    <section
      className={`mt-4 overflow-hidden rounded-2xl border p-4 transition-all duration-300 ${
        isDark
          ? "border-emerald-500/20 bg-emerald-950/20 shadow-[0_10px_30px_rgba(0,0,0,0.3)] backdrop-blur-xl"
          : "border-emerald-200/80 bg-emerald-50/70 shadow-sm backdrop-blur-xl"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3.5">
          <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-sm ${
            isDark ? "bg-emerald-500/20 text-emerald-300" : "bg-white text-emerald-700"
          }`}>
            <Lightbulb className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className={`text-[11px] font-black uppercase tracking-wider ${isDark ? "text-emerald-400" : "text-emerald-800"}`}>
              {lang === "tr" ? "Günün Beslenme İpucu" : "Daily Nutrition Tip"}
            </div>
            <div className={`mt-1 text-xs font-semibold leading-relaxed sm:text-sm ${isDark ? "text-slate-200" : "text-slate-800"}`}>
              {facts[factIndex]}
            </div>
          </div>
        </div>
        <div className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black ${
          isDark ? "bg-white/5 text-slate-400" : "bg-white/80 text-slate-500"
        }`}>
          {factIndex + 1} / {facts.length}
        </div>
      </div>

      {canManage ? (
        <div className="mt-3 border-t border-emerald-500/10 pt-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setEditorOpen((value) => !value)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                isDark ? "bg-white/5 text-emerald-300 hover:bg-white/10" : "bg-white text-emerald-800 shadow-sm hover:bg-emerald-50"
              }`}
            >
              {editorOpen ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              {editorOpen ? (lang === "tr" ? "Kapat" : "Close") : lang === "tr" ? "Özel İpucu Ekle" : "Add Custom Tip"}
            </button>
            {customFacts.length ? (
              <span className={`text-[10px] font-bold ${isDark ? "text-slate-500" : "text-slate-500"}`}>
                {lang === "tr" ? "Eklenen İpuçları" : "Custom tips"}: {customFacts.length}
              </span>
            ) : null}
          </div>

          {editorOpen ? (
            <div className="mt-3 space-y-2.5">
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={factDraft}
                  onChange={(event) => setFactDraft(event.target.value)}
                  maxLength={180}
                  placeholder={lang === "tr" ? "Danışanların göreceği faydalı bir bilgi yazın..." : "Write a helpful tip for clients..."}
                  className={`min-h-10 flex-1 rounded-xl border px-3.5 py-2 text-xs font-medium outline-none transition ${
                    isDark 
                      ? "border-white/10 bg-black/40 text-white placeholder:text-slate-500 focus:border-emerald-500/50" 
                      : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-emerald-500"
                  }`}
                />
                <button
                  type="button"
                  onClick={addCustomFact}
                  disabled={factDraft.trim().length < 8}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-40"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {lang === "tr" ? "Kaydet" : "Save"}
                </button>
              </div>

              {customFacts.length ? (
                <div className="space-y-1.5">
                  {customFacts.slice(-3).reverse().map((item) => (
                    <div key={item.id} className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs ${
                      isDark ? "border-white/5 bg-black/20 text-slate-300" : "border-slate-100 bg-white text-slate-700 shadow-sm"
                    }`}>
                      <span className="line-clamp-1">{item.text}</span>
                      <button
                        type="button"
                        onClick={() => removeCustomFact(item.id)}
                        className="rounded-lg p-1 text-rose-400 transition hover:bg-rose-500/10 hover:text-rose-300"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export function DashboardLoadingScreen({
  isDark,
  message,
}: {
  isDark: boolean;
  message: string;
}) {
  const { lang } = useAppSettings();
  return (
    <div className={`relative grid min-h-screen w-full place-items-center px-4 ${isDark ? "bg-[#040711] text-white" : "bg-[#f8fafc] text-slate-900"}`}>
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-emerald-500/15 blur-[120px]" />
      </div>
      <div className={panelClass(isDark, "relative z-10 w-full max-w-sm p-8 text-center")}>
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-xl shadow-emerald-500/25">
          <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-[#040711]">
            <Activity className="h-7 w-7 animate-pulse text-emerald-400" />
          </div>
        </div>
        <h1 className="mt-5 font-display text-xl font-black">{message}</h1>
        <p className={`mt-1.5 text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}>
          {lang === "tr" ? "Verileriniz yükleniyor, lütfen bekleyin..." : "Loading data, please wait..."}
        </p>
      </div>
    </div>
  );
}

export function DashboardPanel({
  isDark,
  className = "",
  children,
}: {
  isDark: boolean;
  className?: string;
  children: ReactNode;
}) {
  return <div className={`${panelClass(isDark, "p-5 sm:p-6")} ${className}`.trim()}>{children}</div>;
}

export function DashboardSectionHeader({
  isDark,
  title,
  subtitle,
  aside,
}: {
  isDark: boolean;
  title: string;
  subtitle?: string;
  aside?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="font-display text-lg font-black tracking-tight">{title}</h2>
        {subtitle ? <p className={mutedTextClass(isDark)}>{subtitle}</p> : null}
      </div>
      {aside}
    </div>
  );
}

export function DashboardStatCard({
  isDark,
  title,
  value,
  accent = "from-emerald-400 to-cyan-400",
}: {
  isDark: boolean;
  title: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-3xl border p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 ${
      isDark
        ? "border-white/10 bg-slate-900/60 shadow-[0_15px_35px_rgba(0,0,0,0.5)] hover:border-emerald-500/30 hover:shadow-emerald-500/10"
        : "border-slate-200/80 bg-white/90 shadow-[0_10px_30px_rgba(0,0,0,0.04)] hover:border-emerald-300 hover:shadow-emerald-500/10"
    }`}>
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${accent}`} />
      <div className={labelTextClass(isDark)}>{title}</div>
      <div className="mt-2 font-display text-3xl font-black tracking-tight">{value}</div>
    </div>
  );
}

export function dashboardButtonClass(isDark: boolean, variant: "default" | "danger" | "primary" = "default") {
  if (variant === "primary") {
    return "inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 text-xs font-black text-slate-950 shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] hover:brightness-110";
  }
  if (variant === "danger") {
    return `inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-2 text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] ${
      isDark ? "border-rose-500/30 bg-rose-500/15 text-rose-200 hover:bg-rose-500/25" : "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
    }`;
  }
  return `inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-2 text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] ${
    isDark 
      ? "border-white/10 bg-white/5 text-slate-200 hover:border-emerald-500/40 hover:bg-white/10" 
      : "border-slate-200 bg-white text-slate-800 shadow-sm hover:border-emerald-500/40 hover:bg-emerald-50/50"
  }`;
}

export function DashboardMessagesLink({
  isDark,
  unreadCount,
  label,
}: {
  isDark: boolean;
  unreadCount: number;
  label: string;
}) {
  return (
    <Link
      to="/messages"
      aria-label={unreadCount > 0 ? `${label}: ${unreadCount}` : label}
      className={`group relative inline-flex items-center gap-2 rounded-2xl border px-3 py-1.5 text-xs font-bold transition-all hover:scale-[1.02] ${
        isDark 
          ? "border-white/10 bg-white/5 text-slate-200 hover:border-emerald-500/40 hover:bg-emerald-500/10" 
          : "border-slate-200 bg-white text-slate-800 shadow-sm hover:border-emerald-500/40 hover:bg-emerald-50/50"
      }`}
    >
      <MessageSquare className="h-4 w-4 text-emerald-400 transition-transform group-hover:scale-110" />
      <span className="hidden sm:inline">{label}</span>
      {unreadCount > 0 && (
        <span className="rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-black text-slate-950">
          {unreadCount}
        </span>
      )}
    </Link>
  );
}

export function labelTextClass(isDark: boolean) {
  return `text-[11px] font-black uppercase tracking-wider ${isDark ? "text-emerald-400" : "text-emerald-700"}`;
}

export function mutedTextClass(isDark: boolean) {
  return `mt-1 text-xs leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`;
}

function panelClass(isDark: boolean, padding: string) {
  return `${padding} rounded-[32px] border backdrop-blur-2xl transition-all duration-300 ${
    isDark
      ? "border-white/10 bg-slate-900/60 shadow-[0_20px_50px_rgba(0,0,0,0.6)] hover:border-white/15"
      : "border-slate-200/80 bg-white/90 shadow-[0_15px_40px_rgba(0,0,0,0.03)] hover:border-slate-300"
  }`;
}

export function NotificationBell({ isDark }: { isDark: boolean }) {
  const { lang } = useAppSettings();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setUnreadCount(0);
      return;
    }
    try {
      const resCount = await fetch(`${API_BASE_URL}/api/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const dataCount = await resCount.json();
      setUnreadCount(dataCount?.data?.count || 0);
    } catch (err) {}
  }, []);

  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    try {
      const resAll = await fetch(`${API_BASE_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const dataAll = await resAll.json();
      setNotifications(Array.isArray(dataAll?.data) ? dataAll.data : []);
    } catch (err) {}
  }, []);

  useEffect(() => {
    const run = () => {
      if (document.visibilityState === "visible") void fetchUnreadCount();
    };

    run();
    const interval = setInterval(run, 60000);
    document.addEventListener("visibilitychange", run);
    return () => {
      document.removeEventListener("visibilitychange", run);
      clearInterval(interval);
    };
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (!open) return;
    void fetchNotifications();
  }, [fetchNotifications, open]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    try {
      await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {}
  };

  const markAllAsRead = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    try {
      await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {}
  };

  return (
    <div className="relative" ref={ref}>
      <button 
        onClick={() => setOpen(!open)}
        className={`relative flex h-9 w-9 items-center justify-center rounded-2xl border transition-all hover:scale-105 ${
          isDark 
            ? "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white" 
            : "border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
        }`}
      >
        <Bell className="h-4 w-4 stroke-[2.2]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-black text-slate-950 shadow-md shadow-emerald-500/40">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className={`absolute right-0 top-12 z-50 w-80 sm:w-96 overflow-hidden rounded-3xl border shadow-2xl backdrop-blur-2xl animate-fadeInUp ${
          isDark ? "border-white/15 bg-slate-900/95 text-white shadow-black/80" : "border-slate-200 bg-white/95 text-slate-900 shadow-slate-300/50"
        }`}>
          <div className={`flex items-center justify-between border-b px-5 py-4 ${
            isDark ? "border-white/10 bg-white/5" : "border-slate-100 bg-slate-50/70"
          }`}>
            <div className="flex items-center gap-2 font-display text-sm font-black">
              <Bell className="h-4 w-4 text-emerald-400" />
              {lang === "tr" ? "Bildirimler" : "Notifications"}
            </div>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead} 
                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 transition hover:text-emerald-300"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                {lang === "tr" ? "Tümünü Oku" : "Mark all read"}
              </button>
            )}
          </div>
          
          <div className="max-h-[380px] overflow-y-auto divide-y divide-white/5">
            {notifications.length === 0 ? (
              <div className={`px-4 py-12 text-center text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                <Bell className="mx-auto mb-2 h-8 w-8 stroke-1 opacity-40" />
                {lang === "tr" ? "Yeni bildiriminiz bulunmuyor." : "No new notifications."}
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  onClick={() => !notif.is_read && markAsRead(notif.id)}
                  className={`p-4 transition-colors cursor-pointer ${
                    !notif.is_read 
                      ? isDark ? "bg-emerald-500/10 hover:bg-emerald-500/15" : "bg-emerald-50/70 hover:bg-emerald-50" 
                      : isDark ? "hover:bg-white/5" : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {!notif.is_read && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-black tracking-tight">{notif.title}</h4>
                      <p className={`mt-1 text-xs leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                        {notif.message}
                      </p>
                      <span className={`mt-2 block text-[10px] font-semibold ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                        {new Date(notif.created_at).toLocaleString(lang === "tr" ? "tr-TR" : "en-US")}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

