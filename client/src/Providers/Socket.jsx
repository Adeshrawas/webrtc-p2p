import React, { useMemo, useContext, createContext, useEffect } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const socket = useMemo(() => {
    const connection = io("https://webrtc-p2p-server.onrender.com", {
      transports: ["websocket"],
      reconnectionAttempts: 5,
      timeout: 10000,
    });
    return connection;
  }, []);

  // Log socket events
  useEffect(() => {
    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected.");
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");

      if (socket && socket.connected) {
        socket.disconnect();
        console.log("🔌 Socket disconnected.");
      }
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
