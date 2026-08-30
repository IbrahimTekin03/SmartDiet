import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardShell } from "../components/DashboardShell";
import { useAppSettings } from "../context/AppSettingsContext";
import { useSocket } from "../context/SocketContext";
import { parseStoredUser, useAuthSession } from "../lib/authSession";
import { API_BASE_URL as API_BASE } from "../lib/api";
import { 
  MessageSquare, 
  Paperclip, 
  Send, 
  Check, 
  CheckCheck, 
  Search, 
  User, 
  ArrowRight, 
  X,
  FileText
} from "lucide-react";


type Contact = {
  user_id: string;
  name: string;
  email: string | null;
  phone_number?: string | null;
  clinic_name?: string | null;
  avatar_url?: string | null;
  unreadCount?: number;
};

type Message = {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  is_delivered: boolean;
  is_read: boolean;
  created_at: string;
  plan_id?: string | null;
  plan?: {
    id: string;
    title: string;
    plan_type: string;
    description?: string | null;
  } | null;
};

const COPY = {
  tr: {
    title: "Mesajlaşma",
    subtitle: "Diyetisyeniniz veya danışanlarınız ile anlık olarak güvenli iletişim kurun.",
    noContacts: "Henüz atanmış bir sohbet bağlantınız bulunmuyor.",
    selectContact: "Sohbete başlamak için soldaki listeden bir kişi seçin.",
    typePlaceholder: "Bir mesaj yazın...",
    send: "Gönder",
    online: "Çevrimiçi",
    offline: "Çevrimdışı",
    assignedDietitian: "Atanmış Diyetisyen",
    assignedClients: "Danışanlarım",
    historyErr: "Geçmiş yüklenirken bir hata oluştu.",
    connecting: "Bağlantı kuruluyor...",
  },
  en: {
    title: "Messaging",
    subtitle: "Real-time encrypted communication with your dietitian or clients.",
    noContacts: "You do not have any assigned chat connections yet.",
    selectContact: "Select a contact from the sidebar to start chatting.",
    typePlaceholder: "Type a message...",
    send: "Send",
    online: "Online",
    offline: "Offline",
    assignedDietitian: "Assigned Dietitian",
    assignedClients: "My Clients",
    historyErr: "Error loading chat history.",
    connecting: "Connecting...",
  },
} as const;

