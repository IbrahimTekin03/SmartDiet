import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { parseStoredUser, useAuthSession } from "../lib/authSession";

const API_BASE = "http://localhost:3000";

type SocketContextType = {
  socket: Socket | null;
  isSocketConnected: boolean;
  unreadMessageCount: number;
  setUnreadMessageCount: React.Dispatch<React.SetStateAction<number>>;
  refreshUnreadCount: () => Promise<void>;
};

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isSocketConnected: false,
  unreadMessageCount: 0,
  setUnreadMessageCount: () => {},
  refreshUnreadCount: async () => {},
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { accessToken, userJson } = useAuthSession();
  const currentUser = parseStoredUser<any>(userJson);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  const refreshUnreadCount = async () => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${API_BASE}/api/auth/dashboard-summary`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (data && typeof data.messages === "number") {
        setUnreadMessageCount(data.messages);
      }
    } catch (err) {
      console.error("Failed to refresh unread message count:", err);
    }
  };

  useEffect(() => {
    if (accessToken) {
      refreshUnreadCount();
    } else {
      setUnreadMessageCount(0);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken || !currentUser?.id) {
      if (socket) {
        socket.close();
        setSocket(null);
        setIsSocketConnected(false);
      }
      return;
    }

    const newSocket = io(API_BASE, {
      transports: ["websocket"],
      auth: { token: accessToken },
    });

    newSocket.on("connect", () => {
      console.log("Global WebSocket connected!");
      setIsSocketConnected(true);
      newSocket.emit("join", { userId: currentUser.id });
    });

    newSocket.on("disconnect", () => {
      console.log("Global WebSocket disconnected");
      setIsSocketConnected(false);
    });

    // Listen for new message notifications dynamically across the app
    newSocket.on("new_message", () => {
      // Check if we are currently chatting in the messages screen
      const isCurrentlyChatting = window.location.pathname === "/messages";
      if (!isCurrentlyChatting) {
        setUnreadMessageCount((prev) => prev + 1);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [accessToken, currentUser?.id]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isSocketConnected,
        unreadMessageCount,
        setUnreadMessageCount,
        refreshUnreadCount,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
