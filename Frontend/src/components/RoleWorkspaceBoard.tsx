import { useEffect, useMemo, useState } from "react";

export type WorkspaceItem = {
  id: string;
  title: string;
  description: string;
};

export function RoleWorkspaceBoard({
  isDark,
  title,
  subtitle,
  items,
  storageKey,
  readOnly = false,
}: {
  isDark: boolean;
  title: string;
  subtitle: string;
  items: WorkspaceItem[];
  storageKey?: string;
  readOnly?: boolean;
}) {
  const [completedIds, setCompletedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!storageKey) {
      setCompletedIds([]);
      return;
    }
    try {
      const raw = localStorage.getItem(storageKey);
      const parsed = raw ? (JSON.parse(raw) as string[]) : [];
      setCompletedIds(Array.isArray(parsed) ? parsed : []);
    } catch {
      setCompletedIds([]);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey) return;
    localStorage.setItem(storageKey, JSON.stringify(completedIds));
  }, [completedIds, storageKey]);

  const completion = useMemo(() => {
    if (!items.length) return 0;
    return Math.round((completedIds.length / items.length) * 100);
  }, [completedIds.length, items.length]);

  const toggleItem = (id: string) => {
    if (readOnly || !storageKey) return;
    setCompletedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  return (
    <div
      className={[
        "rounded-[24px] border p-4",
        isDark ? "border-white/10 bg-black/20" : "border-[#2f6154]/15 bg-[#f7faf8]",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-extrabold">{title}</div>
          <div className={["mt-1 text-sm leading-6", isDark ? "text-zinc-300" : "text-[#4d6b62]"].join(" ")}>
            {subtitle}
          </div>
        </div>
        <div
          className={[
            "shrink-0 rounded-2xl px-3 py-2 text-right",
            isDark ? "bg-white/5 text-zinc-200" : "bg-white text-[#163d34]",
          ].join(" ")}
        >
          <div className={["text-[11px] font-bold uppercase tracking-[0.18em]", isDark ? "text-zinc-500" : "text-[#6c847d]"].join(" ")}>
            {readOnly ? "View" : "Progress"}
          </div>
          <div className="mt-1 text-lg font-extrabold">{readOnly ? `${items.length}` : `${completion}%`}</div>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {items.map((item, index) => {
          const completed = completedIds.includes(item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => toggleItem(item.id)}
              disabled={readOnly}
              className={[
                "flex w-full items-start gap-3 rounded-[20px] border px-4 py-3 text-left transition",
                readOnly
                  ? isDark
                    ? "cursor-default border-white/10 bg-white/5"
                    : "cursor-default border-[#2f6154]/15 bg-white"
                  : isDark
                    ? "border-white/10 bg-white/5 hover:bg-white/10"
                    : "border-[#2f6154]/15 bg-white hover:bg-[#f2f8f5]",
              ].join(" ")}
            >
              <div
                className={[
                  "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold",
                  completed
                    ? isDark
                      ? "bg-emerald-500/20 text-emerald-100"
                      : "bg-emerald-100 text-emerald-800"
                    : isDark
                      ? "bg-white/10 text-zinc-200"
                      : "bg-[#e5efea] text-[#2e574b]",
                ].join(" ")}
              >
                {completed ? "OK" : index + 1}
              </div>
              <div>
                <div className="text-sm font-extrabold">{item.title}</div>
                <div className={["mt-1 text-sm leading-6", isDark ? "text-zinc-300" : "text-[#4d6b62]"].join(" ")}>
                  {item.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
