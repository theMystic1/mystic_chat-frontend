"use client";

import React, { createContext, useContext } from "react";
import type { ServerEvent } from "@/utils/ws/wss";
import { WsClient } from "@/utils/ws/wss";

type Ctx = {
  ws: WsClient | null;
  lastEvent: ServerEvent | null;

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

  // create client once
  const ws = React.useMemo(() => {
    const url = process.env.NEXT_PUBLIC_WS_URL!;
    return new WsClient(url);
  }, []);

  React.useEffect(() => {
    const off = ws.on((evt) => setLastEvent(evt));
    ws.connect(token);

    return () => {
      off();
      ws.disconnect();
    };
  }, [ws, token]);

  // ✅ IMPORTANT: call methods on `ws`, not on the wrapper name
  const joinChat = React.useCallback(
    (chatId: string) => ws.joinChat(chatId),
    [ws],
  );

  const leaveChat = React.useCallback(
    (chatId: string) => ws.leaveChat(chatId),
    [ws],
  );

  // these require you to expose public methods on WsClient (see below)
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
