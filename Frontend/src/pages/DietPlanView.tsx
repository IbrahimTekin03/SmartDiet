import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardPanel, DashboardSectionHeader, DashboardShell } from "../components/DashboardShell";
import { useAppSettings } from "../context/AppSettingsContext";

const API_BASE = "http://localhost:3000";

export default function DietPlanView() {
  const { isDark, lang } = useAppSettings();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [trackingData, setTrackingData] = useState<Record<string, boolean>>({});
  const [selectedDay, setSelectedDay] = useState(() => {
    const day = new Date().getDay();
    return day === 0 ? 7 : day;
  });

  useEffect(() => {
    fetchPlan();
  }, [id]);

  // Sync Day Tab -> Date
  const handleDayTabClick = (dayNumber: number) => {
    setSelectedDay(dayNumber);
    if (plan?.plan_type === 'weekly') {
      const current = new Date(selectedDate);
      const currentDay = current.getDay() === 0 ? 7 : current.getDay();
      const diff = dayNumber - currentDay;
      current.setDate(current.getDate() + diff);
      setSelectedDate(current.toISOString().split('T')[0]);
    }
    // For monthly, we can't easily sync to a date without a start_date, 
    // so we just keep selectedDate as is or maybe the user picks it.
  };

  // Sync Date -> Day Tab
  const handleDateChange = (dateStr: string) => {
    setSelectedDate(dateStr);
    if (plan?.plan_type === 'weekly') {
      const date = new Date(dateStr);
      let day = date.getDay();
      if (day === 0) day = 7;
      setSelectedDay(day);
    }
  };

  useEffect(() => {
    if (plan) {
      fetchTracking();
    }
  }, [plan, selectedDate]);

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

  const fetchTracking = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API_BASE}/api/diet-plans/track?planId=${id}&date=${selectedDate}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      const trackingMap: Record<string, boolean> = {};
      if (data.data && Array.isArray(data.data)) {
        data.data.forEach((t: any) => {
          trackingMap[t.meal_item_id] = t.is_consumed;
        });
      }
      setTrackingData(trackingMap);
    } catch (err) {
      console.error(err);
      setTrackingData({});
    }
  };

  const [isSaving, setIsSaving] = useState(false);

  const toggleItem = (mealItemId: string, currentStatus: boolean) => {
    setTrackingData(prev => ({ ...prev, [mealItemId]: !currentStatus }));
  };

  const handleSaveTracking = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem("access_token");
      
      const items = Object.entries(trackingData).map(([meal_item_id, is_consumed]) => ({
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
          date: selectedDate,
          items
        })
      });
      alert(lang === "tr" ? "Değişiklikler kaydedildi!" : "Changes saved!");
    } catch (err) {
      console.error(err);
      alert(lang === "tr" ? "Kaydedilirken bir hata oluştu." : "Error saving changes.");
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

  displayedMeals?.forEach((meal: any) => {
    meal.items?.forEach((item: any) => {
      if (trackingData[item.id]) {
        const ratio = (Number(item.amount) || 0) / 100;
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
            <div>
              <button 
                onClick={() => navigate('/client')}
                className={["flex items-center gap-2 text-sm font-bold transition-colors", isDark ? "text-zinc-400 hover:text-white" : "text-[#4d6b62] hover:text-[#0e2d27]"].join(" ")}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                {lang === "tr" ? "Geri Dön" : "Go Back"}
              </button>
            </div>

            <div className="flex flex-col items-start md:items-end">
              <label className={["mb-1 text-xs font-bold uppercase tracking-wider", isDark ? "text-zinc-500" : "text-[#4d6b62]"].join(" ")}>
                {lang === "tr" ? "Takip Tarihi" : "Tracking Date"}
              </label>
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
          const totalCals = meal.items?.reduce((acc: number, cur: any) => acc + (cur.calories || 0), 0) || 0;
          
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
                  const isConsumed = !!trackingData[item.id];
                  
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
                          {item.amount} {item.food?.unit} • {Math.round(item.calories)} kcal
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </DashboardPanel>
          );
        })}

        {/* Save Button */}
        {displayedMeals && displayedMeals.length > 0 && (
          <div className="flex justify-end pt-4 pb-12">
            <button
              onClick={handleSaveTracking}
              disabled={isSaving}
              className={["flex items-center gap-2 rounded-xl px-8 py-4 text-sm font-bold text-white transition-all", isDark ? "bg-emerald-500 hover:bg-emerald-400" : "bg-emerald-600 hover:bg-emerald-700", isSaving ? "opacity-50 cursor-not-allowed" : ""].join(" ")}
            >
              {isSaving ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              )}
              {lang === "tr" ? "Kaydet" : "Save Changes"}
            </button>
          </div>
        )}
      </div>
    </div>
  </div>
</DashboardShell>
  );
}
