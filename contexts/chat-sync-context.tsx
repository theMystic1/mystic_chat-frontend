"use client";

import * as React from "react";
import { useWs } from "@/contexts/ws-context";

export type ReceiptStatus = "sent" | "delivered" | "read";

export type ChatListItem = {
  _id: string;
  members: any[];
  unreadCount?: number;

  // server-populated (keep intact, don't overwrite types)
  lastMessageId?: any | null;

  // ✅ client-only preview fields (SOURCE OF TRUTH for sidebar)
  lastMessageMessageId?: string | null;
  lastMessageText?: string;
  lastMessageAt?: string;
  lastMessageSenderId?: string | null;
};

type ChatSyncState = {
  chats: ChatListItem[];
  setChats: React.Dispatch<React.SetStateAction<ChatListItem[]>>;

  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;

  lastReceiptByChatId: Record<
    string,
    { messageId: string; status: ReceiptStatus }
  >;
  typingByChatId: any; // ✅ add
  onlineUserIds: any;
};

const ChatSyncContext = React.createContext<ChatSyncState | null>(null);

function normalizeInitialChats(chats: ChatListItem[]): ChatListItem[] {
  return chats.map((c) => {
    const lm = c.lastMessageId;
    const lastMessageMessageId = lm?._id
      ? String(lm._id)
      : (c.lastMessageMessageId ?? null);
    const lastMessageText =
      typeof lm?.text === "string" ? lm.text : (c.lastMessageText ?? "");
    const lastMessageAt =
      lm?.updatedAt || lm?.createdAt
        ? String(lm.updatedAt || lm.createdAt)
        : (c.lastMessageAt ?? "");

    const lastMessageSenderId = lm?.senderId
      ? String(lm.senderId)
      : (c.lastMessageSenderId ?? null);

    return {
      ...c,
      unreadCount: Number(c.unreadCount ?? 0),
      lastMessageMessageId,
      lastMessageText,
      lastMessageAt,
      lastMessageSenderId,
    };
  });
}

