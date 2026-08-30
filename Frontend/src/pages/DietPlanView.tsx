import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardPanel, DashboardShell } from "../components/DashboardShell";
import { useAppSettings } from "../context/AppSettingsContext";
import { parseStoredUser, useAuthSession } from "../lib/authSession";
import * as XLSX from "xlsx";
import { API_BASE_URL as API_BASE } from "../lib/api";
import { 
  FileSpreadsheet, 
  Calendar, 
  Flame, 
  Utensils, 
  CheckCircle2, 
  Edit3, 
  Trash2, 
  Sparkles, 
  TrendingUp, 
  ChevronLeft, 
  Search, 
  X, 
  Plus, 
  Clock,
  Save,
  Check,
  AlertCircle
} from "lucide-react";

export default function DietPlanView() {
  const { isDark, lang } = useAppSettings();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { accessToken, userJson } = useAuthSession();
  const currentUser = parseStoredUser<any>(userJson);
  
  const roleNames = (currentUser?.roles || []).map((r: any) => String(r?.name || "").toLowerCase());
  const isDietitian = roleNames.includes("diyetisyen") || currentUser?.account_type?.toLowerCase() === "diyetisyen";

  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [trackingData, setTrackingData] = useState<Record<string, Record<string, boolean>>>({});
  const [selectedDay, setSelectedDay] = useState(() => {
    const day = new Date().getDay();
    return day === 0 ? 7 : day;
  });
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [adherence, setAdherence] = useState<number>(0);

  // Edit / Delete Meal Item states
  const [editingItem, setEditingItem] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedFood, setSelectedFood] = useState<any>(null);
  const [editAmount, setEditAmount] = useState<number>(100);

  useEffect(() => {
    fetchPlan();
  }, [id]);

  const getPlanStartDate = () => {
    if (plan && plan.description) {
      const startMatch = plan.description.match(/Başlangıç Tarihi:\s*(\d{4}-\d{2}-\d{2})/);
      if (startMatch) return startMatch[1];
    }
    const createdDate = plan ? new Date(plan.createdAt) : new Date();
    createdDate.setDate(createdDate.getDate() + 1);
    return createdDate.toISOString().split("T")[0];
  };

  const getPlanDateForDay = (dayNum: number) => {
    const startDateStr = getPlanStartDate();
    const [sy, sm, sd] = startDateStr.split("-").map(Number);
    const date = new Date(Date.UTC(sy, sm - 1, sd));
    date.setUTCDate(date.getUTCDate() + (dayNum - 1));
    return date.toISOString().split("T")[0];
  };

  const getPlanDayForDate = (dateStr: string) => {
    const startDateStr = getPlanStartDate();
    const [sy, sm, sd] = startDateStr.split("-").map(Number);
    const [ty, tm, td] = dateStr.split("-").map(Number);
    const startUTC = Date.UTC(sy, sm - 1, sd);
    const targetUTC = Date.UTC(ty, tm - 1, td);
    const diffMs = targetUTC - startUTC;
    return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
  };

  const formatStringToDMY = (dateStr: string) => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  };

  useEffect(() => {
    if (plan && !selectedDate) {
      const startDateStr = getPlanStartDate();
      const todayStr = new Date().toISOString().split("T")[0];
      
      let initialDate = todayStr;
      let initialDay = getPlanDayForDate(todayStr);
      
      let maxDays = 1;
      if (plan.plan_type === "weekly") maxDays = 7;
      else if (plan.plan_type === "monthly") maxDays = 30;
      
      if (initialDay < 1) {
        initialDate = startDateStr;
        initialDay = 1;
      } else if (initialDay > maxDays) {
        initialDate = getPlanDateForDay(1);
        initialDay = 1;
      }
      
      setSelectedDate(initialDate);
      setSelectedDay(initialDay);
    }
  }, [plan, selectedDate]);

  useEffect(() => {
    if (id && selectedDate) {
      fetchPlan();
      fetchTracking();
      fetchAdherence(selectedDate);
      sessionStorage.setItem("aiUiContext", JSON.stringify({ planId: id, date: selectedDate }));
    }
    return () => {
      sessionStorage.removeItem("aiUiContext");
    };
  }, [id, selectedDate]);

  const handleDayTabClick = (dayNumber: number) => {
    handleSaveTracking(false);
    setSelectedDay(dayNumber);
    const targetDate = getPlanDateForDay(dayNumber);
    setSelectedDate(targetDate);
  };

  const handleDateChange = (dateStr: string) => {
    handleSaveTracking(false);
    setSelectedDate(dateStr);
    
    let maxDays = 1;
    if (plan?.plan_type === "weekly") maxDays = 7;
    else if (plan?.plan_type === "monthly") maxDays = 30;

    const dayNum = getPlanDayForDate(dateStr);
    if (dayNum >= 1 && dayNum <= maxDays) {
      setSelectedDay(dayNum);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    if (plan) {
      fetchTracking(controller.signal);
      fetchAdherence();
    }
    return () => controller.abort();
  }, [plan, selectedDate, selectedDay]);

  const fetchPlan = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API_BASE}/api/diet-plans/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.data) {
        setPlan(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdherence = async (dateStr: string = selectedDate) => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API_BASE}/api/diet-plans/${id}/adherence?date=${dateStr}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.data !== undefined) {
        setAdherence(Number(data.data ?? 0));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTracking = async (signal?: AbortSignal) => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API_BASE}/api/diet-plans/track?planId=${id}&date=${selectedDate}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal,
      });
      const data = await res.json();
      const dayTracking: Record<string, boolean> = {};
      if (data.data && Array.isArray(data.data)) {
        data.data.forEach((t: any) => {
          dayTracking[t.meal_item_id] = t.is_consumed;
        });
      }
      setTrackingData((prev) => ({ ...prev, [selectedDate]: dayTracking }));
    } catch (err) {
      if ((err as any).name === "AbortError") return;
      setTrackingData((prev) => ({ ...prev, [selectedDate]: prev[selectedDate] || {} }));
    }
  };

  const toggleItem = async (mealItemId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    const activeDate = selectedDate;
    
    setTrackingData((prev) => ({
      ...prev,
      [activeDate]: {
        ...(prev[activeDate] || {}),
        [mealItemId]: newStatus,
      },
    }));
    
    setSaveStatus("saving");
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API_BASE}/api/diet-plans/track`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          plan_id: id,
          meal_item_id: mealItemId,
          date: activeDate,
          is_consumed: newStatus,
        }),
      });
      
      if (!res.ok) throw new Error();
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
      fetchAdherence(activeDate);
    } catch (err) {
      console.error(err);
      setSaveStatus("error");
      setTrackingData((prev) => ({
        ...prev,
        [activeDate]: {
          ...(prev[activeDate] || {}),
          [mealItemId]: currentStatus,
        },
      }));
    }
  };

  const handleSaveTracking = async (showNotification = true) => {
    const activeDate = selectedDate;
    const activeDayData = trackingData[activeDate] || {};
    
    try {
      const token = localStorage.getItem("access_token");
      const items = Object.entries(activeDayData).map(([meal_item_id, is_consumed]) => ({
        meal_item_id,
        is_consumed,
      }));

      await fetch(`${API_BASE}/api/diet-plans/track/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          plan_id: id,
          date: activeDate,
          items,
        }),
      });
      
      if (showNotification) {
        setToast({ 
          message: lang === "tr" ? "Öğün tüketim durumu kaydedildi!" : "Meal tracking saved!", 
          type: "success", 
        });
        setTimeout(() => setToast(null), 3000);
      }
      fetchAdherence(activeDate);
    } catch {
      if (showNotification) {
        setToast({ 
          message: lang === "tr" ? "Kaydedilirken bir hata oluştu." : "Error saving changes.", 
          type: "error", 
        });
        setTimeout(() => setToast(null), 3000);
      }
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    const timer = setTimeout(() => {
      fetch(`${API_BASE}/api/foods?search=${encodeURIComponent(searchQuery)}`)
        .then((res) => res.json())
        .then((data) => {
          setSearchResults(data.data || []);
          setSearching(false);
        })
        .catch(() => setSearching(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleOpenEditModal = (item: any) => {
    setEditingItem(item);
    setSelectedFood(item.food);
    setEditAmount(Number(item.amount) || 100);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleUpdateItem = async () => {
    if (!editingItem || !selectedFood || !accessToken) return;

    try {
      const res = await fetch(`${API_BASE}/api/diet-plans/meal-item/${editingItem.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          food_id: selectedFood.id,
          amount: editAmount,
        }),
      });

      const data = await res.json();
      if (res.ok && data.data) {
        setPlan((prev: any) => {
          if (!prev) return prev;
          const updatedMeals = prev.meals.map((meal: any) => {
            const updatedItems = meal.items.map((it: any) => {
              if (it.id === editingItem.id) {
                return {
                  ...it,
                  food_id: selectedFood.id,
                  amount: editAmount,
                  food: selectedFood,
                };
              }
              return it;
            });
            return { ...meal, items: updatedItems };
          });
          return { ...prev, meals: updatedMeals };
        });

        setToast({
          message: lang === "tr" ? "Besin başarıyla güncellendi!" : "Food updated!",
          type: "success",
        });
        setTimeout(() => setToast(null), 3000);
        setEditingItem(null);
      }
    } catch {
      setToast({
        message: lang === "tr" ? "Besin güncellenirken hata oluştu." : "Error updating food.",
        type: "error",
      });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    const confirmDelete = window.confirm(
      lang === "tr" ? "Bu besini programdan silmek istediğinize emin misiniz?" : "Delete food from meal?",
    );
    if (!confirmDelete || !accessToken) return;

    try {
      const res = await fetch(`${API_BASE}/api/diet-plans/meal-item/${itemId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (res.ok) {
        setPlan((prev: any) => {
          if (!prev) return prev;
          const updatedMeals = prev.meals.map((meal: any) => {
            const updatedItems = meal.items.filter((it: any) => it.id !== itemId);
            return { ...meal, items: updatedItems };
          });
          return { ...prev, meals: updatedMeals };
        });

        setToast({
          message: lang === "tr" ? "Besin silindi!" : "Food deleted!",
          type: "success",
        });
        setTimeout(() => setToast(null), 3000);
      }
    } catch {
      setToast({ message: "Error deleting item", type: "error" });
      setTimeout(() => setToast(null), 3000);
    }
  };

  if (loading || !plan || !selectedDate) {
    return (
      <DashboardShell isDark={isDark} title={lang === "tr" ? "Diyet Planı" : "Diet Plan"}>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        </div>
      </DashboardShell>
    );
  }

  const getRatio = (amount: number, unit?: string) => {
    const num = Number(amount) || 0;
    const lowerUnit = (unit || "g").toLowerCase().trim();
    if (lowerUnit === "100g" || lowerUnit === "100 g") {
      return num > 5 ? num / 100 : num;
    }
    const isPer100 = ["g", "ml", "gram", "100ml", "100 ml"].includes(lowerUnit);
    return isPer100 ? num / 100 : num;
  };

  const getDisplayAmountAndUnit = (amount: number, unit?: string) => {
    const num = Number(amount) || 0;
    const numStr = num.toString();
    const lowerUnit = (unit || "g").toLowerCase().trim();
    if (lowerUnit === "100g" || lowerUnit === "100 g") {
      return num > 5 ? `${numStr} g` : `${numStr} adet 100g`;
    }
    return `${numStr} ${unit || "g"}`;
  };

  const exportToExcel = () => {
    if (!plan || !plan.meals) return;

    const mealsByDay: Record<number, any[]> = {};
    plan.meals.forEach((m: any) => {
      const day = m.day_of_week;
      if (!mealsByDay[day]) mealsByDay[day] = [];
      mealsByDay[day].push(m);
    });

    let maxMeals = 0;
    Object.values(mealsByDay).forEach((meals) => {
      if (meals.length > maxMeals) maxMeals = meals.length;
    });

    const rows: any[] = [];
    let daysToExport: number[] = [];
    if (plan.plan_type === "weekly") {
      daysToExport = [1, 2, 3, 4, 5, 6, 7];
    } else if (plan.plan_type === "monthly") {
      daysToExport = Array.from({ length: 30 }, (_, i) => i + 1);
    } else {
      daysToExport = [1];
      if (Object.keys(mealsByDay).length > 0) {
        mealsByDay[1] = plan.meals;
      }
    }

    daysToExport.forEach((dayNumber) => {
      const dayMeals = mealsByDay[dayNumber] || [];
      dayMeals.sort((a, b) => (a.time || "").localeCompare(b.time || ""));

      let totalCal = 0;
      let totalPro = 0;
      let totalCarb = 0;
      let totalFat = 0;

      const [year, month, day] = selectedDate.split("-").map(Number);
      const baseDate = new Date(Date.UTC(year, month - 1, day));
      const offset = plan.plan_type === "daily" ? 0 : dayNumber - 1;
      baseDate.setUTCDate(baseDate.getUTCDate() + offset);

      const formattedDate = `${baseDate.getUTCDate().toString().padStart(2, "0")}/${(baseDate.getUTCMonth() + 1).toString().padStart(2, "0")}/${baseDate.getUTCFullYear()}`;
      const dayName = new Intl.DateTimeFormat("tr-TR", { weekday: "long" }).format(baseDate);

      const row: any = {
        "Tarih": formattedDate,
        "Gün": dayName,
      };

      dayMeals.forEach((meal, idx) => {
        const mealKey = `Öğün ${idx + 1}`;
        const itemNames = meal.items?.map((item: any) => {
          if (!item.food) return null;
          return `${item.food.name} (${getDisplayAmountAndUnit(item.amount, item.food.unit)})`;
        }).filter(Boolean) || [];
        row[mealKey] = itemNames.length > 0 ? itemNames.join(" , ") : "-";

        meal.items?.forEach((item: any) => {
          const ratio = getRatio(Number(item.amount), item.food?.unit);
          totalCal += (Number(item.food?.calories) || 0) * ratio;
          totalPro += (Number(item.food?.protein) || 0) * ratio;
          totalCarb += (Number(item.food?.carbohydrates) || 0) * ratio;
          totalFat += (Number(item.food?.fat) || 0) * ratio;
        });
      });

      for (let i = dayMeals.length; i < maxMeals; i++) {
        row[`Öğün ${i + 1}`] = "-";
      }

      row["Toplam Kalori"] = Math.round(totalCal) + " kcal";
      row["Toplam Protein"] = Math.round(totalPro) + " g";
      row["Toplam Karbonhidrat"] = Math.round(totalCarb) + " g";
      row["Toplam Yağ"] = Math.round(totalFat) + " g";

      rows.push(row);
    });

    const header = ["Tarih", "Gün"];
    for (let i = 1; i <= maxMeals; i++) header.push(`Öğün ${i}`);
    header.push("Toplam Kalori", "Toplam Protein", "Toplam Karbonhidrat", "Toplam Yağ");

    const ws = XLSX.utils.json_to_sheet(rows, { header });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Beslenme Planı");
    XLSX.writeFile(wb, `${plan.title || "Beslenme_Plani"}.xlsx`);
  };

  const planTypeLabel = plan.plan_type === "daily" ? (lang === "tr" ? "Günlük Plan" : "Daily Plan") : plan.plan_type === "monthly" ? (lang === "tr" ? "Aylık Plan" : "Monthly Plan") : (lang === "tr" ? "Haftalık Plan" : "Weekly Plan");

  const displayedMealsRaw = ["weekly", "monthly"].includes(plan.plan_type)
    ? plan.meals?.filter((m: any) => m.day_of_week === selectedDay)
    : plan.meals;

  const displayedMeals = displayedMealsRaw
    ? [...displayedMealsRaw].sort((a, b) => (a.time || "").localeCompare(b.time || ""))
    : [];

  const consumedMacros = { calories: 0, protein: 0, fat: 0, carbs: 0 };
  const currentTracking = trackingData[selectedDate] || {};

  displayedMeals?.forEach((meal: any) => {
    meal.items?.forEach((item: any) => {
      if (currentTracking[item.id]) {
        const ratio = getRatio(Number(item.amount), item.food?.unit);
        consumedMacros.calories += (Number(item.food?.calories) || 0) * ratio;
        consumedMacros.protein += (Number(item.food?.protein) || 0) * ratio;
        consumedMacros.fat += (Number(item.food?.fat) || 0) * ratio;
        consumedMacros.carbs += (Number(item.food?.carbohydrates) || 0) * ratio;
      }
    });
  });

  return (
    <DashboardShell isDark={isDark} title={plan.title} subtitle={planTypeLabel} backUrl="back">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Top Controls Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <button
            type="button"
            onClick={exportToExcel}
            className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>{lang === "tr" ? "Excel Çıktısı Al" : "Export to Excel"}</span>
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {saveStatus === "saving" && (
              <span className="text-xs font-bold text-amber-400 animate-pulse flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span>{lang === "tr" ? "Kaydediliyor..." : "Saving..."}</span>
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{lang === "tr" ? "Kaydedildi" : "Saved"}</span>
              </span>
            )}
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className={`rounded-2xl border px-3.5 py-2 text-xs font-mono font-bold outline-none ${
                isDark ? "border-white/10 bg-black/40 text-white focus:border-emerald-500" : "border-slate-200 bg-white text-slate-900 focus:border-emerald-500"
              }`}
            />
          </div>
        </div>

        {/* Day Tabs */}
        {["weekly", "monthly"].includes(plan.plan_type) && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {(plan.plan_type === "weekly"
              ? ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"]
              : Array.from({ length: 30 }, (_, i) => `${i + 1}. Gün`)
            ).map((day, idx) => {
              const dayNumber = idx + 1;
              const isSelected = selectedDay === dayNumber;
              return (
                <button
                  key={dayNumber}
                  type="button"
                  onClick={() => handleDayTabClick(dayNumber)}
                  className={`whitespace-nowrap rounded-2xl px-5 py-2.5 text-xs font-black transition shrink-0 ${
                    isSelected
                      ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25"
                      : isDark ? "border border-white/5 bg-black/40 text-slate-400 hover:text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        )}

        {/* Adherence & Macros Summary */}
        <div className="grid gap-4 md:grid-cols-12">
          {/* Adherence Banner */}
          <div className={`md:col-span-4 p-5 rounded-[28px] border flex flex-col justify-between ${
            isDark ? "border-white/10 bg-slate-900/60" : "border-slate-200 bg-white"
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-sm font-black">{lang === "tr" ? "Diyet Uyumu" : "Diet Adherence"}</h3>
                <p className="text-[10px] text-slate-400">{formatStringToDMY(selectedDate)}</p>
              </div>
            </div>

            <div>
              <div className="font-display text-3xl font-black text-emerald-400">%{adherence}</div>
              <div className="mt-2 h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${adherence}%` }} />
              </div>
            </div>
          </div>

          {/* Consumed Macros */}
          <div className={`md:col-span-8 p-5 rounded-[28px] border grid grid-cols-4 gap-3 ${
            isDark ? "border-white/10 bg-slate-900/80" : "border-slate-200 bg-white shadow-sm"
          }`}>
            <div className="text-center p-3 rounded-2xl border border-white/5 bg-black/20 flex flex-col justify-center">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Kalori</span>
              <span className="font-display text-2xl font-black text-emerald-400 mt-1">{Math.round(consumedMacros.calories)}</span>
              <span className="text-xs font-bold text-slate-400">kcal</span>
            </div>
            <div className="text-center p-3 rounded-2xl border border-white/5 bg-black/20 flex flex-col justify-center">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Protein</span>
              <span className="font-display text-2xl font-black text-cyan-400 mt-1">{Math.round(consumedMacros.protein)}</span>
              <span className="text-xs font-bold text-slate-400">gram</span>
            </div>
            <div className="text-center p-3 rounded-2xl border border-white/5 bg-black/20 flex flex-col justify-center">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Karb</span>
              <span className="font-display text-2xl font-black text-amber-400 mt-1">{Math.round(consumedMacros.carbs)}</span>
              <span className="text-xs font-bold text-slate-400">gram</span>
            </div>
            <div className="text-center p-3 rounded-2xl border border-white/5 bg-black/20 flex flex-col justify-center">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Yağ</span>
              <span className="font-display text-2xl font-black text-rose-400 mt-1">{Math.round(consumedMacros.fat)}</span>
              <span className="text-xs font-bold text-slate-400">gram</span>
            </div>
          </div>
        </div>

        {/* Meals Rendering */}
        <div className="space-y-6">
          {displayedMeals.map((meal: any, index: number) => {
            const totalCals = meal.items?.reduce((acc: number, cur: any) => {
              const ratio = getRatio(Number(cur.amount), cur.food?.unit);
              return acc + (Number(cur.food?.calories) || 0) * ratio;
            }, 0) || 0;

            return (
              <DashboardPanel key={meal.id} isDark={isDark} className="p-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 font-display font-black text-sm shadow-md shadow-emerald-500/10">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-display text-base font-black tracking-tight">{meal.name}</h3>
                      <span className="text-xs font-mono text-emerald-400 font-bold">{meal.time}</span>
                    </div>
                  </div>
                  <span className="text-sm font-mono font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-xl">
                    {Math.round(totalCals)} kcal
                  </span>
                </div>

                {meal.note && (
                  <div className={`p-4 rounded-2xl text-xs sm:text-sm font-medium mb-5 border-l-4 border-emerald-400 ${
                    isDark ? "bg-emerald-500/10 text-emerald-200" : "bg-emerald-50 text-emerald-950"
                  }`}>
                    {meal.note}
                  </div>
                )}

                <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                  {meal.items?.map((item: any) => {
                    const isConsumed = !!currentTracking[item.id];
                    const isClient = !isDietitian;
                    const itemCalories = Math.round((Number(item.food?.calories) || 0) * getRatio(Number(item.amount), item.food?.unit));

                    return (
                      <div
                        key={item.id}
                        onClick={() => isClient && toggleItem(item.id, isConsumed)}
                        className={`group relative p-4 sm:p-4.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                          isClient ? "cursor-pointer" : ""
                        } ${
                          isConsumed
                            ? isDark
                              ? "border-emerald-500/40 bg-emerald-950/25 ring-1 ring-emerald-500/30"
                              : "border-emerald-500 bg-emerald-50/90 ring-1 ring-emerald-500/30"
                            : isDark
                              ? "border-white/10 bg-slate-900/80 hover:border-emerald-500/40 hover:bg-slate-900 shadow-md"
                              : "border-slate-200 bg-white hover:border-emerald-500/40 hover:shadow-md"
                        }`}
                      >
                        <div className="flex items-center gap-3.5 flex-1 min-w-0">
                          {isClient && (
                            <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-xl border-2 transition ${
                              isConsumed
                                ? "border-emerald-500 bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30"
                                : isDark
                                  ? "border-slate-500 bg-slate-800/60"
                                  : "border-slate-300 bg-slate-100"
                            }`}>
                              {isConsumed && <Check className="h-4 w-4 stroke-[3.5]" />}
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <h4 className={`text-sm sm:text-base font-bold truncate leading-snug ${
                              isConsumed
                                ? "line-through text-slate-400 dark:text-slate-500"
                                : isDark
                                  ? "text-white"
                                  : "text-slate-900"
                            }`}>
                              {item.food?.name}
                            </h4>
                            <div className="flex flex-wrap items-center gap-2 mt-1.5">
                              <span className="inline-flex items-center rounded-lg bg-emerald-500/10 px-2 py-0.5 text-xs font-mono font-bold text-emerald-400">
                                {getDisplayAmountAndUnit(item.amount, item.food?.unit)}
                              </span>
                              <span className="text-xs font-mono font-bold text-slate-400">
                                • {itemCalories} kcal
                              </span>
                            </div>
                          </div>
                        </div>

                        {isDietitian && (
                          <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditModal(item);
                              }}
                              className="p-2 rounded-xl border border-white/10 text-slate-300 hover:text-emerald-400 hover:bg-white/5 transition"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteItem(item.id);
                              }}
                              className="p-2 rounded-xl border border-white/10 text-slate-300 hover:text-rose-400 hover:bg-white/5 transition"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </DashboardPanel>

            );
          })}
        </div>

        {/* Edit Modal for Dietitian */}
        {editingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeInUp">
            <div className={`w-full max-w-md rounded-[32px] border p-6 shadow-2xl ${
              isDark ? "border-white/10 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-900"
            }`}>
              <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
                <h3 className="font-display text-sm font-black">{lang === "tr" ? "Besini Düzenle" : "Edit Food Item"}</h3>
                <button type="button" onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">
                    {lang === "tr" ? "Besin Ara" : "Search Food"}
                  </label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Besin adı..."
                    className={`w-full rounded-2xl border px-3.5 py-2.5 text-xs font-semibold outline-none ${
                      isDark ? "border-white/10 bg-black/40 text-white focus:border-emerald-500" : "border-slate-200 bg-slate-50 text-slate-900 focus:border-emerald-500"
                    }`}
                  />
                  {searchResults.length > 0 && (
                    <div className="mt-2 max-h-40 overflow-y-auto space-y-1 rounded-xl border border-white/10 p-2 bg-black/40">
                      {searchResults.map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => {
                            setSelectedFood(f);
                            setSearchQuery("");
                            setSearchResults([]);
                          }}
                          className="w-full p-2 text-left text-xs font-bold hover:bg-emerald-500/20 rounded-lg text-emerald-300"
                        >
                          {f.name} ({f.calories} kcal / 100g)
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">
                    {lang === "tr" ? "Miktar (gram)" : "Amount (g)"}
                  </label>
                  <input
                    type="number"
                    value={editAmount}
                    onChange={(e) => setEditAmount(Number(e.target.value) || 0)}
                    className={`w-full rounded-2xl border px-3.5 py-2.5 text-xs font-mono font-bold outline-none ${
                      isDark ? "border-white/10 bg-black/40 text-white focus:border-emerald-500" : "border-slate-200 bg-slate-50 text-slate-900 focus:border-emerald-500"
                    }`}
                  />
                </div>

                <div className="flex gap-2 justify-end pt-3 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold"
                  >
                    {lang === "tr" ? "İptal" : "Cancel"}
                  </button>
                  <button
                    type="button"
                    onClick={handleUpdateItem}
                    className="rounded-xl bg-emerald-500 px-5 py-2 text-xs font-black text-slate-950 hover:bg-emerald-400 transition"
                  >
                    {lang === "tr" ? "Kaydet" : "Save"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 animate-fadeInUp">
            <div className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-xs font-black shadow-2xl ${
              toast.type === "success" ? "bg-emerald-500 text-slate-950" : "bg-rose-500 text-white"
            }`}>
              {toast.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <span>{toast.message}</span>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

