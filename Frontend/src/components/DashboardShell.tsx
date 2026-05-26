import { type ReactNode, useCallback, useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useAppSettings } from "../context/AppSettingsContext";
import { parseStoredUser, useAuthSession } from "../lib/authSession";

export function DashboardShell({
  isDark,
  badge,
  title,
  subtitle,
  actions,
  children,
}: {
  isDark: boolean;
  badge?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={["relative min-h-screen w-screen overflow-x-hidden", isDark ? "text-white" : "bg-[#f7f1e7] text-[#2f2b22]"].join(" ")}>
      <div className="pointer-events-none absolute inset-0">
        <div className={isDark ? "absolute inset-0 [background:radial-gradient(1100px_700px_at_18%_10%,rgba(16,185,129,0.20),transparent_60%),radial-gradient(900px_700px_at_92%_16%,rgba(20,184,166,0.13),transparent_60%),radial-gradient(920px_420px_at_50%_100%,rgba(16,185,129,0.16),transparent_66%),linear-gradient(180deg,#050608,#07090b_55%,#050608)]" : "absolute inset-0 [background:linear-gradient(135deg,rgba(31,107,80,0.14)_0%,rgba(247,241,231,0.98)_28%,#f7f1e7_58%,rgba(225,239,225,0.72)_100%)]"} />
        <div className={isDark ? "absolute inset-0 opacity-[0.08] [background-image:radial-gradient(rgba(255,255,255,0.14)_1px,transparent_1px)] [background-size:18px_18px]" : "absolute inset-0 opacity-[0.32] [background-image:linear-gradient(rgba(47,97,84,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(47,97,84,0.08)_1px,transparent_1px)] [background-size:36px_36px]"} />
        <div className={isDark ? "absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-emerald-400/10 to-transparent" : "absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-[#dcefe2] to-transparent"} />
        {isDark ? <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-emerald-500/10 to-transparent" /> : null}
      </div>

      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-10 pt-5 sm:px-5 lg:px-6">
        <header className={panelClass(isDark, "px-4 py-3.5")}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="max-w-3xl">
              {badge ? (
                <div className={isDark ? "inline-flex rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-black uppercase text-emerald-100" : "inline-flex rounded-xl border border-[#e4dbc9] bg-[#edf6ec] px-3 py-1 text-[11px] font-black uppercase text-[#285743]"}>
                  {badge}
                </div>
              ) : null}
              <h1 className="mt-2 text-2xl font-black leading-tight">{title}</h1>
              {subtitle ? (
                <p className={["mt-1 max-w-2xl text-xs leading-5", isDark ? "text-zinc-400" : "text-[#4d6b62]"].join(" ")}>
                  {subtitle}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <NotificationBell isDark={isDark} />
              {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
            </div>
          </div>
        </header>

        <DietFactTicker isDark={isDark} />

        <div className="mt-3 space-y-3">{children}</div>
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
      className={[
        "mt-3 overflow-hidden px-4 py-3",
        isDark
          ? "rounded-2xl bg-emerald-400/[0.075] shadow-[0_18px_54px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(110,231,183,0.10)]"
          : "rounded-2xl bg-[#edf6ec]/90 shadow-[0_14px_38px_rgba(47,97,84,0.08),inset_0_1px_0_rgba(255,255,255,0.72)]",
      ].join(" ")}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className={["mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl", isDark ? "bg-emerald-300/14 text-emerald-200" : "bg-white text-[#285743]"].join(" ")}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v3m0 12v3m7.8-15.8-2.1 2.1M6.3 17.7l-2.1 2.1M21 12h-3M6 12H3m16.8 6.8-2.1-2.1M6.3 6.3 4.2 4.2" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className={["text-[10px] font-black uppercase", isDark ? "text-emerald-200" : "text-[#285743]"].join(" ")}>
              {lang === "tr" ? "Beslenme Notu" : "Nutrition Note"}
            </div>
            <div className={["mt-1 min-h-[36px] text-sm font-semibold leading-5 sm:min-h-0", isDark ? "text-zinc-100" : "text-[#123a32]"].join(" ")}>
              {facts[factIndex]}
            </div>
          </div>
        </div>
        <div className={["shrink-0 text-[10px] font-black", isDark ? "text-zinc-500" : "text-[#6c7c70]"].join(" ")}>
          {factIndex + 1}/{facts.length}
        </div>
      </div>
      {canManage ? (
        <div className={["mt-3 pt-3", isDark ? "bg-gradient-to-r from-emerald-300/10 via-transparent to-transparent" : "bg-gradient-to-r from-[#dce8dc]/70 via-transparent to-transparent"].join(" ")}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setEditorOpen((value) => !value)}
              className={["rounded-xl px-3 py-1.5 text-xs font-black transition", isDark ? "bg-emerald-400/12 text-emerald-100 hover:bg-emerald-400/18" : "bg-white text-[#285743] shadow-sm hover:bg-[#f7fbf5]"].join(" ")}
            >
              {editorOpen ? (lang === "tr" ? "Kapat" : "Close") : lang === "tr" ? "Beslenme bilgisi ekle" : "Add nutrition note"}
            </button>
            {customFacts.length ? (
              <span className={["text-[10px] font-black uppercase", isDark ? "text-zinc-500" : "text-[#6c7c70]"].join(" ")}>
                {lang === "tr" ? "Özel not" : "Custom notes"}: {customFacts.length}
              </span>
            ) : null}
          </div>
          {editorOpen ? (
            <div className="mt-3 grid gap-2">
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={factDraft}
                  onChange={(event) => setFactDraft(event.target.value)}
                  maxLength={180}
                  placeholder={lang === "tr" ? "Danışanların göreceği kısa bir bilgi yaz..." : "Write a short note clients will see..."}
                  className={[
                    "min-h-10 flex-1 rounded-xl border px-3 py-2 text-xs font-semibold outline-none transition",
                    isDark ? "border-transparent bg-black/25 text-white placeholder:text-zinc-500 focus:bg-black/35" : "border-transparent bg-white text-[#123a32] placeholder:text-[#6c7c70] shadow-sm focus:bg-white",
                  ].join(" ")}
                />
                <button
                  type="button"
                  onClick={addCustomFact}
                  disabled={factDraft.trim().length < 8}
                  className={["rounded-xl px-4 py-2 text-xs font-black transition disabled:opacity-45", isDark ? "bg-emerald-400 text-zinc-950 hover:brightness-110" : "bg-[#2f6154] text-white hover:bg-[#244f44]"].join(" ")}
                >
                  {lang === "tr" ? "Ekle" : "Add"}
                </button>
              </div>
              {customFacts.length ? (
                <div className="grid gap-1.5">
                  {customFacts.slice(-3).reverse().map((item) => (
                    <div key={item.id} className={["flex items-center justify-between gap-2 rounded-xl px-3 py-2", isDark ? "bg-black/20" : "bg-white shadow-sm"].join(" ")}>
                      <span className={["line-clamp-1 text-xs font-semibold", isDark ? "text-zinc-300" : "text-[#123a32]"].join(" ")}>{item.text}</span>
                      <button
                        type="button"
                        onClick={() => removeCustomFact(item.id)}
                        className={["shrink-0 rounded-lg px-2 py-1 text-[10px] font-black transition", isDark ? "text-rose-200 hover:bg-rose-500/10" : "text-rose-700 hover:bg-rose-50"].join(" ")}
                      >
                        {lang === "tr" ? "Sil" : "Delete"}
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
    <div className={["relative min-h-screen w-screen overflow-x-hidden", isDark ? "text-white" : "bg-[#f7f1e7] text-[#2f2b22]"].join(" ")}>
      <div className="pointer-events-none absolute inset-0">
        <div className={isDark ? "absolute inset-0 [background:radial-gradient(1000px_620px_at_18%_6%,rgba(16,185,129,0.20),transparent_58%),linear-gradient(180deg,#050608,#07090b_56%,#050608)]" : "absolute inset-0 bg-[#f7f1e7]"} />
      </div>
      <main className="relative grid min-h-screen place-items-center px-4">
        <div className={panelClass(isDark, "w-full max-w-md px-5 py-5 text-center")}>
          <div className={["mx-auto h-10 w-10 animate-pulse rounded-xl", isDark ? "bg-emerald-400/30" : "bg-[#dbece4]"].join(" ")} />
          <h1 className="mt-4 text-xl font-black">{message}</h1>
          <p className={["mt-2 text-xs", isDark ? "text-zinc-400" : "text-[#4d6b62]"].join(" ")}>
            {lang === "tr" ? "Panel hazırlanıyor." : "Preparing dashboard."}
          </p>
        </div>
      </main>
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
  return <div className={`${panelClass(isDark, "p-3.5")} ${className}`.trim()}>{children}</div>;
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
    <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-sm font-black">{title}</h2>
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
  accent = "from-emerald-400/20 to-teal-300/10",
}: {
  isDark: boolean;
  title: string;
  value: string;
  accent?: string;
}) {
  return (
    <DashboardPanel isDark={isDark} className="p-3">
      <div className={`mb-3 h-1.5 w-14 rounded-full bg-gradient-to-r ${accent}`} />
      <div className={labelTextClass(isDark)}>{title}</div>
      <div className="mt-1 text-xl font-black leading-none">{value}</div>
      <div className={["mt-3 h-px w-full", isDark ? "bg-gradient-to-r from-emerald-300/25 to-transparent" : "bg-gradient-to-r from-[#2f6154]/18 to-transparent"].join(" ")} />
    </DashboardPanel>
  );
}

export function dashboardButtonClass(isDark: boolean, variant: "default" | "danger" | "primary" = "default") {
  if (variant === "primary") {
    return "rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-300 px-3 py-1.5 text-xs font-black text-zinc-950 transition hover:brightness-110";
  }
  if (variant === "danger") {
    return [
      "px-3 py-1.5 text-xs font-bold transition",
      isDark ? "rounded-full border border-rose-400/25 bg-rose-500/10 text-rose-100 hover:bg-rose-500/15" : "rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100",
    ].join(" ");
  }
  return [
    "px-3 py-1.5 text-xs font-bold transition",
      isDark ? "rounded-full bg-white/5 text-zinc-100 hover:bg-white/10" : "rounded-xl border border-[#e4dbc9] bg-[#fffaf2] text-[#285743] hover:bg-white",
  ].join(" ");
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
      className={[
        "group relative inline-flex items-center gap-2 overflow-hidden border px-3 py-1.5 text-xs font-black shadow-sm transition",
        isDark
          ? "rounded-2xl border-transparent bg-emerald-400 text-zinc-950 shadow-[0_14px_42px_rgba(16,185,129,0.18)] hover:brightness-110"
          : "rounded-xl border-[#2f6154]/20 bg-[#2f6154] text-white shadow-[0_12px_34px_rgba(47,97,84,0.14)] hover:bg-[#244f44]",
      ].join(" ")}
    >
      <span
        className={[
          "flex h-5 w-5 items-center justify-center rounded-lg",
          isDark ? "bg-zinc-950/10 text-zinc-950" : "bg-white/10 text-white",
        ].join(" ")}
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M21 12a8.5 8.5 0 0 1-8.5 8.5 9 9 0 0 1-3.66-.78L3 21l1.35-4.33A8.46 8.46 0 0 1 4 12a8.5 8.5 0 1 1 17 0Z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01" />
        </svg>
      </span>
      <span>{label}</span>
      {unreadCount > 0 ? (
        <span
          className={[
            "ml-0.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-black",
            isDark ? "bg-zinc-950 text-emerald-200" : "bg-white text-[#285743]",
          ].join(" ")}
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      ) : null}
    </Link>
  );
}

export function labelTextClass(isDark: boolean) {
  return ["text-[10px] font-bold uppercase", isDark ? "text-zinc-400" : "text-[#5e776e]"].join(" ");
}

export function mutedTextClass(isDark: boolean) {
  return ["mt-1 text-xs leading-5", isDark ? "text-zinc-400" : "text-[#4d6b62]"].join(" ");
}

function panelClass(isDark: boolean, padding: string) {
  return [
    padding,
    isDark
      ? "rounded-2xl bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(16,185,129,0.045))] shadow-[0_22px_70px_rgba(0,0,0,0.34),inset_0_-1px_0_rgba(16,185,129,0.10)]"
      : "rounded-2xl border border-[#e4dbc9] bg-[#fffaf2]/95 shadow-[0_16px_46px_rgba(54,78,66,0.08)]",
  ].join(" ");
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
      const resCount = await fetch("http://localhost:3000/api/notifications/unread-count", {
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
        const resAll = await fetch("http://localhost:3000/api/notifications", {
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
    if (!open) return;
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
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
      await fetch(`http://localhost:3000/api/notifications/${id}/read`, {
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
      await fetch(`http://localhost:3000/api/notifications/read-all`, {
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
        className={[
          "relative flex h-9 w-9 items-center justify-center border transition",
          isDark ? "rounded-2xl border-transparent bg-white/5 hover:bg-white/10" : "rounded-xl border-[#e4dbc9] bg-[#fffaf2] text-[#285743] hover:bg-white"
        ].join(" ")}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className={[
          "absolute right-0 top-12 z-50 w-80 overflow-hidden border shadow-2xl",
          isDark ? "rounded-2xl border-transparent bg-[#080b0a]/95" : "rounded-2xl border-[#e4dbc9] bg-[#fffaf2]"
        ].join(" ")}>
          <div className={[
            "flex items-center justify-between border-b px-4 py-3",
            isDark ? "border-transparent bg-white/5" : "border-[#e4dbc9] bg-[#f9f6ec]"
          ].join(" ")}>
            <h3 className="font-extrabold text-sm">{lang === "tr" ? "Bildirimler" : "Notifications"}</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className={["text-xs font-black transition", isDark ? "text-emerald-300 hover:text-emerald-200" : "text-[#285743] hover:text-[#123a32]"].join(" ")}>
                {lang === "tr" ? "Tümünü okundu işaretle" : "Mark all as read"}
              </button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className={["px-4 py-8 text-center text-sm", isDark ? "text-zinc-500" : "text-[#7a7160]"].join(" ")}>
                {lang === "tr" ? "Henüz bir bildiriminiz yok." : "You do not have any notifications yet."}
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  onClick={() => !notif.is_read && markAsRead(notif.id)}
                  className={[
                    "px-4 py-3 border-b last:border-0 cursor-pointer transition",
                    isDark ? "border-transparent hover:bg-white/5" : "border-[#d8e5d8] hover:bg-white",
                    !notif.is_read ? (isDark ? "bg-emerald-500/5" : "bg-[#edf6ec]") : ""
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="font-bold text-sm flex items-center gap-2">
                        {!notif.is_read && <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0"></span>}
                        {notif.title}
                      </div>
                      <div className={["text-xs mt-1 leading-relaxed", isDark ? "text-zinc-400" : "text-[#4d6b62]"].join(" ")}>
                        {notif.message}
                      </div>
                      <div className={["text-[10px] mt-2", isDark ? "text-zinc-600" : "text-[#789188]"].join(" ")}>
                        {new Date(notif.created_at).toLocaleString(lang === "tr" ? "tr-TR" : "en-US")}
                      </div>
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
