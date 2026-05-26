import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardShell } from "../components/DashboardShell";
import { useAppSettings } from "../context/AppSettingsContext";
import { useSocket } from "../context/SocketContext";
import { parseStoredUser, useAuthSession } from "../lib/authSession";

const API_BASE = "http://localhost:3000";

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
    subtitle: "Diyetisyeniniz veya danışanlarınız ile anlık olarak iletişim kurun.",
    noContacts: "Henüz atanmış bir sohbet bağlantınız bulunmuyor.",
    selectContact: "Sohbete başlamak için soldan bir kişi seçin.",
    typePlaceholder: "Mesajınızı yazın...",
    send: "Gönder",
    online: "Çevrimiçi",
    assignedDietitian: "Atanmış Diyetisyen",
    assignedClients: "Danışanlarım",
    historyErr: "Geçmiş yüklenirken bir hata oluştu.",
    connecting: "Sohbet sunucusuna bağlanılıyor...",
  },
  en: {
    title: "Messaging",
    subtitle: "Communicate instantly with your dietitian or clients.",
    noContacts: "You do not have any assigned chat connections yet.",
    selectContact: "Select a contact from the left to start chatting.",
    typePlaceholder: "Type your message...",
    send: "Send",
    online: "Online",
    assignedDietitian: "Assigned Dietitian",
    assignedClients: "My Clients",
    historyErr: "Error loading chat history.",
    connecting: "Connecting to chat server...",
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

  // Fetch contacts (assigned connections)
  useEffect(() => {
    if (!accessToken) return;

    fetch(`${API_BASE}/api/auth/workspace/network`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const network = data.data || {};
        const contactList: Contact[] = [];

        // If client, add dietitian
        if (network.assignedDietitian) {
          contactList.push({
            user_id: network.assignedDietitian.user_id,
            name: network.assignedDietitian.name || "Diyetisyen",
            email: network.assignedDietitian.email,
            clinic_name: network.assignedDietitian.clinic_name,
            unreadCount: 0,
          });
        }

        // If dietitian, add assigned clients
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

  // Global WebSocket is connected via SocketProvider

  // Request online statuses when socket connects or contacts load
  useEffect(() => {
    if (socket && contactIds.length > 0) {
      socket.emit("check_online_statuses", { userIds: contactIds }, (res: any) => {
        if (res && res.status === "success" && res.statuses) {
          setOnlineStatuses(res.statuses);
        }
      });
    }
  }, [socket, contactIdsKey]);

  // Handle incoming real-time messages & active status updates
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

  // Fetch history when selecting contact
  useEffect(() => {
    if (!selectedContact || !accessToken) return;

    fetch(`${API_BASE}/api/messages/history?contactId=${selectedContact.user_id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setMessages(data.data || []);
        // Reset unread count for this contact
        setContacts((prev) =>
          prev.map((c) =>
            c.user_id === selectedContact.user_id ? { ...c, unreadCount: 0 } : c
          )
        );
        // Refresh the global unread count badge
        refreshUnreadCount();
      })
      .catch((err) => console.error(err));
  }, [selectedContact, accessToken]);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  // Send message
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
      const isClient = currentUser?.role !== "diyetisyen";
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
      console.error("Failed to load diet plans for attachment:", err);
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
      console.error("Failed to send diet plan card:", err);
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
      return lang === "tr" ? "çevrimiçi" : "online";
    }
    return lang === "tr" ? "çevrimdışı" : "offline";
  };

  const renderCheckmarks = (msg: Message) => {
    if (msg.is_read) {
      return (
        <span className="text-sky-400 ml-1 flex shrink-0 select-none items-center">
          <svg className="h-3 w-4 fill-current" viewBox="0 0 24 24">
            <path d="M0.41 13.41L6 19l1.41-1.41L1.83 12m20.34-5.66L11 17.17l-4.17-4.17-1.42 1.41 5.59 5.59 12.02-12.02M18 7l-1.41-1.41-6.59 6.59 1.41 1.41L18 7z"/>
          </svg>
        </span>
      );
    }
    if (msg.is_delivered) {
      return (
        <span className="text-zinc-400 ml-1 flex shrink-0 select-none items-center opacity-65">
          <svg className="h-3 w-4 fill-current" viewBox="0 0 24 24">
            <path d="M0.41 13.41L6 19l1.41-1.41L1.83 12m20.34-5.66L11 17.17l-4.17-4.17-1.42 1.41 5.59 5.59 12.02-12.02M18 7l-1.41-1.41-6.59 6.59 1.41 1.41L18 7z"/>
          </svg>
        </span>
      );
    }
    return (
      <span className="text-zinc-400 ml-1 flex shrink-0 select-none items-center opacity-45">
        <svg className="h-3 w-3 fill-current" viewBox="0 0 24 24">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        </svg>
      </span>
    );
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

  return (
    <DashboardShell isDark={isDark} title={t.title} subtitle={t.subtitle}>
      <div className={["flex h-[calc(100vh-12rem)] min-h-[480px] w-full overflow-hidden border", isDark ? "rounded-2xl border-white/10 bg-white/5" : "rounded-lg border-[#dfd0b9] bg-[#fffaf0]"].join(" ")}>
        
        {/* Left Contacts Sidebar */}
        <aside className={["w-80 flex flex-col border-r", isDark ? "border-white/10 bg-black/20" : "border-[#dfd0b9] bg-[#fdf8ee]"].join(" ")}>
          <div className={["flex items-center justify-between border-b p-4", isDark ? "border-white/10" : "border-[#dfd0b9]"].join(" ")}>
            <h3 className={["text-xs font-black uppercase", isDark ? "text-zinc-400" : "text-[#806f57]"].join(" ")}>
              {contacts.length > 0 && contacts[0].clinic_name ? t.assignedDietitian : t.assignedClients}
            </h3>
            {isSocketConnected ? (
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-md shadow-emerald-500/50" title="Connected" />
            ) : (
              <span className="flex h-2 w-2 rounded-full bg-amber-500" title={t.connecting} />
            )}
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {loadingContacts ? (
              <div className="space-y-3">
                <div className={["h-14 w-full animate-pulse", isDark ? "rounded-xl bg-white/5" : "rounded-md bg-[#f1e4cf]"].join(" ")} />
                <div className={["h-14 w-full animate-pulse", isDark ? "rounded-xl bg-white/5" : "rounded-md bg-[#f1e4cf]"].join(" ")} />
              </div>
            ) : contacts.length === 0 ? (
              <div className="p-6 text-center text-xs font-semibold text-zinc-500">
                {t.noContacts}
              </div>
            ) : (
              contacts.map((contact) => {
                const isSelected = selectedContact?.user_id === contact.user_id;
                return (
                  <button
                    key={contact.user_id}
                    onClick={() => setSelectedContact(contact)}
                    className={[
                      "w-full flex items-center gap-3 border p-3 text-left transition",
                      isSelected
                        ? (isDark ? "rounded-xl border-emerald-400/30 bg-emerald-500/10 text-white" : "rounded-md border-[#c7dbc7] bg-[#edf6ec] text-[#285743]")
                        : (isDark ? "rounded-xl border-transparent bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white" : "rounded-md border-[#eadcc8] bg-white text-[#7b6d58] hover:border-[#cbb48d] hover:text-[#342b1d]")
                    ].join(" ")}
                  >
                    <div className={["flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black", isSelected ? (isDark ? "bg-emerald-400 text-zinc-950" : "bg-[#8a6a3f] text-white") : (isDark ? "bg-black/30 text-zinc-400" : "bg-[#f1e4cf] text-[#745737]")].join(" ")}>
                      {contact.name.substring(0, 2).toUpperCase()}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className={["text-xs font-bold truncate", isSelected ? (isDark ? "text-white" : "text-[#0e2d27]") : (isDark ? "text-zinc-300" : "text-[#0e2d27]")].join(" ")}>
                        {contact.name}
                      </h4>
                      <p className={["mt-0.5 truncate text-[10px]", isDark ? "text-zinc-500" : "text-[#8a7a61]"].join(" ")}>
                        {contact.email}
                      </p>
                    </div>

                    {!!contact.unreadCount && contact.unreadCount > 0 && (
                      <span className="flex h-5 min-w-5 px-1.5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white shadow-lg shadow-emerald-500/20">
                        {contact.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Right Active Chat Box */}
        <section className="flex-1 flex flex-col bg-transparent">
          {selectedContact ? (
            <>
              {/* Chat Header */}
              <div className={["flex items-center justify-between border-b p-4", isDark ? "border-white/10 bg-black/20" : "border-[#dfd0b9] bg-[#fffaf0]"].join(" ")}>
                <div className="flex items-center gap-3">
                  <div className={["flex h-10 w-10 items-center justify-center rounded-xl text-sm font-black", isDark ? "bg-emerald-500/15 text-emerald-200" : "bg-[#edf6ec] text-[#285743]"].join(" ")}>
                    {selectedContact.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className={["text-sm font-black tracking-tight", isDark ? "text-white" : "text-[#342b1d]"].join(" ")}>
                      {selectedContact.name}
                    </h3>
                    <p className={[
                      "mt-0.5 text-[10px] font-bold transition",
                      (typingStatuses[selectedContact.user_id] || onlineStatuses[selectedContact.user_id] === "online") ? "text-emerald-400" : "text-zinc-500"
                    ].join(" ")}>
                      {getSubStatusText(selectedContact.user_id)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Chat Messages Log */}
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {messages.map((msg) => {
                  const isOwn = msg.sender_id === currentUser?.id;
                  return (
                    <div
                      key={msg.id}
                      className={["flex w-full", isOwn ? "justify-end" : "justify-start"].join(" ")}
                    >
                      <div
                        className={[
                          "max-w-[70%] px-4 py-3 text-sm shadow-sm",
                          isOwn
                            ? (isDark ? "rounded-2xl rounded-tr-md bg-emerald-400 text-zinc-950" : "rounded-lg rounded-tr-sm bg-[#8a6a3f] text-white")
                            : (isDark ? "rounded-2xl rounded-tl-md border border-white/10 bg-black/30 text-zinc-100" : "rounded-lg rounded-tl-sm border border-[#eadcc8] bg-white text-[#342b1d]")
                        ].join(" ")}
                      >
                        {msg.plan_id && msg.plan ? (
                          <div 
                            onClick={() => navigate(`/plan/${msg.plan_id}`)}
                            className={[
                              "flex items-center gap-3 rounded-xl border p-3 text-left transition hover:brightness-105",
                              isOwn
                                ? "bg-white/10 border-white/20 text-white"
                                : (isDark ? "bg-zinc-700/50 border-white/10 text-white" : "bg-emerald-50 border-emerald-200 text-[#0e2d27]")
                            ].join(" ")}
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-md shadow-emerald-500/20">
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="block text-[8px] font-black uppercase tracking-wider opacity-70">
                                {lang === "tr" ? "Diyet Programı Kartı" : "Diet Plan Card"}
                              </span>
                              <h4 className="text-xs font-bold truncate mt-0.5">{msg.plan.title}</h4>
                              <p className="text-[9px] opacity-80 truncate mt-0.5">
                                {msg.plan.plan_type === "weekly" ? (lang === "tr" ? "Haftalık Program" : "Weekly Plan") : (lang === "tr" ? "Aylık Program" : "Monthly Plan")}
                              </p>
                            </div>
                            <div className="shrink-0 text-xs opacity-75">
                              ➡️
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        )}
                        <div className="flex items-center justify-end gap-1 mt-1.5 opacity-80 text-[9px] font-semibold text-right">
                          <span>{formatTime(msg.created_at)}</span>
                          {isOwn && renderCheckmarks(msg)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Field */}
              <form
                onSubmit={handleSendMessage}
                className={["relative flex items-center gap-3 border-t p-4", isDark ? "border-white/10 bg-black/30" : "border-[#dfd0b9] bg-[#fdf8ee]"].join(" ")}
              >
                {showPlansDropdown && (
                  <div className={[
                    "absolute bottom-full right-4 z-50 mb-2 w-80 overflow-hidden border p-4 shadow-2xl",
                    isDark ? "rounded-2xl border-white/10 bg-[#080b0a]/95" : "rounded-lg border-[#dfd0b9] bg-[#fffaf0]"
                  ].join(" ")}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className={["text-[10px] font-black uppercase tracking-wider", isDark ? "text-zinc-400" : "text-[#0e2d27]"].join(" ")}>
                        {lang === "tr" ? "Paylaşılacak Programı Seçin" : "Select Diet Plan to Share"}
                      </h4>
                      <button 
                        type="button" 
                        onClick={() => setShowPlansDropdown(false)}
                        className="text-xs font-semibold text-rose-400 hover:text-rose-500"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                      {loadingPlans ? (
                        <div className="text-center py-4 text-xs text-zinc-500 font-semibold animate-pulse">
                          {lang === "tr" ? "Programlar yükleniyor..." : "Loading plans..."}
                        </div>
                      ) : plans.length === 0 ? (
                        <div className="text-center py-4 text-xs text-zinc-500 font-semibold">
                          {lang === "tr" ? "Aktif program bulunamadı." : "No active plans found."}
                        </div>
                      ) : (
                        plans.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleSendPlanCard(p.id, p.title)}
                            className={[
                              "flex w-full items-center justify-between border p-3 text-left text-xs transition",
                              isDark 
                                ? "rounded-xl border-transparent bg-white/5 text-zinc-300 hover:border-emerald-400/25 hover:bg-emerald-500/10 hover:text-white"
                                : "rounded-md border-[#eadcc8] bg-white text-[#7b6d58] hover:border-[#cbb48d] hover:text-[#342b1d]"
                            ].join(" ")}
                          >
                            <div className="min-w-0 flex-1 mr-2">
                              <div className="font-bold truncate">{p.title}</div>
                              <div className="text-[9px] opacity-75 mt-0.5">
                                {p.plan_type === "weekly" ? (lang === "tr" ? "Haftalık Program" : "Weekly Plan") : (lang === "tr" ? "Aylık Program" : "Monthly Plan")}
                              </div>
                            </div>
                            <span className="text-[10px] shrink-0 text-emerald-500 font-bold">
                              {lang === "tr" ? "Gönder" : "Send"}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={togglePlanDropdown}
                  className={[
                    "flex h-10 w-10 shrink-0 items-center justify-center border transition",
                    isDark 
                      ? "rounded-xl border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white" 
                      : "rounded-md border-[#dfd0b9] bg-white text-[#806f57] hover:bg-[#fffaf0] hover:text-[#342b1d]"
                  ].join(" ")}
                  title={lang === "tr" ? "Diyet Programı Ekle" : "Attach Diet Plan"}
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </button>

                <input
                  type="text"
                  placeholder={t.typePlaceholder}
                  value={newMessage}
                  onChange={handleInputChange}
                  className={["flex-1 border px-4 py-3 text-xs outline-none transition", isDark ? "rounded-xl border-white/10 bg-black/40 text-white focus:border-emerald-400" : "rounded-md border-[#dfd0b9] bg-white text-[#342b1d] focus:border-[#8a6a3f]/55"].join(" ")}
                />
                
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className={["flex h-10 w-24 shrink-0 items-center justify-center gap-2 text-xs font-black transition", (!newMessage.trim()) ? (isDark ? "cursor-not-allowed rounded-xl bg-emerald-400/35 text-zinc-950/70" : "cursor-not-allowed rounded-md bg-[#b9a37f] text-white/80") : (isDark ? "rounded-xl bg-emerald-400 text-zinc-950 hover:brightness-110" : "rounded-md bg-[#8a6a3f] text-white hover:bg-[#765932]")].join(" ")}
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  {t.send}
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className={["text-sm font-bold", isDark ? "text-white" : "text-[#0e2d27]"].join(" ")}>
                {t.title}
              </h3>
              <p className="text-xs text-zinc-500 mt-2 max-w-xs leading-relaxed">
                {t.selectContact}
              </p>
            </div>
          )}
        </section>

      </div>
    </DashboardShell>
  );
}
