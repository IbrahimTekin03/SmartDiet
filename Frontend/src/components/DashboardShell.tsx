import { type ReactNode, useEffect, useState, useRef } from "react";

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
    <div className={["min-h-screen w-screen", isDark ? "bg-[#07090b] text-white" : "bg-[#e7efe9] text-[#0f2f29]"].join(" ")}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className={isDark ? "absolute -left-24 top-0 h-80 w-80 rounded-full bg-emerald-500/10 blur-[110px]" : "absolute -left-24 top-0 h-80 w-80 rounded-full bg-emerald-600/10 blur-[110px]"} />
        <div className={isDark ? "absolute right-0 top-16 h-96 w-96 rounded-full bg-teal-400/10 blur-[140px]" : "absolute right-0 top-16 h-96 w-96 rounded-full bg-cyan-500/10 blur-[140px]"} />
      </div>

      <main className="relative mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <header className={panelClass(isDark, "p-6")}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              {badge ? (
                <div className={isDark ? "inline-flex rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-200" : "inline-flex rounded-full border border-emerald-700/15 bg-emerald-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-900"}>
                  {badge}
                </div>
              ) : null}
              <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">{title}</h1>
              {subtitle ? (
                <p className={["mt-3 max-w-2xl text-sm leading-7 sm:text-base", isDark ? "text-zinc-300" : "text-[#36544c]"].join(" ")}>
                  {subtitle}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <NotificationBell isDark={isDark} />
              {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
            </div>
          </div>
        </header>

        <div className="mt-6 space-y-6">{children}</div>
      </main>
    </div>
  );
}

export function DashboardLoadingScreen({
  isDark,
  message,
}: {
  isDark: boolean;
  message: string;
}) {
  return (
    <div className={["min-h-screen w-screen", isDark ? "bg-[#07090b] text-white" : "bg-[#e7efe9] text-[#0f2f29]"].join(" ")}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className={isDark ? "absolute -left-24 top-0 h-80 w-80 rounded-full bg-emerald-500/10 blur-[110px]" : "absolute -left-24 top-0 h-80 w-80 rounded-full bg-emerald-600/10 blur-[110px]"} />
        <div className={isDark ? "absolute right-0 top-16 h-96 w-96 rounded-full bg-teal-400/10 blur-[140px]" : "absolute right-0 top-16 h-96 w-96 rounded-full bg-cyan-500/10 blur-[140px]"} />
      </div>
      <main className="relative grid min-h-screen place-items-center px-4">
        <div className={panelClass(isDark, "w-full max-w-lg p-8 text-center")}>
          <div className="mx-auto h-14 w-14 animate-pulse rounded-2xl bg-gradient-to-br from-emerald-400/60 to-teal-300/40" />
          <h1 className="mt-5 text-2xl font-extrabold">{message}</h1>
          <p className={["mt-2 text-sm", isDark ? "text-zinc-400" : "text-[#4d6b62]"].join(" ")}>
            Dashboard hazirlaniyor.
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
  return <div className={`${panelClass(isDark, "p-6")} ${className}`.trim()}>{children}</div>;
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
        <h2 className="text-lg font-extrabold">{title}</h2>
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
    <DashboardPanel isDark={isDark} className="p-5">
      <div className={`mb-4 h-2 w-20 rounded-full bg-gradient-to-r ${accent}`} />
      <div className={labelTextClass(isDark)}>{title}</div>
      <div className="mt-3 text-3xl font-extrabold">{value}</div>
    </DashboardPanel>
  );
}

export function dashboardButtonClass(isDark: boolean, variant: "default" | "danger" | "primary" = "default") {
  if (variant === "primary") {
    return "rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-300 px-4 py-2 text-xs font-black text-zinc-950 transition hover:brightness-110";
  }
  if (variant === "danger") {
    return [
      "rounded-2xl px-4 py-2 text-xs font-bold transition",
      isDark ? "border border-rose-400/25 bg-rose-500/10 text-rose-100 hover:bg-rose-500/15" : "border border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100",
    ].join(" ");
  }
  return [
    "rounded-2xl px-4 py-2 text-xs font-bold transition",
    isDark ? "border border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10" : "border border-[#2f6154]/20 bg-white text-[#123a32] hover:bg-[#eef5f1]",
  ].join(" ");
}

export function labelTextClass(isDark: boolean) {
  return ["text-xs font-bold uppercase tracking-[0.18em]", isDark ? "text-zinc-400" : "text-[#5f7a72]"].join(" ");
}

export function mutedTextClass(isDark: boolean) {
  return ["mt-1 text-sm", isDark ? "text-zinc-400" : "text-[#4d6b62]"].join(" ");
}

function panelClass(isDark: boolean, padding: string) {
  return [
    "rounded-[28px] border shadow-[0_30px_110px_rgba(0,0,0,0.10)]",
    padding,
    isDark ? "border-white/10 bg-white/5" : "border-[#2f6154]/15 bg-white/80",
  ].join(" ");
}

export function NotificationBell({ isDark }: { isDark: boolean }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) return;
      try {
        const resCount = await fetch("https://smart-diet06.vercel.app/api/notifications/unread-count", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const dataCount = await resCount.json();
        setUnreadCount(dataCount?.data?.count || 0);

        const resAll = await fetch("https://smart-diet06.vercel.app/api/notifications", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const dataAll = await resAll.json();
        setNotifications(Array.isArray(dataAll?.data) ? dataAll.data : []);
      } catch (err) {}
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

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
      await fetch(`https://smart-diet06.vercel.app/api/notifications/${id}/read`, {
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
      await fetch(`https://smart-diet06.vercel.app/api/notifications/read-all`, {
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
          "relative flex h-10 w-10 items-center justify-center rounded-2xl border transition",
          isDark ? "border-white/10 bg-white/5 hover:bg-white/10" : "border-[#2f6154]/20 bg-white hover:bg-[#eef5f1]"
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
          "absolute right-0 top-12 z-50 w-80 rounded-[24px] border shadow-2xl overflow-hidden",
          isDark ? "border-white/10 bg-[#111]" : "border-[#2f6154]/15 bg-white"
        ].join(" ")}>
          <div className={[
            "flex items-center justify-between border-b px-4 py-3",
            isDark ? "border-white/10 bg-white/5" : "border-[#2f6154]/10 bg-gray-50"
          ].join(" ")}>
            <h3 className="font-extrabold text-sm">Bildirimler</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-xs font-semibold text-emerald-500 hover:text-emerald-600 transition">
                Tümünü Okundu İşaretle
              </button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                Henüz bir bildiriminiz yok.
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  onClick={() => !notif.is_read && markAsRead(notif.id)}
                  className={[
                    "px-4 py-3 border-b last:border-0 cursor-pointer transition",
                    isDark ? "border-white/5 hover:bg-white/5" : "border-gray-100 hover:bg-gray-50",
                    !notif.is_read ? (isDark ? "bg-emerald-500/5" : "bg-emerald-50") : ""
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="font-bold text-sm flex items-center gap-2">
                        {!notif.is_read && <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0"></span>}
                        {notif.title}
                      </div>
                      <div className={["text-xs mt-1 leading-relaxed", isDark ? "text-zinc-400" : "text-gray-600"].join(" ")}>
                        {notif.message}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-2">
                        {new Date(notif.created_at).toLocaleString()}
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
