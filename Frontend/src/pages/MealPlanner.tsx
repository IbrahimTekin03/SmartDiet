import React, { useState, useEffect, useCallback } from "react";
import { useAppSettings } from "../context/AppSettingsContext";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { 
  Utensils, 
  Search, 
  Plus, 
  Trash2, 
  Calendar, 
  Clock, 
  Save, 
  ChevronLeft, 
  Sparkles, 
  Flame, 
  Activity, 
  User, 
  AlertCircle,
  CheckCircle2,
  Copy,
  Info
} from "lucide-react";

type Client = {
  user_id: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
};

type Food = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbohydrates: number;
  unit: string;
};

type MealItem = {
  id: string;
  food_id: string;
  name: string;
  amount: number;
  calories: number;
  protein: number;
  fat: number;
  carbohydrates: number;
};

type Meal = {
  id: string;
  name: string;
  time: string;
  items: MealItem[];
  note: string;
  day_of_week?: number;
};

import { API_BASE_URL as API_BASE } from "../lib/api";

const MealFoodSearch = React.memo(function MealFoodSearch({
  mealId,
  isDark,
  lang,
  onAddFood,
  onFocus,
}: {
  mealId: string;
  isDark: boolean;
  lang: string;
  onAddFood: (mealId: string, food: Food) => void;
  onFocus?: () => void;
}) {
  const [foodSearch, setFoodSearch] = useState("");
  const [foodResults, setFoodResults] = useState<Food[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (foodSearch.length < 2) {
      setFoodResults([]);
      setError(false);
      return;
    }

    setIsLoading(true);
    setError(false);
    const timer = setTimeout(() => {
      fetch(`${API_BASE}/api/foods?search=${foodSearch}`)
        .then((res) => {
          if (!res.ok) throw new Error();
          return res.json();
        })
        .then((data) => {
          setFoodResults(data.data || []);
          setIsLoading(false);
        })
        .catch(() => {
          setError(true);
          setIsLoading(false);
        });
    }, 300);

    return () => clearTimeout(timer);
  }, [foodSearch]);

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          placeholder={lang === "tr" ? "Besin ara (örn: Yulaf, Tavuk göğsü, Zeytinyağı)..." : "Search foods..."}
          value={foodSearch}
          onChange={(e) => setFoodSearch(e.target.value)}
          onFocus={() => onFocus?.()}
          className={`w-full rounded-2xl border pl-10 pr-10 py-3 text-xs font-semibold outline-none transition ${
            isDark
              ? "border-white/10 bg-black/40 text-white placeholder:text-slate-500 focus:border-emerald-500"
              : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500"
          }`}
        />
        {isLoading && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          </div>
        )}

        {foodResults.length > 0 && (
          <div
            className={`absolute left-0 right-0 top-full mt-2 max-h-64 overflow-y-auto rounded-2xl border p-2 shadow-2xl z-[100] ${
              isDark ? "border-white/10 bg-slate-900/95 backdrop-blur-md" : "border-slate-200 bg-white"
            }`}
          >
            {foodResults.map((food) => (
              <button
                key={food.id}
                type="button"
                onClick={() => {
                  onAddFood(mealId, food);
                  setFoodSearch("");
                  setFoodResults([]);
                }}
                className={`flex w-full items-center justify-between p-3 text-left rounded-xl transition ${
                  isDark ? "hover:bg-white/5" : "hover:bg-slate-50"
                }`}
              >
                <div>
                  <div className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{food.name}</div>
                  <div className="text-xs text-emerald-400 mt-0.5 font-mono font-bold">
                    {food.calories} kcal / 100g
                  </div>
                </div>
                <div className="flex items-center gap-2.5 text-xs font-mono font-bold">
                  <span className="text-emerald-400">P:{food.protein}g</span>
                  <span className="text-amber-400">Y:{food.fat}g</span>
                  <span className="text-cyan-400">K:{food.carbohydrates}g</span>
                  <Plus className="h-4 w-4 text-emerald-400 ml-1.5" />
                </div>

              </button>
            ))}
          </div>
        )}

        {foodSearch.length >= 2 && !isLoading && foodResults.length === 0 && !error && (
          <div
            className={`absolute left-0 right-0 top-full mt-2 rounded-2xl border p-4 text-center text-xs font-semibold z-[100] ${
              isDark ? "border-white/10 bg-slate-900 text-slate-400" : "border-slate-200 bg-white text-slate-500"
            }`}
          >
            {lang === "tr" ? "Eşleşen besin bulunamadı." : "No matching foods found."}
          </div>
        )}
      </div>
    </div>
  );
});

