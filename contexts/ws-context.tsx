"use client";

import React, { createContext, useContext } from "react";
import type { ServerEvent } from "@/utils/ws/wss";
import { WsClient } from "@/utils/ws/wss";

type Ctx = {
  ws: WsClient | null;
  lastEvent: ServerEvent | null;

  // ✅ presence
  onlineUserIds: Set<string>;
  isOnline: (userId?: string | null) => boolean;

  // wrappers (so components don't touch private send)
  joinChat: (chatId: string) => void;
  leaveChat: (chatId: string) => void;
  ackDelivered: (chatId: string, messageId: string) => void;
  ackRead: (chatId: string, messageId: string) => void;
  typingStart: (chatId: string) => void;
  typingStop: (chatId: string) => void;
};

const WsContext = createContext<Ctx | null>(null);

export const WsProvider = ({
  children,
  token,
}: {
  children: React.ReactNode;
  token: string;
}) => {
  const [lastEvent, setLastEvent] = React.useState<ServerEvent | null>(null);

  // ✅ presence state
  const [onlineUserIds, setOnlineUserIds] = React.useState<Set<string>>(
    () => new Set(),
  );

  // create client once
  const ws = React.useMemo(() => {
    const url = process.env.NEXT_PUBLIC_WS_URL!;
    return new WsClient(url);
  }, []);

  React.useEffect(() => {
    const off = ws.on((evt) => {
      setLastEvent(evt);

      // ✅ presence snapshot (critical for “user was online before I connected”)
      if (evt.type === "presence_state") {
        const ids = (evt.data?.onlineUserIds ?? []).map(String);
        setOnlineUserIds(new Set(ids));
        return;
      }

      // ✅ incremental presence updates
      if (evt.type === "presence_online") {
        const id = String(evt.data.userId);
        setOnlineUserIds((prev) => {
          const next = new Set(prev);
          next.add(id);
          return next;
        });
        return;
      }

      if (evt.type === "presence_offline") {
        const id = String(evt.data.userId);
        setOnlineUserIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        return;
      }
    });

    ws.connect(token);

    return () => {
      off();
      ws.disconnect();
    };
  }, [ws, token]);

  const isOnline = React.useCallback(
    (userId?: string | null) => {
      if (!userId) return false;
      return onlineUserIds.has(String(userId));
    },
    [onlineUserIds],
  );

  // wrappers
  const joinChat = React.useCallback(
    (chatId: string) => ws.joinChat(chatId),
    [ws],
  );

  const leaveChat = React.useCallback(
    (chatId: string) => ws.leaveChat(chatId),
    [ws],
  );

  const ackDelivered = React.useCallback(
    (chatId: string, messageId: string) => ws.ackDelivered(chatId, messageId),
    [ws],
  );

  const ackRead = React.useCallback(
    (chatId: string, messageId: string) => ws.ackRead(chatId, messageId),
    [ws],
  );

  const typingStart = React.useCallback(
    (chatId: string) => ws.typingStart(chatId),
    [ws],
  );

  const typingStop = React.useCallback(
    (chatId: string) => ws.typingStop(chatId),
    [ws],
  );

  return (
    <WsContext.Provider
      value={{
        ws,
        lastEvent,

        onlineUserIds,
        isOnline,

        joinChat,
        leaveChat,
        ackDelivered,
        ackRead,
        typingStart,
        typingStop,
      }}
    >
      {children}
    </WsContext.Provider>
  );
};

export const useWs = () => {
  const ctx = useContext(WsContext);
  if (!ctx) throw new Error("useWs must be used inside WsProvider");
  return ctx;
};