export default function Messages() {
  const navigate = useNavigate();
  const { lang, isDark } = useAppSettings();
  const { accessToken, userJson } = useAuthSession();
  const currentUser = parseStoredUser<any>(userJson);
  const t = COPY[lang];

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [searchContact, setSearchContact] = useState("");

  const [plans, setPlans] = useState<any[]>([]);
  const [showPlansDropdown, setShowPlansDropdown] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const { socket, isSocketConnected, refreshUnreadCount } = useSocket();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const contactIds = useMemo(() => contacts.map((contact) => contact.user_id), [contacts]);
  const contactIdsKey = contactIds.join("|");

  const [onlineStatuses, setOnlineStatuses] = useState<Record<string, "online" | "offline">>({});
  const [typingStatuses, setTypingStatuses] = useState<Record<string, boolean>>({});
  const typingTimeoutRef = useRef<Record<string, any>>({});
  const [isTypingLocal, setIsTypingLocal] = useState(false);

  useEffect(() => {
    if (!accessToken) return;

    fetch(`${API_BASE}/api/auth/workspace/network`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const network = data.data || {};
        const contactList: Contact[] = [];

        if (network.assignedDietitian) {
          contactList.push({
            user_id: network.assignedDietitian.user_id,
            name: network.assignedDietitian.name || "Diyetisyen",
            email: network.assignedDietitian.email,
            clinic_name: network.assignedDietitian.clinic_name,
            unreadCount: 0,
          });
        }

        if (Array.isArray(network.clients)) {
          network.clients.forEach((c: any) => {
            contactList.push({
              user_id: c.user_id,
              name: c.name || "Danışan",
              email: c.email,
              unreadCount: 0,
            });
          });
        }

        setContacts(contactList);
        setLoadingContacts(false);
      })
      .catch((err) => {
        console.error(err);
        setLoadingContacts(false);
      });
  }, [accessToken]);

  useEffect(() => {
    if (socket && contactIds.length > 0) {
      socket.emit("check_online_statuses", { userIds: contactIds }, (res: any) => {
        if (res && res.status === "success" && res.statuses) {
          setOnlineStatuses(res.statuses);
        }
      });
    }
  }, [socket, contactIdsKey]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg: any) => {
      if (selectedContact && msg.sender_id === selectedContact.user_id) {
        setMessages((prev) => [...prev, { ...msg, is_delivered: true }]);
        fetch(`${API_BASE}/api/messages/history?contactId=${selectedContact.user_id}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }).catch(() => {});
      } else {
        setContacts((prevContacts) =>
          prevContacts.map((c) =>
            c.user_id === msg.sender_id
              ? { ...c, unreadCount: (c.unreadCount || 0) + 1 }
              : c
          )
        );
      }
    };

    const handleStatusChange = (data: { userId: string; status: "online" | "offline" }) => {
      setOnlineStatuses((prev) => ({ ...prev, [data.userId]: data.status }));
    };

    const handleTypingStatus = (data: { senderId: string; isTyping: boolean }) => {
      setTypingStatuses((prev) => ({ ...prev, [data.senderId]: data.isTyping }));
    };

    const handleMessagesDelivered = (data: { receiverId: string; messages: { id: string }[] }) => {
      const deliveredIds = new Set(data.messages.map((m) => m.id));
      setMessages((prev) =>
        prev.map((msg) => (deliveredIds.has(msg.id) ? { ...msg, is_delivered: true } : msg))
      );
    };

    const handleMessagesRead = (data: { roomId: string; userId: string }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.room_id === data.roomId && msg.sender_id !== data.userId ? { ...msg, is_read: true } : msg
        )
      );
    };

    socket.on("new_message", handleNewMessage);
    socket.on("user_status_changed", handleStatusChange);
    socket.on("typing_status", handleTypingStatus);
    socket.on("messages_delivered", handleMessagesDelivered);
    socket.on("messages_read", handleMessagesRead);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("user_status_changed", handleStatusChange);
      socket.off("typing_status", handleTypingStatus);
      socket.off("messages_delivered", handleMessagesDelivered);
      socket.off("messages_read", handleMessagesRead);
    };
  }, [socket, selectedContact, accessToken]);

  useEffect(() => {
    if (!selectedContact || !accessToken) return;

    fetch(`${API_BASE}/api/messages/history?contactId=${selectedContact.user_id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setMessages(data.data || []);
        setContacts((prev) =>
          prev.map((c) =>
            c.user_id === selectedContact.user_id ? { ...c, unreadCount: 0 } : c
          )
        );
        refreshUnreadCount();
      })
      .catch((err) => console.error(err));
  }, [selectedContact, accessToken]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedContact || !accessToken) return;

    if (typingTimeoutRef.current[selectedContact.user_id]) {
      clearTimeout(typingTimeoutRef.current[selectedContact.user_id]);
    }
    setIsTypingLocal(false);
    if (socket) {
      socket.emit("typing", { receiverId: selectedContact.user_id, isTyping: false });
    }

    const bodyPayload = {
      receiverId: selectedContact.user_id,
      content: newMessage.trim(),
    };

    setNewMessage("");

    try {
      const res = await fetch(`${API_BASE}/api/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();
      if (res.ok && data.data) {
        setMessages((prev) => [...prev, data.data]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const togglePlanDropdown = async () => {
    if (showPlansDropdown) {
      setShowPlansDropdown(false);
      return;
    }

    if (!selectedContact || !accessToken) return;

    setShowPlansDropdown(true);
    setLoadingPlans(true);
    setPlans([]);

    try {
      const roleNames = [
        ...(currentUser?.roles || []).map((r: any) => String(r?.name || "").trim().toLowerCase()),
        String(currentUser?.role || "").trim().toLowerCase(),
        String(currentUser?.account_type || "").trim().toLowerCase(),
      ].filter(Boolean);
      const isDietitian = roleNames.includes("diyetisyen") || roleNames.includes("dietitian");
      const isClient = !isDietitian;

      const url = isClient
        ? `${API_BASE}/api/diet-plans/client`
        : `${API_BASE}/api/diet-plans/client?clientId=${selectedContact.user_id}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (data && data.success) {
        setPlans(data.data || []);
      }
    } catch (err) {
      console.error("Failed to load diet plans:", err);
    } finally {
      setLoadingPlans(false);
    }
  };

  const handleSendPlanCard = async (planId: string, planTitle: string) => {
    if (!selectedContact || !accessToken) return;

    try {
      const res = await fetch(`${API_BASE}/api/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          receiverId: selectedContact.user_id,
          content: planTitle,
          planId: planId,
        }),
      });

      const data = await res.json();
      if (res.ok && data.data) {
        setMessages((prev) => [...prev, data.data]);
        setShowPlansDropdown(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);

    if (socket && selectedContact) {
      if (!isTypingLocal) {
        setIsTypingLocal(true);
        socket.emit("typing", { receiverId: selectedContact.user_id, isTyping: true });
      }

      if (typingTimeoutRef.current[selectedContact.user_id]) {
        clearTimeout(typingTimeoutRef.current[selectedContact.user_id]);
      }

      typingTimeoutRef.current[selectedContact.user_id] = setTimeout(() => {
        setIsTypingLocal(false);
        socket.emit("typing", { receiverId: selectedContact.user_id, isTyping: false });
      }, 1500);
    }
  };

  const getSubStatusText = (contactId: string) => {
    if (typingStatuses[contactId]) {
      return lang === "tr" ? "yazıyor..." : "typing...";
    }
    const status = onlineStatuses[contactId] || "offline";
    if (status === "online") {
      return lang === "tr" ? "Çevrimiçi" : "Online";
    }
    return lang === "tr" ? "Çevrimdışı" : "Offline";
  };

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString(lang === "tr" ? "tr-TR" : "en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(searchContact.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(searchContact.toLowerCase()))
  );

  return (
    <DashboardShell isDark={isDark} title={t.title} subtitle={t.subtitle} backUrl="/">
      <div className={`flex h-[calc(100vh-14rem)] min-h-[520px] w-full overflow-hidden rounded-[32px] border ${
        isDark ? "border-white/10 bg-slate-950/60 backdrop-blur-2xl shadow-2xl" : "border-slate-200 bg-white shadow-xl"
      }`}>
        {/* Left Contacts Sidebar */}
        <aside className={`w-80 flex flex-col border-r shrink-0 ${
          isDark ? "border-white/5 bg-slate-900/40" : "border-slate-100 bg-slate-50/50"
        }`}>
          {/* Header & Status */}
          <div className="p-4 border-b border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-emerald-400" />
                <h3 className="font-display text-xs font-black uppercase tracking-wider">
                  {contacts.length > 0 && contacts[0].clinic_name ? t.assignedDietitian : t.assignedClients}
                </h3>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold">
                <span className={`h-2 w-2 rounded-full ${isSocketConnected ? "bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse" : "bg-amber-500"}`} />
                <span className="text-slate-500 font-mono">{isSocketConnected ? "Canlı" : "..."}</span>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder={lang === "tr" ? "Kişilerde ara..." : "Search contacts..."}
                value={searchContact}
                onChange={(e) => setSearchContact(e.target.value)}
                className={`w-full rounded-xl border pl-8 pr-3 py-1.5 text-xs outline-none transition ${
                  isDark ? "border-white/10 bg-black/40 text-white focus:border-emerald-500" : "border-slate-200 bg-white text-slate-900 focus:border-emerald-500"
                }`}
              />
            </div>
          </div>

          {/* Contact List */}
          <div className="flex-1 space-y-1.5 overflow-y-auto p-3 scrollbar-hide">
            {loadingContacts ? (
              <div className="space-y-2 p-2">
                <div className="h-14 rounded-2xl bg-white/5 animate-pulse" />
                <div className="h-14 rounded-2xl bg-white/5 animate-pulse" />
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="p-6 text-center text-xs font-medium text-slate-500">
                {t.noContacts}
              </div>
            ) : (
              filteredContacts.map((contact) => {
                const isSelected = selectedContact?.user_id === contact.user_id;
                const isOnline = onlineStatuses[contact.user_id] === "online";

                return (
                  <button
                    key={contact.user_id}
                    onClick={() => setSelectedContact(contact)}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition text-left group ${
                      isSelected
                        ? "border-emerald-500/30 bg-emerald-500/10 shadow-lg shadow-emerald-500/10"
                        : isDark ? "border-transparent bg-white/[0.02] hover:bg-white/[0.05]" : "border-transparent bg-white hover:bg-slate-100/70"
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl font-display font-black text-sm transition ${
                        isSelected
                          ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30"
                          : isDark ? "bg-slate-800 text-slate-300 group-hover:bg-slate-700" : "bg-slate-100 text-slate-700"
                      }`}>
                        {contact.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 ${
                        isDark ? "border-slate-900" : "border-white"
                      } ${isOnline ? "bg-emerald-500" : "bg-slate-500"}`} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className={`truncate text-xs font-black ${
                          isSelected ? "text-emerald-400" : isDark ? "text-white" : "text-slate-900"
                        }`}>
                          {contact.name}
                        </h4>
                        {!!contact.unreadCount && contact.unreadCount > 0 && (
                          <span className="flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-black text-slate-950">
                            {contact.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">
                        {contact.clinic_name || contact.email || getSubStatusText(contact.user_id)}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Right Active Chat Box */}
        <section className="flex-1 flex flex-col min-w-0">
          {selectedContact ? (
            <>
              {/* Chat Header */}
              <div className={`flex items-center justify-between p-4 border-b ${
                isDark ? "border-white/5 bg-slate-900/20" : "border-slate-100 bg-white"
              }`}>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 font-display font-black text-xs">
                      {selectedContact.name.substring(0, 2).toUpperCase()}
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 ${
                      isDark ? "border-slate-900" : "border-white"
                    } ${onlineStatuses[selectedContact.user_id] === "online" ? "bg-emerald-500" : "bg-slate-500"}`} />
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-black tracking-tight">{selectedContact.name}</h3>
                    <p className={`text-[10px] font-bold mt-0.5 ${
                      typingStatuses[selectedContact.user_id] || onlineStatuses[selectedContact.user_id] === "online"
                        ? "text-emerald-400 animate-pulse"
                        : "text-slate-500"
                    }`}>
                      {getSubStatusText(selectedContact.user_id)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Chat Messages Body */}
              <div className="flex-1 space-y-3 overflow-y-auto p-5 scrollbar-hide">
                {messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center p-6 opacity-40">
                    <MessageSquare className="h-10 w-10 text-emerald-400 mb-2" />
                    <p className="text-xs font-bold">{lang === "tr" ? "Henüz bir mesajlaşma yok." : "No messages yet."}</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwn = msg.sender_id === currentUser?.id;

                    return (
                      <div key={msg.id} className={`flex w-full ${isOwn ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] md:max-w-[60%] p-4 rounded-3xl transition ${
                          isOwn
                            ? "rounded-tr-sm bg-gradient-to-br from-emerald-500 to-teal-600 text-slate-950 font-medium shadow-lg shadow-emerald-500/15"
                            : isDark
                            ? "rounded-tl-sm border border-white/10 bg-slate-900 text-white"
                            : "rounded-tl-sm border border-slate-200 bg-white text-slate-900 shadow-sm"
                        }`}>
                          {msg.plan_id && msg.plan ? (
                            <div
                              onClick={() => navigate(`/plan/${msg.plan_id}`)}
                              className={`cursor-pointer rounded-2xl p-3 border transition flex items-center gap-3 ${
                                isOwn
                                  ? "border-black/10 bg-black/10 hover:bg-black/20 text-slate-950"
                                  : isDark ? "border-white/10 bg-black/30 hover:border-emerald-500/50" : "border-emerald-200 bg-emerald-50 hover:bg-emerald-100"
                              }`}
                            >
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-slate-950 shadow-md">
                                <FileText className="h-5 w-5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="block text-[9px] font-black uppercase tracking-wider opacity-70">
                                  {lang === "tr" ? "Diyet Planı Kartı" : "Diet Plan Card"}
                                </span>
                                <h4 className="text-xs font-black truncate mt-0.5">{msg.plan.title}</h4>
                                <p className="text-[10px] opacity-80 mt-0.5">
                                  {msg.plan.plan_type === "weekly" ? "Haftalık Program" : "Aylık Program"}
                                </p>
                              </div>
                              <ArrowRight className="h-4 w-4 shrink-0 opacity-60" />
                            </div>
                          ) : (
                            <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                          )}

                          <div className={`flex items-center justify-end gap-1 mt-1.5 text-[9px] font-mono font-bold ${
                            isOwn ? "text-slate-900/70" : "text-slate-500"
                          }`}>
                            <span>{formatTime(msg.created_at)}</span>
                            {isOwn && (
                              msg.is_read ? (
                                <CheckCheck className="h-3.5 w-3.5 text-slate-950 stroke-[2.5]" />
                              ) : msg.is_delivered ? (
                                <CheckCheck className="h-3.5 w-3.5 text-slate-900/70 stroke-[2]" />
                              ) : (
                                <Check className="h-3 w-3 text-slate-900/60" />
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Field */}
              <form onSubmit={handleSendMessage} className={`relative flex items-center gap-2 p-4 border-t ${
                isDark ? "border-white/5 bg-slate-900/30" : "border-slate-100 bg-slate-50/50"
              }`}>
                {/* Diet Plans Attachment Popup */}
                {showPlansDropdown && (
                  <div className={`absolute bottom-full right-4 z-50 mb-3 w-80 rounded-3xl border p-4 shadow-2xl backdrop-blur-2xl animate-fadeInUp ${
                    isDark ? "border-white/10 bg-slate-900/95 text-white" : "border-slate-200 bg-white text-slate-900"
                  }`}>
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/5">
                      <h4 className="font-display text-xs font-black uppercase text-emerald-400">
                        {lang === "tr" ? "Diyet Planı Paylaş" : "Share Diet Plan"}
                      </h4>
                      <button type="button" onClick={() => setShowPlansDropdown(false)} className="text-slate-400 hover:text-white">
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                      {loadingPlans ? (
                        <div className="py-4 text-center text-xs text-slate-400 animate-pulse">
                          {lang === "tr" ? "Yükleniyor..." : "Loading..."}
                        </div>
                      ) : plans.length === 0 ? (
                        <div className="py-4 text-center text-xs text-slate-500">
                          {lang === "tr" ? "Aktif plan bulunamadı." : "No plans found."}
                        </div>
                      ) : (
                        plans.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleSendPlanCard(p.id, p.title)}
                            className="w-full flex items-center justify-between p-2.5 rounded-xl border border-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/10 text-left transition"
                          >
                            <div className="min-w-0 flex-1 mr-2">
                              <h5 className="font-bold text-xs truncate">{p.title}</h5>
                              <span className="text-[9px] text-slate-400 uppercase font-mono">{p.plan_type}</span>
                            </div>
                            <span className="text-[10px] font-black text-emerald-400">{lang === "tr" ? "Gönder" : "Send"}</span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={togglePlanDropdown}
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition ${
                    isDark ? "border-white/10 bg-slate-800/80 text-slate-300 hover:text-emerald-400" : "border-slate-200 bg-white text-slate-700 hover:text-emerald-600"
                  }`}
                  title="Diyet Planı Ekle"
                >
                  <Paperclip className="h-4 w-4" />
                </button>

                <input
                  type="text"
                  placeholder={t.typePlaceholder}
                  value={newMessage}
                  onChange={handleInputChange}
                  className={`flex-1 rounded-2xl border px-4 py-3 text-xs font-medium outline-none transition ${
                    isDark ? "border-white/10 bg-black/40 text-white focus:border-emerald-500" : "border-slate-200 bg-white text-slate-900 focus:border-emerald-500"
                  }`}
                />

                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className={`flex h-11 px-5 items-center justify-center gap-2 rounded-2xl font-display text-xs font-black transition ${
                    !newMessage.trim()
                      ? "bg-slate-800 text-slate-500 cursor-not-allowed opacity-50"
                      : "bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/25 hover:scale-105 active:scale-95"
                  }`}
                >
                  <span>{t.send}</span>
                  <Send className="h-3.5 w-3.5 stroke-[2.5]" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center opacity-60">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-400 mb-4">
                <MessageSquare className="h-8 w-8" />
              </div>
              <h3 className="font-display text-base font-black">{t.title}</h3>
              <p className="mt-1 text-xs text-slate-400 max-w-sm">{t.selectContact}</p>
            </div>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}

