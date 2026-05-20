import { useState, useRef, useEffect } from "react";
import { useAuthSession, parseStoredUser } from "../lib/authSession";
import { useAppSettings } from "../context/AppSettingsContext";

type Message = { role: "user" | "assistant"; content: string };

export default function AIAssistantWidget() {
  const { accessToken, userJson } = useAuthSession();
  const user = parseStoredUser<any>(userJson);
  const { isDark, lang } = useAppSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0 && user) {
      let greeting = lang === "tr" ? "Merhaba! Size nasıl yardımcı olabilirim?" : "Hello! How can I help you today?";
      const roles = user.roles || [];
      const isAdmin = roles.includes("admin");
      const isDietitian = roles.includes("Diyetisyen") || roles.includes("dietitian");

      if (lang === "tr") {
        if (isAdmin) {
          greeting = "Merhaba! Sistem yönetimi, kullanıcı kontrolleri veya veritabanı işlemlerinde size yardımcı olabilirim.";
        } else if (isDietitian) {
          greeting = "Merhaba! Danışanlarınıza hızlıca kişiselleştirilmiş öğün listeleri hazırlamanıza yardımcı olabilirim.";
        } else {
          greeting = "Merhaba! Mevcut diyet planınızla ilgili değişiklikler yapmak veya alternatif öğünler önermemi isteyebilirsiniz.";
        }
      } else {
        if (isAdmin) {
          greeting = "Hello! I can assist you with system management or database operations.";
        } else if (isDietitian) {
          greeting = "Hello! I can help you quickly prepare personalized meal plans for your clients.";
        } else {
          greeting = "Hello! You can ask me to make changes to your diet plan or suggest alternative meals.";
        }
      }
      setMessages([{ role: "assistant", content: greeting }]);
    }
  }, [user, lang, messages.length]);

  // If not logged in, don't show the widget
  if (!accessToken) return null;

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("https://smart-diet06.vercel.app/api/ai-assistant/chat", {
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
        <div className={`fixed bottom-[144px] right-5 z-[90] flex w-[360px] flex-col overflow-hidden rounded-3xl border shadow-[0_32px_120px_rgba(0,0,0,0.45)] ${isDark ? "border-white/15 bg-[#0d1114] text-white" : "border-[#2f6154]/20 bg-[#f7fbf9] text-[#123a32]"}`} style={{ height: '520px' }}>
          
          <div className={`flex items-center justify-between p-4 border-b ${isDark ? "border-white/10" : "border-black/5"}`}>
            <h3 className="text-sm font-extrabold flex items-center gap-2">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-purple-400">
                  <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
               </svg>
               SmartDiet AI
            </h3>
            <button onClick={() => setIsOpen(false)} className={`rounded-xl border px-2 py-1 text-xs font-semibold ${isDark ? "border-white/15 bg-white/5 text-zinc-200" : "border-[#2f6154]/20 bg-white text-[#2b574b]"}`}>Kapat</button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-relaxed ${msg.role === "user" ? "bg-indigo-500 text-white rounded-br-none" : isDark ? "bg-white/10 text-zinc-200 rounded-bl-none" : "bg-white border border-[#2f6154]/10 text-[#123a32] rounded-bl-none"}`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className={`rounded-2xl px-4 py-2 text-sm rounded-bl-none ${isDark ? "bg-white/10 text-zinc-400" : "bg-white border border-[#2f6154]/10 text-gray-500"}`}>
                  <span className="animate-pulse">Düşünüyor...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className={`p-4 border-t ${isDark ? "border-white/10 bg-[#0d1114]" : "border-black/5 bg-[#f7fbf9]"}`}>
            <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Mesajınızı yazın..."
                className={`flex-1 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDark ? "bg-white/5 border border-white/10 text-white placeholder-zinc-500" : "bg-white border border-[#2f6154]/20 text-[#123a32] placeholder-gray-400"}`}
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