export function ChatSyncProvider({
  initialChats,
  children,
}: {
  initialChats: ChatListItem[];
  children: React.ReactNode;
}) {
  const { ws, lastEvent } = useWs();

  const [chats, setChats] = React.useState<ChatListItem[]>(() =>
    normalizeInitialChats(initialChats),
  );

  const [activeChatId, _setActiveChatId] = React.useState<string | null>(null);
  const [typingByChatId, setTypingByChatId] = React.useState<
    Record<string, string[]>
  >({});
  const [onlineUserIds, setOnlineUserIds] = React.useState<Set<string>>(
    new Set(),
  );

  const [lastReceiptByChatId, setLastReceiptByChatId] = React.useState<
    Record<string, { messageId: string; status: ReceiptStatus }>
  >({});

  const meIdRef = React.useRef<string | null>(null);

  const setActiveChatId = React.useCallback((id: string | null) => {
    _setActiveChatId(id);
  }, []);

  React.useEffect(() => {
    setChats(normalizeInitialChats(initialChats));
  }, [initialChats]);

  React.useEffect(() => {
    if (!ws) return;

    const st = ws.getState();
    if (!st.authed) return;

    for (const c of chats) ws.joinChat(String(c._id));

    return () => {
      for (const c of chats) ws.leaveChat(String(c._id));
    };
  }, [ws, chats]);

  React.useEffect(() => {
    if (!ws || !lastEvent) return;
    if (lastEvent.type === "auth_ok") {
      meIdRef.current = lastEvent.data.userId;

      // once authed, ensure we are subscribed to all chats
      for (const c of chats) ws.joinChat(String(c._id));
    }
  }, [ws, lastEvent, chats]);
  React.useEffect(() => {
    if (!ws || !lastEvent) return;

    // ✅ chat created
    if (lastEvent.type === "chat_created") {
      const c = lastEvent.data;

      setChats((prev) => {
        const exists = prev.some(
          (x) => String(x._id) === String(c.id ?? c._id),
        );
        if (exists) return prev;

        const newChat: ChatListItem = {
          _id: String(c.id ?? c._id),
          members: c.members,
          unreadCount: 0,

          lastMessageId: null,
          lastMessageMessageId: null,
          lastMessageText: "",
          lastMessageAt: c.createdAt ?? new Date().toISOString(),
          lastMessageSenderId: null,
        };

        return [newChat, ...prev];
      });

      return;
    }

    // ✅ message sent
    if (lastEvent.type === "message_sent") {
      const m = lastEvent.data;

      const meId = meIdRef.current ?? ws.getState().userId;
      const fromMe = meId ? String(m.senderId) === String(meId) : false;

      // delivered when online
      if (meId && !fromMe) {
        ws.ackDelivered(m.chatId, m.id);

        const isActive =
          activeChatId && String(activeChatId) === String(m.chatId);
        const visible =
          typeof document === "undefined" ||
          document.visibilityState === "visible";

        if (isActive && visible) ws.ackRead(m.chatId, m.id);
      }

      setChats((prev) => {
        const idx = prev.findIndex((c) => String(c._id) === String(m.chatId));
        if (idx < 0) return prev;

        const copy = [...prev];
        const cur = copy[idx];

        const isActive =
          activeChatId && String(activeChatId) === String(m.chatId);

        const nextUnread =
          fromMe || isActive
            ? Number(cur.unreadCount ?? 0)
            : Number(cur.unreadCount ?? 0) + 1;

        const updated: ChatListItem = {
          ...cur,
          unreadCount: nextUnread,
          lastMessageMessageId: String(m.id),
          lastMessageText: m.text ?? "",
          lastMessageAt: m.createdAt ?? new Date().toISOString(),
          lastMessageSenderId: String(m.senderId),
        };

        copy.splice(idx, 1);
        copy.unshift(updated);
        return copy;
      });

      if (fromMe) {
        setLastReceiptByChatId((prev) => ({
          ...prev,
          [m.chatId]: { messageId: String(m.id), status: "sent" },
        }));
      }

      return;
    }

    // ✅ delivered
    if (lastEvent.type === "message_delivered") {
      const { chatId, messageId } = lastEvent.data;

      setLastReceiptByChatId((prev) => {
        const cur = prev[chatId];
        if (!cur) return prev;
        if (String(cur.messageId) !== String(messageId)) return prev;
        if (cur.status === "read") return prev;
        return {
          ...prev,
          [chatId]: { messageId: String(messageId), status: "delivered" },
        };
      });

      return;
    }

    // ✅ read
    if (lastEvent.type === "message_read") {
      const { chatId, messageId } = lastEvent.data;

      setLastReceiptByChatId((prev) => {
        const cur = prev[chatId];
        if (!cur) return prev;
        if (String(cur.messageId) !== String(messageId)) return prev;
        return {
          ...prev,
          [chatId]: { messageId: String(messageId), status: "read" },
        };
      });

      return;
    }

    // ✅ bulk delivered
    if (lastEvent.type === "messages_delivered") {
      const { chatId, messageIds } = lastEvent.data as any;
      const ids = Array.isArray(messageIds)
        ? messageIds.map(String)
        : [String(messageIds)];

      setLastReceiptByChatId((prev) => {
        const cur = prev[chatId];
        if (!cur) return prev;
        if (!ids.includes(String(cur.messageId))) return prev;
        if (cur.status === "read") return prev;
        return {
          ...prev,
          [chatId]: { messageId: cur.messageId, status: "delivered" },
        };
      });

      return;
    }

    // ✅ bulk read
    if (lastEvent.type === "messages_read") {
      const { chatId, messageIds } = lastEvent.data as any;
      const ids = Array.isArray(messageIds)
        ? messageIds.map(String)
        : [String(messageIds)];

      setLastReceiptByChatId((prev) => {
        const cur = prev[chatId];
        if (!cur) return prev;
        if (!ids.includes(String(cur.messageId))) return prev;
        return {
          ...prev,
          [chatId]: { messageId: cur.messageId, status: "read" },
        };
      });

      return;
    }
  }, [ws, lastEvent, activeChatId, setChats]);

  React.useEffect(() => {
    if (!ws || !activeChatId) return;

    ws.ackDeliveredAll(activeChatId);
    ws.ackReadAll(activeChatId);

    setChats((prev) =>
      prev.map((c) =>
        String(c._id) === String(activeChatId) ? { ...c, unreadCount: 0 } : c,
      ),
    );
  }, [ws, activeChatId]);

  React.useEffect(() => {
    if (!ws || !lastEvent) return;

    if (lastEvent.type === "typing_start") {
      const { chatId, userId } = lastEvent.data;

      setTypingByChatId((prev) => {
        const cur = new Set(prev[chatId] ?? []);
        cur.add(String(userId));
        return { ...prev, [chatId]: Array.from(cur) };
      });

      return;
    }

    if (lastEvent.type === "typing_stop") {
      const { chatId, userId } = lastEvent.data;

      setTypingByChatId((prev) => {
        const cur = new Set(prev[chatId] ?? []);
        cur.delete(String(userId));
        const next = { ...prev };
        next[chatId] = Array.from(cur);
        if (next[chatId].length === 0) delete next[chatId];
        return next;
      });

      return;
    }
  }, [ws, lastEvent]);

  React.useEffect(() => {
    if (!lastEvent) return;

    if (lastEvent.type === "presence_online") {
      setOnlineUserIds((prev) =>
        new Set(prev).add(String(lastEvent.data.userId)),
      );
      return;
    }

    if (lastEvent.type === "presence_offline") {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        next.delete(String(lastEvent.data.userId));
        return next;
      });
      return;
    }
  }, [lastEvent]);

  const value: ChatSyncState = {
    chats,
    setChats,
    activeChatId,
    setActiveChatId,
    lastReceiptByChatId,
    typingByChatId, // ✅ add
    onlineUserIds,
  };

  return (
    <ChatSyncContext.Provider value={value}>
      {children}
    </ChatSyncContext.Provider>
  );
}

export function useChatSync() {
  const ctx = React.useContext(ChatSyncContext);
  if (!ctx) throw new Error("useChatSync must be used within ChatSyncProvider");
  return ctx;
}
