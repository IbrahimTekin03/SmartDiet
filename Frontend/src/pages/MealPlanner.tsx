import React, { useState, useEffect, useCallback } from "react";
import { useAppSettings } from "../context/AppSettingsContext";
import { Link, useSearchParams } from "react-router-dom";

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
  amount: number; // grams
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

const API_BASE = "http://localhost:3000";

const MealFoodSearch = React.memo(function MealFoodSearch({ mealId, isDark, lang, onAddFood, onFocus }: { mealId: string, isDark: boolean, lang: string, onAddFood: (mealId: string, food: Food) => void, onFocus?: () => void }) {
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
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <input 
            placeholder={lang === "tr" ? "Yiyecek ara..." : "Search foods..."}
            value={foodSearch}
            onChange={(e) => setFoodSearch(e.target.value)}
            onFocus={() => onFocus?.()}
            className={isDark ? "w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-xs text-white outline-none focus:border-emerald-500" : "w-full rounded-2xl bg-zinc-50 border border-[#325d51]/10 px-4 py-3 text-xs text-[#0e2d27] outline-none focus:border-emerald-500"}
          />
          {isLoading && (
            <div className="absolute right-3 top-3.5">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            </div>
          )}
          {foodResults.length > 0 && (
            <div className={isDark ? "absolute top-full left-0 right-0 mt-2 max-h-64 overflow-y-auto rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl z-[100] p-2" : "absolute top-full left-0 right-0 mt-2 max-h-64 overflow-y-auto rounded-2xl border border-[#325d51]/10 bg-white shadow-2xl z-[100] p-2"}>
              {foodResults.map((food) => (
                <button
                  key={food.id}
                  onClick={() => {
                    onAddFood(mealId, food);
                    setFoodSearch("");
                    setFoodResults([]);
                  }}
                  className={isDark ? "flex w-full flex-col p-3 text-left hover:bg-emerald-500/10 rounded-xl transition-all" : "flex w-full flex-col p-3 text-left hover:bg-emerald-500/5 rounded-xl transition-all"}
                >
                  <span className={isDark ? "text-xs font-bold text-white" : "text-xs font-bold text-[#0e2d27]"}>{food.name}</span>
                  <span className="text-[10px] text-zinc-500">{food.calories}kcal | P:{food.protein}g | K:{food.carbohydrates}g</span>
                </button>
              ))}
            </div>
          )}
          {foodSearch.length >= 2 && !isLoading && foodResults.length === 0 && !error && (
              <div className={isDark ? "absolute top-full left-0 right-0 mt-2 rounded-2xl border border-white/10 bg-zinc-900 p-4 text-center text-[10px] text-zinc-500 z-[100]" : "absolute top-full left-0 right-0 mt-2 rounded-2xl border border-[#325d51]/10 bg-white p-4 text-center text-[10px] text-zinc-500 z-[100]"}>
                 {lang === "tr" ? "Sonuç bulunamadı." : "No results found."}
              </div>
          )}
          {error && (
            <div className={isDark ? "absolute top-full left-0 right-0 mt-2 rounded-2xl border border-rose-500/50 bg-rose-500/10 p-4 text-center text-[10px] text-rose-500 z-[100]" : "absolute top-full left-0 right-0 mt-2 rounded-2xl border border-rose-500/50 bg-rose-50 p-4 text-center text-[10px] text-rose-500 z-[100]"}>
               {lang === "tr" ? "Arama sırasında bir hata oluştu." : "Error during search."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default function MealPlanner() {
  const { isDark, lang } = useAppSettings();
  const [searchParams] = useSearchParams();
  const clientIdFromUrl = searchParams.get("clientId");

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [planType, setPlanType] = useState("weekly");
  const [selectedDay, setSelectedDay] = useState(1);
  const [focusedMealId, setFocusedMealId] = useState<string | null>(null);
  const [meals, setMeals] = useState<Meal[]>([
    {
      id: "1",
      name: "Kahvaltı",
      time: "08:00",
      items: [],
      note: "",
      day_of_week: 1,
    },
    {
      id: "2",
      name: "Öğle Yemeği",
      time: "13:00",
      items: [],
      note: "",
      day_of_week: 1,
    },
    {
      id: "3",
      name: "Akşam Yemeği",
      time: "19:00",
      items: [],
      note: "",
      day_of_week: 1,
    }
  ]);
  const [loading, setLoading] = useState(true);
  
  // Plan Title state
  const [planTitle, setPlanTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // We will handle search individually per meal to prevent state collisions.

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    fetch(`${API_BASE}/api/auth/dietitian/clients`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const clientList = data.data || [];
        setClients(clientList);

        if (clientIdFromUrl) {
          const found = clientList.find((c: any) => c.user_id === clientIdFromUrl);
          if (found) setSelectedClient(found);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [clientIdFromUrl]);

  const handlePlanTypeChange = (type: string) => {
    setPlanType(type);
    if (type === 'weekly' || type === 'monthly') {
      const defaultMeals: Meal[] = [];
      const daysCount = type === 'weekly' ? 7 : 30;
      for (let day = 1; day <= daysCount; day++) {
        defaultMeals.push(
          { id: Math.random().toString(36).substr(2, 9), name: "Kahvaltı", time: "08:00", items: [], note: "", day_of_week: day },
          { id: Math.random().toString(36).substr(2, 9), name: "Öğle Yemeği", time: "13:00", items: [], note: "", day_of_week: day },
          { id: Math.random().toString(36).substr(2, 9), name: "Akşam Yemeği", time: "19:00", items: [], note: "", day_of_week: day }
        );
      }
      setMeals(defaultMeals);
      setSelectedDay(1);
    } else {
      setMeals([
        { id: Math.random().toString(36).substr(2, 9), name: "Kahvaltı", time: "08:00", items: [], note: "" },
        { id: Math.random().toString(36).substr(2, 9), name: "Öğle Yemeği", time: "13:00", items: [], note: "" },
        { id: Math.random().toString(36).substr(2, 9), name: "Akşam Yemeği", time: "19:00", items: [], note: "" }
      ]);
    }
  };

  const addMeal = () => {
    const newMeal: Meal = {
      id: Math.random().toString(36).substr(2, 9),
      name: lang === "tr" ? `Öğün ${meals.length + 1}` : `Meal ${meals.length + 1}`,
      time: "",
      items: [],
      note: "",
      day_of_week: planType === 'weekly' ? selectedDay : undefined,
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
      })
    );
  }, []);

  const updateItemAmount = (mealId: string, itemId: string, amount: number) => {
    setMeals(
      meals.map((m) => {
        if (m.id === mealId) {
          const updatedItems = m.items.map((item) => {
            if (item.id === itemId) {
              const ratio = amount / item.amount;
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
      })
    );
  };

  const removeItemFromMeal = (mealId: string, itemId: string) => {
    setMeals(
      meals.map((m) => {
        if (m.id === mealId) {
          return { ...m, items: m.items.filter((i) => i.id !== itemId) };
        }
        return m;
      })
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
      { calories: 0, protein: 0, fat: 0, carbs: 0 }
    );
  };

  const handleSavePlan = async () => {
    if (!selectedClient) return;
    if (!planTitle.trim()) {
      alert(lang === "tr" ? "Lütfen bir plan başlığı girin." : "Please enter a plan title.");
      return;
    }

    const emptyMealNames = meals.some(m => !m.name.trim());
    if (emptyMealNames) {
      alert(lang === "tr" ? "Lütfen tüm öğünlere bir ad verin." : "Please give a name to all meals.");
      return;
    }

    setIsSaving(true);
    const token = localStorage.getItem("access_token");

    const payload = {
      client_id: selectedClient.user_id,
      title: planTitle,
      plan_type: planType,
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

      const data = await res.json();
      if (res.ok) {
        alert(lang === "tr" ? "Diyet planı başarıyla kaydedildi!" : "Diet plan saved successfully!");
      } else {
        alert(data.message || (lang === "tr" ? "Bir hata oluştu." : "An error occurred."));
      }
    } catch (error) {
      alert(lang === "tr" ? "Sunucuya ulaşılamadı." : "Could not connect to server.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative min-h-screen w-screen overflow-hidden">
      {/* Background & Effects */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className={
            isDark
              ? "absolute inset-0 opacity-100 [background:radial-gradient(1100px_700px_at_18%_15%,rgba(16,185,129,0.12),transparent_60%),linear-gradient(180deg,#050608,#07090b_55%,#050608)]"
              : "absolute inset-0 opacity-[0.99] [background:radial-gradient(1180px_740px_at_12%_0%,rgba(22,128,101,0.15),transparent_58%),linear-gradient(180deg,#e8f0eb,#dee8e2_56%,#dbe5df)]"
          }
        />
        <div className={isDark ? "absolute -top-56 -left-56 h-[720px] w-[720px] rounded-full bg-emerald-500/10 blur-[120px]" : "absolute -top-56 -left-56 h-[720px] w-[720px] rounded-full bg-emerald-600/10 blur-[120px]"} />
      </div>

      <div className="relative z-10 flex h-screen flex-col">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-white/5 bg-white/5 px-6 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 font-bold text-white text-xs">SD</div>
              <span className={isDark ? "font-bold text-white" : "font-bold text-[#0e2d27]"}>SmartDiet</span>
            </Link>
            <div className="h-4 w-[1px] bg-white/10 mx-2" />
            <h1 className={isDark ? "text-sm font-medium text-zinc-300" : "text-sm font-medium text-[#36544c]"}>
              {lang === "tr" ? "Öğün Planlayıcı" : "Meal Planner"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleSavePlan}
              disabled={isSaving}
              className={[
                "rounded-full px-4 py-1.5 text-xs font-bold text-white transition-all",
                isSaving ? "opacity-50 cursor-not-allowed" : "",
                isDark ? "bg-emerald-500 hover:bg-emerald-400" : "bg-emerald-600 hover:bg-emerald-500"
              ].join(" ")}
            >
              {isSaving ? (lang === "tr" ? "Kaydediliyor..." : "Saving...") : (lang === "tr" ? "Kaydet" : "Save Plan")}
            </button>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar - Client List */}
          <aside className={isDark ? "w-72 border-r border-white/5 bg-black/20" : "w-72 border-r border-[#325d51]/10 bg-white/40"}>
            <div className="p-4 border-b border-white/5">
              <div className={isDark ? "text-xs font-bold uppercase tracking-wider text-zinc-500" : "text-xs font-bold uppercase tracking-wider text-[#4d6b62]"}>
                {lang === "tr" ? "Atanan Danışanlar" : "Assigned Clients"}
              </div>
            </div>
            <div className="overflow-y-auto h-[calc(100vh-130px)]">
              {loading ? (
                <div className="p-4">
                  <div className="h-10 w-full animate-pulse rounded-xl bg-white/5" />
                  <div className="mt-2 h-10 w-full animate-pulse rounded-xl bg-white/5" />
                </div>
              ) : (
                clients.map((c) => (
                  <button
                    key={c.user_id}
                    onClick={() => setSelectedClient(c)}
                    className={[
                      "flex w-full flex-col p-4 text-left transition hover:bg-white/5",
                      selectedClient?.user_id === c.user_id ? (isDark ? "bg-emerald-500/10 ring-1 ring-emerald-500/20" : "bg-emerald-500/5 ring-1 ring-emerald-500/20") : ""
                    ].join(" ")}
                  >
                    <span className={isDark ? "text-sm font-semibold text-white" : "text-sm font-semibold text-[#0e2d27]"}>
                      {c.first_name} {c.last_name}
                    </span>
                  </button>
                ))
              )}
            </div>
          </aside>

          {/* Content Area */}
          <main className="flex-1 overflow-y-auto p-8">
            {!selectedClient ? (
              <div className="flex h-full items-center justify-center text-center">
                <div className="max-w-md">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                    <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h2 className={isDark ? "mt-4 text-xl font-bold text-white" : "mt-4 text-xl font-bold text-[#0e2d27]"}>
                    {lang === "tr" ? "Bir Danışan Seçin" : "Select a Client"}
                  </h2>
                  <p className={isDark ? "mt-2 text-zinc-400" : "mt-2 text-[#4d6b62]"}>
                    {lang === "tr" ? "Plan hazırlamak istediğiniz danışanı soldaki listeden seçin." : "Select a client from the list on the left to prepare a meal plan."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mx-auto max-w-4xl">
                <div className="mb-8 flex items-end justify-between">
                  <div>
                    <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">
                      {lang === "tr" ? "ÖĞÜN LİSTESİ" : "MEAL LIST"}
                    </span>
                    <h2 className={isDark ? "mt-1 text-2xl font-bold text-white" : "mt-1 text-2xl font-bold text-[#0e2d27]"}>
                      {selectedClient.first_name} {selectedClient.last_name}
                    </h2>
                    <div className="mt-4 flex gap-3">
                      <input 
                        placeholder={lang === "tr" ? "Plan Başlığı (Örn: Haftalık Liste)" : "Plan Title (Ex: Weekly List)"}
                        value={planTitle}
                        onChange={(e) => setPlanTitle(e.target.value)}
                        className={isDark ? "w-full max-w-sm rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-sm text-white outline-none focus:border-emerald-500" : "w-full max-w-sm rounded-xl border border-[#325d51]/10 bg-zinc-50 px-4 py-2 text-sm text-[#0e2d27] outline-none focus:border-emerald-500"}
                      />
                      <select
                        value={planType}
                        onChange={(e) => handlePlanTypeChange(e.target.value)}
                        className={isDark ? "rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-sm text-white outline-none focus:border-emerald-500" : "rounded-xl border border-[#325d51]/10 bg-zinc-50 px-4 py-2 text-sm text-[#0e2d27] outline-none focus:border-emerald-500"}
                      >
                        <option value="daily">{lang === "tr" ? "Günlük" : "Daily"}</option>
                        <option value="weekly">{lang === "tr" ? "Haftalık" : "Weekly"}</option>
                        <option value="monthly">{lang === "tr" ? "Aylık" : "Monthly"}</option>
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={addMeal}
                    className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-xs font-bold text-emerald-400 hover:bg-white/10 transition"
                  >
                    <span>+</span>
                    {lang === "tr" ? "Öğün Ekle" : "Add Meal"}
                  </button>
                </div>

                {['weekly', 'monthly'].includes(planType) && (
                  <div className="mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {(planType === 'weekly' 
                      ? ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"]
                      : Array.from({ length: 30 }, (_, i) => lang === "tr" ? `${i + 1}. Gün` : `Day ${i + 1}`)
                    ).map((day, idx) => {
                      const dayNumber = idx + 1;
                      const isSelected = selectedDay === dayNumber;
                      return (
                        <button
                          key={dayNumber}
                          onClick={() => setSelectedDay(dayNumber)}
                          className={["whitespace-nowrap rounded-xl px-5 py-2.5 text-sm font-bold transition-all", isSelected ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30" : isDark ? "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white" : "bg-[#2f6154]/5 text-[#4d6b62] hover:bg-[#2f6154]/10 hover:text-[#0e2d27]"].join(" ")}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="space-y-6 pb-48">
                  {meals.filter(m => ['weekly', 'monthly'].includes(planType) ? m.day_of_week === selectedDay : true).map((meal) => {
                    const totals = calculateMealTotals(meal);
                    return (
                      <div
                        key={meal.id}
                        className={[
                          isDark ? "relative rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur transition-all" : "relative rounded-[32px] border border-[#325d51]/20 bg-white p-8 shadow-sm transition-all",
                          focusedMealId === meal.id ? "z-[60] border-emerald-500/50 shadow-2xl shadow-emerald-500/10 scale-[1.01]" : "z-10"
                        ].join(" ")}
                      >
                        <button
                          onClick={() => removeMeal(meal.id)}
                          className="absolute -right-2 -top-2 h-8 w-8 items-center justify-center rounded-full bg-rose-500 text-white text-xs font-bold shadow-lg flex"
                        >
                          ✕
                        </button>

                        <div className="grid gap-8 sm:grid-cols-[200px_1fr]">
                          <div className="space-y-4">
                            <div>
                              <label className={isDark ? "mt-2 block text-[10px] font-bold uppercase tracking-wider text-zinc-500" : "mt-2 block text-[10px] font-bold uppercase tracking-wider text-[#4d6b62]"}>
                                {lang === "tr" ? "Öğün Zamanı" : "Meal Time"}
                              </label>
                              <input
                                type="time"
                                value={meal.time}
                                onChange={(e) => updateMeal(meal.id, "time", e.target.value)}
                                className={isDark ? "w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500/50" : "w-full rounded-2xl border border-[#325d51]/10 bg-zinc-50 px-4 py-3 text-sm text-[#0e2d27] outline-none focus:border-emerald-500/50"}
                              />
                            </div>
                            <div>
                              <label className={isDark ? "mt-2 block text-[10px] font-bold uppercase tracking-wider text-zinc-500" : "mt-2 block text-[10px] font-bold uppercase tracking-wider text-[#4d6b62]"}>
                                {lang === "tr" ? "Öğün Adı" : "Meal Name"}
                              </label>
                              <input
                                placeholder={lang === "tr" ? "Örn: Akşam Yemeği" : "Ex: Dinner"}
                                value={meal.name}
                                onChange={(e) => updateMeal(meal.id, "name", e.target.value)}
                                className={isDark ? "w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500/50" : "w-full rounded-2xl border border-[#325d51]/10 bg-zinc-50 px-4 py-3 text-sm text-[#0e2d27] outline-none focus:border-emerald-500/50"}
                              />
                            </div>
                            
                            <div className={isDark ? "rounded-2xl bg-black/40 p-4 border border-white/5" : "rounded-2xl bg-emerald-50/50 p-4 border border-emerald-500/10"}>
                               <div className="text-[10px] font-bold text-emerald-500 uppercase mb-3">{lang === "tr" ? "Öğün Özeti" : "Meal Summary"}</div>
                               <div className="space-y-2">
                                  <div className="flex justify-between items-center text-xs">
                                     <span className={isDark ? "active text-zinc-400" : "text-[#4d6b62]"}>Kalori:</span>
                                     <span className={isDark ? "font-bold text-white" : "font-bold text-[#0e2d27]"}>{Math.round(totals.calories)} kcal</span>
                                  </div>
                                  <div className="flex justify-between items-center text-[11px]">
                                     <span className={isDark ? "text-zinc-500" : "text-[#4d6b62]"}>P:</span>
                                     <span className={isDark ? "text-zinc-300" : "text-[#0e2d27]"}>{totals.protein.toFixed(1)}g</span>
                                  </div>
                                  <div className="flex justify-between items-center text-[11px]">
                                     <span className={isDark ? "text-zinc-500" : "text-[#4d6b62]"}>Y:</span>
                                     <span className={isDark ? "text-zinc-300" : "text-[#0e2d27]"}>{totals.fat.toFixed(1)}g</span>
                                  </div>
                                  <div className="flex justify-between items-center text-[11px]">
                                     <span className={isDark ? "text-zinc-500" : "text-[#4d6b62]"}>K:</span>
                                     <span className={isDark ? "text-zinc-300" : "text-[#0e2d27]"}>{totals.carbs.toFixed(1)}g</span>
                                  </div>
                               </div>
                            </div>
                          </div>

                          <div className="space-y-6">
                             {/* Food Items List */}
                             <div className="space-y-3">
                                {meal.items.map((item) => (
                                   <div key={item.id} className={isDark ? "flex items-center gap-4 rounded-2xl bg-white/5 p-3 border border-white/5 group/item" : "flex items-center gap-4 rounded-2xl bg-zinc-50 p-3 border border-[#325d51]/5 group/item"}>
                                      <div className="flex-1">
                                         <div className={isDark ? "text-xs font-bold text-white" : "text-xs font-bold text-[#0e2d27]"}>{item.name}</div>
                                         <div className="text-[10px] text-emerald-500">{Math.round(item.calories)} kcal | {item.protein.toFixed(1)}P | {item.carbohydrates.toFixed(1)}K</div>
                                      </div>
                                      <div className="flex items-center gap-3">
                                         <div className="flex items-center gap-2">
                                            <input 
                                               type="number"
                                               value={item.amount}
                                               onChange={(e) => updateItemAmount(meal.id, item.id, Number(e.target.value))}
                                               className={isDark ? "w-16 rounded-lg bg-black/40 border border-white/10 px-2 py-1 text-[11px] text-white text-center outline-none" : "w-16 rounded-lg bg-white border border-[#325d51]/10 px-2 py-1 text-[11px] text-[#0e2d27] text-center outline-none"}
                                            />
                                            <span className="text-[10px] font-bold text-zinc-500">g</span>
                                         </div>
                                         <button 
                                            onClick={() => removeItemFromMeal(meal.id, item.id)}
                                            className="opacity-0 group-hover/item:opacity-100 transition-opacity p-1 text-rose-500 hover:bg-rose-500/10 rounded-lg"
                                         >
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                         </button>
                                      </div>
                                   </div>
                                ))}
                             </div>

                             {/* Search and Add Component */}
                             <MealFoodSearch 
                                mealId={meal.id} 
                                isDark={isDark} 
                                lang={lang} 
                                onAddFood={addFoodToMeal} 
                                onFocus={() => setFocusedMealId(meal.id)}
                             />

                             <div>
                                <label className={isDark ? "mt-2 block text-[10px] font-bold uppercase tracking-wider text-zinc-500" : "mt-2 block text-[10px] font-bold uppercase tracking-wider text-[#4d6b62]"}>
                                  {lang === "tr" ? "Öğün İçeriği ve Notlar" : "Content and Notes"}
                                </label>
                                <textarea
                                  rows={3}
                                  placeholder={lang === "tr" ? "Genel bilgilendirme..." : "General info..."}
                                  value={meal.note}
                                  onChange={(e) => updateMeal(meal.id, "note", e.target.value)}
                                  className={isDark ? "w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500/50 resize-none" : "w-full rounded-2xl border border-[#325d51]/10 bg-zinc-50 px-4 py-3 text-sm text-[#0e2d27] outline-none focus:border-emerald-500/50 resize-none"}
                                />
                             </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {meals.length === 0 && (
                     <div className="py-20 text-center text-zinc-500 bg-white/2 rounded-[32px] border border-dashed border-white/10">
                        <div className="mx-auto h-12 w-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
                           <svg className="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                           </svg>
                        </div>
                        {lang === "tr" ? "Henüz öğün eklenmedi." : "No meals added yet."}
                     </div>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
