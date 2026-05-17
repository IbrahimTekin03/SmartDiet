import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardPanel, DashboardSectionHeader, DashboardShell } from "../components/DashboardShell";
import { useAppSettings } from "../context/AppSettingsContext";
import * as XLSX from "xlsx";

const API_BASE = "http://localhost:3000";

export default function DietPlanView() {
  const { isDark, lang } = useAppSettings();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  // trackingData is now indexed by date: { [date]: { [meal_item_id]: is_consumed } }
  const [trackingData, setTrackingData] = useState<Record<string, Record<string, boolean>>>({});
  const [selectedDay, setSelectedDay] = useState(() => {
    const day = new Date().getDay();
    return day === 0 ? 7 : day;
  });
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchPlan();
  }, [id]);

  useEffect(() => {
    if (plan && plan.plan_type === 'weekly') {
      const createdDate = new Date(plan.createdAt);
      const dayOfWeek = createdDate.getDay(); // 0 = Sunday, 6 = Saturday
      
      let baseMonday = new Date(createdDate);
      const startMatch = plan.description?.match(/Başlangıç Tarihi:\s*(\d{4}-\d{2}-\d{2})/);
      if (startMatch) {
        const [sy, sm, sd] = startMatch[1].split('-').map(Number);
        baseMonday = new Date(Date.UTC(sy, sm - 1, sd));
      } else {
        if (dayOfWeek === 0) { // Sunday -> next Monday
          baseMonday.setDate(createdDate.getDate() + 1);
        } else if (dayOfWeek === 6) { // Saturday -> next Monday
          baseMonday.setDate(createdDate.getDate() + 2);
        } else { // Monday to Friday -> current week's Monday
          baseMonday.setDate(createdDate.getDate() - (dayOfWeek - 1));
        }
      }
      
      const today = new Date();
      const planStart = new Date(baseMonday);
      today.setHours(0, 0, 0, 0);
      planStart.setHours(0, 0, 0, 0);
      
      if (today < planStart) {
        setSelectedDate(planStart.toISOString().split('T')[0]);
        setSelectedDay(1); // Pazartesi
      } else {
        setSelectedDate(today.toISOString().split('T')[0]);
        const day = today.getDay();
        setSelectedDay(day === 0 ? 7 : day);
      }
    }
  }, [plan]);

  // Sync Day Tab -> Date
  const handleDayTabClick = (dayNumber: number) => {
    // Explicitly save current day before switching tabs, but no alert
    handleSaveTracking(false);
    
    setSelectedDay(dayNumber);
    
    // We want each "Day" in the plan to have a unique date in the tracking system
    const [year, month, day] = selectedDate.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    
    if (plan?.plan_type === 'weekly') {
      const currentDay = date.getUTCDay() === 0 ? 7 : date.getUTCDay();
      const diff = dayNumber - currentDay;
      date.setUTCDate(date.getUTCDate() + diff);
    } else if (plan?.plan_type === 'monthly') {
      // For monthly plans, we assume the plan is relative to "today" 
      // or we just let the day number act as an offset if we don't have a start_date.
      // A better approach is to just use the day number to offset from the CURRENT date.
      const today = new Date();
      const [ty, tm, td] = today.toISOString().split('T')[0].split('-').map(Number);
      const baseDate = new Date(Date.UTC(ty, tm, td)); // This is actually tm-1 in Date constructor, but tm is already 1-indexed from string. Wait.
      
      // Let's be safer:
      const safeToday = new Date();
      const offsetDate = new Date(Date.UTC(safeToday.getFullYear(), safeToday.getMonth(), safeToday.getDate()));
      // If we want Day 1 to be "today", and they click Day 5:
      // We don't know which "Day" today is in their progress, so we'll just 
      // keep it simple: Day 1 of the plan = a fixed base date or just 
      // allow the user to pick the date and we just show the meals for that day.
      
      // RE-THINK: If it's a 30-day plan, and I'm on Day 5, I'm likely looking at "Today".
      // If I click "Day 6" tab, I'm likely looking at "Tomorrow".
      const dayDiff = dayNumber - selectedDay;
      date.setUTCDate(date.getUTCDate() + dayDiff);
    }
    
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  // Sync Date -> Day Tab
  const handleDateChange = (dateStr: string) => {
    // Explicitly save current date before switching, but no alert
    handleSaveTracking(false);
    
    setSelectedDate(dateStr);
    if (plan?.plan_type === 'weekly') {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(Date.UTC(year, month - 1, day));
      let dayOfWeek = date.getUTCDay();
      if (dayOfWeek === 0) dayOfWeek = 7;
      setSelectedDay(dayOfWeek);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    if (plan) {
      // Ensure we fetch whenever plan, date OR selectedDay changes 
      // (important for monthly where date might not have changed yet or is shared)
      fetchTracking(controller.signal);
    }
    return () => controller.abort();
  }, [plan, selectedDate, selectedDay]);

  const fetchPlan = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API_BASE}/api/diet-plans/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
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

  const fetchTracking = async (signal?: AbortSignal) => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API_BASE}/api/diet-plans/track?planId=${id}&date=${selectedDate}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal
      });
      const data = await res.json();
      const dayTracking: Record<string, boolean> = {};
      if (data.data && Array.isArray(data.data)) {
        data.data.forEach((t: any) => {
          dayTracking[t.meal_item_id] = t.is_consumed;
        });
      }
      setTrackingData(prev => ({ ...prev, [selectedDate]: dayTracking }));
    } catch (err) {
      if ((err as any).name === 'AbortError') return;
      console.error(err);
      // We don't clear the whole state on error, just ensure the current date has something
      setTrackingData(prev => ({ ...prev, [selectedDate]: prev[selectedDate] || {} }));
    }
  };

  const [isSaving, setIsSaving] = useState(false);

  const toggleItem = async (mealItemId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    const activeDate = selectedDate;
    
    // Optimistic Update for the specific date
    setTrackingData(prev => ({
      ...prev,
      [activeDate]: {
        ...(prev[activeDate] || {}),
        [mealItemId]: newStatus
      }
    }));
    
    setSaveStatus("saving");
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API_BASE}/api/diet-plans/track`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          plan_id: id,
          meal_item_id: mealItemId,
          date: activeDate,
          is_consumed: newStatus
        })
      });
      
      if (!res.ok) throw new Error();
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (err) {
      console.error(err);
      setSaveStatus("error");
      // Revert on error for the specific date
      setTrackingData(prev => ({
        ...prev,
        [activeDate]: {
          ...(prev[activeDate] || {}),
          [mealItemId]: currentStatus
        }
      }));
    }
  };

  const handleSaveTracking = async (showNotification = true) => {
    if (isSaving) return;
    setIsSaving(true);
    const activeDate = selectedDate;
    const activeDayData = trackingData[activeDate] || {};
    
    try {
      const token = localStorage.getItem("access_token");
      
      const items = Object.entries(activeDayData).map(([meal_item_id, is_consumed]) => ({
        meal_item_id,
        is_consumed
      }));

      await fetch(`${API_BASE}/api/diet-plans/track/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          plan_id: id,
          date: activeDate,
          items
        })
      });
      
      if (showNotification) {
        setToast({ 
          message: lang === "tr" ? "Değişiklikler başarıyla kaydedildi!" : "Changes saved successfully!", 
          type: 'success' 
        });
        setTimeout(() => setToast(null), 3000);
      }
    } catch (err) {
      console.error(err);
      if (showNotification) {
        setToast({ 
          message: lang === "tr" ? "Kaydedilirken bir hata oluştu." : "Error saving changes.", 
          type: 'error' 
        });
        setTimeout(() => setToast(null), 3000);
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        </div>
      </DashboardShell>
    );
  }

  if (!plan) {
    return (
      <DashboardShell>
        <DashboardPanel isDark={isDark}>
          <div className="text-center py-10">Plan bulunamadı.</div>
        </DashboardPanel>
      </DashboardShell>
    );
  }

  const getRatio = (amount: number, unit?: string) => {
    const num = Number(amount) || 0;
    const lowerUnit = (unit || 'g').toLowerCase().trim();
    
    if (lowerUnit === '100g' || lowerUnit === '100 g') {
      return num > 5 ? num / 100 : num;
    }
    
    const isPer100 = ['g', 'ml', 'gram', '100ml', '100 ml'].includes(lowerUnit);
    return isPer100 ? num / 100 : num;
  };

  const getDisplayAmountAndUnit = (amount: number, unit?: string) => {
    const num = Number(amount) || 0;
    const numStr = num.toString();
    const lowerUnit = (unit || 'g').toLowerCase().trim();

    if (lowerUnit === '100g' || lowerUnit === '100 g') {
      return num > 5 ? `${numStr} g` : `${numStr} adet 100g`;
    }

    return `${numStr} ${unit || 'g'}`;
  };

  const exportToExcel = () => {
    if (!plan || !plan.meals) return;

    // Determine the max number of meals in a day across the plan
    const mealsByDay: Record<number, any[]> = {};
    plan.meals.forEach((m: any) => {
      const day = m.day_of_week;
      if (!mealsByDay[day]) mealsByDay[day] = [];
      mealsByDay[day].push(m);
    });

    let maxMeals = 0;
    Object.values(mealsByDay).forEach(meals => {
      if (meals.length > maxMeals) maxMeals = meals.length;
    });

    const rows: any[] = [];
    
    // Always export the entire plan based on plan type
    let daysToExport: number[] = [];
    if (plan.plan_type === 'weekly') {
      daysToExport = [1, 2, 3, 4, 5, 6, 7];
    } else if (plan.plan_type === 'monthly') {
      daysToExport = Array.from({length: 30}, (_, i) => i + 1);
    } else {
      // Daily plans
      // For daily plans, day_of_week might not be set correctly (e.g., might be null or 1)
      // So we will just treat it as a single day export
      daysToExport = [1];
      if (Object.keys(mealsByDay).length > 0) {
        // Map all meals to day 1 for daily plans if they don't have day_of_week
        mealsByDay[1] = plan.meals;
      }
    }

    daysToExport.forEach(dayNumber => {
      const dayMeals = mealsByDay[dayNumber] || [];
      // Sort by time just in case
      dayMeals.sort((a, b) => (a.time || '').localeCompare(b.time || ''));

      let totalCal = 0;
      let totalPro = 0;
      let totalCarb = 0;
      let totalFat = 0;

      const [year, month, day] = selectedDate.split('-').map(Number);
      const baseDate = new Date(Date.UTC(year, month - 1, day));
      
      // Calculate date offset. For weekly/monthly, it offsets from Day 1.
      // If plan is daily, offset is 0.
      const offset = plan.plan_type === 'daily' ? 0 : (dayNumber - 1);
      baseDate.setUTCDate(baseDate.getUTCDate() + offset);
      
      const formattedDate = `${baseDate.getUTCDate().toString().padStart(2, '0')}/${(baseDate.getUTCMonth() + 1).toString().padStart(2, '0')}/${baseDate.getUTCFullYear()}`;

      // Get Turkish day name
      const dayName = new Intl.DateTimeFormat('tr-TR', { weekday: 'long' }).format(baseDate);

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
          const cal = (Number(item.food?.calories) || 0) * ratio;
          
          totalCal += cal;
          totalPro += (Number(item.food?.protein) || 0) * ratio;
          totalCarb += (Number(item.food?.carbohydrates) || 0) * ratio;
          totalFat += (Number(item.food?.fat) || 0) * ratio;
        });
      });

      // Fill empty meals if this day has fewer meals than maxMeals
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
    XLSX.writeFile(wb, `${plan.title || 'Beslenme_Plani'}.xlsx`);
  };

  const planTypeLabel = plan.plan_type === 'daily' ? (lang === 'tr' ? 'Günlük' : 'Daily') : plan.plan_type === 'monthly' ? (lang === 'tr' ? 'Aylık' : 'Monthly') : (lang === 'tr' ? 'Haftalık' : 'Weekly');

  const selectedDateObj = new Date(selectedDate);
  const currentDayOfWeek = selectedDateObj.getDay() === 0 ? 7 : selectedDateObj.getDay();

  const displayedMeals = ['weekly', 'monthly'].includes(plan.plan_type)
    ? plan.meals?.filter((m: any) => m.day_of_week === selectedDay) 
    : plan.meals;

  const consumedMacros = {
    calories: 0,
    protein: 0,
    fat: 0,
    carbs: 0
  };

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
    <DashboardShell isDark={isDark} title={plan.title} subtitle={planTypeLabel + " Plan"}>
      <div className={["min-h-screen transition-colors", isDark ? "bg-transparent text-white" : "bg-transparent text-[#0e2d27]"].join(" ")}>
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate(-1)}
                className={["flex items-center gap-2 text-sm font-bold transition-colors", isDark ? "text-zinc-400 hover:text-white" : "text-[#4d6b62] hover:text-[#0e2d27]"].join(" ")}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                {lang === "tr" ? "Geri Dön" : "Go Back"}
              </button>
              
              <button
                onClick={exportToExcel}
                className={["flex items-center gap-2 text-sm font-bold transition-colors rounded-lg px-3 py-1.5", isDark ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"].join(" ")}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                {lang === "tr" ? "Excel'e Aktar" : "Export to Excel"}
              </button>
            </div>

            <div className="flex flex-col items-start md:items-end">
              <div className="mb-1 flex items-center gap-2">
                {saveStatus !== "idle" && (
                  <span className={["text-[10px] font-bold uppercase tracking-widest animate-pulse", 
                    saveStatus === "saving" ? "text-amber-500" : 
                    saveStatus === "saved" ? "text-emerald-500" : "text-rose-500"
                  ].join(" ")}>
                    {saveStatus === "saving" ? (lang === "tr" ? "Kaydediliyor..." : "Saving...") : 
                     saveStatus === "saved" ? (lang === "tr" ? "Kaydedildi" : "Saved") : 
                     (lang === "tr" ? "Hata!" : "Error!")}
                  </span>
                )}
                <label className={["text-xs font-bold uppercase tracking-wider", isDark ? "text-zinc-500" : "text-[#4d6b62]"].join(" ")}>
                  {lang === "tr" ? "Takip Tarihi" : "Tracking Date"}
                </label>
              </div>
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className={["rounded-xl border px-4 py-2 font-bold outline-none transition-all", isDark ? "border-white/10 bg-black/40 text-white focus:border-emerald-500" : "border-[#325d51]/10 bg-white text-[#0e2d27] shadow-sm focus:border-emerald-500"].join(" ")}
              />
            </div>
          </div>

          {/* Day Selection Tabs for Weekly/Monthly */}
          {['weekly', 'monthly'].includes(plan.plan_type) && (
            <div className="mb-8 flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
              {(plan.plan_type === 'weekly' 
                ? ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"]
                : Array.from({ length: 30 }, (_, i) => lang === "tr" ? `${i + 1}. Gün` : `Day ${i + 1}`)
              ).map((day, idx) => {
                const dayNumber = idx + 1;
                const isSelected = selectedDay === dayNumber;
                return (
                  <button
                    key={dayNumber}
                    onClick={() => handleDayTabClick(dayNumber)}
                    className={["whitespace-nowrap rounded-xl px-5 py-2.5 text-sm font-bold transition-all shrink-0", isSelected ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30" : isDark ? "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white" : "bg-white text-[#4d6b62] border border-[#2f6154]/10 hover:bg-emerald-50 hover:text-[#0e2d27]"].join(" ")}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          )}

          <div className="space-y-6">
            {/* Macros Summary Panel */}
            <DashboardPanel isDark={isDark}>
          <div className="flex items-center gap-4 mb-4">
            <div className={["flex h-10 w-10 items-center justify-center rounded-2xl", isDark ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-100 text-emerald-600"].join(" ")}>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <div>
              <h2 className={["text-lg font-bold", isDark ? "text-white" : "text-[#0e2d27]"].join(" ")}>
                {lang === "tr" ? "Günlük Özet" : "Daily Summary"}
              </h2>
              <p className={["text-sm font-medium", isDark ? "text-zinc-400" : "text-[#4d6b62]"].join(" ")}>
                {lang === "tr" ? "Bugün aldığınız toplam besin değerleri" : "Total nutritional values consumed today"}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className={["rounded-2xl p-4 text-center border", isDark ? "bg-black/20 border-white/5" : "bg-zinc-50 border-[#325d51]/10"].join(" ")}>
              <div className={["text-xs font-bold mb-1 uppercase tracking-wider", isDark ? "text-zinc-500" : "text-zinc-500"].join(" ")}>{lang === "tr" ? "Kalori" : "Calories"}</div>
              <div className={["text-xl font-black", isDark ? "text-emerald-400" : "text-emerald-600"].join(" ")}>{Math.round(consumedMacros.calories)}</div>
              <div className={["text-[10px] font-bold", isDark ? "text-zinc-600" : "text-zinc-400"].join(" ")}>kcal</div>
            </div>
            <div className={["rounded-2xl p-4 text-center border", isDark ? "bg-black/20 border-white/5" : "bg-zinc-50 border-[#325d51]/10"].join(" ")}>
              <div className={["text-xs font-bold mb-1 uppercase tracking-wider", isDark ? "text-zinc-500" : "text-zinc-500"].join(" ")}>{lang === "tr" ? "Protein" : "Protein"}</div>
              <div className={["text-xl font-black", isDark ? "text-blue-400" : "text-blue-600"].join(" ")}>{Math.round(consumedMacros.protein)}</div>
              <div className={["text-[10px] font-bold", isDark ? "text-zinc-600" : "text-zinc-400"].join(" ")}>g</div>
            </div>
            <div className={["rounded-2xl p-4 text-center border", isDark ? "bg-black/20 border-white/5" : "bg-zinc-50 border-[#325d51]/10"].join(" ")}>
              <div className={["text-xs font-bold mb-1 uppercase tracking-wider", isDark ? "text-zinc-500" : "text-zinc-500"].join(" ")}>{lang === "tr" ? "Karb" : "Carbs"}</div>
              <div className={["text-xl font-black", isDark ? "text-amber-400" : "text-amber-600"].join(" ")}>{Math.round(consumedMacros.carbs)}</div>
              <div className={["text-[10px] font-bold", isDark ? "text-zinc-600" : "text-zinc-400"].join(" ")}>g</div>
            </div>
            <div className={["rounded-2xl p-4 text-center border", isDark ? "bg-black/20 border-white/5" : "bg-zinc-50 border-[#325d51]/10"].join(" ")}>
              <div className={["text-xs font-bold mb-1 uppercase tracking-wider", isDark ? "text-zinc-500" : "text-zinc-500"].join(" ")}>{lang === "tr" ? "Yağ" : "Fat"}</div>
              <div className={["text-xl font-black", isDark ? "text-rose-400" : "text-rose-600"].join(" ")}>{Math.round(consumedMacros.fat)}</div>
              <div className={["text-[10px] font-bold", isDark ? "text-zinc-600" : "text-zinc-400"].join(" ")}>g</div>
            </div>
          </div>
        </DashboardPanel>

        {displayedMeals?.length === 0 && (
          <DashboardPanel isDark={isDark}>
            <div className="text-center py-10 font-medium opacity-60">
              {lang === "tr" ? "Bu güne ait öğün bulunmuyor." : "No meals found for this day."}
            </div>
          </DashboardPanel>
        )}

        {displayedMeals?.map((meal: any, index: number) => {
          const totalCals = meal.items?.reduce((acc: number, cur: any) => {
            const ratio = getRatio(Number(cur.amount), cur.food?.unit);
            const itemCals = (Number(cur.food?.calories) || 0) * ratio;
            return acc + itemCals;
          }, 0) || 0;
          
          return (
            <DashboardPanel key={meal.id} isDark={isDark}>
              <div className="mb-6 flex items-center justify-between border-b pb-4 border-dashed border-emerald-500/20">
                <div className="flex items-center gap-4">
                  <div className={["flex h-10 w-10 items-center justify-center rounded-2xl font-black text-lg", isDark ? "bg-black/40 text-emerald-400" : "bg-emerald-50 text-emerald-600"].join(" ")}>
                    {index + 1}
                  </div>
                  <div>
                    <h3 className={["text-xl font-extrabold tracking-tight", isDark ? "text-white" : "text-[#0e2d27]"].join(" ")}>{meal.name}</h3>
                    <div className={["mt-0.5 text-sm font-bold", isDark ? "text-emerald-400" : "text-emerald-600"].join(" ")}>{meal.time}</div>
                  </div>
                </div>
                <div className={["inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold", isDark ? "bg-emerald-500/15 text-emerald-200" : "bg-emerald-100/80 text-emerald-800"].join(" ")}>
                  {Math.round(totalCals)} kcal
                </div>
              </div>

              {meal.note && (
                <div className={["mb-6 rounded-2xl p-4 text-sm italic", isDark ? "bg-black/30 text-zinc-300" : "bg-[#f7faf8] text-[#36544c]"].join(" ")}>
                  "{meal.note}"
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {meal.items?.map((item: any) => {
                  const isConsumed = !!currentTracking[item.id];
                  
                  return (
                    <button 
                      key={item.id}
                      onClick={() => toggleItem(item.id, isConsumed)}
                      className={["group relative flex items-center gap-4 overflow-hidden rounded-[24px] border p-4 text-left transition-all", isDark ? "border-white/5 bg-white/5 hover:bg-white/10" : "border-[#2f6154]/10 bg-white shadow-sm hover:shadow-md", isConsumed ? (isDark ? "border-emerald-500/50 bg-emerald-500/10" : "border-emerald-500 bg-emerald-50") : ""].join(" ")}
                    >
                      <div className={["flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors", isConsumed ? "border-emerald-500 bg-emerald-500 text-white" : (isDark ? "border-zinc-600 text-transparent" : "border-[#4d6b62]/30 text-transparent")].join(" ")}>
                        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      </div>
                      
                      <div className="flex-1">
                        <h4 className={["text-sm font-bold transition-all", isConsumed ? (isDark ? "text-emerald-400 line-through opacity-70" : "text-emerald-700 line-through opacity-70") : (isDark ? "text-white" : "text-[#0e2d27]")].join(" ")}>
                          {item.food?.name}
                        </h4>
                        <div className={["text-xs font-semibold mt-0.5", isDark ? "text-zinc-500" : "text-[#4d6b62]"].join(" ")}>
                          {getDisplayAmountAndUnit(item.amount, item.food?.unit)} • {Math.round((Number(item.food?.calories) || 0) * getRatio(Number(item.amount), item.food?.unit))} kcal
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </DashboardPanel>
          );
        })}

        {/* Batch Save Button (Optional secondary backup) */}
        {displayedMeals && displayedMeals.length > 0 && (
          <div className="flex justify-end pt-4 pb-12">
            <button
              onClick={handleSaveTracking}
              disabled={isSaving}
              className={["flex items-center gap-2 rounded-xl px-8 py-4 text-sm font-bold text-white transition-all opacity-40 hover:opacity-100", isDark ? "bg-zinc-800" : "bg-zinc-200 text-zinc-600", isSaving ? "opacity-50 cursor-not-allowed" : ""].join(" ")}
            >
              {isSaving ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              )}
              {lang === "tr" ? "Tümünü Şimdi Kaydet" : "Save All Now"}
            </button>
          </div>
        )}
        {/* Toast Notification */}
        {toast && (
          <div className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 transform animate-bounce">
            <div className={[
              "flex items-center gap-3 rounded-2xl px-6 py-4 font-bold text-white shadow-2xl backdrop-blur-md",
              toast.type === 'success' ? "bg-emerald-500/90" : "bg-rose-500/90"
            ].join(" ")}>
              {toast.type === 'success' ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              )}
              {toast.message}
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
</DashboardShell>
  );
}
