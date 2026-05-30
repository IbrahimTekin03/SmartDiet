import { useState, useRef, useEffect } from "react";
import { useAuthSession, parseStoredUser } from "../lib/authSession";
import { useAppSettings } from "../context/AppSettingsContext";

type ScannedMeal = {
  food_name: string;
  amount: number;
  unit: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  description: string;
};

type Message = { 
  role: "user" | "assistant"; 
  content: string; 
  displayContent?: string;
  scannedMeal?: ScannedMeal;
};

export default function AIAssistantWidget() {
  const { accessToken, userJson } = useAuthSession();
  const user = parseStoredUser<any>(userJson);
  const { isDark, lang } = useAppSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  
  // Interactive Selection Flow States
  const [clientPlans, setClientPlans] = useState<any[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [selectedMealId, setSelectedMealId] = useState<string>("");
  const [selectedMealItemId, setSelectedMealItemId] = useState<string>("");
  const [addMode, setAddMode] = useState<"add" | "replace" | "create_and_add">("add");
  const [expandedFormIndex, setExpandedFormIndex] = useState<number | null>(null);
  const [loadingPlansData, setLoadingPlansData] = useState<boolean>(false);

  // Editing Scanned Meal States
  const [editingMealIndex, setEditingMealIndex] = useState<number | null>(null);
  const [editMealData, setEditMealData] = useState<ScannedMeal | null>(null);

  const startEditingMeal = (idx: number, meal: ScannedMeal) => {
    setEditingMealIndex(idx);
    setEditMealData({ ...meal });
  };

  const saveEditedMeal = (idx: number) => {
    if (!editMealData) return;
    setMessages(prev => prev.map((msg, i) => {
      if (i === idx) {
        return {
          ...msg,
          scannedMeal: editMealData
        };
      }
      return msg;
    }));
    setEditingMealIndex(null);
    setEditMealData(null);
  };

  // New Meal Creation States for Empty Days
  const [newMealName, setNewMealName] = useState<string>("");
  const [newMealTime, setNewMealTime] = useState<string>("12:00");

  // Live Camera Streaming States
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // User Role Resolution
  const roles = user?.roles || [];
  const isClient = roles.includes("client") || roles.includes("Danışan") || roles.some((r: any) => r.name === "client" || r.name === "Danışan");

  // Dynamically resolve plan info
  const selectedPlan = clientPlans.find(p => p.id === selectedPlanId);
  const planType = selectedPlan?.plan_type || "weekly";
  const dayCount = planType === "monthly" ? 30 : 7;
  const mealsForDay = selectedPlan?.meals?.filter((m: any) => m.day_of_week === Number(selectedDay)) || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0 && user) {
      let greeting = lang === "tr" ? "Merhaba! Size nasıl yardımcı olabilirim?" : "Hello! How can I help you today?";
      const isAdmin = roles.includes("admin");
      const isDietitian = roles.includes("Diyetisyen") || roles.includes("dietitian");

      if (lang === "tr") {
        if (isAdmin) {
          greeting = "Merhaba! Sistem yönetimi, kullanıcı kontrolleri veya veritabanı işlemlerinde size yardımcı olabilirim.";
        } else if (isDietitian) {
          greeting = "Merhaba! Danışanlarınıza hızlıca kişiselleştirilmiş öğün listeleri hazırlamanıza yardımcı olabilirim.";
        } else {
          greeting = "Merhaba! Mevcut diyet planınızla ilgili değişiklikler yapmak, elinizdeki malzemelere uygun makro uyumlu tarifler üretmek veya yediğiniz yemeğin fotoğrafını çekip öğün analizi yapmak için buradayım.";
        }
      } else {
        if (isAdmin) {
          greeting = "Hello! I can assist you with system management or database operations.";
        } else if (isDietitian) {
          greeting = "Hello! I can help you quickly prepare personalized meal plans for your clients.";
        } else {
          greeting = "Hello! I am here to help you modify your diet plan, generate macro-matching healthy recipes with your available ingredients, or scan/analyze photos of your meals.";
        }
      }
      setMessages([{ role: "assistant", content: greeting }]);
    }
  }, [user, lang, messages.length]);

  // Make sure we stop camera stream if assistant panel is closed
  useEffect(() => {
    if (!isOpen && isCameraOpen) {
      stopCamera();
    }
  }, [isOpen]);

  // If not logged in, don't show the widget
  if (!accessToken) return null;

  // Live Camera Functions
  const startCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error("Kameraya erişim hatası:", err);
      alert(lang === "tr" ? "Kameraya erişilemedi. Lütfen kamera izinlerinizi kontrol edin." : "Could not access camera. Please check your camera permissions.");
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(async (blob) => {
        if (blob) {
          const file = new File([blob], "captured_meal.jpg", { type: "image/jpeg" });
          
          // Stop streaming to turn off laptop indicator light
          stopCamera();
          
          // Mimic file upload flow
          setUploading(true);
          setLoading(true);

          setMessages(prev => [
            ...prev,
            { 
              role: "user", 
              content: lang === "tr" ? "📷 Yemek fotoğrafı yüklendi, analiz ediliyor..." : "📷 Meal photo uploaded, analyzing..." 
            }
          ]);

          try {
            const formData = new FormData();
            formData.append("image", file);

            const res = await fetch("http://localhost:3000/api/ai-assistant/scan-meal", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
              body: formData,
            });

            const data = await res.json();
            if (data.success && data.data) {
              setMessages(prev => [
                ...prev,
                {
                  role: "assistant",
                  content: lang === "tr" 
                    ? `Yüklediğiniz fotoğrafı analiz ettim! İşte bulgularım:` 
                    : `I have analyzed the uploaded photo! Here are my findings:`,
                  scannedMeal: data.data
                }
              ]);
            } else {
              setMessages(prev => [
                ...prev,
                { 
                  role: "assistant", 
                  content: lang === "tr" ? "Fotoğraf analiz edilemedi. Lütfen geçerli bir yemek fotoğrafı deneyin." : "Photo could not be analyzed. Please try again with a valid meal image." 
                }
              ]);
            }
          } catch (error) {
            setMessages(prev => [
              ...prev,
              { 
                role: "assistant", 
                content: lang === "tr" ? "Yemek analizi servisine bağlanılamadı." : "Failed to connect to meal analysis service." 
              }
            ]);
          } finally {
            setUploading(false);
            setLoading(false);
          }
        }
      }, "image/jpeg");
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:3000/api/ai-assistant/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ prompt: userMessage.content, sessionId }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setSessionId(data.data.sessionId);
        setMessages(prev => [...prev, { role: "assistant", content: data.data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: "Bir hata oluştu. Lütfen tekrar deneyin." }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: "assistant", content: "Sunucuya bağlanılamadı." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setLoading(true);

    setMessages(prev => [
      ...prev,
      { 
        role: "user", 
        content: lang === "tr" ? "📷 Yemek fotoğrafı yüklendi, analiz ediliyor..." : "📷 Meal photo uploaded, analyzing..." 
      }
    ]);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("http://localhost:3000/api/ai-assistant/scan-meal", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.data) {
        setMessages(prev => [
          ...prev,
          {
            role: "assistant",
            content: lang === "tr" 
              ? `Yüklediğiniz fotoğrafı analiz ettim! İşte bulgularım:` 
              : `I have analyzed the uploaded photo! Here are my findings:`,
            scannedMeal: data.data
          }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          { 
            role: "assistant", 
            content: lang === "tr" ? "Fotoğraf analiz edilemedi. Lütfen geçerli bir yemek fotoğrafı deneyin." : "Photo could not be analyzed. Please try again with a valid meal image." 
          }
        ]);
      }
    } catch (error) {
      setMessages(prev => [
        ...prev,
        { 
          role: "assistant", 
          content: lang === "tr" ? "Yemek analizi servisine bağlanılamadı." : "Failed to connect to meal analysis service." 
        }
      ]);
    } finally {
      setUploading(false);
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleOpenAddForm = async (index: number) => {
    setExpandedFormIndex(index);
    setLoadingPlansData(true);
    try {
      const res = await fetch("http://localhost:3000/api/diet-plans/client", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setClientPlans(data.data);
        if (data.data.length > 0) {
          const firstPlan = data.data[0];
          setSelectedPlanId(firstPlan.id);
          setSelectedDay(1);
          setSelectedMealId("");
          setSelectedMealItemId("");
          setAddMode("add");
          setNewMealName("");
          setNewMealTime("12:00");
        }
      }
    } catch (error) {
      console.error("Diyet planları yüklenemedi", error);
    } finally {
      setLoadingPlansData(false);
    }
  };

  const handleExecutePlanUpdate = async (meal: ScannedMeal) => {
    if (loading || !selectedPlanId) return;

    const plan = clientPlans.find(p => p.id === selectedPlanId);
    const dayNames = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
    
    // Resolve clean day name for monthly vs weekly
    const dayName = planType === "monthly" 
      ? `${selectedDay}. Gün` 
      : (dayNames[selectedDay - 1] || "Pazartesi");

    let prompt = "";
    
    if (addMode === "create_and_add") {
      if (!newMealName.trim()) {
        alert(lang === "tr" ? "Lütfen bir öğün adı girin." : "Please enter a meal name.");
        return;
      }
      prompt = lang === "tr"
        ? `Az önce analiz ettiğin ${meal.food_name} (${meal.amount} ${meal.unit}, ${meal.calories} kcal, ${meal.protein}g protein, ${meal.carbohydrates}g karbonhidrat, ${meal.fat}g yağ) yemeğini, "${plan.title}" planımın "${dayName}" günü için yeni bir "${newMealName}" öğünü (saat "${newMealTime || '12:00'}") oluşturup ekler misin? Lütfen database_query aracını kullanarak önce bu yeni öğünü "diet_plan_meals" tablosuna ekle, ardından "diet_plan_meal_items" tablosuna yiyeceği ekle. Sonucu bana bildir.`
        : `Could you please create a new meal named "${newMealName}" (time "${newMealTime || '12:00'}") on "${dayName}" of my plan "${plan.title}", and add the newly scanned ${meal.food_name} (${meal.amount} ${meal.unit}, ${meal.calories} kcal, ${meal.protein}g protein, ${meal.carbohydrates}g carbs, ${meal.fat}g fat) into it? Please insert these into the database and confirm.`;
    } else if (addMode === "add") {
      const mealObj = plan?.meals?.find((m: any) => m.id === selectedMealId);
      prompt = lang === "tr"
        ? `Az önce analiz ettiğin ${meal.food_name} (${meal.amount} ${meal.unit}, ${meal.calories} kcal, ${meal.protein}g protein, ${meal.carbohydrates}g karbonhidrat, ${meal.fat}g yağ) yemeğini, "${plan.title}" planımın "${dayName}" günündeki "${mealObj.name}" (meal_id: "${selectedMealId}") öğününe yeni bir yiyecek olarak ekler misin? Lütfen database_query aracını kullanarak veritabanına ekle ve güncel planı bana bildir.`
        : `Could you please add the ${meal.food_name} (${meal.amount} ${meal.unit}, ${meal.calories} kcal, ${meal.protein}g protein, ${meal.carbohydrates}g carbs, ${meal.fat}g fat) which I just scanned to the "${mealObj.name}" meal (meal_id: "${selectedMealId}") on "${dayName}" of my plan "${plan.title}" as a new food item? Please insert it into the database and confirm.`;
    } else {
      const mealObj = plan?.meals?.find((m: any) => m.id === selectedMealId);
      const itemObj = mealObj?.items?.find((i: any) => i.id === selectedMealItemId);
      prompt = lang === "tr"
        ? `Az önce analiz ettiğin ${meal.food_name} (${meal.amount} ${meal.unit}, ${meal.calories} kcal, ${meal.protein}g protein, ${meal.carbohydrates}g karbonhidrat, ${meal.fat}g yağ) yemeğini, "${plan.title}" planımın "${dayName}" günündeki "${mealObj.name}" öğününde yer alan "${itemObj?.food?.name || 'mevcut yiyecek'}" (meal_item_id: "${selectedMealItemId}") yerine ekleyerek değiştirir misin? Lütfen update_meal_item veya database_query aracı ile güncellemeyi yap ve sonucu bana bildir.`
        : `Could you please replace "${itemObj?.food?.name || 'existing food'}" (meal_item_id: "${selectedMealItemId}") in the "${mealObj.name}" meal on "${dayName}" of my plan "${plan.title}" with the newly scanned ${meal.food_name} (${meal.amount} ${meal.unit}, ${meal.calories} kcal, ${meal.protein}g protein, ${meal.carbohydrates}g carbs, ${meal.fat}g fat)? Please execute this update and confirm.`;
    }

    let displayPrompt = "";
    if (addMode === "create_and_add") {
      displayPrompt = lang === "tr"
        ? `Bu resimdeki tabağı "${plan.title}" planımın "${dayName}" günü saat "${newMealTime || '12:00'}" için yeni bir "${newMealName}" öğünü oluşturup ekler misin?`
        : `Could you please create a new meal named "${newMealName}" (time "${newMealTime || '12:00'}") on "${dayName}" of my plan "${plan.title}" and add the food in this photo into it?`;
    } else if (addMode === "add") {
      const mealObj = plan?.meals?.find((m: any) => m.id === selectedMealId);
      displayPrompt = lang === "tr"
        ? `Bu resimdeki tabağı "${plan.title}" planımın "${dayName}" günündeki "${mealObj?.name || ''}" öğününe ekler misin?`
        : `Could you please add the food in this photo to the "${mealObj?.name || ''}" meal on "${dayName}" of my plan "${plan.title}"?`;
    } else {
      const mealObj = plan?.meals?.find((m: any) => m.id === selectedMealId);
      const itemObj = mealObj?.items?.find((i: any) => i.id === selectedMealItemId);
      displayPrompt = lang === "tr"
        ? `Bu resimdeki tabağı "${plan.title}" planımın "${dayName}" günündeki "${mealObj?.name || ''}" öğününde yer alan "${itemObj?.food?.name || 'mevcut yiyecek'}" yerine ekleyerek değiştirir misin?`
        : `Could you please replace "${itemObj?.food?.name || 'existing food'}" in the "${mealObj?.name || ''}" meal on "${dayName}" of my plan "${plan.title}" with the food in this photo?`;
    }

    setExpandedFormIndex(null);
    const userMessage: Message = { role: "user", content: prompt, displayContent: displayPrompt };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const res = await fetch("http://localhost:3000/api/ai-assistant/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ prompt: userMessage.content, sessionId }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setSessionId(data.data.sessionId);
        setMessages(prev => [...prev, { role: "assistant", content: data.data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: "Diyet planı güncellenirken bir hata oluştu." }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: "assistant", content: "Sunucu bağlantısı başarısız." }]);
    } finally {
      setLoading(false);
    }
  };

  // Generate dynamic days array
  const daysArray = Array.from({ length: dayCount }, (_, i) => i + 1);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title={lang === "tr" ? "Yapay Zeka Asistanı" : "AI Assistant"}
        className="fixed bottom-[84px] right-5 z-[90] inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-300/30 bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-[0_16px_50px_rgba(99,102,241,0.45)] transition hover:brightness-110 hover:scale-105"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
          <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
        </svg>
      </button>

      {isOpen && (
        <div className={`fixed bottom-[144px] right-5 z-[90] flex w-[380px] flex-col overflow-hidden rounded-3xl border shadow-[0_32px_120px_rgba(0,0,0,0.45)] ${isDark ? "border-transparent bg-[#0d1114] text-white" : "border-[#2f6154]/20 bg-[#f7fbf9] text-[#123a32]"}`} style={{ height: '540px' }}>
          
          {/* Live Camera View Overlay Console */}
          {isCameraOpen && (
            <div className="absolute inset-0 z-[120] flex flex-col bg-black/95 text-white p-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h4 className="text-xs font-black tracking-wider flex items-center gap-1.5 text-indigo-400">
                   <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 animate-ping"></span>
                   {lang === "tr" ? "LIVE KAMERA GÖRÜNTÜSÜ" : "LIVE CAMERA STREAM"}
                </h4>
                <button 
                  type="button" 
                  onClick={stopCamera} 
                  className="rounded-xl bg-white/10 px-2.5 py-1 text-[10px] font-black hover:bg-white/20 transition"
                >
                  {lang === "tr" ? "İptal" : "Cancel"}
                </button>
              </div>
              
              <div className="flex-1 flex items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black my-4 relative">
                <video 
                  ref={videoRef} 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="flex items-center justify-center gap-4 pb-2">
                {/* File Upload Selector Option */}
                <button
                  type="button"
                  onClick={() => { fileInputRef.current?.click(); stopCamera(); }}
                  className="rounded-xl border border-white/20 bg-white/5 p-3 hover:bg-white/10 transition"
                  title={lang === "tr" ? "Dosyadan Yükle" : "Upload File"}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-5 w-5 text-zinc-300">
                     <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                     <polyline points="17 8 12 3 7 8" />
                     <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </button>
                
                {/* Take Photo Button */}
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="h-14 w-14 rounded-full bg-white flex items-center justify-center hover:scale-105 active:scale-95 transition shadow-lg relative border-4 border-double border-indigo-500"
                  title={lang === "tr" ? "Fotoğraf Çek" : "Take Photo"}
                >
                  <span className="h-10 w-10 rounded-full bg-indigo-500 hover:bg-indigo-600 block transition"></span>
                </button>
                
                <div className="w-11"></div>
              </div>
            </div>
          )}

          <div className={`flex items-center justify-between p-4 border-b ${isDark ? "border-emerald-400/10" : "border-black/5"}`}>
            <h3 className="text-sm font-extrabold flex items-center gap-2">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-purple-400">
                  <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
               </svg>
               SmartDiet AI
            </h3>
            <button onClick={() => setIsOpen(false)} className={`rounded-xl border px-2 py-1 text-xs font-semibold ${isDark ? "border-transparent bg-white/5 text-zinc-200" : "border-[#2f6154]/20 bg-white text-[#2b574b]"}`}>Kapat</button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-relaxed ${msg.role === "user" ? "bg-indigo-500 text-white rounded-br-none" : isDark ? "bg-white/10 text-zinc-200 rounded-bl-none" : "bg-white border border-[#2f6154]/10 text-[#123a32] rounded-bl-none"}`}>
                  <p className="whitespace-pre-wrap">{msg.displayContent || msg.content}</p>
                  
                  {msg.scannedMeal && (
                    <div className={`mt-3 overflow-hidden rounded-2xl border ${isDark ? "border-indigo-500/30 bg-indigo-500/10 text-zinc-100 shadow-[0_8px_32px_rgba(99,102,241,0.15)]" : "border-indigo-100 bg-indigo-50/50 text-indigo-950"} p-3`}>
                      {editingMealIndex === idx && editMealData ? (
                        <div className="space-y-3.5 text-left text-xs">
                          <div className="text-[10px] font-black text-indigo-400 tracking-widest uppercase mb-1">
                            ÖĞÜN VERİLERİNİ DÜZENLE
                          </div>
                          
                          <div>
                            <label className="block text-[9px] font-bold opacity-60 mb-0.5">Yemek Adı</label>
                            <input
                              type="text"
                              value={editMealData.food_name}
                              onChange={(e) => setEditMealData({ ...editMealData, food_name: e.target.value })}
                              className="w-full rounded-xl border border-indigo-500/30 bg-black/60 px-2.5 py-1.5 text-xs text-white outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500/20 transition"
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[9px] font-bold opacity-60 mb-0.5">Miktar</label>
                              <input
                                type="number"
                                value={editMealData.amount}
                                onChange={(e) => setEditMealData({ ...editMealData, amount: Number(e.target.value) })}
                                className="w-full rounded-xl border border-indigo-500/30 bg-black/60 px-2.5 py-1.5 text-xs text-white outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500/20 transition"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold opacity-60 mb-0.5">Birim</label>
                              <input
                                type="text"
                                value={editMealData.unit}
                                onChange={(e) => setEditMealData({ ...editMealData, unit: e.target.value })}
                                className="w-full rounded-xl border border-indigo-500/30 bg-black/60 px-2.5 py-1.5 text-xs text-white outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500/20 transition"
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-4 gap-1.5">
                            <div>
                              <label className="block text-[8px] font-bold opacity-60 mb-0.5">Kalori (kcal)</label>
                              <input
                                type="number"
                                value={editMealData.calories}
                                onChange={(e) => setEditMealData({ ...editMealData, calories: Number(e.target.value) })}
                                className="w-full text-center rounded-xl border border-indigo-500/30 bg-black/60 px-1 py-1.5 text-xs text-white outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500/20 transition"
                              />
                            </div>
                            <div>
                              <label className="block text-[8px] font-bold opacity-60 mb-0.5">Prot (g)</label>
                              <input
                                type="number"
                                value={editMealData.protein}
                                onChange={(e) => setEditMealData({ ...editMealData, protein: Number(e.target.value) })}
                                className="w-full text-center rounded-xl border border-indigo-500/30 bg-black/60 px-1 py-1.5 text-xs text-white outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500/20 transition"
                              />
                            </div>
                            <div>
                              <label className="block text-[8px] font-bold opacity-60 mb-0.5">Karb (g)</label>
                              <input
                                type="number"
                                value={editMealData.carbohydrates}
                                onChange={(e) => setEditMealData({ ...editMealData, carbohydrates: Number(e.target.value) })}
                                className="w-full text-center rounded-xl border border-indigo-500/30 bg-black/60 px-1 py-1.5 text-xs text-white outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500/20 transition"
                              />
                            </div>
                            <div>
                              <label className="block text-[8px] font-bold opacity-60 mb-0.5">Yağ (g)</label>
                              <input
                                type="number"
                                value={editMealData.fat}
                                onChange={(e) => setEditMealData({ ...editMealData, fat: Number(e.target.value) })}
                                className="w-full text-center rounded-xl border border-indigo-500/30 bg-black/60 px-1 py-1.5 text-xs text-white outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500/20 transition"
                              />
                            </div>
                          </div>
                          
                          <div className="flex gap-2 pt-2">
                            <button
                              type="button"
                              onClick={() => saveEditedMeal(idx)}
                              className="flex-1 rounded-xl bg-indigo-500 py-2 text-xs font-black text-white hover:bg-indigo-600 shadow-md transition"
                            >
                              Kaydet
                            </button>
                            <button
                              type="button"
                              onClick={() => { setEditingMealIndex(null); setEditMealData(null); }}
                              className="rounded-xl border border-indigo-500/30 bg-black/40 px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-black/60 transition"
                            >
                              İptal
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between">
                            <div className="font-extrabold text-sm flex items-center gap-1.5">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4 text-indigo-500 animate-pulse">
                                 <circle cx="12" cy="12" r="10" />
                                 <path d="m9 12 2 2 4-4" />
                              </svg>
                              {msg.scannedMeal.food_name}
                            </div>
                            <span className="rounded-full bg-indigo-500 px-2.5 py-0.5 text-[10px] font-black text-white">
                              {msg.scannedMeal.calories} kcal
                            </span>
                          </div>
                          
                          <div className="mt-1 text-[11px] font-semibold opacity-75">
                            Porsiyon: {msg.scannedMeal.amount} {msg.scannedMeal.unit}
                          </div>
                          
                          {msg.scannedMeal.description && (
                            <p className="mt-2 text-xs italic opacity-85 leading-tight">
                              {msg.scannedMeal.description}
                            </p>
                          )}
                          
                          <div className="mt-3 grid grid-cols-3 gap-1.5 text-center text-[10px] font-bold">
                            <div className={`rounded-lg py-1 ${isDark ? "bg-white/5" : "bg-white shadow-[0_2px_8px_rgba(0,0,0,0.02)]"}`}>
                              <div className="opacity-70">Protein</div>
                              <div className="text-xs font-black text-emerald-400">{msg.scannedMeal.protein}g</div>
                            </div>
                            <div className={`rounded-lg py-1 ${isDark ? "bg-white/5" : "bg-white shadow-[0_2px_8px_rgba(0,0,0,0.02)]"}`}>
                              <div className="opacity-70">Karb</div>
                              <div className="text-xs font-black text-amber-400">{msg.scannedMeal.carbohydrates}g</div>
                            </div>
                            <div className={`rounded-lg py-1 ${isDark ? "bg-white/5" : "bg-white shadow-[0_2px_8px_rgba(0,0,0,0.02)]"}`}>
                              <div className="opacity-70">Yağ</div>
                              <div className="text-xs font-black text-indigo-400">{msg.scannedMeal.fat}g</div>
                            </div>
                          </div>

                          {/* Interactive Selection Flow Form */}
                          {expandedFormIndex === idx ? (
                            <div className="mt-4 space-y-3 border-t border-indigo-500/20 pt-3 text-left">
                              <div className="text-[10px] font-black text-indigo-400 tracking-widest uppercase">PLANA EKLEME DETAYLARI</div>
                              
                              {loadingPlansData ? (
                                <div className="flex justify-center py-4">
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
                                </div>
                              ) : clientPlans.length === 0 ? (
                                <div className="text-xs text-rose-400 font-black">Aktif bir diyet planı bulunamadı.</div>
                              ) : (
                                <>
                                  {/* Plan Select */}
                                  <div>
                                    <label className="block text-[9px] font-bold opacity-60 mb-1">Diyet Planı</label>
                                    <select
                                      value={selectedPlanId}
                                      onChange={(e) => {
                                        setSelectedPlanId(e.target.value);
                                        setSelectedMealId("");
                                        setSelectedMealItemId("");
                                      }}
                                      className={`w-full rounded-xl border border-indigo-500/30 bg-black/60 backdrop-blur-md px-3 py-2 text-xs font-bold text-white shadow-inner focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 outline-none transition`}
                                    >
                                      {clientPlans.map((p) => (
                                        <option key={p.id} value={p.id}>{p.title}</option>
                                      ))}
                                    </select>
                                  </div>

                                  {/* Day Select */}
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="block text-[9px] font-bold opacity-60 mb-1">Plan Günü</label>
                                      <select
                                        value={selectedDay}
                                        onChange={(e) => {
                                          setSelectedDay(Number(e.target.value));
                                          setSelectedMealId("");
                                          setSelectedMealItemId("");
                                          setAddMode("add");
                                        }}
                                        className={`w-full rounded-xl border border-indigo-500/30 bg-black/60 backdrop-blur-md px-3 py-2 text-xs font-bold text-white shadow-inner focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 outline-none transition`}
                                      >
                                        {planType === "monthly" ? (
                                          daysArray.map((d) => (
                                            <option key={d} value={d}>{d}. Gün</option>
                                          ))
                                        ) : (
                                          <>
                                            <option value={1}>Pazartesi (1. Gün)</option>
                                            <option value={2}>Salı (2. Gün)</option>
                                            <option value={3}>Çarşamba (3. Gün)</option>
                                            <option value={4}>Perşembe (4. Gün)</option>
                                            <option value={5}>Cuma (5. Gün)</option>
                                            <option value={6}>Cumartesi (6. Gün)</option>
                                            <option value={7}>Pazar (7. Gün)</option>
                                          </>
                                        )}
                                      </select>
                                    </div>

                                    {/* Meal Select */}
                                    <div>
                                      <label className="block text-[9px] font-bold opacity-60 mb-1">Öğün Seviyesi</label>
                                      <select
                                        value={selectedMealId}
                                        onChange={(e) => {
                                          setSelectedMealId(e.target.value);
                                          setSelectedMealItemId("");
                                          setAddMode(e.target.value === "" ? "add" : "add");
                                        }}
                                        className={`w-full rounded-xl border border-indigo-500/30 bg-black/60 backdrop-blur-md px-3 py-2 text-xs font-bold text-white shadow-inner focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 outline-none transition`}
                                      >
                                        <option value="">-- Öğün Seçin --</option>
                                        {mealsForDay.map((m: any) => (
                                          <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>

                                  {/* Empty Day Flow Trigger */}
                                  {mealsForDay.length === 0 && (
                                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 space-y-2 mt-2">
                                      <p className="text-[10px] text-amber-300 font-bold leading-tight">
                                        ⚠️ Seçilen plan gününde henüz hiçbir öğün tanımlanmamış. Yeni bir öğün oluşturarak yemeği içine ekleyin:
                                      </p>
                                      <div className="space-y-1.5 pt-1">
                                        <input
                                          type="text"
                                          value={newMealName}
                                          onChange={(e) => {
                                            setNewMealName(e.target.value);
                                            setAddMode("create_and_add");
                                          }}
                                          placeholder="Öğün Adı (örn: Sabah Kahvaltısı)"
                                          className={`w-full rounded-lg px-2.5 py-1 text-xs border bg-black/40 border-amber-500/20 text-white outline-none focus:border-amber-500/40`}
                                        />
                                        <input
                                          type="text"
                                          value={newMealTime}
                                          onChange={(e) => {
                                            setNewMealTime(e.target.value);
                                            setAddMode("create_and_add");
                                          }}
                                          placeholder="Öğün Saati (örn: 09:30)"
                                          className={`w-full rounded-lg px-2.5 py-1 text-xs border bg-black/40 border-amber-500/20 text-white outline-none focus:border-amber-500/40`}
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {/* Mode Selector for Configured Meals */}
                                  {selectedMealId && mealsForDay.length > 0 && (
                                    <div>
                                      <label className="block text-[9px] font-bold opacity-60 mb-1">Ekleme Yöntemi</label>
                                      <div className="flex gap-2">
                                        <button
                                          type="button"
                                          onClick={() => setAddMode("add")}
                                          className={`flex-1 rounded-xl py-1.5 text-[10px] font-black border transition ${
                                            addMode === "add"
                                              ? "bg-indigo-500 border-transparent text-white shadow-md scale-102"
                                              : isDark
                                              ? "bg-[#0d1114]/80 border-indigo-500/10 text-zinc-300"
                                              : "bg-white border-indigo-200 text-indigo-950"
                                          }`}
                                        >
                                          Yeni Ekle
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setAddMode("replace")}
                                          className={`flex-1 rounded-xl py-1.5 text-[10px] font-black border transition ${
                                            addMode === "replace"
                                              ? "bg-indigo-500 border-transparent text-white shadow-md scale-102"
                                              : isDark
                                              ? "bg-[#0d1114]/80 border-indigo-500/10 text-zinc-300"
                                              : "bg-white border-indigo-200 text-indigo-950"
                                          }`}
                                        >
                                          Yiyecekle Değiştir
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                  {/* Replace Item Select Dropdown */}
                                  {selectedMealId && addMode === "replace" && (
                                    <div>
                                      <label className="block text-[9px] font-bold opacity-60 mb-1">Değiştirilecek Yiyecek</label>
                                      <select
                                        value={selectedMealItemId}
                                        onChange={(e) => setSelectedMealItemId(e.target.value)}
                                        className={`w-full rounded-xl border border-indigo-500/30 bg-black/60 backdrop-blur-md px-3 py-2 text-xs font-bold text-white shadow-inner focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 outline-none transition`}
                                      >
                                        <option value="">-- Yiyecek Seçin --</option>
                                        {mealsForDay.find((m: any) => m.id === selectedMealId)?.items
                                          ?.map((i: any) => (
                                            <option key={i.id} value={i.id}>{i.food?.name} ({i.amount}g)</option>
                                          ))}
                                      </select>
                                    </div>
                                  )}

                                  {/* Final Execution Buttons */}
                                  {(selectedMealId || addMode === "create_and_add") && (
                                    <div className="flex gap-2 pt-2">
                                      <button
                                        onClick={() => handleExecutePlanUpdate(msg.scannedMeal!)}
                                        className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-indigo-500 py-2.5 text-xs font-black text-white hover:bg-indigo-600 shadow-md transition hover:scale-[1.02]"
                                      >
                                        {addMode === "create_and_add" 
                                          ? "Öğünü Oluştur ve Ekle" 
                                          : addMode === "add" 
                                          ? "Öğüne Yeni Ekle" 
                                          : "Seçiliyle Değiştir"}
                                      </button>
                                      <button
                                        onClick={() => setExpandedFormIndex(null)}
                                        className={`rounded-xl px-4 py-2 text-xs font-semibold border ${
                                          isDark ? "border-transparent bg-white/5 text-zinc-300 hover:bg-white/10" : "border-indigo-200 bg-white text-indigo-950"
                                        }`}
                                      >
                                        İptal
                                      </button>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          ) : (
                            isClient && (
                              <div className="flex gap-2 mt-3">
                                <button
                                  onClick={() => handleOpenAddForm(idx)}
                                  disabled={loading}
                                  className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-indigo-500 py-2 text-xs font-black text-white shadow-md hover:bg-indigo-600 transition hover:scale-[1.02] disabled:opacity-50"
                                >
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3.5 w-3.5">
                                     <line x1="12" y1="5" x2="12" y2="19" />
                                     <line x1="5" y1="12" x2="19" y2="12" />
                                  </svg>
                                  {lang === "tr" ? "Diyet Planıma Ekle" : "Add to Diet Plan"}
                                </button>
                                
                                <button
                                  onClick={() => startEditingMeal(idx, msg.scannedMeal!)}
                                  disabled={loading}
                                  title={lang === "tr" ? "Bilgileri Düzenle" : "Edit Details"}
                                  className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-2.5 text-indigo-400 hover:bg-indigo-500/20 transition disabled:opacity-50 flex items-center justify-center"
                                >
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 h-4">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" />
                                  </svg>
                                </button>
                              </div>
                            )
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className={`rounded-2xl px-4 py-2 text-sm rounded-bl-none ${isDark ? "bg-white/10 text-zinc-400" : "bg-white border border-[#2f6154]/10 text-gray-500"}`}>
                  <span className="animate-pulse">
                    {uploading ? (lang === "tr" ? "Fotoğraf analiz ediliyor..." : "Analyzing photo...") : (lang === "tr" ? "Düşünüyor..." : "Thinking...")}
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className={`p-4 border-t ${isDark ? "border-emerald-400/10 bg-[#0d1114]" : "border-black/5 bg-[#f7fbf9]"}`}>
            <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleImageUpload}
              />
              
              {isClient && (
                <button
                  type="button"
                  onClick={startCamera}
                  disabled={loading || uploading}
                  title={lang === "tr" ? "Kameradan Yemek Fotoğrafı Çek" : "Stream Live Camera"}
                  className="flex items-center justify-center rounded-xl bg-indigo-500/10 px-3 py-2 text-indigo-400 transition hover:bg-indigo-500/20 disabled:opacity-50"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </button>
              )}
              
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Mesajınızı yazın..."
                className={`flex-1 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDark ? "border border-transparent bg-white/5 text-white placeholder-zinc-500" : "bg-white border border-[#2f6154]/20 text-[#123a32] placeholder-gray-400"}`}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex items-center justify-center rounded-xl bg-indigo-500 px-3 py-2 text-white transition hover:bg-indigo-600 disabled:opacity-50"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
