import type { ReactNode } from "react";

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
            {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
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