export default function MealPlanner() {
  const { isDark, lang } = useAppSettings();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clientIdFromUrl = searchParams.get("clientId");

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [planType, setPlanType] = useState("weekly");
  const [selectedDay, setSelectedDay] = useState(1);
  const [focusedMealId, setFocusedMealId] = useState<string | null>(null);
  const [meals, setMeals] = useState<Meal[]>(() => {
    const defaultMeals: Meal[] = [];
    for (let day = 1; day <= 7; day++) {
      defaultMeals.push(
        { id: Math.random().toString(36).substr(2, 9), name: "Kahvaltı", time: "08:30", items: [], note: "", day_of_week: day },
        { id: Math.random().toString(36).substr(2, 9), name: "Öğle Yemeği", time: "13:00", items: [], note: "", day_of_week: day },
        { id: Math.random().toString(36).substr(2, 9), name: "Ara Öğün", time: "16:30", items: [], note: "", day_of_week: day },
        { id: Math.random().toString(36).substr(2, 9), name: "Akşam Yemeği", time: "19:30", items: [], note: "", day_of_week: day }
      );
    }
    return defaultMeals;
  });

  const [loading, setLoading] = useState(true);
  const [planTitle, setPlanTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    fetch(`${API_BASE}/api/auth/dietitian/clients`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const raw = data?.data;
        const clientList = Array.isArray(raw) ? raw : (raw?.clients || []);
        setClients(clientList);

        if (clientIdFromUrl) {
          const found = clientList.find((c: any) => c.user_id === clientIdFromUrl);
          if (found) setSelectedClient(found);
        } else if (clientList.length > 0 && !selectedClient) {
          setSelectedClient(clientList[0]);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [clientIdFromUrl]);

  const handlePlanTypeChange = (type: string) => {
    const oldType = planType;
    setPlanType(type);

    if (type === "weekly" || type === "monthly") {
      const daysCount = type === "weekly" ? 7 : 30;
      const newMeals: Meal[] = [];

      if (oldType === "daily") {
        for (let day = 1; day <= daysCount; day++) {
          meals.forEach((m) => {
            newMeals.push({
              ...m,
              id: Math.random().toString(36).substr(2, 9),
              day_of_week: day,
              items: m.items.map((item) => ({ ...item, id: Math.random().toString(36).substr(2, 9) })),
            });
          });
        }
      } else {
        const currentMaxDay = oldType === "weekly" ? 7 : 30;
        for (let day = 1; day <= daysCount; day++) {
          if (day <= currentMaxDay) {
            const dayMeals = meals.filter((m) => m.day_of_week === day);
            newMeals.push(...dayMeals);
          } else {
            const day1Meals = meals.filter((m) => m.day_of_week === 1);
            day1Meals.forEach((m) => {
              newMeals.push({
                ...m,
                id: Math.random().toString(36).substr(2, 9),
                day_of_week: day,
                items: m.items.map((item) => ({ ...item, id: Math.random().toString(36).substr(2, 9) })),
              });
            });
          }
        }
      }
      setMeals(newMeals);
      setSelectedDay(1);
    } else {
      const currentDayMeals = meals.filter((m) => m.day_of_week === selectedDay);
      const baseMeals = currentDayMeals.length > 0 ? currentDayMeals : meals.filter((m) => m.day_of_week === 1);

      const dailyMeals = (baseMeals.length > 0 ? baseMeals : meals).map((m) => ({
        ...m,
        id: Math.random().toString(36).substr(2, 9),
        day_of_week: undefined,
        items: m.items.map((item) => ({ ...item, id: Math.random().toString(36).substr(2, 9) })),
      }));
      setMeals(dailyMeals);
    }
  };

  const addMeal = () => {
    const newMeal: Meal = {
      id: Math.random().toString(36).substr(2, 9),
      name: lang === "tr" ? `Öğün ${meals.length + 1}` : `Meal ${meals.length + 1}`,
      time: "12:00",
      items: [],
      note: "",
      day_of_week: ["weekly", "monthly"].includes(planType) ? selectedDay : undefined,
    };
    setMeals([...meals, newMeal]);
  };

  const updateMeal = (id: string, field: keyof Meal, value: any) => {
    setMeals(meals.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
  };

  const removeMeal = (id: string) => {
    setMeals(meals.filter((m) => m.id !== id));
  };

  const addFoodToMeal = useCallback((mealId: string, food: Food) => {
    const defaultAmount = 100;
    const newItem: MealItem = {
      id: Math.random().toString(36).substr(2, 9),
      food_id: food.id,
      name: food.name,
      amount: defaultAmount,
      calories: (food.calories * defaultAmount) / 100,
      protein: (food.protein * defaultAmount) / 100,
      fat: (food.fat * defaultAmount) / 100,
      carbohydrates: (food.carbohydrates * defaultAmount) / 100,
    };

    setMeals((prevMeals) =>
      prevMeals.map((m) => {
        if (m.id === mealId) {
          return { ...m, items: [...m.items, newItem] };
        }
        return m;
      }),
    );
  }, []);

  const updateItemAmount = (mealId: string, itemId: string, amount: number) => {
    setMeals(
      meals.map((m) => {
        if (m.id === mealId) {
          const updatedItems = m.items.map((item) => {
            if (item.id === itemId) {
              const ratio = amount / (item.amount || 1);
              return {
                ...item,
                amount: amount,
                calories: item.calories * ratio,
                protein: item.protein * ratio,
                fat: item.fat * ratio,
                carbohydrates: item.carbohydrates * ratio,
              };
            }
            return item;
          });
          return { ...m, items: updatedItems };
        }
        return m;
      }),
    );
  };

  const removeItemFromMeal = (mealId: string, itemId: string) => {
    setMeals(
      meals.map((m) => {
        if (m.id === mealId) {
          return { ...m, items: m.items.filter((i) => i.id !== itemId) };
        }
        return m;
      }),
    );
  };

  const calculateMealTotals = (meal: Meal) => {
    return meal.items.reduce(
      (acc, curr) => ({
        calories: acc.calories + curr.calories,
        protein: acc.protein + curr.protein,
        fat: acc.fat + curr.fat,
        carbs: acc.carbs + curr.carbohydrates,
      }),
      { calories: 0, protein: 0, fat: 0, carbs: 0 },
    );
  };

  const currentVisibleMeals = meals.filter((m) =>
    ["weekly", "monthly"].includes(planType) ? m.day_of_week === selectedDay : true,
  );

  const totalDayCalories = currentVisibleMeals.reduce((acc, m) => acc + calculateMealTotals(m).calories, 0);
  const totalDayProtein = currentVisibleMeals.reduce((acc, m) => acc + calculateMealTotals(m).protein, 0);
  const totalDayFat = currentVisibleMeals.reduce((acc, m) => acc + calculateMealTotals(m).fat, 0);
  const totalDayCarbs = currentVisibleMeals.reduce((acc, m) => acc + calculateMealTotals(m).carbs, 0);

  const handleSavePlan = async () => {
    if (!selectedClient) return;
    if (!planTitle.trim()) {
      alert(lang === "tr" ? "Lütfen bir plan başlığı girin." : "Please enter a plan title.");
      return;
    }

    setIsSaving(true);
    const token = localStorage.getItem("access_token");

    const payload = {
      client_id: selectedClient.user_id,
      title: planTitle,
      plan_type: planType,
      description: "Başlangıç Tarihi: " + startDate,
      meals: meals.map((m) => ({
        name: m.name,
        time: m.time,
        note: m.note,
        day_of_week: m.day_of_week,
        items: m.items.map((i) => ({
          food_id: i.food_id,
          amount: i.amount,
        })),
      })),
    };

    try {
      const res = await fetch(`${API_BASE}/api/diet-plans`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 4000);
      }
    } catch {
      alert("Error saving plan");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? "bg-[#040711] text-white" : "bg-[#f8fafc] text-slate-900"}`}>
      {/* Top Header */}
      <header className={`h-16 px-6 border-b flex items-center justify-between backdrop-blur-md sticky top-0 z-40 ${
        isDark ? "border-white/10 bg-slate-950/70" : "border-slate-200 bg-white/70"
      }`}>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-1.5 text-xs font-bold hover:bg-white/5 transition"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>{lang === "tr" ? "Geri" : "Back"}</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5">
              <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-[#040711] text-emerald-400">
                <Utensils className="h-4 w-4" />
              </div>
            </div>
            <span className="font-display font-black text-sm tracking-tight">SmartDiet Builder</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {savedSuccess && (
            <div className="flex items-center gap-1.5 text-xs font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl animate-fadeInUp">
              <CheckCircle2 className="h-4 w-4" />
              <span>{lang === "tr" ? "Plan Başarıyla Kaydedildi!" : "Plan Saved!"}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleSavePlan}
            disabled={isSaving || !selectedClient}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 px-6 py-2.5 text-xs font-black text-slate-950 shadow-lg shadow-emerald-500/25 hover:brightness-110 transition disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{isSaving ? (lang === "tr" ? "Kaydediliyor..." : "Saving...") : (lang === "tr" ? "Planı Kaydet" : "Save Plan")}</span>
          </button>
        </div>
      </header>

      {/* Main Builder Grid */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar: Client Picker */}
        <aside className={`w-72 border-r flex flex-col ${
          isDark ? "border-white/10 bg-slate-950/40" : "border-slate-200 bg-white"
        }`}>
          <div className="p-4 border-b border-white/5 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400">
            <User className="h-4 w-4 text-emerald-400" />
            <span>{lang === "tr" ? "Danışan Seçin" : "Select Client"}</span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {loading ? (
              <div className="p-4 text-xs text-slate-500">{lang === "tr" ? "Yükleniyor..." : "Loading..."}</div>
            ) : (
              clients.map((c) => {
                const isSelected = selectedClient?.user_id === c.user_id;
                return (
                  <button
                    key={c.user_id}
                    type="button"
                    onClick={() => setSelectedClient(c)}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left border transition ${
                      isSelected
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/30"
                        : isDark ? "border-transparent hover:bg-white/5" : "border-transparent hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 font-display font-black text-xs">
                      {c.first_name[0]}{c.last_name[0]}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-xs font-bold">{c.first_name} {c.last_name}</div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Center Workspace */}
        <main className="flex-1 overflow-y-auto p-8">
          {!selectedClient ? (
            <div className="flex h-full items-center justify-center text-center">
              <div className="max-w-md p-8 rounded-[32px] border border-dashed border-white/10">
                <User className="mx-auto h-10 w-10 text-slate-500 mb-3" />
                <h3 className="font-display text-base font-black">{lang === "tr" ? "Danışan Seçilmedi" : "No Client Selected"}</h3>
                <p className="mt-1 text-xs text-slate-400">
                  {lang === "tr" ? "Sol taraftaki listeden bir danışan seçerek yeni diyet programı oluşturmaya başlayın." : "Choose a client from the left pane to begin building a plan."}
                </p>
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-4xl space-y-6">
              {/* Header Plan Controls */}
              <div className={`p-6 rounded-[32px] border ${
                isDark ? "border-white/10 bg-slate-900/60 shadow-xl" : "border-slate-200 bg-white shadow-md"
              }`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
                      {lang === "tr" ? "KİŞİYE ÖZEL PROGRAM" : "NUTRITION BLUEPRINT"}
                    </span>
                    <h2 className="font-display text-xl font-black mt-1">
                      {selectedClient.first_name} {selectedClient.last_name}
                    </h2>
                  </div>

                  {/* Telemetry Pills for Selected Day */}
                  <div className="flex items-center gap-3">
                    <div className={`px-3.5 py-2 rounded-2xl border text-center ${
                      isDark ? "border-white/5 bg-black/40" : "border-slate-200 bg-slate-50"
                    }`}>
                      <div className="text-[10px] font-bold text-slate-400">Kalori</div>
                      <div className="font-display text-base font-black text-emerald-400">{Math.round(totalDayCalories)} kcal</div>
                    </div>
                    <div className={`px-3.5 py-2 rounded-2xl border text-center ${
                      isDark ? "border-white/5 bg-black/40" : "border-slate-200 bg-slate-50"
                    }`}>
                      <div className="text-[10px] font-bold text-slate-400">Protein</div>
                      <div className="font-display text-base font-black text-cyan-400">{totalDayProtein.toFixed(0)}g</div>
                    </div>
                    <div className={`px-3.5 py-2 rounded-2xl border text-center ${
                      isDark ? "border-white/5 bg-black/40" : "border-slate-200 bg-slate-50"
                    }`}>
                      <div className="text-[10px] font-bold text-slate-400">Karb / Yağ</div>
                      <div className="font-display text-xs font-black mt-1 text-slate-300">{totalDayCarbs.toFixed(0)}g / {totalDayFat.toFixed(0)}g</div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5 block">
                      {lang === "tr" ? "Plan Başlığı" : "Plan Title"}
                    </label>
                    <input
                      value={planTitle}
                      onChange={(e) => setPlanTitle(e.target.value)}
                      placeholder={lang === "tr" ? "Örn: 1. Ay Ketojenik Beslenme" : "Plan Title..."}
                      className={`w-full rounded-2xl border px-4 py-2.5 text-xs font-semibold outline-none ${
                        isDark ? "border-white/10 bg-black/40 text-white focus:border-emerald-500" : "border-slate-200 bg-slate-50 text-slate-900 focus:border-emerald-500"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5 block">
                      {lang === "tr" ? "Plan Süresi" : "Plan Type"}
                    </label>
                    <select
                      value={planType}
                      onChange={(e) => handlePlanTypeChange(e.target.value)}
                      className={`w-full rounded-2xl border px-4 py-2.5 text-xs font-semibold outline-none ${
                        isDark ? "border-white/10 bg-black/40 text-white focus:border-emerald-500" : "border-slate-200 bg-slate-50 text-slate-900 focus:border-emerald-500"
                      }`}
                    >
                      <option value="daily">{lang === "tr" ? "Günlük Plan" : "Daily"}</option>
                      <option value="weekly">{lang === "tr" ? "Haftalık Plan (7 Gün)" : "Weekly"}</option>
                      <option value="monthly">{lang === "tr" ? "Aylık Plan (30 Gün)" : "Monthly"}</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5 block">
                      {lang === "tr" ? "Başlangıç Tarihi" : "Start Date"}
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className={`w-full rounded-2xl border px-4 py-2.5 text-xs font-mono font-semibold outline-none ${
                        isDark ? "border-white/10 bg-black/40 text-white focus:border-emerald-500" : "border-slate-200 bg-slate-50 text-slate-900 focus:border-emerald-500"
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Day Selection Tabs for Weekly/Monthly */}
              {["weekly", "monthly"].includes(planType) && (
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {(planType === "weekly"
                    ? ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"]
                    : Array.from({ length: 30 }, (_, i) => `${i + 1}. Gün`)
                  ).map((day, idx) => {
                    const dayNumber = idx + 1;
                    const isSelected = selectedDay === dayNumber;
                    return (
                      <button
                        key={dayNumber}
                        type="button"
                        onClick={() => setSelectedDay(dayNumber)}
                        className={`whitespace-nowrap rounded-2xl px-5 py-2.5 text-xs font-black transition ${
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

              {/* Meals List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-sm font-black flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-400" />
                    <span>{lang === "tr" ? "Öğünler & Besinler" : "Meals & Items"}</span>
                  </h3>
                  <button
                    type="button"
                    onClick={addMeal}
                    className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>{lang === "tr" ? "Yeni Öğün Ekle" : "Add Meal"}</span>
                  </button>
                </div>

                {currentVisibleMeals.map((meal) => {
                  const totals = calculateMealTotals(meal);
                  return (
                    <div
                      key={meal.id}
                      className={`p-6 rounded-[32px] border space-y-4 transition ${
                        isDark ? "border-white/10 bg-slate-900/60" : "border-slate-200 bg-white shadow-sm"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
                        <div className="flex items-center gap-3 flex-1">
                          <input
                            type="time"
                            value={meal.time}
                            onChange={(e) => updateMeal(meal.id, "time", e.target.value)}
                            className={`rounded-xl border px-3 py-1.5 text-xs font-mono font-bold outline-none ${
                              isDark ? "border-white/10 bg-black/40 text-emerald-400" : "border-slate-200 bg-slate-50 text-emerald-700"
                            }`}
                          />
                          <input
                            value={meal.name}
                            onChange={(e) => updateMeal(meal.id, "name", e.target.value)}
                            placeholder="Öğün Adı..."
                            className={`flex-1 rounded-xl border px-3 py-1.5 text-xs font-black outline-none ${
                              isDark ? "border-white/10 bg-black/40 text-white" : "border-slate-200 bg-slate-50 text-slate-900"
                            }`}
                          />
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="text-xs font-mono font-bold text-emerald-400">
                            {Math.round(totals.calories)} kcal
                          </span>
                          <button
                            type="button"
                            onClick={() => removeMeal(meal.id)}
                            className="p-1 text-slate-400 hover:text-rose-400 transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Items Inside Meal */}
                      <div className="space-y-2.5">
                        {meal.items.map((item) => (
                          <div
                            key={item.id}
                            className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
                              isDark ? "border-white/10 bg-slate-900/80" : "border-slate-200 bg-slate-50"
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className={`text-sm sm:text-base font-bold truncate ${isDark ? "text-white" : "text-slate-900"}`}>
                                {item.name}
                              </div>
                              <div className="text-xs text-slate-400 font-mono font-medium mt-1 flex flex-wrap items-center gap-2">
                                <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg">
                                  {Math.round(item.calories)} kcal
                                </span>
                                <span>•</span>
                                <span className="text-emerald-400">P:{item.protein.toFixed(1)}g</span>
                                <span>•</span>
                                <span className="text-amber-400">Y:{item.fat.toFixed(1)}g</span>
                                <span>•</span>
                                <span className="text-cyan-400">K:{item.carbohydrates.toFixed(1)}g</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <input
                                type="number"
                                value={item.amount}
                                onChange={(e) => updateItemAmount(meal.id, item.id, Number(e.target.value))}
                                className={`w-20 rounded-xl border px-3 py-1.5 text-xs font-mono font-bold text-center outline-none ${
                                  isDark ? "border-white/15 bg-black/50 text-white focus:border-emerald-500" : "border-slate-300 bg-white text-slate-900 focus:border-emerald-500"
                                }`}
                              />
                              <span className="text-xs font-bold text-slate-400">g</span>
                              <button
                                type="button"
                                onClick={() => removeItemFromMeal(meal.id, item.id)}
                                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition ml-1"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>


                      {/* Food Autocomplete Search */}
                      <MealFoodSearch
                        mealId={meal.id}
                        isDark={isDark}
                        lang={lang}
                        onAddFood={addFoodToMeal}
                        onFocus={() => setFocusedMealId(meal.id)}
                      />

                      {/* Meal Note */}
                      <textarea
                        rows={2}
                        value={meal.note}
                        onChange={(e) => updateMeal(meal.id, "note", e.target.value)}
                        placeholder={lang === "tr" ? "Danışana özel not veya alternatifler..." : "Notes..."}
                        className={`w-full rounded-2xl border px-4 py-2.5 text-xs font-semibold outline-none resize-none ${
                          isDark ? "border-white/10 bg-black/40 text-white placeholder:text-slate-600" : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400"
                        }`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

